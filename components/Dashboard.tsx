
import React, { useEffect, useState } from 'react';
import { User, PlayerStats, RANKS } from '../types';
import { PlayIcon, ShieldIcon, TrophyIcon, ChartIcon, ClockIcon, MedalIcon, StarIcon } from './Icons';
import { getLeagues } from '../services/leagueService';
import { getPlayerDashboardStats } from '../services/rankingService';

interface DashboardProps {
  user: User;
  localStats: PlayerStats;
  onPlay: () => void;
  onOpenLeagues: () => void;
  onOpenRanking: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ user, localStats, onPlay, onOpenLeagues, onOpenRanking }) => {
  const [activeLeaguesCount, setActiveLeaguesCount] = useState<number | string>('...');
  const [globalRank, setGlobalRank] = useState<number | string>('...');
  const [lastPlayedDate, setLastPlayedDate] = useState<string | null>(null);
  const [bestRankName, setBestRankName] = useState<string>(localStats.bestRankName || 'CURIOSO');

  useEffect(() => {
    const loadDashboardData = async () => {
      const leagues = await getLeagues(user);
      setActiveLeaguesCount(leagues.filter(l => l.status === 'ACTIVE').length);
      const stats = await getPlayerDashboardStats(user);
      setGlobalRank(stats.rank);
      setLastPlayedDate(stats.lastPlayed);
      if (stats.bestRank) {
          setBestRankName(stats.bestRank.toUpperCase());
      }
    };
    loadDashboardData();
  }, [user, localStats.bestRankName]);

  const formatDate = (isoString: string | null) => {
    if (!isoString) return 'NUNCA';
    const date = new Date(isoString);
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }).toUpperCase();
  };

  // Calcula o número de estrelas baseado na patente atual
  const getStarCount = () => {
    // Procura o nível da patente pelo nome
    const rankEntry = Object.entries(RANKS).find(([_, info]) => 
        info.name.toUpperCase() === bestRankName.toUpperCase()
    );
    if (!rankEntry) return 0;
    const level = parseInt(rankEntry[0]);
    // Nível 1 (Curioso) = 0 estrelas. Nível 2 = 1 estrela, etc.
    return level - 1;
  };

  const stars = Array.from({ length: getStarCount() });

  return (
    <div className="w-full max-w-xl mx-auto animate-[fadeIn_0.5s_ease-out] pb-10">
      
      {/* Perfil de Jogador Autenticado */}
      <div className="flex items-center gap-6 mb-10 p-6 bg-white/5 border border-white/10 rounded-lg">
        <div className="w-24 h-24 bg-gradient-to-br from-[#7c3aed] to-indigo-800 rounded flex items-center justify-center shadow-[0_0_20px_rgba(124,58,237,0.4)] border-2 border-white/20">
             <span className="text-4xl font-black text-white italic">
                 {user.nickname.substring(0, 2).toUpperCase()}
             </span>
        </div>
        <div className="flex flex-col">
            <span className="text-[10px] font-black text-purple-400 uppercase tracking-[0.4em] mb-1">JOGADOR AUTENTICADO</span>
            <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-4xl font-black text-white italic tracking-tighter uppercase leading-none">
                    {user.nickname}
                </h2>
                {/* Renderização das Estrelas de Patente */}
                {stars.length > 0 && (
                    <div className="flex items-center gap-0.5 ml-1">
                        {stars.map((_, i) => (
                            <StarIcon 
                                key={i} 
                                className="w-6 h-6 text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.6)] animate-[fadeIn_0.3s_ease-out]" 
                                style={{ animationDelay: `${i * 100}ms` }}
                            />
                        ))}
                    </div>
                )}
            </div>
            <div className="flex items-center gap-2 mt-3">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.8)]"></div>
                <span className="text-[9px] font-black text-white/50 uppercase tracking-widest">NA ARENA DE BATALHA</span>
            </div>
        </div>
      </div>

      {/* Estatísticas HUD Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10">
        <div className="bg-white/5 p-5 rounded border border-white/10 flex flex-col items-center group transition-all hover:bg-white/10 border-purple-500/30">
            <MedalIcon className="w-5 h-5 text-purple-400 mb-3" />
            <span className="text-sm font-black text-white italic text-center leading-tight uppercase tracking-tighter">
                {bestRankName}
            </span>
            <span className="text-[8px] font-black text-white/40 uppercase tracking-[0.2em] mt-2 text-center">MAIOR PATENTE</span>
        </div>

        <div onClick={onOpenRanking} className="bg-white/5 p-5 rounded border border-white/10 flex flex-col items-center cursor-pointer group transition-all hover:bg-white/10 hover:border-blue-500/40">
            <ChartIcon className="w-5 h-5 text-blue-500 mb-3" />
            <span className="text-2xl font-black text-white italic">#{globalRank}</span>
            <span className="text-[8px] font-black text-white/40 uppercase tracking-[0.2em] mt-1 text-center">POS. GLOBAL</span>
        </div>

        <div onClick={onOpenLeagues} className="bg-white/5 p-5 rounded border border-white/10 flex flex-col items-center cursor-pointer group transition-all hover:bg-white/10 hover:border-green-500/40">
            <ShieldIcon className="w-5 h-5 text-green-500 mb-3" />
            <span className="text-2xl font-black text-white italic">{activeLeaguesCount}</span>
            <span className="text-[8px] font-black text-white/40 uppercase tracking-[0.2em] mt-1 text-center">LIGAS ATIVAS</span>
        </div>

        <div className="bg-white/5 p-5 rounded border border-white/10 flex flex-col items-center group transition-all hover:bg-white/10 hover:border-orange-500/40">
            <span className="text-xl mb-3">🔥</span>
            <span className="text-2xl font-black text-white italic">{localStats.bestStreak}</span>
            <span className="text-[8px] font-black text-white/40 uppercase tracking-[0.2em] mt-1 text-center">SEQUÊNCIA</span>
        </div>
      </div>

      {/* Ações Principais do Operador */}
      <div className="flex flex-col gap-4">
        <button 
            onClick={onPlay}
            className="w-full h-20 bg-[#7c3aed] hover:bg-[#8b5cf6] text-white rounded shadow-[0_6px_0_#5b21b6] active:translate-y-1 active:shadow-none flex items-center justify-center gap-4 transition-all group overflow-hidden relative"
        >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-[shimmer_2s_infinite]"></div>
            <div className="bg-white/20 p-3 rounded">
                <PlayIcon className="w-8 h-8 fill-white" />
            </div>
            <div className="flex flex-col items-start leading-none">
                <span className="text-3xl font-black italic tracking-tighter uppercase">INICIAR BATALHA</span>
                <span className="text-[9px] font-black text-purple-200 uppercase tracking-widest mt-1 opacity-70">NOVO DESAFIO DESIGNADO</span>
            </div>
        </button>

        <div className="grid grid-cols-2 gap-4">
            <button 
                onClick={onOpenLeagues}
                className="h-14 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded font-black italic uppercase text-xs tracking-widest transition-all"
            >
                GESTÃO DE LIGAS
            </button>
            <button 
                onClick={onOpenRanking}
                className="h-14 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded font-black italic uppercase text-xs tracking-widest transition-all"
            >
                RANKING GLOBAL
            </button>
        </div>
      </div>

      <div className="mt-12 flex items-center justify-center gap-3 text-[9px] font-black text-white/30 uppercase tracking-[0.3em] bg-white/[0.02] py-3 rounded-full border border-white/[0.05]">
        <ClockIcon className="w-3 h-3" />
        <span>ÚLTIMA SESSÃO: <span className="text-purple-400">{formatDate(lastPlayedDate)}</span></span>
      </div>

      <style>{`
        @keyframes shimmer {
          100% { transform: translateX(100%); }
        }
      `}</style>

    </div>
  );
};

export default Dashboard;
