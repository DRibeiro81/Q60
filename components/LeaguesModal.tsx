import React, { useState, useEffect } from 'react';
import { User, League } from '../types';
import { CloseIcon, ShieldIcon, PlusIcon, TrophyIcon, UserIcon, ShareIcon, CopyIcon, ChartIcon } from './Icons';
import { createLeague, getLeagues, joinLeague, getLeagueDetails } from '../services/leagueService';

interface LeaguesModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
}

type ViewState = 'LIST' | 'CREATE' | 'DETAILS' | 'JOIN';

const LeaguesModal: React.FC<LeaguesModalProps> = ({ isOpen, onClose, user }) => {
  const [view, setView] = useState<ViewState>('LIST');
  const [leagues, setLeagues] = useState<League[]>([]);
  const [selectedLeague, setSelectedLeague] = useState<League | null>(null);
  const [loading, setLoading] = useState(false);
  
  // Create Form State
  const [newName, setNewName] = useState('');
  const [newDescription, setNewDescription] = useState(''); // Novo estado para descrição
  const [newDuration, setNewDuration] = useState<number>(24);
  const [newUnit, setNewUnit] = useState<'hours' | 'days'>('hours');
  
  // Join State
  const [joinCode, setJoinCode] = useState('');
  const [error, setError] = useState('');
  const [copySuccess, setCopySuccess] = useState('');

  // Countdown Helper
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    if (isOpen && user) {
      loadLeagues();
      const interval = setInterval(() => setNow(Date.now()), 60000);
      return () => clearInterval(interval);
    }
  }, [isOpen, user]);

  const loadLeagues = async () => {
    if (!user) return;
    setLoading(true);
    const data = await getLeagues(user);
    setLeagues(data);
    setLoading(false);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setError('');

    if (!newName.trim()) {
      setError('Nome da liga é obrigatório.');
      return;
    }

    setLoading(true);
    // Passando a descrição para o serviço
    const result = await createLeague(user, newName, newDescription, newDuration, newUnit);
    
    if (result.success) {
        await loadLeagues();
        setView('LIST');
        setNewName('');
        setNewDescription('');
        setNewDuration(24);
    } else {
        setError(result.message || 'Erro desconhecido ao criar liga.');
    }
    setLoading(false);
  };

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !joinCode) return;
    
    setLoading(true);
    const result = await joinLeague(user, joinCode);
    setLoading(false);

    if (result.success) {
        setJoinCode('');
        await loadLeagues();
        setView('LIST');
    } else {
        setError(result.message);
    }
  };

  const openDetails = async (leagueId: string) => {
    setLoading(true);
    const details = await getLeagueDetails(leagueId);
    setLoading(false);
    if (details) {
        setSelectedLeague(details);
        setView('DETAILS');
    }
  };

  const copyToClipboard = (text: string) => {
      navigator.clipboard.writeText(text);
      setCopySuccess('Copiado!');
      setTimeout(() => setCopySuccess(''), 2000);
  };

  const copyRankingText = () => {
    if (!selectedLeague) return;
    
    const text = `🏆 Convite para a Liga “${selectedLeague.name}” – QUIZ60

Você foi convidado para participar de uma liga privada no QUIZ60, o jogo de perguntas e respostas contra o tempo.

⏱️ Responda perguntas
⚡ Ganhe tempo a cada acerto
🏆 Dispute o ranking com amigos

Código da liga: ${selectedLeague.code}

👉 Jogue agora:
https://www.quiz60.com.br`;

    if (navigator.share) {
        navigator.share({ text: text }).catch(() => {});
    } else {
        copyToClipboard(text);
    }
  };

  const formatTimeRemaining = (endsAt: number) => {
    const diff = endsAt - now;
    if (diff <= 0) return 'Encerrada';

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (days > 0) return `${days}d ${hours}h`;
    return `${hours}h ${minutes}m`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col max-h-[85vh] h-[600px]" onClick={e => e.stopPropagation()}>
        
        {/* Header */}
        <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50">
            <div className="flex items-center gap-2">
                <ShieldIcon className="w-6 h-6 text-purple-600" />
                <h2 className="text-xl font-bold text-gray-900">
                    {view === 'LIST' ? 'Minhas Ligas' : view === 'CREATE' ? 'Criar Nova Liga' : view === 'JOIN' ? 'Entrar em Liga' : 'Detalhes'}
                </h2>
            </div>
            <button onClick={onClose} className="p-2 text-gray-400 hover:bg-gray-100 rounded-full">
                <CloseIcon className="w-5 h-5" />
            </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto scrollbar-hide p-4 relative">
            
            {loading && view === 'LIST' && (
                <div className="flex justify-center py-10">
                    <div className="w-8 h-8 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin"></div>
                </div>
            )}

            {/* VIEW: LIST */}
            {view === 'LIST' && !loading && (
                <div className="space-y-4">
                    {!user ? (
                        <div className="text-center py-10 text-gray-500">
                            Faça login para participar das ligas.
                        </div>
                    ) : (
                        <>
                            <div className="grid grid-cols-2 gap-3">
                                <button 
                                    onClick={() => setView('CREATE')}
                                    className="py-4 border-2 border-dashed border-purple-200 rounded-xl flex flex-col items-center justify-center gap-2 text-purple-600 font-bold hover:bg-purple-50 transition-colors bg-white"
                                >
                                    <PlusIcon className="w-5 h-5" />
                                    <span>Criar Liga</span>
                                </button>
                                <button 
                                    onClick={() => setView('JOIN')}
                                    className="py-4 border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center gap-2 text-gray-600 font-bold hover:bg-gray-50 transition-colors bg-white"
                                >
                                    <ShareIcon className="w-5 h-5" />
                                    <span>Entrar com Código</span>
                                </button>
                            </div>

                            <div className="space-y-2">
                                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-4 mb-2">Suas Ligas</h3>
                                {leagues.length === 0 && (
                                    <p className="text-sm text-gray-400 italic text-center py-4">Você ainda não participa de nenhuma liga.</p>
                                )}
                                
                                {leagues.map(league => (
                                    <div key={league.id} onClick={() => openDetails(league.id)} className={`bg-white border rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer relative overflow-hidden group ${league.status === 'ACTIVE' ? 'border-gray-100' : 'border-gray-200 bg-gray-50 opacity-80'}`}>
                                        <div className={`absolute left-0 top-0 bottom-0 w-1 ${league.status === 'ACTIVE' ? 'bg-green-500' : 'bg-red-400'}`}></div>
                                        <div className="flex justify-between items-start">
                                            {/* Left Column: Name & Player Count */}
                                            <div>
                                                <h4 className="font-bold text-gray-900">{league.name}</h4>
                                                
                                                <div className="flex flex-col gap-1 mt-1">
                                                    <div className="flex items-center gap-1 text-xs text-gray-500">
                                                        <UserIcon className="w-3 h-3" />
                                                        <span>{league.entries.length} jogadores</span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Right Column: Timer & Leader Info */}
                                            <div className="text-right flex flex-col items-end gap-2">
                                                {league.status === 'ACTIVE' ? (
                                                    <span className="text-xs font-bold bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                                                        ⏳ {formatTimeRemaining(league.endsAt)}
                                                    </span>
                                                ) : (
                                                    <span className="text-[10px] font-bold bg-red-100 text-red-600 px-2 py-1 rounded-full uppercase">Encerrada</span>
                                                )}

                                                {/* Leader Info - Now here */}
                                                {league.entries.length > 0 && league.entries[0]?.nickname && (
                                                    <div className={`flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-md ${league.status === 'ACTIVE' ? 'text-purple-600 bg-purple-50' : 'text-yellow-800 bg-yellow-100'}`}>
                                                        <TrophyIcon className="w-3 h-3" />
                                                        <span>{league.status === 'ACTIVE' ? 'Liderança' : 'Campeão'}: {league.entries[0].nickname}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </div>
            )}

            {/* VIEW: JOIN */}
            {view === 'JOIN' && (
                <form onSubmit={handleJoin} className="space-y-6 pt-4">
                    <div className="text-center">
                        <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <ShareIcon className="w-8 h-8 text-purple-600" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900">Tem um código de convite?</h3>
                        <p className="text-sm text-gray-500">Cole o código abaixo para entrar na liga.</p>
                    </div>

                    <div>
                        <input 
                            type="text" 
                            value={joinCode}
                            onChange={e => setJoinCode(e.target.value.toUpperCase())}
                            placeholder="Ex: X9Y2Z1"
                            className="w-full px-4 py-4 rounded-xl border-2 border-purple-200 focus:border-purple-600 outline-none text-center text-2xl font-mono tracking-widest uppercase font-bold bg-white"
                            maxLength={8}
                        />
                    </div>

                    {error && <p className="text-red-500 text-sm font-bold text-center">{error}</p>}

                    <div className="flex gap-3 pt-2">
                        <button 
                            type="button" 
                            onClick={() => setView('LIST')}
                            className="flex-1 py-3 text-gray-600 font-bold hover:bg-gray-100 rounded-xl"
                        >
                            Cancelar
                        </button>
                        <button 
                            type="submit"
                            disabled={loading || !joinCode}
                            className="flex-1 py-3 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-bold rounded-xl shadow-lg shadow-purple-200"
                        >
                            {loading ? 'Entrando...' : 'Entrar na Liga'}
                        </button>
                    </div>
                </form>
            )}

            {/* VIEW: CREATE */}
            {view === 'CREATE' && (
                <form onSubmit={handleCreate} className="space-y-5">
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Nome da Liga</label>
                        <input 
                            type="text" 
                            value={newName}
                            onChange={e => setNewName(e.target.value)}
                            placeholder="Ex: Desafio de Fim de Semana"
                            className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-purple-500 outline-none bg-white"
                            maxLength={30}
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Descrição (Opcional)</label>
                        <input 
                            type="text" 
                            value={newDescription}
                            onChange={e => setNewDescription(e.target.value)}
                            placeholder="Ex: Quem perder paga a pizza"
                            className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-purple-500 outline-none bg-white"
                            maxLength={60}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Duração</label>
                            <input 
                                type="number" 
                                value={newDuration}
                                onChange={e => setNewDuration(Number(e.target.value))}
                                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-purple-500 outline-none bg-white"
                                min="1"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Unidade</label>
                            <select 
                                value={newUnit}
                                onChange={e => setNewUnit(e.target.value as any)}
                                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-purple-500 outline-none bg-white"
                            >
                                <option value="hours">Horas</option>
                                <option value="days">Dias</option>
                            </select>
                        </div>
                    </div>
                    
                    {error && <p className="text-red-500 text-sm font-bold text-center bg-red-50 p-3 rounded-lg border border-red-100">{error}</p>}

                    <div className="flex gap-3 pt-4">
                        <button 
                            type="button" 
                            onClick={() => setView('LIST')}
                            className="flex-1 py-3 text-gray-600 font-bold hover:bg-gray-100 rounded-xl"
                        >
                            Cancelar
                        </button>
                        <button 
                            type="submit"
                            disabled={loading}
                            className="flex-1 py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl shadow-lg shadow-purple-200"
                        >
                            {loading ? 'Criando...' : 'Criar Liga'}
                        </button>
                    </div>
                </form>
            )}

            {/* VIEW: DETAILS */}
            {view === 'DETAILS' && selectedLeague && (
                <div>
                     <button onClick={() => setView('LIST')} className="text-xs font-bold text-gray-400 mb-4 hover:text-purple-600 flex items-center gap-1">
                        &larr; Voltar
                     </button>

                     <div className="text-center mb-6">
                        <h2 className="text-2xl font-black text-gray-900 leading-tight mb-1">{selectedLeague.name}</h2>
                        
                        {/* Exibir Descrição */}
                        {selectedLeague.description && (
                            <p className="text-sm text-gray-500 font-medium mb-3 max-w-[280px] mx-auto leading-tight">
                                {selectedLeague.description}
                            </p>
                        )}
                        
                        {/* Status Chip */}
                        <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-4 ${selectedLeague.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            {selectedLeague.status === 'ACTIVE' ? (
                                <><span>Ativa</span> • <span>⏳ {formatTimeRemaining(selectedLeague.endsAt)}</span></>
                            ) : (
                                <span>Liga Encerrada</span>
                            )}
                        </div>

                        {/* Invite Code Box */}
                        {selectedLeague.status === 'ACTIVE' && (
                            <div className="bg-purple-50 border border-purple-100 rounded-xl p-3 flex items-center justify-between gap-3 max-w-xs mx-auto mb-1">
                                <div className="text-left">
                                    <span className="text-[10px] text-purple-400 font-bold uppercase block">Código de Convite</span>
                                    <span className="font-mono font-black text-lg text-purple-700 tracking-wider">{selectedLeague.code}</span>
                                </div>
                                <button onClick={() => copyToClipboard(selectedLeague.code)} className="p-2 bg-white rounded-lg shadow-sm text-purple-600 hover:bg-purple-100">
                                    {copySuccess ? <span className="text-xs font-bold text-green-600">OK</span> : <CopyIcon className="w-5 h-5" />}
                                </button>
                            </div>
                        )}
                     </div>

                     {selectedLeague.status === 'ENDED' && (
                         <div className="bg-yellow-50 border border-yellow-100 p-4 rounded-xl mb-6 text-center shadow-sm">
                             <h4 className="text-yellow-800 font-bold mb-1 flex justify-center items-center gap-2"><TrophyIcon className="w-5 h-5"/> Campeão da Liga</h4>
                             {selectedLeague.entries[0] ? (
                                 <div className="text-2xl font-black text-gray-900 mt-2">
                                     {selectedLeague.entries[0].nickname}
                                 </div>
                             ) : (
                                 <div className="text-sm text-gray-500">Nenhum participante</div>
                             )}
                         </div>
                     )}

                     {/* Ranking Table */}
                     <div className="bg-white rounded-xl border border-gray-200 overflow-hidden mb-16">
                        <div className="grid grid-cols-12 bg-gray-50 p-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-200">
                            <div className="col-span-2 text-center">Pos</div>
                            <div className="col-span-6">Jogador</div>
                            <div className="col-span-4 text-right pr-2">Pts (Melhor)</div>
                        </div>
                        <div className="divide-y divide-gray-100">
                            {selectedLeague.entries.map((entry, index) => (
                                <div key={entry.nickname} className={`grid grid-cols-12 p-3 items-center ${entry.nickname === user?.nickname ? 'bg-purple-50' : ''}`}>
                                    <div className="col-span-2 flex justify-center">
                                        {index === 0 ? <span className="text-lg">🥇</span> : 
                                         index === 1 ? <span className="text-lg">🥈</span> : 
                                         index === 2 ? <span className="text-lg">🥉</span> : 
                                         <span className="font-bold text-gray-400 text-xs">#{index + 1}</span>}
                                    </div>
                                    <div className="col-span-6 font-semibold text-gray-800 text-sm truncate">
                                        {entry.nickname}
                                        {entry.nickname === user?.nickname && <span className="ml-1 text-[9px] bg-purple-200 text-purple-800 px-1 rounded">VOCÊ</span>}
                                    </div>
                                    <div className="col-span-4 text-right pr-2 font-black text-gray-900">
                                        {entry.bestScore}
                                    </div>
                                </div>
                            ))}
                        </div>
                     </div>
                </div>
            )}
        </div>

        {/* Footer Fixed Area for Details View */}
        {view === 'DETAILS' && selectedLeague && (
            <div className="p-4 border-t border-gray-100 bg-gray-50 z-10">
                <button 
                    onClick={copyRankingText}
                    disabled={selectedLeague.status !== 'ACTIVE'}
                    className={`w-full py-3 font-bold rounded-xl flex items-center justify-center gap-2 transition-all ${
                        selectedLeague.status === 'ACTIVE' 
                        ? 'bg-purple-600 hover:bg-purple-700 text-white shadow-lg shadow-purple-200 active:scale-95' 
                        : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    }`}
                >
                    <ShareIcon className="w-5 h-5" />
                    Compartilhar convite
                </button>
            </div>
        )}

      </div>
    </div>
  );
};

export default LeaguesModal;