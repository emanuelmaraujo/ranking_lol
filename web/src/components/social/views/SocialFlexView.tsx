'use client';

import { CommunityRelations } from '@/lib/api';
import { SocialHighlightCard } from '../SocialHighlightCard';
import { Crown, Users, Tent, Beer, Trophy, Zap, Gamepad2, Siren, Skull } from 'lucide-react';
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
    // 1. Logic for Trinca (Trio)
    const trinca = data.highlights.squads.find((s: any) => s.members.length === 3);
    const isCriminalTrio = trinca && trinca.winRate < 50;

    // 2. Logic for Teams (Squads >= 4 members usually, or just use squads list)
    // Dream Team: Highest WR (min 3 games)
    const dreamTeam = [...data.highlights.squads]
        .filter((s: any) => s.games >= 3)
        .sort((a, b) => b.winRate - a.winRate)[0];

    // Criminal Team: Lowest WR (min 3 games)
    const criminalTeam = [...data.highlights.squads]
        .filter((s: any) => s.games >= 3 && s.winRate < 50)
        .sort((a, b) => a.winRate - b.winRate)[0];

    // 0. Aggregation Logic
    // We need to find "Core Teams" (Subsets of size 3+) and sum their stats.
    // e.g. X,Y,Z,A (4 games) + X,Y,Z,B (6 games) -> X,Y,Z (10 games)

    // Helper to get all subsets of size >= 3
    const getSubsets = (members: any[]) => {
        const subsets: any[] = [];
        const n = members.length;
        // Basic power set gen, filtered by size >= 3
        for (let i = 0; i < (1 << n); i++) {
            const subset = [];
            for (let j = 0; j < n; j++) {
                if ((i & (1 << j))) subset.push(members[j]);
            }
            if (subset.length >= 3) {
                // Sort members by puuid/name to ensure unique key
                subset.sort((a, b) => a.gameName.localeCompare(b.gameName));
                subsets.push(subset);
            }
        }
        return subsets;
    };

    const aggregatedMap = new Map<string, { members: any[], games: number, wins: number, totalScore: number }>();

    data.highlights.squads.forEach((unit: any) => {
        // unit.members is array of players
        const subsets = getSubsets(unit.members);
        subsets.forEach(sub => {
            const key = sub.map((m: any) => m.gameName).join('|');
            const existing = aggregatedMap.get(key);
            if (existing) {
                existing.games += unit.games;
                existing.wins += unit.wins;
                existing.totalScore += (unit.avgScoreTogether || 0) * unit.games; // Weighted avg approx
            } else {
                aggregatedMap.set(key, {
                    members: sub,
                    games: unit.games,
                    wins: unit.wins,
                    totalScore: (unit.avgScoreTogether || 0) * unit.games
                });
            }
        });
    });

    const aggregatedSquads = Array.from(aggregatedMap.values()).map(s => ({
        ...s,
        winRate: (s.wins / s.games) * 100,
        avgScore: s.totalScore / s.games // Re-average
    }));

    // Deduplication: Remove subsets if a superset exists with the SAME number of games.
    // This means the subset NEVER played without the superset members.
    // e.g. If X,Y,Z (10 games) exists, and X,Y,Z,J (10 games) exists, remove X,Y,Z.
    const filteredSquads = aggregatedSquads.filter(s => {
        const isSubset = (subset: any[], superset: any[]) => {
            const superNames = new Set(superset.map(m => m.gameName));
            return subset.every(m => superNames.has(m.gameName));
        };

        // Check if there is ANY superset that matches condition
        const hasFullSuperset = aggregatedSquads.some(superSquad =>
            superSquad !== s &&
            superSquad.members.length > s.members.length &&
            superSquad.games >= s.games && // Strict or greater
            isSubset(s.members, superSquad.members)
        );

        return !hasFullSuperset;
    });

    // Inseparable: Squad (size >= 3) with most games
    const inseparable = [...filteredSquads].sort((a, b) => b.games - a.games)[0];

    // 3. Ranking List (Sorted by Performance)
    // Filter out squads with < 2 games to reduce noise if needed
    const rankedSquads = [...filteredSquads]
        .filter(s => s.games >= 2)
        .sort((a, b) => {
            // Priority: Score -> Winrate -> Games
            const scoreA = a.avgScore || a.winRate;
            const scoreB = b.avgScore || b.winRate;
            if (Math.abs(scoreA - scoreB) > 1) return scoreB - scoreA;
            return b.games - a.games; // Tiebreaker
        });

    return (
        <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="space-y-8"
        >

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* 1. Inseparáveis (Most Games) -> Replaces "Bonde do Tigrinho" effectively or sits alongside */}
                <motion.div variants={item} className="h-full" whileHover="hover" initial="rest" animate="rest">
                    <motion.div variants={hoverCard} className="h-full">
                        <SocialHighlightCard
                            title="Os Inseparáveis"
                            subtitle="Só jogam se for junto"
                            icon={Users}
                            color="purple"
                        >
                            {inseparable ? (
                                <div className="mt-4 text-center">
                                    <div className="flex justify-center -space-x-3 mb-4 overflow-hidden px-4 py-2">
                                        {inseparable.members.map((p: any, i: number) => (
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
                                            <div className="text-2xl font-black text-purple-400">{inseparable.games}</div>
                                            <div className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Jogos Juntos</div>
                                        </div>
                                    </div>
                                    <div className="text-[10px] text-zinc-500 mt-2 italic px-3">
                                        "{inseparable.members.length} Jogadores Inseparáveis"
                                    </div>
                                </div>
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-zinc-600">
                                    <Beer className="w-8 h-8 mb-2 opacity-20" />
                                    <span className="text-xs italic">Sem times frequentes</span>
                                </div>
                            )}
                        </SocialHighlightCard>
                    </motion.div>
                </motion.div>

                {/* 2. Dream Team vs Criminal Team Card (Morphing) */}
                <motion.div variants={item} className="h-full" whileHover="hover" initial="rest" animate="rest">
                    <motion.div variants={hoverCard} className="h-full">
                        {dreamTeam && dreamTeam.winRate >= 60 ? (
                            <SocialHighlightCard
                                title="Dream Team"
                                subtitle="A Elite do Flex"
                                icon={Trophy}
                                color="yellow"
                            >
                                <div className="mt-4 text-center">
                                    <div className="flex justify-center -space-x-2 mb-2">
                                        {dreamTeam.members.map((p: any, i: number) => (
                                            <img key={i} src={`https://ddragon.leagueoflegends.com/cdn/16.1.1/img/profileicon/${p.profileIconId}.png`} className="w-8 h-8 rounded-full border-2 border-yellow-500 bg-black" />
                                        ))}
                                    </div>
                                    <div className="text-3xl font-black text-yellow-400">{dreamTeam.winRate.toFixed(0)}%</div>
                                    <div className="text-xs text-yellow-600 font-bold uppercase">Winrate Absurdo</div>
                                    <p className="text-[10px] text-zinc-500 mt-2 italic">"Vencer é detalhe"</p>
                                </div>
                            </SocialHighlightCard>
                        ) : (criminalTeam ? (
                            <SocialHighlightCard
                                title="Time Criminoso"
                                subtitle="Cadeia neles"
                                icon={Siren}
                                color="red"
                            >
                                <div className="mt-4 text-center">
                                    <div className="flex justify-center -space-x-2 mb-2">
                                        {criminalTeam.members.map((p: any, i: number) => (
                                            <img key={i} src={`https://ddragon.leagueoflegends.com/cdn/16.1.1/img/profileicon/${p.profileIconId}.png`} className="w-8 h-8 rounded-full border-2 border-red-500 bg-black" />
                                        ))}
                                    </div>
                                    <div className="text-3xl font-black text-red-500">{criminalTeam.winRate.toFixed(0)}%</div>
                                    <div className="text-xs text-red-600 font-bold uppercase">Taxa de Derrota</div>
                                    <p className="text-[10px] text-zinc-500 mt-2 italic">"O terror da fila ranqueada"</p>
                                </div>
                            </SocialHighlightCard>
                        ) : (
                            <SocialHighlightCard title="Time Médio" subtitle="Nem fede nem cheira" icon={Tent} color="zinc">
                                <div className="h-full flex items-center justify-center text-zinc-600 text-xs text-center px-4">
                                    Nada de especial por aqui.
                                </div>
                            </SocialHighlightCard>
                        ))}
                    </motion.div>
                </motion.div>

                {/* 3. Trinca Check (Fatal or Criminal) */}
                <motion.div variants={item} className="h-full" whileHover="hover" initial="rest" animate="rest">
                    <motion.div variants={hoverCard} className="h-full">
                        <SocialHighlightCard
                            title={isCriminalTrio ? "Trinca Criminosa" : "Trinca Fatal"}
                            subtitle={isCriminalTrio ? "Trio que Entrega" : "Trio que Carrega"}
                            icon={isCriminalTrio ? Skull : Gamepad2}
                            color={isCriminalTrio ? "red" : "cyan"}
                        >
                            {trinca ? (
                                <div className="mt-4 text-center">
                                    <div className="flex justify-center -space-x-3 mb-4">
                                        {trinca.members.map((p: any, i: number) => (
                                            <img key={i} src={`https://ddragon.leagueoflegends.com/cdn/16.1.1/img/profileicon/${p.profileIconId}.png`} className={`w-12 h-12 rounded-full border-2 bg-black ${isCriminalTrio ? 'border-red-500 grayscale' : 'border-cyan-500'}`} />
                                        ))}
                                    </div>
                                    <div className={`text-3xl font-black leading-none ${isCriminalTrio ? 'text-red-500' : 'text-cyan-400'}`}>{trinca.winRate.toFixed(0)}% WR</div>
                                    <div className="text-[10px] text-zinc-500 mt-1 uppercase font-bold tracking-wider">
                                        Em {trinca.games} Jogos
                                    </div>
                                    {isCriminalTrio && (
                                        <div className="mt-2 text-[10px] text-red-400 font-bold bg-red-950/40 px-2 py-1 rounded border border-red-500/20 inline-block">
                                            PERIGO IMEDIATO
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-zinc-600">
                                    <Zap className="w-8 h-8 mb-2 opacity-20" />
                                    <span className="text-xs italic">Nenhum trio frequente</span>
                                </div>
                            )}
                        </SocialHighlightCard>
                    </motion.div>
                </motion.div>
            </div>

            {/* 2. Flex Ranking List (Aggregated Squads) */}
            <motion.div variants={item} className="bg-gradient-to-b from-white/5 to-black/40 rounded-3xl border border-white/5 p-6 backdrop-blur-sm shadow-xl">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                        <Trophy className="w-5 h-5 text-purple-400" />
                        Ranking de Squads (Agrupados)
                    </h3>
                    <div className="text-xs font-mono text-zinc-500 bg-black/40 px-2 py-1 rounded">PERFORMANCE + AMIZADE</div>
                </div>

                <div className="space-y-2">
                    {rankedSquads.length > 0 ? (
                        rankedSquads.map((squad: any, i: number) => (
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
                                    <div className="flex -space-x-3 group-hover:space-x-1 transition-all">
                                        {squad.members.map((p: any, j: number) => (
                                            <img key={j} src={`https://ddragon.leagueoflegends.com/cdn/16.1.1/img/profileicon/${p.profileIconId}.png`} className="w-10 h-10 rounded-full border-2 border-zinc-900 transition-transform hover:scale-110 hover:z-20" title={p.gameName} />
                                        ))}
                                    </div>
                                    {/* Show count of players explicitly if dense */}
                                    {squad.members.length > 3 && (
                                        <div className="text-[10px] font-mono text-zinc-600 bg-black/50 px-1 rounded">{squad.members.length}p</div>
                                    )}
                                </div>

                                <div className="flex items-center gap-6 text-right min-w-[120px] justify-end">
                                    <div className="hidden sm:block">
                                        <div className="text-zinc-500 text-[10px] uppercase font-bold">Jogos Juntos</div>
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
                            Nenhum squad frequente encontrado.
                        </div>
                    )}
                </div>
            </motion.div>
        </motion.div>
    );
}
