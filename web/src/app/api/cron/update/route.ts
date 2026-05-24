import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { runSyncPlayers } from '@/cli/sync-players';
import { runSyncRanks } from '@/cli/sync-ranks';
import { runIngestBatch } from '@/cli/ingest-batch';

export async function GET(request: NextRequest) {
    // 1. Authorization Check (Vercel Cron standard)
    const authHeader = request.headers.get('Authorization');
    if (process.env.NODE_ENV === 'production' && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('🔄 [CRON] Starting Routine Ingest & Sync Update...');

    try {
        // Check Pause State
        const pauseState = await prisma.systemState.findUnique({ where: { key: 'PAUSE_INGEST' } });
        if (pauseState?.value === 'true') {
            console.log('⚠️ [CRON] Skipping Update Cycle: Paused by manual config.');
            return NextResponse.json({ success: true, message: 'Ingestion paused' });
        }

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
            matchLimit = 10;
        }

        console.log(`🎯 Target Match Limit: ${matchLimit}`);

        // Run sequential jobs programmatically
        console.log('1. Running sync-players...');
        await runSyncPlayers();

        console.log('2. Running sync-ranks...');
        await runSyncRanks();

        console.log('3. Running ingest-batch...');
        process.env.MATCH_LIMIT = matchLimit.toString();
        try {
            await runIngestBatch();
        } finally {
            delete process.env.MATCH_LIMIT;
        }

        // Track Last Update ONLY on Success
        await prisma.systemState.upsert({
            where: { key: 'LAST_UPDATE' },
            update: { value: new Date().toISOString() },
            create: { key: 'LAST_UPDATE', value: new Date().toISOString() }
        });

        console.log('✅ [CRON] Routine Ingest & Sync Update Completed successfully.');
        return NextResponse.json({ success: true, message: 'Routine update complete', matchLimit });

    } catch (e: any) {
        console.error('❌ [CRON] Routine Update Failed:', e);
        return NextResponse.json({ error: e.message || 'Internal Server Error' }, { status: 500 });
    }
}
