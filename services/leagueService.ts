import { supabase } from './supabaseClient';
import { League, LeagueEntry, LeagueDurationUnit, User } from '../types';

// Generate a random 6-character code
const generateInviteCode = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
};

// Check if user has ID
const validateUser = (user: User): boolean => {
    if (!user.id) {
        console.error("User ID missing. Re-login required.");
        return false;
    }
    return true;
};

export const createLeague = async (user: User, name: string, description: string, durationValue: number, durationUnit: LeagueDurationUnit): Promise<{ success: boolean; message?: string; league?: League }> => {
  if (!supabase) return { success: false, message: 'Conexão com banco de dados não disponível.' };
  if (!validateUser(user)) return { success: false, message: 'Sessão inválida. Faça login novamente.' };

  const now = Date.now();
  let durationMs = 0;
  
  if (durationUnit === 'hours') {
    durationMs = durationValue * 60 * 60 * 1000;
  } else {
    durationMs = durationValue * 24 * 60 * 60 * 1000;
  }
  
  const endsAt = new Date(now + durationMs).toISOString();
  const code = generateInviteCode();

  try {
    // 1. Create League
    const { data: leagueData, error: leagueError } = await supabase
        .from('leagues')
        .insert({
            name,
            description,
            created_by: user.id, // Supabase handles number/string conversion for BigInt
            ends_at: endsAt,
            invite_code: code,
            status: 'active'
        })
        .select()
        .single();

    if (leagueError) {
        console.error("Supabase League Insert Error:", leagueError);
        return { success: false, message: `Erro ao criar liga: ${leagueError.message}` };
    }

    // 2. Add Creator as Member
    const { error: memberError } = await supabase
        .from('league_members')
        .insert({
            league_id: leagueData.id,
            player_id: user.id,
            best_score: 0,
            total_questions: 0
        });

    if (memberError) {
        console.error("Supabase Member Insert Error:", memberError);
        // Clean up empty league if member add fails
        await supabase.from('leagues').delete().eq('id', leagueData.id);
        return { success: false, message: `Erro ao adicionar criador: ${memberError.message}` };
    }

    const newLeague: League = {
        id: leagueData.id,
        code: leagueData.invite_code,
        name: leagueData.name,
        description: leagueData.description,
        creatorNickname: user.nickname,
        createdAt: new Date(leagueData.created_at).getTime(),
        endsAt: new Date(leagueData.ends_at).getTime(),
        status: 'ACTIVE',
        entries: [{
            nickname: user.nickname,
            bestScore: 0,
            totalQuestions: 0,
            lastPlayed: now
        }]
    };

    return { success: true, league: newLeague };

  } catch (error: any) {
    console.error("Error creating league:", error);
    return { success: false, message: `Erro inesperado: ${error.message || error}` };
  }
};

export const joinLeague = async (user: User, codeInput: string): Promise<{ success: boolean; message: string }> => {
  if (!supabase) return { success: false, message: 'Banco de dados não conectado.' };
  if (!validateUser(user)) return { success: false, message: 'Sessão inválida.' };

  const code = codeInput.trim().toUpperCase();

  try {
      // 1. Find by invite_code
      const { data: league, error: codeError } = await supabase
        .from('leagues')
        .select('id, status, ends_at')
        .eq('invite_code', code)
        .maybeSingle();

      if (codeError) throw codeError;
      if (!league) return { success: false, message: 'Liga não encontrada.' };

      // 2. Check Expiration
      if (league.status === 'finished' || new Date(league.ends_at).getTime() < Date.now()) {
          return { success: false, message: 'Esta liga já foi encerrada.' };
      }

      // 3. Add Member
      const { error: joinError } = await supabase
        .from('league_members')
        .insert({
            league_id: league.id,
            player_id: user.id,
            best_score: 0,
            total_questions: 0
        });

      if (joinError) {
          if (joinError.code === '23505') { // Unique violation
              return { success: true, message: 'Você já está nesta liga!' };
          }
          throw joinError;
      }

      return { success: true, message: 'Você entrou na liga!' };

  } catch (error: any) {
      console.error("Error joining league:", error);
      return { success: false, message: error.message || 'Erro ao entrar na liga.' };
  }
};

export const getLeagues = async (user: User): Promise<League[]> => {
    if (!supabase || !user.id) return [];

    try {
        // 1. Get League IDs for user
        const { data: memberRows, error: memberError } = await supabase
            .from('league_members')
            .select('league_id')
            .eq('player_id', user.id);

        if (memberError) {
            console.error("Fetch members error:", memberError);
            return [];
        }

        const leagueIds = memberRows.map((r: any) => r.league_id);
        
        if (leagueIds.length === 0) return [];

        // 2. Fetch Leagues Data AND Join with Players to get Creator Nickname
        const { data: leaguesData, error: leaguesError } = await supabase
            .from('leagues')
            .select(`
                *,
                creator:created_by ( nickname )
            `)
            .in('id', leagueIds);

        if (leaguesError) throw leaguesError;

        // 3. Process
        const now = Date.now();
        const processedLeagues: League[] = [];

        for (const l of leaguesData) {
            let status = l.status;
            const endsAtTime = new Date(l.ends_at).getTime();

            // Lazy Update Status (Client-side trigger)
            if (status === 'active' && now > endsAtTime) {
                status = 'finished';
                supabase.from('leagues').update({ status: 'finished' }).eq('id', l.id).then(({error}) => {
                    if (error) console.warn("Auto-close warning:", error.message);
                });
            }

            // Get member count
            const { count } = await supabase
                .from('league_members')
                .select('*', { count: 'exact', head: true })
                .eq('league_id', l.id);
            
            // Get Top Leader
            const { data: leader } = await supabase
                .from('league_members')
                .select(`
                    best_score,
                    player:player_id ( nickname )
                `)
                .eq('league_id', l.id)
                .order('best_score', { ascending: false })
                .limit(1)
                .maybeSingle();

            // Prepare entries array with leader as first element
            const entries: any[] = [];
            
            if (leader && leader.player) {
                entries.push({
                    nickname: leader.player.nickname,
                    bestScore: leader.best_score,
                    totalQuestions: 0,
                    lastPlayed: 0
                });
            }

            // Pad the rest with dummy objects to match the count (so UI displays correct number of players)
            const totalCount = count || 0;
            while (entries.length < totalCount) {
                entries.push({});
            }

            processedLeagues.push({
                id: l.id,
                code: l.invite_code,
                name: l.name,
                description: l.description,
                creatorNickname: l.creator?.nickname || 'Desconhecido',
                createdAt: new Date(l.created_at).getTime(),
                endsAt: endsAtTime,
                status: status === 'active' ? 'ACTIVE' : 'ENDED',
                entries: entries
            });
        }

        return processedLeagues.sort((a, b) => {
            if (a.status === 'ACTIVE' && b.status === 'ENDED') return -1;
            if (a.status === 'ENDED' && b.status === 'ACTIVE') return 1;
            return b.endsAt - a.endsAt;
        });

    } catch (error) {
        console.error("Error fetching leagues:", error);
        return [];
    }
};

export const getLeagueDetails = async (leagueId: string): Promise<League | null> => {
    if (!supabase) return null;

    try {
        const { data: league, error: lError } = await supabase
            .from('leagues')
            .select(`
                *,
                creator:created_by ( nickname )
            `)
            .eq('id', leagueId)
            .single();
        
        if (lError) throw lError;

        const { data: members, error: mError } = await supabase
            .from('league_members')
            .select(`
                *,
                player:player_id ( nickname )
            `)
            .eq('league_id', leagueId)
            .order('best_score', { ascending: false })
            .order('total_questions', { ascending: false });

        if (mError) throw mError;

        const entries: LeagueEntry[] = members.map((m: any) => ({
            nickname: m.player?.nickname || 'Desconhecido',
            bestScore: m.best_score,
            totalQuestions: m.total_questions,
            lastPlayed: m.last_game_at ? new Date(m.last_game_at).getTime() : 0
        }));

        return {
            id: league.id,
            code: league.invite_code,
            name: league.name,
            description: league.description,
            creatorNickname: league.creator?.nickname || 'Desconhecido',
            createdAt: new Date(league.created_at).getTime(),
            endsAt: new Date(league.ends_at).getTime(),
            status: league.status === 'active' ? 'ACTIVE' : 'ENDED',
            entries: entries
        };

    } catch (e) {
        console.error("Error details:", e);
        return null;
    }
};

export const updateLeagueProgress = async (user: User, runScore: number, totalQuestionsInRun: number) => {
  if (!supabase || !user.id) return;

  const now = new Date().toISOString();

  try {
      // Find active leagues for this user
      // Optimization: Could do a single SQL update if we trust the logic, 
      // but retrieving active leagues first is safer logic.
      const leagues = await getLeagues(user);
      const activeLeagues = leagues.filter(l => l.status === 'ACTIVE');

      for (const league of activeLeagues) {
          const { data: member, error: fetchError } = await supabase
            .from('league_members')
            .select('best_score, total_questions')
            .eq('league_id', league.id)
            .eq('player_id', user.id)
            .single();

          if (fetchError) continue;

          const updates: any = {
              last_game_at: now,
              total_questions: member.total_questions + totalQuestionsInRun
          };

          if (runScore > member.best_score) {
              updates.best_score = runScore;
          }

          await supabase
            .from('league_members')
            .update(updates)
            .eq('league_id', league.id)
            .eq('player_id', user.id);
      }
  } catch (error) {
      console.error("Error updating league progress:", error);
  }
};