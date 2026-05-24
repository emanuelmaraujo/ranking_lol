import { PrismaClient } from '@prisma/client';
import { spawn } from 'child_process';
import { join } from 'path';

const prisma = new PrismaClient();

async function runScript(scriptName: string, args: string[] = []): Promise<void> {
    return new Promise((resolve, reject) => {
        console.log(`\n🚀 [FORCE-UPDATE] Starting: ${scriptName}`);
        const start = Date.now();

        const child = spawn('npx', ['ts-node', join(__dirname, scriptName), ...args], {
            stdio: 'inherit',
            shell: true,
            env: { ...process.env, PATH: process.env.PATH }
        });

        child.on('close', (code) => {
            const duration = ((Date.now() - start) / 1000).toFixed(2);
            if (code === 0) {
                console.log(`✅ [FORCE-UPDATE] Finished ${scriptName} in ${duration}s`);
                resolve();
            } else {
                console.error(`❌ [FORCE-UPDATE] Failed ${scriptName} (Exit Code: ${code})`);
                reject(new Error(`Script ${scriptName} failed with code ${code}`));
            }
        });

        child.on('error', (err) => {
            console.error(`❌ [FORCE-UPDATE] Error spawning ${scriptName}:`, err);
            reject(err);
        });
    });
}

async function forceUpdate() {
    console.log('🔥 Initiating Manual Force Update...');

    try {
        // 0. Sync Players (Icons, Levels, Mastery)
        await runScript('sync-players.ts');

        // 1. Sync Ranks (Tier/LP)
        await runScript('sync-ranks.ts');

        // 2. Ingest Matches (History & Details)
        await runScript('ingest-batch.ts');

        // 3. Mark timestamp on success
        await prisma.systemState.upsert({
            where: { key: 'LAST_UPDATE' },
            update: { value: new Date().toISOString() },
            create: { key: 'LAST_UPDATE', value: new Date().toISOString() }
        });

        console.log('✨ Manual Update Complete! Database is fresh.');
        process.exit(0);
    } catch (error) {
        console.error('💥 Manual Update Failed:', error);
        process.exit(1);
    }
}

forceUpdate();
