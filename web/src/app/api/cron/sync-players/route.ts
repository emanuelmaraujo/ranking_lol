import { NextRequest, NextResponse } from 'next/server';
import { runSyncPlayers } from '@/cli/sync-players';

export async function GET(request: NextRequest) {
    // Authorization Check
    const authHeader = request.headers.get('Authorization');
    if (process.env.NODE_ENV === 'production' && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('🔄 [CRON] Starting Daily Player Static Sync Job...');

    try {
        await runSyncPlayers();
        console.log('✅ [CRON] Daily Player Static Sync Completed successfully.');
        return NextResponse.json({ success: true, message: 'Player sync complete' });
    } catch (e: any) {
        console.error('❌ [CRON] Player Static Sync Failed:', e);
        return NextResponse.json({ error: e.message || 'Internal Server Error' }, { status: 500 });
    }
}
