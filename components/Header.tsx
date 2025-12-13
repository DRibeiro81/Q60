import React from 'react';
import { User } from '../types';
import { TrophyIcon, InfoIcon, ChartIcon, LogoutIcon, UserIcon, QuizLogo } from './Icons';

interface HeaderProps {
  user: User | null;
  streak: number;
  onShowInstructions: () => void;
  onShowRanking: () => void;
  onLogout: () => void;
}

const Header: React.FC<HeaderProps> = ({ user, streak, onShowInstructions, onShowRanking, onLogout }) => {
  return (
    <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-gray-200">
      <div className="max-w-3xl mx-auto px-4 h-18 py-2 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <QuizLogo className="w-10 h-10 drop-shadow-sm" />
          <div className="flex flex-col justify-center">
            <h1 className="text-2xl font-black tracking-tighter text-gray-900 leading-none">
                QUIZ<span className="text-purple-600">60</span>
            </h1>
            <span className="text-[10px] font-extrabold text-purple-500 uppercase tracking-widest hidden sm:block">
                Rápido, simples e viciante!
            </span>
          </div>
        </div>
        
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="hidden sm:flex items-center gap-1 bg-gray-100 px-3 py-1 rounded-full text-sm font-medium text-gray-700">
            <TrophyIcon className="w-4 h-4 text-yellow-500" />
            <span>Série: {streak}</span>
          </div>

          <button 
            onClick={onShowRanking}
            className="p-2 text-gray-600 hover:bg-gray-100 rounded-full transition-colors relative group"
            title="Ranking"
          >
            <ChartIcon className="w-5 h-5" />
          </button>

          <button 
            onClick={onShowInstructions}
            className="p-2 text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
            aria-label="Instruções"
          >
            <InfoIcon className="w-5 h-5" />
          </button>

          <div className="w-px h-6 bg-gray-200 mx-1"></div>

          {user ? (
            <div className="flex items-center gap-2">
                <span className="hidden sm:block text-sm font-semibold text-gray-700 max-w-[100px] truncate">
                    {user.nickname}
                </span>
                <button 
                    onClick={onLogout}
                    className="p-2 text-red-500 hover:bg-red-50 rounded-full transition-colors"
                    title="Sair"
                >
                    <LogoutIcon className="w-5 h-5" />
                </button>
            </div>
          ) : (
            <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-gray-400">
                <UserIcon className="w-5 h-5" />
            </div>
          )}
        </div>
      </div>
      {/* Mobile Slogan */}
      <div className="sm:hidden w-full bg-purple-50 border-b border-purple-100 py-1.5 text-center">
         <span className="text-[10px] font-extrabold text-purple-600 uppercase tracking-widest">
            Rápido, simples e viciante!
        </span>
      </div>
    </header>
  );
};

export default Header;