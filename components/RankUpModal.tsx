
import React from 'react';
import { RankInfo } from '../types';
import { MedalIcon, PlayIcon, ClockIcon, TargetIcon } from './Icons';

interface RankUpModalProps {
  rank: RankInfo | null;
  onClose: () => void;
}

const RankUpModal: React.FC<RankUpModalProps> = ({ rank, onClose }) => {
  if (!rank) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-[#0f0a1a]/95 backdrop-blur-2xl animate-[fadeIn_0.3s_ease-out]">
      <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] pointer-events-none"></div>
      
      <div className="bg-[#1a122e] border-4 border-purple-500 rounded-lg w-full max-w-lg overflow-hidden shadow-[0_0_100px_rgba(139,92,246,0.3)] animate-[scaleIn_0.4s_cubic-bezier(0.34,1.56,0.64,1)] flex flex-col items-center text-center p-10 relative">
        
        {/* Glow Effects */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-purple-600/20 blur-[80px] rounded-full"></div>
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-purple-600/20 blur-[80px] rounded-full"></div>

        <div className="bg-[#7c3aed] p-5 rounded-full shadow-[0_0_40px_rgba(124,58,237,0.6)] mb-6 animate-bounce">
            <MedalIcon className="w-12 h-12 text-white" />
        </div>

        <span className="text-purple-400 font-black text-[10px] uppercase tracking-[0.5em] mb-2 italic">SISTEMA DE PROGRESSÃO</span>
        <h2 className="text-3xl font-black text-white italic uppercase tracking-tighter mb-2 drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">
            Promovido
        </h2>
        
        <div className="h-1 w-24 bg-gradient-to-r from-transparent via-purple-500 to-transparent mb-6"></div>

        <p className="text-white/60 font-medium mb-8 text-xs max-w-xs">
            Suas habilidades em campo superaram as expectativas do comando. Você acaba de ser promovido para:
        </p>

        <div className="bg-white/5 border border-white/10 p-6 rounded-xl w-full mb-8 group transition-all hover:bg-white/10">
            <span className="text-[10px] font-black text-purple-400 uppercase tracking-widest block mb-2">NOVA PATENTE DESIGNADA</span>
            <span className="text-4xl font-black text-white italic tracking-tighter uppercase drop-shadow-[0_0_15px_rgba(139,92,246,0.5)]">
                {rank.name}
            </span>
        </div>

        {/* Tactical Updates */}
        <div className="grid grid-cols-2 gap-4 w-full mb-8">
            <div className="bg-black/40 p-4 rounded border border-white/5 flex flex-col items-center">
                <ClockIcon className="w-4 h-4 text-purple-400 mb-2" />
                <span className="text-[9px] font-black text-white/40 uppercase mb-1">BÔNUS TEMPO</span>
                <span className="text-lg font-black text-white italic">+{rank.timeBonus}s</span>
            </div>
            <div className="bg-black/40 p-4 rounded border border-white/5 flex flex-col items-center">
                <TargetIcon className="w-4 h-4 text-purple-400 mb-2" />
                <span className="text-[9px] font-black text-white/40 uppercase mb-1">CHANCES</span>
                <span className="text-lg font-black text-white italic">{rank.maxAttempts}</span>
            </div>
        </div>

        <button 
            onClick={onClose}
            className="w-full h-14 bg-[#7c3aed] hover:bg-[#8b5cf6] text-white rounded shadow-[0_4px_0_#5b21b6] active:translate-y-1 active:shadow-none flex items-center justify-center gap-4 transition-all group italic font-black text-xl tracking-tighter uppercase"
        >
            Assumir Posto
            <PlayIcon className="w-5 h-5 fill-white group-hover:translate-x-1 transition-transform" />
        </button>

      </div>
    </div>
  );
};

export default RankUpModal;
