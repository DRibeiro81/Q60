import React from 'react';
import { ShieldIcon, TrophyIcon, ShareIcon } from './Icons';

interface LeagueOnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: () => void;
  onJoin: () => void;
}

const LeagueOnboardingModal: React.FC<LeagueOnboardingModalProps> = ({ isOpen, onClose, onCreate, onJoin }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md" onClick={onClose}>
      <div className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl animate-[scaleIn_0.3s_cubic-bezier(0.34,1.56,0.64,1)] relative" onClick={e => e.stopPropagation()}>
        
        <div className="bg-purple-600 h-32 relative overflow-hidden flex items-center justify-center">
             <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
             <TrophyIcon className="w-16 h-16 text-white animate-bounce" />
        </div>

        <div className="p-8 text-center">
          <h2 className="text-2xl font-black text-gray-900 mb-2">
            Competição entre Amigos!
          </h2>
          <p className="text-gray-500 mb-6 leading-relaxed">
            Agora você pode criar <strong>Ligas Privadas</strong> no Quiz60. Convide amigos, defina um prazo e veja quem faz mais pontos!
          </p>

          <div className="grid grid-cols-2 gap-3 mb-6">
              <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 flex flex-col items-center gap-2">
                  <ShieldIcon className="w-6 h-6 text-purple-600" />
                  <span className="text-xs font-bold text-gray-600">Ranking Privado</span>
              </div>
              <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 flex flex-col items-center gap-2">
                  <ShareIcon className="w-6 h-6 text-green-600" />
                  <span className="text-xs font-bold text-gray-600">Convite Fácil</span>
              </div>
          </div>

          <div className="flex flex-col gap-3">
            <button 
                onClick={onCreate}
                className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl shadow-lg shadow-purple-200 transition-all active:scale-95"
            >
                Criar Minha Liga
            </button>
            <button 
                onClick={onJoin}
                className="w-full py-3 bg-white border-2 border-purple-100 text-purple-700 font-bold rounded-xl hover:bg-purple-50 transition-all active:scale-95"
            >
                Entrar com Código
            </button>
            <button 
                onClick={onClose}
                className="text-xs font-bold text-gray-400 mt-2 hover:text-gray-600"
            >
                Agora não
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeagueOnboardingModal;
