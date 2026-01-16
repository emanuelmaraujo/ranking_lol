import { LucideIcon } from 'lucide-react';

export type InsightCategory = 'performer' | 'skill' | 'persona' | 'meme';
export type InsightPeriod = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'GENERAL';

export interface InsightText {
    titulo: string;
    subtexto: string;
    zoeira: string;
    badge: string;
}

export interface InsightDefinition {
    categoria: InsightCategory;
    texts: {
        [key in InsightPeriod]: InsightText;
    };
}

export const INSIGHTS_CONFIG: Record<string, InsightDefinition> = {
    mvp: {
        categoria: 'performer',
        texts: {
            DAILY: {
                titulo: 'O Pai Tá On',
                subtexto: 'MVP do dia',
                zoeira: 'Jogou por 3',
                badge: 'MVP'
            },
            WEEKLY: {
                titulo: 'O Protagonista',
                subtexto: 'Melhor média de pontos da semana',
                zoeira: 'Carregou sem olhar pra trás',
                badge: 'Protagonista'
            },
            MONTHLY: {
                titulo: 'Dono do Lobby',
                subtexto: 'Dominância mensal em notas',
                zoeira: 'Sempre na spotlight',
                badge: 'Maestro'
            },
            GENERAL: {
                titulo: 'A Lenda',
                subtexto: 'Maior média histórica',
                zoeira: 'Escreveu história no server',
                badge: 'GOAT'
            }
        }
    },
    highestScore: {
        categoria: 'performer',
        texts: {
            DAILY: {
                titulo: 'Aula',
                subtexto: 'Maior nota do dia',
                zoeira: 'Passou lição',
                badge: 'Aulinha'
            },
            WEEKLY: {
                titulo: 'Professor',
                subtexto: 'Maior nota da semana',
                zoeira: 'Deu workshop',
                badge: 'Teacher'
            },
            MONTHLY: {
                titulo: 'Mestre',
                subtexto: 'Maior nota do mês',
                zoeira: 'Aulas presenciais',
                badge: 'Mentor'
            },
            GENERAL: {
                titulo: 'Scriptado',
                subtexto: 'Recorde absoluto do server',
                zoeira: 'Ri da dificuldade',
                badge: 'Sábio'
            }
        }
    },
    bestWr: { // Using 'bestWr' key to map to "Winrate"
        categoria: 'performer',
        texts: {
            DAILY: {
                titulo: 'Quente',
                subtexto: 'Melhor WR do dia',
                zoeira: 'Só win',
                badge: 'Quente'
            },
            WEEKLY: {
                titulo: 'Smurf',
                subtexto: 'Taxa de vitória dominante',
                zoeira: 'Smurf Humanitário',
                badge: 'Smurf'
            },
            MONTHLY: {
                titulo: 'Elojob?',
                subtexto: 'Consistência absurda',
                zoeira: 'Comprou o passe do elo',
                badge: 'Elojob'
            },
            GENERAL: {
                titulo: 'Exodia',
                subtexto: 'Eficácia histórica',
                zoeira: 'Baniu o defeat da conta',
                badge: 'Exodia'
            }
        }
    },
    shortestGame: {
        categoria: 'meme',
        texts: {
            DAILY: {
                titulo: 'Vrau',
                subtexto: 'Jogo mais curto do dia',
                zoeira: 'Abriu e fechou',
                badge: 'Vrau'
            },
            WEEKLY: {
                titulo: 'Speedrun',
                subtexto: 'Jogo mais curto da semana',
                zoeira: 'Zero paciência',
                badge: 'Speedrunner'
            },
            MONTHLY: {
                titulo: 'Piscou',
                subtexto: 'Jogo mais curto do mês',
                zoeira: 'Carro sem freio',
                badge: 'Flash'
            },
            GENERAL: {
                titulo: 'Relâmpago',
                subtexto: 'Recorde histórico de duração',
                zoeira: 'É só clicar',
                badge: 'Relâmpago'
            }
        }
    },
    stomper: { // Kills
        categoria: 'skill',
        texts: {
            DAILY: {
                titulo: 'Serial',
                subtexto: 'Mais kills do dia',
                zoeira: 'Não deixou viver',
                badge: 'Predador'
            },
            WEEKLY: {
                titulo: 'Ceifador',
                subtexto: 'Mais kills da semana',
                zoeira: 'Caçou sem parar',
                badge: 'Slayer'
            },
            MONTHLY: {
                titulo: 'Monstro',
                subtexto: 'Mais kills do mês',
                zoeira: 'Ódio puro',
                badge: 'Assassino'
            },
            GENERAL: {
                titulo: 'Apocalipse',
                subtexto: 'Mais kills da história',
                zoeira: 'Extinção coletiva',
                badge: 'Fim dos Tempos'
            }
        }
    },
    kdaKing: { // KDA
        categoria: 'skill',
        texts: {
            DAILY: {
                titulo: 'Intocável',
                subtexto: 'Melhor KDA do dia',
                zoeira: 'Ninguém clicou',
                badge: 'Soap'
            },
            WEEKLY: {
                titulo: 'Imortal',
                subtexto: 'Melhor KDA da semana',
                zoeira: 'Sempre com vida',
                badge: 'Ghost'
            },
            MONTHLY: {
                titulo: 'Divino',
                subtexto: 'Melhor KDA mensal',
                zoeira: 'Joga outro jogo',
                badge: 'Divino'
            },
            GENERAL: {
                titulo: 'Inatingível',
                subtexto: 'Recorde histórico de KDA',
                zoeira: 'O campeão do não morrer',
                badge: 'Santo'
            }
        }
    },
    highestDmg: { // Damage
        categoria: 'skill',
        texts: {
            DAILY: {
                titulo: 'Ignite',
                subtexto: 'Maior dano/min do dia',
                zoeira: 'Apertou R',
                badge: 'DPS'
            },
            WEEKLY: {
                titulo: 'Top Damage',
                subtexto: 'Maior dano/min semanal',
                zoeira: 'Fez arte',
                badge: 'Artilheiro'
            },
            MONTHLY: {
                titulo: 'Nuclear',
                subtexto: 'Maior dano/min mensal',
                zoeira: 'Atomizou',
                badge: 'Nuke'
            },
            GENERAL: {
                titulo: 'Cataclismo',
                subtexto: 'Recorde histórico',
                zoeira: 'Explodiu o meta',
                badge: 'Desastre Natural'
            }
        }
    },
    farmer: { // CS/min
        categoria: 'skill',
        texts: {
            DAILY: {
                titulo: 'Minecraft',
                subtexto: 'Melhor CS/min do dia',
                zoeira: 'Farmou até o respeito',
                badge: 'Minerador'
            },
            WEEKLY: {
                titulo: 'Farmeiro',
                subtexto: 'Melhor CS/min da semana',
                zoeira: 'Last hit de manual',
                badge: 'Farmer'
            },
            MONTHLY: {
                titulo: 'Lavrador',
                subtexto: 'Melhor CS/min mensal',
                zoeira: 'Não viu o time em 30 min',
                badge: 'Agricultor'
            },
            GENERAL: {
                titulo: 'Latifundiário',
                subtexto: 'Recorde histórico de farm',
                zoeira: 'Dono das terras do Rift',
                badge: 'Latifúndio'
            }
        }
    },
    rich: { // Gold/min
        categoria: 'skill',
        texts: {
            DAILY: {
                titulo: 'CLT',
                subtexto: 'Maior ouro/min do dia',
                zoeira: 'Fechou item com VR',
                badge: 'CLT'
            },
            WEEKLY: {
                titulo: 'Magnata',
                subtexto: 'Maior ouro/min da semana',
                zoeira: 'Dinheiro movimenta lutas',
                badge: 'Magnata'
            },
            MONTHLY: {
                titulo: 'Investidor',
                subtexto: 'Maior ouro/min mensal',
                zoeira: 'Paga as wards do time',
                badge: 'CFO'
            },
            GENERAL: {
                titulo: 'Elon Musk',
                subtexto: 'Recorde histórico de ouro/min',
                zoeira: 'Comprou o Rift inteiro',
                badge: 'Bilionário'
            }
        }
    },
    visionary: { // Vision
        categoria: 'skill',
        texts: {
            DAILY: {
                titulo: 'Xereta',
                subtexto: 'Maior pontuação de visão do dia',
                zoeira: 'Wardou a alma do time',
                badge: 'Scout'
            },
            WEEKLY: {
                titulo: 'Vidente',
                subtexto: 'Maior visão semanal',
                zoeira: 'Sabe de tudo',
                badge: 'Vidente'
            },
            MONTHLY: {
                titulo: 'Oráculo',
                subtexto: 'Maior visão mensal',
                zoeira: 'Jogou como suporte de luxo',
                badge: 'Oráculo'
            },
            GENERAL: {
                titulo: 'Mapa Hack',
                subtexto: 'Recorde histórico de visão',
                zoeira: 'Enxergou o futuro do meta',
                badge: 'Profeta'
            }
        }
    },
    mostActive: { // Partidas Jogadas
        categoria: 'persona',
        texts: {
            DAILY: {
                titulo: 'Viciado',
                subtexto: 'Mais partidas do dia',
                zoeira: 'Não logou à toa',
                badge: 'Viciado'
            },
            WEEKLY: {
                titulo: 'Sem Vida',
                subtexto: 'Mais partidas da semana',
                zoeira: 'Clash interno',
                badge: 'Grinder'
            },
            MONTHLY: {
                titulo: 'Cracolândia',
                subtexto: 'Mais partidas do mês',
                zoeira: 'Farmou LP e cortisol',
                badge: 'Fanático'
            },
            GENERAL: {
                titulo: 'Guerreiro',
                subtexto: 'Histórico de maior grind',
                zoeira: 'Vive no Rift',
                badge: 'Maratonista'
            }
        }
    },
    anjoDaGuarda: { // Assistências
        categoria: 'persona',
        texts: {
            DAILY: {
                titulo: 'Garçom',
                subtexto: 'Mais assistências do dia',
                zoeira: 'Serviu todo mundo',
                badge: 'Garçom'
            },
            WEEKLY: {
                titulo: 'Humilde',
                subtexto: 'Mais assistências da semana',
                zoeira: 'Fez delivery de kills',
                badge: 'Support'
            },
            MONTHLY: {
                titulo: 'Suporte de Luxo',
                subtexto: 'Mais assistências do mês',
                zoeira: 'Altruísmo competitivo',
                badge: 'Maestro de Luxo'
            },
            GENERAL: {
                titulo: 'Anjo',
                subtexto: 'Recorde histórico de assistências',
                zoeira: 'Carregou nas costas (emocionalmente)',
                badge: 'Anjo'
            }
        }
    },
    winStreak: { // Sequência de Vitórias
        categoria: 'performer',
        texts: {
            DAILY: {
                titulo: 'Tá Voando',
                subtexto: 'Maior win streak do dia',
                zoeira: 'Engatou o turbo',
                badge: 'Turbo'
            },
            WEEKLY: {
                titulo: 'Embrasa',
                subtexto: 'Maior win streak da semana',
                zoeira: 'Abriu vantagem no meta',
                badge: 'Streaker'
            },
            MONTHLY: {
                titulo: 'Invicto',
                subtexto: 'Maior win streak do mês',
                zoeira: 'Ninguém segurou',
                badge: 'Invicto'
            },
            GENERAL: {
                titulo: 'Foguete',
                subtexto: 'Recorde histórico de streak',
                zoeira: 'Só sobe',
                badge: 'Foguete'
            }
        }
    },
    survivor: { // Menos mortes
        categoria: 'skill',
        texts: {
            DAILY: {
                titulo: 'Liso',
                subtexto: 'Menos mortes do dia',
                zoeira: 'Saiu vivo de tudo',
                badge: 'Liso'
            },
            WEEKLY: {
                titulo: 'Sabonete',
                subtexto: 'Menos mortes da semana',
                zoeira: 'Esquivo do meta',
                badge: 'Soap'
            },
            MONTHLY: {
                titulo: 'Fugitivo',
                subtexto: 'Menos mortes do mês',
                zoeira: 'Ninguém clicou',
                badge: 'Ninja'
            },
            GENERAL: {
                titulo: 'Imortal',
                subtexto: 'Menor média histórica',
                zoeira: 'viveu pra contar a história',
                badge: 'Imortal'
            }
        }
    },
    mono: { // Mono Champ
        categoria: 'persona',
        texts: {
            DAILY: {
                titulo: 'Mono',
                subtexto: 'Mais jogos com um champ no dia',
                zoeira: 'Só sabe disso',
                badge: 'Mono'
            },
            WEEKLY: {
                titulo: 'OTP',
                subtexto: 'Mais jogos com um champ na semana',
                zoeira: 'A vida dele é esse boneco',
                badge: 'OTP'
            },
            MONTHLY: {
                titulo: 'Devoto',
                subtexto: 'Mais jogos com um champ no mês',
                zoeira: 'O champ escolheu ele',
                badge: 'Sacerdote'
            },
            GENERAL: {
                titulo: 'Messias',
                subtexto: 'Maior dedicação histórica a um champ',
                zoeira: 'Fundou a religião',
                badge: 'Profeta'
            }
        }
    },
    ocean: { // Champion Pool Grande
        categoria: 'persona',
        texts: {
            DAILY: {
                titulo: 'Pool',
                subtexto: 'Mais campeões usados no dia',
                zoeira: 'Joga com tudo',
                badge: 'Pool'
            },
            WEEKLY: {
                titulo: 'Flex',
                subtexto: 'Mais campeões usados na semana',
                zoeira: 'Nunca repete',
                badge: 'Flex'
            },
            MONTHLY: {
                titulo: 'Oceano',
                subtexto: 'Maior pool do mês',
                zoeira: 'Draft humano',
                badge: 'Oceano'
            },
            GENERAL: {
                titulo: 'Enciclopédia',
                subtexto: 'Maior pool da história',
                zoeira: 'Manual do LoL',
                badge: 'Enciclopédia'
            }
        }
    },
    objective: { // Objetivos
        categoria: 'skill',
        texts: {
            DAILY: {
                titulo: 'Caçador',
                subtexto: 'Mais objetivos do dia',
                zoeira: 'Smite calibrado',
                badge: 'Hunter'
            },
            WEEKLY: {
                titulo: 'Arauto',
                subtexto: 'Mais objetivos da semana',
                zoeira: 'Neutral tomou hate',
                badge: 'Arauto'
            },
            MONTHLY: {
                titulo: 'Dragonslayer',
                subtexto: 'Mais objetivos do mês',
                zoeira: 'Dragão é meu',
                badge: 'Slayer'
            },
            GENERAL: {
                titulo: 'Barão',
                subtexto: 'Recorde histórico',
                zoeira: 'Rift é propriedade privada',
                badge: 'Barão'
            }
        }
    }
};

export function getInsightContent(key: string, period: string): InsightText | null {
    const config = INSIGHTS_CONFIG[key];
    if (!config) return null;

    // Normalize period to match our keys (DAILY, WEEKLY, MONTHLY, GENERAL)
    // Assuming the app uses these keys internally. If it passes 'daily', we uppercase.
    const p = period.toUpperCase() as InsightPeriod;

    return config.texts[p] || config.texts['GENERAL']; // Fallback
}
