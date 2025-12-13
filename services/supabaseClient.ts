import { createClient } from '@supabase/supabase-js';

// Configuração do Supabase com as chaves fornecidas
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://jqkuljvgicfytrldqnay.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impxa3VsanZnaWNmeXRybGRxbmF5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU1Nzk5NzMsImV4cCI6MjA4MTE1NTk3M30.4wjCiaLoscKEY4lieT6in06Sf8ZsRVhMzYEZ9ER5lQ8';

export const supabase = (SUPABASE_URL && SUPABASE_KEY) 
  ? createClient(SUPABASE_URL, SUPABASE_KEY) 
  : null;