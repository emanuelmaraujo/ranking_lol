import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Configuration
const SEASON_START = new Date('2026-01-01T00:00:00Z');
const SEASON_END = new Date('2026-12-31T23:59:59Z');

const TIER_ORDER = [
    'CHALLENGER',
    'GRANDMASTER',
    'MASTER',
    'DIAMOND',
    'EMERALD',
    'PLATINUM',
    'GOLD',
    'SILVER',
    'BRONZE',
    'IRON',
    'UNRANKED'
];

interface RankEntry {
    rank: number;
    name: string;
    totalScore: number;
    avgScore: number;
    gamesUsed: number;
    tier: string;
}

async function main() {
    // 1. Parse Args
    const args = process.argv.slice(2);

    // --queue=SOLO | FLEX (Default SOLO)
    let queueArg = 'SOLO';
    // Helper to safely parse args
    const getArgValue = (prefix: string): string | undefined => {
        const flag = args.find(a => a.startsWith(prefix));
        if (flag) {
            const parts = flag.split('=');
            if (parts.length >= 2) return parts[1];
        }
        return undefined;
    };

    const qVal = getArgValue('--queue=');
    if (qVal) queueArg = qVal.toUpperCase();

    if (!['SOLO', 'FLEX'].includes(queueArg)) {
        console.error('Invalid queue. Use --queue=SOLO or --queue=FLEX');
        process.exit(1);
    }

    // --limit=N (Default 100)
    let limitArg = 100;
    const lVal = getArgValue('--limit=');
    if (lVal) {
        const parsed = parseInt(lVal, 10);
        if (!isNaN(parsed) && parsed > 0) limitArg = parsed;
    }

    // --tier=TIER (Default ALL)
    let tierArg = 'ALL';
    const tVal = getArgValue('--tier=');
    if (tVal) tierArg = tVal.toUpperCase();

    console.log(`\n🏆 Calculating Season 2026 Ranking [${queueArg} Q] (Top ${limitArg} Matches) - Tier: ${tierArg}...\n`);

    try {
        // 2. Build Query
        const whereClause: any = { isActive: true };
        if (tierArg !== 'ALL') {
            whereClause.tier = tierArg;
        }

        // 3. Fetch Data
        const players = await prisma.player.findMany({
            where: whereClause,
            select: {
                puuid: true,
                gameName: true,
                tagLine: true,
                displayName: true,
                tier: true,
                scores: {
                    where: {
                        match: {
                            queueType: queueArg,
                            gameCreation: {
                                gte: SEASON_START,
                                lte: SEASON_END
                            }
                        }
                    },
                    select: {
                        matchScore: true
                    }
                }
            }
        });

        // 4. Process Stats (Per Player)
        const entries: RankEntry[] = [];

        for (const player of players) {
            const scores = player.scores.map(s => s.matchScore).sort((a, b) => b - a);
            const topScores = scores.slice(0, limitArg);
            const gamesUsed = topScores.length;

            if (gamesUsed === 0) continue;

            const totalScore = topScores.reduce((sum, val) => sum + val, 0);
            const avgScore = totalScore / gamesUsed;

            entries.push({
                rank: 0,
                name: player.displayName || player.gameName,
                totalScore,
                avgScore,
                gamesUsed,
                tier: player.tier || 'UNRANKED'
            });
        }

        // 5. Group by Tier and Output
        const tiersToPrint = tierArg === 'ALL' ? TIER_ORDER : [tierArg];

        for (const tierName of tiersToPrint) {
            const tierEntries = entries.filter(e => e.tier === tierName);

            if (tierEntries.length === 0) {
                // Only print header if specific tier was requested, or maybe skip empty tiers in ALL view?
                // Let's skip empty tiers in ALL view to keep it clean, unless explicit request.
                if (tierArg !== 'ALL') {
                    console.log(`--- ${tierName} --- (No players)`);
                }
                continue;
            }

            // Sort Leaders inside Tier
            tierEntries.sort((a, b) => {
                if (b.totalScore !== a.totalScore) return b.totalScore - a.totalScore;
                if (b.avgScore !== a.avgScore) return b.avgScore - a.avgScore;
                return a.name.localeCompare(b.name);
            });

            // Assign Ranks
            tierEntries.forEach((e, i) => e.rank = i + 1);

            // Print
            console.log(`\n💎 ${tierName}`);
            const header =
                "#".padEnd(4) +
                "PLAYER".padEnd(20) +
                "TOTAL".padEnd(8) +
                "AVG".padEnd(6) +
                "GAMES".padEnd(6);

            console.log(header);
            console.log("-".repeat(header.length));

            for (const r of tierEntries) {
                const row =
                    (r.rank + ".").padEnd(4) +
                    r.name.substring(0, 19).padEnd(20) +
                    r.totalScore.toString().padEnd(8) +
                    r.avgScore.toFixed(1).padEnd(6) +
                    r.gamesUsed.toString().padEnd(6);
                console.log(row);
            }
        }

        console.log("");

    } catch (error: any) {
        console.error("Ranking Elo Error:", error.message);
    } finally {
        await prisma.$disconnect();
    }
}

main();
