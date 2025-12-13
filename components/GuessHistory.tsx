import React from 'react';
import { Guess, GuessState } from '../types';
import { ArrowUpIcon, ArrowDownIcon, CheckIcon } from './Icons';

interface GuessHistoryProps {
  guesses: Guess[];
}

const GuessHistory: React.FC<GuessHistoryProps> = ({ guesses }) => {
  // We want the latest guess at the top
  const sortedGuesses = [...guesses].reverse();

  return (
    <div className="w-full mt-6 space-y-2">
      {sortedGuesses.map((guess, idx) => (
        <div 
          key={`${guess.value}-${idx}`}
          className={`
            relative flex items-center justify-between p-3 px-4 rounded-xl border transition-all duration-300 animate-[fadeIn_0.3s_ease-out]
            ${guess.state === GuessState.CORRECT 
              ? 'bg-green-50 border-green-500 text-green-900 shadow-sm' 
              : 'bg-white border-gray-200 text-gray-700'
            }
          `}
        >
          {/* Valor Chutado */}
          <div className="flex-1 font-mono font-bold text-xl tracking-tight">
             {guess.value.toLocaleString('pt-BR')}
          </div>

          <div className="flex items-center gap-3">
            {/* Termômetro (Barra de Proximidade) */}
            {guess.state !== GuessState.CORRECT && (
              <div className="flex flex-col items-end gap-1 w-28 sm:w-36">
                <div className="h-2.5 w-full bg-gray-100 rounded-full overflow-hidden border border-gray-100">
                  <div 
                    className={`h-full rounded-full transition-all duration-500 ease-out ${
                      guess.proximity > 85 ? 'bg-gradient-to-r from-red-500 to-red-600' : 
                      guess.proximity > 50 ? 'bg-gradient-to-r from-orange-400 to-orange-500' :
                      guess.proximity > 20 ? 'bg-gradient-to-r from-yellow-300 to-yellow-400' : 'bg-blue-300'
                    }`}
                    style={{ width: `${Math.max(5, guess.proximity)}%` }}
                  />
                </div>
              </div>
            )}

            {/* Indicador de Direção */}
            <div className={`
              flex items-center justify-center w-8 h-8 rounded-lg
              ${guess.state === GuessState.CORRECT ? 'bg-green-500 text-white' : ''}
              ${guess.state === GuessState.HIGHER ? 'bg-gray-100 text-gray-600' : ''}
              ${guess.state === GuessState.LOWER ? 'bg-gray-100 text-gray-600' : ''}
            `}>
              {guess.state === GuessState.CORRECT && <CheckIcon className="w-5 h-5" />}
              {guess.state === GuessState.HIGHER && <ArrowUpIcon className="w-5 h-5" />}
              {guess.state === GuessState.LOWER && <ArrowDownIcon className="w-5 h-5" />}
            </div>
          </div>
        </div>
      ))}
      
      {guesses.length === 0 && (
          <div className="text-center py-8 text-gray-400 text-sm font-medium border-2 border-dashed border-gray-200 rounded-xl">
              Dê o seu primeiro palpite!
          </div>
      )}
    </div>
  );
};

export default GuessHistory;