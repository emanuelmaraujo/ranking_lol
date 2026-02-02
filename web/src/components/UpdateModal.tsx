"use client";

import { useState } from "react";
import { X, Check, AlertTriangle, Loader2, Play } from "lucide-react";
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
    const [log, setLog] = useState<string[]>([]);

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
        setLog(['🚀 Iniciando atualização manual...', '⚠️ Scheduler será pausado durante a operação.']);

        try {
            const res = await fetch('http://localhost:3333/api/admin/manual-update', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-admin-password': adminPassword
                },
                body: JSON.stringify({
                    puuids: selectedPuuids,
                    matchCount,
                    queue
                })
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Erro na requisição');
            }

            setLog(prev => [
                ...prev,
                `✅ Sucesso!`,
                `Processados: ${data.summary.playersProcessed}/${selectedPuuids.length}`,
                `Partidas Salvas: ${data.summary.matchesSaved}`,
                `Erros: ${data.summary.errors}`
            ]);
            setStatus('SUCCESS');

        } catch (error: any) {
            console.error(error);
            setLog(prev => [...prev, `❌ Erro: ${error.message}`]);
            setStatus('ERROR');
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-[#1a1c23] border border-white/10 rounded-2xl p-6 max-w-2xl w-full shadow-2xl flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h3 className="text-xl font-[family-name:var(--font-outfit)] font-bold text-white flex items-center gap-2">
                            <Play className="w-5 h-5 text-indigo-400" /> Atualização Manual
                        </h3>
                        <p className="text-sm text-gray-400">Forçe a atualização de partidas recentes respeitando o Rate Limit.</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                        <X className="w-5 h-5 text-gray-400" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto space-y-6 pr-2">

                    {/* 1. Configuration Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Player Selection */}
                        <div className="space-y-3">
                            <div className="flex justify-between items-center">
                                <label className="text-xs font-bold text-gray-500 uppercase">Jogadores ({selectedPuuids.length})</label>
                                <button onClick={toggleAll} className="text-xs text-indigo-400 hover:text-indigo-300 font-bold">
                                    {selectedPuuids.length === availablePlayers.length ? 'Desmarcar Todos' : 'Marcar Todos'}
                                </button>
                            </div>
                            <div className="h-48 overflow-y-auto bg-black/40 border border-white/10 rounded-xl p-2 space-y-1">
                                {availablePlayers.map(player => (
                                    <div
                                        key={player.puuid}
                                        onClick={() => togglePlayer(player.puuid)}
                                        className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors ${selectedPuuids.includes(player.puuid) ? 'bg-indigo-500/20 border border-indigo-500/30' : 'hover:bg-white/5 border border-transparent'}`}
                                    >
                                        <div className={`w-4 h-4 rounded border flex items-center justify-center ${selectedPuuids.includes(player.puuid) ? 'bg-indigo-500 border-indigo-500' : 'border-gray-600'}`}>
                                            {selectedPuuids.includes(player.puuid) && <Check className="w-3 h-3 text-white" />}
                                        </div>
                                        <span className="text-sm text-white truncate">{player.gameName}</span>
                                        <span className="text-xs text-gray-500">#{player.tagLine}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Settings */}
                        <div className="space-y-6">
                            {/* Match Count */}
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-500 uppercase">Limite de Partidas (1-300)</label>
                                <div className="flex items-center gap-4">
                                    <input
                                        type="range" min="1" max="300"
                                        value={matchCount} onChange={(e) => setMatchCount(Number(e.target.value))}
                                        className="flex-1 accent-indigo-500 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                                    />
                                    <span className="text-xl font-bold text-white min-w-[2ch]">{matchCount}</span>
                                </div>
                                <p className="text-[10px] text-gray-500">Mais partidas = Maior tempo de pausa no servidor.</p>
                            </div>

                            {/* Queue */}
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-500 uppercase">Fila</label>
                                <div className="flex gap-2">
                                    {(['BOTH', 'SOLO', 'FLEX'] as const).map(q => (
                                        <button
                                            key={q}
                                            onClick={() => setQueue(q)}
                                            className={`flex-1 py-2 rounded-lg text-xs font-bold border transition-all ${queue === q ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-black/20 border-white/10 text-gray-400 hover:bg-white/5'}`}
                                        >
                                            {q === 'BOTH' ? 'Ambas' : q}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Password */}
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-500 uppercase">Senha de Admin</label>
                                <input
                                    type="password"
                                    value={adminPassword}
                                    onChange={(e) => setAdminPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white outline-none focus:border-indigo-500"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Warning */}
                    <div className="bg-yellow-500/10 border border-yellow-500/20 p-3 rounded-xl flex gap-3">
                        <AlertTriangle className="w-5 h-5 text-yellow-500 flex-shrink-0" />
                        <div className="space-y-1">
                            <h4 className="text-xs font-bold text-yellow-500 uppercase">Atenção ao Rate Limit</h4>
                            <p className="text-xs text-yellow-200/80 leading-relaxed">
                                Esta ação irá <strong>pausar o atualizador automático</strong> para garantir estabilidade.
                                O sistema voltará ao normal automaticamente após a conclusão.
                                Evite execuções simultâneas.
                            </p>
                        </div>
                    </div>

                    {/* Terminal/Log */}
                    <div className="bg-black rounded-xl p-4 font-mono text-xs h-32 overflow-y-auto border border-white/10 space-y-1 shadow-inner">
                        {log.length === 0 && <span className="text-gray-600 italic">Logs aparecerão aqui...</span>}
                        {log.map((line, i) => (
                            <div key={i} className="text-gray-300 border-l-2 border-indigo-500 pl-2">{line}</div>
                        ))}
                    </div>

                </div>

                {/* Footer */}
                <div className="mt-6 pt-4 border-t border-white/10 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-bold text-gray-400 hover:text-white transition-colors"
                        disabled={status === 'PROCESSING'}
                    >
                        Fechar
                    </button>
                    <button
                        onClick={handleUpdate}
                        disabled={status === 'PROCESSING' || selectedPuuids.length === 0}
                        className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-2 rounded-xl font-bold transition-all shadow-lg shadow-indigo-500/20 flex items-center gap-2"
                    >
                        {status === 'PROCESSING' && <Loader2 className="w-4 h-4 animate-spin" />}
                        {status === 'PROCESSING' ? 'Processando...' : 'Iniciar Atualização'}
                    </button>
                </div>
            </div>
        </div>
    );
}
