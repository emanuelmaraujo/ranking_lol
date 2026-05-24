import { calculateMatchScore } from '../engine/scoring.engine';
import type { MatchDTO, Participant } from '../engine/scoring.engine';

const createMockMatch = (duration: number, puuid: string, participants: Participant[]): MatchDTO => ({
    metadata: { matchId: "MOCK_1" },
    info: { gameDuration: duration, participants }
});

const createParticipant = (
    puuid: string,
    pos: string,
    win: boolean,
    stats: Partial<Participant> = {}
): Participant => ({
    puuid,
    riotIdGameName: "Test",
    riotIdTagLine: "001",
    teamId: 100,
    teamPosition: pos,
    win,
    kills: 5,
    deaths: 5,
    assists: 10,
    totalMinionsKilled: 200, // ~6.6 CS/min in 30m
    neutralMinionsKilled: 0,
    goldEarned: 10000,
    totalDamageDealtToChampions: 20000,
    totalDamageTaken: 20000,
    visionScore: 30, // 1/min
    timePlayed: 1800,
    totalTimeSpentDead: 100,
    challenges: {
        turretTakedowns: 2,
        dragonTakedowns: 2,
        baronTakedowns: 1,
        riftHeraldTakedowns: 1
    },
    turretKills: 1,
    dragonKills: 1,
    baronKills: 0,
    ...stats
});

const runTest = (name: string, fn: () => void) => {
    try {
        fn();
        console.log(`[PASS] ${name}`);
    } catch (e: any) {
        console.error(`[FAIL] ${name}: ${e.message}`);
    }
};

const assert = (actual: any, expected: any, msg?: string) => {
    if (actual !== expected) throw new Error(`${msg || ''} Expected ${expected}, got ${actual}`);
};

const assertRange = (actual: number, min: number, max: number, msg?: string) => {
    if (actual < min || actual > max) throw new Error(`${msg || ''} Expected between ${min}-${max}, got ${actual}`);
};

console.log("Starting Scoring Engine Tests...");

// 1. Victory Test
runTest("Victory - Balanced Lane", () => {
    const p1 = createParticipant("p1", "TOP", true, { totalDamageDealtToChampions: 30000 }); // Better damage
    const p2 = createParticipant("p2", "TOP", false, { teamId: 200, totalDamageDealtToChampions: 15000 }); // Opponent

    const match = createMockMatch(1800, "p1", [p1, p2]);
    const score = calculateMatchScore("p1", match);

    if (!score) throw new Error("Result is null");

    // Performance:
    // DPM Ratio: 30k/15k = 2.0 -> Max Points (15)
    // Other stats equal -> Base Points (70% of weight)
    // CSPM (15 * 0.7) = 10.5
    // Tank (10 * 0.7) = 7
    // KP (10 * 0.7) = 7
    // Vis (10 * 0.7) = 7
    // Total Perf approx: 15 + 10.5 + 7 + 7 + 7 = 46.5

    // Objectives:
    // Equal (2/2, 2/2...) -> Ratio 1.0 -> 70% of 30 pts = 21

    // Discipline:
    // Deaths equal (5 vs 5) -> 5

    // Total approx: 46.5 + 21 + 5 = 72.5 -> Floor 72
    console.log("Score:", score.matchScore);
    assertRange(score.matchScore, 65, 80, "Score should be respectable");
    assert(score.breakdown.isVictory, true);
});

// 2. Defeat - Cap 40
runTest("Defeat - Strong Performance but Cap", () => {
    const p1 = createParticipant("p1", "MIDDLE", false, {
        kills: 10, deaths: 2, assists: 10, // KDA High (irrelevant for perf directly but help KD)
        totalDamageDealtToChampions: 50000, // Massive damage
        goldEarned: 20000
    });
    const p2 = createParticipant("p2", "MIDDLE", true, {
        teamId: 200,
        kills: 2, deaths: 10, assists: 2,
        totalDamageDealtToChampions: 10000,
        goldEarned: 10000
    });

    // Need KP > 35%. Team Kills?
    // P1 kills 10+10 = 20 participations. If team kills = 20, KP 100%.
    // We need to ensure helper sees enough team kills.
    // In our simplified mock, "getTeamKills" sums all participants of that team.
    // So if only p1 is in team 100, team kills = 10. KP = 100%. Good.

    const match = createMockMatch(1800, "p1", [p1, p2]);
    const score = calculateMatchScore("p1", match);

    if (!score) throw new Error("Result is null");

    console.log("Defeat Breakdown:", score.breakdown);

    // Even if Metrics are godlike, Defeat Cap is 40.
    assertRange(score.matchScore, 20, 40, "Score must be capped at 40");
    assert(score.breakdown.capApplied, "Defeat Cap 40");
});

// 3. Defeat - KP Rule
runTest("Defeat - KP < 35%", () => {
    // P1: 0/5/0.
    const p1 = createParticipant("p1", "BOTTOM", false, { kills: 0, deaths: 5, assists: 0, teamId: 100 });
    // Teammate carries
    const p3 = createParticipant("p3", "JUNGLE", false, { kills: 10, teamId: 100 });
    const p2 = createParticipant("p2", "BOTTOM", true, { teamId: 200 });

    const match = createMockMatch(1800, "p1", [p1, p2, p3]);
    // Team Kills = 0 + 10 = 10.
    // P1 KP = 0 / 10 = 0%.

    const score = calculateMatchScore("p1", match);

    if (!score) throw new Error("Result is null");
    assert(score.matchScore, 0, "Score should be 0 due to Low KP");
    assert(score.breakdown.capApplied, "KP < 35%");
});
