import { supabase } from './supabaseClient';
import { User } from '../types';
import emailjs from '@emailjs/browser';

// --- CONFIGURAÇÃO OBRIGATÓRIA DO EMAILJS ---
// Para o email funcionar, você precisa criar um Template no site do EmailJS:
// 1. Acesse https://dashboard.emailjs.com/admin/templates
// 2. Crie um novo template.
// 3. No corpo do email, use: "Olá {{nickname}}, seu código é {{code}}"
// 4. Nas configurações do template (Settings), no campo "To Email", coloque: {{to_email}}
// 5. Salve e COPIE o ID do template (ex: template_abc123) e cole abaixo.

const EMAILJS_SERVICE_ID = 'service_jsktwjm'; // ID Configurado
const EMAILJS_PUBLIC_KEY = 'akT9a2pbTBWKhZ7_a'; // Chave Configurada
const EMAILJS_TEMPLATE_ID = 'template_ID_AQUI'; // <--- SUBSTITUA ISSO PELO SEU TEMPLATE ID

// Helper to generate a 6-digit code
export const generateCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

export const sendVerificationEmail = async (email: string, code: string, nickname: string): Promise<boolean> => {
  // Verificação de segurança
  if (EMAILJS_TEMPLATE_ID === 'template_ID_AQUI') {
      console.error("❌ ERRO CRÍTICO: Template ID do EmailJS não configurado.");
      alert("ERRO: O desenvolvedor precisa configurar o Template ID no arquivo services/authService.ts para que o email seja enviado.");
      return false;
  }

  try {
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
    console.error('❌ FALHA AO ENVIAR EMAIL REAL:', error);
    alert('Erro ao conectar com serviço de e-mail. Verifique o console.');
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

// 2. STEP TWO: Actually create the user (After code verification)
export const createPlayer = async (email: string, nickname: string, code: string): Promise<{ success: boolean; message: string; user?: User }> => {
  if (!supabase) return { success: false, message: 'Banco de dados desconectado.' };

  try {
    const { error: insertError } = await supabase
      .from('players')
      .insert({
        email,
        nickname,
        access_code: code,
        wins: 0,
        streak: 0
      });

    if (insertError) {
        throw insertError;
    }

    return { 
      success: true, 
      message: 'Cadastro realizado com sucesso!',
      user: { email, nickname, access_code: code }
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