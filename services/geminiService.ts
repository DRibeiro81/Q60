
import { GoogleGenAI, Type } from "@google/genai";
import { TriviaQuestion } from "../types";
import { getQuestionHistory, getLastCategory, setLastCategory, popCachedQuestion, cacheQuestions } from "./storageService";

// BATCH_SIZE controls how many questions to fetch at once to minimize API calls
const BATCH_SIZE = 5; 

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

// Fallback pool expanded SIGNIFICANTLY to prevent repetition
const FALLBACK_QUESTIONS: TriviaQuestion[] = [
  { question: "Em que ano o Brasil ganhou o pentacampeonato mundial de futebol?", answer: 2002, unit: "ano", category: "Futebol Brasileiro", context: "O Brasil conquistou seu quinto título na Copa do Mundo de 2002, realizada na Coreia do Sul e no Japão." },
  { question: "Qual a extensão aproximada do Rio Amazonas em quilômetros?", answer: 6992, unit: "km", category: "Geografia do Brasil", context: "O Rio Amazonas é considerado por muitos cientistas o rio mais longo do mundo, superando o Nilo." },
  { question: "Quantos estados tem o Brasil?", answer: 26, unit: "estados", category: "Geografia do Brasil", context: "O Brasil possui 26 estados e 1 Distrito Federal." },
  { question: "Em que ano foi proclamada a Independência do Brasil?", answer: 1822, unit: "ano", category: "História do Brasil", context: "A independência foi proclamada por D. Pedro I às margens do riacho Ipiranga em 7 de setembro de 1822." },
  { question: "Qual a altura do Cristo Redentor (sem o pedestal) em metros?", answer: 30, unit: "metros", category: "Geografia do Brasil", context: "A estátua tem 30 metros de altura, e o pedestal adiciona mais 8 metros, totalizando 38 metros." },
  { question: "Quantos títulos mundiais de Fórmula 1 o Brasil possui?", answer: 8, unit: "títulos", category: "Esportes Gerais", context: "Emerson Fittipaldi (2), Nelson Piquet (3) e Ayrton Senna (3) somam 8 títulos para o Brasil." },
  { question: "Em que ano Brasília foi inaugurada?", answer: 1960, unit: "ano", category: "História do Brasil", context: "Brasília foi inaugurada em 21 de abril de 1960, pelo presidente Juscelino Kubitschek." },
  { question: "Qual a população estimada do Brasil em milhões (censo 2022)?", answer: 203, unit: "milhões", category: "Economia & Sociedade Brasileira", context: "O Censo de 2022 do IBGE registrou 203.062.512 habitantes no Brasil." },
  { question: "Quantos municípios o Brasil possui aproximadamente?", answer: 5570, unit: "municípios", category: "Geografia do Brasil", context: "O Brasil possui 5.570 municípios distribuídos em seus 26 estados e Distrito Federal." },
  { question: "Quantos gols Pelé marcou oficialmente pela Seleção Brasileira?", answer: 77, unit: "gols", category: "Futebol Brasileiro", context: "Pelé marcou 77 gols em jogos oficiais pela Seleção, um recorde igualado recentemente por Neymar." },
  { question: "Em que ano ocorreu a abolição da escravatura no Brasil?", answer: 1888, unit: "ano", category: "História do Brasil", context: "A Lei Áurea foi assinada pela Princesa Isabel em 13 de maio de 1888." },
  { question: "Quantas copas do mundo o Brasil sediou?", answer: 2, unit: "copas", category: "Futebol Brasileiro", context: "O Brasil sediou as Copas do Mundo de 1950 e 2014." },
  { question: "Quantos jogadores de vôlei iniciam uma partida em quadra (por time)?", answer: 6, unit: "jogadores", category: "Esportes Gerais", context: "Cada equipe de vôlei joga com 6 atletas em quadra e até 6 reservas." },
  { question: "Em que ano o Plano Real foi lançado?", answer: 1994, unit: "ano", category: "Economia & Sociedade Brasileira", context: "O Plano Real estabilizou a economia brasileira e a nova moeda entrou em circulação em 1º de julho de 1994." },
  { question: "Quantas estrelas existem na bandeira do Brasil?", answer: 27, unit: "estrelas", category: "Geografia do Brasil", context: "As estrelas representam os 26 estados e o Distrito Federal." },
  { question: "Qual a temperatura de ebulição da água ao nível do mar (em Celsius)?", answer: 100, unit: "°C", category: "Ciência & Tecnologia", context: "Ao nível do mar, a água ferve a exatos 100 graus Celsius." },
  { question: "Quantos ossos tem o corpo humano adulto?", answer: 206, unit: "ossos", category: "Ciência & Tecnologia", context: "Um bebê nasce com cerca de 270 ossos, mas alguns se fundem durante o crescimento, resultando em 206 na fase adulta." },
  { question: "Em que ano o homem pisou na Lua pela primeira vez?", answer: 1969, unit: "ano", category: "Mundo & Curiosidades Gerais", context: "A missão Apollo 11 levou Neil Armstrong e Buzz Aldrin à Lua em 20 de julho de 1969." },
  { question: "Qual o DDD da cidade de São Paulo?", answer: 11, unit: "DDD", category: "Economia & Sociedade Brasileira", context: "O código 11 abrange a região metropolitana de São Paulo e algumas cidades vizinhas." },
  { question: "Quantos segundos tem uma hora?", answer: 3600, unit: "segundos", category: "Mundo & Curiosidades Gerais", context: "60 segundos vezes 60 minutos resultam em 3.600 segundos." },
  { question: "Em que ano terminou a Ditadura Militar no Brasil?", answer: 1985, unit: "ano", category: "História do Brasil", context: "O regime militar durou 21 anos, terminando com a eleição indireta de Tancredo Neves em 1985." },
  { question: "Quantas teclas tem um piano clássico padrão?", answer: 88, unit: "teclas", category: "Música & TV Brasileira", context: "Um piano padrão possui 52 teclas brancas e 36 teclas pretas." },
  { question: "Qual a velocidade máxima permitida para carros na maioria das rodovias federais (pista dupla)?", answer: 110, unit: "km/h", category: "Economia & Sociedade Brasileira", context: "O limite padrão é 110 km/h, salvo sinalização em contrário." },
  { question: "Quantos dias tem um ano bissexto?", answer: 366, unit: "dias", category: "Mundo & Curiosidades Gerais", context: "O dia extra é adicionado em fevereiro para ajustar o calendário ao movimento da Terra." },
  { question: "Em que ano Ayrton Senna faleceu?", answer: 1994, unit: "ano", category: "Esportes Gerais", context: "O ídolo brasileiro faleceu em 1º de maio de 1994, durante o GP de San Marino." },
  { question: "Quantos anos durou a Guerra dos Farrapos?", answer: 10, unit: "anos", category: "História do Brasil", context: "A Revolução Farroupilha durou de 1835 a 1845 no Rio Grande do Sul." },
  { question: "Qual o número atômico do Oxigênio?", answer: 8, unit: "número", category: "Ciência & Tecnologia", context: "O oxigênio tem 8 prótons em seu núcleo." },
  { question: "Quantos anéis tem a bandeira olímpica?", answer: 5, unit: "anéis", category: "Esportes Gerais", context: "Os cinco anéis entrelaçados representam a união dos cinco continentes habitados." }
];

// Helper to normalize strings for comparison (removes accents and case)
const normalize = (str: string) => {
    return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
};

const getFallbackQuestion = (): TriviaQuestion => {
    const history = getQuestionHistory();
    const available = FALLBACK_QUESTIONS.filter(q => 
        !history.some(h => normalize(h) === normalize(q.question))
    );
    
    if (available.length > 0) {
        const index = Math.floor(Math.random() * available.length);
        return available[index];
    }

    const index = Math.floor(Math.random() * FALLBACK_QUESTIONS.length);
    return FALLBACK_QUESTIONS[index];
}

const fetchBatchQuestions = async (difficulty: string): Promise<TriviaQuestion[]> => {
    // API key must be obtained exclusively from the environment variable process.env.API_KEY.
    if (!process.env.API_KEY) return [];

    try {
        // Create a new GoogleGenAI instance right before making an API call.
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const history = getQuestionHistory();
        const lastCategory = getLastCategory();

        const availableCategories = CATEGORIES.filter(c => c !== lastCategory);
        const selectedCategories = availableCategories.sort(() => 0.5 - Math.random()).slice(0, 3);

        const recentHistory = history.slice(-50).join("; ");

        const promptText = `
            Você é um especialista em trivia para o público BRASILEIRO.
            Gere UMA LISTA com ${BATCH_SIZE} perguntas de trivia.
            
            DIFICULDADE ALVO: ${difficulty}. 
            (Ajuste o quão obscuro ou complexo é o fato baseado nisso).

            IMPORTANTE: Use APENAS estas categorias para este lote: [${selectedCategories.join(', ')}].
            Distribua as perguntas entre essas categorias.
            
            Regras para CADA pergunta:
            1. A resposta deve ser um NÚMERO INTEIRO (sem decimais).
            2. Pergunta deve ser clara e específica.
            3. PROIBIDO repetir estas perguntas recentes: [${recentHistory}]
            4. Evite perguntas muito parecidas com as do histórico.
            
            Retorne APENAS um Array JSON puro.
        `;

        // Use ai.models.generateContent with the model name 'gemini-3-flash-preview' as per guidelines.
        const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: promptText,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            question: { type: Type.STRING },
                            answer: { type: Type.NUMBER },
                            unit: { type: Type.STRING },
                            category: { type: Type.STRING },
                            context: { type: Type.STRING }
                        },
                        required: ["question", "answer", "unit", "category", "context"]
                    }
                }
            }
        });

        // The response.text property directly returns the string output.
        if (response.text) {
            const data = JSON.parse(response.text) as TriviaQuestion[];
            let uniqueData = data.filter(newQ => {
                return !history.some(oldQ => normalize(oldQ) === normalize(newQ.question));
            });
            uniqueData = uniqueData.sort(() => Math.random() - 0.5);
            return uniqueData;
        }
        return [];
    } catch (e: any) {
        console.error("Batch fetch error:", e);
        return [];
    }
}

export const fetchDailyTrivia = async (difficulty: string = "Médio", retryCount = 0): Promise<TriviaQuestion> => {
  const cachedQuestion = popCachedQuestion();
  if (cachedQuestion) {
    setLastCategory(cachedQuestion.category);
    return cachedQuestion;
  }

  // Check if API_KEY is present before attempting remote fetch
  if (process.env.API_KEY && retryCount <= 1) { 
      const batch = await fetchBatchQuestions(difficulty);
      if (batch.length > 0) {
          const first = batch[0];
          if (batch.length > 1) {
              cacheQuestions(batch.slice(1));
          }
          setLastCategory(first.category);
          return first;
      } else {
         if (retryCount === 0) {
             return fetchDailyTrivia(difficulty, retryCount + 1);
         }
      }
  }

  const fallback = getFallbackQuestion();
  setLastCategory(fallback.category);
  return fallback;
};
