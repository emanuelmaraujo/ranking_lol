export interface PlayerConfig {
    gameName: string;
    tagLine: string;
    isActive: boolean;
}

// Fonte única da verdade. Sincronizada com o Banco de Dados.
export const TRACKED_PLAYERS: PlayerConfig[] = [
    { gameName: "YasoneShelby", tagLine: "1908", isActive: true },
    { gameName: "Yi Espada Cega", tagLine: "BR1", isActive: true },
    { gameName: "Maguin de Glock", tagLine: "BR01", isActive: true },
    { gameName: "T1 Pierre", tagLine: "br1", isActive: true },
    { gameName: "paiN OppenHeimer", tagLine: "PNG", isActive: true }
];
