import { NextRequest, NextResponse } from 'next/server';
import { runSnapshot } from '@/cli/snapshot';

export async function GET(request: NextRequest) {
    // Authorization Check
    const authHeader = request.headers.get('Authorization');
    if (process.env.NODE_ENV === 'production' && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('🔄 [CRON] Starting Daily Rank Snapshot Job...');

    try {
        await runSnapshot();
        console.log('✅ [CRON] Daily Rank Snapshot Completed successfully.');
        return NextResponse.json({ success: true, message: 'Snapshot complete' });
    } catch (e: any) {
        console.error('❌ [CRON] Snapshot Job Failed:', e);
        return NextResponse.json({ error: e.message || 'Internal Server Error' }, { status: 500 });
    }
}
