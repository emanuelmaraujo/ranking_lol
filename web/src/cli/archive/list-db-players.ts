import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    const players = await prisma.player.findMany();
    console.log(JSON.stringify(players.map(p => ({
        gameName: p.gameName,
        tagLine: p.tagLine,
        isActive: p.isActive
    })), null, 2));
}

main().finally(() => prisma.$disconnect());
