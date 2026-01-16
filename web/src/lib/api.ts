// Detect environment
const isServer = typeof window === 'undefined';
// Server Side: Use Internal Docker URL or Localhost
const INTERNAL_API = process.env.API_INTERNAL_URL || 'http://127.0.0.1:3333';
// Client Side: Use relative path (Rewrites)
const API_URL = isServer ? `${INTERNAL_API}/api` : '/api';

console.log(`[API Config] isServer=${isServer}, API_URL=${API_URL}`);

export interface RankingEntry {
    rank: number;
    puuid: string;
    gameName: string;
    tagLine: string;
    // Identity
    profileIconId?: number | null;
    summonerLevel?: number | null;
    // Stats
    tier: string;
    rankDivision: string;
    lp: number;
    totalScore: number;
    avgScore: number;
    gamesUsed: number;
    wins: number;
    losses: number;
    winRate: string;
    // Main Champion
    mainChampion?: {
        id: number;
        name: string;
        points: number;
        level: number;
    };
    // New: Lane Scores
    laneScores: Record<string, number>;
    laneStats?: Record<string, { games: number, wins: number }>;
    skin?: {
        name: string;
        splashUrl: string;
        loadingUrl: string;
    };
}

export interface EloRanking {
    tier: string;
    players: RankingEntry[];
}

export interface PlayerHistoryEntry {
    date: string;
    tier: string;
    rank: string;
    lp: number;
}

export interface PlayerHistory {
    player: {
        displayName: string;
        tier: string;
        rank: string;
        lp: number;
        puuid: string;
        profileIconId?: number | null;
        summonerLevel?: number | null;
    };
    history: PlayerHistoryEntry[];
    masteries: {
        championId: number;
        championName: string;
        level: number;
        points: number;
        skin?: {
            name: string;
            splashUrl: string;
            loadingUrl: string;
        };
    }[];
}

export interface PdlGainEntry {
    puuid: string;
    gameName: string;
    tagLine: string;
    tier: string;
    rank: string;
    lp: number;
    pdlGain: number;
    trend: 'UP' | 'DOWN' | 'SAME';
    profileIconId?: number | null;
    // Context
    startTier?: string;
    startRank?: string;
    startLp?: number;
}

export interface PlayerStats {
    avgScore: string;
    winRate: string;
    totalGames: number;
    avgKda: string;
    bestScore: number;
    worstScore: number;
}

export interface MatchHistoryEntry {
    matchId: string;
    date: string;
    lane: string;
    isVictory: boolean;
    score: number;
    kda: string; // Formatted
    kills: number;
    deaths: number;
    assists: number;
    performanceScore: number;
    objectivesScore: number;
    disciplineScore: number;
    championName: string;
    championId?: number;
    // Extended Stats
    cs: number;
    gold: number;
    damage: number;
    duration: number; // Seconds
    // Global View Extras
    playerName?: string;
    playerTag?: string;
    playerIcon?: number;
    puuid?: string; // Player PUUID for identification
}

export interface PlayerInsights {
    stats: PlayerStats;
    history: MatchHistoryEntry[];
    pagination?: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
    insights: {
        consistency: string;
        trend: string;
    };
    weeklyReport: {
        wins: number;
        losses: number;
        total: number;
        winRate: string;
        pdlDelta: number;
    };
    playstyle: {
        combat: number;
        objectives: number;
        discipline: number;
    };
}

export async function getSeasonRanking(queue: 'SOLO' | 'FLEX' = 'SOLO', limit: number = 100, filters?: { start?: Date; end?: Date }): Promise<RankingEntry[]> {
    let url = `${API_URL}/ranking/season?queue=${queue}&limit=${limit}`;
    if (filters?.start) url += `&startDate=${filters.start.toISOString()}`;
    if (filters?.end) url += `&endDate=${filters.end.toISOString()}`;
    url += `&_t=${Date.now()}`;

    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) throw new Error('Failed to fetch ranking');
    return res.json();
}

export async function getRankingByElo(queue: 'SOLO' | 'FLEX', tier: string, limit: number = 100, filters?: { start?: Date; end?: Date }): Promise<EloRanking> {
    let url = `${API_URL}/ranking/season/by-elo?queue=${queue}&tier=${tier}&limit=${limit}`;
    if (filters?.start) url += `&startDate=${filters.start.toISOString()}`;
    if (filters?.end) url += `&endDate=${filters.end.toISOString()}`;

    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch elo ranking');
    return res.json();
}

export async function getPdlGainRanking(queue: 'SOLO' | 'FLEX' = 'SOLO', limit: number = 20, startDate?: Date | string): Promise<PdlGainEntry[]> {
    let url = `${API_URL}/ranking/pdl-gain?queue=${queue}&limit=${limit}`;
    if (startDate) {
        const val = startDate instanceof Date ? startDate.toISOString() : startDate;
        url += `&startDate=${val}`;
    }
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch PDL ranking');
    return res.json();
}

export async function getPlayerHistory(puuid: string, queue: 'SOLO' | 'FLEX' = 'SOLO'): Promise<PlayerHistory> {
    const res = await fetch(`${API_URL}/player/${puuid}/history?queue=${queue}`);
    if (!res.ok) throw new Error('Failed to fetch player history');
    return res.json();
}

export interface HighlightPlayer {
    puuid: string;
    gameName: string;
    tagLine: string;
    profileIconId?: number | null;
    value: string | number;
    label: string;
    championName?: string; // New for Mono
    tier?: string;
}

export interface PeriodHighlights {
    period: { start: string; end: string };
    periodLabel: string;
    mvp: HighlightPlayer | null;
    kdaKing: HighlightPlayer | null;
    mostActive: HighlightPlayer | null;
    highestDmg: HighlightPlayer | null;
    survivor: HighlightPlayer | null;
    visionary: HighlightPlayer | null;
    stomper: HighlightPlayer | null;
    rich: HighlightPlayer | null;
    farmer: HighlightPlayer | null;
    lpMachine: HighlightPlayer | null;
    highestScore: HighlightPlayer | null;

    // New Metrics (Phase 20)
    mono: HighlightPlayer | null;
    ocean: HighlightPlayer | null;
    objective: HighlightPlayer | null;
}

export async function getPlayerInsights(puuid: string, queue: 'SOLO' | 'FLEX' = 'SOLO', page: number = 1, limit: number = 10, sort: 'asc' | 'desc' = 'desc'): Promise<PlayerInsights> {
    const res = await fetch(`${API_URL}/player/${puuid}/insights?queue=${queue}&page=${page}&limit=${limit}&sort=${sort}`);
    if (!res.ok) throw new Error('Failed to fetch player insights');
    return res.json();
}

export const getHighlights = async (queue: 'SOLO' | 'FLEX' = 'SOLO', filters?: { start?: Date; end?: Date }): Promise<PeriodHighlights> => {
    let url = `${API_URL}/ranking/insights?queue=${queue}`;
    if (filters?.start) url += `&startDate=${filters.start.toISOString()}`;
    if (filters?.end) url += `&endDate=${filters.end.toISOString()}`;

    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) throw new Error("Failed to fetch highlights");
    return res.json();
};

// PDL Evolution Types
export interface PdlSnapshot {
    tier: string;
    rank: string;
    lp: number;
    date: string; // ISO
}

export interface PdlEvolution {
    start: PdlSnapshot;
    current: PdlSnapshot;
    gain: number;
    gainLabel: string;
}

export async function getPdlEvolution(puuid: string, queue: 'SOLO' | 'FLEX' = 'SOLO'): Promise<PdlEvolution | null> {
    const res = await fetch(`${API_URL}/player/${puuid}/pdl-evolution?queue=${queue}`);
    if (!res.ok) return null; // Return null if not found/error, allowing UI to hide it
    return res.json();
}

export async function getSystemStatus(): Promise<{ lastUpdate: string | null; nextUpdate: string | null }> {
    const res = await fetch(`${API_URL}/status?_t=${Date.now()}`, { cache: 'no-store' });
    if (!res.ok) return { lastUpdate: null, nextUpdate: null };
    return res.json();
}

/**
 * Add New Player (Admin)
 */
export async function createPlayer(gameName: string, tagLine: string, password: string): Promise<any> {
    const res = await fetch(`${API_URL}/players`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-admin-password': password
        },
        body: JSON.stringify({ gameName, tagLine })
    });

    if (res.status === 401) {
        throw new Error('Senha incorreta');
    }

    if (!res.ok) {
        throw new Error('Falha ao adicionar jogador');
    }

    return res.json();
}

/**
 * Hall of Fame/Shame Types
 */
export interface InsightPlayer {
    puuid: string;
    gameName: string;
    tagLine: string;
    profileIconId: number;
    value: number | string;
    label: string;
    description?: string;
    matchId?: string;
    championName?: string;
    detail?: string;
    tier?: string; // Added tier
}

export interface UniqueFeat extends InsightPlayer {
    type: 'PENTA' | 'QUADRA' | 'PERFECT' | 'COMEBACK' | 'STOMP' | 'WIN_STREAK';
    date: Date; // Keep as Date or string depending on backend usage, let's use Date string usually
    skinId?: number;
}

export interface HallOfFameData {
    pentakilleiro: InsightPlayer | null;
    espanco: InsightPlayer | null;
    ministroEconomia: InsightPlayer | null;
    senhorDosDragoes: InsightPlayer | null;
    sniper: InsightPlayer | null;
    robo: InsightPlayer | null;
    // New
    demolidor: InsightPlayer | null;
    x1Raiz: InsightPlayer | null;
    anjoDaGuarda: InsightPlayer | null;
    donodoEarly: InsightPlayer | null;
    escalada: InsightPlayer | null;
    reiDaSelva: InsightPlayer | null;
    gigaChad: InsightPlayer | null;
    // Unique
    uniqueFeats: UniqueFeat[];
}

export interface HallOfShameData {
    topLoser: { gameName: string; profileIconId: number; pdlLoss: number } | null;
    aCarroca: { championName: string; count: number; winrate: number } | null;
    pacifista: InsightPlayer | null;
    alface: InsightPlayer | null;
    agronomo: InsightPlayer | null;
    cego: InsightPlayer | null;
    ilusionista: InsightPlayer | null;
    // New
    sonecaBaron: InsightPlayer | null;
    mataFofo: InsightPlayer | null;
    throwingStation: InsightPlayer | null;
    ifood: InsightPlayer | null;
    telaPreta: InsightPlayer | null;
    moedaBronze: InsightPlayer | null;
    finado: InsightPlayer | null;
}

/**
 * Get Hall of Fame
 */
/**
 * Get Hall of Fame
 */
export async function getHallOfFame(queue: 'SOLO' | 'FLEX' = 'SOLO', filters?: { start?: Date; end?: Date }): Promise<HallOfFameData> {
    let url = `${API_URL}/insights/fame?queue=${queue}`;
    if (filters?.start) url += `&startDate=${filters.start.toISOString()}`;
    if (filters?.end) url += `&endDate=${filters.end.toISOString()}`;

    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) throw new Error('Failed to fetch Hall of Fame');
    return res.json();
}

/**
 * Get Hall of Shame
 */
/**
 * Get Hall of Shame
 */
export async function getHallOfShame(queue: 'SOLO' | 'FLEX' = 'SOLO', filters?: { start?: Date; end?: Date }): Promise<HallOfShameData> {
    let url = `${API_URL}/insights/shame?queue=${queue}`;
    if (filters?.start) url += `&startDate=${filters.start.toISOString()}`;
    if (filters?.end) url += `&endDate=${filters.end.toISOString()}`;

    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) throw new Error('Failed to fetch Hall of Shame');
    return res.json();
}

/**
 * System Initialization (First Run)
 */
export async function getSystemInitStatus(): Promise<{ isFirstRun: boolean; playerCount: number }> {
    const res = await fetch(`${API_URL}/system/init-status`, { cache: 'no-store' });
    if (!res.ok) return { isFirstRun: false, playerCount: 999 }; // Default to safe state
    return res.json();
}

export async function initPlayers(players: { gameName: string; tagLine: string }[]): Promise<{ success: string[]; failed: string[] }> {
    const res = await fetch(`${API_URL}/system/init-players`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ players })
    });
    if (!res.ok) throw new Error('Failed to initialize players');
    return res.json();
}

/**
 * Global Matches & Highlights
 */
export async function getGlobalMatches(page: number = 1, limit: number = 20, filters?: { player?: string, lane?: string, queue?: string, champion?: string }) {
    let url = `${API_URL}/matches?page=${page}&limit=${limit}`;
    if (filters?.player) url += `&player=${filters.player}`;
    if (filters?.lane) url += `&lane=${filters.lane}`;
    if (filters?.queue) url += `&queue=${filters.queue}`;
    if (filters?.champion) url += `&champion=${filters.champion}`;

    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) throw new Error('Failed to fetch global matches');
    return res.json();
}

export async function getGlobalHighlights(period: 'DAILY' | 'WEEKLY' | 'MONTHLY' = 'DAILY', queue: string = 'SOLO') {
    const res = await fetch(`${API_URL}/matches/highlights?period=${period}&queue=${queue}`, { cache: 'no-store' });
    if (!res.ok) throw new Error('Failed to fetch highlights');
    return res.json();
}

/**
 * Community Feats & Duos
 */
export async function getCommunityFeats(period: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'GENERAL', queue: 'SOLO' | 'FLEX'): Promise<HallOfFameData> {
    let url = `${API_URL}/insights/fame?queue=${queue}`;

    if (period !== 'GENERAL') {
        const now = new Date();
        const start = new Date();
        start.setHours(0, 0, 0, 0); // Start of day logic usually better, but let's stick to simple

        if (period === 'DAILY') start.setDate(now.getDate() - 1); // Last 24h or Today? Usually implies "This Day" or "Last 24h".
        else if (period === 'WEEKLY') start.setDate(now.getDate() - 7);
        else if (period === 'MONTHLY') start.setMonth(now.getMonth() - 1);

        url += `&startDate=${start.toISOString()}&endDate=${now.toISOString()}`;
    }

    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) throw new Error('Failed to fetch feats');
    return res.json();
}

export async function getCommunityDuos(period: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'GENERAL', queue: 'SOLO' | 'FLEX') {
    const res = await fetch(`${API_URL}/insights/duos?period=${period}&queue=${queue}`, { cache: 'no-store' });
    if (!res.ok) throw new Error('Failed to fetch duos');
    return res.json();
}
