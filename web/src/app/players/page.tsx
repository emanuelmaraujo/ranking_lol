"use client";

import { useEffect, useState } from "react";
import { getSeasonRanking, RankingEntry } from "@/lib/api";
import { Card } from "@/components/ui/Card";
import { PlayerAvatar } from "@/components/ui/PlayerAvatar";
import { ChampionIcon } from "@/components/ui/ChampionIcon";
import { EloBadge } from "@/components/EloBadge";
import Link from "next/link";
import { Search, UserPlus, RefreshCw } from "lucide-react";
import { UpdateModal } from "@/components/UpdateModal";

import { Suspense } from "react";
import { useRouter } from "next/navigation";
import { useQueue } from "@/contexts/QueueContext";

import { normalizeChampionName } from "@/lib/utils";
import { CHAMPION_LOAD_BASE } from "@/lib/constants";

function PlayersContent() {
    const [players, setPlayers] = useState<RankingEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState("");

    // Add Summoner State
    const [showAddModal, setShowAddModal] = useState(false);
    const [showUpdateModal, setShowUpdateModal] = useState(false);
    const [newPlayer, setNewPlayer] = useState({ gameName: '', tagLine: '', password: '' });
    const [addStatus, setAddStatus] = useState<'IDLE' | 'LOADING' | 'SUCCESS' | 'ERROR'>('IDLE');
    const [errorMsg, setErrorMsg] = useState('');

    const router = useRouter();
    const { queueType } = useQueue();

    useEffect(() => {
        const fetch = async () => {
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
        fetch();
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
            }, 1500);
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
        <div className="space-y-8 animate-in fade-in duration-500 min-h-screen pb-20 relative">
            {/* Header com Busca e Toggle */}
            <div className="flex flex-col md:flex-row justify-between items-end md:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-[family-name:var(--font-outfit)] font-bold text-white tracking-tight">Jogadores</h2>
                    <p className="text-gray-400">Diretório oficial do servidor ({players.length})</p>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl font-[family-name:var(--font-outfit)] font-bold transition-all shadow-lg shadow-indigo-500/20 flex items-center gap-2 justify-center"
                    >
                        <UserPlus className="w-4 h-4" />
                        Adicionar Invocador
                    </button>

                    <button
                        onClick={() => setShowUpdateModal(true)}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-xl font-[family-name:var(--font-outfit)] font-bold transition-all shadow-lg shadow-emerald-500/20 flex items-center gap-2 justify-center"
                    >
                        <RefreshCw className="w-4 h-4" />
                        Atualizar
                    </button>

                    <div className="relative w-full md:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4" />
                        <input
                            type="text"
                            placeholder="Buscar invocador..."
                            value={filter}
                            onChange={(e) => setFilter(e.target.value)}
                            className="w-full bg-black/20 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors placeholder:text-gray-600"
                        />
                    </div>
                </div>
            </div>

            {/* Modal Add Player */}
            {showAddModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-[#1a1c23] border border-white/10 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4 relative">
                        <button onClick={() => setShowAddModal(false)} className="absolute top-4 right-4 text-gray-500 hover:text-white">x</button>

                        <h3 className="text-xl font-[family-name:var(--font-outfit)] font-bold text-white">Adicionar Invocador</h3>
                        <p className="text-sm text-gray-400">Insira o Riot ID e a senha de administrador para rastrear um novo jogador.</p>

                        <form onSubmit={handleAddPlayer} className="space-y-4 mt-4">
                            <div className="grid grid-cols-3 gap-2">
                                <div className="col-span-2 space-y-1">
                                    <label className="text-xs font-[family-name:var(--font-outfit)] font-bold text-gray-500 uppercase">Game Name</label>
                                    <input
                                        required
                                        className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white focus:border-indigo-500 outline-none"
                                        placeholder="Faker"
                                        value={newPlayer.gameName}
                                        onChange={e => setNewPlayer({ ...newPlayer, gameName: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-[family-name:var(--font-outfit)] font-bold text-gray-500 uppercase">Tag</label>
                                    <input
                                        required
                                        className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white focus:border-indigo-500 outline-none"
                                        placeholder="T1"
                                        value={newPlayer.tagLine}
                                        onChange={e => setNewPlayer({ ...newPlayer, tagLine: e.target.value.replace('#', '') })}
                                    />
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-[family-name:var(--font-outfit)] font-bold text-gray-500 uppercase">Senha de Admin</label>
                                <input
                                    type="password"
                                    required
                                    className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white focus:border-indigo-500 outline-none"
                                    placeholder="••••••••"
                                    value={newPlayer.password}
                                    onChange={e => setNewPlayer({ ...newPlayer, password: e.target.value })}
                                />
                            </div>

                            {addStatus === 'ERROR' && (
                                <div className="text-red-400 text-sm bg-red-500/10 p-2 rounded border border-red-500/20 text-center">
                                    {errorMsg}
                                </div>
                            )}
                            {addStatus === 'SUCCESS' && (
                                <div className="text-emerald-400 text-sm bg-emerald-500/10 p-2 rounded border border-emerald-500/20 text-center">
                                    Jogador adicionado com sucesso!
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={addStatus === 'LOADING' || addStatus === 'SUCCESS'}
                                className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-2.5 rounded-xl transition-all shadow-lg shadow-indigo-500/20 mt-2"
                            >
                                {addStatus === 'LOADING' ? 'Verificando...' : 'Adicionar'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal Update Player */}
            <UpdateModal
                isOpen={showUpdateModal}
                onClose={() => setShowUpdateModal(false)}
                availablePlayers={players}
            />

            {/* Grid de Jogadores */}
            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {[...Array(8)].map((_, i) => (
                        <div key={i} className="h-64 bg-white/5 rounded-2xl animate-pulse" />
                    ))}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {filtered.map((player) => {
                        const bgImage = player.skin?.loadingUrl || (player.mainChampion ? `${CHAMPION_LOAD_BASE}/${normalizeChampionName(player.mainChampion.name)}_0.jpg` : undefined);

                        return (
                            <Link key={player.puuid} href={`/player/${player.puuid}?queue=${queueType}`}>
                                <div className="relative w-full h-[400px] rounded-[2rem] overflow-hidden group shadow-lg transition-transform hover:-translate-y-1 bg-[#0a0a0a] border border-white/10">

                                    {/* BACKGROUND IMAGE (Full Card) - The Redesign */}
                                    <div className="absolute inset-0 z-0">
                                        {bgImage ? (
                                            <img
                                                src={bgImage}
                                                className="w-full h-full object-cover object-top opacity-60 group-hover:opacity-80 group-hover:scale-102 transition-all duration-700"
                                                alt={player.mainChampion?.name || "Background"}
                                            />
                                        ) : (
                                            <div className="w-full h-full bg-gradient-to-br from-indigo-900 via-gray-900 to-black" />
                                        )}
                                        {/* Overlays for readability */}
                                        <div className="absolute inset-x-0 bottom-0 h-3/4 bg-gradient-to-t from-black via-black/80 to-transparent" />
                                        <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-black/60 to-transparent" />
                                    </div>

                                    {/* CONTENT (Relative z-10) */}
                                    <div className="relative z-10 h-full flex flex-col items-center justify-end pb-8 p-6 text-center">

                                        {/* Tier Badge (Floating Top Right) */}
                                        <div className="absolute top-4 right-4">
                                            <EloBadge tier={player.tier} rank={player.rankDivision} className="scale-75 origin-top-right" />
                                        </div>

                                        {/* Avatar (Floating Top Center, but moved down slightly) */}
                                        <div className="absolute top-8 left-1/2 -translate-x-1/2">
                                            <PlayerAvatar
                                                profileIconId={player.profileIconId}
                                                summonerLevel={player.summonerLevel}
                                                size="lg"
                                                className={`shadow-2xl border-2 ${player.rank === 1 ? 'border-yellow-400' : 'border-white/20'}`}
                                            />
                                        </div>

                                        {/* Main Text Content */}
                                        <div className="flex flex-col items-center gap-1 mb-6 mt-auto">
                                            <h3 className="text-2xl font-[family-name:var(--font-outfit)] font-black text-white group-hover:text-indigo-400 transition-colors drop-shadow-lg leading-none">
                                                {player.gameName}
                                            </h3>
                                            <span className="text-xs text-gray-400 font-mono tracking-widest uppercase">#{player.tagLine}</span>

                                            {player.mainChampion && (
                                                <div className="mt-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/10 text-[10px] text-indigo-300 font-bold uppercase tracking-wider">
                                                    Main {player.mainChampion.name}
                                                </div>
                                            )}
                                        </div>

                                        {/* Stats Grid */}
                                        <div className="w-full grid grid-cols-2 gap-4 pt-4 border-t border-white/10">
                                            <div className="flex flex-col">
                                                <span className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">PDL</span>
                                                <span className="text-xl font-[family-name:var(--font-outfit)] font-black text-white">{player.lp}</span>
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Winrate</span>
                                                <span className={`text-xl font-[family-name:var(--font-outfit)] font-black ${parseFloat(player.winRate) >= 50 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                                    {player.winRate}
                                                </span>
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
                <div className="text-center py-20 text-gray-500">
                    Nenhum jogador encontrado com esse nome na fila <strong>{queueType === 'SOLO' ? 'Solo/Duo' : 'Flex'}</strong>.
                </div>
            )}
        </div>
    );
}

export default function PlayersDirectoryPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div></div>}>
            <PlayersContent />
        </Suspense>
    );
}
