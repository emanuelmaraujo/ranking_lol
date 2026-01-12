'use client';

import { useEffect, useState } from "react";
import { MatchHistoryEntry } from "@/lib/api";
import { X, Swords, Target, AlertCircle, Sparkles, Trophy, Skull, Info } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { DDRAGON_VERSION } from "@/lib/constants";
import { normalizeChampionName } from "@/lib/utils";

interface MatchDetailsModalProps {
    match: MatchHistoryEntry | null;
    puuid: string; // Needed for the API call
    onClose: () => void;
}

interface EnrichedDetails {
    matchId: string;
    outcome: string;
    player: {
        championName: string;
        championId: number;
        kda: string;
        score: number;
        breakdown: {
            performance: number;
            objectives: number;
            discipline: number;
        };
    };
    opponent: {
        championName: string;
        championId: number;
        stats: {
            kda: string;
            cs: number;
            gold: number;
            damage: number;
            vision: number;
        };
    };
    insight: string;
}

export function MatchDetailsModal({ match, puuid, onClose }: MatchDetailsModalProps) {
    const [details, setDetails] = useState<EnrichedDetails | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (match && puuid) {
            setLoading(true);
            fetch(`/api/matches/${match.matchId}/details?puuid=${puuid}`)
                .then(res => res.json())
                .then(data => setDetails(data))
                .catch(err => console.error("Failed to fetch details", err))
                .finally(() => setLoading(false));
        } else {
            setDetails(null);
        }
    }, [match, puuid]);

    if (!match) return null;

    return (
        <AnimatePresence>
            {match && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[90]"
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        transition={{ type: "spring", duration: 0.5 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-none p-4"
                    >
                        <div className="bg-[#09090b] w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl border border-white/10 shadow-2xl pointer-events-auto flex flex-col">

                            {/* Header */}
                            <div className="flex-none p-6 border-b border-white/10 bg-black/40 flex items-center justify-between sticky top-0 z-20 backdrop-blur-md">
                                <div>
                                    <h2 className="text-xl font-bold text-white leading-none tracking-tight">Detalhes da Partida</h2>
                                    <div className="flex items-center gap-2 mt-2">
                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${match.isVictory ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                                            {match.isVictory ? 'VITÓRIA' : 'DERROTA'}
                                        </span>
                                        <span className="text-xs text-gray-500">
                                            {new Date(match.date).toLocaleDateString()} • {match.lane}
                                        </span>
                                    </div>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="p-2 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                                >
                                    <X size={24} />
                                </button>
                            </div>

                            {/* Content */}
                            <div className="p-8 space-y-10">
                                {loading && !details ? (
                                    <div className="py-20 flex flex-col items-center justify-center gap-4 text-gray-500 animate-pulse">
                                        <Sparkles className="w-8 h-8 animate-spin text-emerald-500" />
                                        <p>Analisando duelo...</p>
                                    </div>
                                ) : details ? (
                                    <>
                                        {/* 1. The Duel (Hero) */}
                                        <div className="flex items-center justify-center gap-8 md:gap-16">
                                            {/* Player */}
                                            <div className="flex flex-col items-center gap-3">
                                                <div className="relative">
                                                    <div className={`absolute inset-0 rounded-full blur-2xl opacity-40 ${match.isVictory ? 'bg-emerald-500' : 'bg-red-500'}`} />
                                                    <img
                                                        src={`https://ddragon.leagueoflegends.com/cdn/${DDRAGON_VERSION}/img/champion/${normalizeChampionName(details.player.championName)}.png`}
                                                        alt="Player"
                                                        className={`relative w-24 h-24 md:w-32 md:h-32 rounded-full border-4 shadow-2xl ${match.isVictory ? 'border-emerald-500' : 'border-red-500'}`}
                                                    />
                                                    <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-[#18181b] px-3 py-1 rounded-full border border-white/10 text-xs font-bold text-white whitespace-nowrap">
                                                        Você
                                                    </div>
                                                </div>
                                                <div className="text-center">
                                                    <div className="text-2xl font-mono font-bold text-white">{details.player.kda}</div>
                                                </div>
                                            </div>

                                            {/* VS */}
                                            <div className="flex flex-col items-center gap-1">
                                                <div className="text-4xl font-black text-white/10 italic">VS</div>
                                                <div className={`text-xs font-bold uppercase tracking-widest ${details.outcome === 'Victory' ? 'text-emerald-500' : 'text-red-500'}`}>
                                                    {details.outcome === 'Victory' ? 'Domínio' : 'Derrota'}
                                                </div>
                                            </div>

                                            {/* Opponent */}
                                            <div className="flex flex-col items-center gap-3">
                                                <div className="relative">
                                                    <img
                                                        src={`https://ddragon.leagueoflegends.com/cdn/${DDRAGON_VERSION}/img/champion/${normalizeChampionName(details.opponent.championName)}.png`}
                                                        alt="Opponent"
                                                        className="relative w-24 h-24 md:w-32 md:h-32 rounded-full border-4 border-white/10 grayscale-[0.5]"
                                                    />
                                                    <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-[#18181b] px-3 py-1 rounded-full border border-white/10 text-xs font-bold text-gray-400 whitespace-nowrap">
                                                        Oponente
                                                    </div>
                                                </div>
                                                <div className="text-center">
                                                    <div className="text-2xl font-mono font-bold text-gray-400">{details.opponent.stats.kda}</div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* 2. Central Score */}
                                        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-white/5 to-transparent border border-white/5 p-6 text-center group transition-all hover:border-white/10">
                                            <div className="text-6xl md:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-b from-indigo-400 to-indigo-600 drop-shadow-2xl filter">
                                                {details.player.score.toFixed(0)}
                                            </div>
                                            <div className="text-xs font-bold text-gray-400 uppercase tracking-[0.3em] mt-2">Rift Score Final</div>
                                        </div>

                                        {/* 3. Breakdown with Comparison */}
                                        <div className="space-y-4">
                                            <div className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                                                <span className="w-1 h-4 bg-indigo-500 rounded-full"></span>
                                                Composição da Nota (vs Oponente)
                                            </div>

                                            <ScoreItem
                                                label="Performance"
                                                value={details.player.breakdown.performance}
                                                max={60}
                                                color="bg-blue-500"
                                                icon={<Swords size={18} className="text-blue-400" />}
                                                opponentValue="Comparado com a média da lane"
                                                desc="Combate, Farm e Visão"
                                            />
                                            <ScoreItem
                                                label="Objetivos"
                                                value={details.player.breakdown.objectives}
                                                max={30}
                                                color="bg-amber-500"
                                                icon={<Target size={18} className="text-amber-400" />}
                                                opponentValue="Sua participação em torres e monstros"
                                                desc="Torres, Dragões, Barão"
                                            />
                                            <ScoreItem
                                                label="Disciplina"
                                                value={details.player.breakdown.discipline}
                                                max={10}
                                                color="bg-emerald-500"
                                                icon={<AlertCircle size={18} className="text-emerald-400" />}
                                                opponentValue="Mortes evitadas vs Oponente"
                                                desc="Quanto menas mortes melhor"
                                            />
                                        </div>

                                        {/* 4. AI Insight */}
                                        <div className="p-5 rounded-xl bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border border-indigo-500/20">
                                            <h4 className="flex items-center gap-2 text-indigo-300 font-bold text-xs uppercase tracking-wider mb-3">
                                                <Sparkles className="w-4 h-4" />
                                                Análise Rift AI
                                            </h4>
                                            <p className="text-sm text-gray-300 leading-relaxed font-medium">
                                                {generateInsight(match)}
                                            </p>
                                        </div>
                                    </>
                                ) : null}
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}

// Simple Tooltip Component
function SimpleTooltip({ children, content }: { children: React.ReactNode, content: string }) {
    const [visible, setVisible] = useState(false);

    return (
        <div className="relative group" onMouseEnter={() => setVisible(true)} onMouseLeave={() => setVisible(false)}>
            {children}
            {visible && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max max-w-xs z-[110]">
                    <div className="bg-black border border-white/20 text-white text-xs p-2 rounded shadow-xl leading-relaxed text-center pointer-events-none">
                        {content}
                        <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-white/20" />
                    </div>
                </div>
            )}
        </div>
    );
}

function ScoreItem({ label, value, max, color, icon, opponentValue, desc }: any) {
    const percentage = Math.min(100, Math.max(0, (value / max) * 100));

    return (
        <SimpleTooltip content={opponentValue}>
            <div className="group bg-white/5 hover:bg-white/10 border border-transparent hover:border-white/5 rounded-xl p-4 transition-all cursor-help">
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-black/40 group-hover:bg-black/60 transition-colors">
                            {icon}
                        </div>
                        <div>
                            <span className="block text-sm font-medium text-gray-300">{label}</span>
                            <span className="text-[10px] text-gray-500 uppercase tracking-wide">{desc}</span>
                        </div>
                    </div>
                    <div className="text-right">
                        <span className="text-xl font-bold text-white font-mono">{value.toFixed(1)}</span>
                        <span className="text-xs text-gray-500 ml-1">/ {max}</span>
                    </div>
                </div>
                <div className="h-1.5 w-full bg-black/40 rounded-full overflow-hidden">
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${percentage}%` }}
                        transition={{ duration: 1.0, ease: "easeOut" }}
                        className={`h-full ${color} rounded-full`}
                    />
                </div>
            </div>
        </SimpleTooltip>
    )
}

function generateInsight(match: MatchHistoryEntry): string {
    if (match.score > 80) return `Performance excepcional com ${match.championName}! Você dominou o mapa e garantiu objetivos cruciais para a vitória. Continue assim.`;
    if (match.score > 60) return `Boa partida. Você contribuiu solidamente, mas há espaço para melhorar o controle de visão e a participação em objetivos globais.`;
    if (match.isVictory) return `Vitória importante, mas seus números indicam que o time carregou um pouco o piano. Tente focar mais em farm e sobrevivência na próxima.`;
    return `Partida difícil. A fase de rotas com ${match.championName} foi complicada. Revise seus timings de roaming e controle de visão para evitar mortes desnecessárias.`;
}
