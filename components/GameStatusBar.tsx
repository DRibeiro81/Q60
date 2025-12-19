
import React from 'react';
import { ClockIcon, TargetIcon, MedalIcon } from './Icons';
import { RankInfo } from '../types';

interface GameStatusBarProps {
  timeLeft: number;
  attemptsLeft: number;
  maxAttempts: number;
  rank?: RankInfo;
}

const GameStatusBar: React.FC<GameStatusBarProps> = ({ timeLeft, attemptsLeft, maxAttempts, rank }) => {
  const timerStatus = timeLeft <= 10 ? 'text-red-500 bg-red-500/10 border-red-500/40 animate-pulse' : 'text-purple-400 bg-purple-500/10 border-purple-500/40';
  const attemptsStatus = attemptsLeft <= 3 ? 'text-orange-500 bg-orange-500/10 border-orange-500/40' : 'text-blue-400 bg-blue-500/10 border-blue-500/40';

  return (
    <div className="flex flex-col gap-3 w-full max-w-4xl mx-auto px-6 mt-8">
      
      {/* Badge de Patente Estilo ApeWar */}
      {rank && (
        <div className="flex items-center justify-between bg-white/5 border border-white/10 px-6 py-3 rounded-lg shadow-[inset_0_0_20px_rgba(0,0,0,0.5)] animate-[fadeIn_0.3s_ease-out]">
            <div className="flex items-center gap-4">
                <div className="bg-[#7c3aed] p-2 rounded text-white shadow-[0_0_15px_rgba(124,58,237,0.5)]">
                    <MedalIcon className="w-5 h-5" />
                </div>
                <div className="flex flex-col">
                    <span className="text-[9px] font-black text-purple-400 uppercase tracking-[0.3em] leading-none mb-1">PATENTE DE BATALHA {rank.level}</span>
                    <span className="text-lg font-black text-white italic leading-tight uppercase tracking-tighter">{rank.name}</span>
                </div>
            </div>
            <div className="flex flex-col items-end">
                <span className="text-[9px] font-black text-white/40 uppercase tracking-widest mb-1">DIFICULDADE</span>
                <span className="text-xs font-black text-[#7c3aed] uppercase italic">{rank.difficulty.toUpperCase()}</span>
            </div>
        </div>
      )}

      <div className="flex gap-4">
        {/* HUD Cronômetro */}
        <div className={`flex-1 flex items-center justify-center gap-4 py-4 rounded-lg border-2 transition-all duration-300 ${timerStatus}`}>
            <ClockIcon className="w-6 h-6" />
            <div className="flex flex-col items-start leading-none">
                <span className="text-[9px] font-black uppercase tracking-[0.2em] opacity-60 mb-1">TEMPO RESTANTE</span>
                <span className="text-3xl font-black tabular-nums italic tracking-tighter">{timeLeft}s</span>
            </div>
        </div>

        {/* HUD Tentativas */}
        <div className={`flex-1 flex items-center justify-center gap-4 py-4 rounded-lg border-2 transition-all duration-300 ${attemptsStatus}`}>
            <TargetIcon className="w-6 h-6" />
            <div className="flex flex-col items-start leading-none">
                <span className="text-[9px] font-black uppercase tracking-[0.2em] opacity-60 mb-1">CHANCES</span>
                <span className="text-3xl font-black tabular-nums italic tracking-tighter">{attemptsLeft}/{maxAttempts}</span>
            </div>
        </div>
      </div>

    </div>
  );
};

export default GameStatusBar;