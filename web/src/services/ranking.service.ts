import { MatchDTO, Participant, calculateMatchScore, LAYER_WEIGHTS, metricScore } from "../engine/scoring.engine";
import { prisma } from '../lib/db';
import { RiotService } from './riot.service';
import { SEASON_CONFIG } from '../config/season';

export interface RankingEntry {
    rank: number;
    puuid: string;
    gameName: string;
    tagLine: string;
    // Identity
    profileIconId: number | null;
    summonerLevel: number | null;
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
    laneScores: Record<string, number>;
    laneStats?: Record<string, { games: number, wins: number }>;
    skin?: {
        name: string;
        splashUrl: string;
        loadingUrl: string;
    };
}
export class RankingService {
    private riotService?: RiotService;

    constructor(riotService?: RiotService) {
        this.riotService = riotService;
    }

    /**
     * Helper to get Start Date for a given period
     * Enforces Monday-Sunday logic for Weekly
     */
    /**
     * Helper to get Start Date for a given period
     * Enforces Monday-Sunday logic for Weekly in Brazil Time (UTC-3)
     */
    public getStartDateForPeriod(period: 'WEEKLY' | 'MONTHLY' | 'GENERAL'): Date {
        const now = new Date();
        // 1. Convert Current Time to Brazil Time to determine "Today" in Brazil
        // UTC-3
        const brazilOffset = -3 * 60; // minutes
        const nowInBrazil = new Date(now.getTime() + (brazilOffset * 60 * 1000) - (now.getTimezoneOffset() * 60 * 1000));
        // Note: The above formula (now + offset) creates a Date object that "looks" like Brazil time in UTC representation if printed.
        // Better approach: Work with UTC dates but shifted.

        // Correct Approach:
        // 1. Get current UTC time
        // 2. Subtract 3 hours
        // 3. Set hours to 00:00:00
        // 4. Add 3 hours back? No, we want the query to match >= StartTime.
        // If StartTime is "Monday 00:00 BRT", that is "Monday 03:00 UTC".

        // Correct Approach using UTC methods explicitly to avoid local node TZ confusion
        // 1. Get current UTC time
        // 2. Shift to "Brazil Hour" (UTC-3)
        // 3. Floor to Midnight
        // 4. Shift back to UTC (+3)

        const nowUtc = new Date(now.getTime()); // Clone
        const currentUtcHour = nowUtc.getUTCHours();
        const brazilHour = currentUtcHour - 3; // Might be negative, Date handles it

        const workingDate = new Date(nowUtc);
        workingDate.setUTCHours(brazilHour, 0, 0, 0);
        // workingDate is now "Today 00:00" or "Yesterday 00:00" effectively in pure UTC magnitude terms relative to Brazil... 
        // wait.
        // Easier: Just subtract 3 hours from timestamp, then floor to UTC midnight, then add 3h.

        const msInHour = 60 * 60 * 1000;
        const brazilTs = now.getTime() - (3 * msInHour);
        const brazilDate = new Date(brazilTs);
        brazilDate.setUTCHours(0, 0, 0, 0); // Floor to UTC midnight representing Brazil Midnight

        // Adjust for Weekly
        if (period === 'WEEKLY') {
            const day = brazilDate.getUTCDay(); // 0 (Sun) - 6 (Sat)
            const diff = day === 0 ? -6 : 1 - day;
            brazilDate.setUTCDate(brazilDate.getUTCDate() + diff);
        } else if (period === 'MONTHLY') {
            brazilDate.setUTCDate(1);
        } else {
            return new Date('2026-01-01T03:00:00.000Z');
        }

        // Add 3 hours back to get the UTC timestamp of Brazil Midnight
        return new Date(brazilDate.getTime() + (3 * msInHour));
    }

    /**
     * Get General Season Ranking
     * Aggregates MatchScores for all active players in a specific queue.
     * CRITICAL: Uses RankSnapshot for Tier/Rank, NOT Player model.
     */
    async getSeasonRanking(queueType: 'SOLO' | 'FLEX' = 'SOLO', limit: number = 100, startDate?: Date, endDate?: Date): Promise<RankingEntry[]> {
        // 1. Get Active Players (Include Masteries)
        const players = await prisma.player.findMany({
            where: { isActive: true },
            include: {
                masteries: {
                    orderBy: { championPoints: 'desc' },
                    take: 1
                }
            } as any
        });

        const ranking: RankingEntry[] = [];

        // 2. Aggregate Scores & Get Snapshot per Player
        for (const player of players) {

            // Get LATEST snapshot for this queue
            const snapshot = await prisma.rankSnapshot.findFirst({
                where: { playerId: player.puuid, queueType },
                orderBy: { createdAt: 'desc' }
            });

            const scoresRaw = await prisma.matchScore.findMany({
                where: {
                    playerId: player.puuid,
                    queueType: queueType
                },
                include: { match: { select: { gameCreation: true } } }
            });

            const scores = scoresRaw.filter(s => {
                if (!s.match?.gameCreation) return false;
                const d = new Date(s.match.gameCreation);
                if (startDate && d < startDate) return false;
                if (endDate && d > endDate) return false;
                return true;
            });

            if (startDate && scores.length > 0) {
                const first = (scores[0] as any).match.gameCreation;
                const last = (scores[scores.length - 1] as any).match.gameCreation;
                console.log(`[DEBUG] ${player.gameName}: Found ${scores.length} scores. Range: ${first} - ${last} | Filter: ${startDate.toISOString()}`);
            }

            // If no games and no rank, skip (unless we want to show all players in /players? Logic might differ)
            // For RANKING, we skip. For /players directory, we might want them.
            // But this method is 'getSeasonRanking'. Use strict rule.
            if (scores.length === 0 && !snapshot) continue;

            const totalScore = scores.reduce((acc, s) => acc + s.matchScore, 0);
            const avgScore = scores.length > 0 ? totalScore / scores.length : 0;
            const wins = scores.filter(s => s.isVictory).length;
            const losses = scores.length - wins;

            // Calculate Lane Scores & Stats
            const laneScores: Record<string, number> = {
                TOP: 0, JUNGLE: 0, MID: 0, BOT: 0, SUPPORT: 0
            };
            const laneStats: Record<string, { games: number, wins: number }> = {
                TOP: { games: 0, wins: 0 },
                JUNGLE: { games: 0, wins: 0 },
                MID: { games: 0, wins: 0 },
                BOT: { games: 0, wins: 0 },
                SUPPORT: { games: 0, wins: 0 }
            };

            scores.forEach(s => {
                let lane = s.lane || 'UNKNOWN';
                // Normalize Riot Terms
                if (lane === 'MIDDLE') lane = 'MID';
                if (lane === 'BOTTOM') lane = 'BOT';
                if (lane === 'UTILITY') lane = 'SUPPORT';

                // Accumulate if valid lane
                if (laneScores[lane] !== undefined) {
                    laneScores[lane] += s.matchScore;
                    laneStats[lane].games += 1;
                    if (s.isVictory) laneStats[lane].wins += 1;
                }
            });

            const masteries = (player as any).masteries;
            const mainChamp = masteries?.[0] ? {
                id: masteries[0].championId,
                name: masteries[0].championName,
                points: masteries[0].championPoints,
                level: masteries[0].championLevel
            } : undefined;

            ranking.push({
                rank: 0, // Assigned later
                puuid: player.puuid,
                gameName: player.gameName,
                tagLine: player.tagLine,
                profileIconId: player.profileIconId,
                summonerLevel: player.summonerLevel,
                tier: snapshot?.tier || 'UNRANKED',
                rankDivision: snapshot?.rank || '',
                lp: snapshot?.lp || 0,
                totalScore: Math.round(totalScore * 10) / 10,
                avgScore: Math.round(avgScore * 10) / 10,
                gamesUsed: scores.length,
                wins,
                losses,
                winRate: scores.length > 0 ? ((wins / scores.length) * 100).toFixed(1) + '%' : '0%',
                mainChampion: mainChamp,
                laneScores,
                laneStats
            });
        }

        // 3. Sort by Total Score (RiftScore rules)
        const sorted = ranking.sort((a, b) => b.totalScore - a.totalScore).slice(0, limit);

        // 4. Assign Rank and Enrich Top 1
        const results = sorted.map((entry, index) => ({
            ...entry,
            rank: index + 1
        }));

        // Enrich ALL players with Skin if RiotService is available
        if (results.length > 0 && this.riotService) {
            await Promise.all(results.map(async (player) => {
                if (player.mainChampion) {
                    const skin = await this.riotService!.getRandomSkin(player.mainChampion.name);
                    if (skin) {
                        player.skin = skin;
                    }
                }
            }));
        }

        if (results.length > 0) {
            console.log('[DEBUG] First Result LaneStats:', JSON.stringify((results[0] as any).laneStats));
        }

        return results;
    }

    /**
     * Get Ranking Filtered by Tier
     * CRITICAL: Uses RankSnapshot for Tier source.
     */
    async getRankingByElo(queueType: 'SOLO' | 'FLEX', tierFilter: string, limit: number = 100, startDate?: Date, endDate?: Date) {
        // Reuse getSeasonRanking logic because filtering *after* snapshot lookup is safer 
        // than complex join queries given current prisma schema.
        // It's not most efficient for 1M players but strictly correct for small scale.

        const fullRanking = await this.getSeasonRanking(queueType, 1000, startDate, endDate); // Get all relevant

        let filtered = fullRanking;
        if (tierFilter !== 'ALL') {
            filtered = fullRanking.filter(p => p.tier === tierFilter);
        }

        // Sort is already done in getSeasonRanking but slicing again
        return {
            tier: tierFilter,
            players: filtered.slice(0, limit).map((entry, index) => ({ ...entry, rank: index + 1 }))
        };
    }


    // ... existing interfaces ...

    /**
     * Get PDL Gain Ranking
     * PDL Gain = Current LP (normalized) - Initial LP (normalized)
     */
    async getPdlGainRanking(queueType: 'SOLO' | 'FLEX', limit: number = 20, startDate?: Date) {
        const players = await prisma.player.findMany({ where: { isActive: true } });
        const gains = [];

        for (const player of players) {
            // Build where clause
            const whereClause: any = { playerId: player.puuid, queueType };
            if (startDate) {
                whereClause.createdAt = { gte: startDate };
            }

            // Get Snapshots sorted by date
            const snapshots = await prisma.rankSnapshot.findMany({
                where: whereClause,
                orderBy: { createdAt: 'asc' }
            });

            if (snapshots.length === 0) continue;

            // Handle single snapshot case (New players or start of season tracking)
            const start = snapshots[0];
            const end = snapshots[snapshots.length - 1];

            // Normalize LP (Simple tier approximation)
            const getVal = (tier: string, rank: string, lp: number) => {
                const tierMap: any = { IRON: 0, BRONZE: 400, SILVER: 800, GOLD: 1200, PLATINUM: 1600, EMERALD: 2000, DIAMOND: 2400, MASTER: 2800, GRANDMASTER: 2800, CHALLENGER: 2800 };
                const rankMap: any = { 'IV': 0, 'III': 100, 'II': 200, 'I': 300 };
                const tierVal = tierMap[tier] || 0;
                const rankVal = rankMap[rank] || 0;
                // Master+ ignores rank division usually (it's just LP), but API might still return 'I'.
                // For simplicity, if Master+, just use Tier + LP (since LP can go > 400).
                if (tierVal >= 2800) {
                    return tierVal + lp;
                }
                return tierVal + rankVal + lp;
            };

            const startVal = getVal(start.tier, start.rank, start.lp);
            const endVal = getVal(end.tier, end.rank, end.lp);
            // If only 1 snapshot, start == end, so gain is 0. This is fine, at least they show up.
            const gain = endVal - startVal;

            gains.push({
                puuid: player.puuid,
                gameName: player.gameName,
                tagLine: player.tagLine,
                profileIconId: player.profileIconId, // Added
                startTier: start.tier,
                startRank: start.rank,
                startLp: start.lp,
                tier: end.tier,
                rank: end.rank,
                lp: end.lp,
                pdlGain: gain,
                trend: gain > 0 ? 'UP' : (gain < 0 ? 'DOWN' : 'SAME')
            });
        }

        return gains.sort((a, b) => b.pdlGain - a.pdlGain).slice(0, limit);
    }

    /**
     * Get Player History (Snapshots)
     * CORRECTED: Uses RankSnapshot for Tier source.
     */
    async getPlayerHistory(puuid: string, queueType: 'SOLO' | 'FLEX' = 'SOLO') {
        const player = await prisma.player.findUnique({
            where: { puuid },
            include: {
                masteries: {
                    orderBy: { championPoints: 'desc' },
                    take: 5
                }
            } as any
        });

        if (!player) return null;

        const history = await prisma.rankSnapshot.findMany({
            where: { playerId: puuid, queueType: queueType },
            orderBy: { createdAt: 'asc' }
        });

        // Use the LAST snapshot as the current state for this queue
        const currentSnapshot = history.length > 0 ? history[history.length - 1] : null;

        const masteries = await Promise.all((player as any).masteries?.map(async (m: any, index: number) => {
            let skin = null;
            // Fetch skin only for Top 3 to save resources/time (Visual Showcase)
            if (index < 3 && this.riotService) {
                skin = await this.riotService.getRandomSkin(m.championName);
            }
            return {
                championId: m.championId,
                championName: m.championName,
                level: m.championLevel,
                points: m.championPoints,
                skin
            };
        }) || []);

        return {
            player: {
                displayName: `${player.gameName} #${player.tagLine}`,
                // If no snapshot exists for this queue, default to UNRANKED/Empty
                tier: currentSnapshot?.tier || 'UNRANKED',
                rank: currentSnapshot?.rank || '',
                lp: currentSnapshot?.lp || 0,
                puuid: player.puuid,
                profileIconId: player.profileIconId,
                summonerLevel: player.summonerLevel
            },
            history: history.map(h => ({
                date: h.createdAt.toISOString(),
                tier: h.tier,
                rank: h.rank,
                lp: h.lp
            })),
            masteries
        };
    }

    /**
     * Get Player Insights & Stats
     */
    async getPlayerInsights(puuid: string, queueType: 'SOLO' | 'FLEX', page: number = 1, limit: number = 10, sortDir: 'asc' | 'desc' = 'desc', startDate?: Date, endDate?: Date) {
        const player = await prisma.player.findUnique({ where: { puuid } });
        if (!player) return null;

        // Date Filter Clause
        const dateFilter: any = {};
        if (startDate || endDate) {
            dateFilter.gameCreation = {};
            if (startDate) dateFilter.gameCreation.gte = startDate;
            if (endDate) dateFilter.gameCreation.lte = endDate;
        }

        // Count Total for Pagination
        const totalMatches = await prisma.matchScore.count({
            where: {
                playerId: puuid,
                queueType: queueType,
                match: dateFilter
            }
        });

        // Optimized Query with Pagination & Correct Sorting
        const scores: any[] = await prisma.matchScore.findMany({
            where: {
                playerId: puuid,
                queueType: queueType,
                match: dateFilter
            } as any,
            orderBy: {
                match: {
                    gameCreation: sortDir // Sort by Actual Game Date
                }
            },
            skip: (page - 1) * limit,
            take: limit,
            include: { match: true }
        });

        // Aggregation Query (All Time OR Filtered)
        const aggregations = await prisma.matchScore.aggregate({
            where: {
                playerId: puuid,
                queueType: queueType,
                match: dateFilter
            } as any,
            _avg: {
                matchScore: true,
                kills: true,
                deaths: true,
                assists: true,
                performanceScore: true,
                objectivesScore: true,
                disciplineScore: true
            },
            _sum: { kills: true, deaths: true, assists: true },
            _max: { matchScore: true },
            _min: { matchScore: true },
        });

        const wins = await prisma.matchScore.count({
            where: {
                playerId: puuid,
                queueType: queueType,
                isVictory: true,
                match: dateFilter
            } as any
        });

        // KDA Calc (Total)
        const totalK = aggregations._sum.kills || 0;
        const totalD = aggregations._sum.deaths || 0;
        const totalA = aggregations._sum.assists || 0;
        const avgKda = totalD === 0 ? (totalK + totalA) : ((totalK + totalA) / totalD).toFixed(2);
        const winRate = totalMatches > 0 ? ((wins / totalMatches) * 100).toFixed(1) : "0.0";

        // Enhanced Match History Map (Paginated)
        const matchHistory = scores.map(s => {
            const metrics = s.metrics as any;
            return {
                matchId: s.matchId,
                date: s.match.gameCreation,
                lane: s.lane,
                isVictory: s.isVictory,
                score: s.matchScore,
                performanceScore: s.performanceScore,
                objectivesScore: s.objectivesScore,
                disciplineScore: s.disciplineScore,
                kills: s.kills,
                deaths: s.deaths,
                assists: s.assists,
                kda: `${s.kills}/${s.deaths}/${s.assists}`,
                championName: s.championName || 'Unknown',
                championId: s.championId,
                cs: (metrics?.totalMinionsKilled || 0) + (metrics?.neutralMinionsKilled || 0),
                gold: metrics?.goldEarned || 0,
                damage: metrics?.totalDamageDealtToChampions || metrics?.totalDamage || 0,
                duration: s.match.gameDuration || 0
            };
        });

        // --- Period Report Calculation (Dynamic) ---
        // If filters are present, use them. If not, default to Weekly for the "card" context?
        // Actually, let's behave as:
        // - If NO filters: Defaults to "Season/All Time" stats in the top cards, but for the "Period Report Card" we might want Weekly default.
        // - HOWEVER, the user asked for filters to change EVERYTHING.
        // - So "WeeklyReport" should really be "PeriodReport".

        // Logic:
        // Use the EXACT same filters as above for the "Period Report".
        // But we need to calculate PDL Delta for this period.

        // 1. Matches (Already have totals from above aggregation/count)
        const periodWins = wins;
        const periodLosses = totalMatches - wins;
        const periodTotal = totalMatches;
        const periodWr = winRate; // Already calculated correctly for the filtered period

        // 2. PDL Delta for the Period
        const getVal = (tier: string, rank: string, lp: number) => {
            const tierMap: any = { IRON: 0, BRONZE: 400, SILVER: 800, GOLD: 1200, PLATINUM: 1600, EMERALD: 2000, DIAMOND: 2400, MASTER: 2800, GRANDMASTER: 2800, CHALLENGER: 2800 };
            const rankMap: any = { 'IV': 0, 'III': 100, 'II': 200, 'I': 300, '': 0 };
            const tierVal = tierMap[tier] || 0;
            const rankVal = rankMap[rank] || 0;
            if (tierVal >= 2800) return tierVal + lp;
            return tierVal + rankVal + lp;
        };

        // Determine Start and End Snapshots based on Filters or Default
        // If startDate is provided, we compare Snapshot@StartDate vs Snapshot@EndDate/Now
        // If NO startDate, we fall back to "Start of Week" IF we want default weekly behavior?
        // User said: "ao selecionar o filtro todos os dados sejam alterados para o filtro".
        // If filter is ALL, PDL Delta is Current - Season Start? Or 0?
        // Let's assume if NO/ALL filter, we show Season Delta (Start vs Current).

        let queryStart = startDate;
        if (!queryStart && !endDate) {
            // If completely empty (ALL), use VERY OLD date to capture Season Start
            // Or explicitly handle "Season Evolution".
            // For "Period Report Card", if ALL is selected, maybe we show Season stats?
            queryStart = new Date('2024-01-01'); // Safe past
        }

        // Find snapshot closest to Start (or before it)
        const baselineSnapshot = await prisma.rankSnapshot.findFirst({
            where: { playerId: puuid, queueType, createdAt: { lte: queryStart || new Date() } },
            orderBy: { createdAt: 'desc' }
        }) || await prisma.rankSnapshot.findFirst({
            // Fallback: If no snapshot BEFORE start, take the FIRST one AFTER start
            where: { playerId: puuid, queueType, createdAt: { gte: queryStart || new Date('2020-01-01') } },
            orderBy: { createdAt: 'asc' }
        });

        // Find snapshot at End (or current)
        const currentSnapshot = await prisma.rankSnapshot.findFirst({
            where: {
                playerId: puuid,
                queueType,
                createdAt: endDate ? { lte: endDate } : undefined
            },
            orderBy: { createdAt: 'desc' }
        });

        let pdlDelta = 0;
        if (baselineSnapshot && currentSnapshot) {
            const startVal = getVal(baselineSnapshot.tier, baselineSnapshot.rank, baselineSnapshot.lp);
            const endVal = getVal(currentSnapshot.tier, currentSnapshot.rank, currentSnapshot.lp);
            pdlDelta = endVal - startVal;
        }

        // Playstyle Logic
        let vision = 0;
        let farm = 0;
        let survivability = 0;

        if (scores.length > 0) {
            // Vision (Using VSPM from history as proxy)
            // Target: 2.0 VSPM = 100
            const totalVspm = scores.reduce((acc, m) => acc + ((m.metrics as any)?.vspm || 0), 0);
            const avgVspm = totalVspm / scores.length;
            vision = Math.min(100, Math.round((avgVspm / 2.0) * 100));

            // Farm (Using CSPM)
            // Target: 10.0 CSPM = 100
            const totalCspm = scores.reduce((acc, m) => acc + ((m.metrics as any)?.cspm || 0), 0);
            const avgCspm = totalCspm / scores.length;
            farm = Math.min(100, Math.round((avgCspm / 10.0) * 100));

            // Survivability (Using Avg Deaths)
            // Baseline: 0 deaths = 100, 8 deaths = 20.
            const avgDeaths = aggregations._avg.deaths || 0;
            survivability = Math.max(0, Math.round(100 - (avgDeaths * 10)));
        }

        return {
            stats: {
                avgScore: (aggregations._avg.matchScore || 0).toFixed(1),
                winRate: `${winRate}%`,
                totalGames: totalMatches,
                avgKda,
                bestScore: aggregations._max.matchScore ?? 0,
                worstScore: aggregations._min.matchScore ?? 0
            },
            history: matchHistory,
            pagination: {
                page,
                limit,
                total: totalMatches,
                totalPages: Math.ceil(totalMatches / limit)
            },
            insights: {
                consistency: 'Alta', // Placeholder
                trend: pdlDelta > 0 ? 'UP' : 'DOWN'
            },
            // NEW: Backend Source of Truth
            weeklyReport: {
                wins: periodWins,
                losses: periodLosses,
                total: periodTotal,
                winRate: periodWr, // String with %
                pdlDelta
            },
            playstyle: {
                combat: Math.min(100, Math.round(((aggregations._avg.performanceScore || 0) / 60) * 100)),
                objectives: Math.min(100, Math.round(((aggregations._avg.objectivesScore || 0) / 30) * 100)),
                vision,
                farm,
                survivability
            }
        };
    }

    private normalizeLane(lane: string): string {
        const l = lane.toUpperCase();
        if (l.includes('JUNGLE') || l === 'JUNGLE') return 'JUNGLE';
        if (l.includes('MID') || l === 'MIDDLE') return 'MIDDLE';
        if (l.includes('TOP')) return 'TOP';
        if (l.includes('BOT') || l === 'BOTTOM') return 'BOTTOM';
        if (l.includes('SUP') || l === 'UTILITY') return 'UTILITY';
        return 'UNKNOWN';
    }

    /**
     * Get Aggregated Player Stats (Detailed)
     */
    async getPlayerDetailedStats(puuid: string, queueType: 'SOLO' | 'FLEX' | 'BOTH', startDate?: Date, endDate?: Date) {
        const dateFilter: any = {};
        if (startDate || endDate) {
            dateFilter.gameCreation = {};
            if (startDate) dateFilter.gameCreation.gte = startDate;
            if (endDate) dateFilter.gameCreation.lte = endDate;
        }

        const queueFilter = queueType === 'BOTH' ? {} : { queueType };

        // Fetch Scores
        // Using include to get Match context and teammates (scores of other players in same match)
        const scores = await prisma.matchScore.findMany({
            where: {
                playerId: puuid,
                ...queueFilter,
                match: dateFilter
            } as any,
            include: {
                match: {
                    include: {
                        scores: {
                            include: { player: true } // For Teammates
                        }
                    }
                }
            }
        });

        const totalGames = scores.length;
        if (totalGames === 0) return null;

        // Aggregators
        // Use Set to count unique champions across all games before filtering top 10
        const uniqueChampions = new Set<string>();

        // FETCH GLOBAL MATCHUPS (Separate from Period Filter)
        const matchupScores = await prisma.matchScore.findMany({
            where: {
                playerId: puuid,
                ...queueFilter,
                match: {
                    gameCreation: {
                        gte: new Date(SEASON_CONFIG.START_DATE) // Always fetch from Season Start for Matchups
                    }
                }
            } as any,
            select: { opponentChampionName: true, isVictory: true }
        });

        const championStats: Record<string, any> = {};
        const laneStats: Record<string, any> = {};
        const teammateStats: Record<string, any> = {};
        const queueStats: Record<string, any> = { SOLO: { games: 0, wins: 0 }, FLEX: { games: 0, wins: 0 } };

        scores.forEach(s => {
            const isWin = s.isVictory;
            const q = s.queueType;
            const cid = s.championName || 'Unknown';
            uniqueChampions.add(cid);

            // Queue Split
            if (queueStats[q]) {
                queueStats[q].games++;
                if (isWin) queueStats[q].wins++;
            }

            // Champion
            if (!championStats[cid]) championStats[cid] = {
                name: cid, games: 0, wins: 0,
                soloGames: 0, soloWins: 0, flexGames: 0, flexWins: 0,
                curKills: 0, curDeaths: 0, curAssists: 0
            };
            championStats[cid].games++;
            if (isWin) championStats[cid].wins++;
            if (q === 'SOLO') {
                championStats[cid].soloGames++;
                if (isWin) championStats[cid].soloWins++;
            } else if (q === 'FLEX') {
                championStats[cid].flexGames++;
                if (isWin) championStats[cid].flexWins++;
            }
            championStats[cid].curKills += s.kills;
            championStats[cid].curDeaths += s.deaths;
            championStats[cid].curAssists += s.assists;

            // Lane
            const rawLane = s.lane || 'UNKNOWN';
            const lane = this.normalizeLane(rawLane);

            if (!laneStats[lane]) laneStats[lane] = {
                lane, games: 0, wins: 0,
                soloGames: 0, soloWins: 0, flexGames: 0, flexWins: 0
            };
            laneStats[lane].games++;
            if (isWin) laneStats[lane].wins++;
            if (q === 'SOLO') {
                laneStats[lane].soloGames++;
                if (isWin) laneStats[lane].soloWins++;
            } else if (q === 'FLEX') {
                laneStats[lane].flexGames++;
                if (isWin) laneStats[lane].flexWins++;
            }

            // Teammates (Tracked Players only)
            // Filter match.scores where participant != me AND isVictory == myVictory (Same Team)
            if (s.match && s.match.scores) {
                s.match.scores.forEach(teammate => {
                    if (teammate.playerId === puuid) return;
                    if (teammate.isVictory !== isWin) return; // Opposite team

                    const tpid = teammate.playerId;
                    if (!teammateStats[tpid]) teammateStats[tpid] = {
                        player: teammate.player,
                        games: 0, wins: 0
                    };
                    teammateStats[tpid].games++;
                    if (isWin) teammateStats[tpid].wins++;
                });
            }
        });

        // Format
        const formatStats = (obj: any, minGames = 1) => Object.values(obj)
            .filter((x: any) => x.games >= minGames)
            .map((x: any) => ({
                ...x,
                winRate: ((x.wins / x.games) * 100).toFixed(1),
                soloWr: x.soloGames > 0 ? ((x.soloWins / x.soloGames) * 100).toFixed(1) : "0.0",
                flexWr: x.flexGames > 0 ? ((x.flexWins / x.flexGames) * 100).toFixed(1) : "0.0"
            }));

        const champions = formatStats(championStats).map((c: any) => ({
            ...c,
            kda: c.curDeaths === 0 ? (c.curKills + c.curAssists).toFixed(2) : ((c.curKills + c.curAssists) / c.curDeaths).toFixed(2)
        })).sort((a: any, b: any) => b.games - a.games).slice(0, 10);

        const lanes = formatStats(laneStats).sort((a: any, b: any) => b.games - a.games);

        const teammates = formatStats(teammateStats).sort((a: any, b: any) => b.games - a.games).slice(0, 10);

        // Calculate Playstyle Metrics (Avg for Period)
        const totalPerformance = scores.reduce((acc, s) => acc + s.performanceScore, 0);
        const totalObjectives = scores.reduce((acc, s) => acc + s.objectivesScore, 0);
        const totalVspm = scores.reduce((acc, s) => acc + ((s.metrics as any)?.vspm || 0), 0);
        const totalCspm = scores.reduce((acc, s) => acc + ((s.metrics as any)?.cspm || 0), 0);
        const totalDeaths = scores.reduce((acc, s) => acc + s.deaths, 0);

        const count = scores.length || 1;
        const avgPerformance = totalPerformance / count;
        const avgObjectives = totalObjectives / count;
        const avgVspm = totalVspm / count;
        const avgCspm = totalCspm / count;
        const avgDeaths = totalDeaths / count;

        // Activity Aggregation (UTC-3 for Brazil)
        const activity = { hour: {} as any, day: {} as any };
        for (let i = 0; i < 24; i++) activity.hour[i] = { games: 0, wins: 0 };
        for (let i = 0; i < 7; i++) activity.day[i] = { games: 0, wins: 0 };

        scores.forEach(s => {
            if (s.match && s.match.gameCreation) {
                const date = new Date(s.match.gameCreation);
                // Brazil UTC-3 Adjustment
                let h = date.getUTCHours() - 3;
                if (h < 0) h += 24;
                const d = date.getUTCDay();

                if (activity.hour[h]) {
                    activity.hour[h].games++;
                    if (s.isVictory) activity.hour[h].wins++;
                }
                if (activity.day[d]) {
                    activity.day[d].games++;
                    if (s.isVictory) activity.day[d].wins++;
                }
            }
        });

        // Duration Analysis (<25, 25-30, 30-35, 35+)
        const duration = {
            short: { games: 0, wins: 0 },
            medium: { games: 0, wins: 0 },
            long: { games: 0, wins: 0 },
            extra: { games: 0, wins: 0 }
        };

        scores.forEach(s => {
            if (s.match && s.match.gameDuration) {
                const min = s.match.gameDuration / 60;
                if (min < 25) {
                    duration.short.games++;
                    if (s.isVictory) duration.short.wins++;
                } else if (min < 30) {
                    duration.medium.games++;
                    if (s.isVictory) duration.medium.wins++;
                } else if (min < 35) {
                    duration.long.games++;
                    if (s.isVictory) duration.long.wins++;
                } else {
                    duration.extra.games++;
                    if (s.isVictory) duration.extra.wins++;
                }
            }
        });

        // Matchup Analysis (Using ALL TIME / SEASON data)
        const matchupsObj: Record<string, { games: number, wins: number, name: string }> = {};
        matchupScores.forEach(s => {
            const oppName = s.opponentChampionName;
            // Only count if opponent is known and valid
            if (oppName && oppName !== 'Unknown') {
                if (!matchupsObj[oppName]) matchupsObj[oppName] = { games: 0, wins: 0, name: oppName };
                matchupsObj[oppName].games++;
                if (s.isVictory) matchupsObj[oppName].wins++;
            }
        });

        const allMatchups = Object.values(matchupsObj)
            .map(m => ({ ...m, winRate: Math.round((m.wins / m.games) * 100) }));

        // Filter min 2 games to reduce noise
        const meaningfulMatchups = allMatchups.filter(m => m.games >= (matchupScores.length < 20 ? 1 : 2));

        // STRICT SEPARATION: Best (>50%) vs Worst (<=50%)
        const bestMatchups = meaningfulMatchups
            .filter(m => m.winRate > 50)
            .sort((a, b) => b.winRate - a.winRate || b.games - a.games)
            .slice(0, 3);

        const worstMatchups = meaningfulMatchups
            .filter(m => m.winRate <= 50)
            .sort((a, b) => a.winRate - b.winRate || b.games - a.games)
            .slice(0, 3);

        // Trophy Room (Multikills & Feats)
        const trophies = {
            penta: 0,
            quadra: 0,
            triple: 0,
            epicSteals: 0
        };

        scores.forEach(s => {
            const m = s.metrics as any;
            if (m) {
                trophies.penta += m.pentaKills || 0;
                trophies.quadra += m.quadraKills || 0;
                trophies.triple += m.tripleKills || 0;
                trophies.epicSteals += m.objectivesStolen || 0;
            }
        });

        const playstyle = {
            combat: Math.min(100, Math.round((avgPerformance / 60) * 100)),
            objectives: Math.min(100, Math.round((avgObjectives / 30) * 100)),
            vision: Math.min(100, Math.round((avgVspm / 2.0) * 100)),
            farm: Math.min(100, Math.round((avgCspm / 10.0) * 100)),
            survivability: Math.max(0, Math.round(100 - (avgDeaths * 10)))
        };

        return {
            totalGames: scores.length,
            totalChampions: uniqueChampions.size,
            wins: scores.filter(s => s.isVictory).length,
            winRate: ((scores.filter(s => s.isVictory).length / totalGames) * 100).toFixed(1),
            playstyle,
            activity,
            duration,
            matchups: { best: bestMatchups, worst: worstMatchups },
            trophies,
            champions,
            lanes,
            teammates,
            comparison: {
                solo: { ...queueStats.SOLO, winRate: queueStats.SOLO.games > 0 ? ((queueStats.SOLO.wins / queueStats.SOLO.games) * 100).toFixed(1) : "0.0" },
                flex: { ...queueStats.FLEX, winRate: queueStats.FLEX.games > 0 ? ((queueStats.FLEX.wins / queueStats.FLEX.games) * 100).toFixed(1) : "0.0" }
            }
        };
    }

    /**
     * Get Weekly Highlights
     * Returns: Top KDA, Most Games, Best Support, Highest Dmg
     */
    /**
     * Get Highlights (Weekly or Monthly)
     * Returns: Top KDA, Most Games, Best Support, Highest Dmg, Survivor
     */
    async getHighlights(queueType: 'SOLO' | 'FLEX' = 'SOLO', startDate?: Date, endDate?: Date) {
        // Default to season start if no start provided
        const finalStartDate = startDate || new Date('2026-01-01');
        // Default to now if no end provided
        const finalEndDate = endDate || new Date();

        let periodLabel = 'Personalizado';
        // Auto-labeling could be done here based on diff, but frontend usually handles labels better or we pass it in.
        // For now, simple label.
        if (!startDate) periodLabel = 'Geral (Season)';

        let stomper: any = null;

        // 1. Fetch all scores for this period
        const scores = await prisma.matchScore.findMany({
            where: {
                queueType: queueType,
                match: {
                    gameCreation: {
                        gte: finalStartDate,
                        lte: finalEndDate
                    }
                }
            } as any,
            include: { player: true, match: true }
        });

        if (scores.length === 0) return null;

        // 2. Group by Player
        const playerStats: Record<string, {
            player: any,
            games: number,
            wins: number,
            totalScore: number,
            kills: number,
            deaths: number,
            assists: number,
            totalDmg: number,
            totalVision: number,
            totalGpm: number,
            totalCspm: number,
            totalObjectives: number, // New
            champions: Record<number, { count: number, name: string }>, // New for Mono/Versatility
            maxDmg: number // New for Highest Damage Record
        }> = {};

        scores.forEach((s: any) => {
            if (!playerStats[s.playerId]) {
                playerStats[s.playerId] = {
                    player: s.player,
                    games: 0, wins: 0, totalScore: 0,
                    kills: 0, deaths: 0, assists: 0,
                    totalDmg: 0, totalVision: 0,
                    totalGpm: 0, totalCspm: 0,
                    totalObjectives: 0,
                    champions: {},
                    maxDmg: 0
                };
            }
            const p = playerStats[s.playerId];
            p.games++;
            p.totalScore += (s.matchScore || 0);
            if (s.isVictory) p.wins++;
            p.kills += (s.kills || 0);
            p.deaths += (s.deaths || 0);
            p.assists += (s.assists || 0);

            const metrics = s.metrics as any;

            const durationMin = (s.match?.gameDuration || 0) / 60;
            const dpm = metrics?.dpm || 0;
            const dmg = dpm * durationMin;

            p.totalDmg += dmg;
            if (dmg > p.maxDmg) p.maxDmg = dmg; // Track Max Single Game Damage

            p.totalVision += (metrics?.vspm || 0);
            p.totalGpm += (metrics?.gpm || 0);
            p.totalCspm += (metrics?.cspm || 0);
            p.totalObjectives += (s.objectivesScore || 0);

            // Track Champions
            if (s.championId) {
                if (!p.champions[s.championId]) {
                    p.champions[s.championId] = { count: 0, name: s.championName || 'Unknown' };
                }
                p.champions[s.championId].count++;
            }
        });

        const statsArray = Object.values(playerStats);

        // Dynamic Min Games based on duration
        const dayDiff = (finalEndDate.getTime() - finalStartDate.getTime()) / (1000 * 3600 * 24);
        const minGames = dayDiff <= 7 ? 2 : (dayDiff <= 31 ? 5 : 10);

        const validStats = statsArray.filter(s => s.games >= minGames);

        // 3. Calculate Highlights

        // A) MVP
        const mvp = validStats.sort((a, b) => (b.totalScore / b.games) - (a.totalScore / a.games))[0];

        // B) KDA King
        const kdaKing = validStats.sort((a, b) => {
            const kdaA = a.deaths === 0 ? (a.kills + a.assists) : (a.kills + a.assists) / a.deaths;
            const kdaB = b.deaths === 0 ? (b.kills + b.assists) : (b.kills + b.assists) / b.deaths;
            return kdaB - kdaA;
        })[0];

        // C) Most Active
        const mostActive = statsArray.sort((a, b) => b.games - a.games)[0];

        // D) Highest Damage (SINGLE MATCH RECORD)
        const highestDmg = validStats.sort((a, b) => b.maxDmg - a.maxDmg)[0];

        // E) Survivor
        const survivor = validStats.sort((a, b) => (a.deaths / a.games) - (b.deaths / b.games))[0];

        // F) Visionary
        const visionary = validStats.sort((a, b) => (b.totalVision / b.games) - (a.totalVision / a.games))[0];

        // G) LP Machine
        const pdlRanking = await this.getPdlGainRanking(queueType, 1, startDate);
        const lpMachineData = pdlRanking.length > 0 ? pdlRanking[0] : null;

        let lpMachine = null;
        if (lpMachineData) {
            const p = await prisma.player.findUnique({ where: { puuid: lpMachineData.puuid } });
            if (p) {
                lpMachine = { ...p, value: `+${lpMachineData.pdlGain}`, label: 'PDL Ganho' };
            }
        }

        // H) Stomper
        const fastestMatch = await prisma.matchScore.findFirst({
            where: {
                queueType: queueType,
                createdAt: { gte: startDate },
                isVictory: true
            } as any,
            orderBy: { match: { gameDuration: 'asc' } },
            include: { player: true, match: true }
        });

        if (fastestMatch) {
            const durationMin = Math.floor(fastestMatch.match.gameDuration / 60);
            const durationSec = fastestMatch.match.gameDuration % 60;
            stomper = { ...fastestMatch.player, value: `${durationMin}m ${durationSec}s`, label: 'Vitória Mais Rápida' };
        }

        // I) Best Score
        const bestScoreMatch = await prisma.matchScore.findFirst({
            where: { queueType: queueType, createdAt: { gte: startDate } } as any,
            orderBy: { matchScore: 'desc' },
            include: { player: true }
        });
        let highestScore = bestScoreMatch ? { ...bestScoreMatch.player, value: bestScoreMatch.matchScore, label: 'Maior Pontuação' } : null;

        // J) Mono (One Trick)
        let mono = null;
        const monoCandidates = validStats.map(s => {
            const sortedChamps = Object.values(s.champions).sort((a, b) => b.count - a.count);
            const mainFn = sortedChamps[0];
            return {
                player: s.player,
                topChamp: mainFn,
                games: s.games,
                percentage: mainFn ? (mainFn.count / s.games) : 0
            };
        }).filter(c => c.topChamp && c.games >= minGames);

        // Sort by Count of games on top champion (Dedication)
        const monoWinner = monoCandidates.sort((a, b) => b.topChamp.count - a.topChamp.count)[0];
        if (monoWinner) {
            mono = {
                ...monoWinner.player,
                value: monoWinner.topChamp.count,
                label: 'Partidas (Mono)',
                championName: monoWinner.topChamp.name
            };
        }

        // K) Champion Ocean (Versatility)
        let ocean = null;
        const oceanWinner = validStats.sort((a, b) => Object.keys(b.champions).length - Object.keys(a.champions).length)[0];
        if (oceanWinner) {
            ocean = {
                ...oceanWinner.player,
                value: Object.keys(oceanWinner.champions).length,
                label: 'Campeões Únicos'
            };
        }

        // L) Objective Control
        let objective = null;
        const objWinner = validStats.sort((a, b) => (b.totalObjectives / b.games) - (a.totalObjectives / a.games))[0];
        if (objWinner) {
            objective = {
                ...objWinner.player,
                value: (objWinner.totalObjectives / objWinner.games).toFixed(0),
                label: 'Pts Objetivos'
            };
        }

        return {
            period: { start: finalStartDate.toISOString(), end: finalEndDate.toISOString() },
            periodLabel,

            mvp: mvp ? { ...mvp.player, value: (mvp.totalScore / mvp.games).toFixed(1), label: 'Pontos/Jogo' } : null,
            kdaKing: kdaKing ? { ...kdaKing.player, value: ((kdaKing.kills + kdaKing.assists) / (kdaKing.deaths || 1)).toFixed(2), label: 'KDA' } : null,
            mostActive: mostActive ? { ...mostActive.player, value: mostActive.games, label: 'Partidas' } : null,
            highestDmg: highestDmg ? { ...highestDmg.player, value: Number(highestDmg.maxDmg).toFixed(0), label: 'Dano (Recorde)' } : null,
            survivor: survivor ? { ...survivor.player, value: (survivor.deaths / survivor.games).toFixed(1), label: 'Mortes/Jogo' } : null,
            visionary: visionary ? { ...visionary.player, value: (visionary.totalVision / visionary.games).toFixed(1), label: 'Visão/Min' } : null,
            rich: validStats.sort((a, b) => (b.totalGpm / b.games) - (a.totalGpm / a.games))[0] ? {
                ...validStats.sort((a, b) => (b.totalGpm / b.games) - (a.totalGpm / a.games))[0].player,
                value: (validStats.sort((a, b) => (b.totalGpm / b.games) - (a.totalGpm / a.games))[0].totalGpm / validStats.sort((a, b) => (b.totalGpm / b.games) - (a.totalGpm / a.games))[0].games).toFixed(0),
                label: 'Ouro/Min'
            } : null,
            farmer: validStats.sort((a, b) => (b.totalCspm / b.games) - (a.totalCspm / a.games))[0] ? {
                ...validStats.sort((a, b) => (b.totalCspm / b.games) - (a.totalCspm / a.games))[0].player,
                value: (validStats.sort((a, b) => (b.totalCspm / b.games) - (a.totalCspm / a.games))[0].totalCspm / validStats.sort((a, b) => (b.totalCspm / b.games) - (a.totalCspm / a.games))[0].games).toFixed(1),
                label: 'CS/Min'
            } : null,
            stomper: stomper,
            lpMachine: lpMachine ? { ...lpMachine } : null,
            highestScore: highestScore,

            // New
            mono,
            ocean,
            objective
        };
    }

    /**
     * Get System Update Status
     */
    async getSystemStatus() {
        const lastUpdateState = await prisma.systemState.findUnique({
            where: { key: 'LAST_UPDATE' }
        });

        const lastUpdate = lastUpdateState?.value ? new Date(lastUpdateState.value) : null;
        let nextUpdate = null;

        if (lastUpdate) {
            // Next update is 5 minutes after last
            nextUpdate = new Date(lastUpdate.getTime() + 5 * 60 * 1000);
        }

        return {
            lastUpdate: lastUpdate?.toISOString() || null,
            nextUpdate: nextUpdate?.toISOString() || null
        };
    }

    /**
     * Get PDL Evolution (Start vs Current for Season)
     */
    async getPdlEvolution(puuid: string, queueType: 'SOLO' | 'FLEX' = 'SOLO') {
        const snapshots = await prisma.rankSnapshot.findMany({
            where: { playerId: puuid, queueType },
            orderBy: { createdAt: 'asc' }
        });

        if (snapshots.length === 0) return null;

        const start = snapshots[0];
        const current = snapshots[snapshots.length - 1];

        // Normalize LP
        const getVal = (tier: string, lp: number) => {
            const map: any = { IRON: 0, BRONZE: 400, SILVER: 800, GOLD: 1200, PLATINUM: 1600, EMERALD: 2000, DIAMOND: 2400, MASTER: 2800, GRANDMASTER: 2800, CHALLENGER: 2800 };
            return (map[tier] || 0) + lp;
        };

        const startVal = getVal(start.tier, start.lp);
        const currentVal = getVal(current.tier, current.lp);
        const gain = currentVal - startVal;

        return {
            start: { tier: start.tier, rank: start.rank, lp: start.lp, date: start.createdAt },
            current: { tier: current.tier, rank: current.rank, lp: current.lp, date: current.createdAt },
            gain,
            gainLabel: gain > 0 ? `+${gain} LP` : `${gain} LP`
        };
    }

    /**
     * Get System Initialization Status
     * Checks if there are any players in the database.
     */
    async getSystemInitStatus() {
        const count = await prisma.player.count();
        return {
            isFirstRun: count === 0,
            playerCount: count
        };
    }

    /**
     * Bulk Add Players (First Run)
     */
    async bulkAddPlayers(playersInput: { gameName: string; tagLine: string }[]) {
        const results = {
            success: [] as string[],
            failed: [] as string[]
        };

        if (!this.riotService) {
            throw new Error('RiotService not initialized');
        }

        for (const input of playersInput) {
            try {
                // 1. Resolve Account
                const account = await this.riotService.getAccountByRiotId(input.gameName, input.tagLine);

                // 2. Create/Update Player
                let player = await prisma.player.upsert({
                    where: { puuid: account.puuid },
                    update: {
                        gameName: account.gameName,
                        tagLine: account.tagLine,
                        isActive: true,
                        updatedAt: new Date()
                    },
                    create: {
                        puuid: account.puuid,
                        gameName: account.gameName,
                        tagLine: account.tagLine,
                        displayName: `${account.gameName} #${account.tagLine}`,
                        isActive: true
                    }
                });

                // 3. Lightweight Sync Summoner Info (Icon & Level)
                try {
                    const summoner = await this.riotService.getSummonerByPuuid(player.puuid);
                    player = await prisma.player.update({
                        where: { puuid: player.puuid },
                        data: {
                            profileIconId: summoner.profileIconId,
                            summonerLevel: summoner.summonerLevel
                        }
                    });
                } catch (e: any) {
                    console.warn(`[RankingService] Failed to sync summoner info for ${account.gameName}: ${e.message}`);
                }

                // 4. Lightweight Sync Ranks (Tier & LP)
                try {
                    const leagues = await this.riotService.getLeagueEntriesByPuuid(player.puuid);
                    for (const entry of leagues) {
                        const queueMap: any = { RANKED_SOLO_5x5: 'SOLO', RANKED_FLEX_SR: 'FLEX' };
                        const qType = queueMap[entry.queueType];
                        if (!qType) continue;

                        await prisma.rankSnapshot.create({
                            data: {
                                playerId: player.puuid,
                                queueType: qType,
                                tier: entry.tier,
                                rank: entry.rank,
                                lp: entry.leaguePoints
                            }
                        });

                        if (qType === 'SOLO') {
                            player = await prisma.player.update({
                                where: { puuid: player.puuid },
                                data: { tier: entry.tier, rank: entry.rank }
                            });
                        }
                    }
                } catch (e: any) {
                    console.warn(`[RankingService] Failed to sync ranks for ${account.gameName}: ${e.message}`);
                }

                results.success.push(`${account.gameName} #${account.tagLine}`);
            } catch (error) {
                console.error(`[RankingService] Failed to add ${input.gameName} #${input.tagLine}`, error);
                results.failed.push(`${input.gameName} #${input.tagLine}`);
            }
        }

        return results;
    }

    /**
     * Hall of Fame (Season Records)
     * - Pentakills (Sum)
     * - Stomper (Highest KDA in a single game)
     * - Farm Machine (Highest CSPM in a single game)
     */
    /**
     * Hall of Fame (Season Records)
     * - Objective King (Objectives Weighted)
     * - Lane Bully (Gold/XP Diff @ 15)
     * - Teamfight Maestro (KP % in Teamfights)
     * - Damage Efficient (Dmg / Gold)
     * - Consistency Machine (Low StdDev)
     * - Penta King (Existing)
     * - Stomper (Existing)
     * - Farm Machine (Existing)
     */
    async getHallOfFame(queueType: 'SOLO' | 'FLEX' = 'SOLO', startDate?: Date, endDate?: Date) {
        const start = startDate || new Date('2024-01-01');
        const end = endDate || new Date();

        const scores = await prisma.matchScore.findMany({
            where: {
                queueType: queueType,
                match: { gameCreation: { gte: start, lte: end } }
            } as any,
            include: { player: true, match: true },
            orderBy: { match: { gameCreation: 'asc' } }
        });

        // Track Win Streaks


        // 1. Aggregations (Pentas, Consistency)
        const playerStats: Record<string, {
            player: any,
            pentaCount: number,
            scores: number[],
            games: number,
            wins: number,
            uniqueChamps: Set<string>,
            uniqueWins: Set<string>
        }> = {};

        // 2. Single Game Records


        // Variables for Single Game Records (Renamed)
        let espanco: any = null; // stomper
        let espancoKda = -1;

        let ministroEconomia: any = null; // farmMachine
        let farmRecord = -1;

        let senhorDosDragoes: any = null; // objectiveKing
        let objRecord = -1;

        let sniper: any = null; // damageEfficient
        let dmgEffRecord = -1;

        let demolidor: any = null; // torreDemolidora
        let torreRecord = -1;

        let x1Raiz: any = null; // soloClutch
        let soloRecord = -1;

        let anjoDaGuarda: any = null; // costasSeguras
        let costasRecord = -1;

        let donodoEarly: any = null; // earlyTyrant
        let earlyRecord = -9999;

        let escalada: any = null; // lateDemon
        let lateRecord = -1;

        let reiDaSelva: any = null; // jungleGod
        let jungleRecord = -1;

        let gigaChad: any = null; // macroPerfect
        let macroRecord = -1;

        // Unique Feats list
        const uniqueFeats: any[] = [];

        // Track Win Streaks
        const currentStreaks: Record<string, { count: number, start: Date, matchId: string, championName: string, skinId: number }> = {};

        // Populate Aggregations & Single Game Checks
        for (const s of scores) {
            const metrics = s.metrics as any;
            const challenges = metrics?.challenges || {};
            const pid = s.playerId;

            // --- Win Streak Logic ---
            if (s.isVictory) {
                if (!currentStreaks[pid]) {
                    currentStreaks[pid] = { count: 0, start: s.match.gameCreation, matchId: s.matchId, championName: s.championName, skinId: metrics?.skinId || 0 };
                }
                currentStreaks[pid].count++;
                currentStreaks[pid].matchId = s.matchId; // Update to latest match in streak
                currentStreaks[pid].championName = s.championName;
                currentStreaks[pid].skinId = metrics?.skinId || 0;
            } else {
                // Check if broken streak was epic
                if (currentStreaks[pid] && currentStreaks[pid].count >= 7) {
                    uniqueFeats.push({
                        ...s.player,
                        value: currentStreaks[pid].count,
                        label: 'O Imparável',
                        type: 'WIN_STREAK',
                        matchId: currentStreaks[pid].matchId,
                        championName: currentStreaks[pid].championName,
                        skinId: currentStreaks[pid].skinId,
                        date: currentStreaks[pid].start,
                        detail: 'Sequência de Vitórias'
                    });
                }
                // Reset
                currentStreaks[pid] = { count: 0, start: new Date(), matchId: '', championName: '', skinId: 0 };
            }

            if (!playerStats[s.playerId]) {
                playerStats[s.playerId] = { player: s.player, pentaCount: 0, scores: [], games: 0, wins: 0, uniqueChamps: new Set(), uniqueWins: new Set() };
            }
            const pStats = playerStats[s.playerId];
            pStats.games++;
            pStats.scores.push(s.matchScore);
            pStats.uniqueChamps.add(s.championName);

            if (s.isVictory) {
                pStats.wins++;
                pStats.uniqueWins.add(s.championName);
            }
            const pentas = Number(metrics?.pentaKills || 0);
            pStats.pentaCount += pentas;

            // --- Unique Feats Detection (Labels Updated) ---
            if (pentas > 0) {
                // Push one per penta occurrence
                for (let i = 0; i < pentas; i++) {
                    uniqueFeats.push({ ...s.player, type: 'PENTA', label: 'A Lenda Viva', matchId: s.matchId, championName: s.championName, skinId: metrics?.skinId || 0, value: 5, date: s.match.gameCreation });
                }
            }

            // Quadra (Only if NO penta)
            const quadras = Number(metrics?.quadraKills || 0);
            if (quadras > 0 && pentas === 0) {
                for (let i = 0; i < quadras; i++) {
                    uniqueFeats.push({ ...s.player, type: 'QUADRA', label: 'Quase Lenda', matchId: s.matchId, championName: s.championName, skinId: metrics?.skinId || 0, value: 4, date: s.match.gameCreation });
                }
            }

            if (s.isVictory && s.deaths === 0 && s.kills >= 7) {
                uniqueFeats.push({ ...s.player, type: 'PERFECT', label: 'Intocável', matchId: s.matchId, championName: s.championName, skinId: metrics?.skinId || 0, value: `${s.kills}/${s.deaths}/${s.assists}`, date: s.match.gameCreation });
            }

            const gd15 = Number(challenges.goldDiffAt15 || 0);
            if (s.isVictory && gd15 < -5000) {
                uniqueFeats.push({ ...s.player, type: 'COMEBACK', label: 'O Milagre', matchId: s.matchId, championName: s.championName, skinId: metrics?.skinId || 0, value: Math.abs(gd15).toFixed(0), detail: 'Ouro -5k @15', date: s.match.gameCreation });
            }

            // Stomp (Speedrun) - Stricter: 15m (900s) <= Duration < 18min (1080s) AND Gold Lead > 6k
            // Minimum 15m ensures we filter out Remakes and Early Surrenders (AFK)
            if (s.isVictory && s.match.gameDuration >= 900 && s.match.gameDuration < 1080 && gd15 > 6000) {
                uniqueFeats.push({ ...s.player, type: 'STOMP', label: 'Speedrun', matchId: s.matchId, championName: s.championName, skinId: metrics?.skinId || 0, value: `${(s.match.gameDuration / 60).toFixed(0)} min`, date: s.match.gameCreation });
            }

            // --- New Feats ---

            // 1. Butcher (O Açougueiro)
            if (s.kills >= 23) {
                uniqueFeats.push({ ...s.player, type: 'BUTCHER', label: 'O Açougueiro', matchId: s.matchId, championName: s.championName, skinId: metrics?.skinId || 0, value: s.kills, detail: 'Abates', date: s.match.gameCreation });
            }

            // 2. Visionary (Map Hack)
            const visionScore = Number(metrics?.visionScore || 0);
            if (visionScore >= 95) {
                uniqueFeats.push({ ...s.player, type: 'VISIONARY', label: 'Map Hack', matchId: s.matchId, championName: s.championName, skinId: metrics?.skinId || 0, value: visionScore, detail: 'Placar de Visão', date: s.match.gameCreation });
            }

            // 3. Tank God (Muralha)
            const dmgTaken = Number(metrics?.totalDamageTaken || 0);
            if (dmgTaken > 60000 && s.deaths <= 5) { // Increased tolerance for deaths a bit as dmg implies fighting
                uniqueFeats.push({ ...s.player, type: 'TANK_GOD', label: 'A Muralha', matchId: s.matchId, championName: s.championName, skinId: metrics?.skinId || 0, value: (dmgTaken / 1000).toFixed(0) + 'k', detail: 'Dano Tankado', date: s.match.gameCreation });
            }

            // 4. Marathon (Maratona)
            if (s.isVictory && s.match.gameDuration > 2700) { // 45 min
                const min = Math.floor(s.match.gameDuration / 60);
                uniqueFeats.push({ ...s.player, type: 'MARATHON', label: 'Maratona', matchId: s.matchId, championName: s.championName, skinId: metrics?.skinId || 0, value: `${min} min`, detail: 'Teste de Resistência', date: s.match.gameCreation });
            }

            // 5. Solo Carry (1v9)
            // Relies on challenges.killParticipation usually (0.0 to 1.0)
            const kp = Number(challenges.killParticipation || 0);
            if (s.isVictory && kp >= 0.90 && (s.kills + s.assists) >= 10) {
                uniqueFeats.push({ ...s.player, type: 'SOLO_CARRY', label: '1v9', matchId: s.matchId, championName: s.championName, skinId: metrics?.skinId || 0, value: (kp * 100).toFixed(0) + '%', detail: 'Part. em Abates', date: s.match.gameCreation });
            }



            // --- Single Game Records ---

            // Espanco (KDA)
            const kda = s.deaths === 0 ? (s.kills + s.assists) : (s.kills + s.assists) / s.deaths;
            if (kda > espancoKda) {
                espancoKda = kda;
                espanco = { ...s.player, value: kda.toFixed(2), label: 'Espanco (KDA)', matchId: s.matchId, champion: s.championName };
            }

            // Ministro da Economia (CSPM)
            const cspm = Number(metrics?.cspm || 0);
            if (cspm > farmRecord && s.lane !== 'JUNGLE' && s.lane !== 'UTILITY') {
                farmRecord = cspm;
                ministroEconomia = { ...s.player, value: cspm.toFixed(1), label: 'Ministro da Economia', matchId: s.matchId, champion: s.championName, unit: 'CS/min' };
            }

            // Sniper (Dmg / Gold) 
            const gold = metrics?.goldEarned || 1;
            const dmg = metrics?.totalDamage || 0;
            const efficiency = dmg / gold;
            if (efficiency > dmgEffRecord && s.lane !== 'UTILITY') {
                dmgEffRecord = efficiency;
                sniper = { ...s.player, value: efficiency.toFixed(2), label: 'Sniper (Dano/Ouro)', matchId: s.matchId, champion: s.championName };
            }

            // Senhor dos Dragões (Objectives)
            const wObj = (challenges.dragonTakedowns || 0) * 3 + (challenges.baronTakedowns || 0) * 5 + (challenges.riftHeraldTakedowns || 0) * 2 + (challenges.turretTakedowns || 0);
            if (wObj > objRecord) {
                objRecord = wObj;
                senhorDosDragoes = { ...s.player, value: wObj, label: 'Senhor dos Dragões', matchId: s.matchId, champion: s.championName };
            }

            // O Demolidor (Plates * 150 + Dmg Buildings)
            const plates = Number(metrics?.turretPlatesTaken || 0);
            const dmgBuildings = Number(metrics?.damageDealtToBuildings || 0);
            const towerScore = (plates * 150) + dmgBuildings;
            if (towerScore > torreRecord) {
                torreRecord = towerScore;
                demolidor = { ...s.player, value: Number(dmgBuildings).toLocaleString(), label: 'O Demolidor', matchId: s.matchId, champion: s.championName, detail: `${plates} Placas` };
            }

            // Rei do X1 (Solo Kills)
            const solos = Number(challenges.soloKills || 0);
            if (solos > soloRecord) {
                soloRecord = solos;
                x1Raiz = { ...s.player, value: solos, label: 'Rei do X1', matchId: s.matchId, champion: s.championName, unit: 'Solos' };
            }

            // Anjo da Guarda (Sup/Tank)
            if (s.lane === 'UTILITY' || s.lane === 'JUNGLE') {
                const saves = Number(challenges.saveAllyFromDeath || 0);
                const guardScore = saves * 2 + s.assists;
                if (guardScore > costasRecord) {
                    costasRecord = guardScore;
                    anjoDaGuarda = { ...s.player, value: saves, label: 'Anjo da Guarda', matchId: s.matchId, champion: s.championName, detail: `${s.assists} Assists` };
                }
            }

            // Dono do Early (Gold Diff @ 15)
            const earlyDiff = (Number(challenges.goldDiffAt15 || 0)) + (Number(challenges.xpDiffAt15 || 0) * 2);
            if (earlyDiff > earlyRecord) {
                earlyRecord = earlyDiff;
                donodoEarly = { ...s.player, value: Number(challenges.goldDiffAt15 || 0).toFixed(0), label: 'Dono do Early', matchId: s.matchId, champion: s.championName };
            }

            // A Escalada (Longest Winning Game)
            const duration = s.match.gameDuration;
            if (s.isVictory && duration > lateRecord) {
                lateRecord = duration;
                escalada = { ...s.player, value: Math.floor(duration / 60) + ' min', label: 'A Escalada', matchId: s.matchId, champion: s.championName };
            }

            // Rei da Selva (JG Only)
            if (s.lane === 'JUNGLE') {
                const monsterKills = (Number(challenges.enemyJungleMonsterKills || 0)) + (Number(metrics.totalMinions || 0));
                const jgScore = monsterKills + (Number(metrics.visionScore || 0) * 2);
                if (jgScore > jungleRecord) {
                    jungleRecord = jgScore;
                    reiDaSelva = { ...s.player, value: monsterKills, label: 'Rei da Selva', matchId: s.matchId, champion: s.championName, unit: 'Campos' };
                }
            }

            // Giga Chad (Low Kills, High Obj, Win)
            if (s.isVictory && s.kills < 5) {
                const macroScore = (challenges.turretTakedowns || 0) + (challenges.dragonTakedowns || 0) * 2;
                if (macroScore > macroRecord) {
                    macroRecord = macroScore;
                    gigaChad = { ...s.player, value: macroScore, label: 'Giga Chad', matchId: s.matchId, champion: s.championName, detail: 'Objetivos > Kills' };
                }
            }

        }

        // --- Aggregated Records ---
        const dayDiff = (end.getTime() - start.getTime()) / (1000 * 3600 * 24);
        const dynamicMin = dayDiff <= 7 ? 2 : (dayDiff <= 31 ? 5 : 10);

        // Pentakilleiro (Sum) - Aggregated
        const pentaWinner = Object.values(playerStats).sort((a, b) => b.pentaCount - a.pentaCount)[0];
        const pentakilleiro = (pentaWinner && pentaWinner.pentaCount > 0) ? { ...pentaWinner.player, value: pentaWinner.pentaCount, label: 'Pentakilleiro' } : null;

        // O Robô (Consistency)
        let robo: any = null;
        const consistentCandidates = Object.values(playerStats).filter(s => s.games >= (dynamicMin + 1) && s.scores.length > 0);

        let lowestStdDev = 999;
        const calcStdDev = (arr: number[]) => {
            const mean = arr.reduce((a, b) => a + b, 0) / arr.length;
            const variance = arr.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / arr.length;
            return Math.sqrt(variance);
        };

        for (const p of consistentCandidates) {
            const std = calcStdDev(p.scores);
            if (std < lowestStdDev) {
                lowestStdDev = std;
                robo = { ...p.player, value: std.toFixed(1), label: 'O Robô', detail: 'Desvio Padrão' };
            }
        }

        // --- Post-Aggregated Feats ---
        for (const pid in playerStats) {
            const p = playerStats[pid];

            // 1. Winrate Absurdo (70%+, Min 5 Games)
            if (p.games >= 5) {
                const wr = p.wins / p.games;
                if (wr >= 0.70) {
                    uniqueFeats.push({
                        ...p.player,
                        type: 'ABSURD_WINRATE',
                        label: 'Winrate Absurdo',
                        value: (wr * 100).toFixed(0) + '%',
                        detail: `${p.wins}V ${p.games - p.wins}D`,
                        matchId: 'feat-wr-' + pid,
                        date: new Date(),
                        championName: undefined
                    });
                }
            }


        }

        // Sort Unique Feats by date desc
        // DEDUPLICATION LOGIC
        // 1. Group by Key
        const groupedFeats: Record<string, any[]> = {};

        for (const f of uniqueFeats) {
            let key = `${f.puuid}-${f.type}`;
            // If Win Streak, distinct by Champion
            if (f.type === 'WIN_STREAK') {
                key += `-${f.championName}`;
            }

            if (!groupedFeats[key]) groupedFeats[key] = [];
            groupedFeats[key].push(f);
        }

        const finalUniqueFeats: any[] = [];

        // 2. Select Best & Count Occurrences
        for (const key in groupedFeats) {
            const list = groupedFeats[key];
            const occurrences = list.length;

            // Sort logic to find "best"
            // For most feats, higher value is better.
            // For PENTA/QUADRA, value is constant (5 or 4), so latest date is fine.
            // Value is often string (e.g. "90%"), need robust parse or just pick latest date for equality.

            // Let's sort by Date DESC first (latest)
            list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

            // Then if numerical value present, potentially pick highest?
            // BUTCHER (Kills) -> Higher is better
            // VISIONARY (Score) -> Higher is better
            // TANK_GOD (Dmg) -> Higher is better (parsing '60k' is hard, maybe just rely on date or trust the sorting)

            // Simpler approach: Keep the LATEST occurrence as the representative card.
            // Exception: If we want to show the "Highest Record", we should sort by value.
            // Given 'value' is mixed (string/number), let's stick to LATEST for now to reflect "Freshness".
            // Or if user wants "Record", we need to parse. For now, Latest.

            const bestFeat = list[0]; // Latest
            bestFeat.occurrences = occurrences;
            finalUniqueFeats.push(bestFeat);
        }

        // Sort Final List by Date
        finalUniqueFeats.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        return {
            pentakilleiro,
            espanco,
            ministroEconomia,
            senhorDosDragoes,
            sniper,
            robo,
            // New
            demolidor,
            x1Raiz,
            anjoDaGuarda,
            donodoEarly,
            escalada,
            reiDaSelva,
            gigaChad,
            // Unique
            uniqueFeats: finalUniqueFeats
        };
    }

    /**
     * Hall of Shame (Contextual)
     */
    async getHallOfShame(queueType: 'SOLO' | 'FLEX' = 'SOLO', startDate?: Date, endDate?: Date) {
        const start = startDate || new Date('2024-01-01');
        const end = endDate || new Date();

        const scores = await prisma.matchScore.findMany({
            where: {
                queueType: queueType,
                match: { gameCreation: { gte: start, lte: end } }
            } as any,
            include: { player: true, match: true }
        });

        let pacifista: any = null; // Old lowDmg
        let minDmgRecord = 999999;

        let alface: any = null;
        let lowestConversion = 1.0;

        let agronomo: any = null; // Old farmLimbo
        let limboScore = -1;

        let cego: any = null; // Old visionNegligente
        let lowestVision = 999;

        let ilusionista: any = null; // Old sumido
        let lowestKp = 1.0;

        // New Hall of Shame
        let sonecaBaron: any = null; // Ignora objetivos
        let sonecaScore = -1;

        let mataFofo: any = null; // Old killCollector
        let collectorScore = -1;

        let throwingStation: any = null; // Gold Diff High -> Loss
        let throwScore = -1;

        let ifood: any = null; // Old soloDoador
        let doadorScore = -1;

        let telaPreta: any = null; // Tempo morto
        let telaScore = -1;

        let moedaBronze: any = null; // Score baixo + vitoria
        let bronzeScore = 999;

        let finado: any = null; // Max deaths
        let maxDeathsRecord = 0;

        // Champ Stats for 'A Carroca'
        const champStats: Record<number, { count: number, wins: number, name: string }> = {};

        for (const s of scores) {
            const metrics = s.metrics as any;
            const challenges = metrics.challenges || {};
            const durationMin = s.match.gameDuration / 60;
            const participation = s.kills + s.assists;
            const totalKills = s.kills + s.assists + s.deaths; // loose approx of team kills if we don't have it? no metrics.kp is accurate.
            const kp = Number(metrics?.challenges?.killParticipation || 0);

            // Track Champ Stats
            if (s.championId) {
                if (!champStats[s.championId]) champStats[s.championId] = { count: 0, wins: 0, name: s.championName };
                champStats[s.championId].count++;
                if (s.isVictory) champStats[s.championId].wins++;
            }

            // --- New Feats: Winrate Absurdo & Rei da Variedade ---
            // Need to track this per player globally (outside single game loop)
            // But we have `playerStats` aggregation below. We will handle it there.

            // 1. Pacifista (Low Damage)
            if (s.lane !== 'UTILITY' && s.match.gameDuration > 900) {
                const dmg = Number(metrics?.totalDamage || 999999);
                if (dmg < minDmgRecord && dmg > 0) {
                    minDmgRecord = dmg;
                    pacifista = { ...s.player, value: Number(dmg).toLocaleString(), label: 'Dano Moral', matchId: s.matchId, champion: s.championName };
                }
            }

            // 2. Mão de Alface (Existing)
            if (participation > 10 && s.lane !== 'UTILITY') { // Exclude Supports
                const conversion = s.kills / participation;
                if (conversion < lowestConversion) {
                    lowestConversion = conversion;
                    alface = {
                        ...s.player,
                        value: (conversion * 100).toFixed(1) + '%',
                        label: 'Conversão de Abates',
                        matchId: s.matchId,
                        champion: s.championName,
                        detail: `${s.kills} Kills / ${s.assists} Assists`
                    };
                }
            }

            // 3. O Cego (Low Vision)
            if ((s.lane === 'UTILITY' || s.lane === 'JUNGLE') && s.match.gameDuration > 1200) {
                const vs = Number(metrics?.visionScore || 999);
                const vspm = vs / durationMin;
                if (vspm < lowestVision && vspm > 0) { // >0 to avoid AFKs/Bugs
                    lowestVision = vspm;
                    cego = { ...s.player, value: vspm.toFixed(2), label: 'Visão/Min', matchId: s.matchId, champion: s.championName };
                }
            }

            // 4. O Agrônomo (Simulador de Fazenda)
            if (['TOP', 'MIDDLE', 'BOTTOM'].includes(s.lane) && s.match.gameDuration > 1500 && !s.isVictory) {
                const cspm = Number(metrics?.cspm || 0);
                // Farm no Limbo: High CS, Low KP, Loss
                if (cspm > 7.0 && kp < 0.3) {
                    const score = cspm * (1 - kp); // Higher is "better" candidate
                    if (score > limboScore) {
                        limboScore = score;
                        agronomo = { ...s.player, value: `${cspm.toFixed(1)} CS/min`, label: 'Colheita Feliz', matchId: s.matchId, champion: s.championName, detail: `KP: ${(kp * 100).toFixed(0)}%` };
                    }
                }
            }

            // 5. O Ilusionista (Sumido)
            if (s.match.gameDuration > 1200) {
                if (kp < lowestKp && kp >= 0) {
                    lowestKp = kp;
                    ilusionista = { ...s.player, value: (kp * 100).toFixed(0) + '%', label: 'Mágico do Sumiço', matchId: s.matchId, champion: s.championName };
                }
            }

            // NEW SHAME INSIGHTS

            // 6. Soneca do Baron
            if (s.lane === 'JUNGLE' && s.match.gameDuration > 1500 && !s.isVictory) {
                const objs = (challenges.dragonTakedowns || 0) + (challenges.baronTakedowns || 0);
                if (objs === 0) {
                    sonecaBaron = { ...s.player, value: '0', label: 'Objetivos em 25m+', matchId: s.matchId, champion: s.championName };
                }
            }

            // 7. Zé Kills (Mata Fofo)
            if (s.kills > 10 && !s.isVictory) {
                const towerDmg = Number(metrics?.damageDealtToBuildings || 0);
                if (towerDmg < 1000) {
                    // Higher kills = worse collector
                    if (s.kills > collectorScore) {
                        collectorScore = s.kills;
                        mataFofo = { ...s.player, value: s.kills, label: 'Kills sem Objetivo', matchId: s.matchId, champion: s.championName, detail: `${towerDmg.toFixed(0)} Dano Torre` };
                    }
                }
            }

            // 8. Throwing Station (Gold Lead @ 15 > 2000 -> Loss)
            if (!s.isVictory && (challenges.goldDiffAt15 || 0) > 2000) {
                const diff = challenges.goldDiffAt15;
                if (diff > throwScore) {
                    throwScore = diff;
                    throwingStation = { ...s.player, value: Number(diff).toFixed(0), label: 'Ouro Jogado Fora', matchId: s.matchId, champion: s.championName, detail: 'Vantagem @15 perdida' };
                }
            }

            // 9. iFood (Doador)
            if (s.deaths > 8 && kp < 0.3) {
                const ratio = s.deaths / (kp + 0.1);
                if (ratio > doadorScore) {
                    doadorScore = ratio;
                    ifood = { ...s.player, value: `${s.deaths} Mortes`, label: 'Entrega Rápida', matchId: s.matchId, champion: s.championName, detail: `KP: ${(kp * 100).toFixed(0)}%` };
                }
            }

            // 10. Tempo de Tela Preta
            const timeDead = Number(metrics.totalTimeSpentDead || 0);
            if (timeDead > 0) {
                const deadRatio = timeDead / s.match.gameDuration;
                if (deadRatio > 0.20 && deadRatio > telaScore) {
                    telaScore = deadRatio;
                    telaPreta = { ...s.player, value: `${(deadRatio * 100).toFixed(0)}%`, label: 'Tempo Morto', matchId: s.matchId, champion: s.championName };
                }
            }

            // 11. Moeda de Bronze
            if (s.isVictory && s.matchScore < 40) {
                if (s.matchScore < bronzeScore) {
                    bronzeScore = s.matchScore;
                    moedaBronze = { ...s.player, value: s.matchScore, label: 'Carregado (Score)', matchId: s.matchId, champion: s.championName };
                }
            }

            // 12. O Finado (Max Deaths)
            if (s.deaths > maxDeathsRecord) {
                maxDeathsRecord = s.deaths;
                finado = { ...s.player, value: s.deaths, label: 'Simulador de Velório', matchId: s.matchId, champion: s.championName };
            }

        }

        // 12. Top Loser (O Derretido) - Reuse PDL Ranking logic but look for bottom
        const pdlRanking = await this.getPdlGainRanking(queueType, 100, start); // Get widely
        // Sort by gain asc (lowest first)
        const losers = pdlRanking.sort((a, b) => a.pdlGain - b.pdlGain);
        const topLoser = (losers.length > 0 && losers[0].pdlGain < 0) ? {
            gameName: losers[0].gameName,
            profileIconId: losers[0].profileIconId,
            pdlLoss: losers[0].pdlGain // Negative value
        } : null;

        // 13. A Carroça (Worst Winrate Champ)
        const dayDiff = (end.getTime() - start.getTime()) / (1000 * 3600 * 24);
        const minGames = dayDiff <= 7 ? 2 : (dayDiff <= 31 ? 3 : 5); // Relaxed for shame

        const champArray = Object.values(champStats);
        const worstChamps = champArray.filter(c => c.count >= minGames).sort((a, b) => {
            const wrA = a.wins / a.count;
            const wrB = b.wins / b.count;
            if (wrA === wrB) return b.count - a.count; // Breaks tie with most games played (Most consistent loss)
            return wrA - wrB; // Lowest WR first
        });
        const aCarroca = (worstChamps.length > 0) ? {
            championName: worstChamps[0].name,
            count: worstChamps[0].count,
            winrate: (worstChamps[0].wins / worstChamps[0].count) * 100
        } : null;

        return {
            topLoser,
            aCarroca,
            pacifista,
            alface,
            cego,
            ilusionista,
            // New
            sonecaBaron,
            mataFofo,
            agronomo,
            throwingStation,
            ifood,
            telaPreta,
            moedaBronze,
            finado
        };
    }

    /**
     * Get Global Matches (with filters)
     */
    async getGlobalMatches(page: number = 1, limit: number = 20, filters?: { playerPuuid?: string, lane?: string, queue?: string, champion?: string }) {
        const skip = (page - 1) * limit;
        const where: any = {};

        if (filters?.playerPuuid && filters.playerPuuid !== 'ALL') {
            where.playerId = filters.playerPuuid;
        }

        if (filters?.lane && filters.lane !== 'ALL') {
            where.lane = filters.lane;
        }

        if (filters?.queue && filters.queue !== 'ALL') {
            where.queueType = filters.queue;
        }

        if (filters?.champion) {
            where.championName = {
                contains: filters.champion,
                mode: 'insensitive' // Postgres specific, verify if supported or use manual casing
            };
        }

        const matches = await prisma.matchScore.findMany({
            where,
            orderBy: { match: { gameCreation: 'desc' } }, // Sort by game time
            skip,
            take: limit,
            include: {
                match: true, // Get duration/creation
                player: {
                    select: {
                        gameName: true,
                        tagLine: true,
                        profileIconId: true,
                        tier: true,
                        rank: true
                    }
                }
            }
        });

        const total = await prisma.matchScore.count({ where });

        // Transform to MatchHistoryEntry style (consistent with profile)
        const history = matches.map(m => ({
            matchId: m.matchId,
            date: m.match.gameCreation.toISOString(), // Use match time
            duration: m.match.gameDuration,
            championId: m.championId,
            championName: m.championName,
            lane: m.lane,
            isVictory: m.isVictory,
            kda: `${m.kills}/${m.deaths}/${m.assists}`,
            kills: m.kills,
            deaths: m.deaths,
            assists: m.assists,
            score: m.matchScore,
            gold: (m.metrics as any).goldEarned || 0,
            cs: (m.metrics as any).totalMinions || 0,
            damage: (m.metrics as any).totalDamage || 0,

            performanceScore: m.performanceScore,
            objectivesScore: m.objectivesScore,
            disciplineScore: m.disciplineScore,

            // Extra info for Global View
            playerName: m.player.gameName,
            playerTag: m.player.tagLine,
            puuid: m.playerId,
            playerIcon: m.player.profileIconId,
            playerTier: m.player.tier,

            queueType: m.queueType
        }));

        return {
            data: history,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        };
    }

    /**
     * Get Global Highlights (Daily & Weekly)
     * - Most Games
     * - Best Win Rate (min games)
     */
    /**
     * Get Global Highlights (Filtered by Period and Queue)
     */
    async getGlobalHighlights(period: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'ALL' | 'GENERAL' = 'DAILY', queue: string = 'SOLO') {
        const now = new Date();
        let startDate: Date;

        if (period === 'ALL' || period === 'GENERAL') {
            startDate = new Date(0); // Beginning of time
        } else if (period === 'MONTHLY') {
            startDate = this.getStartDateForPeriod('MONTHLY');
        } else if (period === 'WEEKLY') {
            startDate = this.getStartDateForPeriod('WEEKLY');
        } else {
            // DAILY
            const brazilTime = new Date(now.getTime() - 3 * 60 * 60 * 1000);
            brazilTime.setHours(0, 0, 0, 0);
            startDate = new Date(brazilTime.getTime() + 3 * 60 * 60 * 1000);
        }

        // 2. Fetch Scores
        const where: any = {
            match: { gameCreation: { gte: startDate } }
        };
        if (queue && queue !== 'ALL') {
            where.queueType = queue;
        }

        const scores = await prisma.matchScore.findMany({
            where,
            include: {
                player: { select: { gameName: true, tagLine: true, profileIconId: true } },
                match: true
            }
        });

        // 3. Init Stats
        // 3. Init Stats
        let mostGames = { value: 0, player: null as any };
        let bestWr = { value: 0, games: 0, player: null as any }; // Mestre (min 2 games)
        let worstWr = { value: 100, games: 0, player: null as any }; // Tiltado (min 2 games, < 50%)
        let highestDmg = { value: 0, champion: '', player: null as any, matchId: '' };
        let highestVision = { value: 0, champion: '', player: null as any };
        let highestCS = { value: 0, champion: '', player: null as any };
        let highestAssists = { value: 0, champion: '', player: null as any };
        let longestStreak = { value: 0, player: null as any, type: 'WIN' };
        let longestGame = { value: 0, champion: '', player: null as any, matchId: '' }; // Maratona
        let shortestGame = { value: 999999, champion: '', player: null as any, matchId: '' };
        let mvp = { value: 0, games: 0, player: null as any };

        // 4. Process Matches
        const champStats: Record<string, { games: number, wins: number }> = {};
        const playerMatches: Record<string, any[]> = {};
        const playerStats: Record<string, { games: number, wins: number, totalScore: number, player: any }> = {};


        scores.forEach(s => {
            if (!playerMatches[s.playerId]) playerMatches[s.playerId] = [];
            playerMatches[s.playerId].push(s);

            // Player Aggregates
            if (!playerStats[s.playerId]) {
                playerStats[s.playerId] = { games: 0, wins: 0, totalScore: 0, player: s.player };
            }
            playerStats[s.playerId].games++;
            playerStats[s.playerId].totalScore += (s.matchScore || 0);
            if (s.isVictory) playerStats[s.playerId].wins++;

            // Metrics
            const metrics = s.metrics as any;
            const dmg = metrics.totalDamage || 0;
            const vis = metrics.visionScore || 0;
            const cs = (metrics.totalMinionsKilled || 0) + (metrics.neutralMinionsKilled || 0);
            const assists = metrics.assists || 0;

            if (dmg > highestDmg.value) {
                highestDmg = { value: dmg, champion: s.championName, player: s.player, matchId: s.matchId };
            }
            if (vis > highestVision.value) {
                highestVision = { value: vis, champion: s.championName, player: s.player };
            }
            if (cs > highestCS.value) {
                highestCS = { value: cs, champion: s.championName, player: s.player };
            }
            if (assists > highestAssists.value) {
                highestAssists = { value: assists, champion: s.championName, player: s.player };
            }

            // Longest Game (Maratona)
            if (s.match.gameDuration > longestGame.value) {
                longestGame = { value: s.match.gameDuration, champion: s.championName, player: s.player, matchId: s.matchId };
            }

            // Shortest Game
            if (s.isVictory && s.match.gameDuration < shortestGame.value && s.match.gameDuration > 300) { // Min 5 mins
                shortestGame = { value: s.match.gameDuration, champion: s.championName, player: s.player, matchId: s.matchId };
            }

            // Champ Stats
            if (!champStats[s.championName]) {
                champStats[s.championName] = { games: 0, wins: 0 };
            }
            champStats[s.championName].games++;
            if (s.isVictory) champStats[s.championName].wins++;
        });

        // 5. Calculate Final Stats (WR, MVP)
        // MESTRE: Min 2 games (if period allows, else 1) - Let's force 2 for Mestre quality
        const minGamesMestre = 2; // Fixed requirement per user request "mestre tenha mais de uma partida"
        // TILTADO: Min 2 games AND < 50%
        const minGamesTiltado = 2;

        Object.values(playerStats).forEach(stat => {
            if (stat.games > mostGames.value) {
                mostGames = { value: stat.games, player: stat.player };
            }

            const wr = (stat.wins / stat.games) * 100;
            const avgScore = stat.totalScore / stat.games;

            // Mestre Logic
            if (stat.games >= minGamesMestre) {
                if (wr > bestWr.value || (wr === bestWr.value && stat.games > bestWr.games)) {
                    bestWr = { value: wr, games: stat.games, player: stat.player };
                }
            }

            // Tiltado Logic
            if (stat.games >= minGamesTiltado && wr < 50) {
                // Format: Lowest WR is "Best" for this category.
                // If we have a current worst (e.g. 40%) and new is 30%, new wins.
                // Init value is 100%.
                if (wr < worstWr.value || (wr === worstWr.value && stat.games > worstWr.games)) {
                    worstWr = { value: wr, games: stat.games, player: stat.player };
                }
            }

            // MVP (Avg Score) - Keep simple min limit
            if (stat.games >= 1) {
                if (avgScore > mvp.value) {
                    mvp = { value: avgScore, games: stat.games, player: stat.player };
                }
            }
        });

        // 5. Calculate Player Stats (Streaks)
        // ... (Keep existing streak logic loop)

        Object.keys(playerMatches).forEach(pid => {
            const matches = playerMatches[pid];
            const player = matches[0].player; // info
            const isWinStr = matches[0].isVictory;

            // Re-calculate streak manually
            let currentStr = 0;
            for (const m of matches) {
                if (m.isVictory === isWinStr) {
                    currentStr++;
                } else {
                    break;
                }
            }

            if (isWinStr && currentStr > longestStreak.value) {
                longestStreak = { value: currentStr, player, type: 'WIN' };
            }
        });

        // Most Played Champion
        let popularChamp = { name: '', count: 0, winrate: 0 };
        const sortedChamps = Object.entries(champStats)
            .map(([name, stat]) => ({
                name,
                count: stat.games,
                winrate: (stat.wins / stat.games) * 100
            }))
            .sort((a, b) => b.count - a.count);

        const positiveChamp = sortedChamps.find(c => c.winrate >= 50);
        if (positiveChamp) {
            popularChamp = positiveChamp;
        } else if (sortedChamps.length > 0) {
            popularChamp = { name: '', count: 0, winrate: 0 };
        }

        return {
            period,
            queue,
            mostGames: mostGames.value > 0 ? mostGames : null,
            bestWr: bestWr.games > 0 ? bestWr : null,
            worstWr: worstWr.games > 0 && worstWr.value < 50 ? worstWr : null, // Double check
            highestDmg: highestDmg.value > 0 ? highestDmg : null,
            highestVision: highestVision.value > 0 ? highestVision : null,
            highestCS: highestCS.value > 0 ? highestCS : null,
            highestAssists: highestAssists.value > 0 ? highestAssists : null,
            longestStreak: longestStreak.value > 1 ? longestStreak : null,
            popularChamp: popularChamp.count > 0 ? popularChamp : null,
            mvp: mvp.value > 0 ? mvp : null,
            shortestGame: shortestGame.value < 999999 ? shortestGame : null,
            longestGame: longestGame.value > 0 ? longestGame : null // Added
        };
    }

    /**
     * Get Community Feats (Aggregated Stats)
     */
    async getCommunityFeats(queueType: 'SOLO' | 'FLEX', startDate?: Date, endDate?: Date) {
        // 1. Fetch ALL scores for the period (Efficient Select)
        const allScores = await prisma.matchScore.findMany({
            where: {
                queueType,
                match: {
                    gameCreation: {
                        gte: startDate,
                        lte: endDate
                    }
                }
            },
            select: {
                playerId: true,
                isVictory: true,
                matchScore: true,
                championName: true,
                lane: true,
                kills: true,
                deaths: true,
                matchId: true,
                match: { select: { gameCreation: true, gameDuration: true } },
                metrics: true,
                player: {
                    select: {
                        gameName: true,
                        tagLine: true,
                        profileIconId: true,
                        tier: true
                    }
                }
            }
        });

        // Initialize Aggregators
        const pentas: any[] = [];
        const highScores: any[] = [];
        const killsTracker: Record<string, { kills: number, duration: number, player: any }> = {};
        const farmTracker: Record<string, { csMin: number, totalCs: number, player: any }> = {};
        const visionTracker: Record<string, { visMin: number, player: any }> = {};
        const deathTracker: Record<string, { deaths: number, games: number, player: any }> = {};
        const versatileTracker: Record<string, { roles: Set<string>, player: any }> = {};

        // Single Pass Loop
        // Group by Player for Streak Logic
        const playerGames: Record<string, typeof allScores> = {};

        for (const score of allScores) {
            const pid = score.playerId;
            const metrics = score.metrics as any;
            const cs = (metrics.totalMinionsKilled || 0) + (metrics.neutralMinionsKilled || 0);
            const durationMin = Math.max(1, (score.match?.gameDuration || 1) / 60);
            const csMin = cs / durationMin;
            const visMin = (metrics.visionScore || 0) / durationMin;

            // 1. Pentas
            if (metrics.pentaKills > 0) {
                pentas.push({
                    player: score.player,
                    champion: score.championName,
                    matchId: score.matchId,
                    date: score.match?.gameCreation,
                    victims: [] // Would need deeper query, skipping for perf
                });
            }

            // 2. High Score (Intankavel)
            if (score.matchScore > 15) {
                highScores.push({
                    score: score.matchScore,
                    player: score.player,
                    kda: `${score.kills}/${score.deaths || 0}/${(metrics.assists || 0)}`,
                    champion: score.championName,
                    metrics: {
                        dmgShare: metrics.teamDamagePercentage || 0,
                        kp: metrics.kp || 0,
                        vision: metrics.visionScore || 0
                    }
                });
            }

            // 3. Kills (Carniceiro)
            if (!killsTracker[pid]) killsTracker[pid] = { kills: 0, duration: 0, player: score.player };
            killsTracker[pid].kills += score.kills;
            killsTracker[pid].duration += durationMin;

            // 4. Farm (Farmville)
            if (!farmTracker[pid]) farmTracker[pid] = { csMin: 0, totalCs: 0, player: score.player };
            if (csMin > farmTracker[pid].csMin) farmTracker[pid].csMin = csMin;
            farmTracker[pid].totalCs += cs;

            // 5. Vision (Visionario)
            if (!visionTracker[pid]) visionTracker[pid] = { visMin: 0, player: score.player };
            if (visMin > visionTracker[pid].visMin) visionTracker[pid].visMin = visMin;

            // 6. Deaths (Sobrevivente)
            if (!deathTracker[pid]) deathTracker[pid] = { deaths: 0, games: 0, player: score.player };
            deathTracker[pid].deaths += score.deaths;
            deathTracker[pid].games += 1;

            // 7. Versatile (Multitarefa)
            if (score.isVictory) {
                if (!versatileTracker[pid]) versatileTracker[pid] = { roles: new Set(), player: score.player };
                if (score.lane && score.lane !== 'UNKNOWN') versatileTracker[pid].roles.add(score.lane);
            }

            // Group for Streaks
            if (!playerGames[pid]) playerGames[pid] = [];
            playerGames[pid].push(score);
        }

        // Post-Process Streaks
        const streakResults: any[] = [];
        const versatileResults: any[] = [];

        // Versatile Finalize
        Object.values(versatileTracker).forEach(v => {
            if (v.roles.size >= 3) {
                versatileResults.push({
                    player: v.player,
                    roles: Array.from(v.roles),
                    count: v.roles.size
                });
            }
        });

        // Streaks Finalize
        Object.entries(playerGames).forEach(([pid, games]) => {
            // Sort by date ASC
            games.sort((a, b) => new Date(a.match.gameCreation).getTime() - new Date(b.match.gameCreation).getTime());

            let currentStreak = 0;
            let maxStreak = 0;
            // let streakLp = 0; // Approx

            games.forEach(g => {
                if (g.isVictory) {
                    currentStreak++;
                    if (currentStreak > maxStreak) maxStreak = currentStreak;
                } else {
                    currentStreak = 0;
                }
            });

            if (maxStreak >= 3) {
                streakResults.push({
                    player: games[0].player,
                    streak: maxStreak,
                    lp: maxStreak * 20 // Dummy calc for now
                });
            }
        });

        // Sort and Limit
        return {
            pentas: pentas.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
            highScores: highScores.sort((a, b) => b.score - a.score).slice(0, 5),
            mostKills: Object.values(killsTracker)
                .map(k => ({ ...k, killsPerHour: (k.kills / (k.duration / 60)) }))
                .sort((a, b) => b.kills - a.kills).slice(0, 5),
            bestFarm: Object.values(farmTracker).sort((a, b) => b.csMin - a.csMin).slice(0, 5),
            bestVision: Object.values(visionTracker).sort((a, b) => b.visMin - a.visMin).slice(0, 5),
            survivors: Object.values(deathTracker).filter(d => d.games >= 5).sort((a, b) => (a.deaths / a.games) - (b.deaths / b.games)).slice(0, 5),
            streaks: streakResults.sort((a, b) => b.streak - a.streak).slice(0, 5),
            versatile: versatileResults.sort((a, b) => b.count - a.count).slice(0, 5)
        };
    }

    /**
     * Get Community Relations (Social Analytics)
     * Analyzes: Duos, Squads, Synergy, Anti-Synergy, Social Behaviors
     */
    async getCommunityRelations(queueType: 'SOLO' | 'FLEX' | 'BOTH', startDate?: Date, endDate?: Date) {
        // 1. Fetch Matches (Optimized Select)
        if (!startDate) startDate = new Date('2024-01-01'); // Safety

        const whereClause: any = {
            gameCreation: { gte: startDate, lte: endDate }
        };

        if (queueType !== 'BOTH') {
            whereClause.queueType = queueType;
        }

        const matches = await prisma.match.findMany({
            where: whereClause,
            include: {
                scores: {
                    select: {
                        playerId: true,
                        isVictory: true,
                        matchScore: true,
                        lane: true, // For Lane Pairing
                        queueType: true,
                        metrics: true, // For deeply specific stats if needed
                        player: {
                            select: {
                                puuid: true,
                                gameName: true,
                                tagLine: true,
                                profileIconId: true,
                                tier: true,
                                rank: true
                            }
                        }
                    }
                }
            }
        });

        // Data Structures
        const playerStats: Record<string, {
            player: any,
            games: number,
            wins: number,
            soloGames: number,
            flexGames: number,
            totalScore: number
        }> = {};

        // Duo Key: "P1_ID|P2_ID" (alphabetical sort to ensure uniqueness)
        const relations: Record<string, {
            p1: any, p2: any,
            games: number, wins: number,
            scoreSumTogether: number,
            lanes: Record<string, number>, // "TOP-JUNGLE": count
            queueModes: Set<string>,
            matches: any[]
        }> = {};

        const squadTracker: Record<string, { members: any[], wins: number, games: number, scoreSum: number }> = {};

        // 2. Pass 1: Aggregation
        for (const match of matches) {
            // Split by Team
            const winners = match.scores.filter(s => s.isVictory);
            const losers = match.scores.filter(s => !s.isVictory);

            const teams = [winners, losers];

            // Update Individual Stats first
            match.scores.forEach(s => {
                if (!playerStats[s.playerId]) {
                    playerStats[s.playerId] = {
                        player: s.player, games: 0, wins: 0,
                        soloGames: 0, flexGames: 0, totalScore: 0
                    };
                }
                const p = playerStats[s.playerId];
                p.games++;
                p.totalScore += s.matchScore;
                if (s.isVictory) p.wins++;
                if (match.queueType === 'SOLO') p.soloGames++;
                else p.flexGames++;
            });

            // Process Teams for Relations
            teams.forEach(team => {
                if (team.length < 2) return;

                // Sort by ID
                const players = team.sort((a, b) => a.playerId.localeCompare(b.playerId));

                // A) Squads (3+) - Only relevant for FLEX or specific analysis
                if (players.length >= 3) { // Even in SoloQ technically imposs, but good for custom games or flex
                    const pIds = players.map(p => p.playerId).join('|');
                    if (!squadTracker[pIds]) {
                        squadTracker[pIds] = { members: players.map(p => p.player), wins: 0, games: 0, scoreSum: 0 };
                    }
                    squadTracker[pIds].games++;
                    squadTracker[pIds].scoreSum += players.reduce((acc, p) => acc + p.matchScore, 0);
                    if (team[0].isVictory) squadTracker[pIds].wins++;
                }

                // B) Relations (Duos - Pairwise)
                // In a team of 5, we have 10 pairs. 
                // We map ALL of them to build the network graph.
                for (let i = 0; i < players.length; i++) {
                    for (let j = i + 1; j < players.length; j++) {
                        const p1 = players[i];
                        const p2 = players[j];
                        const key = `${p1.playerId}|${p2.playerId}`;

                        if (!relations[key]) {
                            relations[key] = {
                                p1: p1.player,
                                p2: p2.player,
                                games: 0, wins: 0,
                                scoreSumTogether: 0,
                                lanes: {},
                                queueModes: new Set(),
                                matches: []
                            };
                        }
                        const r = relations[key];
                        r.games++;
                        r.scoreSumTogether += (p1.matchScore + p2.matchScore);
                        if (team[0].isVictory) r.wins++;
                        r.queueModes.add(match.queueType);

                        // Lane Pairing (Sort lanes alphabetically: "JUNGLE|TOP")
                        const lanePair = [p1.lane, p2.lane].sort().join('|');
                        if (!r.lanes[lanePair]) r.lanes[lanePair] = 0;
                        r.lanes[lanePair]++;
                    }
                }
            });
        }

        // 3. Analysis & Insights
        const minGames = 3; // Filter noise
        const computedRelations = Object.values(relations).map(r => {
            if (r.games < minGames) return null;

            const wr = (r.wins / r.games) * 100;
            const avgScoreTogether = r.scoreSumTogether / (r.games * 2);

            // Fetch Individual Baselines
            const p1Base = playerStats[r.p1.puuid];
            const p2Base = playerStats[r.p2.puuid];
            const avgScoreAlone = ((p1Base.totalScore / p1Base.games) + (p2Base.totalScore / p2Base.games)) / 2;
            const avgWrAlone = (((p1Base.wins / p1Base.games) + (p2Base.wins / p2Base.games)) / 2) * 100;

            const deltaScore = avgScoreTogether - avgScoreAlone;
            const deltaWr = wr - avgWrAlone;

            // Synergy Score Formula
            // Base: WR (50%) + DeltaScore (30%) + Bonus for sheer volume (20%)
            // We want to highlight duos that WIN and PLAY WELL together.
            let synergyScore = (wr * 0.5) + (deltaScore * 2);
            // Add volume bonus (diminishing returns)
            synergyScore += Math.min(20, r.games);

            // Find Main Lane Pair
            const mainLane = Object.entries(r.lanes).sort((a, b) => b[1] - a[1])[0][0];

            return {
                players: [r.p1, r.p2],
                games: r.games,
                wins: r.wins,
                winRate: wr,
                avgScoreTogether,
                deltaScore, // +Improved when together, -Worse when together
                deltaWr,
                synergyScore,
                mainLane,
                queues: Array.from(r.queueModes)
            };
        }).filter(Boolean) as any[];

        // A) Lists
        const topSynergies = [...computedRelations].sort((a, b) => b.synergyScore - a.synergyScore).slice(0, 5);

        // Anti-Sinergia: Positive (or high) games, but terrible WR together compared to alone OR terrible DeltaScore
        const antiSynergies = [...computedRelations]
            .filter(r => r.deltaWr < -5 || r.deltaScore < -2 || r.winRate < 40)
            .sort((a, b) => a.deltaWr - b.deltaWr) // Sort by biggest drop in WR
            .slice(0, 5);

        // B) Specific Behaviors

        // 1. Solo Warrior (Plays a lot, but rarely duos in matching filtered queues)
        // Check % of games that are solo.
        // BUT: 'matches' query might be filtered. We need to look at 'playerStats' vs global context?
        // Let's use the local 'playerStats' (games in this period) vs 'relations'.
        // Actually, playerStats counts ALL games in the query.
        // We need to know how many of those were in a PARTY. 
        // -> This requires checking the match metadata or deducing from relations.
        // Easier: We iterate matches again? No.
        // Approximate: Sum up games from relations? No, that double counts.
        // Accurate way: Start with 0 party games. In aggregation loop, if team.length > 1, increment partyGames for each member.
        // Let's do a quick post-calc or modifying the Aggregation loop (Step 2).
        // For now, let's assume we didn't track "Party Games" explicitly in step 2.
        // REVISIT Step 2 -> Added logic? No, too risky to change loop now. 
        // Let's deduce: If a player is in NO high-game relation, are they solo? Not necessarily, they could play with randoms.
        // "Solo Warrior" = Games > 10 AND FlexGames == 0 ? No, could be Solo Duo.
        // Let's skip precise "Solo Count" for this iteration to avoid O(N) re-loop. 
        // Alternative: "Flex Only" is easy (SoloGames == 0 in playerStats).

        // Flex Only
        const flexOnly = Object.values(playerStats)
            .filter(p => p.flexGames > 5 && p.soloGames === 0)
            .sort((a, b) => b.flexGames - a.flexGames)
            .slice(0, 5);

        // True Friendship (High Games, Low WR, but still playing)
        const friendship = computedRelations
            .filter(r => r.games > 5 && r.winRate < 45)
            .sort((a, b) => b.games - a.games)
            .slice(0, 3);

        // Carried (Backpack) - One Score is much higher than other
        // Need to store individual scores in relation to calc this.
        // Skipping for now to keep payload light.

        // Bonde (Squads)
        const bestSquads = Object.values(squadTracker)
            .filter(s => s.games >= 2)
            .map(s => ({
                members: s.members,
                games: s.games,
                wins: s.wins,
                winRate: (s.wins / s.games) * 100,
                score: s.scoreSum / (s.games * s.members.length) // Avg Score per person
            }))
            .sort((a, b) => b.games - a.games || b.score - a.score)
            .slice(0, 5);

        return {
            period: { start: startDate, end: endDate },
            stats: {
                analyzedMatches: matches.length,
                analyzedPlayers: Object.keys(playerStats).length,
                totalRelations: Object.keys(relations).length
            },

            // Lists
            topSynergies: topSynergies.map(s => ({ ...s, label: 'Sinergia Alta', type: 'GOOD' })),
            antiSynergies: antiSynergies.map(s => ({ ...s, label: 'Anti-Sinergia', type: 'BAD' })),

            // Special Cards
            highlights: {
                squads: bestSquads,
                flexOnly: flexOnly.map(p => ({
                    player: p.player,
                    value: p.flexGames,
                    label: 'Só Flex',
                    detail: '0 Rankeds Solo'
                })),
                friendship: friendship.map(f => ({
                    players: f.players,
                    value: f.games,
                    label: 'Amizade Verdadeira',
                    detail: `${f.winRate.toFixed(0)}% WR`
                })),
            }
        };
    }

    // Legacy support alias if needed, or we just remove it since we updated frontend
    // getCommunityDuos(...) { return this.getCommunityRelations(...); }

    /**
     * Get Match Details with Lazy Enriched Caching
     * Returns: Player Stats, Opponent Stats, and Comparison
     */
    async getMatchDetailsWithCache(matchId: string, puuid: string) {
        // 1. Check DB for Score + Opponent Info
        const score = await prisma.matchScore.findUnique({
            where: { playerId_matchId: { playerId: puuid, matchId } },
            include: { match: true }
        });

        if (!score) return null; // Should not happen if history lists it

        // Check if Cache Hit (Opponent info exists AND has new fields)
        const cachedOpp = score.opponentMetrics as any;
        const playerMetrics = score.metrics as any;
        // Check if Player Tankiness is "Healty" (New Formula > 5 usually. Old formula < 1)
        const isPlayerHealthy = (playerMetrics?.tankiness || 0) > 2;
        // Check if Participants are cached
        const hasParticipants = playerMetrics?.participants && Array.isArray(playerMetrics.participants) && playerMetrics.participants.length > 0;

        // Strict check: must have turrets, kp, and tankiness to be considered "fresh" AND player data must be healthy AND participants exist
        if (isPlayerHealthy && hasParticipants && score.opponentChampionName && cachedOpp && cachedOpp.turrets !== undefined && cachedOpp.kp !== undefined) {
            console.log(`[Cache] Hit for Match ${matchId}`);
            // Return cached format
            return this.formatMatchDetailResponse(score, score.opponentChampionName, cachedOpp, score.opponentChampionId || 0);
        }

        // 3. Cache Miss: Fetch from Riot
        console.log(`[Cache] Miss for Match ${matchId} (Healthy: ${isPlayerHealthy}, Parts: ${hasParticipants}). Fetching from Riot...`);
        try {
            const matchDto = await this.riotService!.getMatchDetails(matchId);

            // 4. Identify Participants
            const playerPart = matchDto.info.participants.find((p: any) => p.puuid === puuid);
            if (!playerPart) throw new Error('Player not found in match');

            // --- FIX: Recalculate Player Tankiness if Stale ---
            if (!isPlayerHealthy) {
                const pDuration = matchDto.info.gameDuration;
                const pTankiness = playerPart.totalDamageTaken / Math.max(1, pDuration - playerPart.totalTimeSpentDead);
                playerMetrics.tankiness = pTankiness;
                console.log(`[Cache] Patched Player Tankiness: ${pTankiness.toFixed(1)}`);
            }

            // Logic reused from engine (simplified here or imported)
            const getOpponent = (p: any, all: any[]) => {
                return all.find(x => x.teamPosition === p.teamPosition && x.teamId !== p.teamId) || null;
            };

            const opponentPart = getOpponent(playerPart, matchDto.info.participants);

            // 5. Build Metrics & Update DB
            let oppName = 'Unknown';
            let oppId = 0;
            let oppMetrics: any = {};

            if (opponentPart) {
                oppName = opponentPart.championName;
                oppId = opponentPart.championId;

                // Helper: Get Team Kills
                const oppTeamKills = matchDto.info.participants
                    .filter((p: any) => p.teamId === opponentPart.teamId)
                    .reduce((sum: number, p: any) => sum + p.kills, 0);

                const oppKp = oppTeamKills > 0 ? (opponentPart.kills + opponentPart.assists) / oppTeamKills : 0;

                // Helper: Tankiness (Engine Formula: DamageTaken / TimeAlive)
                const duration = matchDto.info.gameDuration;
                const oppTankiness = opponentPart.totalDamageTaken / Math.max(1, duration - opponentPart.totalTimeSpentDead);

                // Capture Objective Counts (using challenges if available for better accuracy)
                oppMetrics = {
                    kda: `${opponentPart.kills}/${opponentPart.deaths}/${opponentPart.assists}`,
                    kills: opponentPart.kills,
                    deaths: opponentPart.deaths,
                    assists: opponentPart.assists,
                    cs: (opponentPart.totalMinionsKilled || 0) + (opponentPart.neutralMinionsKilled || 0),
                    gold: opponentPart.goldEarned || 0,
                    damage: opponentPart.totalDamageDealtToChampions || 0,
                    vision: opponentPart.visionScore || 0,

                    // New Metrics
                    kp: oppKp, // Stored as 0.0 - 1.0
                    tankiness: oppTankiness,

                    // Objectives
                    turrets: opponentPart.turretKills || opponentPart.challenges?.turretTakedowns || 0,
                    dragons: opponentPart.dragonKills || opponentPart.challenges?.dragonTakedowns || 0,
                    barons: opponentPart.baronKills || opponentPart.challenges?.baronTakedowns || 0,
                    // Total Obj for Jungler/Sup calculations
                    objTotal: (opponentPart.turretKills || opponentPart.challenges?.turretTakedowns || 0) +
                        (opponentPart.dragonKills || opponentPart.challenges?.dragonTakedowns || 0) +
                        (opponentPart.baronKills || opponentPart.challenges?.baronTakedowns || 0) +
                        (opponentPart.challenges?.riftHeraldTakedowns || 0)
                };

                // --- 6. Extract Participants for 5v5 Board ---
                const participants = matchDto.info.participants.map((p: any) => ({
                    puuid: p.puuid,
                    riotIdGameName: p.riotIdGameName,
                    riotIdTagline: p.riotIdTagline,
                    championId: p.championId,
                    championName: p.championName,
                    teamId: p.teamId,
                    role: p.teamPosition, // TOP, JUNGLE, etc.
                    kills: p.kills,
                    deaths: p.deaths,
                    assists: p.assists,
                    kda: `${p.kills}/${p.deaths}/${p.assists}`,
                    win: p.win
                }));

                playerMetrics.participants = participants;

                // SAVE TO DB
                await prisma.matchScore.update({
                    where: { id: score.id },
                    data: {
                        opponentChampionName: oppName,
                        opponentChampionId: oppId,
                        opponentMetrics: oppMetrics,
                        metrics: playerMetrics // <--- ALSO UPDATE PLAYER METRICS WITH PARTICIPANTS
                    }
                });
                console.log(`[Cache] Saved Opponent Info, Participants & Patched Player Metrics for ${matchId}`);
            }

            return this.formatMatchDetailResponse(score, oppName, oppMetrics, oppId);

        } catch (error) {
            console.error('Failed to enrich match details', error);
            // Fallback: Return what we have
            return this.formatMatchDetailResponse(score, 'Unknown', {}, 0);
        }
    }

    private formatMatchDetailResponse(score: any, oppName: string, oppMetrics: any, oppId: number) {
        const durationMin = Math.max(1, score.match.gameDuration / 60);
        const metrics = score.metrics as any || {};

        // Helper for Per Minute (only for opponents if raw data is provided)
        const getPM = (val: number) => (val / durationMin).toFixed(1);

        // Player Stats - Mapped correctly from Scoring Engine "metrics" JSON
        // Note: Engine stores 'cspm', 'dpm', 'gpm' directly.
        // It does NOT store raw 'totalMinionsKilled' in metrics JSON usually.
        // We use the pre-calculated per-minute values from the engine for accuracy.
        const playerStats = {
            cspm: metrics.cspm || 0,
            gpm: metrics.gpm || 0,
            dpm: metrics.dpm || 0,
            vspm: metrics.vspm || 0,
            turrets: metrics.turrets || 0, // Engine key is 'turrets', not 'turretKills'
            dragons: metrics.dragons || 0,
            barons: metrics.barons || 0
        };

        // Logic for Weights & Points calculation
        const lane = score.lane as 'TOP' | 'JUNGLE' | 'MIDDLE' | 'BOTTOM' | 'UTILITY';
        const laneWeights = LAYER_WEIGHTS[lane] || LAYER_WEIGHTS['MIDDLE']; // Fallback

        const performanceMetrics: any[] = [];

        // Map for display labels
        const labels: Record<string, string> = {
            cspm: 'CS/min',
            dpm: 'Dano/min',
            gpm: 'Gold/min',
            vspm: 'Visão/min',
            kp: 'Part. Abates',
            tankiness: 'Tankiness',
            objPart: 'Part. Obj.',
            globalObj: 'Obj. Globais'
        };

        // Calculate ratios and points for each metric defined in the lane config
        Object.entries(laneWeights).forEach(([key, weight]) => {
            let pVal = 0;
            let oVal = 0;
            let ratio = 0;

            // Map values based on key
            if (key === 'cspm') { pVal = playerStats.cspm; oVal = oppMetrics.cs ? oppMetrics.cs / durationMin : 0; }
            else if (key === 'dpm') { pVal = playerStats.dpm; oVal = oppMetrics.damage ? oppMetrics.damage / durationMin : 0; }
            else if (key === 'gpm') { pVal = playerStats.gpm; oVal = oppMetrics.gold ? oppMetrics.gold / durationMin : 0; }
            else if (key === 'vspm') { pVal = playerStats.vspm; oVal = oppMetrics.vision ? oppMetrics.vision / durationMin : 0; }
            else if (key === 'kp') { pVal = metrics.kp || 0; oVal = oppMetrics.kp || 0; }
            else if (key === 'tankiness') { pVal = metrics.tankiness || 0; oVal = oppMetrics.tankiness || 0; }
            else if (key === 'objPart' || key === 'globalObj') { pVal = metrics.objTotal || 0; oVal = oppMetrics.objTotal || 0; } // Simplified for now

            // Avoid div/0
            if (oVal === 0) ratio = pVal > 0 ? 1.3 : 1.0;
            else ratio = pVal / oVal;

            // Calculate Points
            let points = metricScore(ratio, weight);

            // Defeat Logic Check: "Só métricas com ratio > 1.0 pontuam"
            if (!score.isVictory && ratio <= 1.0) points = 0;

            // Format for display
            performanceMetrics.push({
                label: labels[key] || key,
                key: key,
                player: key === 'kp' ? (pVal * 100).toFixed(0) + '%' : pVal.toFixed(1),
                opponent: key === 'kp' ? (oVal * 100).toFixed(0) + '%' : oVal.toFixed(1),
                points: Math.floor(points),
                maxPoints: weight
            });
        });

        // Calculate Objectives (Fixed weights logic for now)
        // Torres (10), Drag (10), Baron (5)
        const objList = [
            { key: 'turrets', label: 'Torres', p: playerStats.turrets, o: oppMetrics.turrets || 0, w: 10 },
            { key: 'dragons', label: 'Dragões', p: playerStats.dragons, o: oppMetrics.dragons || 0, w: 10 },
            { key: 'barons', label: 'Barões', p: playerStats.barons, o: oppMetrics.barons || 0, w: 5 },
        ];

        const objMetrics = objList.map(item => {
            let ratio = 0;
            if (item.o === 0) ratio = item.p > 0 ? 1.3 : 1.0;
            else ratio = item.p / item.o;

            let pts = metricScore(ratio, item.w);
            if (!score.isVictory && ratio <= 1.0) pts = 0;

            return {
                label: item.label,
                player: item.p,
                opponent: item.o,
                points: Math.floor(pts),
                maxPoints: item.w
            };
        });

        // Discipline
        let discPoints = 0;
        const pDeaths = score.deaths;
        const oDeaths = oppMetrics.deaths || 0;
        if (pDeaths < oDeaths) discPoints = 10;
        else if (pDeaths === oDeaths) discPoints = 5;

        // Cap logic for Defeat handled in engine, but here we show "Potential" points
        // Note: If defeat, the breakdown score is capped, but per-item points might sum up higher. 
        // We'll show the raw calculated points per item to be honest about "what you earned" vs "what you got kept".

        return {
            matchId: score.matchId,
            outcome: score.isVictory ? 'Victory' : 'Defeat',
            date: score.match.gameCreation,
            duration: score.match.gameDuration,

            player: {
                championName: score.championName,
                championId: score.championId,
                kda: `${score.kills}/${score.deaths}/${score.assists}`,
                score: score.matchScore,
                stats: playerStats,
                breakdown: {
                    performance: score.performanceScore,
                    objectives: score.objectivesScore,
                    discipline: score.disciplineScore
                }
            },

            opponent: {
                championName: oppName,
                championId: oppId,
                stats: oppMetrics
            },

            comparisons: {
                performance: performanceMetrics,
                objectives: objMetrics,
                discipline: [
                    { label: 'Mortes', player: score.deaths, opponent: oppMetrics.deaths || 0, invert: true, points: discPoints, maxPoints: 10 },
                ],
                lane: lane
            },

            // Pass Participants through
            participants: metrics.participants || [],

            insight: "Analysis ready."
        };
    }
}
