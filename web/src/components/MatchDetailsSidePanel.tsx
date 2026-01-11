'use client';

import { MatchHistoryEntry } from "@/lib/api";
import { X, Swords, Target, AlertCircle, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { DDRAGON_VERSION } from "@/lib/constants";
import { normalizeChampionName } from "@/lib/utils";

interface MatchDetailsSidePanelProps {
    match: MatchHistoryEntry | null;
    onClose: () => void;
}

export function MatchDetailsSidePanel({ match, onClose }: MatchDetailsSidePanelProps) {
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
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[90]"
                    />

                    {/* Panel */}
                    <motion.div
                        initial={{ x: "100%" }}
                        animate={{ x: 0 }}
                        exit={{ x: "100%" }}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        className="fixed inset-y-0 right-0 z-[100] w-full md:w-[500px] bg-[#09090b] shadow-2xl border-l border-white/10 flex flex-col"
                    >
                        {/* 1. Header Fixo */}
                        <div className="flex-none p-6 border-b border-white/10 bg-black/40 flex items-center justify-between">
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

                        {/* 2. Content Scrollable */}
                        <div className="flex-1 overflow-y-auto p-6 scrollbar-thin">
                            <div className="space-y-8 pb-10">

                                {/* Champion Header */}
                                <div className="flex flex-col items-center justify-center pt-2">
                                    <div className="relative mb-6">
                                        <div className={`absolute inset-0 rounded-full blur-2xl opacity-40 ${match.isVictory ? 'bg-emerald-500' : 'bg-red-500'}`} />
                                        <img
                                            src={`https://ddragon.leagueoflegends.com/cdn/${DDRAGON_VERSION}/img/champion/${normalizeChampionName(match.championName)}.png`}
                                            alt={match.championName}
                                            className={`relative w-32 h-32 rounded-full border-4 shadow-2xl ${match.isVictory ? 'border-emerald-500' : 'border-red-500'}`}
                                        />
                                        <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 bg-[#18181b] px-4 py-1.5 rounded-full border border-white/10 shadow-xl whitespace-nowrap z-10 flex items-center gap-2">
                                            <span className="text-sm font-bold text-white">{match.championName}</span>
                                        </div>
                                    </div>
                                    <div className="text-center mt-2">
                                        <div className="text-4xl font-mono font-bold text-white tracking-widest">{match.kda}</div>
                                        <div className="text-[10px] text-gray-500 uppercase font-bold tracking-[0.2em] mt-1">K/D/A Final</div>
                                    </div>
                                </div>

                                {/* Score Display */}
                                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-white/5 to-transparent border border-white/5 p-8 text-center group transition-all hover:border-white/10">
                                    <div className="relative z-10">
                                        <div className="text-7xl font-black text-transparent bg-clip-text bg-gradient-to-b from-indigo-400 to-indigo-600 drop-shadow-2xl filter">
                                            {match.score.toFixed(0)}
                                        </div>
                                        <div className="text-xs font-bold text-gray-400 uppercase tracking-[0.3em] mt-2">Rift Score</div>
                                    </div>
                                </div>

                                {/* Breakdown Metrics */}
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                                        <span className="w-1 h-4 bg-indigo-500 rounded-full"></span>
                                        Composição da Nota
                                    </div>

                                    <ScoreRow
                                        icon={<Swords size={18} className="text-blue-400" />}
                                        label="Performance"
                                        value={match.performanceScore}
                                        max={match.isVictory ? 60 : 20}
                                        color="bg-blue-500"
                                    />
                                    <ScoreRow
                                        icon={<Target size={18} className="text-amber-400" />}
                                        label="Objetivos"
                                        value={match.objectivesScore}
                                        max={match.isVictory ? 30 : 10}
                                        color="bg-amber-500"
                                    />
                                    <ScoreRow
                                        icon={<AlertCircle size={18} className="text-emerald-400" />}
                                        label="Disciplina"
                                        value={match.disciplineScore}
                                        max={10}
                                        color="bg-emerald-500"
                                    />
                                </div>

                                {/* AI Insight */}
                                <div className="p-5 rounded-xl bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border border-indigo-500/20">
                                    <h4 className="flex items-center gap-2 text-indigo-300 font-bold text-xs uppercase tracking-wider mb-3">
                                        <Sparkles className="w-4 h-4" />
                                        Análise Rift AI
                                    </h4>
                                    <p className="text-sm text-gray-300 leading-relaxed font-medium">
                                        {generateInsight(match)}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}

function ScoreRow({ icon, label, value, max, color }: any) {
    // Calculate percentage based on max potential (e.g., Performance is out of ~60, so 30 is 50%)
    const percentage = Math.min(100, Math.max(0, (value / max) * 100));

    return (
        <div className="group bg-white/5 hover:bg-white/10 border border-transparent hover:border-white/5 rounded-xl p-4 transition-all">
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-black/40 group-hover:bg-black/60 transition-colors">
                        {icon}
                    </div>
                    <span className="text-sm font-medium text-gray-300">{label}</span>
                </div>
                <div className="text-right">
                    <span className="text-xl font-bold text-white font-mono">{value.toFixed(1)}</span>
                    <span className="text-xs text-gray-500 ml-1">/ {max}</span>
                </div>
            </div>
            {/* Progress Bar */}
            <div className="h-1.5 w-full bg-black/40 rounded-full overflow-hidden">
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${percentage}%` }}
                    transition={{ duration: 1.5, ease: "easeOut", delay: 0.2 }}
                    className={`h-full ${color} rounded-full`}
                />
            </div>
        </div>
    );
}

function generateInsight(match: MatchHistoryEntry): string {
    if (match.score > 80) return `Performance excepcional com ${match.championName}! Você dominou o mapa e garantiu objetivos cruciais para a vitória. Continue assim.`;
    if (match.score > 60) return `Boa partida. Você contribuiu solidamente, mas há espaço para melhorar o controle de visão e a participação em objetivos globais.`;
    if (match.isVictory) return `Vitória importante, mas seus números indicam que o time carregou um pouco o piano. Tente focar mais em farm e sobrevivência na próxima.`;
    return `Partida difícil. A fase de rotas com ${match.championName} foi complicada. Revise seus timings de roaming e controle de visão para evitar mortes desnecessárias.`;
}
