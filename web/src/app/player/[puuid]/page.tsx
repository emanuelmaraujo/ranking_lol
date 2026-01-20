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

    // States
    const [initialLoading, setInitialLoading] = useState(true);
    const [isRefetching, setIsRefetching] = useState(false);
    const [selectedMatch, setSelectedMatch] = useState<MatchHistoryEntry | null>(null);

    // Pagination & Sort
    const [page, setPage] = useState(1);
    const [sort, setSort] = useState<'asc' | 'desc'>('desc');

    // NEW: Global Time Filter
    const [timeFilter, setTimeFilter] = useState<'DAY' | 'WEEK' | 'MONTH' | 'ALL'>('WEEK');

    // Helper to get Dates
    const getDateRange = () => {
        const now = new Date();
        const start = new Date();

        // Brazil Time correction isn't strictly needed if we just use standard Date objects and let Backend handle exact comparison, 
        // but for "Start of Day" it matters.
        // Let's rely on simple JS Dates for now, as local browser time is usually close enough or valid for "Today".
        // Ideally backend handles timezone, but we pass ISO strings.

        if (timeFilter === 'DAY') {
            start.setHours(0, 0, 0, 0); // Today 00:00
        } else if (timeFilter === 'WEEK') {
            // Monday of this week
            const day = start.getDay();
            const diff = start.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
            start.setDate(diff);
            start.setHours(0, 0, 0, 0);
        } else if (timeFilter === 'MONTH') {
            start.setDate(1); // 1st of Month
            start.setHours(0, 0, 0, 0);
        } else {
            return { start: undefined, end: undefined }; // ALL
        }
        return { start: start.toISOString(), end: now.toISOString() };
    };

    // Filtered Chart Logic (Client Side for smooth transition or consistency)
    const getFilteredHistory = () => {
        if (!history) return [];
        const { start } = getDateRange();
        if (!start) return history.history; // ALL
        const startDate = new Date(start);
        return history.history.filter(h => new Date(h.date) >= startDate);
    };

    // Data Fetching
    const fetchData = async (isInitial = false) => {
        if (isInitial) setInitialLoading(true);
        else setIsRefetching(true);

        try {
            const { start, end } = getDateRange();

            // Parallel Fetch
            const promises: any[] = [
                getPlayerInsights(puuid, queue, page, 10, sort, start, end)
            ];

            // Only fetch static/heavy stuff on initial load or Queue Change
            if (isInitial) {
                promises.push(getPlayerHistory(puuid, queue));
                promises.push(getPdlEvolution(puuid, queue));
            }

            const results = await Promise.all(promises);
            setInsights(results[0]);

            if (isInitial) {
                setHistory(results[1]);
                setEvolution(results[2]);
            }
        } catch (e) {
            console.error(e);
        } finally {
            if (isInitial) setInitialLoading(false);
            else setIsRefetching(false);
        }
    };

    // Trigger Fetch on Dependencies
    useEffect(() => {
        fetchData(true);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [puuid, queue]); // Full Reset

    // Partial Update (Filter/Page/Sort)
    useEffect(() => {
        if (!initialLoading) {
            fetchData(false);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [page, sort, timeFilter]);

    // Reset Page on Filter Change
    useEffect(() => {
        setPage(1);
    }, [timeFilter, queue]);


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

    const theme = getTheme(history.player.tier);

    // Dynamic Title for Weekly Report
    const reportTitle =
        timeFilter === 'DAY' ? 'Performance Diária' :
            timeFilter === 'WEEK' ? 'Performance Semanal' :
                timeFilter === 'MONTH' ? 'Performance Mensal' :
                    'Performance Geral';

    return (
        <div className={`min-h-screen pb-20 relative overflow-hidden ${theme.colors.background} transition-colors duration-700`}>

            <BackgroundParticles theme={theme} />
            <div className={`absolute top-0 inset-x-0 h-[1000px] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] ${theme.gradients.hero} opacity-30 pointer-events-none blur-3xl`} />

            <div className={`max-w-7xl mx-auto px-4 sm:px-6 relative z-10 pt-8`}>

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

                {/* GLOBAL FILTER BAR */}
                <div className="flex justify-center mb-8">
                    <div className="flex bg-black/40 p-1.5 rounded-full border border-white/5 backdrop-blur-md shadow-2xl gap-1">
                        {(['DAY', 'WEEK', 'MONTH', 'ALL'] as const).map((f) => (
                            <button
                                key={f}
                                onClick={() => setTimeFilter(f)}
                                className={`px-6 py-2 rounded-full text-xs font-bold transition-all duration-300 relative overflow-hidden ${timeFilter === f ? 'text-white shadow-lg' : 'text-zinc-500 hover:text-zinc-300'}`}
                            >
                                {timeFilter === f && (
                                    <motion.div
                                        layoutId="time-filter-bg"
                                        className={`absolute inset-0 ${theme.colors.accent} opacity-20`} // Just a subtle bg
                                        style={{ backgroundColor: f === 'ALL' ? '#3f3f46' : undefined }} // specialized color if needed
                                    />
                                )}
                                {timeFilter === f && (
                                    <motion.div
                                        layoutId="time-filter-border"
                                        className={`absolute inset-0 border border-white/20 rounded-full`}
                                    />
                                )}
                                <span className="relative z-10">
                                    {f === 'DAY' ? 'DIA' : f === 'WEEK' ? 'SEMANA' : f === 'MONTH' ? 'MÊS' : 'GERAL'}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>

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

                            <div className={`transition-opacity duration-300 ${isRefetching ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
                                <MatchHistoryGrid history={insights.history} theme={theme} onSelectMatch={setSelectedMatch} />
                            </div>

                            {/* Pagination */}
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

                    {/* Right Column */}
                    <div className={`xl:col-span-4 space-y-${theme.styles.layoutGap.replace('gap-', '')}`}>

                        <div className="space-y-2">
                            <h4 className="text-xs font-[family-name:var(--font-outfit)] font-bold text-zinc-500 uppercase tracking-widest px-1">{reportTitle}</h4>
                            <StatsGrid stats={insights.stats} theme={theme} className="!grid-cols-2 !lg:grid-cols-2 !mb-0" />
                        </div>

                        {/* Report (Dynamic Title) */}
                        {insights.weeklyReport && (
                            <WeeklyReportCard
                                theme={theme}
                                report={insights.weeklyReport}
                                title={reportTitle}
                            />
                        )}

                        {insights.playstyle && (
                            <PlaystyleRadar
                                playstyle={insights.playstyle}
                                theme={theme}
                            />
                        )}

                        <MasteryShowcase masteries={history.masteries} theme={theme} />

                    </div>
                </div>
            </div>

            <MatchDetailsModal
                match={selectedMatch}
                puuid={puuid}
                onClose={() => setSelectedMatch(null)}
            />
        </div>
    );
}
