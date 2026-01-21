import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const limit = 20;

    try {
        const scores = await prisma.matchScore.findMany({
            take: limit,
            orderBy: { createdAt: 'desc' },
            include: {
                player: true,
                match: true
            }
        });

        if (scores.length === 0) {
            console.log('No scores found in database.');
            return;
        }

        console.log(`\n--- Scoring Audit (Last ${scores.length} matches) ---\n`);

        // Header
        const header =
            "MATCH".padEnd(16) +
            "LANE".padEnd(8) +
            "W/L".padEnd(5) +
            "SCORE".padEnd(7) +
            "PERF".padEnd(6) +
            "OBJ".padEnd(5) +
            "DISC".padEnd(6) +
            "KP%".padEnd(6) +
            "CSPM_R".padEnd(8) +
            "DPM_R".padEnd(8) +
            "VSPM_R".padEnd(8);

        console.log(header);
        console.log("-".repeat(header.length));

        for (const score of scores) {
            const metrics = score.metrics as any;
            const ratios = score.ratios as any;

            // Formatters
            const matchId = score.matchId.length > 14 ? score.matchId.substring(0, 14) + '..' : score.matchId;
            const lane = score.lane.substring(0, 7); // CUT if too long
            const wl = score.isVictory ? 'W' : 'L';

            // Metrics extraction
            const kpPct = metrics?.kp !== undefined ? `${(metrics.kp * 100).toFixed(0)}%` : '-';
            const cspmR = ratios?.cspm !== undefined ? ratios.cspm.toFixed(2) : '-';
            const dpmR = ratios?.dpm !== undefined ? ratios.dpm.toFixed(2) : '-';
            const vspmR = ratios?.vspm !== undefined ? ratios.vspm.toFixed(2) : '-';

            // Row Construction
            const row =
                matchId.padEnd(16) +
                lane.padEnd(8) +
                wl.padEnd(5) +
                score.matchScore.toString().padEnd(7) +
                score.performanceScore.toString().padEnd(6) +
                score.objectivesScore.toString().padEnd(5) +
                score.disciplineScore.toString().padEnd(6) +
                kpPct.padEnd(6) +
                cspmR.padEnd(8) +
                dpmR.padEnd(8) +
                vspmR.padEnd(8);

            console.log(row);
        }

        console.log("\nLegend: CSPM_R = CS/Min Ratio vs Opponent, DPM_R = Damage Ratio, VSPM_R = Vision Ratio");

    } catch (error: any) {
        console.error('Audit Error:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

main();
