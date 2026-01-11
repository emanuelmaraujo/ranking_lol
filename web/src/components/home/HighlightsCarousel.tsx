import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Swords,
    Skull,
    Zap,
    Target,
    Timer,
    Ghost,
    TrendingDown,
    Rocket,
    Anchor,
    ChevronsUp,
    ChevronsDown,
    Crown,
    Ban,
    Flame,
    Eye,
    Coins,
    Gamepad2,
    Medal,
    Crosshair
} from 'lucide-react';
import { HallOfFameData, HallOfShameData, PdlGainEntry, RankingEntry } from '@/lib/api';
import { normalizeChampionName } from '@/lib/utils';
import { DDRAGON_VERSION, CHAMPION_LOAD_BASE } from '@/lib/constants';

interface HighlightsCarouselProps {
    fame: HallOfFameData | null;
    shame: HallOfShameData | null;
    trends: PdlGainEntry[];
    ranking: RankingEntry[];
}

type StoryCard = {
    id: string;
    type: 'GOLD' | 'RED' | 'BLUE' | 'PURPLE' | 'GRAY' | 'GREEN' | 'CYAN' | 'ORANGE' | 'PINK' | 'BLACK' | 'FLAME';
    player: {
        gameName: string;
        profileIconId?: number | null;
        championName?: string;
    };
    category: string;
    title: string;
    icon: any;
    message: string;
    subMessage?: string;
    bgImage?: string;
    value?: string | number;
    statLabel?: string;
};

// Rank Order for comparison
const TIERS = ['IRON', 'BRONZE', 'SILVER', 'GOLD', 'PLATINUM', 'EMERALD', 'DIAMOND', 'MASTER', 'GRANDMASTER', 'CHALLENGER'];

// Fallback Background (Generic Map Art or Abstract LoL art)
const GENERIC_FALLBACK_BG = "https://ddragon.leagueoflegends.com/cdn/img/champion/splash/Aatrox_0.jpg"; // Default temporary, but better:
const MAP_ART = "https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/content/src/leagueclient/gamemodeassets/classic/img/scene/lobby-scene-bg.jpg";


const GENERATED_STORY_COUNT = 3; // Duplicate list 3 times for "infinite" feel

export function HighlightsCarousel({ fame, shame, trends, ranking = [] }: HighlightsCarouselProps) {
    const [cards, setCards] = useState<StoryCard[]>([]);
    const carouselRef = useRef<HTMLDivElement>(null);
    const [width, setWidth] = useState(0);

    // Update constraints width
    useEffect(() => {
        if (carouselRef.current) {
            setWidth(carouselRef.current.scrollWidth - carouselRef.current.offsetWidth);
        }
    }, [cards]);

    // Data Processing
    useEffect(() => {
        const list: StoryCard[] = [];
        const getSplash = (championName?: string) => {
            if (!championName) return undefined;
            const normalized = normalizeChampionName(championName);
            return `${CHAMPION_LOAD_BASE}/${normalized}_0.jpg`;
        };
        const getPlayerDetails = (puuid: string) => ranking.find(r => r.puuid === puuid);
        const getTierIndex = (tier: string) => TIERS.indexOf(tier.toUpperCase());

        // 1. PROMOTIONS & DEMOTIONS
        trends.forEach(t => {
            const fullPlayer = getPlayerDetails(t.puuid);
            const bg = fullPlayer?.skin?.splashUrl || getSplash(fullPlayer?.mainChampion?.name);

            if (t.startTier && t.tier && t.startTier !== t.tier) {
                const startIndex = getTierIndex(t.startTier);
                const endIndex = getTierIndex(t.tier);

                if (startIndex !== -1 && endIndex !== -1) {
                    if (endIndex > startIndex) {
                        list.push({
                            id: `promo-${t.puuid}`, type: 'CYAN',
                            player: { gameName: t.gameName, profileIconId: t.profileIconId, championName: fullPlayer?.mainChampion?.name },
                            category: 'ASCENSÃO', title: 'SUBIU DE ELO', icon: ChevronsUp,
                            message: 'O REI CHEGOU', subMessage: `Saiam da frente, ele tá no ${t.tier}`,
                            value: t.tier, statLabel: 'NOVO ELO', bgImage: bg
                        });
                    } else {
                        list.push({
                            id: `demo-${t.puuid}`, type: 'ORANGE',
                            player: { gameName: t.gameName, profileIconId: t.profileIconId, championName: fullPlayer?.mainChampion?.name },
                            category: 'QUEDA', title: 'CAIU DE ELO', icon: ChevronsDown,
                            message: 'A GRAVIDADE É CRUEL', subMessage: `De volta ao ${t.tier} com saudade`,
                            value: t.tier, statLabel: 'ELO ATUAL', bgImage: bg
                        });
                    }
                }
            }
        });

        // 2. HALL OF FAME
        if (fame?.pentaKing) list.push({
            id: 'penta', type: 'GOLD', player: fame.pentaKing,
            category: 'DESTAQUE', title: 'SENHOR PENTAKILL', icon: Swords,
            message: 'DONO DO SERVIDOR', subMessage: 'Apenas entreguem o jogo',
            value: 'PENTAKILL', statLabel: 'HIGHLIGHT', bgImage: getSplash(fame.pentaKing.championName)
        });
        if (fame?.stomper) list.push({
            id: 'stomper', type: 'BLUE', player: fame.stomper,
            category: 'DOMINAÇÃO', title: 'PATRÃO DO EARLY', icon: Zap,
            message: 'GAMEPLAY DE 15 MIN', subMessage: 'Tá com pressa de almoçar?',
            value: 'STOMP', statLabel: 'RITMO', bgImage: getSplash(fame.stomper.championName)
        });
        if (fame?.damageEfficient) list.push({
            id: 'dmg', type: 'PINK', player: fame.damageEfficient,
            category: 'IMPACTO', title: 'DANO INFINITO', icon: Target,
            message: 'TOP DAMAGE', subMessage: 'Bateu na mãe? Respeita o dano!',
            value: 'DANO', statLabel: 'PERFORMANCE', bgImage: getSplash(fame.damageEfficient.championName)
        });
        if (fame?.farmMachine) list.push({
            id: 'farm', type: 'GREEN', player: fame.farmMachine,
            category: 'RECURSO', title: 'ASPIRADOR DE MINION', icon: Coins,
            message: '10CS POR MINUTO', subMessage: 'O farm tá em dia, e a vitória?',
            value: 'RICO', statLabel: 'ECONOMIA', bgImage: getSplash(fame.farmMachine.championName)
        });
        if (fame?.objectiveKing) list.push({
            id: 'objective', type: 'PURPLE', player: fame.objectiveKing,
            category: 'CONTROLE', title: 'SENHOR DRAGÃO', icon: Eye,
            message: 'MAPA É DELE', subMessage: 'Arauto, Dragão, Baron... tudo nosso.',
            value: 'OBJETIVOS', statLabel: 'MACRO', bgImage: getSplash(fame.objectiveKing.championName)
        });
        if (fame?.lateDemon) list.push({
            id: 'late', type: 'PURPLE', player: fame.lateDemon,
            category: 'CLUTCH', title: 'REI DO LATE GAME', icon: Crown,
            message: 'NÃO DESISTE NUNCA', subMessage: 'O jogo só acaba quando o nexus cai',
            value: 'ESCALANDO', statLabel: 'MENTAL', bgImage: getSplash(fame.lateDemon.championName)
        });
        if (fame?.torreDemolidora) list.push({
            id: 'tower', type: 'ORANGE', player: fame.torreDemolidora,
            category: 'DEMOLIÇÃO', title: 'ZIGGS DA VIDA REAL', icon: Target,
            message: 'A TORRE CAIU', subMessage: 'Não deixa ele sozinho na lane...',
            value: 'SPLIT', statLabel: 'ESTRUTURA', bgImage: getSplash(fame.torreDemolidora.championName)
        });
        if (fame?.jungleGod) list.push({
            id: 'jungle', type: 'GREEN', player: fame.jungleGod,
            category: 'SELVA', title: 'TARZAN DO RIFT', icon: Skull,
            message: 'A SELVA TEM DONO', subMessage: 'Invadiu a jungle dele? Azar.',
            value: 'REI', statLabel: 'OBJETIVOS', bgImage: getSplash(fame.jungleGod.championName)
        });
        if (fame?.earlyTyrant) list.push({
            id: 'early', type: 'RED', player: fame.earlyTyrant,
            category: 'PRESSÃO', title: 'BULLY DE LANE', icon: Swords,
            message: 'GG AOS 15', subMessage: 'Inimigo nem saiu da torre.',
            value: 'AGRESSIVO', statLabel: 'PRESSÃO', bgImage: getSplash(fame.earlyTyrant.championName)
        });
        if (fame?.macroPerfect) list.push({
            id: 'macro', type: 'PURPLE', player: fame.macroPerfect,
            category: 'CÉREBRO', title: 'MENTE MILIONÁRIA', icon: Eye,
            message: 'XADREZ 4D', subMessage: 'Ganhou na inteligência, não na força.',
            value: 'GÊNIO', statLabel: 'MACRO', bgImage: getSplash(fame.macroPerfect.championName)
        });
        if (fame?.soloClutch) list.push({
            id: 'clutch', type: 'GOLD', player: fame.soloClutch,
            category: 'HERÓI', title: 'SALVADOR DA PÁTRIA', icon: Crown,
            message: 'DEIXA COM O PAI', subMessage: 'Resolveu sozinho quando importava.',
            value: 'DECISIVO', statLabel: 'DECISÃO', bgImage: getSplash(fame.soloClutch.championName)
        });
        if (fame?.costasSeguras) list.push({
            id: 'shield', type: 'BLUE', player: fame.costasSeguras,
            category: 'PROTEÇÃO', title: 'PAREDE DE CONCRETO', icon: Anchor,
            message: 'DAQUI NÃO PASSA', subMessage: 'Protegeu o time como um leão.',
            value: 'TANK', statLabel: 'SUPORTE', bgImage: getSplash(fame.costasSeguras.championName)
        });

        // 3. HALL OF SHAME
        if (shame?.soloDoador) list.push({
            id: 'feeder', type: 'RED', player: shame.soloDoador,
            category: 'BAGRE', title: 'ALIMENTANDO...', icon: Skull,
            message: 'BUFFET LIBERADO', subMessage: 'Inimigo tá forte? culpa dele.',
            value: 'FEEDER', statLabel: 'MEME', bgImage: getSplash(shame.soloDoador.championName)
        });
        if (shame?.throwingStation && !shame.soloDoador) list.push({
            id: 'throw', type: 'ORANGE', player: shame.throwingStation,
            category: 'ENTREGADA', title: 'JOGADA DE OURO', icon: TrendingDown,
            message: 'A ARTE DO THROW', subMessage: 'O jogo tava ganho... estava.',
            value: 'ENTREGOU', statLabel: 'MOMENTO', bgImage: getSplash(shame.throwingStation.championName)
        });
        if (shame?.visionNegligente) list.push({
            id: 'blind', type: 'GRAY', player: shame.visionNegligente,
            category: 'ESCURO', title: 'CEGUEIRA TOTAL', icon: Ghost,
            message: 'ECONOMIZOU NA WARD', subMessage: 'O mapa é DLC paga?',
            value: '0 VISÃO', statLabel: 'VACILO', bgImage: getSplash(shame.visionNegligente.championName)
        });
        if (shame?.sonecaBaron) list.push({
            id: 'sleep', type: 'GRAY', player: shame.sonecaBaron,
            category: 'AUSENTE', title: 'SONINHO GOSTOSO', icon: Timer,
            message: 'ACORDA PRA VIDA', subMessage: 'Foi fazer um café e esqueceu?',
            value: 'AFK', statLabel: 'FALTA', bgImage: getSplash(shame.sonecaBaron.championName)
        });
        if (shame?.killCollector) list.push({
            id: 'ks', type: 'RED', player: shame.killCollector,
            category: 'EGOÍSTA', title: 'SÓ MATA, NÃO GANHA', icon: Crosshair,
            message: 'MEDO DE MORRER', subMessage: 'KDA Player: Matou todos, perdeu o jogo.',
            value: 'KDA', statLabel: 'INDIVIDUAL', bgImage: getSplash(shame.killCollector.championName)
        });
        if (shame?.lowDmg) list.push({
            id: 'pacifist', type: 'GRAY', player: shame.lowDmg,
            category: 'DA PAZ', title: 'O PACIFICADOR', icon: Anchor,
            message: 'ZERO DANO', subMessage: 'Veio só pra passear no mapa?',
            value: 'PAZ', statLabel: 'DANO', bgImage: getSplash(shame.lowDmg.championName)
        });
        if (shame?.alface) list.push({
            id: 'alface', type: 'GREEN', player: shame.alface,
            category: 'MECÂNICA', title: 'MÃO DE ALFACE', icon: TrendingDown,
            message: 'ERROU TUDO', subMessage: 'O mouse tava sem fio?',
            value: 'WHIFF', statLabel: 'SKILL', bgImage: getSplash(shame.alface.championName)
        });
        if (shame?.telaPreta) list.push({
            id: 'grey', type: 'GRAY', player: shame.telaPreta,
            category: 'ABATE', title: 'SIMULADOR DE CINZA', icon: Ghost,
            message: 'SÓ VÊ O JOGO EM P&B', subMessage: 'Passou mais tempo morto que vivo.',
            value: 'MORTO', statLabel: 'TEMPO', bgImage: getSplash(shame.telaPreta.championName)
        });
        if (shame?.moedaBronze) list.push({
            id: 'coin', type: 'ORANGE', player: shame.moedaBronze,
            category: 'AZAR', title: 'KRIPTONITA', icon: Skull,
            message: 'ONDE CAI PERDE', subMessage: 'O time chora quando vê no lobby.',
            value: 'ZICA', statLabel: 'IMPACTO', bgImage: getSplash(shame.moedaBronze.championName)
        });

        // 4. CALCULATED STORIES
        // A. HOT STREAK (High Winrate)
        const hotStreakPlayer = ranking.filter(r => parseFloat(r.winRate) > 65 && r.gamesUsed > 10).sort((a, b) => parseInt(b.winRate) - parseInt(a.winRate))[0];
        if (hotStreakPlayer) {
            list.push({
                id: `streak-${hotStreakPlayer.puuid}`, type: 'FLAME',
                player: { gameName: hotStreakPlayer.gameName, profileIconId: hotStreakPlayer.profileIconId, championName: hotStreakPlayer.mainChampion?.name },
                category: 'ON FIRE', title: 'FOGUETE NÃO TEM RÉ', icon: Flame,
                message: 'A FILA TÁ ANDANDO', subMessage: `${hotStreakPlayer.winRate}% de Vitórias - Tá smurfando?`,
                value: 'SEQ. VITÓRIA', statLabel: 'MOMENTO', bgImage: getSplash(hotStreakPlayer.mainChampion?.name)
            });
        }

        // B. SMURF DETECTED (Very High Winrate)
        const smurf = ranking.find(r => parseFloat(r.winRate) > 75 && r.gamesUsed > 15);
        if (smurf && smurf.puuid !== hotStreakPlayer?.puuid) {
            list.push({
                id: `smurf-${smurf.puuid}`, type: 'PURPLE',
                player: { gameName: smurf.gameName, profileIconId: smurf.profileIconId, championName: smurf.mainChampion?.name },
                category: 'ALIENÍGENA', title: 'FAKE NATTY', icon: Zap,
                message: 'ISSO AQUI É SMURF', subMessage: `${smurf.winRate}% de WR. Alô Riot?`,
                value: 'SMURF?', statLabel: 'DOMINAÇÃO', bgImage: getSplash(smurf.mainChampion?.name)
            });
        }

        // C. GRINDER (Many Games)
        const grinder = ranking.sort((a, b) => b.gamesUsed - a.gamesUsed)[0];
        if (grinder && grinder.gamesUsed > 20) {
            list.push({
                id: `grinder-${grinder.puuid}`, type: 'GRAY',
                player: { gameName: grinder.gameName, profileIconId: grinder.profileIconId, championName: grinder.mainChampion?.name },
                category: 'FOME DE JOGO', title: 'CARTEIRA DE TRABALHO?', icon: Gamepad2,
                message: 'CLT NO LOLZINHO', subMessage: `${grinder.gamesUsed} partidas na semana. Guerreiro!`,
                value: `${grinder.gamesUsed} JOGOS`, statLabel: 'DEDICAÇÃO', bgImage: getSplash(grinder.mainChampion?.name)
            });
        }

        // D. VETERANO (Consistent Games)
        const veteran = ranking.find(r => r.gamesUsed > 50 && r.puuid !== grinder?.puuid);
        if (veteran) {
            list.push({
                id: `vet-${veteran.puuid}`, type: 'BLUE',
                player: { gameName: veteran.gameName, profileIconId: veteran.profileIconId, championName: veteran.mainChampion?.name },
                category: 'VETERANO', title: 'MORADOR DO RIFT', icon: Anchor,
                message: 'AQUI É DE CASA', subMessage: `Mais de 50 jogos. O Rift é o quintal dele.`,
                value: 'VETERANO', statLabel: 'EXPERIÊNCIA', bgImage: getSplash(veteran.mainChampion?.name)
            });
        }

        // E. OTP (One Trick Pony)
        const otp = ranking.find(r => r.mainChampion && r.mainChampion.points > 100000 && r.gamesUsed > 5);
        if (otp) {
            list.push({
                id: `otp-${otp.puuid}`, type: 'PURPLE',
                player: { gameName: otp.gameName, profileIconId: otp.profileIconId, championName: otp.mainChampion?.name },
                category: 'MONOCHAMP', title: `MONO ${otp.mainChampion?.name?.toUpperCase()}`, icon: Medal,
                message: 'BANIU ACABOU O JOGO', subMessage: `Não sabe jogar de outra coisa, certeza.`,
                value: 'MEU BONECO', statLabel: 'MAESTRIA', bgImage: getSplash(otp.mainChampion?.name)
            });
        }

        // F. TOP GAINER (PDL)
        const topGainer = trends.sort((a, b) => b.pdlGain - a.pdlGain)[0];
        if (topGainer && topGainer.pdlGain > 60) {
            const fullGainer = getPlayerDetails(topGainer.puuid);
            list.push({
                id: `top-gainer-${topGainer.puuid}`, type: 'GREEN',
                player: { gameName: topGainer.gameName, profileIconId: topGainer.profileIconId, championName: fullGainer?.mainChampion?.name },
                category: 'ASCENSÃO', title: 'FOGUETE DA NASA', icon: Rocket,
                message: 'NINGUÉM SEGURA', subMessage: `Ganhou insanamente +${topGainer.pdlGain} PDL`,
                value: `+${topGainer.pdlGain}`, statLabel: 'PDL UP', bgImage: getSplash(fullGainer?.mainChampion?.name)
            });
        }

        // G. AZARADO (High Performance, Low Winrate)
        // avgScore > 80 (Good) but WR < 45% (Bad)
        const azarado = ranking.find(r => r.avgScore > 80 && parseFloat(r.winRate) < 45);
        if (azarado) {
            list.push({
                id: `badluck-${azarado.puuid}`, type: 'GRAY',
                player: { gameName: azarado.gameName, profileIconId: azarado.profileIconId, championName: azarado.mainChampion?.name },
                category: 'AZARADO', title: 'JOGA MUITO, PERDE TUDO', icon: Ghost,
                message: 'O INJUSTIÇADO', subMessage: `Nota ${azarado.avgScore} mas não ganha. Tistreza.`,
                value: 'SADGE', statLabel: 'SORTE?', bgImage: getSplash(azarado.mainChampion?.name)
            });
        }

        // H. CARREGADO (Low Performance, High Winrate)
        // avgScore < 50 (Bad) but WR > 60% (Good)
        const carregado = ranking.find(r => r.avgScore < 50 && parseFloat(r.winRate) > 60);
        if (carregado) {
            list.push({
                id: `carried-${carregado.puuid}`, type: 'PINK',
                player: { gameName: carregado.gameName, profileIconId: carregado.profileIconId, championName: carregado.mainChampion?.name },
                category: 'MOCHILA', title: 'MOCHILA DE GRIFE', icon: Anchor,
                message: 'PESADO MAS GANHA', subMessage: `Nota ${carregado.avgScore}. O time que lute.`,
                value: 'CARREGADO', statLabel: 'SORTE', bgImage: getSplash(carregado.mainChampion?.name)
            });
        }

        // I. COIN FLIP (50% Winrate)
        const coinFlip = ranking.find(r => parseFloat(r.winRate) >= 49 && parseFloat(r.winRate) <= 51 && r.gamesUsed > 20);
        if (coinFlip) {
            list.push({
                id: `coinflip-${coinFlip.puuid}`, type: 'GRAY',
                player: { gameName: coinFlip.gameName, profileIconId: coinFlip.profileIconId, championName: coinFlip.mainChampion?.name },
                category: 'EQUILÍBRIO', title: 'O EQUILIBRISTA', icon: Target,
                message: 'BALANCEADO', subMessage: '50% de chance de ganhar. Thanos orgulhoso.',
                value: '50/50', statLabel: 'CONSISTÊNCIA', bgImage: getSplash(coinFlip.mainChampion?.name)
            });
        }

        setCards(list.filter(c => c.player && c.player.gameName));
    }, [fame, shame, trends, ranking]);

    // Auto-Scroll Logic
    const [isPaused, setIsPaused] = useState(false);
    const x = useRef(0);
    const containerRef = useRef<HTMLDivElement>(null);
    const animationFrameId = useRef<number | null>(null);

    useEffect(() => {
        const scroll = () => {
            if (isPaused || !containerRef.current) return;

            x.current -= 0.5; // Speed: 0.5px per frame

            // Loop Logic: If we scrolled past the first set of cards, reset to 0
            // Width of 1 card (320px) + gap (24px) = 344px
            const singleSetWidth = cards.length * 344;

            if (Math.abs(x.current) >= singleSetWidth) {
                x.current = 0;
            }

            if (containerRef.current) {
                containerRef.current.style.transform = `translateX(${x.current}px)`;
            }

            animationFrameId.current = requestAnimationFrame(scroll);
        };

        if (cards.length > 0) { // SAFETY: Only run animation if we have cards
            animationFrameId.current = requestAnimationFrame(scroll);
        }

        return () => {
            if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
        };
    }, [isPaused, cards.length]);



    // INFINITE SCROLL SIMULATION: Duplicate cards X times
    const infiniteCards = Array(GENERATED_STORY_COUNT).fill(cards).flat();

    return (
        <section className="mb-24 relative w-full overflow-hidden">
            <div className="flex items-center justify-between mb-8 px-1">
                <h3 className="text-2xl md:text-3xl font-[family-name:var(--font-outfit)] font-black text-white uppercase italic tracking-tighter flex items-center gap-4">
                    <span className="text-emerald-500 text-4xl">❝</span>
                    <span>Stories da Rodada</span>
                </h3>
            </div>

            {/* Drag Container */}
            <div
                className="overflow-hidden ml-[-5%]"
                onMouseEnter={() => setIsPaused(true)}
                onMouseLeave={() => setIsPaused(false)}
            >
                <div
                    ref={containerRef}
                    className="flex gap-6 w-max px-8 py-12 cursor-grab active:cursor-grabbing"
                    style={{ willChange: 'transform', backfaceVisibility: 'hidden' }} // Optimization: Promote to layer
                >
                    {infiniteCards.map((card, idx) => (
                        <StoryCardComponent key={`${card.id}-${idx}`} card={card} />
                    ))}
                </div>
            </div>
        </section>
    );
}

function StoryCardComponent({ card }: { card: StoryCard }) {

    const theme = {
        GOLD: { bg: 'from-amber-500/20 to-yellow-900/40', accent: 'text-amber-400', border: 'border-amber-500/40', shadow: 'shadow-amber-500/20' },
        RED: { bg: 'from-red-600/20 to-rose-950/40', accent: 'text-red-500', border: 'border-red-500/40', shadow: 'shadow-red-500/20' },
        BLUE: { bg: 'from-blue-500/20 to-indigo-900/40', accent: 'text-cyan-400', border: 'border-cyan-500/40', shadow: 'shadow-cyan-500/20' },
        PURPLE: { bg: 'from-purple-500/20 to-violet-900/40', accent: 'text-purple-400', border: 'border-purple-500/40', shadow: 'shadow-purple-500/20' },
        GRAY: { bg: 'from-gray-500/20 to-slate-900/40', accent: 'text-gray-400', border: 'border-gray-500/40', shadow: 'shadow-gray-500/20' },
        GREEN: { bg: 'from-emerald-500/20 to-green-900/40', accent: 'text-emerald-400', border: 'border-emerald-500/40', shadow: 'shadow-emerald-500/20' },
        CYAN: { bg: 'from-sky-500/20 to-blue-900/40', accent: 'text-sky-400', border: 'border-sky-500/40', shadow: 'shadow-sky-500/20' },
        ORANGE: { bg: 'from-orange-500/20 to-amber-900/40', accent: 'text-orange-500', border: 'border-orange-500/40', shadow: 'shadow-orange-500/20' },
        PINK: { bg: 'from-pink-500/20 to-rose-900/40', accent: 'text-pink-500', border: 'border-pink-500/40', shadow: 'shadow-pink-500/20' },
        BLACK: { bg: 'from-zinc-500/20 to-black/40', accent: 'text-white', border: 'border-white/20', shadow: 'shadow-white/10' },
        FLAME: { bg: 'from-orange-600/20 to-red-900/40', accent: 'text-orange-500', border: 'border-orange-500/40', shadow: 'shadow-orange-500/20' },
    }[card.type] || { bg: 'from-gray-500/20', accent: 'text-gray-200', border: 'border-white/10', shadow: 'shadow-white/5' };

    const fallbackProfileIcon = `https://ddragon.leagueoflegends.com/cdn/${DDRAGON_VERSION}/img/profileicon/${card.player.profileIconId || 29}.png`;

    return (
        <motion.div
            className={`
                relative w-[320px] h-[520px] rounded-[2rem] overflow-hidden 
                border ${theme.border} bg-[#0a0a0a] ${theme.shadow} shadow-2xl
                group select-none flex-shrink-0
            `}
            whileHover={{ y: -5, scale: 1.02 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        >
            {/* Background Image - Full Size with Vignette */}
            <div className="absolute inset-0 z-0">
                {card.bgImage ? (
                    <img
                        src={card.bgImage}
                        alt="Background"
                        className="w-full h-full object-cover opacity-60 group-hover:opacity-80 transition-all duration-700 group-hover:scale-110 grayscale-[30%] group-hover:grayscale-0"
                        onError={(e) => { (e.target as HTMLImageElement).src = fallbackProfileIcon; }}
                    />
                ) : (
                    <div className={`w-full h-full bg-gradient-to-br ${theme.bg}`} />
                )}
                {/* Gradient Overlays for Readability */}
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
                <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-black/80 to-transparent" />
            </div>

            {/* Top Badge */}
            <div className="relative z-10 p-6 flex justify-center w-full">
                <span className={`
                    px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] 
                    bg-black/60 backdrop-blur-md border border-white/10 text-white shadow-lg
                `}>
                    {card.category}
                </span>
            </div>

            {/* Central Icon (Watermark style) */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                <card.icon size={120} className={`${theme.accent} opacity-20 blur-sm`} />
            </div>

            {/* Bottom Content - Centered */}
            <div className="absolute bottom-0 w-full p-8 z-20 flex flex-col items-center text-center">

                {/* Stat Highlight (Floating) */}
                {card.value && (
                    <div className="mb-6 flex flex-col items-center animate-in fade-in slide-in-from-bottom-4 duration-700">
                        <span className={`text-3xl font-black italic tracking-tighter ${theme.accent} drop-shadow-[0_2px_10px_rgba(0,0,0,0.5)]`}>
                            {card.value}
                        </span>
                        <span className="text-[10px] font-bold text-white/60 uppercase tracking-widest">
                            {card.statLabel}
                        </span>
                    </div>
                )}

                {/* Player Identity */}
                <div className="flex flex-col items-center gap-4 mb-8 group-hover:-translate-y-2 transition-transform duration-500">
                    <div className={`
                        relative w-24 h-24 rounded-full p-1.5 
                        bg-gradient-to-br ${theme.bg} border-4 border-white/20 shadow-[0_0_30px_rgba(0,0,0,0.5)]
                        group-hover:shadow-[0_0_50px_rgba(255,255,255,0.2)] transition-shadow duration-700
                    `}>
                        <img src={fallbackProfileIcon} className="w-full h-full rounded-full object-cover" alt="" />
                        {/* Rank Circle Indicator (Optional Polish) - Adjusted for bigger size */}
                        <div className={`absolute bottom-0 right-1 w-6 h-6 rounded-full border-4 border-black ${theme.bg.split(' ')[0].replace('from-', 'bg-')}`} />
                    </div>
                    <div>
                        <div className="text-white font-[family-name:var(--font-outfit)] font-black text-3xl leading-none tracking-tight drop-shadow-xl">
                            {card.player.gameName}
                        </div>
                        <div className={`text-xs font-bold ${theme.accent} uppercase tracking-[0.25em] mt-2`}>
                            {card.player.championName || 'Invocador'}
                        </div>
                    </div>
                </div>

                {/* Separator */}
                <div className="w-16 h-1.5 bg-white/10 rounded-full mb-6" />

                {/* Main Message */}
                <div className="w-full relative">
                    <h2 className="text-3xl font-[family-name:var(--font-outfit)] font-black text-white leading-[0.9] italic uppercase tracking-tighter drop-shadow-2xl mb-3">
                        {card.message}
                    </h2>
                    <p className="text-base text-gray-200 font-medium leading-relaxed px-4 opacity-90">
                        {card.subMessage}
                    </p>
                </div>
            </div>
        </motion.div>
    );
}
