import { FastifyInstance } from 'fastify';
import { RankingService } from '../services/ranking.service';
import { SyncService } from '../services/sync.service'; // Added
import { PrismaClient } from '@prisma/client';
import { RiotService } from '../services/riot.service';

const prisma = new PrismaClient();
const riotService = new RiotService(process.env.RIOT_API_KEY || '');
const rankingService = new RankingService(riotService);
const syncService = new SyncService(); // Added

export async function rankingRoutes(fastify: FastifyInstance) {

    // 1. Ranking General
    interface RankingQuery { queue?: string; limit?: number; startDate?: string; endDate?: string; }
    fastify.get<{ Querystring: RankingQuery }>('/api/ranking/season', async (request, reply) => {
        const { queue = 'SOLO', limit = 100, startDate, endDate } = request.query;

        // Force No Cache
        reply.header('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
        reply.header('Expires', '0');

        // Validate queue
        const q = queue === 'FLEX' ? 'FLEX' : 'SOLO';
        const l = Number(limit) || 100;

        try {
            const start = startDate ? new Date(startDate) : undefined;
            const end = endDate ? new Date(endDate) : undefined;
            const data = await rankingService.getSeasonRanking(q, l, start, end);
            console.log(`[API] /ranking/season - ${data.length} records (Start: ${startDate}, End: ${endDate})`);
            return data;
        } catch (error) {
            console.error(error);
            reply.status(500).send({ error: 'Internal Server Error' });
        }
    });

    // 2. Ranking By Elo
    interface EloQuery { queue?: string; tier?: string; limit?: number; startDate?: string; endDate?: string; }
    fastify.get<{ Querystring: EloQuery }>('/api/ranking/season/by-elo', async (request, reply) => {
        const { queue = 'SOLO', tier = 'ALL', limit = 100, startDate, endDate } = request.query;
        const q = queue === 'FLEX' ? 'FLEX' : 'SOLO';
        const l = Number(limit) || 100;

        try {
            const start = startDate ? new Date(startDate) : undefined;
            const end = endDate ? new Date(endDate) : undefined;
            const data = await rankingService.getRankingByElo(q, tier, l, start, end);
            return data;
        } catch (error) {
            console.error(error);
            reply.status(500).send({ error: 'Internal Server Error' });
        }
    });

    // 3. Player History
    interface PlayerParams { puuid: string; }
    interface HistoryQuery { queue?: string; }
    fastify.get<{ Params: PlayerParams, Querystring: HistoryQuery }>('/api/player/:puuid/history', async (request, reply) => {
        const { puuid } = request.params;
        const { queue = 'SOLO' } = request.query;
        // Validate queue
        const q = queue === 'FLEX' ? 'FLEX' : 'SOLO';

        try {
            const data = await rankingService.getPlayerHistory(puuid, q);
            if (!data) return reply.status(404).send({ error: 'Player not found' });
            return data;
        } catch (error) {
            console.error(error);
            reply.status(500).send({ error: 'Internal Server Error' });
        }
    });

    // 4. PDL Gain Ranking
    interface PdlQuery { queue?: string; limit?: number; startDate?: string; }
    fastify.get<{ Querystring: PdlQuery }>('/api/ranking/pdl-gain', async (request, reply) => {
        const { queue = 'SOLO', limit = 20, startDate } = request.query;
        const q = queue === 'FLEX' ? 'FLEX' : 'SOLO';
        const l = Number(limit) || 20;
        const d = startDate ? new Date(startDate) : undefined;

        try {
            const data = await rankingService.getPdlGainRanking(q, l, d);
            return data;
        } catch (error) {
            console.error(error);
            reply.status(500).send({ error: 'Internal Server Error' });
        }
    });

    // 6. Highlights (Weekly/Monthly)
    interface HighlightsQuery { queue?: string; startDate?: string; endDate?: string; }
    fastify.get<{ Querystring: HighlightsQuery }>('/api/ranking/insights', async (request, reply) => {
        const { queue = 'SOLO', startDate, endDate } = request.query;
        const q = queue === 'FLEX' ? 'FLEX' : 'SOLO';

        try {
            const start = startDate ? new Date(startDate) : undefined;
            const end = endDate ? new Date(endDate) : undefined;
            const data = await rankingService.getHighlights(q, start, end);
            return data;
        } catch (error) {
            console.error(error);
            reply.status(500).send({ error: 'Internal Server Error' });
        }
    });

    // 5. Player Insights
    interface InsightsQuery extends HistoryQuery { page?: number; limit?: number; sort?: 'asc' | 'desc'; startDate?: string; endDate?: string; }
    fastify.get<{ Params: PlayerParams, Querystring: InsightsQuery }>('/api/player/:puuid/insights', async (request, reply) => {
        const { puuid } = request.params;
        const { queue = 'SOLO', page = 1, limit = 10, sort = 'desc', startDate, endDate } = request.query;
        const q = queue === 'FLEX' ? 'FLEX' : 'SOLO';
        const p = Number(page) || 1;
        const l = Number(limit) || 10;
        const s = sort === 'asc' ? 'asc' : 'desc';

        try {
            const start = startDate ? new Date(startDate) : undefined;
            const end = endDate ? new Date(endDate) : undefined;
            const data = await rankingService.getPlayerInsights(puuid, q, p, l, s, start, end);
            if (!data) {
                // Return empty/default object instead of 404 to satisfy frontend types
                return {
                    stats: {
                        avgScore: "0",
                        winRate: "0%",
                        totalGames: 0,
                        avgKda: "0",
                        bestScore: 0,
                        worstScore: 0
                    },
                    history: [],
                    insights: {
                        consistency: '-',
                        trend: '-'
                    }
                };
            }
            return data;
        } catch (error) {
            console.error(error);
            reply.status(500).send({ error: 'Internal Server Error' });
        }
    });

    // 5.5 Player Detailed Insights (New)
    interface DetailedInsightsQuery { queue?: string; startDate?: string; endDate?: string; }
    fastify.get<{ Params: PlayerParams, Querystring: DetailedInsightsQuery }>('/api/player/:puuid/detailed-insights', async (request, reply) => {
        const { puuid } = request.params;
        const { queue, startDate, endDate } = request.query;

        // Map Queue (Allow BOTH)
        let q: 'SOLO' | 'FLEX' | 'BOTH' = 'SOLO';
        if (queue === 'FLEX') q = 'FLEX';
        if (queue === 'BOTH') q = 'BOTH';

        try {
            const start = startDate ? new Date(startDate) : undefined;
            const end = endDate ? new Date(endDate) : undefined;
            const data = await rankingService.getPlayerDetailedStats(puuid, q, start, end);
            if (!data) return reply.status(404).send({ error: 'No data found' });
            return data;
        } catch (error) {
            console.error(error);
            reply.status(500).send({ error: 'Internal Server Error' });
        }
    });
    // 7. System Initialization
    fastify.get('/api/system/init-status', async (request, reply) => {
        try {
            return await rankingService.getSystemInitStatus();
        } catch (error) {
            console.error(error);
            reply.status(500).send({ error: 'Internal Server Error' });
        }
    });

    interface InitPlayersBody { players: { gameName: string; tagLine: string }[] }
    fastify.post<{ Body: InitPlayersBody }>('/api/system/init-players', async (request, reply) => {
        const { players } = request.body;
        if (!players || !Array.isArray(players) || players.length === 0) {
            return reply.status(400).send({ error: 'Invalid players list' });
        }

        try {
            // 1. Add Players
            const result = await rankingService.bulkAddPlayers(players);
            const addedCount = result.success.length;

            if (addedCount === 0 && result.failed.length > 0) {
                return reply.status(400).send({ error: 'Failed to find players', details: result });
            }

            // 2. Fast Sync (Safeguarded)
            // Even if this times out or fails, we should report success for adding players
            let syncWarning = undefined;
            try {
                if (addedCount > 0) {
                    console.log(`[API] Starting Fast Sync for ${addedCount} new players...`);
                    await syncService.runFastSync();
                }
            } catch (err: any) {
                console.warn('[API] Fast Sync Warning:', err.message);
                syncWarning = 'Players added, but initial data sync timed out. It will complete in the background.';
            }

            // 3. Trigger Background Ingest (Heavy lifting: Match History, Calc)
            syncService.runBackgroundIngest().catch(err => console.error('Background Ingest Error:', err));

            return {
                ...result,
                message: 'Players added. Processing started.',
                warning: syncWarning
            };
        } catch (error) {
            console.error(error);
            reply.status(500).send({ error: 'Internal Server Error' });
        }
    });

    // 8. System Status
    fastify.get('/api/status', async (request, reply) => {
        console.log(`[API] /status - Request received at ${new Date().toISOString()}`);
        reply.header('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
        reply.header('Pragma', 'no-cache');
        reply.header('Expires', '0');

        try {
            const data = await rankingService.getSystemStatus();
            console.log(`[API] /status - Returning: ${JSON.stringify(data)}`);
            return data;
        } catch (error) {
            console.error('[API] /status - ERROR:', error);
            reply.status(500).send({ error: 'Internal Server Error' });
        }
    });

    // 8. Player Management (Admin)
    interface AddPlayerBody { gameName: string; tagLine: string; }
    fastify.post<{ Body: AddPlayerBody }>('/api/players', async (request, reply) => {
        const adminPwd = process.env.ADMIN_PASSWORD;
        const providedPwd = request.headers['x-admin-password'];

        if (!adminPwd || providedPwd !== adminPwd) {
            return reply.status(401).send({ error: 'Unauthorized' });
        }

        const { gameName, tagLine } = request.body;
        if (!gameName || !tagLine) {
            return reply.status(400).send({ error: 'Missing gameName or tagLine' });
        }

        try {
            // 1. Resolve Account
            const account = await riotService.getAccountByRiotId(gameName, tagLine);

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

            console.log(`[API] Added player: ${player.gameName} #${player.tagLine}. Starting deep sync...`);

            // 3. Immediate Sync of Metadata (Icon, Level)
            try {
                const summoner = await riotService.getSummonerByPuuid(player.puuid);
                player = await prisma.player.update({
                    where: { puuid: player.puuid },
                    data: {
                        profileIconId: summoner.profileIconId,
                        summonerLevel: summoner.summonerLevel
                    }
                });
                console.log('   -> Updated Summoner Info (Icon/Level)');
            } catch (e: any) {
                console.warn(`[API] Failed to sync summoner info: ${e.message}`);
            }

            // 4. Immediate Sync of Ranks (Elo)
            try {
                const leagues = await riotService.getLeagueEntriesByPuuid(player.puuid);
                for (const entry of leagues) {
                    const queueMap: any = { 'RANKED_SOLO_5x5': 'SOLO', 'RANKED_FLEX_SR': 'FLEX' };
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
                    console.log(`   -> Rank Synced: ${qType} ${entry.tier} ${entry.rank}`);
                }
            } catch (e: any) {
                console.warn(`[API] Failed to sync ranks: ${e.message}`);
            }

            // 5. Fetch Matches (Async but triggered - last 50 matches)
            try {
                console.log('   -> Triggering 50 matches sync (BOTH queues)...');
                await syncService.manualUpdate([player.puuid], 50, 'BOTH');
            } catch (e: any) {
                console.error(`[API] Failed initial match sync: ${e.message}`);
            }

            return { message: 'Player added and fully synced', player };

        } catch (error: any) {
            console.error('[API] Add Player Error:', error);
            if (error.response?.status === 404) {
                return reply.status(404).send({ error: 'Riot ID not found' });
            }
            reply.status(500).send({ error: 'Internal Server Error' });
        }
    });

    // 8.5 Manual Update (Admin) - Async Job
    interface ManualUpdateBody { puuids: string[]; matchCount?: number; queue?: 'SOLO' | 'FLEX' | 'BOTH'; }
    fastify.post<{ Body: ManualUpdateBody }>('/api/admin/manual-update', async (request, reply) => {
        const adminPwd = process.env.ADMIN_PASSWORD;
        const providedPwd = request.headers['x-admin-password'];

        if (!adminPwd || providedPwd !== adminPwd) {
            return reply.status(401).send({ error: 'Unauthorized' });
        }

        const { puuids, matchCount = 5, queue = 'BOTH' } = request.body;

        if (!puuids || puuids.length === 0) {
            return reply.status(400).send({ error: 'No players specified' });
        }

        try {
            console.log(`[API] Triggering Async Manual Update for ${puuids.length} players...`);

            // Start Async Job
            const jobId = syncService.startManualJob(puuids, matchCount, queue);

            // Return 202 Accepted with Job ID
            return reply.status(202).send({
                message: 'Update accepted',
                jobId,
                statusUrl: `/api/admin/jobs/${jobId}`
            });

        } catch (error: any) {
            console.error('[API] Manual Update Error:', error);
            reply.status(500).send({ error: 'Internal Server Error', details: error.message });
        }
    });

    // 8.6 Job Status (Admin)
    interface JobParams { id: string; }
    fastify.get<{ Params: JobParams }>('/api/admin/jobs/:id', async (request, reply) => {
        const adminPwd = process.env.ADMIN_PASSWORD;
        const providedPwd = request.headers['x-admin-password'];

        if (!adminPwd || providedPwd !== adminPwd) {
            return reply.status(401).send({ error: 'Unauthorized' });
        }

        const { id } = request.params;
        const job = syncService.getJob(id);

        if (!job) {
            return reply.status(404).send({ error: 'Job not found' });
        }

        return job;
    });

    // 9. Insights (Hall of Fame & Shame)
    interface InsightsQueryShort { queue?: string; startDate?: string; endDate?: string; }

    fastify.get<{ Querystring: InsightsQueryShort }>('/api/insights/fame', async (request, reply) => {
        const { queue = 'SOLO', startDate, endDate } = request.query;
        const q = queue === 'FLEX' ? 'FLEX' : 'SOLO';
        try {
            const start = startDate ? new Date(startDate) : undefined;
            const end = endDate ? new Date(endDate) : undefined;
            return await rankingService.getHallOfFame(q, start, end);
        } catch (error) {
            console.error(error);
            reply.status(500).send({ error: 'Internal Server Error' });
        }
    });

    fastify.get<{ Querystring: InsightsQueryShort }>('/api/insights/shame', async (request, reply) => {
        const { queue = 'SOLO', startDate, endDate } = request.query;
        const q = queue === 'FLEX' ? 'FLEX' : 'SOLO';
        try {
            const start = startDate ? new Date(startDate) : undefined;
            const end = endDate ? new Date(endDate) : undefined;
            return await rankingService.getHallOfShame(q, start, end);
        } catch (error) {
            console.error(error);
            reply.status(500).send({ error: 'Internal Server Error' });
        }
    });

    // 9.5 Community Relations (Social Analytics)
    interface RelationsQuery { queue?: string; startDate?: string; endDate?: string; }
    fastify.get<{ Querystring: RelationsQuery }>('/api/community/relations', async (request, reply) => {
        const { queue = 'SOLO', startDate, endDate } = request.query;
        // Map 'BOTH' or specific queue
        let q: 'SOLO' | 'FLEX' | 'BOTH' = 'SOLO';
        if (queue === 'FLEX') q = 'FLEX';
        if (queue === 'BOTH') q = 'BOTH';

        try {
            const start = startDate ? new Date(startDate) : undefined;
            const end = endDate ? new Date(endDate) : undefined;
            return await rankingService.getCommunityRelations(q, start, end);
        } catch (error) {
            console.error(error);
            reply.status(500).send({ error: 'Internal Server Error' });
        }
    });

    // 10. Global Matches & Highlights
    interface GlobalMatchesQuery { page?: number; limit?: number; player?: string; lane?: string; queue?: string; champion?: string; }
    fastify.get<{ Querystring: GlobalMatchesQuery }>('/api/matches', async (request, reply) => {
        const { page = 1, limit = 20, player, lane, queue, champion } = request.query;
        const p = Number(page) || 1;
        const l = Number(limit) || 20;

        try {
            return await rankingService.getGlobalMatches(p, l, { playerPuuid: player, lane, queue, champion });
        } catch (error) {
            console.error(error);
            reply.status(500).send({ error: 'Internal Server Error' });
        }
    });

    // 11. Match Details (Lazy Enrichment)
    interface MatchDetailsParams { matchId: string; }
    interface MatchDetailsQuery { puuid: string; }
    fastify.get<{ Params: MatchDetailsParams, Querystring: MatchDetailsQuery }>('/api/matches/:matchId/details', async (request, reply) => {
        const { matchId } = request.params;
        const { puuid } = request.query;

        if (!puuid) return reply.status(400).send({ error: 'Missing puuid' });

        try {
            const data = await rankingService.getMatchDetailsWithCache(matchId, puuid);
            if (!data) return reply.status(404).send({ error: 'Match/Player not found' });
            return data;
        } catch (error) {
            console.error(error);
            reply.status(500).send({ error: 'Internal Server Error' });
        }
    });

    interface HighlightsQuery2 { period?: 'DAILY' | 'WEEKLY' | 'MONTHLY'; queue?: string; }
    fastify.get<{ Querystring: HighlightsQuery2 }>('/api/matches/highlights', async (request, reply) => {
        const { period = 'DAILY', queue = 'SOLO' } = request.query;
        try {
            return await rankingService.getGlobalHighlights(period, queue);
        } catch (error) {
            console.error(error);
            reply.status(500).send({ error: 'Internal Server Error' });
        }
    });
}
