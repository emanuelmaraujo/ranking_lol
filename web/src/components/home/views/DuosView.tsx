'use strict';
'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Ghost } from 'lucide-react';
import { useEffect, useState } from 'react';
import { getCommunityRelations, CommunityRelations } from '@/lib/api';
import { SocialSoloView } from '@/components/social/views/SocialSoloView';
import { SocialFlexView } from '@/components/social/views/SocialFlexView';


export function DuosView({ period, queue }: { period: any, queue: string }) {
    // We rely on the parent's `queue` prop (SOLO, FLEX, or BOTH).
    // If the topbar sends something else, we default to SOLO.

    const [data, setData] = useState<CommunityRelations | null>(null);
    const [loading, setLoading] = useState(true);

    const activeMode = (queue === 'FLEX' ? 'FLEX' : 'SOLO');

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            // setData(null); // Optional: Keep data while loading for less flicker? No, context changes.
            try {
                // Fetch based on activeMode (Mapped to backend expectation)
                const res = await getCommunityRelations(period, activeMode as any);
                setData(res);
            } catch (error) {
                console.error("Failed to fetch relations", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [period, activeMode]);

    return (
        <div className="w-full max-w-[1400px] mx-auto p-4 pb-12 space-y-6">

            {/* Header - Stays constant */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-white/5 pb-4">
                <div>
                    <h2 className="text-3xl font-black text-white uppercase italic tracking-tighter">
                        Central <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-500">Social</span>
                    </h2>
                    <motion.p
                        key={activeMode}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="text-zinc-500 text-sm font-medium"
                    >
                        {activeMode === 'SOLO' && "Análise de Duos Competitivos & Toxicidade"}
                        {activeMode === 'FLEX' && "Análise de Squads & Aquele Flex de Lei"}
                    </motion.p>
                </div>

                {data && (
                    <div className="flex gap-4 text-[10px] font-mono text-zinc-600 uppercase tracking-widest">
                        <div>Relations: <span className="text-pink-500 font-bold">{data.stats.totalRelations}</span></div>
                        <div>Matches: <span className="text-purple-500 font-bold">{data.stats.analyzedMatches}</span></div>
                    </div>
                )}
            </div>

            {/* Content Area with Transition */}
            <div className="min-h-[400px]">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-32 space-y-4">
                        <div className="relative">
                            <div className="w-16 h-16 border-4 border-pink-500/20 border-t-pink-500 rounded-full animate-spin"></div>
                            <div className="absolute inset-0 flex items-center justify-center">
                                <Ghost className="w-6 h-6 text-purple-500 animate-pulse opacity-50" />
                            </div>
                        </div>
                        <div className="text-zinc-500 text-sm font-mono animate-pulse">
                            Calculando quem é bagre...
                        </div>
                    </div>
                ) : data ? (
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeMode}
                            initial={{ opacity: 0, x: 20, filter: 'blur(10px)' }}
                            animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
                            exit={{ opacity: 0, x: -20, filter: 'blur(10px)' }}
                            transition={{
                                type: "spring",
                                stiffness: 90,
                                damping: 15,
                                mass: 1
                            }}
                        >
                            {activeMode === 'SOLO' && <SocialSoloView data={data} />}
                            {activeMode === 'FLEX' && <SocialFlexView data={data} />}

                        </motion.div>
                    </AnimatePresence>
                ) : (
                    <div className="text-center py-20 text-zinc-600 italic">
                        Falha ao carregar dados sociais. Tente novamente mais tarde.
                    </div>
                )}
            </div>

        </div>
    );
}
