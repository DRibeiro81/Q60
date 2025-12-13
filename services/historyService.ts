import { supabase } from './supabaseClient';
import { getQuestionHistory, setQuestionHistory } from './storageService';

// Synchronize local history with remote DB
// This ensures that if the user plays on another device, we don't repeat questions
export const syncUserHistory = async (nickname: string) => {
  if (!supabase) return;

  try {
    // 1. Fetch remote history for this user
    // CRITICAL: Order by descending creation time and limit to 100 to meet requirement
    // Assuming Supabase auto-creates 'created_at'. If not, we just limit by default order.
    const { data, error } = await supabase
      .from('question_history')
      .select('question')
      .eq('nickname', nickname)
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) {
        // If table doesn't exist (42P01) or created_at missing, fallback to simple select
        if (error.code !== '42P01') {
            console.error("Sync history error (trying simple fetch):", error);
             // Fallback fetch without order if column missing
             const { data: fallbackData } = await supabase
                .from('question_history')
                .select('question')
                .eq('nickname', nickname)
                .limit(100);
             
             if (fallbackData) processHistoryData(fallbackData);
        }
        return;
    }

    if (data) {
        processHistoryData(data);
    }

  } catch (e) {
    console.error("Error syncing history:", e);
  }
};

const processHistoryData = (data: any[]) => {
    if (data.length > 0) {
      const remoteQuestions = data.map((d: any) => d.question);
      const localQuestions = getQuestionHistory();

      // 2. Merge unique questions
      const combined = new Set([...localQuestions, ...remoteQuestions]);
      
      // 3. Keep only last 100 (conceptually, though Set order helps, we enforce size)
      // Since we want to prioritize the "No Repeat" logic, having a populated list is good.
      let newHistory = Array.from(combined);
      
      if (newHistory.length > 100) {
          // Keep the end of the array (most recently added locally + remote)
          newHistory = newHistory.slice(-100);
      }
      
      // 4. Update local storage
      setQuestionHistory(newHistory);
      console.log(`History synced. Active blocklist size: ${newHistory.length}`);
    }
};

// Save a single question to remote DB (Fire and forget)
export const saveQuestionRemote = async (nickname: string, question: string) => {
  if (!supabase) return;

  try {
    // We try to insert. 
    await supabase
      .from('question_history')
      .insert({ nickname, question });
      
  } catch (e) {
    // Silent fail is fine here, we still have local storage
    // console.warn("Could not save question to remote history");
  }
};