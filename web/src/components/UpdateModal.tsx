"use client";

import { useState, useRef, useEffect } from "react";
import { X, Check, AlertTriangle, Loader2, Play, RefreshCw, Zap, Server } from "lucide-react";
import { RankingEntry } from "@/lib/api";

interface UpdateModalProps {
    isOpen: boolean;
    onClose: () => void;
    availablePlayers: RankingEntry[];
}

export function UpdateModal({ isOpen, onClose, availablePlayers }: UpdateModalProps) {
    const [selectedPuuids, setSelectedPuuids] = useState<string[]>([]);
    const [matchCount, setMatchCount] = useState(5);
    const [queue, setQueue] = useState<'SOLO' | 'FLEX' | 'BOTH'>('BOTH');
    const [adminPassword, setAdminPassword] = useState('');

    // Status
    const [status, setStatus] = useState<'IDLE' | 'PROCESSING' | 'SUCCESS' | 'ERROR'>('IDLE');
    const [progress, setProgress] = useState(0);
    const [log, setLog] = useState<string[]>([]);
    const [intervalId, setIntervalId] = useState<NodeJS.Timeout | null>(null);
    const logRef = useRef<HTMLDivElement>(null);

    const handleClose = () => {
        if (status === 'SUCCESS') {
            window.location.reload();
        } else {
            onClose();
        }
    };

    // Auto-scroll logs
    useEffect(() => {
        if (logRef.current) {
            logRef.current.scrollTop = logRef.current.scrollHeight;
        }
    }, [log]);

    // Cleanup interval on unmount
    useEffect(() => {
        return () => {
            if (intervalId) clearInterval(intervalId);
        };
    }, [intervalId]);

    if (!isOpen) return null;

    const togglePlayer = (puuid: string) => {
        if (selectedPuuids.includes(puuid)) {
            setSelectedPuuids(selectedPuuids.filter(id => id !== puuid));
        } else {
            setSelectedPuuids([...selectedPuuids, puuid]);
        }
    };

    const toggleAll = () => {
        if (selectedPuuids.length === availablePlayers.length) {
            setSelectedPuuids([]);
        } else {
            setSelectedPuuids(availablePlayers.map(p => p.puuid));
        }
    };

    const handleUpdate = async () => {
        if (selectedPuuids.length === 0) return;
        if (!adminPassword) {
            setLog(prev => [...prev, "❌ Senha de Admin necessária."]);
            return;
        }

        setStatus('PROCESSING');
        setProgress(0);
        setLog(['🚀 Iniciando atualização manual sequencial...']);

        let completed = 0;
        const total = selectedPuuids.length;

        for (const puuid of selectedPuuids) {
            const player = availablePlayers.find(p => p.puuid === puuid);
            const playerName = player ? `${player.gameName} #${player.tagLine}` : `Jogador (${puuid.substring(0, 8)})`;
            
            setLog(prev => [...prev, `⏳ Sincronizando ${playerName}...`]);

            try {
                const res = await fetch('/api/admin/manual-update', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'x-admin-password': adminPassword
                    },
                    body: JSON.stringify({
                        puuids: [puuid],
                        matchCount,
                        queue
                    })
                });

                const data = await res.json();

                if (!res.ok) {
                    throw new Error(data.error || 'Erro na requisição');
                }

                completed++;
                const percent = Math.round((completed / total) * 100);
                setProgress(percent);
                setLog(prev => [...prev, `✅ ${playerName} atualizado com sucesso!`]);

            } catch (error: any) {
                console.error(error);
                setLog(prev => [...prev, `❌ Erro ao atualizar ${playerName}: ${error.message}`]);
                completed++;
                const percent = Math.round((completed / total) * 100);
                setProgress(percent);
            }
        }

        setStatus('SUCCESS');
        setProgress(100);
        setLog(prev => [...prev, `✨ Sincronização concluída com sucesso! ${completed}/${total} processados.`]);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-300">
            {/* Modal Container */}
            <div className="bg-[#12141a] border border-white/10 rounded-3xl p-0 max-w-2xl w-full shadow-2xl flex flex-col max-h-[90vh] relative overflow-hidden">

                {/* Decoration */}
                <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-indigo-500/5 blur-[100px] rounded-full pointer-events-none" />

                {/* Header */}
                <div className="p-8 border-b border-white/5 relative z-10">
                    <div className="flex justify-between items-start">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center border border-emerald-500/20">
                                <RefreshCw className={`w-6 h-6 text-emerald-400 ${status === 'PROCESSING' ? 'animate-spin' : ''}`} />
                            </div>
                            <div>
                                <h3 className="text-2xl font-[family-name:var(--font-outfit)] font-bold text-white tracking-tight">Sincronização Manual</h3>
                                <p className="text-sm text-gray-400 mt-1">Force a atualização de dados em tempo real.</p>
                            </div>
                        </div>
                        <button onClick={handleClose} className="p-2 hover:bg-white/10 rounded-xl transition-colors text-gray-500 hover:text-white">
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Helper: Progress Bar */}
                {status === 'PROCESSING' && (
                    <div className="w-full h-1 bg-white/5 relative overflow-hidden">
                        <div
                            className="absolute inset-y-0 left-0 bg-gradient-to-r from-indigo-500 to-emerald-500 transition-all duration-300 ease-out"
                            style={{ width: `${progress}%` }}
                        />
                        {/* Stripe Animation */}
                        <div className="absolute inset-0 w-full h-full bg-[linear-gradient(45deg,rgba(255,255,255,0.1)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.1)_50%,rgba(255,255,255,0.1)_75%,transparent_75%,transparent)] bg-[length:1rem_1rem] animate-[progress-stripes_1s_linear_infinite]" />
                    </div>
                )}

                {/* Content Scrollable */}
                <div className="flex-1 overflow-y-auto p-8 space-y-8 relative z-10 custom-scrollbar">

                    {/* 1. Player Selection */}
                    <div className="space-y-4">
                        <div className="flex justify-between items-center px-1">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
                                <UsersIcon /> Selecionar Jogadores ({selectedPuuids.length})
                            </label>
                            <button
                                onClick={toggleAll}
                                className="text-xs text-indigo-400 hover:text-indigo-300 font-bold uppercase tracking-wider hover:underline"
                            >
                                {selectedPuuids.length === availablePlayers.length ? 'Desmarcar Todos' : 'Marcar Todos'}
                            </button>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            {availablePlayers.map(player => {
                                const isSelected = selectedPuuids.includes(player.puuid);
                                return (
                                    <button
                                        key={player.puuid}
                                        onClick={() => togglePlayer(player.puuid)}
                                        className={`group relative flex items-center gap-3 p-3 rounded-xl border transition-all duration-200 text-left ${isSelected
                                                ? 'bg-indigo-600/10 border-indigo-500/50 shadow-lg shadow-indigo-500/10'
                                                : 'bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/10'
                                            }`}
                                    >
                                        <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${isSelected ? 'bg-indigo-500 border-indigo-500' : 'border-gray-600 group-hover:border-gray-500'
                                            }`}>
                                            {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
                                        </div>
                                        <div className="min-w-0">
                                            <p className={`text-sm font-bold truncate ${isSelected ? 'text-white' : 'text-gray-300'}`}>
                                                {player.gameName}
                                            </p>
                                            <p className="text-[10px] text-gray-500 font-mono">#{player.tagLine}</p>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

                    {/* 2. Configuration */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Settings Column */}
                        <div className="space-y-6">
                            <div className="space-y-3">
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
                                    <Server className="w-3 h-3" /> Fila
                                </label>
                                <div className="grid grid-cols-3 gap-2">
                                    {(['BOTH', 'SOLO', 'FLEX'] as const).map(q => (
                                        <button
                                            key={q}
                                            onClick={() => setQueue(q)}
                                            className={`py-2.5 rounded-xl text-xs font-bold border transition-all ${queue === q
                                                    ? 'bg-white text-black border-white shadow-lg shadow-white/10'
                                                    : 'bg-black/20 border-white/10 text-gray-400 hover:bg-white/5 hover:text-white'
                                                }`}
                                        >
                                            {q === 'BOTH' ? 'AMBAS' : q}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-3">
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
                                    <Zap className="w-3 h-3" /> Profundidade
                                </label>
                                <div className="bg-black/20 border border-white/10 rounded-xl p-4">
                                    <div className="flex justify-between items-center mb-4">
                                        <span className="text-sm text-gray-300">Últimas Partidas</span>
                                        <span className="text-2xl font-[family-name:var(--font-outfit)] font-bold text-indigo-400">{matchCount}</span>
                                    </div>
                                    <input
                                        type="range" min="1" max="200"
                                        value={matchCount} onChange={(e) => setMatchCount(Number(e.target.value))}
                                        className="w-full h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-indigo-500 hover:accent-indigo-400 focus:outline-none"
                                    />
                                    <div className="flex justify-between mt-2 text-[10px] text-gray-600 font-mono">
                                        <span>Rápido (1)</span>
                                        <span>Extremo (200)</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Security Column */}
                        <div className="space-y-6">
                            <div className="space-y-3">
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Credenciais</label>
                                <input
                                    type="password"
                                    value={adminPassword}
                                    onChange={(e) => setAdminPassword(e.target.value)}
                                    placeholder="Senha de Administrador"
                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 transition-all placeholder:text-gray-700"
                                />
                            </div>

                            <div className="bg-amber-500/5 border border-amber-500/10 p-4 rounded-xl flex gap-3">
                                <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                                <div className="space-y-1">
                                    <h4 className="text-xs font-bold text-amber-500 uppercase">Rate Limit Check</h4>
                                    <p className="text-[11px] text-amber-200/60 leading-relaxed">
                                        O atualizador automático entrará em pausa (5min timeout).
                                        Evite rodar em muitos jogadores de uma vez.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Console/Logs */}
                    {(status !== 'IDLE' || log.length > 0) && (
                        <div ref={logRef} className="bg-black/60 rounded-xl p-4 font-mono text-xs h-32 overflow-y-auto border border-white/10 space-y-1.5 shadow-inner scroll-smooth">
                            {log.length === 0 && <span className="text-gray-700 italic">...</span>}
                            {log.map((line, i) => (
                                <div key={i} className={`pl-2 border-l-2 ${line.includes('Erro') || line.includes('❌') ? 'border-rose-500 text-rose-200' : 'border-indigo-500 text-indigo-100'}`}>
                                    {line}
                                </div>
                            ))}
                        </div>
                    )}

                </div>

                {/* Footer */}
                <div className="p-6 border-t border-white/5 bg-[#12141a]/50 backdrop-blur-sm flex justify-end gap-3 z-20">
                    <button
                        onClick={handleClose}
                        className="px-6 py-3 text-sm font-bold text-gray-400 hover:text-white transition-colors"
                        disabled={status === 'PROCESSING'}
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleUpdate}
                        disabled={status === 'PROCESSING' || selectedPuuids.length === 0}
                        className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-8 py-3 rounded-xl font-bold transition-all shadow-lg shadow-emerald-500/20 flex items-center gap-2 hover:scale-105 active:scale-95"
                    >
                        {status === 'PROCESSING' ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Processando ({(progress).toFixed(0)}%)
                            </>
                        ) : (
                            <>
                                <Play className="w-4 h-4 fill-current" />
                                Iniciar Sincronização
                            </>
                        )}
                    </button>
                </div>
            </div>

            <style jsx>{`
                @keyframes progress-stripes {
                    from { background-position: 1rem 0; }
                    to { background-position: 0 0; }
                }
            `}</style>
        </div>
    );
}

function UsersIcon() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
    )
}
