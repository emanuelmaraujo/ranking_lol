"use client";

import { useEffect, useState } from "react";
import { getHighlights, PeriodHighlights, getHallOfFame, getHallOfShame, HallOfFameData, HallOfShameData } from "@/lib/api";
import { PlayerAvatar } from "@/components/ui/PlayerAvatar";
import { Card } from "@/components/ui/Card";
import { Trophy, Skull, Flame, TrendingUp, Swords, Calendar, Eye, Timer, Target, Layers, User, Crown, AlertTriangle, Ban } from "lucide-react";
import { motion } from "framer-motion";
import { getDateRange } from "@/lib/date-utils";

import { useQueue } from "@/contexts/QueueContext";

export default function InsightsPage() {
    const [data, setData] = useState<PeriodHighlights | null>(null);
    const [fame, setFame] = useState<HallOfFameData | null>(null);
    const [shame, setShame] = useState<HallOfShameData | null>(null);
    const [loading, setLoading] = useState(true);
    const [period, setPeriod] = useState<'WEEKLY' | 'MONTHLY' | 'GENERAL'>('GENERAL');
    const { queueType } = useQueue();

    useEffect(() => {
        async function load() {
            setLoading(true);
            try {
                const [res, fameRes, shameRes] = await Promise.all([
                    getHighlights(queueType, getDateRange(period)),
                    getHallOfFame(queueType, getDateRange(period)),
                    getHallOfShame(queueType, getDateRange(period))
                ]);
                setData(res);
                setFame(fameRes);
                setShame(shameRes);
            } catch (error) {
                console.error("Failed to load insights", error);
            } finally {
                setLoading(false);
            }
        }
        load();
    }, [period, queueType]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
            </div>
        );
    }

    if (!data) {
        return (
            <div className="min-h-[50vh] flex flex-col items-center justify-center text-center">
                <Trophy className="w-16 h-16 text-gray-600 mb-4" />
                <h2 className="text-xl font-bold text-white mb-2">Sem dados suficientes</h2>
                <p className="text-gray-400">Ainda não temos partidas suficientes neste período para gerar insights.</p>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-700 pb-20">
            {/* Header & Toggle */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-[family-name:var(--font-outfit)] font-bold text-white flex items-center gap-2">
                        <Flame className="w-8 h-8 text-orange-500" />
                        Insights da Temporada
                    </h1>
                    <p className="text-gray-400 mt-1 flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        {data.periodLabel}
                    </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                    <div className="bg-black/40 p-1 rounded-lg flex items-center border border-white/5 h-fit">
                        {(['GENERAL', 'MONTHLY', 'WEEKLY'] as const).map(p => (
                            <button
                                key={p}
                                onClick={() => setPeriod(p)}
                                className={`px-4 py-1.5 rounded-md text-sm font-[family-name:var(--font-outfit)] font-medium transition-all ${period === p ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/20' : 'text-gray-400 hover:text-white'}`}
                            >
                                {p === 'GENERAL' ? 'Geral' : p === 'MONTHLY' ? 'Mensal' : 'Semanal'}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Tabs Navigation */}
            <div className="flex gap-4 border-b border-white/10 pb-1 overflow-x-auto">
                {/* Requires custom state or reuse Radix Tabs if available. 
                     Since I can't easily see if "Tabs" component is Radix or custom, 
                     I will use a simple state-based Tab system here for safety and speed 
                     unless user insists on Radix. 
                     Wait, I checked Tabs.tsx - it exports Tabs, TabsList, etc. 
                     Let's Assume standard API. 
                  */}
            </div>

            {/* Custom Tab Implementation for maximum control/compatibility if component usage is tricky without verification */}
            <TabSystem
                data={data}
                fame={fame}
                shame={shame}
            />
        </div>
    );
}

// Sub-component to manage Tabs state cleanly
function TabSystem({ data, fame, shame }: { data: PeriodHighlights, fame: HallOfFameData | null, shame: HallOfShameData | null }) {
    const [activeTab, setActiveTab] = useState<'highlights' | 'fame' | 'shame'>('highlights');

    return (
        <div className="space-y-6">
            <div className="flex gap-2">
                <button
                    onClick={() => setActiveTab('highlights')}
                    className={`px-4 py-2 rounded-lg font-[family-name:var(--font-outfit)] font-medium transition-colors ${activeTab === 'highlights' ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-white'}`}
                >
                    Destaques
                </button>
                <button
                    onClick={() => setActiveTab('fame')}
                    className={`px-4 py-2 rounded-lg font-[family-name:var(--font-outfit)] font-medium transition-colors ${activeTab === 'fame' ? 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20' : 'text-gray-400 hover:text-yellow-500'}`}
                >
                    Hall da Fama
                </button>
                <button
                    onClick={() => setActiveTab('shame')}
                    className={`px-4 py-2 rounded-lg font-[family-name:var(--font-outfit)] font-medium transition-colors ${activeTab === 'shame' ? 'bg-red-500/10 text-red-500 border border-red-500/20' : 'text-gray-400 hover:text-red-500'}`}
                >
                    Hall da Lama
                </button>
            </div>

            <div className="min-h-[400px]">
                {activeTab === 'highlights' && (
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="space-y-6"
                    >
                        {/* Top Section: Side By Side */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* MVP Section */}
                            {data.mvp ? (
                                <Card className="relative overflow-hidden border-yellow-500/30 bg-gradient-to-br from-yellow-500/10 to-transparent p-6 md:p-8 flex flex-col justify-between h-full min-h-[280px]">
                                    <div className="absolute top-0 right-0 w-96 h-96 bg-yellow-500/10 blur-3xl rounded-full translate-x-1/2 -translate-y-1/2" />
                                    <div className="relative z-10 flex flex-col sm:flex-row items-center gap-6 text-center sm:text-left h-full">
                                        <div className="relative shrink-0">
                                            <PlayerAvatar
                                                profileIconId={data.mvp.profileIconId}
                                                size="xl"
                                                ringColor="border-yellow-400 shadow-[0_0_30px_rgba(250,204,21,0.4)]"
                                                tier={data.mvp.tier}
                                            />
                                            <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-yellow-500 text-black px-3 py-1 rounded-full text-xs font-[family-name:var(--font-outfit)] font-bold uppercase tracking-wider shadow-lg whitespace-nowrap">
                                                MVP
                                            </div>
                                        </div>
                                        <div className="flex-1 space-y-2">
                                            <h3 className="text-3xl md:text-3xl font-[family-name:var(--font-outfit)] font-black text-white line-clamp-1">{data.mvp.gameName}</h3>
                                            <p className="text-yellow-500 font-[family-name:var(--font-outfit)] font-medium">{data.mvp.label}</p>
                                            <div className="inline-flex items-center gap-2 bg-yellow-500/20 px-4 py-2 rounded-lg border border-yellow-500/30">
                                                <span className="text-2xl font-[family-name:var(--font-outfit)] font-bold text-yellow-100">{data.mvp.value}</span>
                                            </div>
                                        </div>
                                    </div>
                                </Card>
                            ) : null}

                            {/* Highest Score */}
                            {data.highestScore ? (
                                <Card className="relative overflow-hidden border-purple-500/30 bg-gradient-to-br from-purple-500/10 to-transparent p-6 flex flex-col items-center justify-center text-center h-full min-h-[280px]">
                                    <h3 className="text-sm font-[family-name:var(--font-outfit)] font-bold text-purple-400 uppercase tracking-wider mb-6">✨ Maior Pontuação Única</h3>
                                    <div className="relative mb-6">
                                        <PlayerAvatar
                                            profileIconId={data.highestScore.profileIconId}
                                            size="lg"
                                            ringColor="border-purple-400 shadow-[0_0_20px_rgba(168,85,247,0.4)]"
                                            tier={data.highestScore.tier}
                                        />
                                    </div>
                                    <h2 className="text-2xl font-[family-name:var(--font-outfit)] font-bold text-white mb-1 line-clamp-1">{data.highestScore.gameName}</h2>
                                    <div className="text-5xl font-[family-name:var(--font-outfit)] font-black text-purple-200 mb-2">{data.highestScore.value}</div>
                                </Card>
                            ) : null}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {data.mono && <HighlightCard title="Mono Champion" icon={<User className="w-6 h-6 text-pink-400" />} player={data.mono} color="border-pink-500/50 bg-pink-500/5" delay={0.05} extraInfo={data.mono.championName} />}
                            {data.objective && <HighlightCard title="Controlador" icon={<Target className="w-6 h-6 text-teal-400" />} player={data.objective} color="border-teal-500/50 bg-teal-500/5" delay={0.08} />}
                            {data.ocean && <HighlightCard title="Versátil" icon={<Layers className="w-6 h-6 text-cyan-400" />} player={data.ocean} color="border-cyan-500/50 bg-cyan-500/5" delay={0.09} />}
                            {data.kdaKing && <HighlightCard title="Rei do KDA" icon={<Swords className="w-6 h-6 text-blue-400" />} player={data.kdaKing} color="border-blue-500/50 bg-blue-500/5" delay={0.1} />}
                            {data.lpMachine && <HighlightCard title="Máquina de PDL" icon={<TrendingUp className="w-6 h-6 text-emerald-400" />} player={data.lpMachine} color="border-emerald-500/50 bg-emerald-500/5" delay={0.2} />}
                            {data.highestDmg && <HighlightCard title="Dano Máximo" icon={<Flame className="w-6 h-6 text-orange-500" />} player={data.highestDmg} color="border-orange-500/50 bg-orange-500/5" delay={0.3} />}
                            {data.visionary && <HighlightCard title="Olhos de Águia" icon={<Eye className="w-6 h-6 text-indigo-400" />} player={data.visionary} color="border-indigo-500/50 bg-indigo-500/5" delay={0.35} />}
                            {data.rich && <HighlightCard title="Magnata" icon={<Trophy className="w-6 h-6 text-yellow-300" />} player={data.rich} color="border-yellow-300/50 bg-yellow-300/5" delay={0.36} />}
                            {data.farmer && <HighlightCard title="Agricultor" icon={<Swords className="w-6 h-6 text-emerald-300" />} player={data.farmer} color="border-emerald-300/50 bg-emerald-300/5" delay={0.37} />}
                            {data.stomper && <HighlightCard title="Speedrun" icon={<Timer className="w-6 h-6 text-yellow-400" />} player={data.stomper} color="border-yellow-500/50 bg-yellow-500/5" delay={0.4} />}
                            {data.mostActive && <HighlightCard title="Viciado" icon={<Calendar className="w-6 h-6 text-purple-400" />} player={data.mostActive} color="border-purple-500/50 bg-purple-500/5" delay={0.45} />}
                            {data.survivor && <HighlightCard title="Sobrevivente" icon={<Skull className="w-6 h-6 text-gray-400" />} player={data.survivor} color="border-gray-500/50 bg-gray-500/5" delay={0.5} />}
                        </div>
                    </motion.div>
                )}

                {activeTab === 'fame' && fame && (
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                    >
                        {fame.pentakilleiro && <HighlightCard title="Pentakilleiro" icon={<Swords className="w-5 h-5 text-yellow-500" />} player={fame.pentakilleiro} color="border-yellow-500/20 bg-yellow-500/5" delay={0} extraInfo={`${fame.pentakilleiro.value} Pentas`} />}
                        {fame.espanco && <HighlightCard title="Espanco" icon={<Swords className="w-5 h-5 text-blue-400" />} player={fame.espanco} color="border-blue-500/20 bg-blue-500/5" delay={0.1} extraInfo={fame.espanco?.championName} />}
                        {fame.ministroEconomia && <HighlightCard title="Ministro da Economia" icon={<Target className="w-5 h-5 text-emerald-400" />} player={fame.ministroEconomia} color="border-emerald-500/20 bg-emerald-500/5" delay={0.2} extraInfo={fame.ministroEconomia?.championName} />}
                        {fame.senhorDosDragoes && <HighlightCard title="Senhor dos Dragões" icon={<Target className="w-5 h-5 text-orange-400" />} player={fame.senhorDosDragoes} color="border-orange-500/20 bg-orange-500/5" delay={0.3} />}
                        {fame.sniper && <HighlightCard title="Sniper" icon={<Flame className="w-5 h-5 text-red-400" />} player={fame.sniper} color="border-red-500/20 bg-red-500/5" delay={0.4} extraInfo={fame.sniper?.championName} />}
                        {fame.robo && <HighlightCard title="O Robô" icon={<Layers className="w-5 h-5 text-indigo-400" />} player={fame.robo} color="border-indigo-500/20 bg-indigo-500/5" delay={0.5} />}

                        {/* New FAME Insights */}
                        {fame.demolidor && <HighlightCard title="O Demolidor" icon={<Crown className="w-5 h-5 text-yellow-600" />} player={fame.demolidor} color="border-yellow-600/20 bg-yellow-600/5" delay={0.6} extraInfo={fame.demolidor?.detail} />}
                        {fame.x1Raiz && <HighlightCard title="Rei do X1" icon={<Swords className="w-5 h-5 text-pink-500" />} player={fame.x1Raiz} color="border-pink-500/20 bg-pink-500/5" delay={0.7} />}
                        {fame.anjoDaGuarda && <HighlightCard title="Anjo da Guarda" icon={<Layers className="w-5 h-5 text-cyan-400" />} player={fame.anjoDaGuarda} color="border-cyan-500/20 bg-cyan-500/5" delay={0.8} extraInfo={fame.anjoDaGuarda?.detail} />}
                        {fame.donodoEarly && <HighlightCard title="Dono do Early" icon={<Timer className="w-5 h-5 text-amber-500" />} player={fame.donodoEarly} color="border-amber-500/20 bg-amber-500/5" delay={0.9} />}
                        {fame.escalada && <HighlightCard title="A Escalada" icon={<Skull className="w-5 h-5 text-purple-600" />} player={fame.escalada} color="border-purple-600/20 bg-purple-600/5" delay={1.0} />}
                        {fame.reiDaSelva && <HighlightCard title="Rei da Selva" icon={<Eye className="w-5 h-5 text-green-500" />} player={fame.reiDaSelva} color="border-green-500/20 bg-green-500/5" delay={1.1} />}
                        {fame.gigaChad && <HighlightCard title="Giga Chad" icon={<Target className="w-5 h-5 text-blue-300" />} player={fame.gigaChad} color="border-blue-300/20 bg-blue-300/5" delay={1.2} />}
                    </motion.div>
                )}

                {activeTab === 'shame' && shame && (
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                    >
                        {shame.pacifista && <HighlightCard title="Pacifista (Dano Moral)" icon={<Ban className="w-5 h-5 text-red-400" />} player={shame.pacifista} color="border-red-500/20 bg-red-500/5" delay={0} extraInfo={shame.pacifista?.championName} />}
                        {shame.alface && <HighlightCard title="Mão de Alface" icon={<AlertTriangle className="w-5 h-5 text-green-400" />} player={shame.alface} color="border-green-500/20 bg-green-500/5" delay={0.1} extraInfo={shame.alface?.detail} />}
                        {shame.agronomo && <HighlightCard title="O Agrônomo" icon={<TrendingUp className="w-5 h-5 text-emerald-500" />} player={shame.agronomo} color="border-emerald-500/20 bg-emerald-500/5" delay={0.2} extraInfo={shame.agronomo?.detail} />}
                        {shame.cego && <HighlightCard title="O Cego" icon={<Eye className="w-5 h-5 text-red-500" />} player={shame.cego} color="border-red-500/20 bg-red-500/5" delay={0.3} extraInfo={shame.cego?.championName} />}
                        {shame.ilusionista && <HighlightCard title="O Ilusionista" icon={<User className="w-5 h-5 text-zinc-400" />} player={shame.ilusionista} color="border-zinc-500/20 bg-zinc-500/5" delay={0.4} />}

                        {/* New SHAME Insights */}
                        {shame.finado && <HighlightCard title="O Finado" icon={<Skull className="w-5 h-5 text-red-600" />} player={shame.finado} color="border-red-600/20 bg-red-600/5" delay={0.45} />}
                        {shame.sonecaBaron && <HighlightCard title="Soneca do Baron" icon={<Timer className="w-5 h-5 text-blue-900" />} player={shame.sonecaBaron} color="border-blue-900/20 bg-blue-900/5" delay={0.5} />}
                        {shame.mataFofo && <HighlightCard title="Zé Kills" icon={<Swords className="w-5 h-5 text-red-700" />} player={shame.mataFofo} color="border-red-700/20 bg-red-700/5" delay={0.6} extraInfo={shame.mataFofo?.detail} />}
                        {shame.throwingStation && <HighlightCard title="Throwing Station" icon={<TrendingUp className="w-5 h-5 text-orange-700" />} player={shame.throwingStation} color="border-orange-700/20 bg-orange-700/5" delay={0.7} extraInfo={shame.throwingStation?.detail} />}
                        {shame.ifood && <HighlightCard title="iFood" icon={<Skull className="w-5 h-5 text-red-600" />} player={shame.ifood} color="border-red-600/20 bg-red-600/5" delay={0.8} extraInfo={shame.ifood?.detail} />}
                        {shame.telaPreta && <HighlightCard title="Tela Preta" icon={<Skull className="w-5 h-5 text-gray-600" />} player={shame.telaPreta} color="border-gray-600/20 bg-gray-600/5" delay={0.9} />}
                        {shame.moedaBronze && <HighlightCard title="Moeda de Bronze" icon={<AlertTriangle className="w-5 h-5 text-yellow-700" />} player={shame.moedaBronze} color="border-yellow-700/20 bg-yellow-700/5" delay={1.0} />}
                    </motion.div>
                )}
            </div>
        </div>
    );
}

function HighlightCard({ title, icon, player, color, delay, extraInfo }: any) {
    if (!player) return null;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay }}
        >
            <Card className={`p-6 border ${color} relative overflow-hidden group hover:scale-[1.02] transition-transform duration-300`}>
                <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                <div className="flex items-start justify-between mb-6 relative z-10">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-black/40 rounded-lg backdrop-blur-sm">
                            {icon}
                        </div>
                        <div className="flex flex-col">
                            <h3 className="font-[family-name:var(--font-outfit)] font-bold text-gray-200 leading-none">{title}</h3>
                            {extraInfo && (
                                <span className="text-[10px] text-pink-400 font-[family-name:var(--font-outfit)] font-bold uppercase tracking-wide mt-1">
                                    {extraInfo}
                                </span>
                            )}
                        </div>
                    </div>
                    {/* Badge */}
                    <div className="bg-black/60 px-3 py-1 rounded-full border border-white/10 text-xs font-[family-name:var(--font-outfit)] text-gray-400 text-right">
                        <div>{player.label}</div>
                        <div className="text-white font-bold">{player.value}</div>
                    </div>
                </div>

                <div className="flex items-center gap-4 relative z-10">
                    <PlayerAvatar profileIconId={player.profileIconId} size="lg" className="ring-2 ring-white/10 group-hover:ring-white/30 transition-all shrink-0" tier={player.tier} />
                    <div className="min-w-0">
                        <div className="text-xl font-[family-name:var(--font-outfit)] font-bold text-white group-hover:text-emerald-400 transition-colors truncate">
                            {player.gameName}
                        </div>
                        <div className="text-sm text-gray-500 font-mono truncate">#{player.tagLine}</div>
                    </div>
                </div>
            </Card>
        </motion.div>
    );
}
