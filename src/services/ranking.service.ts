import { PrismaClient } from '@prisma/client';
import { RiotService } from './riot.service';

const prisma = new PrismaClient();

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
    public getStartDateForPeriod(period: 'WEEKLY' | 'MONTHLY' | 'GENERAL'): Date {
        const now = new Date();
        const startDate = new Date();
        startDate.setHours(0, 0, 0, 0);

        if (period === 'WEEKLY') {
            const day = now.getDay();
            const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Monday
            startDate.setDate(diff);
        } else if (period === 'MONTHLY') {
            startDate.setDate(1); // 1st of month
        } else {
            // General / Season
            return new Date('2026-01-01'); // Season Start
        }
        return startDate;
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
    async getPlayerInsights(puuid: string, queueType: 'SOLO' | 'FLEX', page: number = 1, limit: number = 10, sortDir: 'asc' | 'desc' = 'desc') {
        const player = await prisma.player.findUnique({ where: { puuid } });
        if (!player) return null;

        // Count Total for Pagination
        const totalMatches = await prisma.matchScore.count({
            where: {
                playerId: puuid,
                queueType: queueType
            }
        });

        // Optimized Query with Pagination & Correct Sorting
        const scores: any[] = await prisma.matchScore.findMany({
            where: {
                playerId: puuid,
                queueType: queueType
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

        // Aggregation Query (All Time)
        // Includes Playstyle metrics (Performance, Objectives, Discipline)
        const aggregations = await prisma.matchScore.aggregate({
            where: { playerId: puuid, queueType: queueType } as any,
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
            where: { playerId: puuid, queueType: queueType, isVictory: true } as any
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

        // --- Weekly Report Calculation ---
        const startOfWeek = this.getStartDateForPeriod('WEEKLY');

        // Weekly Matches
        const weeklyMatchesState = await prisma.matchScore.groupBy({
            by: ['isVictory'],
            where: {
                playerId: puuid,
                queueType,
                match: { gameCreation: { gte: startOfWeek } }
            },
            _count: { _all: true }
        });

        const weeklyWins = weeklyMatchesState.find(x => x.isVictory)?._count._all || 0;
        const weeklyLosses = weeklyMatchesState.find(x => !x.isVictory)?._count._all || 0;
        const weeklyTotal = weeklyWins + weeklyLosses;
        const weeklyWr = weeklyTotal > 0 ? ((weeklyWins / weeklyTotal) * 100).toFixed(0) : "0";

        // Weekly PDL Delta
        // Helper to normalize LP
        const getVal = (tier: string, rank: string, lp: number) => {
            const tierMap: any = { IRON: 0, BRONZE: 400, SILVER: 800, GOLD: 1200, PLATINUM: 1600, EMERALD: 2000, DIAMOND: 2400, MASTER: 2800, GRANDMASTER: 2800, CHALLENGER: 2800 };
            const rankMap: any = { 'IV': 0, 'III': 100, 'II': 200, 'I': 300, '': 0 }; // Added empty handling
            const tierVal = tierMap[tier] || 0;
            const rankVal = rankMap[rank] || 0;
            if (tierVal >= 2800) return tierVal + lp;
            return tierVal + rankVal + lp;
        };

        // Get Latest Snapshot (Current)
        const currentSnapshot = await prisma.rankSnapshot.findFirst({
            where: { playerId: puuid, queueType },
            orderBy: { createdAt: 'desc' }
        });

        // Get Baseline Snapshot (Last before startOfWeek)
        const baselineSnapshot = await prisma.rankSnapshot.findFirst({
            where: { playerId: puuid, queueType, createdAt: { lt: startOfWeek } },
            orderBy: { createdAt: 'desc' }
        });

        // Use logic: if no baseline, try first of week. If no current, 0.
        let pdlDelta = 0;
        if (currentSnapshot) {
            const currentVal = getVal(currentSnapshot.tier, currentSnapshot.rank, currentSnapshot.lp);
            let baseVal = currentVal; // Default to 0 change

            if (baselineSnapshot) {
                baseVal = getVal(baselineSnapshot.tier, baselineSnapshot.rank, baselineSnapshot.lp);
            } else {
                // Try first snapshot of the week
                const firstOfWeek = await prisma.rankSnapshot.findFirst({
                    where: { playerId: puuid, queueType, createdAt: { gte: startOfWeek } },
                    orderBy: { createdAt: 'asc' }
                });
                if (firstOfWeek) {
                    baseVal = getVal(firstOfWeek.tier, firstOfWeek.rank, firstOfWeek.lp);
                }
            }
            pdlDelta = currentVal - baseVal;
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
                wins: weeklyWins,
                losses: weeklyLosses,
                total: weeklyTotal,
                winRate: weeklyWr,
                pdlDelta
            },
            playstyle: {
                combat: Math.round(aggregations._avg.performanceScore || 0),
                objectives: Math.round(aggregations._avg.objectivesScore || 0),
                discipline: Math.round(aggregations._avg.disciplineScore || 0)
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
                await prisma.player.upsert({
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
            include: { player: true, match: true }
        });

        // 1. Aggregations (Pentas, Consistency)
        const playerStats: Record<string, {
            player: any,
            pentaCount: number,
            scores: number[],
            games: number
        }> = {};

        // 2. Single Game Records
        let stomper: any = null;
        let stomperKda = -1;

        let farmMachine: any = null;
        let farmRecord = -1;

        let objectiveKing: any = null;
        let objRecord = -1;

        let laneBully: any = null; // Avg Diff @ 15 (Requires aggregation, but let's do single game max for "Bully" or Avg? User said 'Role Filter' implies Avg)
        // User Spec: "Lane Bully... formula: avg(gold_diff_15 + xp_diff_15)" -> Aggregation needed.
        // Let's execute aggregation loop first.

        let damageEfficient: any = null;
        let dmgEffRecord = -1;

        let teamfightMaestro: any = null;
        let tfRecord = -1;

        // New Insights
        let torreDemolidora: any = null;
        let torreRecord = -1;

        let roamerMestre: any = null;
        let roamRecord = -1;

        let soloClutch: any = null;
        let soloRecord = -1;

        let costasSeguras: any = null;
        let costasRecord = -1;

        let earlyTyrant: any = null;
        let earlyRecord = -1;

        let lateDemon: any = null;
        let lateRecord = -1;

        let jungleGod: any = null;
        let jungleRecord = -1;

        let macroPerfect: any = null;
        let macroRecord = -1;

        // Populate Aggregations & Single Game Checks
        for (const s of scores) {
            const metrics = s.metrics as any;
            const challenges = metrics?.challenges || {};

            if (!playerStats[s.playerId]) {
                playerStats[s.playerId] = { player: s.player, pentaCount: 0, scores: [], games: 0 };
            }
            const pStats = playerStats[s.playerId];
            pStats.games++;
            pStats.scores.push(s.matchScore);
            pStats.pentaCount += Number(metrics?.pentaKills || 0);

            // --- Single Game Records ---

            // Stomper (KDA)
            const kda = s.deaths === 0 ? (s.kills + s.assists) : (s.kills + s.assists) / s.deaths;
            if (kda > stomperKda) {
                stomperKda = kda;
                stomper = { ...s.player, value: kda.toFixed(2), label: 'KDA', matchId: s.matchId, champion: s.championName };
            }

            // Farm Machine (CSPM)
            const cspm = Number(metrics?.cspm || 0);
            if (cspm > farmRecord && s.lane !== 'JUNGLE' && s.lane !== 'UTILITY') { // Exclude Jg/Sup
                farmRecord = cspm;
                farmMachine = { ...s.player, value: cspm.toFixed(1), label: 'CS/Min', matchId: s.matchId, champion: s.championName };
            }

            // Damage Efficient (Dmg / Gold) - Single Game Peak? Or Avg? User didn't specify. Assuming Single Game Peak is cooler for "Hall of Fame".
            // Actually "Damage Efficient" implies playstyle. Let's do Avg if possible, or Peak.
            // Formula: total_damage / total_gold.
            const gold = metrics?.goldEarned || 1;
            const dmg = metrics?.totalDamage || 0;
            const efficiency = dmg / gold;
            if (efficiency > dmgEffRecord && s.lane !== 'UTILITY') {
                dmgEffRecord = efficiency;
                damageEfficient = { ...s.player, value: efficiency.toFixed(2), label: 'Dano/Ouro', matchId: s.matchId, champion: s.championName };
            }

            // Objective King (Single Game Weighted)
            // (dragons*3 + barons*5 + herald*2 + towers*1)
            const wObj = (challenges.dragonTakedowns || 0) * 3 + (challenges.baronTakedowns || 0) * 5 + (challenges.riftHeraldTakedowns || 0) * 2 + (challenges.turretTakedowns || 0);
            if (wObj > objRecord) {
                objRecord = wObj;
                objectiveKing = { ...s.player, value: wObj, label: 'Pts Objetivos', matchId: s.matchId, champion: s.championName };
            }

            // 1. Torre Demolidora (Plates * 150 + Dmg Buildings)
            const plates = Number(metrics?.turretPlatesTaken || 0);
            const dmgBuildings = Number(metrics?.damageDealtToBuildings || 0);
            const towerScore = (plates * 150) + dmgBuildings;
            if (towerScore > torreRecord) {
                torreRecord = towerScore;
                torreDemolidora = { ...s.player, value: Number(dmgBuildings).toLocaleString(), label: 'Dano a Torres', matchId: s.matchId, champion: s.championName, detail: `${plates} Placas` };
            }

            // 2. SoloClutch (Solo Kills)
            const solos = Number(challenges.soloKills || 0);
            if (solos > soloRecord) {
                soloRecord = solos;
                soloClutch = { ...s.player, value: solos, label: 'Solo Kills', matchId: s.matchId, champion: s.championName };
            }

            // 3. Costas Seguras (Sup/Tank)
            if (s.lane === 'UTILITY' || s.lane === 'JUNGLE') {
                const saves = Number(challenges.saveAllyFromDeath || 0);
                // Weight assists heavily
                const guardScore = saves * 2 + s.assists;
                if (guardScore > costasRecord) {
                    costasRecord = guardScore;
                    costasSeguras = { ...s.player, value: saves, label: 'Salvos da Morte', matchId: s.matchId, champion: s.championName, detail: `${s.assists} Assists` };
                }
            }

            // 4. Early Game Tyrant (Gold Diff @ 15)
            const earlyDiff = (Number(challenges.goldDiffAt15 || 0)) + (Number(challenges.xpDiffAt15 || 0) * 2); // XP worth more early?
            if (earlyDiff > earlyRecord) {
                earlyRecord = earlyDiff;
                earlyTyrant = { ...s.player, value: Number(challenges.goldDiffAt15 || 0).toFixed(0), label: 'Vantagem Ouro @15', matchId: s.matchId, champion: s.championName };
            }

            // 5. Late Game Demon (> 30 min, High KDA/Dmg)
            if (s.match.gameDuration > 1800) { // 30min
                const lateScore = (metrics.totalDamage || 0) + ((s.kills + s.assists) * 1000);
                if (lateScore > lateRecord) {
                    lateRecord = lateScore;
                    lateDemon = { ...s.player, value: `${s.kills}/${s.deaths}/${s.assists}`, label: 'KDA Late Game', matchId: s.matchId, champion: s.championName };
                }
            }

            // 6. Jungle Pathing God (JG Only)
            if (s.lane === 'JUNGLE') {
                const monsterKills = (Number(challenges.enemyJungleMonsterKills || 0)) + (Number(metrics.totalMinions || 0)); // totalMinions includes neutral
                const jgScore = monsterKills + (Number(metrics.visionScore || 0) * 2);
                if (jgScore > jungleRecord) {
                    jungleRecord = jgScore;
                    jungleGod = { ...s.player, value: monsterKills, label: 'Campos Farmados', matchId: s.matchId, champion: s.championName };
                }
            }

            // 7. Macro Perfect (Low Kills, High Obj, Win)
            if (s.isVictory && s.kills < 5) {
                const macroScore = (challenges.turretTakedowns || 0) + (challenges.dragonTakedowns || 0) * 2;
                if (macroScore > macroRecord) {
                    macroRecord = macroScore;
                    macroPerfect = { ...s.player, value: macroScore, label: 'Objetivos (Low Kill)', matchId: s.matchId, champion: s.championName };
                }
            }

        }

        // --- Aggregated Records ---
        const dayDiff = (end.getTime() - start.getTime()) / (1000 * 3600 * 24);
        const dynamicMin = dayDiff <= 7 ? 2 : (dayDiff <= 31 ? 5 : 10);

        // --- Aggregated Records ---
        // Lane Bully (Avg Diff @ 15) - Requires aggregating diffs.
        // Since we don't have diffs in `scores` loop easily without extra query or complex type, skipping for now or approximating?
        // Wait, I added `goldDiffAt15` to metrics in ingest. But only for NEW matches.
        // Logic: Calculate Avg Diff for players.
        const validStats = Object.values(playerStats).filter(s => s.games >= dynamicMin);

        // Penta King (Sum)
        const pentaWinner = Object.values(playerStats).sort((a, b) => b.pentaCount - a.pentaCount)[0];
        const pentaKing = (pentaWinner && pentaWinner.pentaCount > 0) ? { ...pentaWinner.player, value: pentaWinner.pentaCount, label: 'Pentakills' } : null;

        // Consistency Machine
        let consistencyMachine: any = null;
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
                consistencyMachine = { ...p.player, value: std.toFixed(1), label: 'Desvio Padrão' };
            }
        }

        return {
            pentaKing,
            stomper,
            farmMachine,
            objectiveKing,
            damageEfficient,
            consistencyMachine,
            // New
            torreDemolidora,
            soloClutch,
            costasSeguras,
            earlyTyrant,
            lateDemon,
            jungleGod,
            macroPerfect
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

        let lowDmg: any = null;
        let minDmgRecord = 999999;

        let alface: any = null;
        let lowestConversion = 1.0;

        let ghostFarmer: any = null; // Farmador Fantasma - This was replaced by farmLimbo
        let ghostScore = -1; // Higher is worse

        let visionNegligente: any = null;
        let lowestVision = 999;

        let sumido: any = null;
        let lowestKp = 1.0;

        // New Hall of Shame
        let sonecaBaron: any = null; // Ignora objetivos
        let sonecaScore = -1;

        let gpsQuebrado: any = null; // Anda mt faz pouco (Low KP/Dmg in long game)
        let gpsScore = -1;

        let killCollector: any = null; // Kills sem torre
        let collectorScore = -1;

        let farmLimbo: any = null; // CS alto, KP baixo, Derrota
        let limboScore = -1;

        let throwingStation: any = null; // Gold Diff High -> Loss
        let throwScore = -1;

        let soloDoador: any = null; // Mortes Solo
        let doadorScore = -1;

        let telaPreta: any = null; // Tempo morto
        let telaScore = -1;

        let moedaBronze: any = null; // Score baixo + vitoria
        let bronzeScore = 999;

        let dragonAlegria: any = null; // JG 0 Drakes vs 4
        let dragonScore = -1;

        for (const s of scores) {
            const metrics = s.metrics as any;
            const challenges = metrics.challenges || {};
            const durationMin = s.match.gameDuration / 60;
            const participation = s.kills + s.assists;
            const totalKills = s.kills + s.assists + s.deaths; // loose approx of team kills if we don't have it? no metrics.kp is accurate.
            const kp = Number(metrics?.challenges?.killParticipation || 0);

            // 1. Low Damage (Existing)
            if (s.lane !== 'UTILITY' && s.match.gameDuration > 900) {
                const dmg = Number(metrics?.totalDamage || 999999);
                if (dmg < minDmgRecord && dmg > 0) {
                    minDmgRecord = dmg;
                    lowDmg = { ...s.player, value: Number(dmg).toLocaleString(), label: 'Dano Total', matchId: s.matchId, champion: s.championName };
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

            // 3. Vision Negligente (Supp/Jg only)
            if ((s.lane === 'UTILITY' || s.lane === 'JUNGLE') && s.match.gameDuration > 1200) {
                const vs = Number(metrics?.visionScore || 999);
                const vspm = vs / durationMin;
                if (vspm < lowestVision && vspm > 0) { // >0 to avoid AFKs/Bugs
                    lowestVision = vspm;
                    visionNegligente = { ...s.player, value: vspm.toFixed(2), label: 'Visão/Min', matchId: s.matchId, champion: s.championName };
                }
            }

            // 4. Farmador Fantasma (High CS, Low KP, Low Obj) - Legacy, folding into Farm No Limbo or keeping?
            // Replacing with "Farm no Limbo" as requested (Farm decente + derrota por macro)
            if (['TOP', 'MIDDLE', 'BOTTOM'].includes(s.lane) && s.match.gameDuration > 1500 && !s.isVictory) {
                const cspm = Number(metrics?.cspm || 0);
                // Farm no Limbo: High CS, Low KP, Loss
                if (cspm > 7.0 && kp < 0.3) {
                    const score = cspm * (1 - kp); // Higher is "better" candidate
                    if (score > limboScore) {
                        limboScore = score;
                        farmLimbo = { ...s.player, value: `${cspm.toFixed(1)} CS/min`, label: 'Farm no Limbo', matchId: s.matchId, champion: s.championName, detail: `KP: ${(kp * 100).toFixed(0)}%` };
                    }
                }
            }

            // 5. Sumido -> Missão Solo Queue
            if (s.match.gameDuration > 1200) {
                if (kp < lowestKp && kp >= 0) {
                    lowestKp = kp;
                    sumido = { ...s.player, value: (kp * 100).toFixed(0) + '%', label: 'Participação (KP)', matchId: s.matchId, champion: s.championName };
                }
            }

            // NEW SHAME INSIGHTS

            // 6. Soneca do Baron (JG farming during obj?) - Hard to prove "during", but Low Obj Participation vs Game Duration
            if (s.lane === 'JUNGLE' && s.match.gameDuration > 1500 && !s.isVictory) {
                const objs = (challenges.dragonTakedowns || 0) + (challenges.baronTakedowns || 0);
                if (objs === 0) {
                    sonecaBaron = { ...s.player, value: '0', label: 'Objetivos em 25m+', matchId: s.matchId, champion: s.championName };
                }
            }

            // 7. Kill Collector (Kills > 10, Tower Dmg < 1000, Loss)
            if (s.kills > 10 && !s.isVictory) {
                const towerDmg = Number(metrics?.damageDealtToBuildings || 0);
                if (towerDmg < 1000) {
                    // Higher kills = worse collector
                    if (s.kills > collectorScore) {
                        collectorScore = s.kills;
                        killCollector = { ...s.player, value: s.kills, label: 'Kills sem Objetivo', matchId: s.matchId, champion: s.championName, detail: `${towerDmg.toFixed(0)} Dano Torre` };
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

            // 9. Solo Doador (High Deaths, Low KP - "Entregando")
            // Differs from "Sumido" (Low KP). This is "Feeder".
            // Deaths > 8, KP < 30%
            if (s.deaths > 8 && kp < 0.3) {
                const ratio = s.deaths / (kp + 0.1);
                if (ratio > doadorScore) {
                    doadorScore = ratio;
                    soloDoador = { ...s.player, value: `${s.deaths} Mortes`, label: 'Solo Doador', matchId: s.matchId, champion: s.championName, detail: `KP: ${(kp * 100).toFixed(0)}%` };
                }
            }

            // 10. Tempo de Tela Preta (> 20% dead)
            const timeDead = Number(metrics.totalTimeSpentDead || 0);
            if (timeDead > 0) {
                const deadRatio = timeDead / s.match.gameDuration;
                if (deadRatio > 0.20 && deadRatio > telaScore) {
                    telaScore = deadRatio;
                    telaPreta = { ...s.player, value: `${(deadRatio * 100).toFixed(0)}%`, label: 'Tempo Morto', matchId: s.matchId, champion: s.championName };
                }
            }

            // 11. Moeda de Bronze (Win with low score)
            if (s.isVictory && s.matchScore < 40) {
                if (s.matchScore < bronzeScore) {
                    bronzeScore = s.matchScore;
                    moedaBronze = { ...s.player, value: s.matchScore, label: 'Carregado (Score)', matchId: s.matchId, champion: s.championName };
                }
            }

        }

        return {
            lowDmg,
            alface,
            visionNegligente,
            sumido,
            // New
            sonecaBaron,
            killCollector,
            farmLimbo,
            throwingStation,
            soloDoador,
            telaPreta,
            moedaBronze
        };
    }
}
