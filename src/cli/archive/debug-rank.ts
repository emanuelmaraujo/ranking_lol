
import 'dotenv/config';
import { RiotService } from '../services/riot.service';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const riotService = new RiotService(process.env.RIOT_API_KEY!);

async function main() {
    const gameName = "YasoneShelby";
    const tagLine = "1908";

    console.log(`🔍 Checking data for ${gameName} #${tagLine}`);

    const player = await prisma.player.findFirst({
        where: { gameName, tagLine }
    });

    if (!player) {
        console.error("Player not found in DB");
        return;
    }

    console.log(`PUUID: ${player.puuid}`);
    console.log(`SummonerID: ${player.summonerId}`);

    if (!player.summonerId) {
        console.error("SummonerID is null! Cannot fetch rank.");
        return;
    }

    console.log("Fetching League Entries from Riot...");
    const leagues = await riotService.getLeagueEntries(player.summonerId);
    console.dir(leagues, { depth: null });

    // Check DB Snapshot
    const snapshot = await prisma.rankSnapshot.findFirst({
        where: { playerId: player.puuid, queueType: 'SOLO' },
        orderBy: { createdAt: 'desc' }
    });
    console.log("Latest DB Snapshot (SOLO):", snapshot);
}

main();
