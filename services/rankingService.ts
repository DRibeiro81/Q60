import { supabase } from './supabaseClient';
import { User } from '../types';
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

// Update score ONLY if the new score represents a High Score (Best Run)
export const updatePlayerScore = async (user: User, currentRunScore: number, currentStreak: number) => {
  if (!supabase) return;

  try {
    // 1. Fetch current High Score for this user
    const { data: playerData, error: fetchError } = await supabase
      .from('players')
      .select('wins, streak')
      .eq('nickname', user.nickname)
      .maybeSingle();

    if (fetchError) throw fetchError;

    if (playerData) {
        // 2. Logic: Only update 'wins' if currentRunScore is higher than stored wins (High Score)
        // We always update streak if it's the current session stats, but usually streak is tied to the high score run or just 'current best'.
        // For this game, let's treat 'wins' as High Score (Max Points in a game) and streak as Best Streak.
        
        const updates: any = {
            last_played: new Date().toISOString()
        };
        
        // Update High Score
        if (currentRunScore > playerData.wins) {
            updates.wins = currentRunScore;
        }

        // Update Best Streak if current is better
        if (currentStreak > playerData.streak) {
            updates.streak = currentStreak;
        }

        // Only call update if there are changes to stats or just to update last_played
        if (Object.keys(updates).length > 0) {
             const { error: updateError } = await supabase
                .from('players')
                .update(updates)
                .eq('nickname', user.nickname);

             if (updateError) throw updateError;
        }

    } else {
        // Fallback (shouldn't happen if user is logged in properly)
        console.warn("User record not found during score update");
    }

  } catch (error) {
    console.error("Error updating score:", error);
  }
};