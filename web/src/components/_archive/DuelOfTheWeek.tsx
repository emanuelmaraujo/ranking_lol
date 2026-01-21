'use client';

import { motion } from 'framer-motion';
import { PlayerAvatar } from '@/components/ui/PlayerAvatar';
import Link from 'next/link';
import { HighlightPlayer } from '@/lib/api';
import { Swords, Zap, Skull } from 'lucide-react';

interface DuelPlayer extends HighlightPlayer {
    avgScore?: string | number; // Ensure this property is accounted for
}

interface DuelOfTheWeekProps {
    mvp: DuelPlayer | null;
    antiMvp: DuelPlayer | null;
    loading?: boolean;
}

export function DuelOfTheWeek({ mvp, antiMvp, loading }: DuelOfTheWeekProps) {
    if (loading) return <div className="h-[300px] w-full bg-white/5 rounded-2xl animate-pulse" />;

    const leftVariants = {
        initial: { x: -50, opacity: 0 },
        animate: { x: 0, opacity: 1 },
    };

    const rightVariants = {
        initial: { x: 50, opacity: 0 },
        animate: { x: 0, opacity: 1 },
    };

    return (
        <section className="relative w-full max-w-5xl mx-auto my-12 group">
            {/* VS Badge */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30">
                <div className="bg-black border-4 border-[#0a0a0a] rounded-full p-4 shadow-2xl skew-x-[-12deg] group-hover:scale-110 transition-transform">
                    <Swords className="w-8 h-8 text-white animate-pulse" />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 h-auto md:h-[350px] rounded-3xl overflow-hidden shadow-2xl border border-white/10">

                {/* MVP (Left) */}
                <motion.div
                    className="relative bg-gradient-to-br from-indigo-900/80 to-purple-900/80 p-8 flex flex-col justify-center items-center md:items-start text-center md:text-left overflow-hidden"
                    variants={leftVariants}
                    initial="initial"
                    whileInView="animate"
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                >
                    <div className="absolute inset-0 bg-[url('https://ddragon.leagueoflegends.com/cdn/img/champion/splash/Kayle_0.jpg')] bg-cover bg-center opacity-10 mix-blend-overlay" />
                    <div className="absolute top-0 right-0 w-64 h-64 bg-yellow-400/20 blur-3xl rounded-full translate-x-1/3 -translate-y-1/3" />

                    <div className="relative z-10 flex flex-col h-full w-full">
                        <div className="flex items-center gap-2 text-yellow-400 mb-2 justify-center md:justify-start">
                            <Zap className="w-5 h-5 fill-current" />
                            <span className="font-bold tracking-widest uppercase text-sm">O Carregador</span>
                        </div>

                        <h3 className="text-4xl font-[family-name:var(--font-outfit)] font-black text-white mb-1 uppercase italic tracking-tighter drop-shadow-lg">MVP</h3>
                        <p className="text-indigo-200 text-sm mb-6">Média de Score Superior</p>

                        {mvp ? (
                            <Link href={`/player/${mvp.puuid}`} className="mt-auto flex items-center gap-4 bg-black/20 p-4 rounded-xl backdrop-blur-sm border border-white/10 hover:bg-white/10 transition-colors w-full md:w-auto">
                                <PlayerAvatar profileIconId={mvp.profileIconId} size="lg" className="ring-2 ring-yellow-400" />
                                <div className="text-left">
                                    <div className="font-[family-name:var(--font-outfit)] font-bold text-white text-xl">{mvp.gameName}</div>
                                    <div className="text-yellow-400 font-mono font-bold text-lg">{mvp.value} pts/jogo</div>
                                </div>
                            </Link>
                        ) : (
                            <div className="mt-auto text-gray-400 italic">Buscando candidato...</div>
                        )}
                    </div>
                </motion.div>

                {/* Anti-MVP (Right) */}
                <motion.div
                    className="relative bg-[#1a1a1a] p-8 flex flex-col justify-center items-center md:items-end text-center md:text-right overflow-hidden"
                    variants={rightVariants}
                    initial="initial"
                    whileInView="animate"
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                >
                    {/* Glitchy Effect Background */}
                    <div className="absolute inset-0 opacity-10 mix-blend-overlay animate-pulse"
                        style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}
                    />
                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-red-900/20 blur-3xl rounded-full -translate-x-1/3 translate-y-1/3" />

                    <div className="relative z-10 flex flex-col h-full w-full items-center md:items-end">
                        <div className="flex items-center gap-2 text-gray-400 mb-2 justify-center md:justify-end">
                            <span className="font-bold tracking-widest uppercase text-sm font-mono">O Âncora</span>
                            <Skull className="w-5 h-5" />
                        </div>

                        <h3 className="text-4xl font-[family-name:var(--font-outfit)] font-black text-gray-500 mb-1 uppercase italic tracking-tighter line-through decoration-red-500 decoration-4">Anti-MVP</h3>
                        <p className="text-gray-500 text-sm mb-6 font-mono">Precisa de um abraço</p>

                        {antiMvp ? (
                            <Link href={`/player/${antiMvp.puuid}`} className="mt-auto flex flex-row-reverse items-center gap-4 bg-black/40 p-4 rounded-xl backdrop-blur-sm border border-red-900/30 hover:bg-red-900/10 transition-colors w-full md:w-auto hover:border-red-500/50 group/shame">
                                <PlayerAvatar profileIconId={antiMvp.profileIconId} size="lg" className="grayscale contrast-125 ring-2 ring-gray-700 group-hover/shame:ring-red-500 transition-all" />
                                <div className="text-right">
                                    <div className="font-[family-name:var(--font-outfit)] font-bold text-gray-300 text-xl group-hover/shame:text-red-400 transition-colors">{antiMvp.gameName}</div>
                                    <div className="text-gray-500 font-mono font-bold text-lg group-hover/shame:text-red-500">{antiMvp.avgScore ?? '0.0'} pts/jogo</div>
                                </div>
                            </Link>
                        ) : (
                            <div className="mt-auto text-gray-600 font-mono text-sm border border-dashed border-gray-700 p-4 rounded-lg">
                                "Ainda em análise..." <br /> (Ninguém jogou mal o suficiente... ainda)
                            </div>
                        )}
                    </div>
                </motion.div>

            </div>
        </section>
    );
}
