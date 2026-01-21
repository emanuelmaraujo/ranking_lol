
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
    const p = await prisma.player.findFirst({
        where: { gameName: { contains: 'Yi', mode: 'insensitive' } }
    });
    console.log(p);
}
main().finally(() => prisma.$disconnect());
