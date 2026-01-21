"use client";

import { motion } from "framer-motion";
import {
    ComposedChart,
    Bar,
    Line,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    CartesianGrid,
    Legend
} from "recharts";

interface DurationChartProps {
    duration: {
        short: { games: number; wins: number };
        medium: { games: number; wins: number };
        long: { games: number; wins: number };
        extra: { games: number; wins: number };
    };
}

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-zinc-900/90 border border-zinc-700 p-3 rounded-lg shadow-xl backdrop-blur-md">
                <p className="text-zinc-100 font-bold mb-1">{label}</p>
                <div className="text-xs space-y-1">
                    <p className="text-zinc-400">Jogos: <span className="text-white font-mono">{payload[0].value}</span></p>
                    <p className="text-emerald-400">Win Rate: <span className="font-mono">{payload[1].value}%</span></p>
                </div>
            </div>
        );
    }
    return null;
};

export function DurationChart({ duration }: DurationChartProps) {
    if (!duration) return null;

    const calcWr = (wins: number, games: number) => games > 0 ? Math.round((wins / games) * 100) : 0;

    const data = [
        { name: '< 25m', games: duration.short.games, wr: calcWr(duration.short.wins, duration.short.games) },
        { name: '25-30m', games: duration.medium.games, wr: calcWr(duration.medium.wins, duration.medium.games) },
        { name: '30-35m', games: duration.long.games, wr: calcWr(duration.long.wins, duration.long.games) },
        { name: '35m+', games: duration.extra.games, wr: calcWr(duration.extra.wins, duration.extra.games) }
    ];

    return (
        <div className="h-full w-full bg-black/20 rounded-2xl border border-white/5 p-6 relative overflow-hidden flex flex-col">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h4 className="text-sm font-bold text-white">Análise de Duração</h4>
                    <p className="text-[10px] text-zinc-500 uppercase">Early vs Late Game</p>
                </div>
            </div>

            <div className="flex-1 w-full min-h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={data}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                        <XAxis
                            dataKey="name"
                            tick={{ fontSize: 10, fill: '#71717a' }}
                            axisLine={false}
                            tickLine={false}
                            dy={10}
                        />
                        <YAxis
                            yAxisId="left"
                            orientation="left"
                            tick={{ fontSize: 10, fill: '#71717a' }}
                            axisLine={false}
                            tickLine={false}
                            label={{ value: 'Jogos', angle: -90, position: 'insideLeft', style: { fill: '#52525b', fontSize: 10 } }}
                        />
                        <YAxis
                            yAxisId="right"
                            orientation="right"
                            tick={{ fontSize: 10, fill: '#10b981' }}
                            axisLine={false}
                            tickLine={false}
                            domain={[0, 100]}
                            unit="%"
                        />
                        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
                        <Bar yAxisId="left" dataKey="games" barSize={30} fill="#3f3f46" radius={[4, 4, 0, 0]} />
                        <Line
                            yAxisId="right"
                            type="monotone"
                            dataKey="wr"
                            stroke="#10b981"
                            strokeWidth={3}
                            dot={{ r: 4, fill: '#10b981', strokeWidth: 2, stroke: '#000' }}
                            activeDot={{ r: 6 }}
                        />
                    </ComposedChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
