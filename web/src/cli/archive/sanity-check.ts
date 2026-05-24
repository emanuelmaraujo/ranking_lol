import 'dotenv/config';
import { RiotService } from '../services/riot.service';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/*
    Debug Script to isolate Summoner V4 issue.
*/

async function main() {
    const apiKey = process.env.RIOT_API_KEY!;
    const riotService = new RiotService(apiKey);

    const players = await prisma.player.findMany({ where: { isActive: true } });
    console.log(`Found ${players.length} players.`);

    for (const player of players) {
        console.log(`\nProcessing ${player.gameName}`);

        // 1. DB PUUID
        console.log("--- DB PUUID Test ---");
        try {
            const sum = await riotService.getSummonerByPuuid(player.puuid);
            console.log("DB Keys:", Object.keys(sum));
        } catch (e: any) { console.log("DB Error:", e.message); }

        // 2. Fresh PUUID
        console.log("--- Fresh PUUID Test ---");
        const fresh = await riotService.getPuuid(player.gameName, player.tagLine);
        try {
            const sum2 = await riotService.getSummonerByPuuid(fresh);
            console.log("Fresh Keys:", Object.keys(sum2));
        } catch (e: any) { console.log("Fresh Error:", e.message); }

        // 3. String Compare
        if (player.puuid !== fresh) {
            console.log("STRINGS DIFFERENT!");
        } else {
            console.log("STRINGS IDENTICAL (===)");
        }
        console.log("DB Encoded:", encodeURIComponent(player.puuid));
        console.log("Fresh Encoded:", encodeURIComponent(fresh));
    }
}

main();
