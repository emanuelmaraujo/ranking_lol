'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Monitor, TrendingUp, Skull, Trophy, Users } from 'lucide-react';

import { HeroSection } from './HeroSection';
import { HighlightsView } from './views/HighlightsView';
import { BagresView } from './views/BagresView';
import { FeatsView } from './views/FeatsView';
import { DuosView } from './views/DuosView';

import { useQueue } from '@/contexts/QueueContext';
import { getSeasonRanking, RankingEntry } from '@/lib/api';
import { getDateRange } from '@/lib/date-utils';

/* 
  HomeHeroContainer
  Acts as the "Fun Hub" controller. 
  Wraps the default HeroSection (Ranking) and toggles between other interactive views.
*/

type ViewType = 'RANKING' | 'HIGHLIGHTS' | 'BAGRES' | 'FEATS' | 'DUOS';
type PeriodType = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'GENERAL';

export function HomeHeroContainer() {
    const { queueType } = useQueue();
    const [activeView, setActiveView] = useState<ViewType>('RANKING');
    const [period, setPeriod] = useState<PeriodType>('GENERAL');
    const [topPlayer, setTopPlayer] = useState<RankingEntry | null>(null);

    // Fetch Top 1 for the HeroSection (Ranking View)
    useEffect(() => {
        const fetchTop1 = async () => {
            try {
                // For "Ranking" view, we fetch the Season Ranking (General) or period specific.
                // We respect period filter for consistency across tabs.
                const range = getDateRange(period);
                // Fetch top 1
                const res = await getSeasonRanking(queueType || 'SOLO', 1, range || undefined);
                if (res && res.length > 0) {
                    setTopPlayer(res[0]);
                } else {
                    setTopPlayer(null);
                }
            } catch (e) {
                console.error("Failed to fetch top player", e);
            }
        };
        fetchTop1();
    }, [queueType, period]);

    // Navigation Items
    const navItems = [
        { id: 'RANKING', label: 'O Rei', icon: Monitor }, // Default
        { id: 'HIGHLIGHTS', label: 'Foguetes', icon: TrendingUp },
        { id: 'BAGRES', label: 'Bagres', icon: Skull },
        { id: 'FEATS', label: 'Feitos', icon: Trophy },
        { id: 'DUOS', label: 'Social', icon: Users },
    ];

    return (
        <section className="relative w-full min-h-[85vh] flex flex-col items-center">

            {/* Top Navigation Bar - Floating & Glass */}
            {/* Top Navigation Bar - Floating & Glass */}
            <nav className="sticky top-24 md:top-32 z-[100] flex flex-col md:flex-row items-center justify-center p-2 rounded-3xl md:rounded-full bg-black/40 backdrop-blur-xl border border-white/10 shadow-2xl animate-in fade-in slide-in-from-top-4 duration-1000 gap-3 md:gap-0 my-4">
                <div className="flex items-center gap-1 md:gap-2">
                    {navItems.map((item) => (
                        <button
                            key={item.id}
                            onClick={() => setActiveView(item.id as ViewType)}
                            className={`relative flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold transition-all duration-300 ${activeView === item.id ? 'text-white' : 'text-zinc-400 hover:text-white hover:bg-white/5'
                                }`}
                        >
                            {activeView === item.id && (
                                <motion.div
                                    layoutId="bubble"
                                    className="absolute inset-0 bg-white/10 border border-white/20 rounded-full shadow-[0_0_20px_rgba(250,204,21,0.1)]"
                                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                />
                            )}
                            <item.icon className={`w-4 h-4 ${activeView === item.id ? 'text-yellow-400 drop-shadow-md' : ''}`} />
                            <span className="hidden md:block relative z-10">{item.label}</span>
                        </button>
                    ))}
                </div>

                {/* Vertical Divider */}
                <div className="w-px h-6 bg-white/10 mx-4 hidden md:block" />

                {/* Period Selector (Mini) */}
                <div className="flex items-center bg-black/50 rounded-full p-1 border border-white/5">
                    {(['DAILY', 'WEEKLY', 'MONTHLY', 'GENERAL'] as const).map((p) => (
                        <button
                            key={p}
                            onClick={() => setPeriod(p)}
                            className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase transition-colors ${period === p ? 'bg-white/20 text-white' : 'text-zinc-600 hover:text-zinc-400'
                                }`}
                        >
                            {p === 'DAILY' ? 'Dia' : p === 'WEEKLY' ? 'Semana' : p === 'MONTHLY' ? 'Mês' : 'Geral'}
                        </button>
                    ))}
                </div>
            </nav>

            {/* Main Content Area */}
            <div className="relative w-full flex-1 flex flex-col">
                <AnimatePresence mode="wait">
                    {activeView === 'RANKING' && (
                        <motion.div
                            key="ranking"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="w-full h-full"
                        >
                            {topPlayer ? (
                                <HeroSection player={topPlayer} pdlDelta={period === 'WEEKLY' ? 0 : null} period={period} /> // pdlDelta dummy
                            ) : ( // Fallback or Loading State handled inside HeroSection usually, but here we control it
                                <div className="flex h-[50vh] items-center justify-center text-zinc-500">
                                    Nenhum Rei encontrado... o trono está vazio.
                                </div>
                            )}
                        </motion.div>
                    )}

                    {activeView === 'HIGHLIGHTS' && (
                        <motion.div
                            key="highlights"
                            initial={{ opacity: 0, scale: 0.95, filter: 'blur(10px)' }}
                            animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                            exit={{ opacity: 0, scale: 1.05, filter: 'blur(10px)' }}
                            className="w-full flex-1"
                        >
                            <HighlightsView period={period} queue={queueType || 'SOLO'} />
                        </motion.div>
                    )}

                    {activeView === 'BAGRES' && (
                        <motion.div
                            key="bagres"
                            initial={{ opacity: 0, scale: 0.95, filter: 'blur(10px)' }}
                            animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                            exit={{ opacity: 0, scale: 1.05, filter: 'blur(10px)' }}
                            className="w-full flex-1"
                        >
                            <BagresView period={period} queue={queueType || 'SOLO'} />
                        </motion.div>
                    )}

                    {activeView === 'FEATS' && (
                        <motion.div
                            key="feats"
                            initial={{ opacity: 0, scale: 0.95, filter: 'blur(10px)' }}
                            animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                            exit={{ opacity: 0, scale: 1.05, filter: 'blur(10px)' }}
                            className="w-full flex-1"
                        >
                            <FeatsView period={period} queue={queueType || 'SOLO'} />
                        </motion.div>
                    )}

                    {activeView === 'DUOS' && (
                        <motion.div
                            key="duos"
                            initial={{ opacity: 0, scale: 0.95, filter: 'blur(10px)' }}
                            animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                            exit={{ opacity: 0, scale: 1.05, filter: 'blur(10px)' }}
                            className="w-full flex-1"
                        >
                            <DuosView period={period} queue={queueType || 'SOLO'} />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Ambient Background - Dynamic Theme */}
            <div className={`fixed inset-0 pointer-events-none -z-10 transition-colors duration-1000 ${activeView === 'RANKING' ? 'bg-zinc-950' :
                activeView === 'HIGHLIGHTS' ? 'bg-blue-950/20' :
                    activeView === 'BAGRES' ? 'bg-red-950/20' :
                        activeView === 'FEATS' ? 'bg-yellow-950/10' : 'bg-purple-950/20'
                }`} />

        </section>
    );
}
