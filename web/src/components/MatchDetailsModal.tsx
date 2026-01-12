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
    comparisons: {
        performance: any[];
        objectives: any[];
        discipline: any[];
        lane: string;
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

    // --- Dynamic Theme ---
    const isWin = match.isVictory;

    // Gradients & Colors
    const theme = isWin ? {
        border: 'border-amber-500/20',
        glow: 'shadow-amber-500/10',
        bgGradient: 'from-amber-500/5',
        title: 'text-amber-400',
        badge: 'bg-amber-500/10 text-amber-300 border-amber-500/20',
        heroBorder: 'border-amber-400',
        vsColor: 'text-amber-600',
        scoreText: 'from-amber-200 to-amber-500',
    } : {
        border: 'border-red-500/20',
        glow: 'shadow-red-500/10',
        bgGradient: 'from-red-500/5',
        title: 'text-red-400',
        badge: 'bg-red-500/10 text-red-300 border-red-500/20',
        heroBorder: 'border-red-500',
        vsColor: 'text-red-600',
        scoreText: 'from-red-200 to-red-500',
    };

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
                        className="fixed inset-0 bg-black/90 backdrop-blur-md z-[90]"
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        transition={{ type: "spring", duration: 0.5 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-none p-4"
                    >
                        <div className={`bg-[#09090b] w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl border ${theme.border} shadow-2xl pointer-events-auto flex flex-col relative`}>

                            {/* Ambient Glow */}
                            <div className={`absolute top-0 inset-x-0 h-32 bg-gradient-to-b ${theme.bgGradient} to-transparent opacity-50 pointer-events-none`} />

                            {/* Header */}
                            <div className="flex-none p-6 border-b border-white/5 bg-black/40 flex items-center justify-between sticky top-0 z-20 backdrop-blur-md">
                                <div>
                                    <h2 className={`text-xl font-bold ${theme.title} leading-none tracking-tight flex items-center gap-2`}>
                                        {isWin ? <Trophy size={18} /> : <Skull size={18} />}
                                        DETALHES DA PARTIDA
                                    </h2>
                                    <div className="flex items-center gap-2 mt-2">
                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${theme.badge}`}>
                                            {isWin ? 'VITÓRIA' : 'DERROTA'}
                                        </span>
                                        <span className="text-xs text-zinc-500 font-medium">
                                            {new Date(match.date).toLocaleDateString()} • {match.lane} • {(match.duration / 60).toFixed(0)}m
                                        </span>
                                    </div>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="p-2 rounded-full hover:bg-white/10 text-zinc-500 hover:text-white transition-colors"
                                >
                                    <X size={24} />
                                </button>
                            </div>

                            {/* Content */}
                            <div className="p-8 space-y-10 relative z-10">
                                {loading && !details ? (
                                    <div className="py-20 flex flex-col items-center justify-center gap-4 text-zinc-500 animate-pulse">
                                        <div className={`w-12 h-12 rounded-full border-2 ${theme.border} border-t-transparent animate-spin`} />
                                        <p className="text-xs font-bold uppercase tracking-widest">Analisando Duelo...</p>
                                    </div>
                                ) : details ? (
                                    <>
                                        {/* 1. The Duel (Hero) */}
                                        <div className="flex items-center justify-center gap-8 md:gap-16">
                                            {/* Player */}
                                            <div className="flex flex-col items-center gap-4">
                                                <div className="relative group">
                                                    <div className={`absolute inset-0 rounded-full blur-2xl opacity-40 group-hover:opacity-60 transition-opacity ${isWin ? 'bg-amber-500' : 'bg-red-500'}`} />
                                                    <img
                                                        src={`https://ddragon.leagueoflegends.com/cdn/${DDRAGON_VERSION}/img/champion/${normalizeChampionName(details.player.championName)}.png`}
                                                        alt="Player"
                                                        className={`relative w-24 h-24 md:w-28 md:h-28 rounded-full border-4 shadow-2xl ${theme.heroBorder}`}
                                                    />
                                                    <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-[#18181b] px-3 py-1 rounded-full border border-white/10 text-[10px] font-bold text-white whitespace-nowrap shadow-lg">
                                                        VOCÊ
                                                    </div>
                                                </div>
                                                <div className="text-center">
                                                    <div className="text-2xl font-mono font-bold text-white tracking-tighter">{details.player.kda}</div>
                                                    <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">KDA</div>
                                                </div>
                                            </div>

                                            {/* VS */}
                                            <div className="flex flex-col items-center gap-1">
                                                <div className={`text-4xl font-black ${theme.vsColor} opacity-20 italic`}>VS</div>
                                            </div>

                                            {/* Opponent */}
                                            <div className="flex flex-col items-center gap-4">
                                                <div className="relative group">
                                                    <img
                                                        src={`https://ddragon.leagueoflegends.com/cdn/${DDRAGON_VERSION}/img/champion/${normalizeChampionName(details.opponent.championName)}.png`}
                                                        alt="Opponent"
                                                        className="relative w-24 h-24 md:w-28 md:h-28 rounded-full border-4 border-white/5 grayscale-[0.8] group-hover:grayscale-0 transition-all duration-500"
                                                    />
                                                    <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-[#18181b] px-3 py-1 rounded-full border border-white/10 text-[10px] font-bold text-zinc-500 whitespace-nowrap shadow-lg">
                                                        OPONENTE
                                                    </div>
                                                </div>
                                                <div className="text-center">
                                                    <div className="text-2xl font-mono font-bold text-zinc-500 tracking-tighter">{details.opponent.stats.kda}</div>
                                                    <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">KDA</div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* 2. Central Score */}
                                        <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-br from-white/5 to-transparent border border-white/5 p-6 text-center group transition-all hover:border-white/10 group`}>
                                            <div className={`text-7xl md:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-b ${theme.scoreText} drop-shadow-2xl filter tracking-tighter`}>
                                                {details.player.score.toFixed(0)}
                                            </div>
                                            <div className="text-xs font-bold text-zinc-600 uppercase tracking-[0.5em] mt-2 group-hover:text-zinc-400 transition-colors">Rift Score</div>
                                        </div>

                                        {/* 3. Breakdown with Comparison */}
                                        <div className="space-y-4">
                                            <div className="flex items-center gap-2 text-xs font-bold text-zinc-500 uppercase tracking-wider mb-4 px-1">
                                                <Target size={14} />
                                                Análise de Métricas
                                            </div>

                                            <ScoreItem
                                                label="Performance"
                                                value={details.player.breakdown.performance}
                                                max={60}
                                                color="bg-blue-500"
                                                icon={<Swords size={18} className="text-blue-400" />}
                                                data={details.comparisons.performance}
                                                desc="Farm, Dano e Visão"
                                                lane={details.comparisons.lane}
                                            />
                                            <ScoreItem
                                                label="Objetivos"
                                                value={details.player.breakdown.objectives}
                                                max={30}
                                                color="bg-amber-500"
                                                icon={<Target size={18} className="text-amber-400" />}
                                                data={details.comparisons.objectives}
                                                desc="Torres, Dragões e Barões"
                                                lane={details.comparisons.lane}
                                            />
                                            <ScoreItem
                                                label="Disciplina"
                                                value={details.player.breakdown.discipline}
                                                max={10}
                                                color="bg-emerald-500"
                                                icon={<AlertCircle size={18} className="text-emerald-400" />}
                                                data={details.comparisons.discipline}
                                                desc="Sobrevivência e Controle"
                                                lane={details.comparisons.lane}
                                            />
                                        </div>

                                        {/* 4. AI Insight */}
                                        <div className={`p-6 rounded-xl bg-gradient-to-r ${theme.bgGradient} border ${theme.border} relative overflow-hidden`}>
                                            <div className="relative z-10">
                                                <h4 className={`flex items-center gap-2 ${theme.title} font-bold text-xs uppercase tracking-wider mb-3`}>
                                                    <Sparkles className="w-4 h-4" />
                                                    Análise Rift AI
                                                </h4>
                                                <p className="text-sm text-zinc-300 leading-relaxed font-medium">
                                                    {generateInsight(match, details)}
                                                </p>
                                            </div>
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

// Weights Config Mirror (For visual context)
const ROLE_WEIGHTS: any = {
    'TOP': { cspm: 15, dpm: 15, tankiness: 10, vspm: 10, kp: 10 },
    'MIDDLE': { dpm: 20, cspm: 15, kp: 10, vspm: 10 },
    'BOTTOM': { cspm: 20, dpm: 20, kp: 10 },
    'UTILITY': { vspm: 25, kp: 15, objPart: 10 },
    'JUNGLE': { globalObj: 25, vspm: 15, kp: 10 }
};

// Comparison Tooltip Component
function ComparisonTooltip({ children, title, data, lane }: { children: React.ReactNode, title: string, data: any[], lane?: string }) {
    const [visible, setVisible] = useState(false);

    return (
        <div className="relative group/tooltip" onMouseEnter={() => setVisible(true)} onMouseLeave={() => setVisible(false)}>
            {children}
            <AnimatePresence>
                {visible && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-max min-w-[220px] z-[120]"
                    >
                        <div className="bg-[#18181b] border border-white/20 rounded-xl shadow-2xl overflow-hidden">
                            {/* Header */}
                            <div className="bg-white/5 px-4 py-2 border-b border-white/10 flex items-center justify-between">
                                <span className="text-xs font-bold text-gray-300 uppercase tracking-wider">{title}</span>
                                {lane && <span className="text-[10px] text-zinc-500 font-mono">{lane}</span>}
                            </div>

                            {/* Table */}
                            <div className="p-1">
                                <table className="w-full text-xs">
                                    <thead>
                                        <tr className="text-gray-500 border-b border-white/5">
                                            <th className="px-3 py-2 text-left font-medium">Métrica</th>
                                            <th className="px-3 py-2 text-right font-medium text-emerald-400">Você</th>
                                            <th className="px-3 py-2 text-right font-medium text-red-400">Op.</th>
                                            <th className="px-3 py-2 text-right font-medium text-yellow-400">Pts</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {data.map((row, idx) => {
                                            const pVal = parseFloat(row.player);
                                            const oVal = parseFloat(row.opponent);
                                            // Handle strings (like %) or just raw numbers
                                            const displayP = row.player;
                                            const displayO = row.opponent;

                                            const win = row.invert ? pVal <= oVal : pVal >= oVal;

                                            // Weight Context (Visual Only if needed, but we have strict points now)
                                            // We use the weight (maxPoints) passed from backend if available
                                            const max = row.maxPoints || 0;
                                            const pts = row.points !== undefined ? row.points : '-';

                                            return (
                                                <tr key={idx} className="hover:bg-white/5 transition-colors">
                                                    <td className="px-3 py-2 font-medium text-gray-300 flex items-center gap-1">
                                                        {row.label}
                                                    </td>
                                                    <td className={`px-3 py-2 text-right font-mono font-bold ${win ? 'text-emerald-400' : 'text-gray-400'}`}>
                                                        {displayP}
                                                    </td>
                                                    <td className={`px-3 py-2 text-right font-mono font-bold ${!win ? 'text-red-400' : 'text-gray-400'}`}>
                                                        {displayO}
                                                    </td>
                                                    <td className="px-3 py-2 text-right font-mono font-bold text-yellow-400/90">
                                                        {pts}<span className="text-gray-600 text-[9px]">/{max}</span>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>

                            {/* Footer Arrow */}
                            <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px border-4 border-transparent border-t-[#18181b]" />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

function ScoreItem({ label, value, max, color, icon, data, desc, lane }: any) {
    const percentage = Math.min(100, Math.max(0, (value / max) * 100));

    // Determine color based on ratio? Or keep fixed?
    // Let's use the provided color but maybe glow if high score

    return (
        <ComparisonTooltip title={label} data={data} lane={lane}>
            <div className="group bg-white/5 hover:bg-white/10 border border-transparent hover:border-white/10 rounded-xl p-4 transition-all cursor-help relative overflow-hidden">
                {/* Background Progress (Subtle) */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:animate-shimmer" />

                <div className="flex items-center justify-between mb-3 relative z-10">
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg bg-black/40 group-hover:${color.replace('bg-', 'text-')} transition-colors`}>
                            {icon}
                        </div>
                        <div>
                            <span className="block text-sm font-bold text-gray-200 group-hover:text-white transition-colors">{label}</span>
                            <span className="text-[10px] text-gray-500 uppercase tracking-wide">{desc}</span>
                        </div>
                    </div>
                    <div className="text-right">
                        <div className="flex items-baseline justify-end gap-1">
                            <span className="text-xl font-black text-white font-mono">{value.toFixed(1)}</span>
                            <span className="text-xs text-gray-600 font-bold">/ {max}</span>
                        </div>
                    </div>
                </div>

                {/* Bar */}
                <div className="h-2 w-full bg-black/50 rounded-full overflow-hidden border border-white/5">
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${percentage}%` }}
                        transition={{ duration: 1.0, ease: "easeOut" }}
                        className={`h-full ${color} shadow-[0_0_10px_currentColor]`}
                    />
                </div>
            </div>
        </ComparisonTooltip>
    )
}

function generateInsight(match: MatchHistoryEntry, details: EnrichedDetails): string {
    const outcomes = {
        victory: [
            "Vitória dominante! Seus índices superaram o oponente em momentos chave.",
            "Excelente controle de mapa. A conversão de objetivos foi o diferencial.",
        ],
        defeat: [
            "Partida difícil. O oponente capitalizou melhor nos erros de posicionamento.",
            "Faltou controle de visão nos momentos decisivos. Tente priorizar wards antes dos dragões.",
        ]
    };

    // Simple randomizer or logic based on Comparison Diff
    if (match.isVictory) return outcomes.victory[0];
    return outcomes.defeat[0];
}
