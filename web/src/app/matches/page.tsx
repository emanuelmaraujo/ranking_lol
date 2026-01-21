'use client';

import { useEffect, useState, useRef } from 'react';
import { getGlobalMatches, getGlobalHighlights, getSeasonRanking, MatchHistoryEntry, RankingEntry } from '@/lib/api';
import { MatchHistoryGrid } from '@/components/MatchHistoryGrid';
import { MatchDetailsModal } from '@/components/MatchDetailsModal';
import { MatchesInsights } from '@/components/matches/MatchesInsights';
import { MatchesFilterBar } from '@/components/matches/MatchesFilterBar';
import { Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { useQueue } from '@/contexts/QueueContext';
import { getTheme } from '@/lib/tier-themes';

export default function GlobalMatchesPage() {
    const { queueType } = useQueue();
    // Data State
    const [matches, setMatches] = useState<MatchHistoryEntry[]>([]);
    const [insights, setInsights] = useState<any>(null);
    const [players, setPlayers] = useState<{ gameName: string, tagLine: string, puuid: string }[]>([]);
    const [selectedMatch, setSelectedMatch] = useState<MatchHistoryEntry | null>(null);

    // UI State
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);

    // Filters & Pagination
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [filters, setFilters] = useState({
        player: '',
        lane: '',
        champion: '', // Added champion
    });
    const [statsPeriod, setStatsPeriod] = useState<'DAILY' | 'WEEKLY' | 'MONTHLY'>('MONTHLY');

    // Theme (Default to Gold/Standard for global view)
    const theme = getTheme('GOLD');

    // 1. Initial Load (Players)
    useEffect(() => {
        const init = async () => {
            // ... separate player loading if needed, or keeping it
            const [rankingData] = await Promise.all([
                getSeasonRanking('SOLO', 100),
            ]);
            const uniquePlayers = rankingData.map((p: RankingEntry) => ({
                gameName: p.gameName,
                tagLine: p.tagLine,
                puuid: p.puuid
            })).sort((a, b) => a.gameName.localeCompare(b.gameName));
            setPlayers(uniquePlayers);
        };
        init();
    }, []);

    // 2. Fetch Insights (When period or queue changes)
    useEffect(() => {
        const fetchInsights = async () => {
            try {
                // Pass current period and queue
                const data = await getGlobalHighlights(statsPeriod, queueType);
                setInsights(data);
            } catch (e) {
                console.error("Failed to load insights:", e);
            }
        };
        fetchInsights();
    }, [statsPeriod, queueType]);

    // 2. Fetch Matches (Reset when filters/queue change)
    useEffect(() => {
        setPage(1);
        setMatches([]);
        setHasMore(true);
        fetchMatches(1, true);
    }, [filters, queueType]);

    // Race condition guard
    const fetchIdRef = useRef(0);

    // Helper fetch
    const fetchMatches = async (p: number, reset: boolean = false) => {
        const currentFetchId = ++fetchIdRef.current;

        if (p === 1) setLoading(true);
        else setLoadingMore(true);

        try {
            // Pass queue from context
            const res = await getGlobalMatches(p, 20, { ...filters, queue: queueType });

            // Abort if a newer request has started
            if (currentFetchId !== fetchIdRef.current) return;

            if (reset) {
                setMatches(res.data);
            } else {
                setMatches(prev => [...prev, ...res.data]);
            }

            setHasMore(p < res.pagination.totalPages);
        } catch (e) {
            if (currentFetchId !== fetchIdRef.current) return;
            console.error(e);
        } finally {
            if (currentFetchId === fetchIdRef.current) {
                setLoading(false);
                setLoadingMore(false);
            }
        }
    };

    const handleLoadMore = () => {
        if (!loadingMore && hasMore) {
            const nextPage = page + 1;
            setPage(nextPage);
            fetchMatches(nextPage);
        }
    };

    const handleFilterChange = (key: string, value: string) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    return (
        <div className={`min-h-screen ${theme.colors.background} text-white p-4 md:p-8 pb-32 transition-colors duration-700`}>
            <div className={`absolute top-0 inset-x-0 h-[500px] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] ${theme.gradients.hero} opacity-20 pointer-events-none blur-3xl`} />

            <div className="max-w-7xl mx-auto space-y-8 relative z-10">

                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <h1 className="text-4xl md:text-5xl font-black font-[family-name:var(--font-outfit)] tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-white to-zinc-500 mb-2">
                        PARTIDAS GERAIS
                    </h1>
                    <p className="text-zinc-500 font-medium">Histórico completo da comunidade em tempo real.</p>
                </motion.div>

                {/* Insights */}
                <MatchesInsights
                    data={insights}
                    period={statsPeriod}
                    onPeriodChange={setStatsPeriod}
                />

                {/* Filter Bar */}
                <MatchesFilterBar
                    players={players}
                    filters={filters}
                    onChange={handleFilterChange}
                />

                {/* Match List */}
                {loading ? (
                    <div className="flex justify-center items-center h-64">
                        <Loader2 className="animate-spin text-zinc-500" size={40} />
                    </div>
                ) : (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.5 }}
                    >
                        <MatchHistoryGrid
                            history={matches}
                            theme={theme}
                            onSelectMatch={setSelectedMatch}
                        />

                        {/* Load More Trigger */}
                        {hasMore && (
                            <div className="flex justify-center mt-12">
                                <button
                                    onClick={handleLoadMore}
                                    disabled={loadingMore}
                                    className="px-8 py-3 bg-white/5 hover:bg-white/10 border border-white/5 rounded-full text-sm font-bold tracking-widest uppercase transition-all disabled:opacity-50 flex items-center gap-2"
                                >
                                    {loadingMore ? <Loader2 className="animate-spin" size={16} /> : '+'}
                                    Carregar Mais
                                </button>
                            </div>
                        )}

                        {!hasMore && matches.length > 0 && (
                            <div className="text-center mt-12 text-zinc-600 text-xs font-bold uppercase tracking-widest">
                                Fim do Histórico
                            </div>
                        )}

                        {matches.length === 0 && !loading && (
                            <div className="text-center py-20 bg-white/5 rounded-3xl border border-dashed border-white/10">
                                <div className="text-zinc-500 font-bold mb-2">Nada por aqui...</div>
                                <div className="text-zinc-600 text-sm">Tente ajustar os filtros.</div>
                            </div>
                        )}
                    </motion.div>
                )}

            </div>
            {/* Side Panel Overlay */}
            {/* Match Details Modal */}
            <MatchDetailsModal
                match={selectedMatch}
                puuid={selectedMatch?.puuid || ''}
                onClose={() => setSelectedMatch(null)}
            />
        </div>
    );
}
