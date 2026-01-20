"use client";

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import { PlayerHistoryEntry } from "@/lib/api";
import { TierTheme } from "@/lib/tier-themes";

// Tier Base Values
const TIER_VALUES: Record<string, number> = {
    IRON: 0,
    BRONZE: 400,
    SILVER: 800,
    GOLD: 1200,
    PLATINUM: 1600,
    EMERALD: 2000,
    DIAMOND: 2400,
    MASTER: 2800,
    GRANDMASTER: 2800,
    CHALLENGER: 2800,
    UNRANKED: 0
};

const TIER_LABELS = {
    0: "Ferro",
    400: "Bronze",
    800: "Prata",
    1200: "Ouro",
    1600: "Platina",
    2000: "Esmeralda",
    2400: "Diamante",
    2800: "Mestre+"
};

const RANK_VALUES: Record<string, number> = {
    'IV': 0,
    'III': 100,
    'II': 200,
    'I': 300,
    '': 0
};

export function PdlChart({ history, theme }: { history: PlayerHistoryEntry[], theme: TierTheme }) {
    if (!history || history.length === 0) return (
        <div className={`flex items-center justify-center h-full text-zinc-500 text-sm`}>
            Sem dados de histórico suficientes.
        </div>
    );

    // Filter duplicates by day (take last entry of each day)
    const uniqueDays = new Map();
    history.forEach(h => {
        const d = new Date(h.date).toLocaleDateString();
        uniqueDays.set(d, h);
    });

    // Convert back to array and sort
    const sortedHistory = Array.from(uniqueDays.values())
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    const data = sortedHistory.map(h => {
        const tierBase = TIER_VALUES[h.tier] || 0;
        // If Master+, rank is irrelevant for value, just LP adds to base.
        // But for consistency below Master, we add Rank.
        let val = tierBase;
        if (tierBase < 2800) {
            val += (RANK_VALUES[h.rank] || 0);
        }
        val += h.lp;

        return {
            date: new Date(h.date).toLocaleDateString(undefined, { day: '2-digit', month: '2-digit' }),
            value: val,
            tier: h.tier,
            rank: h.rank,
            lp: h.lp,
            fullDate: new Date(h.date).toLocaleDateString()
        };
    });

    // Calculate domain padding
    const minValue = Math.min(...data.map(d => d.value));
    const maxValue = Math.max(...data.map(d => d.value));
    // Round to nearest tier boundary
    const minDomain = Math.floor(minValue / 400) * 400;
    const maxDomain = Math.ceil(maxValue / 400) * 400 + 100;

    const chartColor = theme.colors.hex || '#10b981'; // Fallback to emerald if missing (shouldn't happen)

    return (
        <div className="w-full h-full min-h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <defs>
                        <linearGradient id={`colorValue-${theme.id}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={chartColor} stopOpacity={0.3} />
                            <stop offset="95%" stopColor={chartColor} stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                    <XAxis
                        dataKey="date"
                        stroke="#52525b"
                        tick={{ fill: '#71717a', fontSize: 10 }}
                        tickLine={false}
                        axisLine={false}
                        dy={10}
                        minTickGap={30} // Prevent overcrowding
                    />
                    <YAxis
                        stroke="#52525b"
                        tick={{ fill: '#71717a', fontSize: 10, fontWeight: 'bold' }}
                        tickLine={false}
                        axisLine={false}
                        domain={[minDomain, maxDomain]}
                        ticks={[0, 400, 800, 1200, 1600, 2000, 2400, 2800]}
                        tickFormatter={(value) => {
                            if (value >= 2800) return "MST";
                            if (value >= 2400) return "DIA";
                            if (value >= 2000) return "EME";
                            if (value >= 1600) return "PLA";
                            if (value >= 1200) return "OUR";
                            if (value >= 800) return "PRA";
                            if (value >= 400) return "BRO";
                            return "FER";
                        }}
                    />
                    <Tooltip
                        contentStyle={{
                            backgroundColor: "#18181b",
                            borderColor: "rgba(255,255,255,0.1)",
                            borderRadius: "8px",
                            boxShadow: "0 4px 20px rgba(0,0,0,0.5)",
                            color: "#E5E7EB",
                            padding: "8px 12px"
                        }}
                        itemStyle={{ color: "#E5E7EB", fontSize: "12px" }}
                        formatter={(value: any, name: any, props: any) => [
                            <span key="val" className="font-bold flex items-center gap-2">
                                <span style={{ color: chartColor }}>
                                    {props.payload.tier} {props.payload.rank}
                                </span>
                                <span className="text-gray-400">|</span>
                                <span className="text-white">{props.payload.lp} PDL</span>
                            </span>,
                            '' // Hide label
                        ]}
                        labelFormatter={(label) => <span className="text-gray-500 text-[10px] mb-1 block uppercase tracking-wide">{label}</span>}
                        cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 1 }}
                    />
                    <Area
                        type="monotone"
                        dataKey="value"
                        stroke={chartColor}
                        strokeWidth={2}
                        fillOpacity={1}
                        fill={`url(#colorValue-${theme.id})`}
                        activeDot={{ r: 4, fill: '#fff', stroke: chartColor, strokeWidth: 2 }}
                        animationDuration={1000}
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
}
