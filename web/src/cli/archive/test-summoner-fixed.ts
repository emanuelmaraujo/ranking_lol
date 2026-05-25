import 'dotenv/config';
import { RiotService } from '../../services/riot.service';
import { PrismaClient } from '@prisma/client';

async function main() {
    const apiKey = process.env.RIOT_API_KEY!;
    if (!apiKey) {
        console.error("RIOT_API_KEY is not defined in env!");
        return;
    }
    const riotService = new RiotService(apiKey);
    // Let's use YasoneShelby or find any active player in the DB
    const prisma = new PrismaClient();
    try {
        const player = await prisma.player.findFirst({ where: { isActive: true } });
        if (!player) {
            console.log("No active players found in DB to test!");
            return;
        }
        console.log(`Testing with player: ${player.gameName} #${player.tagLine}`);

        console.log("Refetching PUUID...");
        const freshAccount = await riotService.getAccountByRiotId(player.gameName, player.tagLine);
        console.log("Fresh Account info:", freshAccount);

        console.log("Testing Summoner By PUUID...");
        const sum = await riotService.getSummonerByPuuid(freshAccount.puuid);
        console.log("Success:", sum);
    } catch (e: any) {
        console.error("API error:", e.response?.status, e.response?.data || e.message);
    } finally {
        await prisma.$disconnect();
    }
}

main();
