'use client';

import { CommunityRelations } from '@/lib/api';
import { SynergyCard } from '../SynergyCard';
import { SocialHighlightCard } from '../SocialHighlightCard';
import { Swords, Ghost, ShieldCheck, HeartCrack, Flame, User } from 'lucide-react';
import { motion, Variants } from 'framer-motion';

interface SocialSoloViewProps {
    data: CommunityRelations;
}

const container: Variants = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1
        }
    }
};

const item: Variants = {
    hidden: {
        opacity: 0,
        y: 30,
        scale: 0.9,
        filter: 'blur(10px)'
    },
    show: {
        opacity: 1,
        y: 0,
        scale: 1,
        filter: 'blur(0px)',
        transition: {
            type: "spring",
            stiffness: 70,
            damping: 15,
            mass: 1.2
        }
    }
};

const hoverCard: Variants = {
    rest: { scale: 1, rotate: 0 },
    hover: {
        scale: 1.03,
        rotate: 0.5,
        transition: { type: "spring", stiffness: 400, damping: 25 }
    }
};

// Lane Helper
const translateLane = (lane: string) => {
    if (!lane) return 'Summoners Rift';
    return lane
        .replace('TOP', 'Top')
        .replace('JUNGLE', 'JG')
        .replace('MIDDLE', 'Mid')
        .replace('BOTTOM', 'ADC')
        .replace('UTILITY', 'Sup')
        .replace('|', ' + ');
};

export function SocialSoloView({ data }: SocialSoloViewProps) {
    const topDuo = data.topSynergies[0];
    const tiltDuo = data.antiSynergies[0];

    // Lane Pair Logic
    const bestLane = translateLane(topDuo?.mainLane || "");

    return (
        <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="space-y-8"
        >

            {/* 1. Highlights Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Casal 20 -> Duo Free Elo */}
                <motion.div variants={item} className="h-full" whileHover="hover" initial="rest" animate="rest">
                    <motion.div variants={hoverCard} className="h-full">
                        <SocialHighlightCard
                            title="Duo Free Elo"
                            subtitle="Sinergia de Milhões"
                            icon={Flame}
                            color="emerald"
                        >
                            {topDuo ? (
                                <div className="mt-4 text-center">
                                    <div className="flex justify-center -space-x-3 mb-3">
                                        <img src={`https://ddragon.leagueoflegends.com/cdn/16.1.1/img/profileicon/${topDuo.players[0].profileIconId}.png`} className="w-14 h-14 rounded-full border-2 border-emerald-500 bg-black shadow-lg shadow-emerald-500/20" />
                                        <img src={`https://ddragon.leagueoflegends.com/cdn/16.1.1/img/profileicon/${topDuo.players[1].profileIconId}.png`} className="w-14 h-14 rounded-full border-2 border-emerald-500 bg-black shadow-lg shadow-emerald-500/20" />
                                    </div>
                                    <div className="text-3xl font-black text-white leading-none tracking-tighter">{topDuo.winRate.toFixed(0)}% WR</div>
                                    <div className="text-xs text-emerald-400 font-bold uppercase mt-1 tracking-wider">
                                        {topDuo.wins} Vitórias / {topDuo.games} Games
                                    </div>
                                    <div className="text-[10px] text-zinc-500 mt-2 italic">
                                        "{topDuo.players[0].gameName} & {topDuo.players[1].gameName}"
                                    </div>
                                </div>
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-zinc-600">
                                    <Ghost className="w-8 h-8 mb-2 opacity-20" />
                                    <span className="text-xs italic">Ninguém se ama no SoloQ</span>
                                </div>
                            )}
                        </SocialHighlightCard>
                    </motion.div>
                </motion.div>

                {/* Tilt Garantido -> Inimigos do PDL */}
                <motion.div variants={item} className="h-full" whileHover="hover" initial="rest" animate="rest">
                    <motion.div variants={hoverCard} className="h-full">
                        <SocialHighlightCard
                            title="Inimigos do PDL"
                            subtitle="Aposentados & Perigosos"
                            icon={HeartCrack}
                            color="rose"
                        >
                            {tiltDuo ? (
                                <div className="mt-4 text-center">
                                    <div className="flex justify-center -space-x-3 mb-3">
                                        <img src={`https://ddragon.leagueoflegends.com/cdn/16.1.1/img/profileicon/${tiltDuo.players[0].profileIconId}.png`} className="w-14 h-14 rounded-full border-2 border-rose-500 bg-black grayscale opacity-80" />
                                        <img src={`https://ddragon.leagueoflegends.com/cdn/16.1.1/img/profileicon/${tiltDuo.players[1].profileIconId}.png`} className="w-14 h-14 rounded-full border-2 border-rose-500 bg-black grayscale opacity-80" />
                                    </div>
                                    <div className="text-3xl font-black text-rose-500 leading-none tracking-tighter">{tiltDuo.winRate.toFixed(0)}% WR</div>
                                    <div className="text-xs text-rose-400/60 font-bold uppercase mt-1">
                                        {tiltDuo.deltaWr.toFixed(1)}% pior juntos
                                    </div>
                                    <div className="text-[10px] text-zinc-500 mt-2 italic px-4">
                                        "Melhor fingir que nem conhece"
                                    </div>
                                </div>
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-zinc-600">
                                    <ShieldCheck className="w-8 h-8 mb-2 opacity-20" />
                                    <span className="text-xs italic">Comunidade segura (por enquanto)</span>
                                </div>
                            )}
                        </SocialHighlightCard>
                    </motion.div>
                </motion.div>

                {/* Lane Pair Insight */}
                <motion.div variants={item} className="h-full" whileHover="hover" initial="rest" animate="rest">
                    <motion.div variants={hoverCard} className="h-full">
                        <SocialHighlightCard
                            title="Combo de Lane"
                            subtitle="Metinha Quebrado"
                            icon={Swords}
                            color="cyan"
                        >
                            {topDuo ? (
                                <div className="mt-4 flex flex-col items-center justify-center h-full pb-6">
                                    <motion.div
                                        className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-br from-cyan-400 to-blue-600 text-center leading-tight mb-2"
                                        animate={{ scale: [1, 1.05, 1] }}
                                        transition={{ duration: 2, repeat: Infinity }}
                                    >
                                        {bestLane}
                                    </motion.div>
                                    <div className="text-[10px] uppercase tracking-widest text-zinc-500 text-center">
                                        Lane Kingdom
                                    </div>
                                    <div className="mt-4 flex items-center gap-2 text-xs text-cyan-400/60">
                                        <User className="w-3 h-3" />
                                        <span>Prioridade de Mapa</span>
                                    </div>
                                </div>
                            ) : (
                                <div className="h-full flex items-center justify-center text-zinc-600 text-xs italic">Dados insuficientes</div>
                            )}
                        </SocialHighlightCard>
                    </motion.div>
                </motion.div>
            </div>

            {/* 2. Lists */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <motion.div variants={item} className="space-y-4">
                    <div className="flex items-center justify-between px-2">
                        <h3 className="font-bold text-white uppercase tracking-wider flex items-center gap-2 text-sm">
                            <span className="w-1.5 h-6 bg-emerald-500 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.5)]"></span>
                            Os Carregadinhos (Buff)
                        </h3>
                        <span className="text-[10px] text-zinc-600 font-mono">SOMENTE VITORIAS</span>
                    </div>
                    <div className="space-y-3">
                        {data.topSynergies.slice(0, 5).map((rel, i) => (
                            <SynergyCard key={i} relation={rel} rank={i + 1} type="GOOD" />
                        ))}
                    </div>
                </motion.div>

                <motion.div variants={item} className="space-y-4">
                    <div className="flex items-center justify-between px-2">
                        <h3 className="font-bold text-white uppercase tracking-wider flex items-center gap-2 text-sm">
                            <span className="w-1.5 h-6 bg-rose-500 rounded-full shadow-[0_0_10px_rgba(244,63,94,0.5)]"></span>
                            Lista de Bagres (Nerf)
                        </h3>
                        <span className="text-[10px] text-zinc-600 font-mono">CHORO & TILT</span>
                    </div>
                    <div className="space-y-3">
                        {data.antiSynergies.slice(0, 5).map((rel, i) => (
                            <SynergyCard key={i} relation={rel} rank={i + 1} type="BAD" />
                        ))}
                    </div>
                </motion.div>
            </div>
        </motion.div>
    );
}
