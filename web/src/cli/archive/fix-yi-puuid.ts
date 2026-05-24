
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Replacing Bad PUUID for Yi Espada Cega...');

    const badPuuid = 'GOU_zQKbFXPFSjbn_TqaSaTm7Znc4D_4PYaOmMSnqHoQnJZbCN8bQ';
    const truePuuid = 'GOU_zQKbFXPFSjbn_TqaSaTm7Znc4D_4PYaOmMSnqHoQnJZbCN8bQ9FZCl0gGpULqjoHskAxqA';

    try {
        const p = await prisma.player.update({
            where: { puuid: badPuuid },
            data: { puuid: truePuuid }
        });
        console.log('✅ Updated PUUID successfully:', p.puuid);

    } catch (e: any) {
        console.error('Update Failed (likely FK constraint):', e.message);
        const scores = await prisma.matchScore.count({ where: { playerId: badPuuid } });
        console.log(`Player has ${scores} scores.`);

        if (scores === 0) {
            console.log('Deleting old player and creating new...');
            const old = await prisma.player.findUnique({ where: { puuid: badPuuid } });
            if (old) {
                await prisma.player.delete({ where: { puuid: badPuuid } });
                await prisma.player.create({
                    data: {
                        puuid: truePuuid,
                        gameName: old.gameName,
                        tagLine: old.tagLine,
                        displayName: old.displayName,
                        isActive: old.isActive,
                        tier: old.tier,
                        rank: old.rank,
                        summonerId: old.summonerId,
                        profileIconId: old.profileIconId,
                        summonerLevel: old.summonerLevel
                    }
                });
                console.log('✅ Re-created player with correct PUUID.');
            }
        } else {
            console.log('⚠️ Has scores. Manual intervention or FK Cascades needed.');
        }
    }
}
main().finally(() => prisma.$disconnect());
