import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const player = await prisma.player.findFirst({
        where: { gameName: 'YasoneShelby' }
    });
    if (player) {
        console.log(`PUUID Length: ${player.puuid.length}`);
        console.log(`PUUID Value: >${player.puuid}<`);
        console.log(`JSON: ${JSON.stringify(player.puuid)}`);
    } else {
        console.log("Player not found");
    }
    await prisma.$disconnect();
}
main();
