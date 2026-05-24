import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const args = process.argv.slice(2);
    const puuidOrName = args[0];
    const tier = args[1]?.toUpperCase();
    const rank = args[2]?.toUpperCase() || 'IV';

    if (!puuidOrName || !tier) {
        console.error("Usage: npx ts-node src/cli/set-tier.ts <GameName> <TIER> [RANK]");
        process.exit(1);
    }

    try {
        // Try finding by name first (more convenient)
        let player = await prisma.player.findFirst({
            where: { gameName: puuidOrName }
        });

        if (!player) {
            // Try by PUUID
            player = await prisma.player.findUnique({
                where: { puuid: puuidOrName }
            });
        }

        if (!player) {
            console.error("Player not found");
            process.exit(1);
        }

        await prisma.player.update({
            where: { puuid: player.puuid },
            data: { tier, rank }
        });

        console.log(`Updated ${player.gameName} to ${tier} ${rank}`);

    } catch (e: any) {
        console.error(e.message);
    } finally {
        await prisma.$disconnect();
    }
}

main();
