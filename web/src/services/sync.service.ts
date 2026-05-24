import { prisma } from '../lib/db';
import { runSyncPlayers } from '../cli/sync-players';
import { runSyncRanks } from '../cli/sync-ranks';
import { runIngestBatch, ingestPlayers } from '../cli/ingest-batch';
import { runRankingSeason } from '../cli/ranking-season';
import { randomUUID } from 'crypto';

export interface JobStatus {
    id: string;
    state: 'QUEUED' | 'PROCESSING' | 'COMPLETED' | 'ERROR';
    progress: number;
    total: number | null;
    log: string[];
    result?: any;
    error?: string;
    startedAt: Date;
    updatedAt: Date;
}

export class SyncService {
    private jobs: Map<string, JobStatus> = new Map();

    constructor() {
        // Cleanup old jobs interval (every 1 hour)
        setInterval(() => this.cleanupJobs(), 3600000);
    }

    private cleanupJobs() {
        const now = Date.now();
        for (const [id, job] of this.jobs.entries()) {
            if (now - job.updatedAt.getTime() > 3600000) { // 1 hour retention
                this.jobs.delete(id);
            }
        }
    }

    getJob(id: string): JobStatus | undefined {
        return this.jobs.get(id);
    }

    startManualJob(playerPuuids: string[], limit: number = 5, queue: 'SOLO' | 'FLEX' | 'BOTH' = 'BOTH'): string {
        const id = randomUUID();
        const job: JobStatus = {
            id,
            state: 'QUEUED',
            progress: 0,
            total: null,
            log: [`Queued update for ${playerPuuids.length} players. Limit: ${limit}`],
            startedAt: new Date(),
            updatedAt: new Date()
        };
        this.jobs.set(id, job);

        // Start async logic
        this.processManualJob(job, playerPuuids, limit, queue).catch(err => {
            console.error(`[Job ${id}] Unhandled Error:`, err);
            job.state = 'ERROR';
            job.error = err.message;
            job.updatedAt = new Date();
        });

        return id;
    }

    private async processManualJob(job: JobStatus, playerPuuids: string[], limit: number, queue: 'SOLO' | 'FLEX' | 'BOTH') {
        job.state = 'PROCESSING';
        job.log.push('Starting processing...');
        job.updatedAt = new Date();

        try {
            const players = await prisma.player.findMany({
                where: { puuid: { in: playerPuuids } }
            });

            if (players.length === 0) {
                job.state = 'ERROR';
                job.error = 'No players found';
                job.log.push('❌ No players found in database');
                job.updatedAt = new Date();
                return;
            }

            job.log.push(`Found ${players.length} players. Fetching matches...`);

            // Ingest with callback
            const summary = await ingestPlayers(players, limit, queue, undefined, (processed, total) => {
                job.progress = processed;
                // job.total = total; // We don't really know total easily unless we sum up all matches found first
                job.updatedAt = new Date();
            });

            job.state = 'COMPLETED';
            job.result = summary;
            job.log.push(`✅ Complete! Processed: ${summary.playersProcessed}, Saved: ${summary.matchesSaved}`);
            job.updatedAt = new Date();

        } catch (error: any) {
            job.state = 'ERROR';
            job.error = error.message;
            job.log.push(`❌ Error: ${error.message}`);
            job.updatedAt = new Date();
        }
    }

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
     * Manual Update (Legacy/Synchronous wrapper if needed)
     */
    async manualUpdate(playerPuuids: string[], limit: number = 5, queue: 'SOLO' | 'FLEX' | 'BOTH' = 'BOTH') {
        const players = await prisma.player.findMany({
            where: { puuid: { in: playerPuuids } }
        });

        if (players.length === 0) return { success: false, message: 'No players found' };

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
