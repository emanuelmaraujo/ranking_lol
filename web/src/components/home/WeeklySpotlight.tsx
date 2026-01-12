import { motion } from 'framer-motion';
import { Trophy, Skull, TrendingUp, TrendingDown, Swords, HeartCrack, Flame, ThumbsDown } from 'lucide-react';
import { HighlightPlayer } from '@/lib/api';
import { DDRAGON_VERSION } from '@/lib/constants';

interface WeeklySpotlightProps {
    mvp: HighlightPlayer | null;
    antiMvp: HighlightPlayer | null;
}

export function WeeklySpotlight({ mvp, antiMvp }: WeeklySpotlightProps) {
    if (!mvp && !antiMvp) return null;

    return (
        <section className="mb-24 overflow-hidden relative">
            <div className="flex items-end justify-between mb-8 px-4">
                <div>
                    <h2 className="text-3xl md:text-4xl font-[family-name:var(--font-outfit)] font-black text-white uppercase tracking-tighter italic">
                        Destaques da Semana
                    </h2>
                    <p className="text-zinc-400 font-mono text-sm mt-2">
                        Quem brilhou e quem... tentou.
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8 lg:gap-12">

                {/* === MVP CARD (THE KING) === */}
                {mvp ? (
                    <motion.div
                        initial={{ opacity: 0, x: -50 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        className="group relative overflow-hidden rounded-[2rem] bg-[#0A0A0A] border border-yellow-500/20 hover:border-yellow-500/50 transition-colors shadow-2xl shadow-black/50"
                    >
                        {/* Background Effects */}
                        <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/10 via-transparent to-transparent opacity-50 group-hover:opacity-100 transition-opacity" />
                        <div className="absolute -top-20 -right-20 w-64 h-64 bg-yellow-500/20 rounded-full blur-[80px]" />

                        <div className="relative z-10 p-8 md:p-10 flex flex-col h-full justify-between min-h-[400px]">
                            {/* Header */}
                            <div className="flex justify-between items-start">
                                <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 font-bold text-xs uppercase tracking-widest shadow-[0_0_15px_rgba(234,179,8,0.2)]">
                                    <Trophy size={14} /> MVP Supremo
                                </span>
                                <Swords className="text-yellow-500/20 w-32 h-32 absolute top-0 right-0 -rotate-12 translate-x-8 -translate-y-8" />
                            </div>

                            {/* Player Content */}
                            <div className="mt-6 md:mt-8 text-center">
                                <div className="relative w-24 h-24 md:w-32 md:h-32 mx-auto mb-4 md:mb-6">
                                    <div className="absolute inset-0 rounded-full border-2 border-yellow-400 animate-pulse shadow-[0_0_30px_rgba(234,179,8,0.4)] z-0" />
                                    <img
                                        src={`https://ddragon.leagueoflegends.com/cdn/${DDRAGON_VERSION}/img/profileicon/${mvp.profileIconId || 29}.png`}
                                        alt={mvp.gameName}
                                        className="relative z-10 w-full h-full rounded-full object-cover border-4 border-[#0A0A0A]"
                                        onError={(e) => {
                                            (e.target as HTMLImageElement).src = `https://ddragon.leagueoflegends.com/cdn/${DDRAGON_VERSION}/img/profileicon/29.png`;
                                        }}
                                    />
                                    <div className="absolute -bottom-2 -right-2 bg-yellow-500 text-black font-bold px-2 py-0.5 md:px-3 md:py-1 rounded-full text-[10px] md:text-xs border-2 border-[#0A0A0A] z-20">
                                        GOD
                                    </div>
                                </div>

                                <h3 className="text-2xl md:text-4xl font-[family-name:var(--font-outfit)] font-black text-white uppercase tracking-wider mb-2 break-words">{mvp.gameName}</h3>
                                <div className="flex items-center justify-center gap-4 text-yellow-500/80 font-mono text-xs md:text-sm">
                                    <span>#{mvp.tagLine}</span>
                                    {mvp.tier && <span>• {mvp.tier}</span>}
                                </div>
                            </div>

                            {/* Bottom Stats */}
                            <div className="mt-8 pt-8 border-t border-white/5 grid grid-cols-2 gap-4">
                                <div>
                                    <div className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-1">Score Médio</div>
                                    <div className="text-3xl font-bold text-white font-mono">{mvp.value}</div>
                                </div>
                                <div className="text-right">
                                    <div className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-1">Status</div>
                                    <div className="text-sm text-yellow-400 font-bold uppercase flex items-center justify-end gap-2">
                                        <TrendingUp size={16} /> Intankável
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                ) : (
                    <div className="h-[400px] rounded-[2rem] bg-white/5 animate-pulse" />
                )}

                {/* === ANTI-MVP CARD (THE BAGRE) === */}
                {antiMvp ? (
                    <motion.div
                        initial={{ opacity: 0, x: 50 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.1 }}
                        className="group relative overflow-hidden rounded-[2rem] bg-[#0A0A0A] border border-red-900/40 hover:border-red-600/50 transition-colors shadow-2xl shadow-black/50"
                    >
                        {/* Glitch Overlay via CSS */}
                        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 mix-blend-overlay" />
                        <div className="absolute inset-0 bg-gradient-to-br from-red-600/5 via-transparent to-transparent" />

                        <div className="relative z-10 p-8 md:p-10 flex flex-col h-full justify-between min-h-[400px]">
                            {/* Header */}
                            <div className="flex justify-between items-start">
                                <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-red-500/10 text-red-500 border border-red-500/20 font-bold text-xs uppercase tracking-widest">
                                    <ThumbsDown size={14} /> Bagre da Semana
                                </span>
                                <Skull className="text-red-900/20 w-32 h-32 absolute top-0 right-0 rotate-12 translate-x-8 -translate-y-8" />
                            </div>

                            {/* Player Content */}
                            <div className="mt-8 text-center">
                                <div className="relative w-32 h-32 mx-auto mb-6 grayscale group-hover:grayscale-0 transition-all duration-500">
                                    <div className="absolute inset-0 rounded-full border-2 border-red-900/50 border-dashed animate-[spin_10s_linear_infinite] z-0" />
                                    <img
                                        src={`https://ddragon.leagueoflegends.com/cdn/${DDRAGON_VERSION}/img/profileicon/${antiMvp.profileIconId || 29}.png`}
                                        alt={antiMvp.gameName}
                                        className="relative z-10 w-full h-full rounded-full object-cover border-4 border-[#0A0A0A]"
                                        onError={(e) => {
                                            (e.target as HTMLImageElement).src = `https://ddragon.leagueoflegends.com/cdn/${DDRAGON_VERSION}/img/profileicon/29.png`;
                                        }}
                                    />
                                    <div className="absolute -bottom-2 -right-2 bg-red-600 text-white font-bold px-3 py-1 rounded-full text-xs border-2 border-[#0A0A0A] z-20">
                                        F
                                    </div>
                                </div>

                                <h3 className="text-4xl font-black text-white uppercase tracking-wider mb-2">{antiMvp.gameName}</h3>
                                <div className="flex items-center justify-center gap-4 text-red-500/60 font-mono text-sm">
                                    <span>#{antiMvp.tagLine}</span>
                                    {antiMvp.championName && <span>• {antiMvp.championName}</span>}
                                </div>
                            </div>

                            {/* Bottom Stats */}
                            <div className="mt-8 pt-8 border-t border-white/5 grid grid-cols-2 gap-4">
                                <div>
                                    <div className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-1">Score Médio</div>
                                    <div className="text-3xl font-bold text-red-500 font-mono">{antiMvp.value}</div>
                                </div>
                                <div className="text-right">
                                    <div className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-1">Status</div>
                                    <div className="text-sm text-red-400 font-bold uppercase flex items-center justify-end gap-2">
                                        <HeartCrack size={16} /> Tiltado
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                ) : (
                    <div className="h-[400px] rounded-[2rem] bg-white/5 animate-pulse flex items-center justify-center text-gray-700 font-bold uppercase tracking-widest">
                        Nenhum bagre encontrado... ainda.
                    </div>
                )}

            </div>
        </section>
    );
}
