import React, { useState } from 'react';
import { User } from '../types';
import { UserIcon } from './Icons';
import { checkAvailability, createPlayer, loginPlayer, recoverCode, generateCode, sendVerificationEmail } from '../services/authService';

interface AuthModalProps {
  isOpen: boolean;
  onRegister: (user: User) => void;
}

type AuthMode = 'LOGIN' | 'REGISTER' | 'VERIFY' | 'RECOVER';

const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onRegister }) => {
  const [mode, setMode] = useState<AuthMode>('REGISTER');
  const [email, setEmail] = useState('');
  const [nickname, setNickname] = useState('');
  const [accessCode, setAccessCode] = useState('');
  
  // Verification State
  const [verificationCode, setVerificationCode] = useState(''); // What user types
  const [sentCode, setSentCode] = useState(''); // The real code we generated
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen) return null;

  const resetForm = () => {
    setError('');
    setSuccessMsg('');
    setLoading(false);
    setVerificationCode('');
  };

  const validateEmail = (email: string) => {
    return /\S+@\S+\.\S+/.test(email);
  };

  // STEP 1: Check availability and send code
  const handleStartRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    resetForm();

    if (!email || !nickname) {
      setError('Preencha todos os campos.');
      return;
    }

    if (!validateEmail(email)) {
        setError('Por favor, insira um e-mail válido.');
        return;
    }

    setLoading(true);
    const result = await checkAvailability(nickname, email);

    if (result.available) {
        // Generate code
        const code = generateCode();
        setSentCode(code);
        
        // Send email and wait for result
        const emailSent = await sendVerificationEmail(email, code, nickname);
        
        if (emailSent) {
            setSuccessMsg(`Enviamos um código para ${email}.`);
            // Switch to verify mode
            setMode('VERIFY');
        } else {
            setError('Falha ao enviar e-mail. Verifique se o serviço de e-mail está configurado corretamente.');
        }
        
        setLoading(false);
    } else {
        setError(result.message);
        setLoading(false);
    }
  };

  // STEP 2: Verify code and Create Account
  const handleVerifyAndCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (verificationCode !== sentCode) {
        setError('Código incorreto. Verifique seu e-mail.');
        return;
    }

    setLoading(true);
    // Code matches, create account using the same code as password
    const result = await createPlayer(email, nickname, sentCode);
    setLoading(false);

    if (result.success && result.user) {
        setSuccessMsg('Conta criada com sucesso!');
        // Auto login
        setTimeout(() => {
             onRegister(result.user!);
        }, 1000);
    } else {
        setError(result.message);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    resetForm();

    if (!nickname || !accessCode) {
      setError('Preencha apelido e código.');
      return;
    }

    setLoading(true);
    const result = await loginPlayer(nickname, accessCode);
    setLoading(false);

    if (result.success && result.user) {
      onRegister(result.user);
    } else {
      setError(result.message);
    }
  };

  const handleRecover = async (e: React.FormEvent) => {
    e.preventDefault();
    resetForm();
    
    if (!nickname || !email) {
        setError('Preencha apelido e email para recuperar.');
        return;
    }

    setLoading(true);
    const result = await recoverCode(nickname, email);
    setLoading(false);

    if (result.success) {
        setSuccessMsg("Se os dados estiverem corretos, o código foi enviado para seu e-mail.");
        setTimeout(() => {
            setMode('LOGIN');
        }, 4000);
    } else {
        setError(result.message);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
      <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl animate-[scaleIn_0.3s_ease-out]">
        
        {/* Tabs - Hidden during verification to prevent state loss */}
        {mode !== 'VERIFY' && (
            <div className="flex border-b border-gray-100">
            <button 
                className={`flex-1 py-4 text-sm font-bold transition-colors ${mode === 'REGISTER' ? 'text-purple-600 border-b-2 border-purple-600' : 'text-gray-400 hover:text-gray-600'}`}
                onClick={() => { setMode('REGISTER'); resetForm(); }}
            >
                Criar Conta
            </button>
            <button 
                className={`flex-1 py-4 text-sm font-bold transition-colors ${mode === 'LOGIN' ? 'text-purple-600 border-b-2 border-purple-600' : 'text-gray-400 hover:text-gray-600'}`}
                onClick={() => { setMode('LOGIN'); resetForm(); }}
            >
                Já tenho conta
            </button>
            </div>
        )}

        <div className="p-8">
          <div className="flex flex-col items-center mb-6">
            <div className="w-14 h-14 bg-purple-50 rounded-full flex items-center justify-center mb-3 text-purple-600">
              <UserIcon className="w-7 h-7" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">
              {mode === 'REGISTER' ? 'Criar Conta' : mode === 'VERIFY' ? 'Verificar E-mail' : mode === 'LOGIN' ? 'Acessar Ranking' : 'Recuperar Código'}
            </h2>
            <p className="text-gray-500 text-center text-xs mt-1">
              {mode === 'REGISTER' 
                ? 'Informe seus dados para validar seu e-mail.' 
                : mode === 'VERIFY'
                ? `Digite o código enviado para ${email}`
                : mode === 'LOGIN' 
                ? 'Use seu apelido e o código.'
                : 'Informe seus dados para recuperar o código.'}
            </p>
          </div>

          <form onSubmit={
              mode === 'REGISTER' ? handleStartRegister : 
              mode === 'VERIFY' ? handleVerifyAndCreate :
              mode === 'LOGIN' ? handleLogin : handleRecover
          } className="space-y-4">
            
            {/* Standard Fields */}
            {(mode === 'REGISTER' || mode === 'LOGIN' || mode === 'RECOVER') && (
                <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Apelido</label>
                <input
                    type="text"
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                    placeholder="Seu nome no jogo"
                    autoComplete="off"
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 bg-gray-50 text-gray-900 focus:bg-white focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none transition-all"
                />
                </div>
            )}

            {(mode === 'REGISTER' || mode === 'RECOVER') && (
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">E-mail</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  autoComplete="email" 
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 bg-gray-50 text-gray-900 focus:bg-white focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none transition-all"
                />
              </div>
            )}

            {/* Login Code Field */}
            {mode === 'LOGIN' && (
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Código de Acesso</label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={accessCode}
                  onChange={(e) => setAccessCode(e.target.value)}
                  placeholder="Consulte seu e-mail"
                  autoComplete="off"
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 bg-gray-50 text-gray-900 focus:bg-white focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none transition-all text-center tracking-widest font-mono text-lg"
                />
              </div>
            )}

            {/* Verification Code Field */}
            {mode === 'VERIFY' && (
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Código de Confirmação</label>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  placeholder="000000"
                  className="w-full px-4 py-3 rounded-xl border border-purple-300 bg-purple-50 text-gray-900 focus:bg-white focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none transition-all text-center tracking-widest font-mono text-2xl"
                  autoFocus
                />
                <p className="text-[10px] text-gray-400 text-center mt-2">
                   Verifique sua caixa de entrada ou spam.
                </p>
              </div>
            )}

            {/* Messages */}
            {error && (
              <div className="p-3 bg-red-50 text-red-600 text-xs rounded-lg font-medium border border-red-100 text-center">
                {error}
              </div>
            )}
            {successMsg && (
              <div className="p-3 bg-green-50 text-green-600 text-xs rounded-lg font-medium border border-green-100 text-center">
                {successMsg}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white font-bold rounded-xl shadow-lg shadow-purple-200 transition-all active:scale-95 mt-2 flex justify-center"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                mode === 'REGISTER' ? 'Validar E-mail' : mode === 'VERIFY' ? 'Confirmar e Criar' : mode === 'LOGIN' ? 'Entrar' : 'Recuperar'
              )}
            </button>
            
            {mode === 'VERIFY' && (
                <button 
                    type="button"
                    onClick={() => { setMode('REGISTER'); resetForm(); }}
                    className="w-full text-xs text-gray-400 hover:text-purple-600 text-center mt-2"
                >
                    Voltar / Corrigir E-mail
                </button>
            )}

            {mode === 'LOGIN' && (
                <button 
                    type="button"
                    onClick={() => { setMode('RECOVER'); resetForm(); }}
                    className="w-full text-xs text-gray-400 hover:text-purple-600 text-center mt-2"
                >
                    Esqueci meu código
                </button>
            )}
             {mode === 'RECOVER' && (
                <button 
                    type="button"
                    onClick={() => { setMode('LOGIN'); resetForm(); }}
                    className="w-full text-xs text-gray-400 hover:text-purple-600 text-center mt-2"
                >
                    Voltar para Login
                </button>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};

export default AuthModal;