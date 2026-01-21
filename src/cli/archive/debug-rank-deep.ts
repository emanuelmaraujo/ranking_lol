
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { RiotService } from '../services/riot.service';

const prisma = new PrismaClient();

async function main() {
    const gameName = process.argv[2] || 'Yi Espada Cega';
    const tagLine = process.argv[3] || 'BR1';

    console.log(`\n🔍 DEEP DEBUG RANK: ${gameName} #${tagLine}`);

    const apiKey = process.env.RIOT_API_KEY;
    if (!apiKey) throw new Error("No API Key");
    const riotService = new RiotService(apiKey);

    try {
        // 1. DB State
        const player = await prisma.player.findFirst({
            where: { gameName, tagLine },
            include: {
                snapshots: {
                    orderBy: { createdAt: 'desc' },
                    take: 5
                }
            }
        });

        if (!player) {
            console.error("Player not found in DB");
            return;
        }

        console.log(`\n[DB] Player: ${player.gameName} (PUUID: ${player.puuid.substring(0, 10)}...)`);
        console.log(`[DB] Stored SummonerID: ${player.summonerId}`);
        // Player model only stores Tier/Rank for caching, LP is in Snapshot usually?
        // Let's check schema result first. 
        // If schema says Player has `tier`, `rank`, `lp` then it's fine.
        // Schema view confirms: Player model has `tier`, `rank` but NO `lp`.
        // LP is only in RankSnapshot.
        console.log(`[DB] Player Table Rank (SOLO): ${player.tier} ${player.rank} (LP not in Player model)`);

        console.log(`\n[DB] Recent Snapshots:`);
        player.snapshots.forEach(s => {
            console.log(`   - ${s.queueType}: ${s.tier} ${s.rank} ${s.lp} LP (${s.createdAt.toISOString()})`);
        });

        // 2. Riot API State
        console.log(`\n[API] Fetching fresh data...`);
        const puuid = await riotService.getPuuid(gameName, tagLine);
        console.log(`[API] PUUID: ${puuid === player.puuid ? 'MATCH ✅' : `MISMATCH ❌ (${puuid})`}`);
        console.log(`[API] Fetching League Entries by PUUID (Direct)...`);

        const entries = await riotService.getLeagueEntriesByPuuid(puuid);
        console.log(`\n[API] League Entries Found: ${entries.length}`);
        entries.forEach(e => {
            console.log(`   - ${e.queueType}: ${e.tier} ${e.rank} ${e.leaguePoints} LP (Wins: ${e.wins} | Losses: ${e.losses})`);
        });

        // 3. Comparison
        console.log(`\n--- ANALYSIS ---`);
        const soloApi = entries.find(e => e.queueType === 'RANKED_SOLO_5x5');
        const flexApi = entries.find(e => e.queueType === 'RANKED_FLEX_SR');

        const soloDb = player.snapshots.find(s => s.queueType === 'SOLO');
        const flexDb = player.snapshots.find(s => s.queueType === 'FLEX');

        if (soloApi) {
            if (soloDb) {
                const match = soloApi.tier === soloDb.tier && soloApi.rank === soloDb.rank && soloApi.leaguePoints === soloDb.lp;
                console.log(`SOLO: ${match ? 'SYNCED ✅' : 'DESYNCED ❌'} -> API: ${soloApi.tier} ${soloApi.rank} ${soloApi.leaguePoints} vs DB: ${soloDb.tier} ${soloDb.rank} ${soloDb.lp}`);
            } else {
                console.log(`SOLO: Missing in DB ❌`);
            }
        }

        if (flexApi) {
            if (flexDb) {
                const match = flexApi.tier === flexDb.tier && flexApi.rank === flexDb.rank && flexApi.leaguePoints === flexDb.lp;
                console.log(`FLEX: ${match ? 'SYNCED ✅' : 'DESYNCED ❌'} -> API: ${flexApi.tier} ${flexApi.rank} ${flexApi.leaguePoints} vs DB: ${flexDb.tier} ${flexDb.rank} ${flexDb.lp}`);
            } else {
                console.log(`FLEX: Missing in DB ❌`);
            }
        }

    } catch (e: any) {
        console.error("Error:", e.message);
    } finally {
        await prisma.$disconnect();
    }
}

main();
