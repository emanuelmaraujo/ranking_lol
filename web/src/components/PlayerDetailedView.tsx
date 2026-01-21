"use client";

import Link from "next/link";
import { DetailedStats } from "@/lib/api";
import { motion, useMotionValue, useTransform, animate, Variants } from "framer-motion";
import { Trophy, Users, Map, Target, Swords, Flame, ArrowRightLeft, Crown, TrendingUp } from "lucide-react";
import { PlayerIcon } from "./PlayerIcon";
import { ChampionIcon } from "./ChampionIcon";
import { PlaystyleRadar } from "./insights/PlaystyleRadar";
import { ActivityHeatmap } from "./insights/ActivityHeatmap";
import { DurationChart } from "./insights/DurationChart";
import { MatchupList } from "./insights/MatchupList";
import { TrophyRoom } from "./insights/TrophyRoom";
import { useEffect, useState, useMemo } from "react";

interface PlayerDetailedViewProps {
    stats: DetailedStats;
    theme: any;
    queue: string;
    onToggleBoth: () => void;
}

const DDRAGON_VER = "15.1.1";

// Mapping for Lane Localization
const ROLE_MAP: Record<string, string> = {
    'TOP': 'Topo',
    'JUNGLE': 'Selva',
    'MIDDLE': 'Meio',
    'BOTTOM': 'Atirador',
    'UTILITY': 'Suporte',
    'UNKNOWN': 'Desconhecido'
};

const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1
        }
    }
};

const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } }
};

export function PlayerDetailedView({ stats, theme, queue, onToggleBoth }: PlayerDetailedViewProps) {
    const isBoth = queue === 'BOTH';
    const [heatmapMode, setHeatmapMode] = useState<'GAMES' | 'WINRATE'>('GAMES');

    // Sort Lanes based on mode
    const sortedLanes = useMemo(() => {
        return [...stats.lanes].sort((a, b) => {
            if (heatmapMode === 'WINRATE') {
                return Number(b.winRate) - Number(a.winRate);
            }
            return b.games - a.games;
        });
    }, [stats.lanes, heatmapMode]);

    // Calculate Synergy Highlights
    const synergyHighlights = useMemo(() => {
        if (!stats.teammates.length) return { mostPlayed: null, mostWins: null };

        // Find most played (Games)
        const mostPlayed = [...stats.teammates].sort((a, b) => b.games - a.games)[0];

        // Find most wins (Games * WinRate)
        const mostWins = [...stats.teammates].sort((a, b) => {
            const winsA = a.games * (Number(a.winRate) / 100);
            const winsB = b.games * (Number(b.winRate) / 100);
            return winsB - winsA;
        })[0];

        return { mostPlayed, mostWins };
    }, [stats.teammates]);

    return (
        <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-10" // Increased vertical rhythm
        >
            {/* HEADER */}
            <div className="flex justify-between items-end px-2">
                <div>
                    <motion.h2
                        variants={itemVariants}
                        className="text-4xl font-bold font-[family-name:var(--font-outfit)] text-white flex items-center gap-4"
                    >
                        <span className="bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-500 bg-clip-text text-transparent drop-shadow-[0_0_20px_rgba(79,70,229,0.5)]">
                            Performance Insights
                        </span>
                        {isBoth && (
                            <span className="text-[10px] bg-indigo-500/20 text-indigo-200 px-3 py-1 rounded-full border border-indigo-500/30 uppercase tracking-widest font-bold shadow-[0_0_15px_rgba(79,70,229,0.2)]">
                                Comparativo
                            </span>
                        )}
                    </motion.h2>
                    <motion.p variants={itemVariants} className="text-zinc-400 text-sm mt-2 max-w-lg font-light tracking-wide">
                        Análise estatística de alta precisão baseada no histórico completo.
                    </motion.p>
                </div>

                <motion.button
                    variants={itemVariants}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={onToggleBoth}
                    className={`relative group px-6 py-3 rounded-2xl text-xs font-bold transition-all border overflow-hidden backdrop-blur-md ${isBoth
                        ? 'bg-indigo-600/20 border-indigo-500/50 text-white shadow-[0_0_30px_rgba(79,70,229,0.2)]'
                        : 'bg-white/5 border-white/10 text-zinc-400 hover:bg-white/10 hover:border-white/20'}`}
                >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                    <div className="flex items-center gap-2 relative z-10">
                        <ArrowRightLeft size={16} className={isBoth ? "text-indigo-300" : "text-zinc-500"} />
                        {isBoth ? 'Ocultar Comparativo' : 'Comparar Solo vs Flex'}
                    </div>
                </motion.button>
            </div>

            {/* HERO STATS */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <HeroCard
                    title="Desempenho Global"
                    subtitle="Partidas Totais"
                    icon={<Swords size={24} className="text-blue-400" />}
                    gradient="from-blue-500/10 to-transparent"
                    border="group-hover:border-blue-500/30"
                >
                    <div className="flex items-baseline gap-2 mt-2">
                        <Counter value={stats.totalGames} className="text-5xl font-bold text-white tracking-tighter" />
                        <span className="text-sm font-medium text-zinc-500 uppercase tracking-wide">Jogos</span>
                    </div>
                    <div className="mt-4 flex items-center gap-3">
                        <div className="h-2 flex-1 bg-zinc-800/50 rounded-full overflow-hidden p-[1px]">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${stats.winRate}%` }}
                                transition={{ duration: 1.5, ease: "circOut" }}
                                className={`h-full rounded-full ${Number(stats.winRate) >= 50 ? 'bg-gradient-to-r from-emerald-500 to-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.4)]' : 'bg-gradient-to-r from-rose-500 to-rose-400'}`}
                            />
                        </div>
                        <div className={`font-mono text-sm font-bold ${Number(stats.winRate) >= 50 ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {stats.winRate}% WR
                        </div>
                    </div>
                </HeroCard>

                <HeroCard
                    title="Versatilidade"
                    subtitle="Campeões Únicos"
                    icon={<Crown size={24} className="text-amber-400" />}
                    gradient="from-amber-500/10 to-transparent"
                    border="group-hover:border-amber-500/30"
                >
                    <div className="flex items-baseline gap-2 mt-2">
                        <Counter value={stats.totalChampions} className="text-5xl font-bold text-white tracking-tighter" />
                        <span className="text-sm font-medium text-zinc-500 uppercase tracking-wide">Campeões</span>
                    </div>
                    <div className="mt-4 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-zinc-500">
                        {stats.totalChampions > 20 ? (
                            <><span className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.6)] animate-pulse" /> Ocean (Vasto)</>
                        ) : (
                            <><span className="w-2 h-2 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.6)] animate-pulse" /> Main (Especialista)</>
                        )}
                    </div>
                </HeroCard>

                {isBoth ? (
                    <ComparisonHero stats={stats} />
                ) : (
                    <HeroCard
                        title="Domínio de Rota"
                        subtitle="Rota Principal"
                        icon={<Map size={24} className="text-purple-400" />}
                        gradient="from-purple-500/10 to-transparent"
                        border="group-hover:border-purple-500/30"
                    >
                        <div className="flex items-baseline gap-2 mt-2">
                            <span className="text-4xl font-bold text-white tracking-tighter truncate">
                                {stats.lanes[0]?.lane ? ROLE_MAP[stats.lanes[0].lane] || stats.lanes[0].lane : '-'}
                            </span>
                        </div>
                        <div className="mt-4 flex justify-between items-center bg-white/5 rounded-lg px-3 py-1.5 border border-white/5">
                            <span className="text-xs text-zinc-400 uppercase tracking-wider font-bold">Taxa de Vitória</span>
                            <span className={`text-sm font-mono font-bold ${Number(stats.lanes[0]?.winRate) >= 50 ? 'text-emerald-400' : 'text-zinc-500'}`}>
                                {stats.lanes[0]?.winRate}%
                            </span>
                        </div>
                    </HeroCard>
                )}
            </div>

            {/* MAIN CONTENT */}
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">

                {/* CHAMPIONS COLUMN */}
                <motion.div variants={itemVariants} className="xl:col-span-7 flex flex-col gap-6">
                    <div className={`flex flex-col rounded-[2rem] bg-black/20 border border-white/5 backdrop-blur-sm overflow-hidden`}>
                        <div className="p-8 border-b border-white/5 flex justify-between items-center bg-gradient-to-b from-white/[0.03] to-transparent">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-indigo-500/10 rounded-xl border border-indigo-500/20 shadow-lg shadow-indigo-500/5">
                                    <Target size={24} className="text-indigo-400" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-white text-xl">Mestria de Campeões</h3>
                                    <p className="text-[11px] text-zinc-500 uppercase tracking-widest font-bold">Top 10 mais jogados</p>
                                </div>
                            </div>
                        </div>

                        <div className="p-4 space-y-2">
                            {stats.champions.map((champ, i) => (
                                <ChampionRow key={i} index={i} champ={champ} isBoth={isBoth} theme={theme} />
                            ))}
                        </div>
                    </div>

                    {/* MATCHUP ANALYSIS */}
                    {stats.matchups && <MatchupList matchups={stats.matchups} />}

                    {/* TROPHY ROOM */}
                    {stats.trophies && <TrophyRoom trophies={stats.trophies} />}

                </motion.div>

                {/* RIGHT COLUMN: LANES & TEAMMATES */}
                <motion.div variants={itemVariants} className="xl:col-span-5 flex flex-col gap-8">

                    {/* PLAYSTYLE RADAR */}
                    <div className={`h-[420px] p-8 rounded-[2rem] bg-black/20 border border-white/5 backdrop-blur-sm relative overflow-hidden`}>
                        <div className="absolute top-0 right-0 w-40 h-40 bg-violet-500/10 blur-3xl rounded-full translate-x-10 -translate-y-10" />

                        <div className="flex items-center gap-3 mb-2 relative z-10">
                            <div className="p-3 bg-violet-500/10 rounded-xl border border-violet-500/20 shadow-lg shadow-violet-500/5">
                                <Target size={24} className="text-violet-400" />
                            </div>
                            <div>
                                <h3 className="font-bold text-white text-xl">Radar de Estilo</h3>
                                <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold">Análise Multidimensional</p>
                            </div>
                        </div>

                        <div className="w-full h-[320px] -mt-4">
                            {stats.playstyle && <PlaystyleRadar playstyle={stats.playstyle} />}
                        </div>
                    </div>

                    {/* ACTIVITY HEATMAP */}
                    {stats.activity && (
                        <div className="h-[450px]">
                            <ActivityHeatmap activity={stats.activity} />
                        </div>
                    )}

                    {/* DURATION CHART */}
                    {stats.duration && (
                        <div className="h-[300px]">
                            <DurationChart duration={stats.duration} />
                        </div>
                    )}

                    {/* LANES */}
                    <div className={`p-8 rounded-[2rem] bg-black/20 border border-white/5 backdrop-blur-sm relative overflow-hidden`}>
                        <div className="absolute top-0 right-0 w-40 h-40 bg-purple-500/10 blur-3xl rounded-full translate-x-10 -translate-y-10" />

                        <div className="flex justify-between items-start mb-8 relative z-10">
                            <div className="flex items-center gap-3">
                                <div className="p-3 bg-purple-500/10 rounded-xl border border-purple-500/20 shadow-lg shadow-purple-500/5">
                                    <Map size={24} className="text-purple-400" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-white text-xl">Mapa de Calor</h3>
                                    <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold">
                                        {heatmapMode === 'GAMES' ? 'Distribuição de Rotas' : 'Melhores Taxas de Vitória'}
                                    </p>
                                </div>
                            </div>

                            {/* Heatmap Toggle */}
                            <div className="flex bg-black/40 rounded-lg p-1 border border-white/5">
                                <button
                                    onClick={() => setHeatmapMode('GAMES')}
                                    className={`px-3 py-1 rounded-md text-[10px] font-bold transition-all ${heatmapMode === 'GAMES' ? 'bg-purple-500 text-white shadow-lg' : 'text-zinc-500 hover:text-zinc-300'}`}
                                >
                                    JOGOS
                                </button>
                                <button
                                    onClick={() => setHeatmapMode('WINRATE')}
                                    className={`px-3 py-1 rounded-md text-[10px] font-bold transition-all ${heatmapMode === 'WINRATE' ? 'bg-emerald-500 text-white shadow-lg' : 'text-zinc-500 hover:text-zinc-300'}`}
                                >
                                    WINRATE
                                </button>
                            </div>
                        </div>

                        <div className="space-y-6 relative z-10">
                            {sortedLanes.map((lane, i) => (
                                <LaneBar key={i} lane={lane} total={stats.totalGames} isBoth={isBoth} index={i} heatmapMode={heatmapMode} />
                            ))}
                        </div>
                    </div>

                    {/* TEAMMATES */}
                    <div className={`flex flex-col rounded-[2rem] bg-black/20 border border-white/5 backdrop-blur-sm overflow-hidden`}>
                        <div className="p-8 border-b border-white/5 flex justify-between items-center bg-gradient-to-b from-white/[0.03] to-transparent">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-pink-500/10 rounded-xl border border-pink-500/20 shadow-lg shadow-pink-500/5">
                                    <Users size={24} className="text-pink-400" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-white text-xl">Sinergia de Duos</h3>
                                    <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold">Parceiros Frequentes</p>
                                </div>
                            </div>
                        </div>
                        <div className="p-4 space-y-2">
                            {stats.teammates.slice(0, 5).map((mate, i) => (
                                <TeammateRow
                                    key={i}
                                    mate={mate}
                                    index={i}
                                    isMostPlayed={synergyHighlights.mostPlayed === mate}
                                    isMostWins={synergyHighlights.mostWins === mate}
                                />
                            ))}
                            {stats.teammates.length === 0 && <div className="p-8 text-center text-zinc-500 text-sm italic">Nenhum duo frequente encontrado neste período.</div>}
                        </div>
                    </div>

                </motion.div>
            </div>

        </motion.div>
    );
}

// --- COMPLEX SUB COMPONENTS ---

function Counter({ value, className }: { value: number, className?: string }) {
    const motionValue = useMotionValue(0);
    const rounded = useTransform(motionValue, (latest) => Math.round(latest));

    useEffect(() => {
        const controls = animate(motionValue, value, { duration: 1.5, ease: "circOut" });
        return controls.stop;
    }, [value, motionValue]);

    return <motion.span className={className}>{rounded}</motion.span>;
}

function HeroCard({ children, title, subtitle, icon, gradient, border }: any) {
    return (
        <motion.div
            variants={itemVariants}
            className={`relative p-8 rounded-[2rem] bg-black/20 border border-white/5 backdrop-blur-md overflow-hidden group hover:bg-white/[0.02] transition-colors duration-500 ${border}`}
        >
            {/* Ambient Background */}
            <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-50 group-hover:opacity-100 transition-opacity duration-700`} />

            <div className="relative z-10">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest">{subtitle}</span>
                    <div className="p-2 rounded-xl bg-white/5 border border-white/5 group-hover:bg-white/10 transition-colors">
                        {icon}
                    </div>
                </div>
                <h3 className="text-lg font-bold text-white mb-1 opacity-90">{title}</h3>
                {children}
            </div>
        </motion.div>
    )
}

function ComparisonHero({ stats }: { stats: DetailedStats }) {
    const soloWr = Number(stats.comparison.solo.winRate);
    const flexWr = Number(stats.comparison.flex.winRate);
    const diff = (soloWr - flexWr).toFixed(1);
    const isSoloBetter = soloWr >= flexWr;

    return (
        <HeroCard
            title="Análise Comparativa"
            subtitle="Solo vs Flex"
            icon={<ArrowRightLeft size={24} className="text-indigo-300" />}
            gradient="from-indigo-600/20 to-purple-600/20"
            border="border-indigo-500/20 group-hover:border-indigo-500/40"
        >
            <div className="mt-4 space-y-4">
                <div className="flex items-center justify-between">
                    <Badge delta={diff} isSoloBetter={isSoloBetter} />
                </div>

                <div className="space-y-3">
                    <div className="group/bar">
                        <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider mb-1 text-zinc-400 group-hover/bar:text-indigo-300 transition-colors">
                            <span>Solo Queue</span>
                            <span className="font-mono text-white">{soloWr}%</span>
                        </div>
                        <div className="h-2 w-full bg-black/40 rounded-full overflow-hidden border border-white/5">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${soloWr}%` }}
                                transition={{ duration: 1, delay: 0.2 }}
                                className={`h-full ${soloWr >= 50 ? 'bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.4)]' : 'bg-zinc-600'}`}
                            />
                        </div>
                    </div>

                    <div className="group/bar">
                        <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider mb-1 text-zinc-400 group-hover/bar:text-purple-300 transition-colors">
                            <span>Flex Queue</span>
                            <span className="font-mono text-white">{flexWr}%</span>
                        </div>
                        <div className="h-2 w-full bg-black/40 rounded-full overflow-hidden border border-white/5">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${flexWr}%` }}
                                transition={{ duration: 1, delay: 0.4 }}
                                className={`h-full ${flexWr >= 50 ? 'bg-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.4)]' : 'bg-zinc-600'}`}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </HeroCard>
    )
}

function ChampionRow({ champ, isBoth, theme, index }: any) {
    const wr = Number(champ.winRate);
    const isHot = wr >= 70 && champ.games >= 3;
    const rank = index + 1;
    const isTop1 = rank === 1;
    const isTop3 = rank <= 3;

    return (
        <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            className={`relative p-3 rounded-2xl flex items-center justify-between transition-all duration-300 group border ${isTop1 ? 'bg-amber-500/10 border-amber-500/30 shadow-[0_0_20px_rgba(245,158,11,0.1)]' :
                isTop3 ? 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20' :
                    'border-transparent hover:bg-white/5'
                }`}
        >
            {/* Crown for Top 1 */}
            {isTop1 && (
                <div className="absolute -left-3 top-1/2 -translate-y-1/2 bg-gradient-to-br from-amber-400 to-orange-500 text-black p-1.5 rounded-full shadow-[0_0_15px_rgba(245,158,11,0.5)] z-20 border-2 border-zinc-900">
                    <Crown size={14} fill="currentColor" />
                </div>
            )}

            <div className={`flex items-center gap-4 ${isTop1 ? 'ml-3' : ''}`}>
                <div className="relative">
                    <div className={`rounded-2xl overflow-hidden border-2 transition-all duration-500 ${isTop1 ? 'w-16 h-16 border-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.4)]' :
                        isTop3 ? 'w-14 h-14 border-white/20 shadow-lg' :
                            'w-12 h-12 border-zinc-800 group-hover:border-zinc-600'
                        }`}>
                        <ChampionIcon
                            championName={champ.name}
                            className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700"
                        />
                    </div>
                    {isHot && (
                        <div className="absolute -top-2 -right-2 bg-orange-500 text-white p-1 rounded-full border-2 border-zinc-900 shadow-xl z-20 animate-bounce-slow">
                            <Flame size={12} fill="currentColor" />
                        </div>
                    )}
                </div>

                <div>
                    <div className={`font-bold text-white transition-colors ${isTop1 ? 'text-xl text-amber-200 drop-shadow-[0_0_10px_rgba(251,191,36,0.3)]' : 'text-base group-hover:text-amber-200'}`}>
                        {champ.name}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-zinc-500 mt-0.5">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${isTop1 ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'bg-white/5 group-hover:bg-white/10'}`}>
                            {champ.games} JOGOS
                        </span>
                        <span className="w-1 h-1 rounded-full bg-zinc-700" />
                        <span>{champ.kda} KDA</span>
                    </div>
                </div>
            </div>

            {isBoth ? (
                <div className="flex gap-4">
                    <MiniStat label="SOLO" val={champ.soloWr} count={champ.soloGames} color="indigo" />
                    <div className={`w-[1px] h-8 ${isTop1 ? 'bg-amber-500/20' : 'bg-white/5'}`} />
                    <MiniStat label="FLEX" val={champ.flexWr} count={champ.flexGames} color="purple" />
                </div>
            ) : (
                <div className="text-right">
                    <div className={`text-xl font-bold font-mono tracking-tight ${wr >= 60 ? 'text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.3)]' : wr >= 50 ? 'text-emerald-600' : 'text-zinc-500'}`}>
                        {champ.winRate}%
                    </div>
                    <div className="w-20 h-1.5 bg-zinc-800 rounded-full ml-auto mt-2 overflow-hidden">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.min(wr, 100)}%` }}
                            transition={{ duration: 1, delay: 0.5 + (index * 0.1) }}
                            className={`h-full rounded-full ${isHot ? 'bg-gradient-to-r from-orange-500 to-amber-500' : wr >= 50 ? 'bg-emerald-500' : 'bg-zinc-600'}`}
                        />
                    </div>
                </div>
            )}
        </motion.div>
    )
}

function LaneBar({ lane, total, isBoth, index, heatmapMode }: any) {
    const games = lane.games;
    const wr = Number(lane.winRate);
    const playRate = ((games / total) * 100).toFixed(0);
    const name = ROLE_MAP[lane.lane] || lane.lane;

    // Choose what the bar represents based on mode
    const widthPct = heatmapMode === 'WINRATE' ? Math.min(wr, 100) : playRate;
    const barColor = heatmapMode === 'WINRATE'
        ? (wr >= 60 ? 'bg-emerald-500' : wr >= 50 ? 'bg-emerald-600' : 'bg-zinc-600')
        : 'bg-gradient-to-r from-zinc-600 to-zinc-500 group-hover:from-indigo-500 group-hover:to-purple-500';

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 + (index * 0.1) }}
            className="group"
        >
            <div className="flex justify-between items-end mb-2">
                <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-zinc-400 group-hover:text-white transition-colors uppercase tracking-wider">{name}</span>
                    {heatmapMode === 'WINRATE' && (
                        <span className="bg-emerald-500/10 text-emerald-400 text-[10px] px-1.5 rounded border border-emerald-500/20 font-mono font-bold">
                            {wr}% WR
                        </span>
                    )}
                </div>

                <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white bg-white/5 px-2 py-0.5 rounded border border-white/5 group-hover:bg-white/10 group-hover:border-white/20 transition-all">
                        {games} Jogos
                    </span>
                    {isBoth && (
                        <div className="flex gap-1 text-[9px] font-mono opacity-60">
                            <span className={Number(lane.soloWr) >= 50 ? 'text-indigo-300' : 'text-zinc-500'}>S:{lane.soloWr}%</span>
                            <span className={Number(lane.flexWr) >= 50 ? 'text-purple-300' : 'text-zinc-500'}>F:{lane.flexWr}%</span>
                        </div>
                    )}
                </div>
            </div>

            <div className="h-4 w-full bg-black/40 rounded-md overflow-hidden flex relative border border-white/5">
                {/* Main Bar */}
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${widthPct}%` }}
                    transition={{ duration: 1.2, ease: 'circOut', delay: index * 0.1 }}
                    className={`h-full ${barColor} transition-all opacity-90 shadow-lg`}
                />
                {!isBoth && heatmapMode === 'GAMES' && wr >= 50 && (
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] font-bold text-emerald-400">{wr}% WR</span>
                )}
            </div>
        </motion.div>
    )
}

function TeammateRow({ mate, index, isMostPlayed, isMostWins }: any) {
    // Determine the gradient/border style based on status
    const getStyle = () => {
        if (isMostPlayed) return 'bg-indigo-500/5 border-indigo-500/30 hover:bg-indigo-500/10 hover:border-indigo-500/50';
        if (isMostWins) return 'bg-amber-500/5 border-amber-500/30 hover:bg-amber-500/10 hover:border-amber-500/50';
        return 'bg-transparent border-transparent hover:bg-white/5 hover:border-white/10';
    };

    return (
        <Link href={`/player/${mate.player.puuid}`} className="block">
            <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + (index * 0.05) }}
                className={`relative p-3 rounded-xl flex items-center justify-between transition-all duration-300 group border cursor-pointer ${getStyle()}`}
            >
                <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full overflow-hidden border-2 transition-all ${isMostPlayed ? 'border-indigo-400 shadow-[0_0_10px_rgba(99,102,241,0.3)]' :
                        isMostWins ? 'border-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.3)]' :
                            Number(mate.winRate) >= 70 ? 'border-orange-500 shadow-orange-500/20' : 'border-zinc-800'
                        }`}>
                        <PlayerIcon profileIconId={mate.player.profileIconId} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                    </div>
                    <div className="min-w-0">
                        <div className="flex items-center gap-2">
                            <div className="text-sm font-bold text-white truncate group-hover:text-indigo-300 transition-colors">
                                {mate.player.gameName}
                            </div>
                            {isMostPlayed && <div className="text-[8px] bg-indigo-500 text-white px-1.5 py-0.5 rounded font-bold uppercase tracking-wide shadow-lg">Inseparável</div>}
                            {isMostWins && <div className="text-[8px] bg-amber-500 text-black px-1.5 py-0.5 rounded font-bold uppercase tracking-wide shadow-lg">Talismã</div>}
                        </div>
                        <div className="text-[10px] text-zinc-500 flex items-center gap-1 mt-0.5">
                            <Users size={12} className={isMostPlayed ? 'text-indigo-400' : 'text-zinc-600'} />
                            <span className={isMostPlayed ? 'text-indigo-300 font-bold' : ''}>{mate.games} jogos juntos</span>
                        </div>
                    </div>
                </div>
                <div className="text-right">
                    <div className={`text-sm font-bold font-mono ${isMostWins ? 'text-amber-400 drop-shadow-[0_0_5px_rgba(251,191,36,0.5)]' :
                        Number(mate.winRate) >= 50 ? 'text-emerald-400' : 'text-rose-400'
                        }`}>
                        {mate.winRate}%
                    </div>
                    <div className="text-[10px] text-zinc-600 uppercase tracking-widest font-bold">Win Rate</div>
                </div>
            </motion.div>
        </Link>
    )
}

function MiniStat({ label, val, count, color }: any) {
    const v = Number(val);
    const c = color === 'indigo' ? 'text-indigo-300' : 'text-purple-300';
    const bg = color === 'indigo' ? 'bg-indigo-500/10 border-indigo-500/20' : 'bg-purple-500/10 border-purple-500/20';

    return (
        <div className={`text-center px-2 py-1 rounded-lg border ${v >= 50 ? bg : 'border-transparent'}`}>
            <div className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider mb-0.5">{label}</div>
            <div className={`text-sm font-bold font-mono ${v >= 50 ? c : 'text-zinc-600'}`}>{val}%</div>
        </div>
    )
}

function Badge({ delta, isSoloBetter }: any) {
    const val = Math.abs(Number(delta));

    if (val < 1) return <div className="text-[10px] bg-zinc-800 text-zinc-400 px-3 py-1 rounded-full border border-zinc-700 font-bold tracking-wide">PERFORMANCE EQUILIBRADA</div>;

    return (
        <div className={`flex items-center gap-1.5 text-[10px] font-bold px-3 py-1 rounded-full border shadow-lg ${isSoloBetter ? 'bg-indigo-500/20 border-indigo-500/40 text-indigo-300 shadow-indigo-500/10' : 'bg-purple-500/20 border-purple-500/40 text-purple-300 shadow-purple-500/10'}`}>
            <TrendingUp size={12} />
            <span className="tracking-wide">{isSoloBetter ? 'SOLO' : 'FLEX'} DOMINANTE</span>
            <span className="ml-1 bg-white/10 px-1.5 rounded text-white font-mono">+{val}%</span>
        </div>
    )
}
