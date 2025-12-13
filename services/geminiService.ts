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
    question: "Quantos segundos tem um minuto?",
    answer: 60,
    unit: "segundos",
    category: "Conhecimentos Gerais",
    context: "Um minuto é composto por 60 segundos."
  },
  {
    question: "Em que ano foi proclamada a Independência do Brasil?",
    answer: 1822,
    unit: "ano",
    category: "História do Brasil",
    context: "A independência foi proclamada por Dom Pedro I em 7 de setembro de 1822."
  },
  {
    question: "Quantos planetas existem no Sistema Solar?",
    answer: 8,
    unit: "planetas",
    category: "Ciência",
    context: "Plutão é classificado como planeta anão."
  },
  {
    question: "Quantos títulos mundiais de Fórmula 1 o Brasil possui?",
    answer: 8,
    unit: "títulos",
    category: "Esportes Gerais",
    context: "Fittipaldi, Piquet e Senna somam 8 títulos."
  },
  {
    question: "Quantos estados tem o Brasil?",
    answer: 26,
    unit: "estados",
    category: "Geografia do Brasil",
    context: "O Brasil possui 26 estados e 1 Distrito Federal."
  },
  {
    question: "Quantos anos durou a ditadura militar no Brasil?",
    answer: 21,
    unit: "anos",
    category: "História do Brasil",
    context: "O regime militar ocorreu entre 1964 e 1985."
  },
  {
    question: "Quantos títulos olímpicos o Brasil conquistou no futebol masculino?",
    answer: 2,
    unit: "ouros",
    category: "Futebol Brasileiro",
    context: "O Brasil venceu os Jogos Olímpicos de 2016 e 2021."
  },
  {
    question: "Em que ano Brasília foi inaugurada?",
    answer: 1960,
    unit: "ano",
    category: "História do Brasil",
    context: "Brasília foi inaugurada em 21 de abril de 1960."
  },
  {
    question: "Quantos minutos tem uma hora?",
    answer: 60,
    unit: "minutos",
    category: "Conhecimentos Gerais",
    context: "Cada hora é composta por 60 minutos."
  },
  {
    question: "Quantos títulos de Copa América o Brasil possui?",
    answer: 9,
    unit: "títulos",
    category: "Futebol Brasileiro",
    context: "O Brasil venceu sua última Copa América em 2019."
  },
  {
    question: "Qual a altura do Cristo Redentor (sem o pedestal) em metros?",
    answer: 30,
    unit: "metros",
    category: "Geografia do Brasil",
    context: "Com o pedestal, o monumento chega a 38 metros."
  },
  {
    question: "Em que ano o Brasil ganhou o pentacampeonato mundial de futebol?",
    answer: 2002,
    unit: "ano",
    category: "Futebol Brasileiro",
    context: "A Copa de 2002 foi realizada na Coreia do Sul e no Japão."
  },
  {
    question: "Quantos biomas oficiais existem no Brasil?",
    answer: 6,
    unit: "biomas",
    category: "Geografia do Brasil",
    context: "Amazônia, Cerrado, Caatinga, Mata Atlântica, Pampa e Pantanal."
  },
  {
    question: "Quantos gols Pelé marcou oficialmente pela Seleção Brasileira?",
    answer: 77,
    unit: "gols",
    category: "Futebol Brasileiro",
    context: "Pelé é um dos maiores artilheiros da Seleção."
  },
  {
    question: "Em que ano ocorreu a abolição da escravatura no Brasil?",
    answer: 1888,
    unit: "ano",
    category: "História do Brasil",
    context: "A Lei Áurea foi assinada em 13 de maio de 1888."
  },
  {
    question: "Quantos municípios o Brasil possui aproximadamente?",
    answer: 5570,
    unit: "municípios",
    category: "Geografia do Brasil",
    context: "O Brasil possui mais de 5.500 municípios."
  },
  {
    question: "Quantos quilômetros de litoral o Brasil possui?",
    answer: 7491,
    unit: "km",
    category: "Geografia do Brasil",
    context: "O litoral brasileiro é um dos maiores do mundo."
  },
  {
    question: "Quantos títulos brasileiros o Palmeiras possui (até 2023)?",
    answer: 12,
    unit: "títulos",
    category: "Futebol Brasileiro",
    context: "O Palmeiras é o maior campeão nacional."
  },
  {
    question: "Em que ano foi criado o IBGE?",
    answer: 1936,
    unit: "ano",
    category: "História do Brasil",
    context: "O IBGE é responsável pelos dados estatísticos do país."
  },
  {
    question: "Quantos presidentes o Brasil já teve até 2024?",
    answer: 39,
    unit: "presidentes",
    category: "História do Brasil",
    context: "Inclui presidentes eleitos, interinos e militares."
  },
  {
    question: "Quantas copas do mundo o Brasil sediou?",
    answer: 2,
    unit: "copas",
    category: "Futebol Brasileiro",
    context: "As Copas foram realizadas em 1950 e 2014."
  },
  {
    question: "Quantos quilômetros quadrados tem o território brasileiro aproximadamente?",
    answer: 8516000,
    unit: "km²",
    category: "Geografia do Brasil",
    context: "O Brasil é o quinto maior país do mundo."
  },
  {
    question: "Em que ano foi fundada a cidade de São Paulo?",
    answer: 1554,
    unit: "ano",
    category: "História do Brasil",
    context: "São Paulo foi fundada pelos jesuítas."
  },
  {
    question: "Quantos títulos mundiais o Corinthians possui?",
    answer: 2,
    unit: "títulos",
    category: "Futebol Brasileiro",
    context: "O Corinthians venceu os mundiais de 2000 e 2012."
  },
  {
    question: "Quantas regiões oficiais o Brasil possui?",
    answer: 5,
    unit: "regiões",
    category: "Geografia do Brasil",
    context: "Norte, Nordeste, Centro-Oeste, Sudeste e Sul."
  },
  {
    question: "Quantos feriados nacionais oficiais o Brasil possui?",
    answer: 9,
    unit: "feriados",
    category: "Cultura Brasileira",
    context: "Os feriados nacionais são definidos por lei federal."
  },
  {
    question: "Em que ano o WhatsApp foi lançado?",
    answer: 2009,
    unit: "ano",
    category: "Tecnologia",
    context: "O WhatsApp foi criado por ex-funcionários do Yahoo."
  },
  {
    question: "Quantos títulos de Roland Garros Gustavo Kuerten venceu?",
    answer: 3,
    unit: "títulos",
    category: "Esportes Gerais",
    context: "Guga venceu em 1997, 2000 e 2001."
  },
  {
    question: "Quantos títulos brasileiros o Flamengo possui (até 2023)?",
    answer: 8,
    unit: "títulos",
    category: "Futebol Brasileiro",
    context: "O Flamengo é um dos clubes mais vitoriosos do Brasil."
  },
  {
    question: "Quantos anos tem um século?",
    answer: 100,
    unit: "anos",
    category: "Conhecimentos Gerais",
    context: "Um século corresponde a 100 anos."
  },
  {
    question: "Qual a extensão aproximada do Rio Amazonas em quilômetros?",
    answer: 6992,
    unit: "km",
    category: "Geografia do Brasil",
    context: "É considerado um dos rios mais longos do mundo."
  },
  {
    question: "Quantos títulos de NBA LeBron James conquistou até 2023?",
    answer: 4,
    unit: "títulos",
    category: "Esportes Gerais",
    context: "LeBron venceu títulos por três franquias diferentes."
  },
  {
    question: "Quantos idiomas indígenas existem no Brasil aproximadamente?",
    answer: 180,
    unit: "idiomas",
    category: "Cultura Brasileira",
    context: "O Brasil possui grande diversidade linguística indígena."
  },
  {
    question: "Em que ano o Real foi lançado como moeda oficial do Brasil?",
    answer: 1994,
    unit: "ano",
    category: "Economia Brasileira",
    context: "O Plano Real estabilizou a economia."
  },
  {
    question: "Quantos aeroportos internacionais o Brasil possui aproximadamente?",
    answer: 34,
    unit: "aeroportos",
    category: "Infraestrutura Brasileira",
    context: "O país possui dezenas de aeroportos internacionais."
  },
  {
    question: "Quantos títulos de Libertadores clubes brasileiros possuem (até 2023)?",
    answer: 23,
    unit: "títulos",
    category: "Futebol Brasileiro",
    context: "O Brasil domina a Libertadores."
  },
  {
    question: "Em que ano ocorreu o primeiro título mundial do Brasil no futebol?",
    answer: 1958,
    unit: "ano",
    category: "Futebol Brasileiro",
    context: "O título foi conquistado na Suécia."
  },
  {
    question: "Quantos quilômetros tem a Rodovia Transamazônica aproximadamente?",
    answer: 4000,
    unit: "km",
    category: "Infraestrutura Brasileira",
    context: "A rodovia liga o Nordeste ao Norte do país."
  },
  {
    question: "Em que ano o Brasil sediou as Olimpíadas?",
    answer: 2016,
    unit: "ano",
    category: "Esportes Gerais",
    context: "Os Jogos Olímpicos aconteceram no Rio de Janeiro."
  },
  {
    question: "Quantas letras tem o alfabeto português?",
    answer: 26,
    unit: "letras",
    category: "Língua Portuguesa",
    context: "O alfabeto oficial possui 26 letras."
  },
  {
    question: "Quantos títulos mundiais de clubes o São Paulo possui?",
    answer: 3,
    unit: "títulos",
    category: "Futebol Brasileiro",
    context: "O São Paulo venceu em 1992, 1993 e 2005."
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
