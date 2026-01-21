"use client";

import { motion } from "framer-motion";
import {
    Radar,
    RadarChart,
    PolarGrid,
    PolarAngleAxis,
    PolarRadiusAxis,
    ResponsiveContainer,
    Tooltip
} from "recharts";

interface PlaystyleProps {
    playstyle: {
        combat: number;
        objectives: number;
        vision: number;
        farm: number;
        survivability: number;
        discipline?: number; // Legacy support if needed
    };
}

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-zinc-900/90 border border-zinc-700 p-3 rounded-lg shadow-xl backdrop-blur-md">
                <p className="text-zinc-100 font-bold mb-1">{label}</p>
                <p className="text-violet-400 font-semibold">
                    Score: {payload[0].value}
                </p>
            </div>
        );
    }
    return null;
};

export function PlaystyleRadar({ playstyle }: PlaystyleProps) {
    // Transform data for Recharts
    // Order matters for the shape logic: Combat (Start), Obj, Vision, Farm, Surv
    const data = [
        { subject: "Combate", A: playstyle.combat, fullMark: 100 },
        { subject: "Objetivos", A: playstyle.objectives, fullMark: 100 },
        { subject: "Visão", A: playstyle.vision, fullMark: 100 },
        { subject: "Farm", A: playstyle.farm, fullMark: 100 },
        { subject: "Sobrevivência", A: playstyle.survivability, fullMark: 100 },
    ];

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="w-full h-full flex flex-col items-center justify-center relative"
        >
            <div className="absolute inset-0 bg-gradient-to-b from-zinc-800/20 to-transparent rounded-2xl pointer-events-none" />

            {/* Container for the Chart */}
            <div className="w-full h-[300px] relative z-10">
                <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
                        <defs>
                            <linearGradient id="radarFill" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.6} />
                                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.1} />
                            </linearGradient>
                        </defs>

                        <PolarGrid stroke="#3f3f46" strokeDasharray="4 4" />

                        <PolarAngleAxis
                            dataKey="subject"
                            tick={{ fill: "#a1a1aa", fontSize: 12, fontWeight: 600 }}
                        />

                        <PolarRadiusAxis
                            angle={30}
                            domain={[0, 100]}
                            tick={false}
                            axisLine={false}
                        />

                        <Radar
                            name="Playstyle"
                            dataKey="A"
                            stroke="#8b5cf6"
                            strokeWidth={3}
                            fill="url(#radarFill)"
                            fillOpacity={0.6}
                        />

                        <Tooltip content={<CustomTooltip />} cursor={false} />
                    </RadarChart>
                </ResponsiveContainer>
            </div>

            {/* Title / Description */}
            <div className="text-center mt-[-10px] z-20">
                <h3 className="text-zinc-400 text-sm uppercase tracking-wider font-medium">Estilo de Jogo</h3>
                <p className="text-xs text-zinc-500 mt-1">Baseado na performance média</p>
            </div>

        </motion.div>
    );
}
