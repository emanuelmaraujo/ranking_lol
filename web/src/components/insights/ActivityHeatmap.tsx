"use client";

import { motion } from "framer-motion";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    AreaChart,
    Area,
    CartesianGrid
} from "recharts";

interface ActivityHeatmapProps {
    activity: {
        hour: Record<number, { games: number; wins: number }>;
        day: Record<number, { games: number; wins: number }>;
    };
}

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-zinc-900/90 border border-zinc-700 p-3 rounded-lg shadow-xl backdrop-blur-md">
                <p className="text-zinc-100 font-bold mb-1">{label}</p>
                <div className="text-xs space-y-1">
                    <p className="text-zinc-400">Jogos: <span className="text-white font-mono">{payload[0].value}</span></p>
                    {payload[1] && (
                        <p className="text-emerald-400">Vitórias: <span className="font-mono">{payload[1].value}</span></p>
                    )}
                </div>
            </div>
        );
    }
    return null;
};

const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

export function ActivityHeatmap({ activity }: ActivityHeatmapProps) {
    if (!activity) return null;

    // Transform Data for Charts
    const hourData = Array.from({ length: 24 }, (_, i) => ({
        hour: `${i}h`,
        games: activity.hour[i]?.games || 0,
        wins: activity.hour[i]?.wins || 0
    }));

    const dayData = Array.from({ length: 7 }, (_, i) => ({
        day: WEEKDAYS[i],
        games: activity.day[i]?.games || 0,
        wins: activity.day[i]?.wins || 0
    }));

    // Calculate "Clock Biological" (Peak Hour)
    const peakHour = hourData.reduce((max, curr) => curr.games > max.games ? curr : max, hourData[0]);

    return (
        <div className="flex flex-col gap-6 h-full">
            {/* Hour Chart (Golden Hour) */}
            <div className="flex-1 bg-black/20 rounded-2xl border border-white/5 p-4 relative overflow-hidden">
                <div className="flex justify-between items-center mb-4">
                    <div>
                        <h4 className="text-sm font-bold text-white">Relógio Biológico</h4>
                        <p className="text-[10px] text-zinc-500 uppercase">Atividade por Horário</p>
                    </div>
                    <div className="px-2 py-1 bg-white/5 rounded text-[10px] text-zinc-400 border border-white/5">
                        Pico: <span className="text-indigo-300 font-bold">{peakHour.hour}</span>
                    </div>
                </div>

                <div className="h-[120px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={hourData}>
                            <defs>
                                <linearGradient id="colorGames" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8} />
                                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
                            <Area
                                type="monotone"
                                dataKey="games"
                                stroke="#8b5cf6"
                                fillOpacity={1}
                                fill="url(#colorGames)"
                                strokeWidth={2}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>

                {/* Custom X Axis Labels manually positioned or simplified */}
                <div className="flex justify-between px-2 text-[9px] text-zinc-600 font-mono mt-1">
                    <span>00h</span>
                    <span>06h</span>
                    <span>12h</span>
                    <span>18h</span>
                    <span>23h</span>
                </div>
            </div>

            {/* Day Chart */}
            <div className="flex-1 bg-black/20 rounded-2xl border border-white/5 p-4 relative overflow-hidden">
                <div className="mb-4">
                    <h4 className="text-sm font-bold text-white">Rotina Semanal</h4>
                    <p className="text-[10px] text-zinc-500 uppercase">Jogos por Dia</p>
                </div>

                <div className="h-[120px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={dayData} barSize={20}>
                            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
                            <XAxis
                                dataKey="day"
                                tick={{ fontSize: 10, fill: '#71717a' }}
                                axisLine={false}
                                tickLine={false}
                                interval={0}
                            />
                            <Bar dataKey="games" fill="#6366f1" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="wins" fill="#10b981" radius={[4, 4, 0, 0]} stackId="a" hide /> {/* Wins hidden or stacked? Let's hide wins for simplicity or stack? Let's just show Activity (Games) for now or stacked wins/losses? */}
                            {/* Actually showing just Games is cleaner activity map. If we want WR, we'd need dual axis or stacked. */}
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
}
