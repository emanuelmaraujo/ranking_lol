"use client";

import { useEffect, useState, useMemo } from "react";
import { getSeasonRanking, RankingEntry, getHighlights, getPdlGainRanking } from "@/lib/api";
// import { RankingTable } from "@/components/RankingTable";
import { Card } from "@/components/ui/Card";
import { ProfileImage } from "@/components/ui/ProfileImage";
import {
    Trophy, Medal, Crown, Swords, TreeDeciduous, Zap, Crosshair, Shield, Globe, Layers
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useQueue } from "@/contexts/QueueContext";
import Link from "next/link";

// --- Configuration & Constants ---

const TIERS = [
    { id: "ALL", label: "Todos" },
    { id: "CHALLENGER", label: "Challenger" },
    { id: "GRANDMASTER", label: "Grandmaster" },
    { id: "MASTER", label: "Master" },
    { id: "DIAMOND", label: "Diamond" },
    { id: "EMERALD", label: "Emerald" },
    { id: "PLATINUM", label: "Platinum" },
    { id: "GOLD", label: "Gold" },
    { id: "SILVER", label: "Silver" },
    //    { id: "BRONZE", label: "Bronze" },
    //    { id: "IRON", label: "Iron" },
];

const LANES = [
    { id: "TOP", label: "Top", icon: Swords, color: "text-orange-400", bg: "bg-orange-500/10", border: "border-orange-500/20" },
    { id: "JUNGLE", label: "Jungle", icon: TreeDeciduous, color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20" },
    { id: "MID", label: "Mid", icon: Zap, color: "text-purple-400", bg: "bg-purple-500/10", border: "border-purple-500/20" },
    { id: "BOT", label: "Bot", icon: Crosshair, color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/20" },
    { id: "SUPPORT", label: "Support", icon: Shield, color: "text-yellow-400", bg: "bg-yellow-500/10", border: "border-yellow-500/20" },
];

const MODES = [
    { id: "TIER", label: "Por Elo", icon: Layers },
    { id: "GLOBAL", label: "Global", icon: Globe },
    { id: "LANE", label: "Por Rota", icon: Swords }, // Or another icon representing specialization
];

// Helper to calculate raw Elo value for sorting
const getEloValue = (p: RankingEntry) => {
    const tierScores: Record<string, number> = {
        CHALLENGER: 90000, GRANDMASTER: 80000, MASTER: 70000,
        DIAMOND: 60000, EMERALD: 50000, PLATINUM: 40000,
        GOLD: 30000, SILVER: 20000, BRONZE: 10000, IRON: 0
    };
    const rankScores: Record<string, number> = { I: 300, II: 200, III: 100, IV: 0, "": 0 };
    return (tierScores[p.tier] || 0) + (rankScores[p.rankDivision] || 0) + p.lp;
};

export default function RankingPage() {
    const { queueType } = useQueue();

    // --- State ---
    const [players, setPlayers] = useState<RankingEntry[]>([]);
    const [loading, setLoading] = useState(true);

    // View Config
    const [viewMode, setViewMode] = useState<"TIER" | "GLOBAL" | "LANE">("TIER");

    // Filters
    const [activeTier, setActiveTier] = useState("ALL");
    const [activeLane, setActiveLane] = useState("MID"); // Default to Mid or Top

    // --- Data Fetching ---
    // --- Data Fetching ---
    const [highlights, setHighlights] = useState<any>(null); // Simplified
    const [topGainer, setTopGainer] = useState<any>(null);

    useEffect(() => {
        setLoading(true);
        const fetchData = async () => {
            try {
                const [rankData, hlData, gainData] = await Promise.all([
                    getSeasonRanking(queueType),
                    getHighlights(queueType), // Uses API
                    getPdlGainRanking(queueType, 5, new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
                ]);
                setPlayers(rankData);
                setHighlights(hlData);
                setTopGainer(gainData[0]); // Best gainer
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [queueType]);

    // --- Logic: Memoized Sorting & Filtering ---
    const topData = useMemo(() => {
        let processed = [...players];
        // ... (existing logic)
        // 1. Filter Logic
        if (viewMode === "TIER" && activeTier !== "ALL") {
            processed = processed.filter(p => p.tier === activeTier);
        }

        // 2. Sort Logic
        if (viewMode === "LANE") {
            // ...
            processed.sort((a, b) => {
                const scoreA = a.laneScores?.[activeLane] || 0;
                const scoreB = b.laneScores?.[activeLane] || 0;
                return scoreB - scoreA;
            });
            processed = processed.filter(p => (p.laneScores?.[activeLane] || 0) > 0);
        } else if (viewMode === "GLOBAL") {
            processed.sort((a, b) => b.totalScore - a.totalScore);
        } else {
            processed.sort((a, b) => getEloValue(b) - getEloValue(a));
        }

        return processed;
    }, [players, viewMode, activeTier, activeLane]);

    const topPlayer = topData.length > 0 ? topData[0] : null;

    // --- Render Helpers ---

    return (
        <div className="space-y-8 animate-in fade-in duration-700 pb-12">

            {/* --- INSIGHTS SECTION (New) --- */}
            {!loading && (highlights || topGainer) && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                    {/* 1. Top Gainer */}
                    {topGainer && (
                        <div className="bg-gradient-to-br from-emerald-900/40 to-black border border-emerald-500/20 rounded-2xl p-4 flex items-center gap-4 relative overflow-hidden group">
                            <div className="absolute inset-0 bg-emerald-500/5 group-hover:bg-emerald-500/10 transition-colors" />
                            <div className="relative z-10 p-3 bg-emerald-500/20 rounded-full text-emerald-400">
                                <Zap size={24} />
                            </div>
                            <div className="relative z-10">
                                <h4 className="text-xs font-bold uppercase text-emerald-400 tracking-wider mb-1">Subiu d+</h4>
                                <div className="text-white font-bold text-lg leading-none">{topGainer.gameName}</div>
                                <div className="text-emerald-300 text-sm font-bold">+{topGainer.pdlGain} PDL <span className="text-zinc-500 text-xs font-normal">na semana</span></div>
                            </div>
                        </div>
                    )}

                    {/* 2. Hot Streak (MVP or Survivor) */}
                    {highlights?.mvp && (
                        <div className="bg-gradient-to-br from-orange-900/40 to-black border border-orange-500/20 rounded-2xl p-4 flex items-center gap-4 relative overflow-hidden group">
                            <div className="absolute inset-0 bg-orange-500/5 group-hover:bg-orange-500/10 transition-colors" />
                            <div className="relative z-10 p-3 bg-orange-500/20 rounded-full text-orange-400">
                                <Trophy size={24} />
                            </div>
                            <div className="relative z-10">
                                <h4 className="text-xs font-bold uppercase text-orange-400 tracking-wider mb-1">MVP da Semana</h4>
                                <div className="text-white font-bold text-lg leading-none">{highlights.mvp.gameName}</div>
                                <div className="text-orange-300 text-sm font-bold">{highlights.mvp.value} <span className="text-zinc-500 text-xs font-normal">Score</span></div>
                            </div>
                        </div>
                    )}

                    {/* 3. Most Active */}
                    {highlights?.mostActive && (
                        <div className="bg-gradient-to-br from-blue-900/40 to-black border border-blue-500/20 rounded-2xl p-4 flex items-center gap-4 relative overflow-hidden group">
                            <div className="absolute inset-0 bg-blue-500/5 group-hover:bg-blue-500/10 transition-colors" />
                            <div className="relative z-10 p-3 bg-blue-500/20 rounded-full text-blue-400">
                                <Swords size={24} />
                            </div>
                            <div className="relative z-10">
                                <h4 className="text-xs font-bold uppercase text-blue-400 tracking-wider mb-1">Sem Vida</h4>
                                <div className="text-white font-bold text-lg leading-none">{highlights.mostActive.gameName}</div>
                                <div className="text-blue-300 text-sm font-bold">{highlights.mostActive.value} <span className="text-zinc-500 text-xs font-normal">partidas</span></div>
                            </div>
                        </div>
                    )}
                </div>
            )}


            {/* Header with Mode Switcher */}
            <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6">
                <div>
                    <h2 className="text-4xl font-[family-name:var(--font-outfit)] font-bold text-white tracking-tight flex items-center gap-3">
                        <Trophy className="w-10 h-10 text-yellow-500" />
                        <span className="bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
                            Ranking da Temporada
                        </span>
                    </h2>
                    <p className="text-zinc-400 mt-2 text-lg">
                        {viewMode === "TIER" && "Classificação oficial baseada em PDL e Elo."}
                        {viewMode === "GLOBAL" && "Os maiores pontuadores do RiftScore geral."}
                        {viewMode === "LANE" && `Os reis da rota ${LANES.find(l => l.id === activeLane)?.label}.`}
                    </p>
                </div>

                {/* Mode Tabs (Premium Look) */}
                <div className="flex flex-col sm:flex-row gap-4 bg-black/40 p-1.5 rounded-2xl border border-white/10 backdrop-blur-xl">
                    {MODES.map((mode) => (
                        <button
                            key={mode.id}
                            onClick={() => setViewMode(mode.id as any)}
                            className={`relative px-6 py-3 rounded-xl text-sm font-bold transition-all duration-300 flex items-center gap-2 ${viewMode === mode.id ? "text-white shadow-lg shadow-emerald-900/20" : "text-gray-400 hover:text-white"
                                }`}
                        >
                            {viewMode === mode.id && (
                                <motion.div
                                    layoutId="activeModeTab"
                                    className="absolute inset-0 bg-emerald-600 rounded-xl"
                                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                />
                            )}
                            <span className="relative z-10 flex items-center gap-2">
                                <mode.icon className="w-4 h-4" />
                                {mode.label}
                            </span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Sub-Filters (Tier Tabs OR Lane Selector) */}
            <div className="fresnel-container min-h-[60px]">
                <AnimatePresence mode="wait">
                    {viewMode === "TIER" && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="flex overflow-x-auto pb-4 no-scrollbar gap-2"
                        >
                            {TIERS.map((tier) => (
                                <button
                                    key={tier.id}
                                    onClick={() => setActiveTier(tier.id)}
                                    className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all border ${activeTier === tier.id
                                        ? "bg-white text-black border-white"
                                        : "bg-white/5 text-gray-400 border-white/5 hover:bg-white/10 hover:border-white/20"
                                        }`}
                                >
                                    {tier.label}
                                </button>
                            ))}
                        </motion.div>
                    )}

                    {viewMode === "LANE" && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="flex flex-wrap gap-3 justify-center md:justify-start"
                        >
                            {LANES.map((lane) => {
                                const isActive = activeLane === lane.id;
                                return (
                                    <button
                                        key={lane.id}
                                        onClick={() => setActiveLane(lane.id)}
                                        className={`group relative px-6 py-4 rounded-xl border flex flex-col items-center gap-2 transition-all duration-300 min-w-[100px] ${isActive
                                            ? `${lane.bg} ${lane.border} ring-2 ring-white/20`
                                            : "bg-black/20 border-white/5 hover:bg-white/5 hover:border-white/10"
                                            }`}
                                    >
                                        <lane.icon className={`w-6 h-6 ${isActive ? lane.color : "text-gray-500 group-hover:text-gray-300"}`} />
                                        <span className={`text-xs font-bold uppercase tracking-wider ${isActive ? "text-white" : "text-gray-500"}`}>
                                            {lane.label}
                                        </span>
                                        {isActive && (
                                            <motion.div
                                                layoutId="activeLaneIndicator"
                                                className={`absolute inset-0 rounded-xl border-2 ${lane.border.replace('border-', 'border-')}`}
                                            />
                                        )}
                                    </button>
                                );
                            })}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {loading ? (
                <div className="space-y-6">
                    <div className="h-64 w-full bg-white/5 rounded-3xl animate-pulse" />
                    <div className="space-y-3">
                        {[1, 2, 3].map(i => <div key={i} className="h-20 w-full bg-white/5 rounded-xl animate-pulse" />)}
                    </div>
                </div>
            ) : (
                <div className="space-y-10">

                    {/* HERO SECTION: The King */}
                    <AnimatePresence mode="wait">
                        {topPlayer && (
                            <motion.div
                                key={topPlayer.puuid + viewMode + activeLane + activeTier}
                                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                                transition={{ type: "spring", duration: 0.6 }}
                            >
                                <Card variant="glass" className="relative overflow-hidden group border-yellow-500/30">
                                    {/* Dynamic Background Gradient */}
                                    <div className={`absolute inset-0 bg-gradient-to-r opacity-20 transition-colors duration-500 ${viewMode === "LANE"
                                        ? (LANES.find(l => l.id === activeLane)?.bg?.replace('/10', '/30') || "from-yellow-600/20")
                                        : "from-yellow-600/20 via-orange-500/10 to-transparent"
                                        }`} />

                                    <div className="absolute top-0 right-0 w-96 h-96 bg-yellow-500/10 blur-[100px] rounded-full translate-x-1/3 -translate-y-1/3" />

                                    <div className="relative z-10 p-8 flex flex-col md:flex-row items-center gap-8">

                                        {/* Avatar / Rank Insignia */}
                                        <div className="relative">
                                            <Link href={`/player/${topPlayer.puuid}`}>
                                                <div className="w-24 h-24 md:w-32 md:h-32 rounded-full bg-gradient-to-br from-yellow-400 to-amber-700 p-1 shadow-[0_0_40px_rgba(245,158,11,0.3)] cursor-pointer hover:scale-105 transition-transform">
                                                    <div className="w-full h-full rounded-full bg-black flex items-center justify-center overflow-hidden border-4 border-black">
                                                        {/* Profile Icon Placeholder or Real Image */}
                                                        {/* Profile Icon with Fallback */}
                                                        <div className="w-full h-full relative">
                                                            <ProfileImage
                                                                profileIconId={topPlayer.profileIconId}
                                                                className="w-full h-full"
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            </Link>
                                            <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-yellow-600 to-amber-600 text-white text-xs md:text-sm font-bold px-4 py-1 rounded-full shadow-lg border border-yellow-400 whitespace-nowrap pointer-events-none">
                                                TOP 1
                                            </div>
                                        </div>

                                        {/* Info */}
                                        <div className="flex-1 text-center md:text-left">
                                            <div className="flex items-center justify-center md:justify-start gap-3 mb-2">
                                                <span className="text-yellow-500 text-sm font-bold uppercase tracking-widest flex items-center gap-2">
                                                    {viewMode === "LANE" && <Crown className="w-4 h-4" />}
                                                    {viewMode === "TIER" ? `Líder ${activeTier === 'ALL' ? 'Geral' : activeTier}` :
                                                        viewMode === "LANE" ? `Rei do ${LANES.find(l => l.id === activeLane)?.label}` :
                                                            "Líder Global"}
                                                </span>
                                            </div>
                                            <Link href={`/player/${topPlayer.puuid}`}>
                                                <h3 className="text-4xl md:text-5xl font-[family-name:var(--font-outfit)] font-black text-white mb-2 tracking-tight hover:text-yellow-400 transition-colors cursor-pointer">
                                                    {topPlayer.gameName}
                                                    <span className="text-zinc-500 text-2xl font-normal ml-2 font-sans">#{topPlayer.tagLine}</span>
                                                </h3>
                                            </Link>

                                            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 md:gap-8 text-sm md:text-lg text-gray-300 font-medium">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-2 h-2 rounded-full bg-emerald-500" />
                                                    {viewMode === "LANE"
                                                        ? `${(topPlayer.laneScores?.[activeLane] || 0)} Pontos na Rota`
                                                        : `${topPlayer.totalScore.toFixed(0)} Pontos Totais`
                                                    }
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <div className="w-2 h-2 rounded-full bg-blue-500" />
                                                    {topPlayer.winRate} Winrate
                                                </div>
                                                {viewMode === "TIER" && (
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-2 h-2 rounded-full bg-purple-500" />
                                                        {topPlayer.tier} {topPlayer.rankDivision} - {topPlayer.lp} PDL
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Big Icon Background */}
                                        <div className="hidden xl:block absolute right-10 top-1/2 -translate-y-1/2 opacity-5 pointer-events-none">
                                            {viewMode === "LANE" ? (
                                                (() => {
                                                    const Icon = LANES.find(l => l.id === activeLane)?.icon || Crown;
                                                    return <Icon className="w-64 h-64" />;
                                                })()
                                            ) : (
                                                <Trophy className="w-64 h-64" />
                                            )}
                                        </div>
                                    </div>
                                </Card>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Mobile Card View (< md) */}
                    <div className="md:hidden space-y-4">
                        {topData.slice(0, 50).map((player, index) => (
                            <Card key={player.puuid} variant="glass" className="p-4 border-white/5 bg-black/20">
                                <div className="flex items-center gap-4">
                                    {/* Rank */}
                                    <div className={`
                                        flex items-center justify-center w-10 h-10 rounded-xl font-black text-lg
                                        ${index === 0 ? "bg-yellow-500/10 text-yellow-500 border border-yellow-500/20" :
                                            index === 1 ? "bg-gray-300/10 text-gray-300 border border-gray-300/20" :
                                                index === 2 ? "bg-orange-700/10 text-orange-500 border border-orange-700/20" :
                                                    "bg-white/5 text-gray-500 border border-white/5"}
                                    `}>
                                        {index + 1}
                                    </div>

                                    {/* Player */}
                                    <Link href={`/player/${player.puuid}`} className="flex items-center gap-3 flex-1 min-w-0 hover:opacity-80 transition-opacity">
                                        <div className="w-10 h-10 rounded-full border border-white/10 overflow-hidden shrink-0">
                                            <ProfileImage profileIconId={player.profileIconId} className="w-full h-full" />
                                        </div>
                                        <div className="min-w-0">
                                            <div className="font-bold text-white truncate text-lg leading-tight">
                                                {player.gameName}
                                            </div>
                                            <div className="text-xs text-gray-500 font-mono">#{player.tagLine}</div>
                                        </div>
                                    </Link>
                                </div>

                                {/* Stats Grid */}
                                <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-white/5">
                                    <div className="flex flex-col">
                                        <span className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">Elo</span>
                                        <div className="flex items-center gap-1.5">
                                            <div className={`w-1.5 h-1.5 rounded-full ${player.tier === "CHALLENGER" ? "bg-yellow-400" : "bg-gray-400"}`} />
                                            <span className={`text-sm font-bold ${player.tier === "CHALLENGER" ? "text-yellow-400" : "text-gray-300"}`}>
                                                {player.tier} {player.rankDivision}
                                            </span>
                                        </div>
                                        <span className="text-xs text-gray-500">{player.lp} LP</span>
                                    </div>

                                    <div className="flex flex-col items-end">
                                        <span className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">
                                            {viewMode === "LANE" ? "Pontos" : "RiftScore"}
                                        </span>
                                        <span className="text-xl font-black text-emerald-400 leading-none">
                                            {viewMode === "LANE"
                                                ? (player.laneScores?.[activeLane] || 0).toLocaleString()
                                                : player.totalScore.toFixed(0)
                                            }
                                        </span>
                                    </div>
                                </div>
                            </Card>
                        ))}
                        {topData.length === 0 && (
                            <div className="p-8 text-center text-gray-500 border border-dashed border-white/10 rounded-xl">
                                Nenhum jogador encontrado.
                            </div>
                        )}
                    </div>

                    {/* Desktop Table/Grid View (md+) */}
                    <div className="hidden md:block bg-black/20 rounded-3xl border border-white/5 overflow-hidden backdrop-blur-sm">

                        {/* Custom Table Header */}
                        <div className="grid grid-cols-12 gap-4 p-4 border-b border-white/10 text-xs font-bold text-gray-500 uppercase tracking-wider">
                            <div className="col-span-1 text-center">#</div>
                            <div className="col-span-4 md:col-span-3 lg:col-span-3">Jogador</div>
                            <div className="col-span-3 md:col-span-2 lg:col-span-2">Elo</div>
                            <div className="col-span-4 md:col-span-6 lg:col-span-6 text-right pr-4">
                                {viewMode === "LANE" ? "Pontuação da Rota" : "Pontuação Global"}
                            </div>
                        </div>

                        {/* List Items */}
                        <div className="divide-y divide-white/5">
                            {topData.slice(0, 50).map((player, index) => (
                                <motion.div
                                    key={player.puuid}
                                    initial={{ opacity: 0, x: -20 }}
                                    whileInView={{ opacity: 1, x: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ duration: 0.3, delay: index * 0.03 }} // Stagger Effect
                                    className="grid grid-cols-12 gap-4 p-4 items-center hover:bg-white/5 transition-colors group cursor-default"
                                >
                                    {/* Rank */}
                                    <div className="col-span-1 flex justify-center">
                                        <div className={`w-8 h-8 flex items-center justify-center rounded-lg font-bold ${index === 0 ? "bg-yellow-500 text-black shadow-lg shadow-yellow-500/20" :
                                            index === 1 ? "bg-gray-300 text-black" :
                                                index === 2 ? "bg-orange-700 text-white" :
                                                    "text-gray-500 bg-white/5"
                                            }`}>
                                            {index + 1}
                                        </div>
                                    </div>

                                    {/* Player Info */}
                                    <Link href={`/player/${player.puuid}`} className="col-span-4 md:col-span-3 lg:col-span-3 flex items-center gap-3 hover:opacity-80 transition-opacity">
                                        <div className="w-10 h-10 rounded-full bg-black border border-white/10 overflow-hidden">
                                            <ProfileImage
                                                profileIconId={player.profileIconId}
                                                className="w-full h-full"
                                            />
                                        </div>
                                        <div>
                                            <div className="font-bold text-white group-hover:text-emerald-400 transition-colors truncate">
                                                {player.gameName}
                                            </div>
                                            <div className="text-xs text-gray-500">#{player.tagLine}</div>
                                        </div>
                                    </Link>

                                    {/* Tier Info */}
                                    <div className="col-span-3 md:col-span-2 lg:col-span-2">
                                        <div className="flex flex-col">
                                            <span className={`text-xs font-bold ${player.tier === "CHALLENGER" ? "text-yellow-400" :
                                                player.tier === "GRANDMASTER" ? "text-red-400" :
                                                    player.tier === "MASTER" ? "text-purple-400" :
                                                        "text-gray-300"
                                                }`}>
                                                {player.tier} {player.rankDivision}
                                            </span>
                                            <span className="text-[10px] text-gray-500">{player.lp} LP</span>
                                        </div>
                                    </div>

                                    {/* Score Info (Dynamic) */}
                                    <div className="col-span-4 md:col-span-6 lg:col-span-6 text-right pr-4">
                                        <div className="flex flex-col items-end">
                                            <span className="text-xl font-black text-white group-hover:scale-110 transition-transform bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-emerald-200">
                                                {viewMode === "LANE"
                                                    ? (player.laneScores?.[activeLane] || 0).toLocaleString()
                                                    : player.totalScore.toFixed(0)
                                                }
                                            </span>
                                            <span className="text-[10px] uppercase font-bold tracking-wider text-gray-500">
                                                {viewMode === "LANE" ? "Pontos de Lane" : "RiftScore"}
                                            </span>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>

                        {topData.length === 0 && (
                            <div className="p-12 text-center text-gray-500">
                                Nenhum jogador encontrado para este filtro.
                            </div>
                        )}
                    </div>

                </div>
            )}
        </div>
    );
}
