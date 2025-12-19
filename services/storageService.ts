
import { User, PlayerStats, TriviaQuestion } from '../types';

const USER_KEY = 'quiz60_user';
const STATS_KEY = 'quiz60_stats';
const HISTORY_KEY = 'quiz60_question_history';
const LAST_CAT_KEY = 'quiz60_last_category';
const QUESTION_CACHE_KEY = 'quiz60_questions_cache_v2';
const MAX_HISTORY_SIZE = 100;

export const getUser = (): User | null => {
  const stored = localStorage.getItem(USER_KEY);
  return stored ? JSON.parse(stored) : null;
};

export const saveUser = (user: User) => {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
};

export const logoutUser = () => {
  localStorage.removeItem(USER_KEY);
};

export const getStats = (): PlayerStats => {
  const stored = localStorage.getItem(STATS_KEY);
  return stored ? JSON.parse(stored) : { wins: 0, streak: 0, bestStreak: 0, gamesPlayed: 0, bestRankName: 'Curioso' };
};

export const updateStats = (won: boolean, currentRankName?: string) => {
  const current = getStats();
  const newStats = { ...current };

  newStats.gamesPlayed += 1;
  
  if (won) {
    newStats.wins += 1;
    newStats.streak += 1;
    if (newStats.streak > newStats.bestStreak) {
      newStats.bestStreak = newStats.streak;
    }
  } else {
    newStats.streak = 0;
  }

  // Atualiza a melhor patente se for fornecida
  if (currentRankName) {
      newStats.bestRankName = currentRankName;
  }

  localStorage.setItem(STATS_KEY, JSON.stringify(newStats));
  return newStats;
};

// --- Question History & Category Management ---

export const getQuestionHistory = (): string[] => {
  const stored = localStorage.getItem(HISTORY_KEY);
  return stored ? JSON.parse(stored) : [];
};

export const setQuestionHistory = (history: string[]) => {
  const limitedHistory = history.slice(-MAX_HISTORY_SIZE);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(limitedHistory));
};

export const addQuestionToHistory = (questionText: string) => {
  let history = getQuestionHistory();
  const exists = history.some(h => h.trim().toLowerCase() === questionText.trim().toLowerCase());

  if (!exists) {
    history.push(questionText);
    if (history.length > MAX_HISTORY_SIZE) {
        history = history.slice(-MAX_HISTORY_SIZE);
    }
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  }
};

export const getLastCategory = (): string | null => {
  return localStorage.getItem(LAST_CAT_KEY);
};

export const setLastCategory = (category: string) => {
  localStorage.setItem(LAST_CAT_KEY, category);
};

// --- Question Cache Management (Batching) ---

const clearLegacyCache = () => {
    if (localStorage.getItem('quiz60_questions_cache')) {
        localStorage.removeItem('quiz60_questions_cache');
    }
};

export const cacheQuestions = (questions: TriviaQuestion[]) => {
  try {
    const currentCacheStr = localStorage.getItem(QUESTION_CACHE_KEY);
    const currentCache: TriviaQuestion[] = currentCacheStr ? JSON.parse(currentCacheStr) : [];
    const updatedCache = [...currentCache, ...questions];
    localStorage.setItem(QUESTION_CACHE_KEY, JSON.stringify(updatedCache));
  } catch (e) {
    console.error("Error caching questions", e);
  }
};

export const popCachedQuestion = (): TriviaQuestion | null => {
  clearLegacyCache();
  try {
    const cacheStr = localStorage.getItem(QUESTION_CACHE_KEY);
    if (!cacheStr) return null;
    const cache: TriviaQuestion[] = JSON.parse(cacheStr);
    if (cache.length === 0) return null;
    const question = cache.shift();
    localStorage.setItem(QUESTION_CACHE_KEY, JSON.stringify(cache));
    return question || null;
  } catch (e) {
    console.error("Error popping cached question", e);
    return null;
  }
};

export const getCacheSize = (): number => {
    const cacheStr = localStorage.getItem(QUESTION_CACHE_KEY);
    return cacheStr ? JSON.parse(cacheStr).length : 0;
}

export const clearQuestionCache = () => {
    localStorage.removeItem(QUESTION_CACHE_KEY);
}
