import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log("Searching for T1 Pierre...");
    const p = await prisma.player.findFirst({
        where: { gameName: 'T1 Pierre' }
    });

    if (!p) {
        console.log("Player not found");
        return;
    }

    console.log(`Found Player: ${p.gameName} (${p.puuid})`);

    const snapshots = await prisma.rankSnapshot.findMany({
        where: { playerId: p.puuid, queueType: 'SOLO' },
        orderBy: { createdAt: 'asc' }
    });

    console.log(`Found ${snapshots.length} snapshots.`);

    if (snapshots.length === 0) return;

    // Simulate Calculation
    const start = snapshots[0];
    const end = snapshots[snapshots.length - 1];

    console.log("START:", start);
    console.log("END:", end);

    const getVal = (tier: string, rank: string, lp: number) => {
        const tierMap: any = { IRON: 0, BRONZE: 400, SILVER: 800, GOLD: 1200, PLATINUM: 1600, EMERALD: 2000, DIAMOND: 2400, MASTER: 2800, GRANDMASTER: 2800, CHALLENGER: 2800 };
        const rankMap: any = { 'IV': 0, 'III': 100, 'II': 200, 'I': 300 };
        const tierVal = tierMap[tier] || 0;
        const rankVal = rankMap[rank] || 0;

        console.log(`Calc for ${tier} ${rank} ${lp}LP -> TierBase:${tierVal} RankBase:${rankVal} LP:${lp} = ${tierVal + rankVal + lp}`);

        if (tierVal >= 2800) return tierVal + lp;
        return tierVal + rankVal + lp;
    };

    const startVal = getVal(start.tier, start.rank, start.lp);
    const endVal = getVal(end.tier, end.rank, end.lp);

    console.log(`Gain: ${endVal} - ${startVal} = ${endVal - startVal}`);
}

main();
