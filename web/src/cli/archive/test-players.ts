import { PrismaClient } from '@prisma/client';

async function main() {
    const prisma = new PrismaClient();
    try {
        const players = await prisma.player.findMany();
        console.log(`=== Total Players in DB: ${players.length} ===`);
        for (const p of players) {
            console.log(`- ${p.gameName} #${p.tagLine}:`);
            console.log(`  PUUID: ${p.puuid}`);
            console.log(`  profileIconId: ${p.profileIconId}`);
            console.log(`  summonerLevel: ${p.summonerLevel}`);
            console.log(`  tier: ${p.tier}, rank: ${p.rank}`);
            console.log(`  isActive: ${p.isActive}`);
        }
    } catch (e: any) {
        console.error("DB error:", e.message);
    } finally {
        await prisma.$disconnect();
    }
}

main();
