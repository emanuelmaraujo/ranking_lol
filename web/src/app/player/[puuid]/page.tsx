"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { getPlayerHistory, getPlayerInsights, getPdlEvolution, PlayerHistory, PlayerInsights, MatchHistoryEntry, PdlEvolution } from "@/lib/api";
import { PdlChart } from "@/components/PdlChart";
import { MatchHistoryGrid } from "@/components/MatchHistoryGrid";
import { MatchDetailsModal } from "@/components/MatchDetailsModal";
import { PlayerHeader } from "@/components/PlayerHeader";
import { StatsGrid } from "@/components/StatsGrid";
import { WeeklyReportCard } from "@/components/WeeklyReportCard";
import { PlaystyleRadar } from "@/components/PlaystyleRadar";
import { MasteryShowcase } from "@/components/MasteryShowcase";
import { TrendingUp, Award } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { useQueue } from "@/contexts/QueueContext";
import { PlayerProfileSkeleton } from "@/components/PlayerProfileSkeleton";
import { motion } from "framer-motion";
import { BackgroundParticles } from "@/components/BackgroundParticles";
import { getTheme } from "@/lib/tier-themes";

export default function PlayerProfile({ params }: { params: Promise<{ puuid: string }> }) {
    const { puuid } = use(params);
    const router = useRouter();
    const { queueType, setQueueType } = useQueue();
    const queue = queueType;

    const [evolution, setEvolution] = useState<PdlEvolution | null>(null);
    const [history, setHistory] = useState<PlayerHistory | null>(null);
    const [insights, setInsights] = useState<PlayerInsights | null>(null);

    // Loading States
    const [initialLoading, setInitialLoading] = useState(true);
    const [isRefetching, setIsRefetching] = useState(false);

    const [selectedMatch, setSelectedMatch] = useState<MatchHistoryEntry | null>(null);

    // Pagination & Sort State
    const [page, setPage] = useState(1);
    const [sort, setSort] = useState<'asc' | 'desc'>('desc');
    const [chartFilter, setChartFilter] = useState<'ALL' | 'MONTHLY' | 'WEEKLY'>('ALL');

    const getFilteredHistory = () => {
        if (!history) return [];
        const now = new Date();
        const cutoff = new Date();

        if (chartFilter === 'WEEKLY') cutoff.setDate(now.getDate() - 7);
        if (chartFilter === 'MONTHLY') cutoff.setDate(now.getDate() - 30);
        if (chartFilter === 'ALL') return history.history;

        return history.history.filter(h => new Date(h.date) >= cutoff);
    };

    // Initial Load
    useEffect(() => {
        const loadInitial = async () => {
            setInitialLoading(true);
            try {
                const [hData, iData, eData] = await Promise.all([
                    getPlayerHistory(puuid, queue),
                    getPlayerInsights(puuid, queue, 1, 10, sort),
                    getPdlEvolution(puuid, queue)
                ]);
                setHistory(hData);
                setInsights(iData);
                setEvolution(eData);
            } catch (e) { console.error(e); }
            finally { setInitialLoading(false); }
        };
        loadInitial();
    }, [puuid, queue]); // Only on Queue or PUUID change (Full Reset)

    // Pagination/Sort Update (Background Fetch)
    useEffect(() => {
        if (initialLoading) return; // Don't conflict
        const updateInsights = async () => {
            setIsRefetching(true);
            try {
                const iData = await getPlayerInsights(puuid, queue, page, 10, sort);
                setInsights(iData);
            } catch (e) { console.error(e); }
            finally { setIsRefetching(false); }
        };
        updateInsights();
    }, [page, sort, puuid, queue, initialLoading]); // Added puuid, queue, initialLoading to dependencies

    useEffect(() => {
        setPage(1);
    }, [queue, sort]);

    if (initialLoading) return <PlayerProfileSkeleton />;
    if (!history || !insights) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] text-center">
                <h2 className="text-2xl font-[family-name:var(--font-outfit)] font-bold text-white mb-2">Jogador não encontrado</h2>
                <button onClick={() => router.push('/')} className="mt-4 px-6 py-2 bg-white/10 rounded-lg hover:bg-white/20">
                    Voltar ao Ranking
                </button>
            </div>
        );
    }

    // --- THEME ENGINE ---
    const theme = getTheme(history.player.tier);
    // --------------------

    return (
        <div className={`min-h-screen pb-20 relative overflow-hidden ${theme.colors.background} transition-colors duration-700`}>

            <BackgroundParticles theme={theme} />

            {/* Dynamic Background Gradient (Refined) */}
            <div className={`absolute top-0 inset-x-0 h-[1000px] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] ${theme.gradients.hero} opacity-30 pointer-events-none blur-3xl`} />

            <div className={`max-w-7xl mx-auto px-4 sm:px-6 relative z-10 pt-8`}>

                {/* 1. Header Principal */}
                <PlayerHeader
                    displayName={history.player.displayName}
                    gameName={history.player.displayName.split('#')[0]}
                    tagLine={history.player.displayName.split('#')[1]}
                    tier={history.player.tier}
                    rank={history.player.rank}
                    lp={history.player.lp}
                    profileIconId={history.player.profileIconId}
                    summonerLevel={history.player.summonerLevel}
                    queueType={queue}
                    onQueueChange={setQueueType}
                    history={insights.history}
                />

                {/* 2. Main Grid Layout */}
                <div className={`grid grid-cols-1 xl:grid-cols-12 ${theme.styles.layoutGap} mt-8`}>
                    {/* Left Column (Chart, History) - 8 cols */}
                    <div className={`xl:col-span-8 space-y-${theme.styles.layoutGap.replace('gap-', '')}`}>

                        {/* A. Evolution Chart */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className={`${theme.styles.borderRadius} p-6 ${theme.colors.cardBg} shadow-2xl relative overflow-hidden`}
                        >
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-lg bg-white/5`}>
                                        <TrendingUp size={20} className={theme.colors.accent} />
                                    </div>
                                    <div>
                                        <h3 className={`text-lg font-[family-name:var(--font-outfit)] font-bold ${theme.colors.text}`}>Evolução de PDL</h3>
                                    </div>
                                </div>
                                {/* Filters */}
                                <div className="flex bg-black/20 p-1 rounded-lg">
                                    {(['ALL', 'MONTHLY', 'WEEKLY'] as const).map((f) => (
                                        <button
                                            key={f}
                                            onClick={() => setChartFilter(f)}
                                            className={`px-3 py-1 text-[10px] font-bold rounded transition-colors ${chartFilter === f ? 'bg-white/10 text-white' : 'text-zinc-500 hover:text-white'
                                                }`}
                                        >
                                            {f === 'ALL' ? 'GERAL' : f === 'MONTHLY' ? 'MÊS' : 'SEMANA'}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="h-[300px] w-full">
                                <PdlChart history={getFilteredHistory()} theme={theme} />
                            </div>
                        </motion.div>

                        {/* B. Match History Grid */}
                        <div className="relative">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className={`text-lg font-[family-name:var(--font-outfit)] font-bold ${theme.colors.text} uppercase tracking-wider flex items-center gap-2`}>
                                    Histórico
                                    {isRefetching && <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded text-zinc-400 animate-pulse">Atualizando...</span>}
                                </h3>
                                <div className="flex gap-2">
                                    <button onClick={() => setSort('desc')} className={`text-xs font-bold px-2 py-1 rounded transition-colors ${sort === 'desc' ? 'text-white bg-white/10' : 'text-zinc-500 hover:text-zinc-300'}`}>Recente</button>
                                    <button onClick={() => setSort('asc')} className={`text-xs font-bold px-2 py-1 rounded transition-colors ${sort === 'asc' ? 'text-white bg-white/10' : 'text-zinc-500 hover:text-zinc-300'}`}>Antigo</button>
                                </div>
                            </div>

                            {/* Content with Opacity Transition */}
                            <div className={`transition-opacity duration-300 ${isRefetching ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
                                <MatchHistoryGrid history={insights.history} theme={theme} onSelectMatch={setSelectedMatch} />
                            </div>

                            {/* Modern Pagination Bar */}
                            {insights.pagination && insights.pagination.totalPages > 1 && (
                                <div className="flex justify-between items-center mt-6 bg-black/20 p-2 rounded-xl border border-white/5 backdrop-blur-sm">
                                    <button
                                        onClick={() => setPage(p => Math.max(1, p - 1))}
                                        disabled={page === 1 || isRefetching}
                                        className="px-4 py-2 hover:bg-white/5 rounded-lg text-xs font-bold text-zinc-400 hover:text-white disabled:opacity-30 disabled:hover:bg-transparent transition-all flex items-center gap-2"
                                    >
                                        <span>←</span> Anterior
                                    </button>

                                    <span className="text-xs font-mono font-bold text-zinc-600">
                                        Página <span className="text-white">{page}</span> de {insights.pagination.totalPages}
                                    </span>

                                    <button
                                        onClick={() => setPage(p => Math.min(insights.pagination!.totalPages, p + 1))}
                                        disabled={page >= insights.pagination.totalPages || isRefetching}
                                        className="px-4 py-2 hover:bg-white/5 rounded-lg text-xs font-bold text-zinc-400 hover:text-white disabled:opacity-30 disabled:hover:bg-transparent transition-all flex items-center gap-2"
                                    >
                                        Próximo <span>→</span>
                                    </button>
                                </div>
                            )}
                        </div>

                    </div>

                    {/* Right Column (Stats, Weekly, Mastery) - 4 cols */}
                    <div className={`xl:col-span-4 space-y-${theme.styles.layoutGap.replace('gap-', '')}`}>

                        {/* A. Profile Stats (Moved Here) */}
                        <div className="space-y-2">
                            <h4 className="text-xs font-[family-name:var(--font-outfit)] font-bold text-zinc-500 uppercase tracking-widest px-1">Performance Geral</h4>
                            {/* Force 2 cols for sidebar look */}
                            <StatsGrid stats={insights.stats} theme={theme} className="!grid-cols-2 !lg:grid-cols-2 !mb-0" />
                        </div>

                        {/* B. Weekly Report (Backend Driven) */}
                        {insights.weeklyReport && (
                            <WeeklyReportCard
                                theme={theme}
                                report={insights.weeklyReport}
                            />
                        )}

                        {/* C. Playstyle Radar (New) */}
                        {insights.playstyle && (
                            <PlaystyleRadar
                                playstyle={insights.playstyle}
                                theme={theme}
                            />
                        )}

                        {/* D. Mastery Card */}
                        <MasteryShowcase masteries={history.masteries} theme={theme} />

                    </div>
                </div>
            </div>

            {/* Side Panel Overlay */}
            {/* Match Details Modal */}
            <MatchDetailsModal
                match={selectedMatch}
                puuid={puuid}
                onClose={() => setSelectedMatch(null)}
            />
        </div>
    );
}
