import { GoogleGenAI, Type } from "@google/genai";
import { TriviaQuestion } from "../types";
import { getQuestionHistory, getLastCategory, setLastCategory, popCachedQuestion, cacheQuestions } from "./storageService";

const apiKey = process.env.API_KEY;
const BATCH_SIZE = 5; // How many questions to fetch at once

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
  // --- ORIGINAIS ---
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
  
  // --- EXPANSÃO 1 ---
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
  { question: "Quantos anéis tem a bandeira olímpica?", answer: 5, unit: "anéis", category: "Esportes Gerais", context: "Os cinco anéis entrelaçados representam a união dos cinco continentes habitados." },
  
  // --- EXPANSÃO 2 (NOVAS PERGUNTAS PARA EVITAR REPETIÇÃO) ---
  { question: "Quantos dentes tem um ser humano adulto (com sisos)?", answer: 32, unit: "dentes", category: "Ciência & Tecnologia", context: "Um adulto completo tem 32 dentes, incluindo os 4 sisos." },
  { question: "Quantas cores tem o arco-íris (tradicionalmente)?", answer: 7, unit: "cores", category: "Mundo & Curiosidades Gerais", context: "Vermelho, laranja, amarelo, verde, azul, anil e violeta." },
  { question: "Em que ano o Brasil sediou as Olimpíadas?", answer: 2016, unit: "ano", category: "Esportes Gerais", context: "Os Jogos Olímpicos de Verão de 2016 foram realizados no Rio de Janeiro." },
  { question: "Quantos minutos tem um dia inteiro?", answer: 1440, unit: "minutos", category: "Mundo & Curiosidades Gerais", context: "24 horas vezes 60 minutos = 1.440 minutos." },
  { question: "Qual a idade mínima para ser Presidente do Brasil?", answer: 35, unit: "anos", category: "Economia & Sociedade Brasileira", context: "A Constituição exige que o candidato tenha no mínimo 35 anos." },
  { question: "Quantas patas tem uma aranha?", answer: 8, unit: "patas", category: "Fauna & Flora Brasileira", context: "Aracnídeos têm 8 patas, diferentemente dos insetos, que têm 6." },
  { question: "Em que ano foi descoberta a América por Colombo?", answer: 1492, unit: "ano", category: "Mundo & Curiosidades Gerais", context: "Cristóvão Colombo chegou às Américas em 12 de outubro de 1492." },
  { question: "Quantos jogadores tem um time de futebol de campo?", answer: 11, unit: "jogadores", category: "Futebol Brasileiro", context: "São 11 jogadores titulares em cada equipe." },
  { question: "Qual a temperatura média normal do corpo humano (em Celsius)?", answer: 37, unit: "°C", category: "Ciência & Tecnologia", context: "A temperatura corporal normal varia entre 36,5°C e 37,2°C, mas 37°C é a referência comum." },
  { question: "Quantas cordas tem um violão padrão?", answer: 6, unit: "cordas", category: "Música & TV Brasileira", context: "O violão clássico possui 6 cordas (Mi, Lá, Ré, Sol, Si, Mi)." },
  { question: "Em que ano começou a Primeira Guerra Mundial?", answer: 1914, unit: "ano", category: "Mundo & Curiosidades Gerais", context: "O conflito global começou em 1914 e durou até 1918." },
  { question: "Quantos lados tem um hexágono?", answer: 6, unit: "lados", category: "Mundo & Curiosidades Gerais", context: "Hexa vem do grego 'seis'." },
  { question: "Qual a carga tributária do Brasil aproximada em porcentagem do PIB (média recente)?", answer: 33, unit: "%", category: "Economia & Sociedade Brasileira", context: "A carga tributária brasileira gira em torno de 33% a 34% do PIB." },
  { question: "Quantos biomas principais o Brasil possui?", answer: 6, unit: "biomas", category: "Geografia do Brasil", context: "Amazônia, Cerrado, Mata Atlântica, Caatinga, Pampa e Pantanal." },
  { question: "Em que ano a TV chegou ao Brasil?", answer: 1950, unit: "ano", category: "Música & TV Brasileira", context: "A TV Tupi foi inaugurada em 18 de setembro de 1950 por Assis Chateaubriand." },
  { question: "Quantos ml tem uma lata de refrigerante padrão no Brasil?", answer: 350, unit: "ml", category: "Culinária Brasileira", context: "A lata padrão de alumínio contém 350ml." },
  { question: "Quantos ministros compõem o STF?", answer: 11, unit: "ministros", category: "Economia & Sociedade Brasileira", context: "O Supremo Tribunal Federal é composto por 11 ministros." },
  { question: "Qual a velocidade da luz (arredondada em mil km/s)?", answer: 300, unit: "mil km/s", category: "Ciência & Tecnologia", context: "A luz viaja a aproximadamente 299.792 km/s no vácuo." },
  { question: "Quantos fusos horários o Brasil tem?", answer: 4, unit: "fusos", category: "Geografia do Brasil", context: "O Brasil possui 4 fusos horários oficiais devido à sua grande extensão leste-oeste." },
  { question: "Em que ano o Pix foi lançado?", answer: 2020, unit: "ano", category: "Economia & Sociedade Brasileira", context: "O sistema de pagamentos instantâneos do Banco Central começou a operar em novembro de 2020." },
  { question: "Quantos corações possui um polvo?", answer: 3, unit: "corações", category: "Mundo & Curiosidades Gerais", context: "Os polvos têm três corações: dois bombeiam sangue pelas brânquias e um (o sistêmico) bombeia para o resto do corpo." }
];

// Helper to normalize strings for comparison (removes accents and case)
const normalize = (str: string) => {
    return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
};

const getFallbackQuestion = (): TriviaQuestion => {
    const history = getQuestionHistory();
    // Filter available questions using normalized comparison
    const available = FALLBACK_QUESTIONS.filter(q => 
        !history.some(h => normalize(h) === normalize(q.question))
    );
    
    // If we have available questions, pick one randomly from the available pool
    if (available.length > 0) {
        const index = Math.floor(Math.random() * available.length);
        return available[index];
    }

    // If exhausted (rare given the size now), pick random from total pool
    const index = Math.floor(Math.random() * FALLBACK_QUESTIONS.length);
    return FALLBACK_QUESTIONS[index];
}

// Function to fetch a batch of questions to populate cache
const fetchBatchQuestions = async (): Promise<TriviaQuestion[]> => {
    if (!apiKey) return [];

    try {
        const ai = new GoogleGenAI({ apiKey });
        const history = getQuestionHistory();
        const lastCategory = getLastCategory();

        // 1. Category Rotation Strategy
        // Filter out the last category to force variety
        const availableCategories = CATEGORIES.filter(c => c !== lastCategory);
        // Shuffle and pick 3 distinct categories for this batch
        const selectedCategories = availableCategories.sort(() => 0.5 - Math.random()).slice(0, 3);

        const recentHistory = history.slice(-50).join("; ");

        const promptText = `
            Você é um especialista em trivia para o público BRASILEIRO.
            Gere UMA LISTA com ${BATCH_SIZE} perguntas de trivia.
            
            IMPORTANTE: Use APENAS estas categorias para este lote: [${selectedCategories.join(', ')}].
            Distribua as perguntas entre essas categorias.
            
            Regras para CADA pergunta:
            1. A resposta deve ser um NÚMERO INTEIRO (sem decimais).
            2. Pergunta deve ser clara e específica.
            3. PROIBIDO repetir estas perguntas recentes: [${recentHistory}]
            4. Evite perguntas muito parecidas com as do histórico.
            
            Retorne APENAS um Array JSON puro.
        `;

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
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

        if (response.text) {
            const data = JSON.parse(response.text) as TriviaQuestion[];
            
            // Client-side Filter: Robust normalized check
            let uniqueData = data.filter(newQ => {
                return !history.some(oldQ => normalize(oldQ) === normalize(newQ.question));
            });

            // Shuffle the batch so the categories aren't grouped together (e.g. AAABBB)
            uniqueData = uniqueData.sort(() => Math.random() - 0.5);

            return uniqueData;
        }
        return [];
    } catch (e: any) {
        // Handle Quota/Errors
        if (e?.message?.includes('429') || e?.status === 429 || e?.error?.code === 429) {
            console.warn("Gemini API Quota Exceeded. Using extended offline database.");
        } else {
            console.error("Batch fetch error:", e);
        }
        return [];
    }
}

export const fetchDailyTrivia = async (retryCount = 0): Promise<TriviaQuestion> => {
  // 1. Check Local Cache First
  const cachedQuestion = popCachedQuestion();
  if (cachedQuestion) {
    console.log("Using cached question from category:", cachedQuestion.category);
    // Update last category to ensure next fetch rotates correctly
    setLastCategory(cachedQuestion.category);
    return cachedQuestion;
  }

  // 2. If Cache is empty, Fetch Batch from API
  if (apiKey && retryCount <= 1) { 
      console.log("Fetching new batch from API...");
      const batch = await fetchBatchQuestions();
      
      if (batch.length > 0) {
          const first = batch[0];
          
          if (batch.length > 1) {
              cacheQuestions(batch.slice(1));
          }

          setLastCategory(first.category);
          return first;
      } else {
         // Retry once if filter removed all questions
         if (retryCount === 0) {
             console.log("Batch empty after filter, retrying...");
             return fetchDailyTrivia(retryCount + 1);
         }
      }
  }

  // 3. Fallback (Offline Mode)
  console.log("Using Offline Fallback");
  const fallback = getFallbackQuestion();
  setLastCategory(fallback.category);
  return fallback;
};