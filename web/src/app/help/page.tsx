"use client";

import { Trophy, Swords, Target, AlertCircle, Info, ShieldAlert, Scale, Map, Crosshair, Crown, HelpCircle, CheckCircle2, XCircle } from "lucide-react";
import { clsx } from 'clsx';
import { motion } from "framer-motion";

export default function HelpPage() {
    return (
        <div className="max-w-5xl mx-auto pb-20 space-y-20 animate-in fade-in duration-700">
            {/* Hero Section */}
            <div className="text-center space-y-6 pt-10">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-[family-name:var(--font-outfit)] font-bold uppercase tracking-widest">
                    <Info className="w-4 h-4" />
                    Central de Conhecimento
                </div>
                <h1 className="text-5xl md:text-7xl font-[family-name:var(--font-outfit)] font-black text-white tracking-tighter">
                    Entenda o <br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-500">RiftScore</span>
                </h1>
                <p className="text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed">
                    Mais que KDA. Uma métrica de 0 a 100 que avalia seu impacto real no jogo, comparado diretamente com seu oponente.
                </p>
            </div>

            {/* O Coração: 60-30-10 */}
            <section className="relative overflow-hidden rounded-3xl border border-white/5 bg-gradient-to-br from-white/5 to-black p-8 md:p-12">
                <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2" />

                <div className="relative z-10 space-y-12">
                    <div className="text-center space-y-4">
                        <h2 className="text-3xl font-[family-name:var(--font-outfit)] font-bold text-white flex items-center justify-center gap-2">
                            <Scale className="w-8 h-8 text-emerald-500" />
                            O Coração do Sistema
                        </h2>
                        <p className="text-gray-400 max-w-2xl mx-auto">
                            Sua nota é a soma de três pilares imutáveis. Para gabaritar (100 pts), você precisa dominar todas as áreas.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-6">
                        <PillarCard
                            title="60%"
                            subtitle="Performance (Lane)"
                            desc="O duelo mecânico. CS, Dano, Visão. Se você for 30% melhor que o oponente (Ratio 1.3), ganha nota máxima. Se for 30% pior (Ratio 0.7), nota mínima."
                            color="from-blue-500/20 to-blue-600/5"
                            icon={<Swords className="w-8 h-8 text-blue-400" />}
                        />
                        <PillarCard
                            title="30%"
                            subtitle="Objetivos & Mapa"
                            desc="Sua participação em Torres, Dragões e Barões. Não basta o time fazer, você tem que estar lá."
                            color="from-amber-500/20 to-amber-600/5"
                            icon={<Target className="w-8 h-8 text-amber-400" />}
                        />
                        <PillarCard
                            title="10%"
                            subtitle="Disciplina"
                            desc="Morra menos que seu oponente. Simples assim. Se morrer menos = +10 pontos."
                            color="from-red-500/20 to-red-600/5"
                            icon={<ShieldAlert className="w-8 h-8 text-red-400" />}
                        />
                    </div>
                </div>
            </section>

            {/* Deep Dive: Lane Weights */}
            <section className="space-y-8">
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                    <div>
                        <h2 className="text-3xl font-[family-name:var(--font-outfit)] font-bold text-white flex items-center gap-3">
                            <Crosshair className="w-8 h-8 text-cyan-400" />
                            Pesos por Rota (Performance)
                        </h2>
                        <p className="text-gray-400 mt-2">
                            O sistema não cobra Farm de Suporte, nem Dano de Tank. Cada role tem suas prioridades dentro dos <strong className="text-white">60 pontos</strong> de performance.
                        </p>
                    </div>
                    {/* <div className="text-xs font-mono uppercase bg-white/5 px-3 py-1 rounded text-gray-500 border border-white/10">Canonical v1.0</div> */}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                    <LaneCard role="TOP" p1="15 pts Farm" p2="15 pts Dano" extra="10pts Tank/Visão" icon="🛡️" />
                    <LaneCard role="JUNGLE" p1="25 pts Objetivos" p2="15 pts Visão" extra="10pts KP" icon="🌲" />
                    <LaneCard role="MID" p1="20 pts Dano" p2="15 pts Farm" extra="10pts KP/Visão" icon="🔮" />
                    <LaneCard role="ADC" p1="20 pts Farm" p2="20 pts Dano" extra="10pts KP" icon="🏹" />
                    <LaneCard role="SUPPORT" p1="25 pts Visão" p2="15 pts KP" extra="10pts Objetivos" icon="🤝" />
                </div>

                <div className="bg-blue-900/10 border border-blue-500/20 p-4 rounded-xl flex gap-3 text-sm text-blue-300">
                    <Info className="w-5 h-5 flex-shrink-0" />
                    <p>
                        <strong>Dica Pro:</strong> Junglers possuem "Pontuação Dupla" em objetivos. Eles ganham nos 30pts globais E ganham 25pts massivos na performance. Um Jungler sem objetivos não passa de nota C.
                    </p>
                </div>
            </section>

            {/* Objectives Explained */}
            <section className="bg-white/5 border border-white/10 rounded-3xl p-8 space-y-8">
                <div className="flex flex-col md:flex-row gap-8">
                    <div className="flex-1 space-y-6">
                        <h2 className="text-3xl font-[family-name:var(--font-outfit)] font-bold text-white flex items-center gap-3">
                            <Crown className="w-8 h-8 text-yellow-400" />
                            Regras de Objetivos
                        </h2>

                        <div className="space-y-4">
                            <FAQItem
                                question="Basta meu time fazer o Dragão?"
                                answer="Não! O sistema conta sua participação direta (Abate ou Assistência). Se você ficar base enquanto o time faz Barão, você ganha 0."
                                type="danger"
                            />
                            <FAQItem
                                question="Como ganho nota máxima?"
                                answer="Tenha mais participação que seu oponente direto. Se você participou de 3 Dragões e ele de 0, você gabarita."
                                type="success"
                            />
                            <FAQItem
                                question="E se eu for MUITO pior (ex: 200% abaixo)?"
                                answer="O sistema tem um 'Piso' de segurança. Mesmo que você jogue muito mal, a nota mínima de um critério é 20% do valor dele, nunca zero (salvo AFK ou Derrota)."
                                type="info"
                            />
                        </div>
                    </div>

                    <div className="flex-1 grid grid-cols-2 gap-4">
                        <ObjDetail title="Torres" points="10 pts" icon="🏰" desc="Destruídas com você" />
                        <ObjDetail title="Dragões" points="10 pts" icon="🐉" desc="Qualquer elemento" />
                        <ObjDetail title="Barão" points="5 pts" icon="👾" desc="O buff mais valioso" />
                        <ObjDetail title="Arauto/Larvas" points="5 pts" icon="👁️" desc="Soma total" />
                    </div>
                </div>
            </section>

            {/* Defeat Logic - Red Zone */}
            <section className="bg-gradient-to-br from-red-600/10 to-transparent border border-red-500/20 rounded-3xl p-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-red-500/10 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2" />

                <div className="relative z-10 space-y-8">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                        <div className="space-y-2">
                            <h2 className="text-3xl font-[family-name:var(--font-outfit)] font-bold text-white flex items-center gap-3">
                                <AlertCircle className="w-8 h-8 text-red-500" />
                                Zona de Derrota
                            </h2>
                            <p className="text-gray-400">
                                Perder dói. O sistema aplica redutores severos para evitar "KDA Players" que jogam pela nota e ignoram o Nexus.
                            </p>
                        </div>
                    </div>

                    <div className="grid md:grid-cols-3 gap-6">
                        <div className="bg-black/40 p-5 rounded-2xl border border-red-500/10 space-y-2">
                            <div className="text-red-400 font-bold mb-1 flex items-center gap-2"><XCircle className="w-4 h-4" /> Teto de 40 pts</div>
                            <p className="text-sm text-gray-500">A nota máxima possível na derrota é 40/100. Ninguém tira S perdendo.</p>
                        </div>
                        <div className="bg-black/40 p-5 rounded-2xl border border-red-500/10 space-y-2">
                            <div className="text-red-400 font-bold mb-1 flex items-center gap-2"><Scale className="w-4 h-4" /> Só Vitória Conta</div>
                            <p className="text-sm text-gray-500">Métricas empatadas valem 0. Você só pontua onde for estritamente SUPERIOR ao oponente.</p>
                        </div>
                        <div className="bg-black/40 p-5 rounded-2xl border border-red-500/10 space-y-2">
                            <div className="text-red-400 font-bold mb-1 flex items-center gap-2"><ShieldAlert className="w-4 h-4" /> Anti-AFK</div>
                            <p className="text-sm text-gray-500">Kill Participation (KP) menor que 15% zera a nota automaticamente.</p>
                        </div>
                    </div>
                </div>
            </section>

            <footer className="text-center text-gray-500 text-sm pt-8 border-t border-white/5 flex flex-col items-center gap-2">
                <Map className="w-6 h-6 text-gray-700" />
                <p>Dados oficiais via Riot Games API (Match-V5). Atualização em tempo real.</p>
            </footer>
        </div>
    );
}

// --- Components ---

function PillarCard({ title, subtitle, desc, color, icon }: any) {
    return (
        <div className={clsx("relative p-6 rounded-2xl border border-white/5 bg-gradient-to-br", color)}>
            <div className="mb-4 bg-black/20 w-fit p-3 rounded-xl backdrop-blur-sm shadow-inner">{icon}</div>
            <div className="text-4xl font-[family-name:var(--font-outfit)] font-black text-white mb-1 tracking-tight">{title}</div>
            <div className="text-sm font-[family-name:var(--font-outfit)] font-bold opacity-80 uppercase tracking-wider mb-3">{subtitle}</div>
            <p className="text-sm opacity-70 leading-relaxed font-medium">{desc}</p>
        </div>
    );
}

function LaneCard({ role, p1, p2, extra, icon }: any) {
    return (
        <div className="bg-white/5 border border-white/10 p-5 rounded-2xl hover:bg-white/10 transition-colors group flex flex-col h-full">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-[family-name:var(--font-outfit)] font-black text-white tracking-tight">{role}</h3>
                <span className="text-2xl grayscale group-hover:grayscale-0 transition-all">{icon}</span>
            </div>

            <div className="space-y-3 mt-auto">
                <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">Prioridade 1</span>
                    <span className="font-bold text-emerald-400 text-right">{p1}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">Prioridade 2</span>
                    <span className="font-bold text-cyan-400 text-right">{p2}</span>
                </div>
                <div className="h-px bg-white/5 my-2" />
                <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-500">Bônus</span>
                    <span className="font-medium text-purple-400 text-right">{extra}</span>
                </div>
            </div>
        </div>
    );
}

function ObjDetail({ title, points, icon, desc }: any) {
    return (
        <div className="bg-black/20 border border-white/5 p-4 rounded-xl flex flex-col items-center text-center hover:border-yellow-500/30 transition-colors">
            <div className="text-3xl mb-2">{icon}</div>
            <div className="font-[family-name:var(--font-outfit)] font-bold text-white mb-1">{title}</div>
            <div className="text-xs font-[family-name:var(--font-outfit)] font-bold text-yellow-500 bg-yellow-500/10 px-2 py-1 rounded-full mb-2">{points}</div>
            <div className="text-[10px] text-gray-500 uppercase tracking-wide">{desc}</div>
        </div>
    );
}

function FAQItem({ question, answer, type }: any) {
    const isDanger = type === 'danger';
    return (
        <div className={clsx(
            "p-4 rounded-xl border flex gap-4",
            isDanger ? "bg-red-500/5 border-red-500/10" : "bg-emerald-500/5 border-emerald-500/10"
        )}>
            <div className="pt-1">
                {isDanger ? <XCircle className="w-5 h-5 text-red-400" /> : <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
            </div>
            <div>
                <div className={clsx("font-bold mb-1", isDanger ? "text-red-200" : "text-emerald-200")}>{question}</div>
                <div className="text-sm text-gray-400 leading-relaxed">{answer}</div>
            </div>
        </div>
    );
}
