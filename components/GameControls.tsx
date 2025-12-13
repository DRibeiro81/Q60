import React, { useState, useEffect, useRef } from 'react';
import { GameStatus } from '../types';

interface GameControlsProps {
  onGuess: (value: number) => void;
  status: GameStatus;
  unit: string;
}

const GameControls: React.FC<GameControlsProps> = ({ onGuess, status, unit }) => {
  const [inputValue, setInputValue] = useState('');
  const [warning, setWarning] = useState(''); 
  const inputRef = useRef<HTMLInputElement>(null);
  const warningTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    // Focus input on mount and after submission if still playing
    if (status === GameStatus.PLAYING) {
      inputRef.current?.focus();
    }
  }, [status]);

  const showWarning = (msg: string) => {
      setWarning(msg);
      if (warningTimeoutRef.current) clearTimeout(warningTimeoutRef.current);
      // Remove o aviso automaticamente após 3 segundos
      warningTimeoutRef.current = window.setTimeout(() => setWarning(''), 3000);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value;
      
      // Regex para permitir apenas números, pontos, vírgulas e sinal de menos.
      // Se a string for vazia ou bater com o regex, aceita.
      if (val === '' || /^[0-9.,-]*$/.test(val)) {
          setInputValue(val);
          // Se o usuário estava com aviso e digitou certo, limpa o aviso
          if (warning) setWarning(''); 
      } else {
          // Se tentou digitar letra ou símbolo inválido
          showWarning('As respostas são sempre números.');
      }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue) return;

    // Normalizar entrada (pt-BR: 1.000,00 -> 1000.00)
    // Remove pontos de milhar e troca vírgula decimal por ponto
    const cleanValue = inputValue.replace(/\./g, '').replace(/,/g, '.');
    const num = parseFloat(cleanValue);

    if (isNaN(num)) {
      showWarning('Por favor, digite um número válido.');
      setInputValue('');
      return;
    }

    onGuess(Math.round(num)); // Assuming integer answers for now
    setInputValue('');
    setWarning('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSubmit(e);
    }
  };

  return (
    <div className="fixed bottom-0 left-0 w-full bg-white border-t border-gray-200 p-4 pb-8 sm:pb-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] z-20">
      <div className="max-w-3xl mx-auto w-full relative">
        
        {/* Aviso Flutuante */}
        {warning && (
            <div className="absolute -top-12 left-0 w-full flex justify-center animate-[fadeIn_0.2s_ease-out]">
                <div className="bg-red-100 text-red-600 px-4 py-2 rounded-lg text-sm font-bold shadow-sm border border-red-200 flex items-center gap-2">
                    ⚠️ <span>{warning}</span>
                </div>
            </div>
        )}

        <form onSubmit={handleSubmit} className="flex gap-3">
          <div className="relative flex-1">
             <input
              ref={inputRef}
              type="text" // Mudado para text para permitir validação customizada
              inputMode="decimal" // Garante teclado numérico no mobile
              value={inputValue}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              disabled={status !== GameStatus.PLAYING}
              placeholder="Digite seu palpite..."
              className={`w-full h-14 pl-4 pr-12 rounded-xl border-2 bg-white outline-none text-xl font-bold transition-all disabled:opacity-50 disabled:bg-gray-100 ${
                  warning 
                    ? 'border-red-400 focus:border-red-500 focus:ring-red-100 text-red-900' 
                    : 'border-gray-300 focus:border-purple-600 focus:ring-4 focus:ring-purple-100 text-blue-900'
              }`}
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium pointer-events-none text-sm">
              {unit}
            </span>
          </div>
          
          <button
            type="submit"
            disabled={!inputValue || status !== GameStatus.PLAYING}
            className="h-14 px-8 bg-purple-600 hover:bg-purple-700 active:scale-95 text-white font-bold rounded-xl shadow-lg shadow-purple-200 transition-all disabled:opacity-50 disabled:shadow-none disabled:active:scale-100"
          >
            Palpitar
          </button>
        </form>
      </div>
    </div>
  );
};

export default GameControls;