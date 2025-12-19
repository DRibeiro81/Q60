
import React, { useState } from 'react';
import { TriviaQuestion, Guess, GameStatus } from '../types';
import { TrophyIcon, RefreshIcon, XCircleIcon, ClockIcon, TargetIcon, PlayIcon, ShareIcon, CheckIcon } from './Icons';

interface ResultModalProps {
  status: GameStatus;
  question: TriviaQuestion;
  guesses: Guess[];
  onPlayAgain: () => void;
  onNextLevel?: () => void;
  reason?: 'time' | 'attempts';
  score?: number;
}

const ResultModal: React.FC<ResultModalProps> = ({ status, question, guesses, onPlayAgain, onNextLevel, reason, score }) => {
  const [copied, setCopied] = useState(false);

  if (status !== GameStatus.WON && status !== GameStatus.LOST) return null;

  const isWin = status === GameStatus.WON;

  const handleShare = () => {
    const emoji = isWin ? '🏆' : '💀';
    const text = `Relatório de Batalha Quiz60 ${emoji}\n\nPontuação Elite: ${score}\nMissão: ${question.category}\n\nEntre na Arena: https://www.quiz60.com.br`;
    if (navigator.share) {
        navigator.share({ title: 'Quiz60 - Resultados de Batalha', text }).catch(() => {});
    } else {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0f0a1a]/95 backdrop-blur-xl animate-[fadeIn_0.2s_ease-out]">
      <div className="bg-[#1a122e] border-4 border-white/10 rounded-lg w-full max-w-lg overflow-hidden shadow-[0_0_100px_rgba(0,0,0,1)] animate-[scaleIn_0.3s_cubic-bezier(0.34,1.56,0.64,1)] flex flex-col">
        
        {/* Banner de Resultado */}
        <div className={`h-40 flex flex-col items-center justify-center relative overflow-hidden ${
            isWin ? 'bg-green-600/20' : 'bg-red-600/20'
        }`}>
          <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
          {isWin ? (
              <>
                <TrophyIcon className="w-16 h-16 text-green-500 drop-shadow-[0_0_15px_rgba(34,197,94,0.6)] animate-bounce mb-3" />
                <h2 className="text-6xl font-black italic text-white uppercase tracking-tighter drop-shadow-[0_2px_0_#166534]">CORRETO</h2>
              </>
          ) : (
              <>
                <XCircleIcon className="w-16 h-16 text-red-500 drop-shadow-[0_0_15px_rgba(239,68,68,0.6)] mb-3" />
                <h2 className="text-6xl font-black italic text-white uppercase tracking-tighter drop-shadow-[0_2px_0_#991b1b]">VOCÊ PERDEU</h2>
              </>
          )}
        </div>

        <div className="p-10 text-center">
          {!isWin && (
             <div className="flex items-center justify-center gap-3 text-red-400 font-black text-[10px] mb-8 uppercase tracking-[0.3em] bg-red-500/10 py-3 rounded border border-red-500/20 italic">
                {reason === 'time' ? (
                    <><ClockIcon className="w-4 h-4" /><span>TEMPO TÁTICO ESGOTADO</span></>
                ) : (
                    <><TargetIcon className="w-4 h-4" /><span>RECURSOS ESGOTADOS</span></>
                )}
             </div>
          )}

          {isWin ? (
              <>
                <p className="text-white/40 font-black text-[10px] uppercase tracking-widest mb-2">INTELIGÊNCIA DECODIFICADA</p>
                <span className="text-5xl font-black text-white italic tracking-tighter mb-8 block">{question.answer.toLocaleString('pt-BR')} {question.unit.toLowerCase()}</span>

                <div className="bg-black/40 rounded border border-white/10 p-5 mb-10 text-left">
                    <h3 className="text-[9px] font-black text-purple-400 uppercase tracking-widest mb-3">RELATÓRIO DE INTELIGÊNCIA</h3>
                    <p className="text-sm text-white/80 leading-relaxed font-medium italic">
                    "{question.context}"
                    </p>
                </div>

                <div className="flex gap-4">
                     <button
                        onClick={onNextLevel}
                        className="flex-1 h-16 flex items-center justify-center gap-3 bg-green-600 hover:bg-green-500 text-white font-black italic text-xl uppercase tracking-tighter rounded shadow-[0_4px_0_#166534] active:translate-y-1 active:shadow-none transition-all"
                    >
                        <span>PRÓXIMA MISSÃO</span>
                        <PlayIcon className="w-6 h-6 fill-white" />
                    </button>
                    
                    <button
                        onClick={handleShare}
                        className="w-16 h-16 flex items-center justify-center bg-white/5 hover:bg-white/10 text-white rounded border border-white/10 transition-all active:scale-95"
                    >
                        {copied ? <CheckIcon className="w-8 h-8 text-green-500" /> : <ShareIcon className="w-8 h-8" />}
                    </button>
                </div>

                <div className="mt-8">
                    <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full bg-green-500 animate-[progress_8s_linear_forwards] origin-left"></div>
                    </div>
                </div>
              </>
          ) : (
            <div className="mb-8">
                <div className="bg-white/5 p-8 rounded border border-white/10 mb-8 shadow-inner">
                    <span className="text-[10px] font-black text-purple-400 uppercase tracking-[0.4em] block mb-2">RESULTADO DA MISSÃO</span>
                    <div className="flex items-center justify-center gap-2">
                        <span className="text-6xl font-black text-white italic tracking-tighter">{score || 0}</span>
                        <span className="text-xs font-black text-white/30 uppercase italic mt-4">PONTOS</span>
                    </div>
                </div>
                
                <div className="flex gap-4">
                    <button
                        onClick={onPlayAgain}
                        className="flex-1 h-16 flex items-center justify-center gap-3 border-2 border-white/10 hover:border-white/20 hover:bg-white/5 text-white font-black italic uppercase text-sm tracking-widest rounded transition-all"
                    >
                        <RefreshIcon className="w-5 h-5" />
                        VOLTAR AO LOBBY
                    </button>

                    <button
                        onClick={handleShare}
                        className="flex-1 h-16 flex items-center justify-center gap-3 bg-[#7c3aed] hover:bg-[#8b5cf6] text-white font-black italic uppercase text-sm tracking-widest rounded shadow-[0_4px_0_#5b21b6] active:translate-y-1 active:shadow-none transition-all"
                    >
                        {copied ? 'CAPTURADO' : 'COMPARTILHAR'}
                        {!copied && <ShareIcon className="w-5 h-5" />}
                    </button>
                </div>
            </div>
          )}
        </div>
      </div>
      <style>{`
          @keyframes progress { from { width: 100%; } to { width: 0%; } }
      `}</style>
    </div>
  );
};

export default ResultModal;
