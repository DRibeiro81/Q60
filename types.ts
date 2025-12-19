
export interface TriviaQuestion {
  question: string;
  answer: number;
  unit: string;
  category: string;
  context: string; // Fun fact shown after winning
}

export enum GuessState {
  LOWER = 'LOWER', // The correct answer is lower
  HIGHER = 'HIGHER', // The correct answer is higher
  CORRECT = 'CORRECT',
}

export interface Guess {
  value: number;
  state: GuessState;
  proximity: number; // 0 to 100 (percentage of closeness)
  timestamp: number;
}

export enum GameStatus {
  LOADING = 'LOADING',
  READY = 'READY',
  COUNTDOWN = 'COUNTDOWN',
  PLAYING = 'PLAYING',
  WON = 'WON',
  LOST = 'LOST',
  ERROR = 'ERROR',
}

export interface User {
  id?: string | number; // Updated: Can be UUID (string) or BigInt (number)
  email: string;
  nickname: string;
  access_code?: string; // Code used for login
}

export interface PlayerStats {
  wins: number;
  streak: number;
  bestStreak: number;
  gamesPlayed: number;
  bestRankName?: string; // Novo campo
}

// --- RANK SYSTEM TYPES ---

export interface RankInfo {
  level: number;
  name: string;
  difficulty: string;
  timeBonus: number;
  maxAttempts: number;
}

export const RANKS: Record<number, RankInfo> = {
  1: { level: 1, name: "Curioso", difficulty: "Fácil", timeBonus: 10, maxAttempts: 10 },
  2: { level: 2, name: "Iniciante", difficulty: "Fácil / Médio", timeBonus: 9, maxAttempts: 9 },
  3: { level: 3, name: "Aprendiz", difficulty: "Médio", timeBonus: 8, maxAttempts: 8 },
  4: { level: 4, name: "Amador", difficulty: "Médio", timeBonus: 7, maxAttempts: 7 },
  5: { level: 5, name: "Competidor", difficulty: "Médio / Difícil", timeBonus: 6, maxAttempts: 6 },
  6: { level: 6, name: "Avançado", difficulty: "Difícil", timeBonus: 5, maxAttempts: 5 },
  7: { level: 7, name: "Especialista", difficulty: "Difícil", timeBonus: 4, maxAttempts: 5 },
  8: { level: 8, name: "Profissional", difficulty: "Muito Difícil", timeBonus: 3, maxAttempts: 4 },
  9: { level: 9, name: "Elite", difficulty: "Muito Difícil", timeBonus: 2, maxAttempts: 4 },
  10: { level: 10, name: "Mestre", difficulty: "Extremo", timeBonus: 1, maxAttempts: 3 },
};

// --- LEAGUE TYPES ---

export type LeagueDurationUnit = 'hours' | 'days';

export interface LeagueEntry {
  nickname: string;
  bestScore: number;     // Melhor pontuação (High Score) na liga
  totalQuestions: number; // Critério de desempate ou engajamento
  lastPlayed: number;
}

export interface League {
  id: string;
  code: string; // Mapped from 'invite_code'
  name: string;
  description?: string;
  creatorNickname: string; // Fetched via relation
  createdAt: number;
  endsAt: number;
  entries: LeagueEntry[];
  status: 'ACTIVE' | 'ENDED';
}
