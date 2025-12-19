
import React from 'react';
import { Guess, GuessState } from '../types';
import { ArrowUpIcon, ArrowDownIcon, CheckIcon } from './Icons';

interface GuessHistoryProps {
  guesses: Guess[];
}

const GuessHistory: React.FC<GuessHistoryProps> = ({ guesses }) => {
  const lastGuess = guesses.length > 0 ? guesses[guesses.length - 1] : null;

  return (
    <div className="w-full mt-10 flex justify-center">
      {lastGuess ? (
        <div 
          key={`${lastGuess.value}-${lastGuess.timestamp}`}
          className={`
            relative flex items-center justify-between p-6 px-8 rounded-lg border-2 transition-all duration-300 animate-[fadeIn_0.3s_ease-out] w-full max-w-xl shadow-[0_10px_30px_rgba(0,0,0,0.5)]
            ${lastGuess.state === GuessState.CORRECT 
              ? 'bg-green-500/10 border-green-500 text-green-400 shadow-[0_0_20px_rgba(34,197,94,0.3)]' 
              : 'bg-white/5 border-white/10 text-white'
            }
          `}
        >
          {/* Último Alvo */}
          <div className="flex flex-col">
            <span className="text-[9px] font-black uppercase tracking-[0.3em] text-white/40 mb-2">ÚLTIMO ALVO</span>
            <div className="font-black text-5xl tracking-tighter italic">
                {lastGuess.value.toLocaleString('pt-BR')}
            </div>
          </div>

          <div className="flex items-center gap-8">
            {/* Medidor de Precisão */}
            {lastGuess.state !== GuessState.CORRECT && (
              <div className="flex flex-col items-end gap-2 w-36 sm:w-48">
                <span className="text-[9px] font-black text-white/40 uppercase tracking-widest">PRECISÃO</span>
                <div className="h-4 w-full bg-black/40 rounded border border-white/10 overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-700 ease-out shadow-[0_0_10px_rgba(255,255,255,0.2)] ${
                      lastGuess.proximity > 85 ? 'bg-[#7c3aed]' : 
                      lastGuess.proximity > 50 ? 'bg-purple-600' :
                      lastGuess.proximity > 20 ? 'bg-purple-800' : 'bg-white/20'
                    }`}
                    style={{ width: `${Math.max(5, lastGuess.proximity)}%` }}
                  />
                </div>
              </div>
            )}

            {/* Ícone de Status de Combate */}
            <div className={`
              flex flex-col items-center justify-center w-20 h-20 rounded border-4
              ${lastGuess.state === GuessState.CORRECT ? 'bg-green-500 border-green-400 text-white shadow-[0_0_30px_rgba(34,197,94,0.5)]' : ''}
              ${lastGuess.state === GuessState.HIGHER ? 'bg-purple-600/20 border-purple-500 text-purple-400' : ''}
              ${lastGuess.state === GuessState.LOWER ? 'bg-purple-600/20 border-purple-500 text-purple-400' : ''}
            `}>
              {lastGuess.state === GuessState.CORRECT && <CheckIcon className="w-10 h-10" />}
              {lastGuess.state === GuessState.HIGHER && <ArrowUpIcon className="w-12 h-12 animate-bounce" />}
              {lastGuess.state === GuessState.LOWER && <ArrowDownIcon className="w-12 h-12 animate-bounce" />}
            </div>
          </div>
        </div>
      ) : (
          <div className="text-center py-16 px-10 text-white/20 text-xs font-black uppercase tracking-[0.4em] border-2 border-dashed border-white/10 rounded-xl w-full max-w-xl bg-white/[0.02] italic">
              <p>AGUARDANDO COORDENADAS...</p>
              <p className="text-purple-500 mt-2 animate-pulse">DISPARE SEU PRIMEIRO PALPITE!</p>
          </div>
      )}
    </div>
  );
};

export default GuessHistory;