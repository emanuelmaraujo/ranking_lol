'use client';

import { TierTheme } from "@/lib/tier-themes";
import { motion } from "framer-motion";
import { Award, Star } from "lucide-react";
import { CHAMPION_SPLASH_BASE, DDRAGON_VERSION } from "@/lib/constants";
import { normalizeChampionName } from "@/lib/utils";

interface Mastery {
    championId: number;
    championName: string;
    level: number;
    points: number;
    skin?: {
        name: string;
        splashUrl: string;
        loadingUrl: string;
    };
}

export function MasteryShowcase({ masteries, theme }: { masteries: Mastery[], theme: TierTheme }) {
    if (!masteries || masteries.length === 0) return null;

    const top3 = masteries.slice(0, 3);
    const rest = masteries.slice(3, 8); // Next 5

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className={`${theme.styles.borderRadius} overflow-hidden ${theme.colors.cardBg} flex flex-col`}
        >
            {/* Header */}
            <div className="p-4 border-b border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Award className={theme.colors.accent} size={18} />
                    <h3 className={`text-lg font-[family-name:var(--font-outfit)] font-bold ${theme.colors.text}`}>Maestrias</h3>
                </div>
                <div className="text-[10px] font-[family-name:var(--font-outfit)] font-bold uppercase tracking-wider text-zinc-500">
                    O Melhor
                </div>
            </div>

            {/* Top 3 Showcase - Visual Horizontal Banners */}
            <div className="flex flex-col gap-2 p-2">
                {top3.map((m, i) => (
                    <div key={m.championId} className="relative group overflow-hidden rounded-lg cursor-default h-24 shadow-lg border border-white/5 w-full">
                        {/* Splash Art Banner Slice */}
                        <div className="absolute inset-0 z-0">
                            <img
                                src={m.skin?.splashUrl || `${CHAMPION_SPLASH_BASE}/${normalizeChampionName(m.championName)}_0.jpg`}
                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 opacity-60 group-hover:opacity-80"
                                alt={m.skin?.name || m.championName}
                                style={{ objectPosition: 'center 20%' }}
                            />
                            {/* Gradient Overlay for Text Readability */}
                            <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/40 to-transparent" />
                        </div>

                        {/* Content - Left Aligned */}
                        <div className="absolute inset-0 p-4 z-10 flex items-center justify-between">

                            {/* Left: Champ Name & Rank */}
                            <div className="flex items-center gap-4">
                                {/* Rank Badge/Icon could go here, or just text */}
                                <div className={`w-10 h-10 rounded-full ${theme.colors.hex} bg-opacity-20 flex items-center justify-center border border-white/10 backdrop-blur-md`}>
                                    {i === 0 ? <Star size={18} className="text-yellow-400 fill-yellow-400" /> : <span className="text-sm font-bold text-white">#{i + 1}</span>}
                                </div>

                                <div>
                                    <h4 className="text-xl font-[family-name:var(--font-outfit)] font-black text-white uppercase tracking-wider drop-shadow-md leading-none mb-1">
                                        {m.championName}
                                    </h4>
                                    <div className={`inline-flex px-1.5 py-0.5 rounded ${theme.colors.accent} bg-opacity-20 border border-white/20 backdrop-blur-sm`}>
                                        <span className={`text-[10px] font-bold ${theme.colors.accent} uppercase tracking-wider`}>
                                            Maestria {m.level}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Right: Points */}
                            <div className="text-right">
                                <span className={`text-2xl leading-none font-[family-name:var(--font-outfit)] font-black text-white drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)] block`}>
                                    {new Intl.NumberFormat('en', { notation: 'compact' }).format(m.points)}
                                </span>
                                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Pontos</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Compact List for the rest */}
            <div className="flex-1 p-4 space-y-2 bg-black/20">
                {rest.map((m) => (
                    <div key={m.championId} className="flex items-center gap-3 p-2 rounded hover:bg-white/5 transition-colors group">
                        <img
                            src={`https://ddragon.leagueoflegends.com/cdn/${DDRAGON_VERSION}/img/champion/${normalizeChampionName(m.championName)}.png`}
                            className="w-8 h-8 rounded-full border border-white/10 group-hover:border-white/30 grayscale group-hover:grayscale-0 transition-all"
                        />
                        <div className="flex-1 flex justify-between items-center">
                            <span className="text-xs font-[family-name:var(--font-outfit)] font-bold text-zinc-400 group-hover:text-zinc-200 uppercase">{m.championName}</span>
                            <span className="text-[10px] font-[family-name:var(--font-outfit)] font-bold text-zinc-600 group-hover:text-zinc-400">{new Intl.NumberFormat('en', { notation: 'compact' }).format(m.points)}</span>
                        </div>
                    </div>
                ))}
                {masteries.length > 8 && (
                    <div className="text-center pt-2">
                        <span className="text-[10px] font-bold text-zinc-600 uppercase hover:text-white cursor-pointer transition-colors">Ver Mais Campeões</span>
                    </div>
                )}
            </div>
        </motion.div>
    );
}
