import { calculateMatchScore, MatchDTO, Participant } from '../engine/scoring.engine';
import type { MatchScoreResult } from '../engine/scoring.engine';

const createMockMatch = (duration: number, participants: Participant[]): MatchDTO => ({
    metadata: { matchId: "MOCK_STRICT" },
    info: { gameDuration: duration, participants }
});

const createPart = (pos: string, win: boolean, stats: Partial<Participant> = {}): Participant => ({
    puuid: "p1", riotIdGameName: "Test", riotIdTagLine: "1", teamId: 100, teamPosition: pos, win,
    kills: 5, deaths: 5, assists: 10, totalMinionsKilled: 200, neutralMinionsKilled: 0,
    goldEarned: 10000, totalDamageDealtToChampions: 20000, totalDamageTaken: 20000,
    visionScore: 30, timePlayed: 1800, totalTimeSpentDead: 100,
    challenges: { turretTakedowns: 2, dragonTakedowns: 2, baronTakedowns: 1, riftHeraldTakedowns: 1 },
    turretKills: 1, dragonKills: 1, baronKills: 0,
    ...stats
});

console.log("--- Strict Verification ---");

// Test 1: No Opponent
try {
    const p1 = createPart("TOP", true);
    // No opponent created
    const match = createMockMatch(1800, [p1]);
    const score = calculateMatchScore("p1", match);

    if (score === null) {
        console.log("[PASS] No Opponent -> Null Score");
    } else {
        console.error("[FAIL] No Opponent -> Generated Score!", score);
    }
} catch (e: any) {
    console.error("[FAIL] Error in Test 1", e.message);
}

// Test 2: Defeat Objectives (Equal Ratio)
try {
    const p1 = createPart("MID", false, { puuid: "p1", challenges: { turretTakedowns: 2, dragonTakedowns: 1 } });
    const p2 = createPart("MID", true, { puuid: "p2", teamId: 200, challenges: { turretTakedowns: 2, dragonTakedowns: 1 } });

    // Equal Objectives -> Ratio 1.0. 
    // In Defeat, should be 0 points.

    const match = createMockMatch(1800, [p1, p2]);
    const score = calculateMatchScore("p1", match);

    if (score && score.breakdown.objectives === 0) {
        console.log("[PASS] Defeat (Equal Obj) -> 0 Obj Points");
    } else {
        console.error("[FAIL] Defeat (Equal Obj) -> Score not 0", score?.breakdown);
    }
} catch (e: any) {
    console.error("[FAIL] Error in Test 2", e.message);
}

// Test 3: Defeat Objectives (Better Ratio)
try {
    const p1 = createPart("MID", false, { puuid: "p1", challenges: { turretTakedowns: 4, dragonTakedowns: 1 } });
    const p2 = createPart("MID", true, { puuid: "p2", teamId: 200, challenges: { turretTakedowns: 2, dragonTakedowns: 1 } });

    // Turrets: 4 vs 2 -> Ratio 2.0 -> Max points
    // Dragon: 1 vs 1 -> Ratio 1.0 -> 0 points (Defeat rule)

    const match = createMockMatch(1800, [p1, p2]);
    const score = calculateMatchScore("p1", match);

    if (score && score.breakdown.objectives > 0 && score.breakdown.objectives < 30) {
        console.log("[PASS] Defeat (Better Obj) -> Some Points", score.breakdown.objectives);
    } else {
        console.error("[FAIL] Defeat (Better Obj) -> Unexpected Score", score?.breakdown);
    }
} catch (e: any) {
    console.error("[FAIL] Error in Test 3", e.message);
}
