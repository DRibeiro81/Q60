import { User, PlayerStats } from '../types';

const USER_KEY = 'quiz60_user';
const STATS_KEY = 'quiz60_stats';
const HISTORY_KEY = 'quiz60_question_history';
const LAST_CAT_KEY = 'quiz60_last_category';

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
  return stored ? JSON.parse(stored) : { wins: 0, streak: 0, bestStreak: 0, gamesPlayed: 0 };
};

export const updateStats = (won: boolean) => {
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

  localStorage.setItem(STATS_KEY, JSON.stringify(newStats));
  return newStats;
};

// --- Question History & Category Management ---

export const getQuestionHistory = (): string[] => {
  const stored = localStorage.getItem(HISTORY_KEY);
  return stored ? JSON.parse(stored) : [];
};

export const addQuestionToHistory = (questionText: string) => {
  const history = getQuestionHistory();
  if (!history.includes(questionText)) {
    // Keep history manageable, maybe max 500 questions? 
    history.push(questionText);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  }
};

export const getLastCategory = (): string | null => {
  return localStorage.getItem(LAST_CAT_KEY);
};

export const setLastCategory = (category: string) => {
  localStorage.setItem(LAST_CAT_KEY, category);
};
