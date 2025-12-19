import { supabase } from './supabaseClient';
import { User } from '../types';
import emailjs from '@emailjs/browser';

// --- CONFIGURAÇÃO DO EMAILJS ---
const EMAILJS_SERVICE_ID = 'service_jsktwjm'; 
const EMAILJS_PUBLIC_KEY = 'akT9a2pbTBWKhZ7_a'; 
const EMAILJS_TEMPLATE_ID = 'template_qf7ay97'; // ID Real Configurado

// Helper to generate a 6-digit code
export const generateCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

export const sendVerificationEmail = async (email: string, code: string, nickname: string): Promise<boolean> => {
  try {
    console.log(`Tentando enviar email para ${email}...`);
    
    await emailjs.send(
        EMAILJS_SERVICE_ID, 
        EMAILJS_TEMPLATE_ID, 
        {
            to_email: email,
            code: code,
            nickname: nickname
        }, 
        EMAILJS_PUBLIC_KEY
    );
    console.log(`✅ Email enviado com sucesso para ${email}`);
    return true;
  } catch (error) {
    console.error('❌ Erro ao enviar email via EmailJS:', error);
    return false;
  }
};

// 1. STEP ONE: Check if data is available (Before sending code)
export const checkAvailability = async (nickname: string, email: string): Promise<{ available: boolean; message: string }> => {
  if (!supabase) return { available: false, message: 'Banco de dados desconectado.' };

  try {
    // Check nickname
    const { data: existingNick, error: nickError } = await supabase
      .from('players')
      .select('nickname')
      .eq('nickname', nickname);

    if (nickError && nickError.code !== 'PGRST116') throw nickError;
    if (existingNick && existingNick.length > 0) {
      return { available: false, message: 'Este apelido já está em uso.' };
    }

    // Check email
    const { data: existingEmail, error: emailError } = await supabase
      .from('players')
      .select('email')
      .eq('email', email);

    if (emailError && emailError.code !== 'PGRST116') throw emailError;
    if (existingEmail && existingEmail.length > 0) {
      return { available: false, message: 'Este e-mail já está cadastrado.' };
    }

    return { available: true, message: 'Disponível' };
  } catch (error: any) {
    console.error('Check availability error:', error);
    let msg = 'Erro ao verificar dados.';
    if (error?.code === '42P01') msg = 'Erro: Tabela "players" não existe.';
    return { available: false, message: msg };
  }
};

// 2. STEP TWO: Verify code and Create Account
export const createPlayer = async (email: string, nickname: string, code: string): Promise<{ success: boolean; message: string; user?: User }> => {
  if (!supabase) return { success: false, message: 'Banco de dados desconectado.' };

  try {
    // Insert and SELECT to get the generated ID
    const { data, error: insertError } = await supabase
      .from('players')
      .insert({
        email,
        nickname,
        access_code: code,
        wins: 0,
        streak: 0
      })
      .select('id, nickname, email, access_code')
      .single();

    if (insertError) {
        throw insertError;
    }

    return { 
      success: true, 
      message: 'Cadastro realizado com sucesso!',
      user: { 
        id: data.id,
        email: data.email, 
        nickname: data.nickname, 
        access_code: data.access_code 
      }
    };

  } catch (error: any) {
    console.error('Create player error:', error);
    return { success: false, message: error.message || 'Erro ao criar conta.' };
  }
};

export const loginPlayer = async (nickname: string, code: string): Promise<{ success: boolean; message: string; user?: User }> => {
  if (!supabase) return { success: false, message: 'Banco de dados desconectado.' };

  try {
    const { data, error } = await supabase
      .from('players')
      .select('*')
      .eq('nickname', nickname)
      .eq('access_code', code)
      .maybeSingle();

    if (error) throw error;

    if (!data) {
      return { success: false, message: 'Apelido ou código incorretos.' };
    }

    return {
      success: true,
      message: 'Login realizado com sucesso!',
      user: {
        id: data.id, // Important: Return the ID
        email: data.email,
        nickname: data.nickname,
        access_code: data.access_code
      }
    };

  } catch (error: any) {
    console.error('Login error:', error);
    let msg = 'Erro ao conectar.';
    if (error?.code === '42P01') msg = 'Erro: A tabela "players" não existe.';
    else if (error?.message) msg = `Erro: ${error.message}`;
    return { success: false, message: msg };
  }
};

export const recoverCode = async (nickname: string, email: string): Promise<{ success: boolean; message: string }> => {
  if (!supabase) return { success: false, message: 'Banco de dados desconectado.' };

  try {
    const { data, error } = await supabase
        .from('players')
        .select('access_code')
        .eq('nickname', nickname)
        .eq('email', email)
        .maybeSingle();
    
    if (error) throw error;
    
    if (!data) {
        return { success: false, message: 'Dados não conferem.' };
    }

    await sendVerificationEmail(email, data.access_code, nickname);
    return { 
        success: true, 
        message: 'Código reenviado para o e-mail.'
    };

  } catch (error: any) {
    console.error('Recover error:', error);
    let msg = 'Erro ao recuperar código.';
    if (error?.code === '42P01') msg = 'Erro: A tabela "players" não existe.';
    return { success: false, message: msg };
  }
}
