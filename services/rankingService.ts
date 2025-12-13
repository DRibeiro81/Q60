
import { supabase } from './supabaseClient';
import { User, PlayerStats } from '../types';
import { getStats, getUser } from './storageService';

export interface RankingEntry {
  nickname: string;
  wins: number;
  streak: number;
  isCurrentUser?: boolean;
}

// Fallback Mock Data if DB is not connected
const getLocalMockRanking = () => {
  const currentUser = getUser();
  const currentStats = getStats();

  const mockData = [
    { nickname: 'MestreDoChute', wins: 142, streak: 12 },
    { nickname: 'AdivinhaPro', wins: 98, streak: 5 },
    { nickname: 'OraculoDigital', wins: 87, streak: 8 },
    { nickname: 'Palpiteiro', wins: 65, streak: 2 },
    { nickname: 'Sabetudo123', wins: 44, streak: 0 },
  ];

  if (currentUser) {
    // Check if user is already in mock to avoid duplication in display logic
    const exists = mockData.find(d => d.nickname === currentUser.nickname);
    if (!exists) {
        const userEntry = { 
            nickname: currentUser.nickname, 
            wins: currentStats.wins, 
            streak: currentStats.streak,
            isCurrentUser: true 
        };
        mockData.push(userEntry);
    }
  }

  return mockData.sort((a, b) => b.wins - a.wins);
};

export const fetchGlobalRanking = async (): Promise<RankingEntry[]> => {
  if (!supabase) {
    return getLocalMockRanking();
  }

  try {
    // Changed table from 'rankings' to 'players'
    const { data, error } = await supabase
      .from('players')
      .select('nickname, wins, streak')
      .order('wins', { ascending: false })
      .limit(50);

    if (error) throw error;

    const currentUser = getUser();
    
    return data.map((entry: any) => ({
      ...entry,
      isCurrentUser: currentUser ? entry.nickname === currentUser.nickname : false
    }));

  } catch (error) {
    console.error("Error fetching ranking:", error);
    return getLocalMockRanking();
  }
};

export const updatePlayerScore = async (user: User, stats: PlayerStats) => {
  if (!supabase) return;

  try {
    // We update based on nickname, but we assume the user is authenticated if they are playing.
    // In a stricter app, we would verify the access_code again or use auth.uid()
    const { error } = await supabase
      .from('players')
      .update({ 
        wins: stats.wins, 
        streak: stats.streak,
        last_played: new Date().toISOString()
      })
      .eq('nickname', user.nickname); // Targeting the unique nickname

    if (error) throw error;
  } catch (error) {
    console.error("Error updating score:", error);
  }
};
