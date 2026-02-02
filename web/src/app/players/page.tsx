"use client";

import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, UserPlus, RefreshCw, Trophy, Users } from "lucide-react";

import { getSeasonRanking, RankingEntry } from "@/lib/api";
import { normalizeChampionName } from "@/lib/utils";
import { CHAMPION_LOAD_BASE } from "@/lib/constants";
import { useQueue } from "@/contexts/QueueContext";

import { Card } from "@/components/ui/Card";
import { PlayerAvatar } from "@/components/ui/PlayerAvatar";
import { EloBadge } from "@/components/EloBadge";
import { UpdateModal } from "@/components/UpdateModal";

function PlayersContent() {
    const [players, setPlayers] = useState<RankingEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState("");

    // Modals & Forms
    const [showAddModal, setShowAddModal] = useState(false);
    const [showUpdateModal, setShowUpdateModal] = useState(false);
    const [newPlayer, setNewPlayer] = useState({ gameName: '', tagLine: '', password: '' });
    const [addStatus, setAddStatus] = useState<'IDLE' | 'LOADING' | 'SUCCESS' | 'ERROR'>('IDLE');
    const [errorMsg, setErrorMsg] = useState('');

    const { queueType } = useQueue();

    useEffect(() => {
        const fetchRanking = async () => {
            setLoading(true);
            try {
                const res = await getSeasonRanking(queueType, 100);
                setPlayers(res);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchRanking();
    }, [queueType]);

    const handleAddPlayer = async (e: React.FormEvent) => {
        e.preventDefault();
        setAddStatus('LOADING');
        setErrorMsg('');

        try {
            const { createPlayer } = await import('@/lib/api');
            await createPlayer(newPlayer.gameName, newPlayer.tagLine, newPlayer.password);

            setAddStatus('SUCCESS');
            setTimeout(() => {
                setShowAddModal(false);
                setAddStatus('IDLE');
                setNewPlayer({ gameName: '', tagLine: '', password: '' });
                window.location.reload();
            }, 1000);
        } catch (err: any) {
            setAddStatus('ERROR');
            setErrorMsg(err.message || 'Erro ao adicionar');
        }
    };

    const filtered = players.filter(p =>
        p.gameName.toLowerCase().includes(filter.toLowerCase()) ||
        p.tagLine.toLowerCase().includes(filter.toLowerCase())
    );

    return (
        <div className="min-h-screen pb-20 relative overflow-hidden">
            {/* Background Ambience */}
            <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-indigo-900/20 via-black to-black -z-10 pointer-events-none" />
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[300px] bg-indigo-500/20 blur-[120px] rounded-full -z-10" />

            {/* Header Section */}
            <div className="max-w-7xl mx-auto px-6 py-12">
                <div className="flex flex-col md:flex-row justify-between items-end gap-8 mb-12">
                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-indigo-500/10 rounded-xl border border-indigo-500/20">
                                <Users className="w-6 h-6 text-indigo-400" />
                            </div>
                            <h2 className="text-4xl font-[family-name:var(--font-outfit)] font-bold text-white tracking-tight">
                                Diretório de Lendas
                            </h2>
                        </div>
                        <p className="text-gray-400 max-w-xl text-lg leading-relaxed">
                            Explore a elite do servidor. Acompanhe o desempenho, ranking e estatísticas dos jogadores monitorados em tempo real.
                        </p>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                        <button
                            onClick={() => setShowAddModal(true)}
                            className="group relative px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold font-[family-name:var(--font-outfit)] transition-all shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 flex items-center gap-3 overflow-hidden"
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                            <UserPlus className="w-5 h-5" />
                            <span>Rastrear Jogador</span>
                        </button>

                        <button
                            onClick={() => setShowUpdateModal(true)}
                            className="group px-6 py-3 bg-emerald-600/10 hover:bg-emerald-500/20 text-emerald-400 hover:text-emerald-300 border border-emerald-500/20 hover:border-emerald-500/40 rounded-xl font-bold font-[family-name:var(--font-outfit)] transition-all flex items-center gap-3"
                        >
                            <RefreshCw className="w-5 h-5 group-hover:rotate-180 transition-transform duration-500" />
                            <span>Sincronizar</span>
                        </button>
                    </div>
                </div>

                {/* Search Bar */}
                <div className="relative max-w-2xl mb-12">
                    <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                        <Search className="h-5 w-5 text-gray-500" />
                    </div>
                    <input
                        type="text"
                        placeholder="Buscar por Riot ID..."
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                        className="w-full bg-[#13141b] border border-white/5 rounded-2xl pl-12 pr-4 py-4 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all placeholder:text-gray-600 shadow-xl"
                    />
                </div>

                {/* Players Grid */}
                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {[...Array(8)].map((_, i) => (
                            <div key={i} className="h-[420px] bg-white/5 rounded-3xl animate-pulse" />
                        ))}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {filtered.map((player) => {
                            const bgImage = player.skin?.loadingUrl || (player.mainChampion ? `${CHAMPION_LOAD_BASE}/${normalizeChampionName(player.mainChampion.name)}_0.jpg` : undefined);
                            const isChallenger = player.tier === 'CHALLENGER';

                            return (
                                <Link key={player.puuid} href={`/player/${player.puuid}?queue=${queueType}`} className="group">
                                    <div className="relative w-full h-[450px] rounded-[2rem] overflow-hidden bg-[#0f1016] border border-white/5 group-hover:border-indigo-500/50 transition-all duration-500 shadow-2xl group-hover:shadow-indigo-500/20 group-hover:-translate-y-2">

                                        {/* Background Image */}
                                        <div className="absolute inset-0 z-0">
                                            {bgImage ? (
                                                <img
                                                    src={bgImage}
                                                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-60 group-hover:opacity-80"
                                                    alt={player.mainChampion?.name || "Player Background"}
                                                />
                                            ) : (
                                                <div className="w-full h-full bg-gradient-to-br from-indigo-950 to-slate-950" />
                                            )}
                                            {/* Gradient Overlays */}
                                            <div className="absolute inset-0 bg-gradient-to-t from-[#0f1016] via-[#0f1016]/80 to-transparent" />
                                            <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-transparent" />
                                        </div>

                                        {/* Content */}
                                        <div className="relative z-10 h-full flex flex-col p-6">
                                            {/* Top Section */}
                                            <div className="flex justify-between items-start">
                                                <div className="relative">
                                                    <div className={`absolute -inset-2 rounded-full blur-md ${isChallenger ? 'bg-yellow-500/30' : 'bg-black/50'}`} />
                                                    <PlayerAvatar
                                                        profileIconId={player.profileIconId}
                                                        summonerLevel={player.summonerLevel}
                                                        size="md"
                                                        className={`relative shadow-2xl border-2 ${isChallenger ? 'border-yellow-400' : 'border-white/10'}`}
                                                    />
                                                </div>
                                                <EloBadge tier={player.tier} rank={player.rankDivision} className="scale-90 origin-top-right drop-shadow-lg" />
                                            </div>

                                            {/* Spacer */}
                                            <div className="flex-1" />

                                            {/* Player Info */}
                                            <div className="space-y-4">
                                                <div>
                                                    <h3 className="text-2xl font-[family-name:var(--font-outfit)] font-black text-white group-hover:text-indigo-400 transition-colors leading-none tracking-tight">
                                                        {player.gameName}
                                                    </h3>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-white/10 text-gray-400 tracking-wider">
                                                            #{player.tagLine}
                                                        </span>
                                                        {player.mainChampion && (
                                                            <span className="text-xs text-indigo-300 font-bold uppercase tracking-wider">
                                                                {player.mainChampion.name}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Stats Grid */}
                                                <div className="grid grid-cols-3 gap-2 p-4 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/5">
                                                    <div className="flex flex-col items-center">
                                                        <span className="text-[10px] uppercase tracking-wider text-gray-500 font-bold">PDL</span>
                                                        <span className="text-lg font-black text-white font-[family-name:var(--font-outfit)]">{player.lp}</span>
                                                    </div>
                                                    <div className="flex flex-col items-center border-l border-white/5">
                                                        <span className="text-[10px] uppercase tracking-wider text-gray-500 font-bold">Winrate</span>
                                                        <span className={`text-lg font-black font-[family-name:var(--font-outfit)] ${parseFloat(player.winRate) >= 50 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                                            {player.winRate}
                                                        </span>
                                                    </div>
                                                    <div className="flex flex-col items-center border-l border-white/5">
                                                        <span className="text-[10px] uppercase tracking-wider text-gray-500 font-bold">Jogos</span>
                                                        <span className="text-lg font-black text-white font-[family-name:var(--font-outfit)]">{player.wins + player.losses}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                )}

                {filtered.length === 0 && !loading && (
                    <div className="flex flex-col items-center justify-center py-32 text-center opacity-0 animate-in fade-in slide-in-from-bottom-4 fill-mode-forwards duration-700">
                        <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-6">
                            <Search className="w-8 h-8 text-gray-600" />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">Nenhum jogador encontrado</h3>
                        <p className="text-gray-500 max-w-md">
                            Não encontramos ninguém com esse nome na fila <strong>{queueType === 'SOLO' ? 'Solo/Duo' : 'Flex'}</strong>.
                            Tente buscar outro nome ou adicionar um novo jogador.
                        </p>
                    </div>
                )}
            </div>

            {/* Modals */}
            {showAddModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="bg-[#12141a] border border-white/10 rounded-3xl p-8 max-w-md w-full shadow-2xl relative overflow-hidden">
                        {/* Modal Header */}
                        <div className="relative z-10 mb-8">
                            <div className="w-12 h-12 bg-indigo-500/20 rounded-2xl flex items-center justify-center mb-4 border border-indigo-500/20">
                                <UserPlus className="w-6 h-6 text-indigo-400" />
                            </div>
                            <h3 className="text-2xl font-[family-name:var(--font-outfit)] font-bold text-white">Rastrear Jogador</h3>
                            <p className="text-gray-400 mt-2 leading-relaxed">
                                Adicione um novo Invocador ao sistema de ranking. Os dados serão sincronizados automaticamente em instantes.
                            </p>
                        </div>

                        {/* Decoration */}
                        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 blur-[80px] rounded-full pointer-events-none" />

                        <form onSubmit={handleAddPlayer} className="space-y-5 relative z-10">
                            <div className="grid grid-cols-3 gap-3">
                                <div className="col-span-2 space-y-2">
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Riot ID</label>
                                    <input
                                        required
                                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 outline-none transition-all placeholder:text-gray-700"
                                        placeholder="Nome"
                                        value={newPlayer.gameName}
                                        onChange={e => setNewPlayer({ ...newPlayer, gameName: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Tag</label>
                                    <input
                                        required
                                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 outline-none transition-all placeholder:text-gray-700"
                                        placeholder="#BR1"
                                        value={newPlayer.tagLine}
                                        onChange={e => setNewPlayer({ ...newPlayer, tagLine: e.target.value.replace('#', '') })}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Senha de Admin</label>
                                <input
                                    type="password"
                                    required
                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 outline-none transition-all placeholder:text-gray-700"
                                    placeholder="••••••••"
                                    value={newPlayer.password}
                                    onChange={e => setNewPlayer({ ...newPlayer, password: e.target.value })}
                                />
                            </div>

                            {addStatus === 'ERROR' && (
                                <div className="text-rose-400 text-sm bg-rose-500/10 p-4 rounded-xl border border-rose-500/20 text-center animate-in shake">
                                    {errorMsg}
                                </div>
                            )}
                            {addStatus === 'SUCCESS' && (
                                <div className="text-emerald-400 text-sm bg-emerald-500/10 p-4 rounded-xl border border-emerald-500/20 text-center animate-in zoom-in">
                                    Jogador rastreado com sucesso! Sincronizando...
                                </div>
                            )}

                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setShowAddModal(false)}
                                    className="flex-1 bg-white/5 hover:bg-white/10 text-white font-bold py-3.5 rounded-xl transition-all"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={addStatus === 'LOADING' || addStatus === 'SUCCESS'}
                                    className="flex-[2] bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-indigo-500/25"
                                >
                                    {addStatus === 'LOADING' ? 'Verificando...' : 'Confirmar'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <UpdateModal
                isOpen={showUpdateModal}
                onClose={() => setShowUpdateModal(false)}
                availablePlayers={players}
            />
        </div>
    );
}

export default function PlayersDirectoryPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-[#0a0a0a]"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div></div>}>
            <PlayersContent />
        </Suspense>
    );
}
