
// Helper to get Brazil Time (UTC-3)
function getBrazilTime(date: Date = new Date()): Date {
    // 1. Get current UTC time
    const utc = date.getTime() + (date.getTimezoneOffset() * 60000);
    // 2. Add -3h offset
    return new Date(utc - (3 * 3600000));
}

export function getStartOfWeek(date: Date = new Date()): Date {
    const brTime = getBrazilTime(date);
    const day = brTime.getDay(); // 0 (Sun) - 6 (Sat) in Brazil

    // Calculate difference to previous Monday
    // If Sun (0) -> -6
    // If Mon (1) -> 0
    // If Tue (2) -> -1
    const diff = brTime.getDate() - day + (day === 0 ? -6 : 1);

    const monday = new Date(brTime);
    monday.setDate(diff);
    monday.setHours(0, 0, 0, 0); // Midnight Brazil

    // Return formatted date or convert back to UTC if needed.
    // However, for API queries, we usually want to compare against ISO strings that represent 00:00 BRT.
    // 00:00 BRT = 03:00 UTC.
    // So let's return the Date object representing that absolute timestamp.
    const utcTimestamp = monday.getTime() + (3 * 3600000);
    return new Date(utcTimestamp);
}

export function isWithinWeek(dateStr: string): boolean {
    const date = new Date(dateStr);
    const startOfWeek = getStartOfWeek();
    return date >= startOfWeek;
}

// Format: "12 jan"
export function formatDateShort(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('pt-BR', { day: 'numeric', month: 'short', timeZone: 'America/Sao_Paulo' });
}

export function getDateRange(period: "GENERAL" | "MONTHLY" | "WEEKLY" | string): { start?: Date, end?: Date } | undefined {
    if (period === "GENERAL") return undefined;

    const now = new Date();
    // Use our strict StartOfWeek logic
    let start: Date;

    if (period === "WEEKLY") {
        start = getStartOfWeek(now);
    } else if (period === "MONTHLY") {
        // First day of Month Brazil
        const brTime = getBrazilTime(now);
        brTime.setDate(1);
        brTime.setHours(0, 0, 0, 0);
        const utcTimestamp = brTime.getTime() + (3 * 3600000);
        start = new Date(utcTimestamp);
    } else {
        start = new Date(); // Fallback
    }

    return { start, end: now };
}
