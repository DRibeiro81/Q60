import React from 'react';
import { ClockIcon, TargetIcon } from './Icons';

interface GameStatusBarProps {
  timeLeft: number;
  attemptsLeft: number;
  maxAttempts: number;
}

const GameStatusBar: React.FC<GameStatusBarProps> = ({ timeLeft, attemptsLeft, maxAttempts }) => {
  // Color logic for timer
  const timerColor = timeLeft <= 10 ? 'text-red-600 bg-red-100' : 'text-gray-700 bg-gray-100';
  
  // Color logic for attempts
  const attemptsColor = attemptsLeft <= 3 ? 'text-orange-600 bg-orange-100' : 'text-gray-700 bg-gray-100';

  return (
    <div className="flex gap-4 w-full max-w-3xl mx-auto px-4 mt-4">
      {/* Timer */}
      <div className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl transition-colors duration-300 ${timerColor}`}>
        <ClockIcon className="w-5 h-5" />
        <div className="flex flex-col items-start leading-none">
            <span className="text-[10px] font-bold uppercase tracking-wider opacity-60">Tempo</span>
            <span className="text-xl font-black tabular-nums">{timeLeft}s</span>
        </div>
      </div>

      {/* Attempts */}
      <div className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl transition-colors duration-300 ${attemptsColor}`}>
        <TargetIcon className="w-5 h-5" />
         <div className="flex flex-col items-start leading-none">
            <span className="text-[10px] font-bold uppercase tracking-wider opacity-60">Tentativas</span>
            <span className="text-xl font-black tabular-nums">{attemptsLeft}/{maxAttempts}</span>
        </div>
      </div>
    </div>
  );
};

export default GameStatusBar;
