
import React, { useState, useEffect, useRef } from 'react';
import { GameStatus, Guess } from '../types';

interface GameControlsProps {
  onGuess: (value: number) => void;
  status: GameStatus;
  unit: string;
  guesses: Guess[]; // Adicionado para verificar duplicatas
}

const GameControls: React.FC<GameControlsProps> = ({ onGuess, status, unit, guesses }) => {
  const [inputValue, setInputValue] = useState('');
  const [warning, setWarning] = useState(''); 
  const inputRef = useRef<HTMLInputElement>(null);
  const warningTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    if (status === GameStatus.PLAYING) {
      inputRef.current?.focus();
    }
  }, [status]);

  const showWarning = (msg: string) => {
      setWarning(msg);
      if (warningTimeoutRef.current) clearTimeout(warningTimeoutRef.current);
      warningTimeoutRef.current = window.setTimeout(() => setWarning(''), 3000);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value;
      if (val === '' || /^[0-9.,-]*$/.test(val)) {
          setInputValue(val);
          if (warning) setWarning(''); 
      } else {
          showWarning('Apenas números são permitidos, soldado.');
      }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue) return;
    
    const cleanValue = inputValue.replace(/\./g, '').replace(/,/g, '.');
    const num = Math.round(parseFloat(cleanValue));

    if (isNaN(num)) {
      showWarning('Coordenadas inválidas.');
      setInputValue('');
      return;
    }

    // Verificação de palpite repetido
    if (guesses.some(g => g.value === num)) {
        showWarning('VOCÊ JÁ TENTOU ESSE PALPITE!');
        setInputValue('');
        return;
    }

    onGuess(num);
    setInputValue('');
    setWarning('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSubmit(e);
    }
  };

  return (
    <div className="fixed bottom-0 left-0 w-full bg-[#0f0a1a]/95 backdrop-blur-2xl border-t border-white/10 p-6 pb-12 sm:pb-6 shadow-[0_-10px_50px_rgba(0,0,0,0.8)] z-20">
      <div className="max-w-4xl mx-auto w-full relative">
        
        {/* Alerta de Sistema */}
        {warning && (
            <div className="absolute -top-16 left-0 w-full flex justify-center animate-[fadeIn_0.2s_ease-out]">
                <div className="bg-red-600 text-white px-6 py-2 rounded font-black text-xs uppercase tracking-widest shadow-[0_0_20px_rgba(220,38,38,0.6)] border-2 border-red-400 italic">
                    ALERTA: <span>{warning}</span>
                </div>
            </div>
        )}

        <form onSubmit={handleSubmit} className="flex gap-4">
          <div className="relative flex-1">
             <input
              ref={inputRef}
              type="text"
              inputMode="decimal"
              value={inputValue}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              disabled={status !== GameStatus.PLAYING}
              placeholder=""
              className={`w-full h-18 pl-6 pr-6 rounded border-2 bg-black/40 outline-none text-2xl font-black italic transition-all disabled:opacity-20 ${
                  warning 
                    ? 'border-red-500 text-red-500 shadow-[0_0_20px_rgba(239,68,68,0.2)]' 
                    : 'border-white/10 focus:border-purple-500 focus:bg-purple-500/5 text-white placeholder-white/20'
              }`}
            />
          </div>
          
          <button
            type="submit"
            disabled={!inputValue || status !== GameStatus.PLAYING}
            className="h-18 px-12 bg-[#7c3aed] hover:bg-[#8b5cf6] active:translate-y-1 text-white font-black italic text-xl uppercase tracking-tighter rounded shadow-[0_4px_0_#5b21b6] active:shadow-none transition-all disabled:opacity-20 disabled:active:translate-y-0"
          >
            DISPARAR
          </button>
        </form>
      </div>
    </div>
  );
};

export default GameControls;
