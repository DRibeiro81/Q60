import React, { useState, useEffect, useCallback, useRef } from 'react';
import Header from './components/Header';
import GameControls from './components/GameControls';
import GuessHistory from './components/GuessHistory';
import ResultModal from './components/ResultModal';
import InfoModal from './components/InfoModal';
import AuthModal from './components/AuthModal';
import RankingModal from './components/RankingModal';
import GameStatusBar from './components/GameStatusBar';
import EmailToast from './components/EmailToast';
import { PlayIcon, ClockIcon, TargetIcon, QuizLogo, SpeakerIcon, SpeakerOffIcon } from './components/Icons';
import { fetchDailyTrivia } from './services/geminiService';
import { getUser, saveUser, logoutUser, getStats, updateStats, addQuestionToHistory } from './services/storageService';
import { updatePlayerScore } from './services/rankingService';
import { syncUserHistory, saveQuestionRemote } from './services/historyService';
import { playSound } from './services/soundService';
import { TriviaQuestion, Guess, GameStatus, GuessState, User, PlayerStats } from './types';

const MAX_ATTEMPTS = 10;
const INITIAL_TIME = 60; // Global timer starts at 60s
const TIME_BONUS = 10;   // Bonus per correct answer

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [stats, setStats] = useState<PlayerStats>({ wins: 0, streak: 0, bestStreak: 0, gamesPlayed: 0 });
  const [question, setQuestion] = useState<TriviaQuestion | null>(null);
  const [guesses, setGuesses] = useState<Guess[]>([]);
  const [gameStatus, setGameStatus] = useState<GameStatus>(GameStatus.LOADING);
  
  // Game Logic States
  const [timeLeft, setTimeLeft] = useState(INITIAL_TIME);
  const [attemptsLeft, setAttemptsLeft] = useState(MAX_ATTEMPTS);
  
  // Current Session Score (Points/Wins in this run)
  const [score, setScore] = useState(0);
  const scoreRef = useRef(0); // Ref to access current score inside closures (timers)

  const timerRef = useRef<number | null>(null);
  // Ref to handle the auto-advance timer so we can cancel it manually
  const nextLevelTimerRef = useRef<number | null>(null);
  
  const [lossReason, setLossReason] = useState<'time' | 'attempts'>('time');

  // Animation State
  const [opacityClass, setOpacityClass] = useState('opacity-100');

  // Sound & Modals state
  const [isSoundEnabled, setIsSoundEnabled] = useState(true);
  const [showInfo, setShowInfo] = useState(false);
  const [showRanking, setShowRanking] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  
  // Initialize User & Sync History
  useEffect(() => {
    const loadedUser = getUser();
    const loadedStats = getStats();
    
    if (loadedUser) {
      setUser(loadedUser);
      // Sync history from cloud to prevent repeats
      syncUserHistory(loadedUser.nickname);
    } else {
      setShowAuth(true);
    }
    
    setStats(loadedStats);
  }, []);

  // Audio Logic (SFX Helper)
  const playSfx = useCallback((type: 'correct' | 'wrong' | 'start' | 'win' | 'lose' | 'tick') => {
    if (isSoundEnabled) {
      playSound(type);
    }
  }, [isSoundEnabled]);

  // Timer Logic
  useEffect(() => {
    if (gameStatus === GameStatus.PLAYING) {
      timerRef.current = window.setInterval(() => {
        setTimeLeft((prev) => {
          // Play tick sound if time is low (10s or less) but not yet finished
          if (prev <= 11 && prev > 1) {
            playSfx('tick');
          }

          if (prev <= 1) {
            // Time's up
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

  // Audio Logic (Speech)
  const speakText = useCallback((text: string, force = false) => {
    if ((!isSoundEnabled && !force) || !text) return;
    
    // Stop any current speech
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
            // Speak immediately when turning on if playing
            setTimeout(() => speakText(question.question, true), 100);
        }
        return newState;
    });
  };

  // Speak question when it changes AND we are in playing mode
  useEffect(() => {
    if (gameStatus === GameStatus.PLAYING && question) {
        // Short delay to let the fade-in happen or SFX finish
        setTimeout(() => speakText(question.question), 600);
    } else if (gameStatus !== GameStatus.PLAYING) {
        window.speechSynthesis.cancel();
    }
  }, [gameStatus, question, speakText]);

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
        window.speechSynthesis.cancel();
        if (nextLevelTimerRef.current) clearTimeout(nextLevelTimerRef.current);
    };
  }, []);

  const handleGameOver = (reason: 'time' | 'attempts') => {
    playSfx('lose');
    setLossReason(reason);
    setGameStatus(GameStatus.LOST);
    
    // Update Stats locally (Lifetime stats)
    const newStats = updateStats(false); // Reset streak in local storage
    setStats(newStats);
    
    // Send current run score (High Score Logic) to Cloud
    if (user) {
        // We pass the current run score (scoreRef.current) and the current best streak from stats
        updatePlayerScore(user, scoreRef.current, newStats.bestStreak);
    }

    // Open Ranking after 3 seconds on elimination
    setTimeout(() => {
        setShowRanking(true);
    }, 3000);
  };

  const handleRegister = (newUser: User) => {
    saveUser(newUser);
    setUser(newUser);
    setShowAuth(false);
    // Sync history immediately upon login/register
    syncUserHistory(newUser.nickname);
  };

  const handleLogout = () => {
    logoutUser();
    setUser(null);
    setShowAuth(true);
  };

  // Initial Load with Fade (Starts a fresh run)
  const initGame = useCallback(async () => {
    setGameStatus(GameStatus.LOADING);
    setGuesses([]);
    setTimeLeft(INITIAL_TIME); // Reset global timer
    setAttemptsLeft(MAX_ATTEMPTS);
    
    // Reset Score for new run
    setScore(0);
    scoreRef.current = 0;

    setOpacityClass('opacity-100'); // Start visible
    
    const data = await fetchDailyTrivia();
    
    // Fade out loader
    setOpacityClass('opacity-0');
    await new Promise(r => setTimeout(r, 500));

    setQuestion(data);
    
    // Save locally
    addQuestionToHistory(data.question);
    
    // Save to Cloud if logged in
    const currentUser = getUser();
    if (currentUser) {
        saveQuestionRemote(currentUser.nickname, data.question);
    }

    setGameStatus(GameStatus.READY); 

    // Fade in Ready Screen
    setTimeout(() => setOpacityClass('opacity-100'), 50);
  }, []);

  // Next Level with Fade (Continues current run)
  const startNextLevel = useCallback(async () => {
    // Clear any pending timer if manually triggered
    if (nextLevelTimerRef.current) {
        clearTimeout(nextLevelTimerRef.current);
        nextLevelTimerRef.current = null;
    }

    // 1. Fade out current content
    setOpacityClass('opacity-0');
    await new Promise(r => setTimeout(r, 500));

    // 2. Show Loading
    setGameStatus(GameStatus.LOADING);
    setGuesses([]);
    setAttemptsLeft(MAX_ATTEMPTS); // Reset attempts
    
    // Fade in loader
    setTimeout(() => setOpacityClass('opacity-100'), 50);
    
    // 3. Fetch
    const data = await fetchDailyTrivia();
    
    // 4. Fade out loader
    setOpacityClass('opacity-0');
    await new Promise(r => setTimeout(r, 500));

    // 5. Update data and set Playing
    setQuestion(data);
    
    // Save Locally
    addQuestionToHistory(data.question);

    // Save to Cloud
    const currentUser = getUser();
    if (currentUser) {
        saveQuestionRemote(currentUser.nickname, data.question);
    }

    setGameStatus(GameStatus.PLAYING); 
    playSfx('start'); // Subtle start sound for next level
    
    // 6. Fade in new question
    setTimeout(() => setOpacityClass('opacity-100'), 50);
  }, [playSfx]);

  // Wrapper for manual trigger
  const handleManualNextLevel = () => {
    startNextLevel();
  };

  useEffect(() => {
    initGame();
  }, [initGame]);

  const handleStartGame = async () => {
    playSfx('start');
    setOpacityClass('opacity-0');
    await new Promise(r => setTimeout(r, 300));
    setGameStatus(GameStatus.PLAYING);
    setTimeout(() => setOpacityClass('opacity-100'), 50);
  };

  const handleRestartAfterRanking = () => {
    setShowRanking(false);
    initGame();
  };

  const handleGuess = (value: number) => {
    if (!question || gameStatus !== GameStatus.PLAYING) return;
    if (!user) {
        setShowAuth(true);
        return;
    }

    // Ensure strict number type for the answer
    const answer = Number(question.answer);
    const numericValue = Number(value);
    
    // Check for duplicates - Prevent checking the same number twice
    if (guesses.some(g => g.value === numericValue)) {
        // Here we could add a shake animation or toast, but for now just return
        // to save the user an attempt.
        return;
    }

    const newAttemptsLeft = attemptsLeft - 1;
    setAttemptsLeft(newAttemptsLeft);

    let state: GuessState;
    
    if (numericValue === answer) {
      state = GuessState.CORRECT;
      playSfx('win');
      setGameStatus(GameStatus.WON);
      
      // Bonus Time!
      setTimeLeft(prev => prev + TIME_BONUS);
      
      // Update Score
      const newScore = score + 1;
      setScore(newScore);
      scoreRef.current = newScore;
      
      // Update Local Stats
      const newStats = updateStats(true);
      setStats(newStats);

      // (Optional) We could update Cloud High Score here too, but usually it's better on Game Over
      // or we can update it incrementally if we want live leaderboards.
      // For now, let's stick to Game Over for DB efficiency, or intermediate updates.
      // Let's update incrementally to be safe against crashes.
      updatePlayerScore(user, newScore, newStats.streak);
      
      // Auto-advance after 8 seconds, but save ref to allow manual skip
      if (nextLevelTimerRef.current) clearTimeout(nextLevelTimerRef.current);
      nextLevelTimerRef.current = window.setTimeout(() => {
        startNextLevel();
      }, 8000);

    } else {
      // Incorrect logic
      if (numericValue < answer) {
        state = GuessState.HIGHER;
      } else {
        state = GuessState.LOWER;
      }
      playSfx('wrong');
    }

    const diff = Math.abs(answer - numericValue);
    const maxDiff = Math.max(Math.abs(answer) * 0.5, 100);
    
    let proximity = 0;
    if (diff === 0) {
      proximity = 100;
    } else {
      proximity = Math.max(0, 100 - (diff / maxDiff) * 100);
    }

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

  return (
    <div className="min-h-screen bg-[#f8f9fa] text-gray-800 pb-40">
      
      {/* Toast Notification for Mock Emails */}
      <EmailToast />

      <Header 
        user={user}
        streak={stats.streak}
        onShowInstructions={() => setShowInfo(true)} 
        onShowRanking={() => setShowRanking(true)}
        onLogout={handleLogout}
      />
      
      {/* Dynamic Content Container with Fade Transition */}
      <div className={`w-full transition-opacity duration-500 ease-in-out ${opacityClass}`}>
          {/* Status Bar (Timer & Attempts) - Only show when PLAYING, WON or LOST */}
          {gameStatus !== GameStatus.LOADING && gameStatus !== GameStatus.READY && (
              <GameStatusBar 
                timeLeft={timeLeft} 
                attemptsLeft={attemptsLeft} 
                maxAttempts={MAX_ATTEMPTS} 
              />
          )}

          <main className="max-w-3xl mx-auto px-4 pt-4 flex flex-col items-center">
            {gameStatus === GameStatus.LOADING ? (
              <div className="flex flex-col items-center justify-center mt-20 gap-4">
                <div className="w-12 h-12 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin"></div>
                <p className="text-gray-500 font-medium animate-pulse">Carregando desafio...</p>
              </div>
            ) : question ? (
              <>
                {/* RULES SCREEN (READY STATE) */}
                {gameStatus === GameStatus.READY && (
                    <div className="w-full max-w-md bg-white rounded-3xl shadow-xl p-8 mt-8 animate-[fadeIn_0.5s_ease-out]">
                        <div className="flex flex-col items-center text-center">
                            <div className="w-24 h-24 mb-6 transition-transform hover:scale-110 duration-300">
                                <QuizLogo className="w-full h-full drop-shadow-md" />
                            </div>
                            <h2 className="text-4xl font-black text-gray-900 mb-2 tracking-tight">QUIZ<span className="text-purple-600">60</span></h2>
                            <p className="text-sm font-extrabold text-purple-600 uppercase tracking-widest mb-6">
                                Rápido, simples e viciante!
                            </p>
                            
                            <p className="text-gray-500 mb-8 leading-relaxed">
                                Você tem <strong>60 segundos</strong> no cronômetro. A cada acerto, ganhe <strong>+{TIME_BONUS}s</strong>. Quantas perguntas você consegue vencer?
                            </p>

                            <div className="grid grid-cols-2 gap-4 w-full mb-8">
                                <div className="bg-gray-50 p-4 rounded-2xl flex flex-col items-center border border-gray-100 relative overflow-hidden">
                                    <div className="absolute top-0 right-0 bg-green-500 text-white text-[10px] font-bold px-2 py-1 rounded-bl-lg">
                                    +{TIME_BONUS}s / acerto
                                    </div>
                                    <ClockIcon className="w-6 h-6 text-red-500 mb-2" />
                                    <span className="text-2xl font-black text-gray-900">{INITIAL_TIME}s</span>
                                    <span className="text-xs font-bold text-gray-400 uppercase">Tempo Total</span>
                                </div>
                                <div className="bg-gray-50 p-4 rounded-2xl flex flex-col items-center border border-gray-100">
                                    <TargetIcon className="w-6 h-6 text-orange-500 mb-2" />
                                    <span className="text-2xl font-black text-gray-900">{MAX_ATTEMPTS}</span>
                                    <span className="text-xs font-bold text-gray-400 uppercase">Chances/Rodada</span>
                                </div>
                            </div>

                            <button 
                                onClick={handleStartGame}
                                className="w-full px-8 py-4 bg-purple-600 hover:bg-purple-700 text-white text-xl font-bold rounded-2xl shadow-xl shadow-purple-200 transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-3 group"
                            >
                                <PlayIcon className="w-6 h-6 group-hover:fill-current" />
                                Começar Desafio
                            </button>
                        </div>
                    </div>
                )}

                {/* QUESTION SCREEN (PLAYING/WON/LOST STATE) */}
                {gameStatus !== GameStatus.READY && (
                    <>
                        <div className="text-center mb-6 w-full mt-4 relative">
                            <span className="inline-block px-3 py-1 bg-purple-100 text-purple-700 text-xs font-bold uppercase tracking-wider rounded-full mb-3">
                                {question.category}
                            </span>
                            
                            <div className="flex flex-col items-center justify-center gap-2">
                                <h2 className="text-2xl md:text-4xl font-black text-gray-900 leading-tight">
                                    {question.question}
                                </h2>
                                <button 
                                    onClick={toggleSound}
                                    className="mt-2 p-2 rounded-full bg-gray-100 hover:bg-gray-200 text-purple-600 transition-colors"
                                    title={isSoundEnabled ? "Desativar leitura" : "Ativar leitura"}
                                >
                                    {isSoundEnabled ? <SpeakerIcon className="w-6 h-6" /> : <SpeakerOffIcon className="w-6 h-6 text-gray-400" />}
                                </button>
                            </div>
                            
                            <p className="text-gray-500 mt-2">
                                A resposta é em <span className="font-bold text-gray-700">{question.unit}</span>.
                            </p>
                        </div>

                        <GuessHistory guesses={guesses} />
                    </>
                )}
              </>
            ) : (
              <div className="text-center mt-20 text-red-500">Erro ao carregar o jogo.</div>
            )}
          </main>
      </div>

      {gameStatus !== GameStatus.LOADING && gameStatus !== GameStatus.READY && (
        <GameControls 
            onGuess={handleGuess} 
            status={gameStatus} 
            unit={question?.unit || ''}
        />
      )}

      <ResultModal 
        status={gameStatus}
        question={question!}
        guesses={guesses}
        onPlayAgain={initGame} // Only used for Lost state button if ranking is closed
        onNextLevel={handleManualNextLevel} // Manual trigger for WIN state
        reason={lossReason}
        score={score} // Passing current run score
      />

      <InfoModal 
        isOpen={showInfo} 
        onClose={() => setShowInfo(false)} 
      />

      <RankingModal 
        isOpen={showRanking}
        onClose={() => setShowRanking(false)}
        onRestart={handleRestartAfterRanking} // New prop to restart game from ranking
        showRestartButton={gameStatus === GameStatus.LOST} // Show button if coming from loss
      />

      <AuthModal 
        isOpen={showAuth}
        onRegister={handleRegister}
      />
    </div>
  );
};

export default App;