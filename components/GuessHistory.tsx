import React from 'react';
import { Guess, GuessState } from '../types';
import { ArrowUpIcon, ArrowDownIcon, CheckIcon } from './Icons';

interface GuessHistoryProps {
  guesses: Guess[];
}

const GuessHistory: React.FC<GuessHistoryProps> = ({ guesses }) => {
  // We want ONLY the latest guess
  // Guesses are added to the end of the array in App.tsx
  const lastGuess = guesses.length > 0 ? guesses[guesses.length - 1] : null;

  return (
    <div className="w-full mt-6 flex justify-center">
      {lastGuess ? (
        <div 
          key={`${lastGuess.value}-${lastGuess.timestamp}`}
          className={`
            relative flex items-center justify-between p-4 px-6 rounded-2xl border transition-all duration-300 animate-[fadeIn_0.3s_ease-out] w-full max-w-lg shadow-sm
            ${lastGuess.state === GuessState.CORRECT 
              ? 'bg-green-50 border-green-500 text-green-900 shadow-md ring-2 ring-green-100' 
              : 'bg-white border-gray-300 text-gray-800'
            }
          `}
        >
          {/* Valor Chutado */}
          <div className="flex flex-col">
            <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">Seu Palpite</span>
            <div className="font-mono font-black text-3xl tracking-tight">
                {lastGuess.value.toLocaleString('pt-BR')}
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Termômetro (Barra de Proximidade) */}
            {lastGuess.state !== GuessState.CORRECT && (
              <div className="flex flex-col items-end gap-1 w-32 sm:w-40">
                <span className="text-[10px] font-bold text-gray-400 uppercase">Proximidade</span>
                <div className="h-3 w-full bg-gray-100 rounded-full overflow-hidden border border-gray-200">
                  <div 
                    className={`h-full rounded-full transition-all duration-500 ease-out ${
                      lastGuess.proximity > 85 ? 'bg-gradient-to-r from-red-500 to-red-600' : 
                      lastGuess.proximity > 50 ? 'bg-gradient-to-r from-orange-400 to-orange-500' :
                      lastGuess.proximity > 20 ? 'bg-gradient-to-r from-yellow-300 to-yellow-400' : 'bg-blue-300'
                    }`}
                    style={{ width: `${Math.max(5, lastGuess.proximity)}%` }}
                  />
                </div>
              </div>
            )}

            {/* Indicador de Direção */}
            <div className={`
              flex flex-col items-center justify-center w-14 h-14 rounded-xl border-2
              ${lastGuess.state === GuessState.CORRECT ? 'bg-green-500 border-green-600 text-white' : ''}
              ${lastGuess.state === GuessState.HIGHER ? 'bg-purple-50 border-purple-100 text-purple-600' : ''}
              ${lastGuess.state === GuessState.LOWER ? 'bg-purple-50 border-purple-100 text-purple-600' : ''}
            `}>
              {lastGuess.state === GuessState.CORRECT && <CheckIcon className="w-8 h-8" />}
              {lastGuess.state === GuessState.HIGHER && <ArrowUpIcon className="w-8 h-8 animate-bounce" />}
              {lastGuess.state === GuessState.LOWER && <ArrowDownIcon className="w-8 h-8 animate-bounce" />}
            </div>
          </div>
        </div>
      ) : (
          <div className="text-center py-10 px-6 text-gray-400 text-sm font-medium border-2 border-dashed border-gray-200 rounded-2xl w-full max-w-lg bg-gray-50/50">
              <p>O que você está esperando?</p>
              <p className="text-purple-500 font-bold mt-1">Dê o seu primeiro palpite!</p>
          </div>
      )}
    </div>
  );
};

export default GuessHistory;