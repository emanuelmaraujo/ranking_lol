'use client';

import { motion } from 'framer-motion';
import { PdlGainEntry } from '@/lib/api';
import { ArrowUp, ArrowDown, Minus } from 'lucide-react';
import Link from 'next/link';

interface TrendTickerProps {
    trends: PdlGainEntry[];
}

export function TrendTicker({ trends }: TrendTickerProps) {
    if (!trends || trends.length === 0) return null;

    // Duplicate list for seamless loop
    const displayTrends = [...trends, ...trends];

    return (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-[#0f0f0f] border-t border-white/5 h-10 flex items-center overflow-hidden">
            <div className="bg-emerald-600 px-4 h-full flex items-center justify-center z-20 shadow-xl">
                <span className="text-xs font-black uppercase tracking-widest text-white">Market Update</span>
            </div>

            <div className="relative flex-1 overflow-hidden h-full flex items-center">
                <motion.div
                    className="flex whitespace-nowrap gap-8 pl-4"
                    animate={{ x: [0, -100 * trends.length] }} // Approximate width calc
                    transition={{ repeat: Infinity, duration: Math.max(20, trends.length * 5), ease: "linear" }}
                >
                    {displayTrends.map((t, i) => (
                        <div key={`${t.puuid}-${i}`} className="flex items-center gap-2 group">
                            <span className="text-xs text-gray-400 font-bold group-hover:text-white transition-colors cursor-default">
                                {t.gameName}
                            </span>
                            <div className={`flex items-center text-xs font-mono font-bold ${t.pdlGain > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                {t.pdlGain > 0 ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
                                {Math.abs(t.pdlGain)} LP
                            </div>
                        </div>
                    ))}
                </motion.div>
            </div>
        </div>
    );
}
