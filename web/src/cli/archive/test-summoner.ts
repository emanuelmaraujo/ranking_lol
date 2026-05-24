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
    const gameName = 'YasoneShelby';
    const tagLine = '1908'; // Default tag for BR usually? Or from DB. 
    // Wait, DB has tagLine.
    // Let's assume tagLine from DB valid.

    console.log("Refetching PUUID...");
    const freshPuuid = await riotService.getPuuid(gameName, '1908');
    console.log("Fresh PUUID:", freshPuuid);
    // console.log("Match DB?", freshPuuid === puuid); // Removed old puuid var comparison

    console.log("Testing Summoner By Fresh PUUID...");
    try {
        const sum = await riotService.getSummonerByPuuid(freshPuuid);
        console.log("Success:", sum);
    } catch (e: any) {
        console.log("Failed By Fresh PUUID:", e.message);
    }

    // Try alternate method? (There is no by-name anymore on V4 usually, or it depends on region).
    // BR1 should support /lol/summoner/v4/summoners/by-puuid/{encryptedPUUID}
}

main();
