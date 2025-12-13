import React from 'react';
import { TriviaQuestion, Guess, GameStatus, GuessState } from '../types';
import { TrophyIcon, RefreshIcon, XCircleIcon, ClockIcon, TargetIcon } from './Icons';

interface ResultModalProps {
  status: GameStatus;
  question: TriviaQuestion;
  guesses: Guess[];
  onPlayAgain: () => void;
  reason?: 'time' | 'attempts';
}

const ResultModal: React.FC<ResultModalProps> = ({ status, question, guesses, onPlayAgain, reason }) => {
  if (status !== GameStatus.WON && status !== GameStatus.LOST) return null;

  const isWin = status === GameStatus.WON;

  const handleShare = async () => {
    // Generate Emoji Grid similar to Wordle/Palpitada
    const emojis = guesses.map(g => {
        if (g.state === GuessState.CORRECT) return '✅';
        if (g.proximity > 80) return '🔥'; // Hot
        if (g.proximity > 50) return '🥵'; // Warm
        if (g.proximity > 20) return '😎'; // Cold
        return '🥶'; // Freezing
    }).join(' ');

    const title = isWin ? `Acertei em ${guesses.length} tentativas!` : `Não consegui desta vez...`;
    
    const text = `Quiz60 - ${question.category}\n\n${question.question}\n\n${emojis}\n\nJogue agora: ${window.location.origin}`;

    if (navigator.share) {
        try {
            await navigator.share({
                title: 'Quiz60',
                text: text,
            });
        } catch (err) {
            console.log('Share canceled');
        }
    } else {
        try {
            await navigator.clipboard.writeText(text);
            alert('Resultado copiado para a área de transferência! Cole no WhatsApp ou Twitter.');
        } catch (err) {
            alert('Erro ao copiar.');
        }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-[fadeIn_0.2s_ease-out]">
      <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-[scaleIn_0.3s_cubic-bezier(0.34,1.56,0.64,1)] flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className={`h-24 flex items-center justify-center relative overflow-hidden ${
            isWin ? 'bg-gradient-to-br from-green-400 to-emerald-600' : 'bg-gradient-to-br from-red-500 to-orange-600'
        }`}>
          <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
          {isWin ? (
              <TrophyIcon className="w-12 h-12 text-white drop-shadow-md animate-bounce" />
          ) : (
              <XCircleIcon className="w-12 h-12 text-white drop-shadow-md" />
          )}
        </div>

        <div className="p-6 text-center overflow-y-auto scrollbar-hide">
          <h2 className="text-3xl font-extrabold text-gray-800 mb-2">
            {isWin ? 'Acertou!' : 'Eliminado!'}
          </h2>
          
          {!isWin && (
             <div className="flex items-center justify-center gap-2 text-red-500 font-bold text-sm mb-6 uppercase tracking-wide bg-red-50 py-2 rounded-lg">
                {reason === 'time' ? (
                    <>
                        <ClockIcon className="w-4 h-4" />
                        <span>O tempo acabou</span>
                    </>
                ) : (
                    <>
                        <TargetIcon className="w-4 h-4" />
                        <span>Tentativas esgotadas</span>
                    </>
                )}
             </div>
          )}

          {isWin ? (
              <>
                <p className="text-gray-500 font-medium mb-6">
                    A resposta correta era <span className="text-gray-900 font-bold text-xl block mt-1">{question.answer.toLocaleString('pt-BR')}</span>
                </p>

                <div className="bg-gray-50 rounded-xl p-3 mb-6 text-left border border-gray-100">
                    <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Você sabia?</h3>
                    <p className="text-sm text-gray-700 leading-relaxed">
                    {question.context}
                    </p>
                </div>

                <div className="flex gap-3 mb-4">
                     <button
                        onClick={handleShare}
                        className="flex-1 h-12 flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white font-bold rounded-xl transition-all shadow-lg shadow-green-200 active:scale-95"
                    >
                        Compartilhar
                    </button>
                </div>

                <div className="mt-4">
                    <p className="text-sm font-semibold text-purple-600 mb-2">Próxima fase em...</p>
                    <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-purple-500 animate-[progress_8s_linear_forwards] origin-left"></div>
                    </div>
                    <style>{`
                        @keyframes progress {
                            from { width: 100%; }
                            to { width: 0%; }
                        }
                    `}</style>
                </div>
              </>
          ) : (
            /* Loss State */
            <div className="mb-6">
                <p className="text-gray-500 text-lg mb-4">
                    Você não conseguiu desta vez.
                </p>
                <div className="text-sm text-gray-400 animate-pulse">
                    Aguarde o ranking...
                </div>
                
                <button
                    onClick={onPlayAgain}
                    className="w-full mt-6 h-12 flex items-center justify-center gap-2 border border-gray-300 hover:bg-gray-50 text-gray-700 font-bold rounded-xl transition-all active:scale-95"
                >
                    <RefreshIcon className="w-5 h-5" />
                    Pular
                </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResultModal;