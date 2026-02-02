import { PrismaClient } from '@prisma/client';
import { runSyncPlayers } from '../cli/sync-players';
import { runSyncRanks } from '../cli/sync-ranks';
import { runIngestBatch, ingestPlayers } from '../cli/ingest-batch';
import { runRankingSeason } from '../cli/ranking-season';

const prisma = new PrismaClient();

export class SyncService {
    /**
     * Fast Sync: Only essential metadata (Icons, Level, Mastery, Ranks)
     * Awaited by the frontend for immediate "Premium" feel.
     */
    async runFastSync() {
        console.log('⚡ [SyncService] Starting Fast Sync...');
        try {
            // 1. Sync Players (Icon, Level, Mastery)
            await this.runJob('sync-players', async () => await runSyncPlayers());

            // 2. Sync Ranks (Tier, LP)
            await this.runJob('sync-ranks', async () => await runSyncRanks());

            console.log('⚡ [SyncService] Fast Sync Complete!');
            return { success: true };
        } catch (error) {
            console.error('❌ [SyncService] Fast Sync Failed:', error);
            throw error;
        }
    }

    /**
     * Background Ingest: Heavy lifting (Matches, Stats, Ranking Calc)
     */
    async runBackgroundIngest() {
        console.log('🐢 [SyncService] Starting Background Ingest...');
        try {
            // 3. Ingest Batch (Limited to 25 matches for speed/safety)
            await this.runJob('ingest-batch', async () => {
                process.env.MATCH_LIMIT = '25';
                try {
                    await runIngestBatch();
                } finally {
                    delete process.env.MATCH_LIMIT;
                }
            });

            // 4. Calculate Scores/Ranking
            await this.runJob('ranking-season', async () => await runRankingSeason());

            // 5. Mark Complete
            await prisma.systemState.upsert({
                where: { key: 'BOOTSTRAPPED' },
                update: { value: 'true' },
                create: { key: 'BOOTSTRAPPED', value: 'true' }
            });

            // 6. Timestamp Update
            await prisma.systemState.upsert({
                where: { key: 'LAST_UPDATE' },
                update: { value: new Date().toISOString() },
                create: { key: 'LAST_UPDATE', value: new Date().toISOString() }
            });

            console.log('✨ [SyncService] Background Ingest Complete!');
            return { success: true };
        } catch (error) {
            console.error('❌ [SyncService] Ingest Failed:', error);
            throw error;
        }
    }

    /**
     * Manual Update: Targeted update for specific players
     * Respects rate limits by pausing background scheduler (handled by caller/API)
     */
    async manualUpdate(playerPuuids: string[], limit: number = 5, queue: 'SOLO' | 'FLEX' | 'BOTH' = 'BOTH') {
        console.log(`\n🔧 [SyncService] Starting Manual Update for ${playerPuuids.length} players...`);

        const players = await prisma.player.findMany({
            where: { puuid: { in: playerPuuids } }
        });

        if (players.length === 0) {
            return { success: false, message: 'No players found' };
        }

        // Use shared ingestion logic
        const summary = await ingestPlayers(players, limit, queue);

        return { success: true, summary };
    }

    /**
     * Full Bootstrap (Legacy / Scheduled)
     */
    async runBootstrap() {
        console.log('🔄 [SyncService] Starting Bootstrap Protocol...');
        try {
            await this.runFastSync();
            await this.runBackgroundIngest();
            console.log('✨ [SyncService] Bootstrap Complete!');
            return { success: true };
        } catch (error) {
            console.error('❌ [SyncService] Bootstrap Failed:', error);
            throw error;
        }
    }

    private async runJob(name: string, jobFn: () => Promise<void>): Promise<void> {
        console.log(`\n🚀 [SyncService] Running: ${name}`);
        const start = Date.now();
        await jobFn();
        const duration = ((Date.now() - start) / 1000).toFixed(2);
        console.log(`✅ [SyncService] Finished ${name} in ${duration}s`);
    }
}
