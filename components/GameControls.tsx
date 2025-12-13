import React, { useState, useEffect, useRef } from 'react';
import { GameStatus } from '../types';

interface GameControlsProps {
  onGuess: (value: number) => void;
  status: GameStatus;
  unit: string;
}

const GameControls: React.FC<GameControlsProps> = ({ onGuess, status, unit }) => {
  const [inputValue, setInputValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Focus input on mount and after submission if still playing
    if (status === GameStatus.PLAYING) {
      inputRef.current?.focus();
    }
  }, [status]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue) return;

    const num = parseFloat(inputValue.replace(/\./g, '').replace(/,/g, '.'));
    if (!isNaN(num)) {
      onGuess(Math.round(num)); // Assuming integer answers for now
      setInputValue('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSubmit(e);
    }
  };

  return (
    <div className="fixed bottom-0 left-0 w-full bg-white border-t border-gray-200 p-4 pb-8 sm:pb-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] z-20">
      <div className="max-w-3xl mx-auto w-full">
        <form onSubmit={handleSubmit} className="flex gap-3">
          <div className="relative flex-1">
             <input
              ref={inputRef}
              type="number"
              inputMode="decimal"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={status !== GameStatus.PLAYING}
              placeholder="Digite seu palpite..."
              className="w-full h-14 pl-4 pr-12 rounded-xl border-2 border-gray-300 bg-white focus:border-purple-600 focus:ring-4 focus:ring-purple-100 outline-none text-xl font-bold text-blue-900 placeholder-gray-400 transition-all disabled:opacity-50 disabled:bg-gray-100"
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
