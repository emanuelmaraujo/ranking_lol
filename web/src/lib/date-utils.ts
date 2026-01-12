export function getStartOfWeek(date: Date = new Date()): Date {
    const d = new Date(date);
    const day = d.getDay(); // 0 (Sun) to 6 (Sat)
    // Adjust so 0 is Monday, 6 is Sunday
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(d.setDate(diff));
    monday.setHours(0, 0, 0, 0);
    return monday;
}

export function isWithinWeek(dateStr: string): boolean {
    const date = new Date(dateStr);
    const startOfWeek = getStartOfWeek();
    return date >= startOfWeek;
}

// Format: "12 jan"
export function formatDateShort(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' });
}

export function getDateRange(period: "GENERAL" | "MONTHLY" | "WEEKLY" | string): { start?: Date, end?: Date } | undefined {
    if (period === "GENERAL") return undefined;

    const now = new Date();
    const start = new Date();
    start.setHours(0, 0, 0, 0);

    if (period === "WEEKLY") {
        const day = now.getDay(); // 0 (Sun) - 6 (Sat)
        // Adjust to Monday (1) - Sunday (7)
        // If Sunday (0), we want previous Monday (-6)
        // If Monday (1), we want 0 diff
        const diff = now.getDate() - day + (day === 0 ? -6 : 1);
        start.setDate(diff);
    } else if (period === "MONTHLY") {
        start.setDate(1);
    }

    return { start, end: now };
}
