
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log("🧹 Cleaning Data for Yi Espada Cega...");

    // Find Yi
    const yi = await prisma.player.findFirst({
        where: { gameName: { contains: 'Yi' } }
    });

    if (!yi) {
        console.error("❌ Yi not found in database.");
        return;
    }

    // Delete MatchScores
    const deleted = await prisma.matchScore.deleteMany({
        where: { playerId: yi.puuid }
    });

    // Reset Player Icon to 0 to force refresh if needed (actually sync-players handles this)
    // But let's verify what we have
    console.log(`🗑️  Deleted ${deleted.count} match scores for ${yi.gameName}.`);
    console.log(`ℹ️  Current Icon ID: ${yi.profileIconId}`);

    // We can also delete the 'Match' entries if we assume they are only his? 
    // No, Match is shared. Only delete Scores linked to him.

}

main()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect());
