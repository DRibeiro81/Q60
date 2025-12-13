import React, { useEffect, useState } from 'react';
import { CloseIcon, TrophyIcon, RefreshIcon } from './Icons';
import { fetchGlobalRanking, RankingEntry } from '../services/rankingService';

interface RankingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRestart?: () => void;
  showRestartButton?: boolean;
}

const RankingModal: React.FC<RankingModalProps> = ({ isOpen, onClose, onRestart, showRestartButton }) => {
  const [ranking, setRanking] = useState<RankingEntry[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      fetchGlobalRanking()
        .then(data => {
            setRanking(data);
            setLoading(false);
        })
        .catch(() => setLoading(false));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col max-h-[80vh]" onClick={e => e.stopPropagation()}>
        
        <div className="p-6 pb-4 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
                <TrophyIcon className="w-6 h-6 text-yellow-500" />
                <h2 className="text-xl font-bold text-gray-900">Ranking Global</h2>
            </div>
            <button onClick={onClose} className="p-2 text-gray-400 hover:bg-gray-100 rounded-full">
                <CloseIcon className="w-5 h-5" />
            </button>
        </div>

        <div className="overflow-y-auto p-4 scrollbar-hide min-h-[200px]">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-full py-10 space-y-3">
                <div className="w-8 h-8 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin"></div>
                <p className="text-gray-400 text-sm">Carregando placar...</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
                <thead>
                <tr>
                    <th className="py-2 pl-2 text-xs font-bold text-gray-400 uppercase tracking-wider">Pos</th>
                    <th className="py-2 text-xs font-bold text-gray-400 uppercase tracking-wider">Jogador</th>
                    <th className="py-2 pr-2 text-right text-xs font-bold text-gray-400 uppercase tracking-wider">Vitórias</th>
                </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                {ranking.map((entry, idx) => (
                    <tr 
                        key={idx} 
                        className={`
                            ${entry.isCurrentUser ? 'bg-purple-50' : 'hover:bg-gray-50'} 
                            transition-colors
                        `}
                    >
                    <td className="py-3 pl-2 w-12">
                        {idx === 0 ? (
                            <span className="flex items-center justify-center w-6 h-6 bg-yellow-100 text-yellow-700 rounded-full font-bold text-xs">1</span>
                        ) : idx === 1 ? (
                            <span className="flex items-center justify-center w-6 h-6 bg-gray-200 text-gray-700 rounded-full font-bold text-xs">2</span>
                        ) : idx === 2 ? (
                            <span className="flex items-center justify-center w-6 h-6 bg-orange-100 text-orange-800 rounded-full font-bold text-xs">3</span>
                        ) : (
                            <span className="flex items-center justify-center w-6 h-6 text-gray-500 font-medium text-xs">#{idx + 1}</span>
                        )}
                    </td>
                    <td className="py-3">
                        <div className="font-semibold text-gray-800 flex items-center gap-2">
                            {entry.nickname}
                            {entry.isCurrentUser && (
                                <span className="text-[10px] bg-purple-200 text-purple-800 px-1.5 py-0.5 rounded font-bold uppercase">Você</span>
                            )}
                        </div>
                        {entry.streak > 0 && <div className="text-[10px] text-green-600 font-medium">🔥 {entry.streak} seguidas</div>}
                    </td>
                    <td className="py-3 pr-2 text-right font-bold text-gray-900">{entry.wins}</td>
                    </tr>
                ))}
                </tbody>
            </table>
          )}
        </div>

        {showRestartButton && onRestart && (
            <div className="p-4 border-t border-gray-100 bg-gray-50">
                 <button
                    onClick={onRestart}
                    className="w-full h-12 flex items-center justify-center gap-2 bg-gray-900 hover:bg-gray-800 text-white font-bold rounded-xl transition-all active:scale-95"
                >
                    <RefreshIcon className="w-5 h-5" />
                    Jogar Novamente
                </button>
            </div>
        )}
      </div>
    </div>
  );
};

export default RankingModal;
