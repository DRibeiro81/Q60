
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
  email: string;
  nickname: string;
  access_code?: string; // Code used for login
}

export interface PlayerStats {
  wins: number;
  streak: number;
  bestStreak: number;
  gamesPlayed: number;
}