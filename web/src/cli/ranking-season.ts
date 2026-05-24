import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Configuration
const SEASON_START = new Date('2026-01-01T00:00:00Z');
const SEASON_END = new Date('2026-12-31T23:59:59Z');

interface RankEntry {
    rank: number;
    name: string;
    totalScore: number;
    avgScore: number;
    gamesUsed: number;
}

export async function runRankingSeason(options?: { queue?: string, limit?: number }) {
    // 1. Parse Args (if not provided via options)
    const args = process.argv.slice(2);

    let queueArg = options?.queue;
    if (!queueArg) {
        // --queue=SOLO | FLEX (Default SOLO)
        queueArg = 'SOLO';
        const queueFlag = args.find(a => a.startsWith('--queue='));
        if (queueFlag) {
            const parts = queueFlag.split('=');
            if (parts.length >= 2) {
                const val = parts[1];
                if (val) queueArg = val.toUpperCase();
            }
        }
    }

    if (!['SOLO', 'FLEX'].includes(queueArg)) {
        console.error('Invalid queue. Use --queue=SOLO or --queue=FLEX');
        // If running as module, maybe throw error instead of exit? 
        // But to preserve behavior let's exit if it was CLI, but here we might be in scheduler.
        // Let's just return to avoid killing scheduler.
        console.error('Aborting ranking calculation.');
        return;
    }

    let limitArg = options?.limit;
    if (!limitArg) {
        // --limit=N (Default 100)
        limitArg = 100;
        const limitFlag = args.find(a => a.startsWith('--limit='));
        if (limitFlag) {
            const parts = limitFlag.split('=');
            if (parts.length >= 2) {
                const val = parts[1];
                if (val) {
                    limitArg = parseInt(val, 10);
                    if (isNaN(limitArg) || limitArg <= 0) limitArg = 100;
                }
            }
        }
    }

    console.log(`\n🏆 Calculating Season 2026 Ranking [${queueArg} Q] (Top ${limitArg} Matches)...\n`);

    try {
        // 2. Fetch Data (Optimized)
        // We fetch ALL active players and their relevant match scores 
        // Filter inside the query relation for efficiency
        const players = await prisma.player.findMany({
            where: { isActive: true },
            select: {
                puuid: true,
                gameName: true,
                tagLine: true,
                displayName: true,
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

        // 3. Process & Aggregate (In-Memory)
        const ranking: RankEntry[] = [];

        for (const player of players) {
            // Sort Descending
            const scores = player.scores
                .map(s => s.matchScore)
                .sort((a, b) => b - a);

            // Take Top N
            const topScores = scores.slice(0, limitArg);
            const gamesUsed = topScores.length;

            if (gamesUsed === 0) continue; // Skip players with no valid matches

            // Sum
            const totalScore = topScores.reduce((sum, val) => sum + val, 0);
            const avgScore = totalScore / gamesUsed;

            ranking.push({
                rank: 0, // Assigned later
                name: player.displayName || player.gameName,
                totalScore,
                avgScore,
                gamesUsed
            });
        }

        // 4. Sort Leaders
        // Tie-breaker: Total Score DESC -> Avg Score DESC -> Name ASC
        ranking.sort((a, b) => {
            if (b.totalScore !== a.totalScore) return b.totalScore - a.totalScore;
            if (b.avgScore !== a.avgScore) return b.avgScore - a.avgScore;
            return a.name.localeCompare(b.name);
        });

        // Assign Ranks
        ranking.forEach((entry, index) => {
            entry.rank = index + 1;
        });

        // 5. Output Table
        if (ranking.length === 0) {
            console.log("No ranked players found for this criteria.");
        } else {
            const header =
                "#".padEnd(4) +
                "PLAYER".padEnd(20) +
                "TOTAL".padEnd(8) +
                "AVG".padEnd(6) +
                "GAMES".padEnd(6);

            console.log(header);
            console.log("-".repeat(header.length));

            for (const r of ranking) {
                const row =
                    (r.rank + ".").padEnd(4) +
                    r.name.substring(0, 19).padEnd(20) +
                    r.totalScore.toString().padEnd(8) +
                    r.avgScore.toFixed(1).padEnd(6) +
                    r.gamesUsed.toString().padEnd(6);
                console.log(row);
            }
        }
        console.log(""); // Empty line at end

    } catch (error: any) {
        console.error("Ranking Error:", error.message);
    } finally {
        await prisma.$disconnect();
    }
}

if (require.main === module) {
    runRankingSeason();
}
