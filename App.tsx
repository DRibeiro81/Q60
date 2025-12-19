
import React, { useState, useEffect, useCallback, useRef } from 'react';
import Header from './components/Header';
import GameControls from './components/GameControls';
import ResultModal from './components/ResultModal';
import RankUpModal from './components/RankUpModal';
import InfoModal from './components/InfoModal';
import AuthModal from './components/AuthModal';
import RankingModal from './components/RankingModal';
import LeaguesModal from './components/LeaguesModal';
import LeagueOnboardingModal from './components/LeagueOnboardingModal';
import GameStatusBar from './components/GameStatusBar';
import EmailToast from './components/EmailToast';
import Dashboard from './components/Dashboard';
import { ChevronRightIcon, QuizLogo, SpeakerIcon, SpeakerOffIcon, ArrowUpIcon, ArrowDownIcon } from './components/Icons';
import { fetchDailyTrivia } from './services/geminiService';
import { getUser, saveUser, logoutUser, getStats, updateStats, addQuestionToHistory } from './services/storageService';
import { updatePlayerScore } from './services/rankingService';
import { syncUserHistory, saveQuestionRemote } from './services/historyService';
import { updateLeagueProgress } from './services/leagueService';
import { playSound } from './services/soundService';
import { TriviaQuestion, Guess, GameStatus, GuessState, User, PlayerStats, RANKS, RankInfo } from './types';

const INITIAL_TIME = 60;

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [stats, setStats] = useState<PlayerStats>({ wins: 0, streak: 0, bestStreak: 0, gamesPlayed: 0, bestRankName: 'Curioso' });
  const [question, setQuestion] = useState<TriviaQuestion | null>(null);
  const [guesses, setGuesses] = useState<Guess[]>([]);
  const [gameStatus, setGameStatus] = useState<GameStatus>(GameStatus.LOADING);
  
  const [timeLeft, setTimeLeft] = useState(INITIAL_TIME);
  const [attemptsLeft, setAttemptsLeft] = useState(10);
  const [startCountdown, setStartCountdown] = useState(5);
  
  const [score, setScore] = useState(0);
  const scoreRef = useRef(0);

  const timerRef = useRef<number | null>(null);
  const nextLevelTimerRef = useRef<number | null>(null);
  
  const [lossReason, setLossReason] = useState<'time' | 'attempts'>('time');
  const [opacityClass, setOpacityClass] = useState('opacity-100');

  const [isSoundEnabled, setIsSoundEnabled] = useState(true);
  const [showInfo, setShowInfo] = useState(false);
  const [showRanking, setShowRanking] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [showLeagues, setShowLeagues] = useState(false);
  const [showLeagueOnboarding, setShowLeagueOnboarding] = useState(false);
  
  const [currentRank, setCurrentRank] = useState<RankInfo>(RANKS[1]);
  const [pendingRankUp, setPendingRankUp] = useState<RankInfo | null>(null);
  const [rankUpToDisplay, setRankUpToDisplay] = useState<RankInfo | null>(null);

  const lastGuess = guesses.length > 0 ? guesses[guesses.length - 1] : null;

  // Lógica de monitoramento de ranking e promoção (Sequenciamento: Detecta e guarda como pendente)
  useEffect(() => {
      const rankLevel = Math.min(10, Math.floor(score / 5) + 1);
      const newRank = RANKS[rankLevel];
      
      if (newRank.level > currentRank.level) {
          // PROMOÇÃO DETECTADA - Guardar como pendente para mostrar APÓS a tela de acerto
          setCurrentRank(newRank);
          setPendingRankUp(newRank);
          
          if (user) {
              const updatedStats = updateStats(false, newRank.name);
              setStats(updatedStats);
              updatePlayerScore(user, scoreRef.current, updatedStats.streak, newRank.name);
          }
      } else if (newRank.level !== currentRank.level) {
          setCurrentRank(newRank);
      }
  }, [score, currentRank.level, user]);

  useEffect(() => {
    if (gameStatus === GameStatus.LOADING || gameStatus === GameStatus.READY) {
        setAttemptsLeft(currentRank.maxAttempts);
    }
  }, [currentRank, gameStatus]);
  
  useEffect(() => {
    const loadedUser = getUser();
    const loadedStats = getStats();
    if (loadedUser) {
      setUser(loadedUser);
      syncUserHistory(loadedUser.nickname);
    }
    setStats(loadedStats);
  }, []);

  const playSfx = useCallback((type: 'correct' | 'wrong' | 'start' | 'win' | 'lose' | 'tick') => {
    if (isSoundEnabled) {
      playSound(type);
    }
  }, [isSoundEnabled]);

  useEffect(() => {
    let interval: number;
    if (gameStatus === GameStatus.COUNTDOWN) {
        if (startCountdown > 0) {
            playSfx('tick');
            interval = window.setTimeout(() => {
                setStartCountdown(prev => prev - 1);
            }, 1000);
        } else {
            playSfx('start');
            setGameStatus(GameStatus.PLAYING);
            setTimeout(() => setOpacityClass('opacity-100'), 50);
        }
    }
    return () => clearTimeout(interval);
  }, [gameStatus, startCountdown, playSfx]);

  useEffect(() => {
    if (gameStatus === GameStatus.PLAYING) {
      timerRef.current = window.setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 11 && prev > 1) {
            playSfx('tick');
          }
          if (prev <= 1) {
            if (timerRef.current) clearInterval(timerRef.current);
            handleGameOver('time');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [gameStatus, playSfx]);

  const speakText = useCallback((text: string, force = false) => {
    if ((!isSoundEnabled && !force) || !text) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'pt-BR';
    utterance.rate = 1.0;
    window.speechSynthesis.speak(utterance);
  }, [isSoundEnabled]);

  const toggleSound = () => {
    setIsSoundEnabled(prev => {
        const newState = !prev;
        if (!newState) {
            window.speechSynthesis.cancel();
        } else if (question && gameStatus === GameStatus.PLAYING) {
            setTimeout(() => speakText(question.question, true), 100);
        }
        return newState;
    });
  };

  useEffect(() => {
    if (gameStatus === GameStatus.PLAYING && question) {
        setTimeout(() => speakText(question.question), 600);
    } else if (gameStatus !== GameStatus.PLAYING) {
        window.speechSynthesis.cancel();
    }
  }, [gameStatus, question, speakText]);

  const handleGameOver = async (reason: 'time' | 'attempts') => {
    playSfx('lose');
    setLossReason(reason);
    setGameStatus(GameStatus.LOST);
    
    const newStats = updateStats(false);
    setStats(newStats);
    
    if (user) {
        updatePlayerScore(user, scoreRef.current, newStats.bestStreak);
        await updateLeagueProgress(user, scoreRef.current, scoreRef.current); 
    }

    setTimeout(() => {
        setShowRanking(true);
    }, 3000);
  };

  const initiateCountdown = useCallback(async () => {
    setOpacityClass('opacity-0');
    await new Promise(r => setTimeout(r, 300));
    setStartCountdown(5);
    setGameStatus(GameStatus.COUNTDOWN);
    setTimeout(() => setOpacityClass('opacity-100'), 50);
  }, []);

  const handleRegister = (newUser: User) => {
    saveUser(newUser);
    setUser(newUser);
    setShowAuth(false);
    syncUserHistory(newUser.nickname);
  };

  const handleLogout = () => {
    logoutUser();
    setUser(null);
    initGame(); 
  };

  const initGame = useCallback(async () => {
    setGameStatus(GameStatus.LOADING);
    setGuesses([]);
    setTimeLeft(INITIAL_TIME);
    setScore(0);
    scoreRef.current = 0;
    setCurrentRank(RANKS[1]);
    setPendingRankUp(null);
    setAttemptsLeft(RANKS[1].maxAttempts);
    setOpacityClass('opacity-100'); 
    
    const data = await fetchDailyTrivia(RANKS[1].difficulty);
    setOpacityClass('opacity-0');
    await new Promise(r => setTimeout(r, 500));
    setQuestion(data);
    addQuestionToHistory(data.question);
    
    const currentUser = getUser();
    if (currentUser) {
        saveQuestionRemote(currentUser.nickname, data.question);
    }

    setGameStatus(GameStatus.READY); 
    setTimeout(() => setOpacityClass('opacity-100'), 50);
  }, []);

  const startNextLevel = useCallback(async () => {
    if (nextLevelTimerRef.current) {
        clearTimeout(nextLevelTimerRef.current);
        nextLevelTimerRef.current = null;
    }
    setOpacityClass('opacity-0');
    await new Promise(r => setTimeout(r, 500));
    setGameStatus(GameStatus.LOADING);
    setGuesses([]);
    setAttemptsLeft(currentRank.maxAttempts);
    setTimeout(() => setOpacityClass('opacity-100'), 50);
    
    const data = await fetchDailyTrivia(currentRank.difficulty);
    setOpacityClass('opacity-0');
    await new Promise(r => setTimeout(r, 500));
    setQuestion(data);
    addQuestionToHistory(data.question);

    const currentUser = getUser();
    if (currentUser) {
        saveQuestionRemote(currentUser.nickname, data.question);
    }

    setGameStatus(GameStatus.PLAYING); 
    playSfx('start');
    setTimeout(() => setOpacityClass('opacity-100'), 50);
  }, [playSfx, currentRank]);

  // Função central para decidir o que acontece após o ResultModal (Acerto)
  const handleNextStepAfterWin = () => {
    if (nextLevelTimerRef.current) {
        clearTimeout(nextLevelTimerRef.current);
        nextLevelTimerRef.current = null;
    }

    if (pendingRankUp) {
        // Se houver promoção pendente, agora é a hora de mostrar
        setRankUpToDisplay(pendingRankUp);
        setPendingRankUp(null);
        playSfx('win');
    } else {
        // Senão, segue para a próxima pergunta normalmente
        startNextLevel();
    }
  };

  useEffect(() => {
    initGame();
  }, [initGame]);

  const handleStartGame = async () => {
    if (!user) {
        setShowAuth(true);
        return;
    }
    initiateCountdown();
  };

  const handleGuess = (value: number) => {
    if (!question || gameStatus !== GameStatus.PLAYING) return;
    if (!user) {
        setShowAuth(true);
        return;
    }

    const answer = Number(question.answer);
    const numericValue = Number(value);
    
    if (guesses.some(g => g.value === numericValue)) return;

    const newAttemptsLeft = attemptsLeft - 1;
    setAttemptsLeft(newAttemptsLeft);

    let state: GuessState;
    
    if (numericValue === answer) {
      state = GuessState.CORRECT;
      playSfx('win');
      setGameStatus(GameStatus.WON);
      setTimeLeft(prev => prev + currentRank.timeBonus);
      const newScore = score + 1;
      setScore(newScore);
      scoreRef.current = newScore;
      const newStats = updateStats(true);
      setStats(newStats);
      updatePlayerScore(user, newScore, newStats.streak);
      
      if (nextLevelTimerRef.current) clearTimeout(nextLevelTimerRef.current);
      
      // O timer do ResultModal chama o handleNextStepAfterWin após 8s para verificar promoção
      nextLevelTimerRef.current = window.setTimeout(() => {
        handleNextStepAfterWin();
      }, 8000);
    } else {
      state = numericValue < answer ? GuessState.HIGHER : GuessState.LOWER;
      playSfx('wrong');
    }

    const diff = Math.abs(answer - numericValue);
    const maxDiff = Math.max(Math.abs(answer) * 0.5, 100);
    const proximity = diff === 0 ? 100 : Math.max(0, 100 - (diff / maxDiff) * 100);

    const newGuess: Guess = {
      value: numericValue,
      state,
      proximity,
      timestamp: Date.now(),
    };

    setGuesses(prev => [...prev, newGuess]);

    if (numericValue !== answer && newAttemptsLeft <= 0) {
        handleGameOver('attempts');
    }
  };

  const getTemperatureColor = (proximity: number) => {
    const hue = 210 - (proximity * 2.1);
    return `hsl(${hue}, 80%, 50%)`;
  };

  const handleCloseRankUp = () => {
      setRankUpToDisplay(null);
      // Carrega a próxima pergunta APENAS após o jogador aceitar o posto
      startNextLevel();
  };

  return (
    <div className="min-h-screen bg-[#0f0a1a] text-white pb-40 relative overflow-hidden">
      
      <EmailToast />

      {/* Modal de Promoção: Aparece após o ResultModal */}
      <RankUpModal 
        rank={rankUpToDisplay} 
        onClose={handleCloseRankUp} 
      />

      {gameStatus === GameStatus.COUNTDOWN && (
          <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-[#7c3aed] animate-[fadeIn_0.3s_ease-out]">
             <div className="text-white text-4xl font-black uppercase tracking-tighter mb-8 animate-pulse italic">
                PREPARE-SE
             </div>
             <div className="text-white text-[12rem] font-black leading-none drop-shadow-[0_10px_0_rgba(0,0,0,0.2)] tabular-nums animate-[ping_1s_ease-in-out_infinite]">
                {startCountdown}
             </div>
          </div>
      )}

      <Header 
        user={user}
        streak={stats.streak}
        onShowInstructions={() => setShowInfo(true)} 
        onShowRanking={() => setShowRanking(true)}
        onLogout={handleLogout}
      />
      
      <div className={`w-full transition-opacity duration-500 ease-in-out ${opacityClass}`}>
          {(gameStatus === GameStatus.PLAYING || gameStatus === GameStatus.WON || gameStatus === GameStatus.LOST) && (
              <GameStatusBar 
                timeLeft={timeLeft} 
                attemptsLeft={attemptsLeft} 
                maxAttempts={currentRank.maxAttempts} 
                rank={currentRank}
              />
          )}

          <main className="max-w-3xl mx-auto px-4 pt-8 flex flex-col items-center">
            {gameStatus === GameStatus.LOADING ? (
              <div className="flex flex-col items-center justify-center mt-20 gap-4">
                <div className="w-16 h-16 border-8 border-white/10 border-t-purple-500 rounded-full animate-spin"></div>
                <p className="text-purple-300 font-black uppercase tracking-widest animate-pulse">INICIANDO ARENA...</p>
              </div>
            ) : question ? (
              <>
                {gameStatus === GameStatus.READY && (
                    <>
                        {!user ? (
                            <div className="w-full max-w-md bg-white/5 border border-white/10 rounded-xl p-10 mt-8 animate-[fadeIn_0.5s_ease-out] backdrop-blur-xl">
                                <div className="flex flex-col items-center text-center">
                                    <div className="w-32 h-32 mb-6 floating">
                                        <QuizLogo className="w-full h-full drop-shadow-[0_0_20px_rgba(139,92,246,0.5)]" />
                                    </div>
                                    <h2 className="text-5xl font-black text-white mb-2 tracking-tighter italic">QUIZ<span className="text-purple-500">60</span></h2>
                                    <h3 className="text-sm font-bold text-purple-400 uppercase tracking-[0.3em] mb-6">EDIÇÃO DE BATALHA</h3>
                                    <p className="text-gray-400 text-sm mb-10 leading-relaxed font-medium">
                                        Não é apenas um jogo, é um desafio para sua mente. Um <span className="text-white font-bold">teste de conhecimentos gerais</span> que estimula o raciocínio, amplia sua visão e recompensa a evolução. Suba de patente e domine a arena.
                                    </p>
                                    <button 
                                        onClick={handleStartGame}
                                        className="w-full px-8 py-5 bg-[#7c3aed] hover:bg-[#8b5cf6] text-white text-2xl font-black rounded-lg shadow-[0_4px_0_#5b21b6] active:translate-y-1 active:shadow-none transition-all flex items-center justify-center gap-4 group uppercase italic tracking-tighter"
                                    >
                                        Entrar
                                        <ChevronRightIcon className="w-8 h-8 animate-blink-arrow transition-transform" />
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <Dashboard 
                                user={user}
                                localStats={stats}
                                onPlay={handleStartGame}
                                onOpenLeagues={() => setShowLeagues(true)}
                                onOpenRanking={() => setShowRanking(true)}
                            />
                        )}
                    </>
                )}

                {gameStatus !== GameStatus.READY && gameStatus !== GameStatus.COUNTDOWN && (
                    <>
                        <div className="text-center mb-10 w-full mt-4 relative group">
                            <span className="inline-block px-4 py-1.5 bg-purple-600/20 text-purple-400 border border-purple-500/30 text-[10px] font-black uppercase tracking-[0.2em] rounded mb-5">
                                MISSÃO: {question.category.toUpperCase()}
                            </span>
                            
                            <button onClick={toggleSound} className="absolute top-0 right-0 p-2 rounded bg-white/5 border border-white/10 hover:bg-white/10 text-white/30 hover:text-purple-400 transition-all">
                                {isSoundEnabled ? <SpeakerIcon className="w-4 h-4" /> : <SpeakerOffIcon className="w-4 h-4" />}
                            </button>

                            <div className="flex flex-col items-center justify-center gap-8">
                                <h2 className="text-xl md:text-3xl font-black text-white leading-tight tracking-tighter italic uppercase drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)] max-w-2xl">
                                    {question.question}
                                </h2>

                                <div className="w-full max-w-sm flex flex-col items-center gap-2">
                                    <div className="w-full h-14 bg-white/5 border border-white/10 rounded-lg flex items-center p-4 relative overflow-hidden">
                                        {lastGuess ? (
                                            <>
                                                <div className={`flex items-center justify-center w-10 h-10 rounded mr-4 ${
                                                    lastGuess.state === GuessState.HIGHER ? 'text-blue-400 bg-blue-500/10' : 'text-red-400 bg-red-500/10'
                                                }`}>
                                                    {lastGuess.state === GuessState.HIGHER ? (
                                                        <ArrowUpIcon className="w-8 h-8 animate-bounce" />
                                                    ) : (
                                                        <ArrowDownIcon className="w-8 h-8 animate-bounce" />
                                                    )}
                                                </div>

                                                <div className="flex-1 h-3 bg-black/40 rounded-full overflow-hidden border border-white/10">
                                                    <div 
                                                        className="h-full transition-all duration-1000 ease-out"
                                                        style={{ 
                                                            width: `${lastGuess.proximity}%`, 
                                                            backgroundColor: getTemperatureColor(lastGuess.proximity),
                                                            boxShadow: `0 0 15px ${getTemperatureColor(lastGuess.proximity)}`
                                                        }}
                                                    />
                                                </div>
                                                
                                                <span className="ml-4 font-black italic text-[10px] text-white/40 tracking-widest">
                                                    {Math.round(lastGuess.proximity)}%
                                                </span>
                                            </>
                                        ) : (
                                            <div className="w-full flex items-center justify-center">
                                                <span className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em] italic">Radar em Standby...</span>
                                            </div>
                                        )}
                                    </div>
                                    {lastGuess && (
                                        <div className="w-full flex justify-between px-2">
                                            <span className="text-[9px] font-black text-white/30 uppercase tracking-widest">DIREÇÃO</span>
                                            <span className="text-[9px] font-black text-white/30 uppercase tracking-widest">PROXIMIDADE TÉRMICA</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </>
                )}
              </>
            ) : (
              <div className="text-center mt-20 text-red-500 font-black uppercase italic">ERRO NO SISTEMA. MISSÃO ABORTADA.</div>
            )}
          </main>
      </div>

      {gameStatus !== GameStatus.LOADING && gameStatus !== GameStatus.READY && gameStatus !== GameStatus.COUNTDOWN && (
        <GameControls 
          onGuess={handleGuess} 
          status={gameStatus} 
          unit={question?.unit || ''} 
          guesses={guesses}
        />
      )}

      {/* ResultModal: Se rankUpToDisplay estiver ativo, forçamos o status para READY para ocultá-lo imediatamente */}
      <ResultModal 
        status={rankUpToDisplay ? GameStatus.READY : gameStatus} 
        question={question!} 
        guesses={guesses} 
        onPlayAgain={initGame} 
        onNextLevel={handleNextStepAfterWin} 
        reason={lossReason} 
        score={score} 
      />
      <InfoModal isOpen={showInfo} onClose={() => setShowInfo(false)} />
      <RankingModal isOpen={showRanking} onClose={() => setShowRanking(false)} onRestart={() => { setShowRanking(false); initGame(); }} showRestartButton={gameStatus === GameStatus.LOST} />
      <AuthModal isOpen={showAuth} onRegister={handleRegister} onClose={() => setShowAuth(false)} />
      <LeaguesModal isOpen={showLeagues} onClose={() => setShowLeagues(false)} user={user} />
      <LeagueOnboardingModal isOpen={showLeagueOnboarding} onClose={() => setShowLeagueOnboarding(false)} onCreate={() => { setShowLeagueOnboarding(false); setShowLeagues(true); }} onJoin={() => { setShowLeagueOnboarding(false); setShowLeagues(true); }} />
    </div>
  );
};

export default App;
