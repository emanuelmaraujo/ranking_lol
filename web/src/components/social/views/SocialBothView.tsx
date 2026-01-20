'use client';

import { CommunityRelations } from '@/lib/api';
import { SocialHighlightCard } from '../SocialHighlightCard';
import { SynergyCard } from '../SynergyCard';
import { Scale, Heart, Skull, Zap } from 'lucide-react';
import { motion, Variants } from 'framer-motion';

interface SocialBothViewProps {
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

export function SocialBothView({ data }: SocialBothViewProps) {
    const buffDuo = [...data.topSynergies].sort((a, b) => b.deltaScore - a.deltaScore)[0];
    const anchorDuo = [...data.antiSynergies].sort((a, b) => a.deltaScore - b.deltaScore)[0];
    const tryhardDuo = [...data.topSynergies].sort((a, b) => b.winRate - a.winRate)[0];

    return (
        <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="space-y-8"
        >
            {/* Header Comparison Text */}
            <motion.div variants={item} className="text-center space-y-2 pb-4 border-b border-white/5">
                <h3 className="text-2xl font-black italic text-white flex items-center justify-center gap-2">
                    <span className="text-blue-500">SOLO</span> <span className="text-zinc-600 text-sm not-italic">VS</span> <span className="text-purple-500">FLEX</span>
                </h3>
                <p className="text-sm text-zinc-500 max-w-md mx-auto">
                    Quem tryharda sozinho e quem carrega o bonde?
                    A matemática não mente (mas magoa).
                </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Buff Highlight */}
                <motion.div variants={item} className="h-full" whileHover="hover" initial="rest" animate="rest">
                    <motion.div variants={hoverCard} className="h-full">
                        <SocialHighlightCard
                            title="Amor no Flex"
                            subtitle="Buff de Elo"
                            icon={Heart}
                            color="green"
                        >
                            {buffDuo ? (
                                <div className="mt-4 text-center">
                                    <div className="flex justify-center -space-x-3 mb-3">
                                        <img src={`https://ddragon.leagueoflegends.com/cdn/16.1.1/img/profileicon/${buffDuo.players[0].profileIconId}.png`} className="w-12 h-12 rounded-full border-2 border-green-500 bg-black shadow-lg shadow-green-500/20" />
                                        <img src={`https://ddragon.leagueoflegends.com/cdn/16.1.1/img/profileicon/${buffDuo.players[1].profileIconId}.png`} className="w-12 h-12 rounded-full border-2 border-green-500 bg-black shadow-lg shadow-green-500/20" />
                                    </div>
                                    <div className="text-3xl font-black text-green-400 user-select-none">+{buffDuo.deltaScore.toFixed(1)}</div>
                                    <div className="text-xs text-green-300 font-bold uppercase tracking-wider">Delta Score</div>
                                    <div className="text-[10px] text-zinc-500 mt-2 italic max-w-[200px] mx-auto bg-black/40 px-2 py-1 rounded">
                                        "Juntos eles viram pro-players"
                                    </div>
                                </div>
                            ) : (
                                <div className="h-full flex items-center justify-center text-zinc-600 italic">Sem dados de buff</div>
                            )}
                        </SocialHighlightCard>
                    </motion.div>
                </motion.div>

                {/* Anchor Highlight */}
                <motion.div variants={item} className="h-full" whileHover="hover" initial="rest" animate="rest">
                    <motion.div variants={hoverCard} className="h-full">
                        <SocialHighlightCard
                            title="Duo da Depressão"
                            subtitle="Nerf de Elo"
                            icon={Skull}
                            color="red"
                        >
                            {anchorDuo ? (
                                <div className="mt-4 text-center">
                                    <div className="flex justify-center -space-x-3 mb-3">
                                        <img src={`https://ddragon.leagueoflegends.com/cdn/16.1.1/img/profileicon/${anchorDuo.players[0].profileIconId}.png`} className="w-12 h-12 rounded-full border-2 border-red-500 bg-black grayscale opacity-90" />
                                        <img src={`https://ddragon.leagueoflegends.com/cdn/16.1.1/img/profileicon/${anchorDuo.players[1].profileIconId}.png`} className="w-12 h-12 rounded-full border-2 border-red-500 bg-black grayscale opacity-90" />
                                    </div>
                                    <div className="text-3xl font-black text-red-500">{anchorDuo.deltaScore.toFixed(1)}</div>
                                    <div className="text-xs text-red-400 font-bold uppercase tracking-wider">Delta Score</div>
                                    <div className="text-[10px] text-zinc-500 mt-2 italic max-w-[200px] mx-auto bg-black/40 px-2 py-1 rounded">
                                        "Cada um entrega uma lane"
                                    </div>
                                </div>
                            ) : (
                                <div className="h-full flex items-center justify-center text-zinc-600 italic">Sem âncoras detectadas</div>
                            )}
                        </SocialHighlightCard>
                    </motion.div>
                </motion.div>

                {/* Tryhard Highlight */}
                <motion.div variants={item} className="h-full" whileHover="hover" initial="rest" animate="rest">
                    <motion.div variants={hoverCard} className="h-full">
                        <SocialHighlightCard
                            title="Tryhard no Solo"
                            subtitle="Focados apenas em vencer"
                            icon={Zap}
                            color="purple"
                        >
                            {tryhardDuo ? (
                                <div className="mt-4 text-center">
                                    <div className="flex justify-center -space-x-3 mb-3">
                                        <img src={`https://ddragon.leagueoflegends.com/cdn/16.1.1/img/profileicon/${tryhardDuo.players[0].profileIconId}.png`} className="w-12 h-12 rounded-full border-2 border-purple-500 bg-black" />
                                        <img src={`https://ddragon.leagueoflegends.com/cdn/16.1.1/img/profileicon/${tryhardDuo.players[1].profileIconId}.png`} className="w-12 h-12 rounded-full border-2 border-purple-500 bg-black" />
                                    </div>
                                    <div className="text-3xl font-black text-purple-400">{tryhardDuo.winRate.toFixed(0)}%</div>
                                    <div className="text-xs text-purple-300 font-bold uppercase tracking-wider">Winrate Absurdo</div>
                                    <div className="text-[10px] text-zinc-500 mt-2 italic max-w-[200px] mx-auto bg-black/40 px-2 py-1 rounded">
                                        "Zero diversão, 100% performance"
                                    </div>
                                </div>
                            ) : (
                                <div className="h-full flex items-center justify-center text-zinc-600 italic">Dados insuficientes</div>
                            )}
                        </SocialHighlightCard>
                    </motion.div>
                </motion.div>
            </div>

            {/* Detailed List */}
            <motion.div variants={item} className="space-y-4">
                <div className="flex items-center gap-2 mb-4 px-2">
                    <Scale className="w-5 h-5 text-zinc-400" />
                    <h3 className="font-bold text-white uppercase tracking-wider text-sm">
                        Comparativo Geral (Impacto Social)
                    </h3>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="space-y-3">
                        <h4 className="text-xs font-bold text-green-400 uppercase mb-2 pl-2 border-l-2 border-green-500">Buff de Desempenho</h4>
                        {data.topSynergies.slice(0, 3).map((rel, i) => (
                            <SynergyCard key={`good-${i}`} relation={rel} rank={i + 1} type="GOOD" />
                        ))}
                    </div>
                    <div className="space-y-3">
                        <h4 className="text-xs font-bold text-red-400 uppercase mb-2 pl-2 border-l-2 border-red-500">Nerf de Desempenho</h4>
                        {data.antiSynergies.slice(0, 3).map((rel, i) => (
                            <SynergyCard key={`bad-${i}`} relation={rel} rank={i + 1} type="BAD" />
                        ))}
                    </div>
                </div>
            </motion.div>

        </motion.div>
    );
}
