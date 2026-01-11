'use client';

import { useState, useCallback, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { initPlayers } from '@/lib/api';
import { Sparkles, Plus, Trash2, Trophy, Loader2, CheckCircle2 } from 'lucide-react';

interface FirstRunModalProps {
    isOpen: boolean;
    onComplete: () => void;
}

// Memoized Player Row to prevent full-list re-renders on typing
const PlayerInputRow = memo(({
    player,
    index,
    isActive,
    isRemovable,
    onChange,
    onRemove,
    onFocus,
    onBlur
}: {
    player: { gameName: string; tagLine: string };
    index: number;
    isActive: boolean;
    isRemovable: boolean;
    onChange: (index: number, field: 'gameName' | 'tagLine', value: string) => void;
    onRemove: (index: number) => void;
    onFocus: (index: number) => void;
    onBlur: () => void;
}) => (
    <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.05, duration: 0.3 }} // Faster stagger
        className={`group relative flex items-center gap-3 rounded-xl border p-2 transition-all duration-200 ${isActive
                ? 'border-emerald-500/50 bg-white/[0.03] shadow-[0_0_20px_rgba(16,185,129,0.1)]'
                : 'border-white/5 bg-white/[0.02] hover:border-white/10'
            }`}
    >
        <div className="flex flex-1 gap-2">
            <div className="relative flex-1">
                <input
                    type="text"
                    value={player.gameName}
                    onFocus={() => onFocus(index)}
                    onBlur={onBlur}
                    onChange={(e) => onChange(index, 'gameName', e.target.value)}
                    placeholder="Nome de Invocador"
                    className="w-full rounded-lg bg-transparent px-4 py-3 text-sm font-medium text-white placeholder-zinc-600 outline-none transition-colors"
                />
            </div>
            <div className="relative w-24">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600 text-sm font-bold">#</span>
                <input
                    type="text"
                    value={player.tagLine}
                    onFocus={() => onFocus(index)}
                    onBlur={onBlur}
                    onChange={(e) => onChange(index, 'tagLine', e.target.value)}
                    placeholder="TAG"
                    className="w-full rounded-lg bg-transparent py-3 pl-7 pr-3 text-sm font-medium text-white placeholder-zinc-600 outline-none transition-colors"
                />
            </div>
        </div>

        {isRemovable && (
            <button
                onClick={() => onRemove(index)}
                className="mr-2 rounded-lg p-2 text-zinc-500 opacity-0 transition-opacity duration-200 hover:bg-red-500/10 hover:text-red-400 group-hover:opacity-100"
            >
                <Trash2 className="h-4 w-4" />
            </button>
        )}
    </motion.div>
));

PlayerInputRow.displayName = 'PlayerInputRow';

export function FirstRunModal({ isOpen, onComplete }: FirstRunModalProps) {
    const [players, setPlayers] = useState([{ gameName: '', tagLine: '' }]);
    const [status, setStatus] = useState<'IDLE' | 'SYNCING' | 'SUCCESS'>('IDLE');
    const [error, setError] = useState('');
    const [activeField, setActiveField] = useState<number | null>(null);

    const addField = () => {
        setPlayers([...players, { gameName: '', tagLine: '' }]);
    };

    const removeField = useCallback((index: number) => {
        setPlayers(prev => prev.filter((_, i) => i !== index));
    }, []);

    const handleChange = useCallback((index: number, field: 'gameName' | 'tagLine', value: string) => {
        setPlayers(prev => {
            const newPlayers = [...prev];
            newPlayers[index] = { ...newPlayers[index], [field]: value };
            return newPlayers;
        });
    }, []);

    const handleFocus = useCallback((index: number) => setActiveField(index), []);
    const handleBlur = useCallback(() => setActiveField(null), []);

    const handleSubmit = async () => {
        const validPlayers = players.filter(p => p.gameName.trim() && p.tagLine.trim());
        if (validPlayers.length === 0) {
            setError('Adicione pelo menos um jogador válido.');
            return;
        }

        setStatus('SYNCING');
        setError('');

        try {
            const res = await initPlayers(validPlayers);
            if (res.failed.length > 0) {
                setError(`Falha ao adicionar: ${res.failed.join(', ')}`);
                if (res.success.length > 0) {
                    setTimeout(() => setStatus('SUCCESS'), 2000);
                } else {
                    setStatus('IDLE');
                }
            } else {
                setStatus('SUCCESS');
            }
        } catch (err) {
            setError('Erro de conexão. Tente novamente.');
            setStatus('IDLE');
            console.error(err);
        }
    };

    if (status === 'SUCCESS') {
        setTimeout(onComplete, 2500);
    }

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    {/* Backdrop - Reduced Blur for Performance */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                    />

                    {/* Modal Container */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 10 }}
                        transition={{ type: "spring", stiffness: 300, damping: 25 }} // Snappier spring
                        className="relative w-full max-w-2xl overflow-hidden rounded-3xl border border-white/10 bg-[#0a0a0a] shadow-2xl"
                    >
                        {/* Static Glows (No blur filter on container to avoid double-hit) */}
                        <div className="absolute -top-32 -right-32 h-64 w-64 rounded-full bg-emerald-500/10 blur-[80px]" />
                        <div className="absolute -bottom-32 -left-32 h-64 w-64 rounded-full bg-blue-600/10 blur-[80px]" />

                        <div className="relative p-8 md:p-10">

                            {/* Header Section */}
                            <div className="mb-8 text-center">
                                <motion.div
                                    initial={{ scale: 0 }} animate={{ scale: 1 }}
                                    transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
                                    className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-tr from-emerald-500/20 to-blue-500/20 shadow-lg shadow-emerald-500/10 ring-1 ring-white/10"
                                >
                                    <Trophy className="h-10 w-10 text-emerald-400" />
                                </motion.div>
                                <motion.h2
                                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.4 }}
                                    className="text-3xl font-bold tracking-tight text-white"
                                >
                                    Configuração Inicial
                                </motion.h2>
                                <motion.p
                                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.4 }}
                                    className="mt-2 text-zinc-400"
                                >
                                    Adicione os invocadores que participarão do ranking.
                                </motion.p>
                            </div>

                            {/* Main Content Area */}
                            <div className="min-h-[300px]">
                                <AnimatePresence mode="wait">

                                    {/* IDLE STATE: Form Input */}
                                    {status === 'IDLE' && (
                                        <motion.div
                                            key="form"
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: 20 }}
                                            transition={{ duration: 0.3, ease: 'easeOut' }}
                                            className="space-y-6"
                                        >
                                            <div className="max-h-[40vh] space-y-3 overflow-y-auto pr-2 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-zinc-800">
                                                {players.map((player, index) => (
                                                    <PlayerInputRow
                                                        key={index}
                                                        index={index}
                                                        player={player}
                                                        isActive={activeField === index}
                                                        isRemovable={players.length > 1}
                                                        onChange={handleChange}
                                                        onRemove={removeField}
                                                        onFocus={handleFocus}
                                                        onBlur={handleBlur}
                                                    />
                                                ))}
                                            </div>

                                            <div className="flex items-center justify-between border-t border-white/5 pt-4">
                                                <button
                                                    onClick={addField}
                                                    className="group flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-zinc-400 transition-colors hover:bg-white/5 hover:text-white"
                                                >
                                                    <div className="flex h-5 w-5 items-center justify-center rounded-full border border-zinc-600 transition-colors group-hover:border-white">
                                                        <Plus className="h-3 w-3" />
                                                    </div>
                                                    Adicionar outro
                                                </button>

                                                {error && (
                                                    <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-xs font-medium text-red-400">
                                                        {error}
                                                    </motion.p>
                                                )}
                                            </div>

                                            <button
                                                onClick={handleSubmit}
                                                className="group relative w-full overflow-hidden rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 py-4 text-sm font-bold tracking-wide text-white shadow-lg transition-all hover:scale-[1.01] hover:shadow-emerald-500/20 active:scale-[0.99]"
                                            >
                                                <div className="absolute inset-0 bg-white/20 opacity-0 transition-opacity group-hover:opacity-100" />
                                                <span className="relative flex items-center justify-center gap-2">
                                                    COMEÇAR JORNADA
                                                    <Sparkles className="h-4 w-4 text-emerald-200" />
                                                </span>
                                            </button>
                                        </motion.div>
                                    )}

                                    {/* SYNCING STATE: Pulse Loader */}
                                    {status === 'SYNCING' && (
                                        <motion.div
                                            key="syncing"
                                            initial={{ opacity: 0, scale: 0.9 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 1.1 }}
                                            transition={{ duration: 0.4 }}
                                            className="flex h-full flex-col items-center justify-center py-10"
                                        >
                                            <div className="relative mb-8 h-24 w-24">
                                                <div className="absolute inset-0 animate-ping rounded-full bg-emerald-500/20" />
                                                <div className="absolute inset-2 animate-pulse rounded-full bg-emerald-500/30 blur-xl" />
                                                <div className="relative flex h-full w-full items-center justify-center rounded-full bg-black/40 shadow-inner ring-1 ring-emerald-500/30">
                                                    <Loader2 className="h-10 w-10 animate-spin text-emerald-400" />
                                                </div>
                                            </div>
                                            <h3 className="mb-2 text-xl font-bold text-white">Sincronizando Dados...</h3>
                                            <p className="text-center text-sm text-zinc-400">
                                                Buscando perfis, ícones, ranking e maestrias<br />diretamente da Riot Games.
                                            </p>
                                        </motion.div>
                                    )}

                                    {/* SUCCESS STATE: Celebration */}
                                    {status === 'SUCCESS' && (
                                        <motion.div
                                            key="success"
                                            initial={{ opacity: 0, scale: 0.8 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            transition={{ type: "spring", stiffness: 200, damping: 20 }}
                                            className="flex h-full flex-col items-center justify-center py-10"
                                        >
                                            <motion.div
                                                initial={{ scale: 0 }}
                                                animate={{ scale: 1 }}
                                                transition={{ type: "spring", bounce: 0.5 }}
                                                className="mb-8 flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-tr from-emerald-500 to-teal-500 shadow-2xl shadow-emerald-500/40"
                                            >
                                                <CheckCircle2 className="h-12 w-12 text-white" />
                                            </motion.div>
                                            <h3 className="mb-2 text-2xl font-bold text-white">Tudo Pronto!</h3>
                                            <p className="text-zinc-400">O sistema já está monitorando seus jogos.</p>
                                        </motion.div>
                                    )}

                                </AnimatePresence>
                            </div>
                        </div>

                        {/* Footer / Brand Details */}
                        <div className="border-t border-white/5 bg-white/[0.01] px-10 py-4 text-center">
                            <p className="text-[10px] font-medium uppercase tracking-widest text-zinc-600">
                                Powered by Ranking.lol &bull; Secure Sync
                            </p>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
