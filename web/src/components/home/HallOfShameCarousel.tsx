'use client';

import { motion } from 'framer-motion';
import { InsightPlayer } from '@/lib/api';
import { Card } from '@/components/ui/Card';
import { BadgeAlert, EyeOff, Gavel, HandMetal, ShieldAlert, TimerOff, Trash2 } from 'lucide-react';
import { PlayerAvatar } from '@/components/ui/PlayerAvatar';

interface HallOfShameCarouselProps {
    shameData: any; // Using any for flexibility with the HallOfShameData object structure
    loading?: boolean;
}

export function HallOfShameCarousel({ shameData, loading }: HallOfShameCarouselProps) {
    if (loading || !shameData) return null;

    // Manual mapping of shame graphics/titles based on the content
    const wantedList = [
        { key: 'alface', title: 'Mão de Alface', icon: HandMetal, desc: 'Menos Kills', data: shameData.alface },
        { key: 'sonecaBaron', title: 'Soneca no Baron', icon: TimerOff, desc: '0 Participação em Baron', data: shameData.sonecaBaron },
        { key: 'visionNegligente', title: 'Visão Negligente', icon: EyeOff, desc: 'Score de Visão Abismal', data: shameData.visionNegligente },
        { key: 'soloDoador', title: 'Solo Doador', icon: Trash2, desc: 'Mortes Solitárias', data: shameData.soloDoador },
        { key: 'telaPreta', title: 'Tela Preta', icon: BadgeAlert, desc: 'Campeão de Mortes', data: shameData.telaPreta },
    ].filter(item => item.data); // Only show existing data

    if (wantedList.length === 0) return null;

    return (
        <div className="w-full overflow-hidden pt-24 pb-10">
            <div className="flex items-center gap-4 mb-6 px-4 max-w-[1400px] mx-auto">
                <Gavel className="text-red-500 w-6 h-6" />
                <h2 className="text-2xl font-bold text-white">Mural de PROCURADOS</h2>
                <span className="text-xs font-mono text-red-400 bg-red-900/20 px-2 py-1 rounded border border-red-900/50">HALL OF SHAME</span>
            </div>

            <motion.div
                className="flex gap-6 px-4"
                drag="x"
                dragConstraints={{ right: 0, left: -1000 }} // Adjust based on content width
                whileTap={{ cursor: "grabbing" }}
            >
                {wantedList.map((item, idx) => (
                    <div key={idx} className="min-w-[280px] max-w-[280px]">
                        <div className="relative bg-[#e6dcc3] text-[#2c2c2c] p-1 rounded-sm shadow-xl transform rotate-1 hover:rotate-0 transition-transform duration-300">
                            {/* Pin */}
                            <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-red-800 shadow-md border-2 border-white/20 z-10" />

                            <div className="border-4 border-[#2c2c2c] p-4 flex flex-col items-center text-center h-full min-h-[350px]">
                                <h3 className="text-3xl font-black uppercase tracking-widest mb-1 font-serif">WANTED</h3>
                                <div className="w-full h-px bg-[#2c2c2c] mb-4" />

                                <div className="relative mb-4">
                                    <PlayerAvatar
                                        profileIconId={item.data.profileIconId}
                                        size="xl"
                                        className="rounded-none border-2 border-[#2c2c2c] grayscale sepia-[.5] brightness-90 contrast-125"
                                    />
                                    <div className="absolute -bottom-2 -right-2 bg-red-700 text-white text-[10px] font-bold px-2 py-0.5 transform -rotate-6 uppercase">
                                        {item.title}
                                    </div>
                                </div>

                                <h4 className="font-bold text-xl uppercase mb-1 line-clamp-1 w-full">{item.data.gameName}</h4>
                                <p className="text-xs font-mono font-bold text-[#5c5c5c] mb-4">#{item.data.tagLine}</p>

                                <div className="mt-auto w-full">
                                    <p className="text-sm font-bold uppercase mb-2">Crime Confirmado:</p>
                                    <p className="text-sm leading-tight italic font-serif opacity-80 mb-4 px-2">
                                        "{item.desc} com apenas <strong className="text-red-800">{item.data.value}</strong> no registro."
                                    </p>

                                    <div className="w-full bg-[#2c2c2c] text-[#e6dcc3] py-2 font-black text-lg tracking-widest uppercase">
                                        REWARD: $0
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </motion.div>
        </div>
    );
}
