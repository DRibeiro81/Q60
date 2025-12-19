
import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { TrophyIcon, InfoIcon, ChartIcon, LogoutIcon, UserIcon, QuizLogo, ShieldIcon } from './Icons';
import LeaguesModal from './LeaguesModal';
import { getActivePlayersCount } from '../services/rankingService';

interface HeaderProps {
  user: User | null;
  streak: number;
  onShowInstructions: () => void;
  onShowRanking: () => void;
  onLogout: () => void;
}

const Header: React.FC<HeaderProps> = ({ user, streak, onShowInstructions, onShowRanking, onLogout }) => {
  const [showLeagues, setShowLeagues] = useState(false);
  const [onlinePlayers, setOnlinePlayers] = useState<number>(0);

  useEffect(() => {
    const updateOnline = async () => {
      const count = await getActivePlayersCount();
      setOnlinePlayers(count);
    };
    updateOnline();
    const interval = setInterval(updateOnline, 60000); // Atualiza a cada 1 min
    return () => clearInterval(interval);
  }, []);

  return (
    <>
      <header className="sticky top-0 z-10 bg-[#0f0a1a]/90 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-4xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            < QuizLogo className="w-12 h-12 drop-shadow-[0_0_10px_rgba(139,92,246,0.4)]" />
            <div className="flex flex-col justify-center">
              <h1 className="text-3xl font-black tracking-tighter text-white leading-none italic">
                  QUIZ<span className="text-purple-500">60</span>
              </h1>
              <span className="text-[9px] font-black text-purple-400 uppercase tracking-[0.2em] hidden sm:block">
                  Arena de Batalha v2.0
              </span>
            </div>
          </div>
          
          <div className="flex items-center gap-2 sm:gap-4">
            {user && (
              <div className="hidden md:flex items-center gap-3 bg-white/5 border border-white/10 px-4 py-2 rounded-md text-[10px] font-black text-white uppercase tracking-widest">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.8)]"></div>
                <span>Jogadores Online: {onlinePlayers}</span>
              </div>
            )}

            <button 
              onClick={() => setShowLeagues(true)}
              className="p-3 text-purple-400 bg-white/5 hover:bg-white/10 border border-white/10 rounded-md transition-all hover:scale-110"
              title="Ligas"
            >
              <ShieldIcon className="w-5 h-5" />
            </button>

            <button 
              onClick={onShowRanking}
              className="p-3 text-white/70 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded-md transition-all hover:scale-110"
              title="Ranking Global"
            >
              <ChartIcon className="w-5 h-5" />
            </button>

            <button 
              onClick={onShowInstructions}
              className="p-3 text-white/70 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded-md transition-all hover:scale-110"
              aria-label="Instruções"
            >
              <InfoIcon className="w-5 h-5" />
            </button>

            <div className="w-[1px] h-8 bg-white/10 mx-1"></div>

            {user ? (
              <div className="flex items-center gap-3 pl-2">
                  <div className="hidden sm:flex flex-col items-end leading-none">
                    <span className="text-[10px] font-black text-purple-400 uppercase tracking-widest mb-1">Jogador</span>
                    <span className="text-sm font-black text-white italic truncate max-w-[100px]">
                        {user.nickname}
                    </span>
                  </div>
                  <button 
                      onClick={onLogout}
                      className="p-3 text-red-400 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-md transition-all"
                      title="Sair"
                  >
                      <LogoutIcon className="w-5 h-5" />
                  </button>
              </div>
            ) : (
              <div className="w-10 h-10 bg-white/5 border border-white/10 rounded-md flex items-center justify-center text-white/30">
                  <UserIcon className="w-6 h-6" />
              </div>
            )}
          </div>
        </div>
      </header>
      
      <LeaguesModal 
        isOpen={showLeagues} 
        onClose={() => setShowLeagues(false)} 
        user={user}
      />
    </>
  );
};

export default Header;
