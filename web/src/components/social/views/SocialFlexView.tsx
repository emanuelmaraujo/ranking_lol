'use client';

import { CommunityRelations } from '@/lib/api';
import { SocialHighlightCard } from '../SocialHighlightCard';
import { Crown, Users, Tent, Beer, Trophy, Zap, Gamepad2 } from 'lucide-react';
import { motion, Variants } from 'framer-motion';

interface SocialFlexViewProps {
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

export function SocialFlexView({ data }: SocialFlexViewProps) {
    const topSquad = data.highlights.squads[0];
    const flexOnlyPlayer = data.highlights.flexOnly[0];
    const trinca = data.highlights.squads.find((s: any) => s.members.length === 3);

    return (
        <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="space-y-8"
        >

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Bonde do Tigrinho */}
                <motion.div variants={item} className="h-full" whileHover="hover" initial="rest" animate="rest">
                    <motion.div variants={hoverCard} className="h-full">
                        <SocialHighlightCard
                            title="Bonde do Tigrinho"
                            subtitle="Flexzera 5x5 Viciada"
                            icon={Crown}
                            color="purple"
                        >
                            {topSquad ? (
                                <div className="mt-4 text-center">
                                    {/* Avatars */}
                                    <div className="flex justify-center -space-x-2 mb-4 overflow-hidden px-4 py-2">
                                        {topSquad.members.map((p: any, i: number) => (
                                            <motion.img
                                                initial={{ scale: 0 }}
                                                animate={{ scale: 1 }}
                                                transition={{ delay: i * 0.1, type: "spring" }}
                                                key={i}
                                                src={`https://ddragon.leagueoflegends.com/cdn/16.1.1/img/profileicon/${p.profileIconId}.png`}
                                                className="w-10 h-10 rounded-full border-2 border-purple-500 bg-black hover:z-10 hover:scale-110 transition-all cursor-pointer shadow-lg shadow-purple-500/30"
                                                title={p.gameName}
                                            />
                                        ))}
                                    </div>
                                    <div className="flex justify-center gap-6 text-center bg-purple-500/5 rounded-xl p-2 mx-2 border border-purple-500/10">
                                        <div>
                                            <div className="text-2xl font-black text-white">{topSquad.winRate.toFixed(0)}%</div>
                                            <div className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Winrate</div>
                                        </div>
                                        <div className="w-px bg-white/10 h-8 self-center"></div>
                                        <div>
                                            <div className="text-2xl font-black text-purple-400">{topSquad.games}</div>
                                            <div className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Games</div>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-zinc-600">
                                    <Beer className="w-8 h-8 mb-2 opacity-20" />
                                    <span className="text-xs italic">Cadê o time pro Clash?</span>
                                </div>
                            )}
                        </SocialHighlightCard>
                    </motion.div>
                </motion.div>

                {/* Agente Livre / Sem Cal */}
                <motion.div variants={item} className="h-full" whileHover="hover" initial="rest" animate="rest">
                    <motion.div variants={hoverCard} className="h-full">
                        <SocialHighlightCard
                            title="Agente Livre"
                            subtitle="Só joga Flex (0 Solo)"
                            icon={Tent}
                            color="green"
                        >
                            {flexOnlyPlayer ? (
                                <div className="mt-4 flex flex-col items-center gap-3 p-2">
                                    <div className="relative">
                                        <img src={`https://ddragon.leagueoflegends.com/cdn/16.1.1/img/profileicon/${flexOnlyPlayer.player.profileIconId}.png`} className="w-16 h-16 rounded-full border-2 border-green-500 bg-black shadow-[0_0_15px_rgba(34,197,94,0.3)]" />
                                        <div className="absolute -bottom-2 -right-2 bg-green-500 text-black text-[10px] font-black px-1.5 py-0.5 rounded">FLEX</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="font-bold text-white text-lg leading-none">{flexOnlyPlayer.player.gameName}</div>
                                        <div className="text-green-400 font-mono text-sm mt-1">{flexOnlyPlayer.value} Games</div>
                                        <div className="text-[10px] text-zinc-500 italic mt-2 bg-black/40 px-3 py-1 rounded-full border border-white/5">
                                            "SoloQ é estresse, Flex é vida"
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-zinc-600">
                                    <Users className="w-8 h-8 mb-2 opacity-20" />
                                    <span className="text-xs italic">Geral é tryhard de SoloQ</span>
                                </div>
                            )}
                        </SocialHighlightCard>
                    </motion.div>
                </motion.div>

                {/* Trinca Fatal */}
                <motion.div variants={item} className="h-full" whileHover="hover" initial="rest" animate="rest">
                    <motion.div variants={hoverCard} className="h-full">
                        <SocialHighlightCard
                            title="Trinca Fatal"
                            subtitle="Trio que Carrega"
                            icon={Gamepad2}
                            color="cyan"
                        >
                            {trinca ? (
                                <div className="mt-4 text-center">
                                    <div className="flex justify-center -space-x-3 mb-4">
                                        {trinca.members.map((p: any, i: number) => (
                                            <img key={i} src={`https://ddragon.leagueoflegends.com/cdn/16.1.1/img/profileicon/${p.profileIconId}.png`} className="w-12 h-12 rounded-full border-2 border-cyan-500 bg-black" />
                                        ))}
                                    </div>
                                    <div className="text-3xl font-black text-cyan-400 leading-none">{trinca.winRate.toFixed(0)}% WR</div>
                                    <div className="text-[10px] text-zinc-500 mt-1 uppercase font-bold tracking-wider">
                                        Em {trinca.games} Jogos
                                    </div>
                                    <div className="mt-3 flex gap-1 justify-center">
                                        <span className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse"></span>
                                        <span className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse delay-75"></span>
                                        <span className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse delay-150"></span>
                                    </div>
                                </div>
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-zinc-600">
                                    <Zap className="w-8 h-8 mb-2 opacity-20" />
                                    <span className="text-xs italic">Faltam trios para analisar</span>
                                </div>
                            )}
                        </SocialHighlightCard>
                    </motion.div>
                </motion.div>
            </div>

            {/* 2. Flex Ranking List */}
            <motion.div variants={item} className="bg-gradient-to-b from-white/5 to-black/40 rounded-3xl border border-white/5 p-6 backdrop-blur-sm shadow-xl">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                        <Trophy className="w-5 h-5 text-purple-400" />
                        Ranking de Flex (Squads)
                    </h3>
                    <div className="text-xs font-mono text-zinc-500 bg-black/40 px-2 py-1 rounded">ATIVIDADE</div>
                </div>

                <div className="space-y-2">
                    {data.highlights.squads.length > 0 ? (
                        data.highlights.squads.map((squad: any, i: number) => (
                            <motion.div
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.05 }}
                                key={i}
                                className="flex items-center justify-between bg-black/40 p-3 rounded-xl border border-white/5 hover:border-purple-500/30 transition-all hover:bg-white/5 group"
                            >
                                <div className="flex items-center gap-4">
                                    <div className={`w-8 font-black text-center ${i === 0 ? 'text-yellow-400 text-xl' : 'text-zinc-600'}`}>
                                        #{i + 1}
                                    </div>
                                    <div className="flex -space-x-2 group-hover:space-x-1 transition-all">
                                        {squad.members.map((p: any, j: number) => (
                                            <img key={j} src={`https://ddragon.leagueoflegends.com/cdn/16.1.1/img/profileicon/${p.profileIconId}.png`} className="w-8 h-8 rounded-full border border-zinc-900 transition-transform hover:scale-125 hover:z-20" title={p.gameName} />
                                        ))}
                                    </div>
                                </div>

                                <div className="flex items-center gap-8 text-right min-w-[120px] justify-end">
                                    <div className="hidden sm:block">
                                        <div className="text-zinc-500 text-[10px] uppercase font-bold">Games</div>
                                        <div className="text-white font-bold">{squad.games}</div>
                                    </div>
                                    <div className="w-16">
                                        <div className="text-zinc-500 text-[10px] uppercase font-bold">Winrate</div>
                                        <div className={`font-black ${squad.winRate >= 50 ? 'text-green-400' : 'text-red-400'}`}>
                                            {squad.winRate.toFixed(0)}%
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ))
                    ) : (
                        <div className="text-center py-10 text-zinc-500 italic flex flex-col items-center">
                            <span className="text-4xl mb-2">🤷</span>
                            Nenhum squad jogou junto recentemente.
                        </div>
                    )}
                </div>
            </motion.div>
        </motion.div>
    );
}
