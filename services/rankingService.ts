
import { supabase } from './supabaseClient';
import { User } from '../types';
import { getStats, getUser } from './storageService';

export interface RankingEntry {
  nickname: string;
  wins: number;
  streak: number;
  isCurrentUser?: boolean;
}

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

export const getActivePlayersCount = async (): Promise<number> => {
  if (!supabase) return Math.floor(Math.random() * 5) + 1;

  try {
    const threeMinutesAgo = new Date(Date.now() - 3 * 60000).toISOString();
    const { count, error } = await supabase
      .from('players')
      .select('*', { count: 'exact', head: true })
      .gt('last_played', threeMinutesAgo);

    if (error) throw error;
    return count || 1;
  } catch (e) {
    console.error("Error fetching active players:", e);
    return 1;
  }
};

export const updatePlayerScore = async (user: User, currentRunScore: number, currentStreak: number, bestRankName?: string) => {
  if (!supabase) return;

  try {
    const { data: playerData, error: fetchError } = await supabase
      .from('players')
      .select('wins, streak, best_rank')
      .eq('nickname', user.nickname)
      .maybeSingle();

    if (fetchError) throw fetchError;

    if (playerData) {
        const updates: any = {
            last_played: new Date().toISOString()
        };
        
        if (currentRunScore > playerData.wins) {
            updates.wins = currentRunScore;
        }

        if (currentStreak > playerData.streak) {
            updates.streak = currentStreak;
        }

        if (bestRankName) {
            updates.best_rank = bestRankName;
        }

        const { error: updateError } = await supabase
            .from('players')
            .update(updates)
            .eq('nickname', user.nickname);

        if (updateError) throw updateError;
    }
  } catch (error) {
    console.error("Error updating score:", error);
  }
};

export const getPlayerDashboardStats = async (user: User) => {
    if (!supabase) return { rank: '-', lastPlayed: null, bestRank: 'Curioso' };

    try {
        const { data: player, error: pError } = await supabase
            .from('players')
            .select('wins, last_played, best_rank')
            .eq('nickname', user.nickname)
            .single();
        
        if (pError || !player) return { rank: '-', lastPlayed: null, bestRank: 'Curioso' };

        const { count, error: cError } = await supabase
            .from('players')
            .select('*', { count: 'exact', head: true })
            .gt('wins', player.wins);
        
        const rank = cError ? '-' : (count || 0) + 1;

        return {
            rank: rank,
            lastPlayed: player.last_played,
            bestRank: player.best_rank || 'Curioso'
        };
    } catch (e) {
        console.error("Error fetching dashboard stats:", e);
        return { rank: '-', lastPlayed: null, bestRank: 'Curioso' };
    }
};
