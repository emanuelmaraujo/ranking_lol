import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { CronJob } from 'cron';
import { runIngestBatch } from '../cli/ingest-batch';
import { runSyncRanks } from '../cli/sync-ranks';
import { runSyncPlayers } from '../cli/sync-players';
import { runRankingSeason } from '../cli/ranking-season';
import { runSnapshot } from '../cli/snapshot';

const prisma = new PrismaClient();

// Flag to prevent overlapping jobs (extra safety)
let isJobRunning = false;

async function runJob(name: string, jobFn: () => Promise<void>): Promise<void> {
    console.log(`\n🚀 [SCHEDULER] Starting Job: ${name}`);
    const start = Date.now();
    try {
        await jobFn();
        const duration = ((Date.now() - start) / 1000).toFixed(2);
        console.log(`✅ [SCHEDULER] Finished ${name} in ${duration}s`);
    } catch (e: any) {
        console.error(`❌ [SCHEDULER] Failed ${name}:`, e.message);
        throw e;
    }
}

/**
 * Validates system state and runs initial sync if needed.
 */
async function checkBootstrap() {
    console.log('🔍 Checking System Bootstrap Status...');

    const bootState = await prisma.systemState.findUnique({ where: { key: 'BOOTSTRAPPED' } });

    if (!bootState || bootState.value !== 'true') {
        console.log('⚠️ System NOT Bootstrapped. Starting First Run Protocol...');

        try {
            // 1. Sync Players (Create DB entries)
            await runJob('sync-players', async () => await runSyncPlayers());

            // 2. Sync Ranks (Get initial Tier/LP)
            await runJob('sync-ranks', async () => await runSyncRanks());

            // 3. Ingest Batch (Bootstrap: 50 matches per queue)
            await runJob('ingest-batch', async () => {
                process.env.MATCH_LIMIT = '50';
                try {
                    await runIngestBatch();
                } finally {
                    delete process.env.MATCH_LIMIT;
                }
            });

            // 4. Calculate Scores/Ranking
            await runJob('ranking-season', async () => await runRankingSeason());

            // 5. Mark Complete
            await prisma.systemState.upsert({
                where: { key: 'BOOTSTRAPPED' },
                update: { value: 'true' },
                create: { key: 'BOOTSTRAPPED', value: 'true' }
            });

            console.log('✨ Bootstrap Complete! System is ready for production cycles.');

        } catch (error) {
            console.error('❌ Bootstrap Failed!', error);
            // We allow retry on next restart
            process.exit(1);
        }
    } else {
        console.log('✅ System already bootstrapped.');
    }
}

async function startScheduler() {
    console.log('⏰ Scheduler Starting (Queue Mode - Direct Execution)...');

    // Ensure Bootstrap before accepting cron jobs
    await checkBootstrap();

    // Define Jobs
    const wrapJob = (name: string, jobFn: () => Promise<void>) => async () => {
        if (isJobRunning) {
            console.log(`⚠️ Skip ${name}: Another job is running.`);
            return;
        }
        isJobRunning = true;
        try {
            await runJob(name, jobFn);
        } catch (e) {
            console.error(`Error in cron job ${name}:`, e);
        } finally {
            isJobRunning = false;
        }
    };

    // 1. Ingest & Rank Sync (Resilient Loop)
    const runIngestLoop = async () => {
        let success = false;
        try {
            if (!isJobRunning) {
                isJobRunning = true;
                console.log('🔄 [SCHEDULER] Starting Update Cycle...');

                // Dynamic Match Limit Logic
                let matchLimit = 2; // Default: Routine update

                // Check Last Update Time
                const state = await prisma.systemState.findUnique({ where: { key: 'LAST_UPDATE' } });
                if (state?.value) {
                    const lastUpdate = new Date(state.value);
                    const diffMs = Date.now() - lastUpdate.getTime();
                    const diffHours = diffMs / (1000 * 60 * 60);

                    if (diffHours >= 1) {
                        console.log(`⚠️ Last update was ${diffHours.toFixed(1)}h ago. Increasing lookback to 10 matches.`);
                        matchLimit = 10;
                    }
                } else {
                    // Should be covered by Bootstrap, but fallback safety
                    matchLimit = 10;
                }

                console.log(`🎯 Target Match Limit: ${matchLimit}`);

                // Serial Execution
                await runJob('sync-players', async () => await runSyncPlayers());
                await runJob('sync-ranks', async () => await runSyncRanks());
                await runJob('ingest-batch', async () => {
                    process.env.MATCH_LIMIT = matchLimit.toString();
                    try {
                        await runIngestBatch();
                    } finally {
                        delete process.env.MATCH_LIMIT;
                    }
                });

                // Track Last Update ONLY on Success
                await prisma.systemState.upsert({
                    where: { key: 'LAST_UPDATE' },
                    update: { value: new Date().toISOString() },
                    create: { key: 'LAST_UPDATE', value: new Date().toISOString() }
                });
                console.log('✅ [SCHEDULER] Update Cycle Complete & Timestamped.');
                success = true;
            } else {
                console.log('⚠️ [SCHEDULER] Skipping Update Cycle: Job already running.');
                success = true;
            }
        } catch (error) {
            console.error('❌ [SCHEDULER] Update Cycle Failed:', error);
            success = false;
        } finally {
            isJobRunning = false;

            // Schedule next run
            // User requested: 5 minutes interval
            const delayMinutes = 5;
            const nextRun = new Date(Date.now() + delayMinutes * 60 * 1000);

            console.log(`⏳ [SCHEDULER] Next Update Cycle in ${delayMinutes} minutes (${nextRun.toLocaleTimeString()})`);
            setTimeout(runIngestLoop, delayMinutes * 60 * 1000);
        }
    };

    // Start the loop
    runIngestLoop();

    // 2. Daily Snapshot (00:00)
    new CronJob('0 0 * * *', wrapJob('Daily Snapshot', async () => await runSnapshot()), null, true, 'America/Sao_Paulo');

    // 3. Player Sync (04:00 - Low Traffic)
    new CronJob('0 4 * * *', wrapJob('Player Sync', async () => await runSyncPlayers()), null, true, 'America/Sao_Paulo');

    // Note: ranking-season is usually implicit or on-demand, but if we wanted to run it periodically:
    // new CronJob('0 */6 * * *', wrapJob('Ranking Calc', async () => await runRankingSeason()), null, true, 'America/Sao_Paulo');

    console.log('📅 Cron Jobs Scheduled.');

    // Keep process alive
    process.stdin.resume();
}

startScheduler();
