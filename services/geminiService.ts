import { GoogleGenAI, Type } from "@google/genai";
import { TriviaQuestion } from "../types";
import { getQuestionHistory, getLastCategory, setLastCategory } from "./storageService";

const apiKey = process.env.API_KEY;

// Categories tailored for Brazilian audience
const CATEGORIES = [
  "Geografia do Brasil",
  "História do Brasil",
  "Futebol Brasileiro",
  "Música & TV Brasileira",
  "Economia & Sociedade Brasileira",
  "Mundo & Curiosidades Gerais",
  "Ciência & Tecnologia",
  "Esportes Gerais",
  "Culinária Brasileira",
  "Fauna & Flora Brasileira"
];

// Fallback pool for when API quota is exhausted
const FALLBACK_QUESTIONS: TriviaQuestion[] = [
  {
    question: "Em que ano o Brasil ganhou o pentacampeonato mundial de futebol?",
    answer: 2002,
    unit: "ano",
    category: "Futebol Brasileiro",
    context: "O Brasil conquistou seu quinto título na Copa do Mundo de 2002, realizada na Coreia do Sul e no Japão."
  },
  {
    question: "Qual a extensão aproximada do Rio Amazonas em quilômetros?",
    answer: 6992,
    unit: "km",
    category: "Geografia do Brasil",
    context: "O Rio Amazonas é considerado por muitos cientistas o rio mais longo do mundo, superando o Nilo."
  },
  {
    question: "Quantos estados tem o Brasil?",
    answer: 26,
    unit: "estados",
    category: "Geografia do Brasil",
    context: "O Brasil possui 26 estados e 1 Distrito Federal."
  },
  {
    question: "Em que ano foi proclamada a Independência do Brasil?",
    answer: 1822,
    unit: "ano",
    category: "História do Brasil",
    context: "A independência foi proclamada por D. Pedro I às margens do riacho Ipiranga em 7 de setembro de 1822."
  },
  {
    question: "Qual a altura do Cristo Redentor (sem o pedestal) em metros?",
    answer: 30,
    unit: "metros",
    category: "Geografia do Brasil",
    context: "A estátua tem 30 metros de altura, e o pedestal adiciona mais 8 metros, totalizando 38 metros."
  },
   {
    question: "Quantos títulos mundiais de Fórmula 1 o Brasil possui?",
    answer: 8,
    unit: "títulos",
    category: "Esportes Gerais",
    context: "Emerson Fittipaldi (2), Nelson Piquet (3) e Ayrton Senna (3) somam 8 títulos para o Brasil."
  },
  {
    question: "Em que ano Brasília foi inaugurada?",
    answer: 1960,
    unit: "ano",
    category: "História do Brasil",
    context: "Brasília foi inaugurada em 21 de abril de 1960, pelo presidente Juscelino Kubitschek."
  },
  {
    question: "Qual a população estimada do Brasil em milhões (censo 2022)?",
    answer: 203,
    unit: "milhões",
    category: "Economia & Sociedade Brasileira",
    context: "O Censo de 2022 do IBGE registrou 203.062.512 habitantes no Brasil."
  },
  {
     question: "Quantos municípios o Brasil possui aproximadamente?",
     answer: 5570,
     unit: "municípios",
     category: "Geografia do Brasil",
     context: "O Brasil possui 5.570 municípios distribuídos em seus 26 estados e Distrito Federal."
  },
  {
    question: "Quantos gols Pelé marcou oficialmente pela Seleção Brasileira?",
    answer: 77,
    unit: "gols",
    category: "Futebol Brasileiro",
    context: "Pelé marcou 77 gols em jogos oficiais pela Seleção, um recorde igualado recentemente por Neymar."
  },
  {
    question: "Em que ano ocorreu a abolição da escravatura no Brasil?",
    answer: 1888,
    unit: "ano",
    category: "História do Brasil",
    context: "A Lei Áurea foi assinada pela Princesa Isabel em 13 de maio de 1888."
  },
  {
    question: "Quantas copas do mundo o Brasil sediou?",
    answer: 2,
    unit: "copas",
    category: "Futebol Brasileiro",
    context: "O Brasil sediou as Copas do Mundo de 1950 e 2014."
  }
];

const getRandomCategory = (): string => {
  const lastCategory = getLastCategory();
  // Filter out the last category to ensure rotation
  const availableCategories = CATEGORIES.filter(c => c !== lastCategory);
  
  if (availableCategories.length === 0) return CATEGORIES[0]; // Should not happen given list size

  const randomIndex = Math.floor(Math.random() * availableCategories.length);
  return availableCategories[randomIndex];
};

const getFallbackQuestion = (): TriviaQuestion => {
    // Select a random question from the fallback pool
    const index = Math.floor(Math.random() * FALLBACK_QUESTIONS.length);
    return FALLBACK_QUESTIONS[index];
}

export const fetchDailyTrivia = async (retryCount = 0): Promise<TriviaQuestion> => {
  if (!apiKey) {
    console.warn("API Key missing, using fallback.");
    return getFallbackQuestion();
  }

  // Prevent infinite recursion loops
  if (retryCount > 3) {
    console.warn("Max retries reached, returning fallback.");
    return getFallbackQuestion();
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const category = getRandomCategory();
    const history = getQuestionHistory();
    
    // We send the last 10 questions to the prompt to help the AI avoid them directly,
    // though we also check strictly on the client side.
    const recentHistory = history.slice(-10).join("; ");

    const promptText = `
      Você é um especialista em trivia e conhecimentos gerais para o público BRASILEIRO.
      Gere uma pergunta de trivia interessante e desafiadora sobre a categoria: "${category}".
      
      Regras:
      1. A resposta deve ser um NÚMERO INTEIRO (ex: ano, quantidade, altura, distância).
      2. A pergunta deve ser relevante para brasileiros.
      3. NÃO repita nenhuma destas perguntas recentes: [${recentHistory}]
      
      Retorne APENAS um JSON.
    `;
    
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: promptText,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            question: { type: Type.STRING, description: "A pergunta de trivia em Português do Brasil." },
            answer: { type: Type.NUMBER, description: "A resposta exata em número inteiro." },
            unit: { type: Type.STRING, description: "A unidade de medida (ex: 'anos', 'metros', 'gols', 'habitantes')." },
            category: { type: Type.STRING, description: "A categoria da pergunta (use a que foi solicitada)." },
            context: { type: Type.STRING, description: "Um fato curioso curto explicando a resposta em Português." }
          },
          required: ["question", "answer", "unit", "category", "context"]
        }
      }
    });

    if (response.text) {
      const data = JSON.parse(response.text) as TriviaQuestion;
      
      // Strict Client-Side Uniqueness Check
      // We normalize strings slightly to catch obvious duplicates (trim, lowercase)
      const isDuplicate = history.some(h => 
        h.toLowerCase().trim() === data.question.toLowerCase().trim()
      );

      if (isDuplicate) {
        console.log("Duplicate question detected, retrying...", data.question);
        return fetchDailyTrivia(retryCount + 1);
      }

      // Save the category so we don't pick it next time
      setLastCategory(category);
      
      // We assume correct structure, but force category to match requested to be safe visually
      return { ...data, category }; 
    }
    
    return getFallbackQuestion();

  } catch (error: any) {
    console.error("Gemini API Error (Using Fallback):", error);
    // Explicit fallback for 429 or other API errors
    return getFallbackQuestion();
  }
};