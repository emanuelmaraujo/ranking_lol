'use client';

import { motion } from 'framer-motion';
import { Skull, Crosshair, Target, Shield, Zap, Flame, Swords, Trophy, Crown, Timer, Star, Award, TrendingUp, User } from 'lucide-react';
import { useEffect, useState } from 'react';
import { getCommunityFeats, UniqueFeat } from '@/lib/api';
import { normalizeChampionName } from '@/lib/utils';
import { CHAMPION_SPLASH_BASE } from '@/lib/constants';
import { InsightCard } from '@/components/InsightCard';
import { PlayerAvatar } from '@/components/ui/PlayerAvatar';
import { Card } from '@/components/ui/Card';

/* 
  FeatsView (Refined - Hall of Fame)
  Displays:
  - Unique Feats (Pentas, Quadras, Perfect Games) -> Hero Section
  - Hall of Fame Cards -> Grid
*/

export function FeatsView({ period, queue }: { period: any, queue: any }) {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchFeats = async () => {
            setLoading(true);
            try {
                const res = await getCommunityFeats(period, queue);
                setData(res);
            } catch (error) {
                console.error("Failed to fetch feats", error);
            } finally {
                setLoading(false);
            }
        };
        fetchFeats();
    }, [period, queue]);

    if (loading) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <div className="animate-pulse flex flex-col items-center gap-4">
                    <Trophy className="w-12 h-12 text-yellow-500/50" />
                    <div className="text-yellow-500 font-bold tracking-widest text-sm uppercase">Buscando Lendas...</div>
                </div>
            </div>
        );
    }

    if (!data) return null;

    const uniqueFeats: UniqueFeat[] = (data.uniqueFeats || []).sort((a: any, b: any) => {
        const priority: any = { PENTA: 6, QUADRA: 5, PERFECT: 4, WIN_STREAK: 3, STOMP: 2, COMEBACK: 1 };
        const pA = priority[a.type] || 0;
        const pB = priority[b.type] || 0;
        if (pA !== pB) return pB - pA;
        return new Date(b.date).getTime() - new Date(a.date).getTime();
    });

    return (
        <div className="w-full max-w-[1500px] mx-auto space-y-16 animate-in fade-in duration-700 pb-12">

            {/* 1. HERO: FEITOS ÉPICOS (Unique) */}
            <div>
                <div className="flex items-center gap-3 mb-8 px-2">
                    <div className="p-2 bg-gradient-to-br from-yellow-500/20 to-orange-600/20 rounded-xl border border-yellow-500/30 shadow-lg shadow-yellow-900/20">
                        <Crown className="w-8 h-8 text-yellow-500" />
                    </div>
                    <div>
                        <h2 className="text-3xl font-[family-name:var(--font-outfit)] font-black text-white italic uppercase tracking-wider drop-shadow-lg">
                            Feitos Épicos <span className="text-zinc-600 text-lg not-italic ml-2">#{uniqueFeats.length}</span>
                        </h2>
                        <p className="text-base text-zinc-400 font-medium">Os momentos que entraram para a história</p>
                    </div>
                </div>

                {uniqueFeats.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {uniqueFeats.map((feat, idx) => {
                            // Monthly Highlight: Top 2 get special treatment (2 col span if possible, or just bigger height/style)
                            // For grid consistency, let's keep sizing uniform but Visuals distinct.
                            // User asked to "give highlight". Let's make them span 2 columns if on desktop?
                            // Actually, let's make the first two larger cards.
                            const isHighlight = period === 'MONTHLY' && idx < 2;
                            return (
                                <div key={idx} className={isHighlight ? "md:col-span-2" : "col-span-1"}>
                                    <UniqueFeatCard feat={feat} index={idx} isHighlight={isHighlight} />
                                </div>
                            )
                        })}
                    </div>
                ) : (
                    <div className="w-full h-48 rounded-3xl border-2 border-dashed border-zinc-800 bg-zinc-900/30 flex flex-col items-center justify-center text-zinc-600 group hover:border-zinc-700 transition-colors">
                        <Trophy className="w-12 h-12 mb-4 opacity-20 group-hover:scale-110 transition-transform duration-500" />
                        <p className="font-bold uppercase tracking-widest text-sm">Nenhum feito lendário (ainda)</p>
                        <p className="text-xs mt-1 opacity-60">Seja o primeiro a brilhar!</p>
                    </div>
                )}
            </div>

            {/* 2. HALL DA FAMA (Metrics) */}
            <div className="relative">
                {/* Decorative BG */}
                <div className="absolute -top-20 -left-20 w-96 h-96 bg-blue-600/10 rounded-full blur-[100px] pointer-events-none" />

                <div className="flex items-center gap-3 mb-8 px-2 relative z-10">
                    <div className="p-2 bg-gradient-to-br from-blue-500/20 to-cyan-600/20 rounded-xl border border-blue-500/30 shadow-lg shadow-blue-900/20">
                        <Star className="w-8 h-8 text-blue-400" />
                    </div>
                    <div>
                        <h2 className="text-3xl font-[family-name:var(--font-outfit)] font-black text-white italic uppercase tracking-wider drop-shadow-lg">
                            Hall da Fama
                        </h2>
                        <p className="text-base text-zinc-400 font-medium">Os protagonistas da temporada</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 relative z-10">
                    {/* Combat */}
                    {data.pentakilleiro && <InsightCard title="Pentakilleiro" badge="Mãos de Tesoura" icon={Swords} player={data.pentakilleiro} twColor="red" value={data.pentakilleiro.value} unit="Pentas" delay={0.1} />}
                    {data.espanco && <InsightCard title="Espanco" badge="KDA Player" icon={Skull} player={data.espanco} twColor="orange" value={data.espanco.value} delay={0.15} />}
                    {data.x1Raiz && <InsightCard title="Rei do X1" badge="Duelista Nato" icon={Swords} player={data.x1Raiz} twColor="red" value={data.x1Raiz.value} unit="Solos" delay={0.2} />}
                    {data.sniper && <InsightCard title="Sniper" badge="Eficiência de Dano" icon={Crosshair} player={data.sniper} twColor="amber" value={data.sniper.value} delay={0.25} />}

                    {/* Objective & Macro */}
                    {data.demolidor && <InsightCard title="O Demolidor" badge="Destruidor de Torres" icon={Crown} player={data.demolidor} twColor="amber" value={data.demolidor.value} delay={0.3} subtext={data.demolidor.detail} />}
                    {data.senhorDosDragoes && <InsightCard title="Senhor dos Dragões" badge="Controle de Objetivos" icon={Target} player={data.senhorDosDragoes} twColor="indigo" value={data.senhorDosDragoes.value} delay={0.35} />}
                    {data.ministroEconomia && <InsightCard title="Ministro da Economia" badge="Farm Machine" icon={TrendingUp} player={data.ministroEconomia} twColor="green" value={data.ministroEconomia.value} unit="CS/min" delay={0.4} />}
                    {data.gigaChad && <InsightCard title="Giga Chad" badge="Macro Gaming" icon={Trophy} player={data.gigaChad} twColor="cyan" value={data.gigaChad.value} delay={0.45} subtext={data.gigaChad.detail} />}

                    {/* Role Specific */}
                    {data.reiDaSelva && <InsightCard title="Rei da Selva" badge="Dono do Mato" icon={Target} player={data.reiDaSelva} twColor="green" value={data.reiDaSelva.value} unit="Campos" delay={0.5} />}
                    {data.anjoDaGuarda && <InsightCard title="Anjo da Guarda" badge="Suporte de Elite" icon={Shield} player={data.anjoDaGuarda} twColor="blue" value={data.anjoDaGuarda.value} unit="Saves" delay={0.55} subtext={data.anjoDaGuarda.detail} />}

                    {/* Game Flow */}
                    {data.donodoEarly && <InsightCard title="Dono do Early" badge="Snowballer" icon={Timer} player={data.donodoEarly} twColor="amber" value={data.donodoEarly.value} unit="Ouro @15" delay={0.6} />}
                    {data.escalada && <InsightCard title="A Escalada" badge="Late Game Demon" icon={TrendingUp} player={data.escalada} twColor="purple" value={data.escalada.value} delay={0.65} />}
                    {data.robo && <InsightCard title="O Robô" badge="Consistência" icon={User} player={data.robo} twColor="zinc" value={data.robo.value} delay={0.7} />}
                </div>
            </div>
        </div>
    );
}

function UniqueFeatCard({ feat, index, isHighlight = false }: { feat: UniqueFeat, index: number, isHighlight?: boolean }) {
    const splash = feat.championName ? `${CHAMPION_SPLASH_BASE}/${normalizeChampionName(feat.championName)}_${feat.skinId || 0}.jpg` : null;

    const colors: any = {
        PENTA: 'from-amber-600 via-yellow-700 to-yellow-900 border-yellow-400 text-yellow-200',
        QUADRA: 'from-red-700 via-red-800 to-red-950 border-red-500 text-red-200',
        PERFECT: 'from-purple-600 via-purple-800 to-purple-950 border-purple-400 text-purple-200',
        WIN_STREAK: 'from-blue-600 via-blue-800 to-blue-950 border-blue-400 text-blue-200',
        STOMP: 'from-emerald-600 via-emerald-800 to-emerald-950 border-emerald-400 text-emerald-200',
        COMEBACK: 'from-cyan-600 via-cyan-800 to-cyan-950 border-cyan-400 text-cyan-200',
    };

    const theme = colors[feat.type] || 'from-zinc-700 to-zinc-900 border-zinc-500 text-zinc-200';
    const borderColor = theme.split(' ').find((c: string) => c.startsWith('border-')) || 'border-zinc-500';

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`relative rounded-[2rem] overflow-hidden group border transition-all duration-500 hover:shadow-2xl ${isHighlight ? 'h-[400px] shadow-2xl shadow-black/50 z-10' : 'h-[320px] shadow-lg opacity-90 hover:opacity-100 hover:z-10'
                } ${borderColor}`}
        >
            {/* Dynamic Glow for Highlight */}
            {isHighlight && (
                <div className="absolute -inset-1 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 blur-xl transition-opacity duration-700 pointer-events-none" />
            )}

            {/* Default Fallback Background (Abstract Pattern) */}
            <div className="absolute inset-0 bg-zinc-900">
                <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at center, #ffffff 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
                <div className="absolute inset-0 bg-gradient-to-br from-black/50 to-transparent" />
            </div>

            {/* Champion Splash */}
            {splash && (
                <div
                    className="absolute inset-0 bg-cover bg-center transition-transform duration-[20s] ease-in-out group-hover:scale-110"
                    style={{ backgroundImage: `url(${splash})` }}
                />
            )}

            {/* Gradient Overlay */}
            <div className={`absolute inset-0 bg-gradient-to-t ${theme.split(' ').slice(0, 3).join(' ')} opacity-80 mix-blend-multiply`} />
            <div className={`absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/90`} />

            {/* Animated Shine Effect */}
            <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/5 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />

            <div className="absolute inset-0 p-8 flex flex-col justify-between z-10">
                {/* Header */}
                <div className="flex justify-between items-start">
                    <div className={`
                        px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] 
                        bg-black/40 backdrop-blur-md border border-white/10 shadow-lg text-white/90
                        group-hover:bg-white/10 transition-colors
                    `}>
                        {feat.type.replace('_', ' ')}
                    </div>

                    {isHighlight && (
                        <div className="bg-yellow-500 text-black font-black text-[10px] px-2 py-0.5 rounded uppercase tracking-wider shadow-lg animate-pulse">
                            Destaque
                        </div>
                    )}
                </div>

                {/* Footer Content */}
                <div className="translate-y-2 group-hover:translate-y-0 transition-transform duration-500">
                    {/* Player Info */}
                    <div className="flex items-center gap-4 mb-4">
                        <div className={`relative p-0.5 rounded-full bg-gradient-to-tr from-white/50 to-transparent ${isHighlight ? 'w-14 h-14' : 'w-10 h-10'}`}>
                            <img
                                src={`https://ddragon.leagueoflegends.com/cdn/16.1.1/img/profileicon/${feat.profileIconId}.png`}
                                className="w-full h-full rounded-full border-2 border-black shadow-lg"
                            />
                            {/* Rank Badge Placeholder - Could be added later */}
                        </div>
                        <div>
                            <div className={`font-[family-name:var(--font-outfit)] font-black text-white leading-none shadow-black drop-shadow-md ${isHighlight ? 'text-2xl' : 'text-lg'}`}>
                                {feat.gameName}
                            </div>
                            <div className="text-xs text-white/60 font-medium tracking-wide mt-0.5 uppercase">{feat.championName}</div>
                        </div>
                    </div>

                    {/* Main Stat */}
                    <div className="space-y-1">
                        <h3 className={`font-[family-name:var(--font-outfit)] font-black italic uppercase tracking-tighter text-white leading-[0.85] drop-shadow-xl ${isHighlight ? 'text-5xl' : 'text-3xl'}`}>
                            {feat.label}
                        </h3>

                        <div className="flex items-center gap-3">
                            <span className={`font-bold ${theme.split(' ').pop()} ${isHighlight ? 'text-xl' : 'text-lg'}`}>
                                {feat.type === 'PENTA' ? 'ACE!' :
                                    feat.type === 'WIN_STREAK' ? `${feat.value} Vitórias` :
                                        feat.value}
                            </span>
                            {feat.detail && (
                                <span className="text-[10px] font-bold text-white/40 border border-white/10 px-2 py-0.5 rounded flex items-center gap-1">
                                    {feat.detail}
                                </span>
                            )}
                        </div>
                        <div className="text-[10px] font-mono text-white/30 mt-3 pt-3 border-t border-white/10">
                            {new Date(feat.date).toLocaleDateString()} • {new Date(feat.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    )
}
