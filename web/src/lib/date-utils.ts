
// --- Brazil Time (UTC-3) Helpers ---

// Get a Date object representing the time in Brazil (shifted)
// NOTE: This shifts the underlying timestamp so that getHours() returns Brazil hours.
// Use with caution for comparisons with non-shifted dates.
function getBrazilTime(date: string | number | Date = new Date()): Date {
    const d = new Date(date);
    // Get UTC time
    const utc = d.getTime() + (d.getTimezoneOffset() * 60000);
    // Add -3h offset
    return new Date(utc - (3 * 3600000));
}

// Format: "12/01/2025" (Brazil Time)
export function formatMatchDate(dateStr: string | Date): string {
    return new Date(dateStr).toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' });
}

// Format: "14:30" (Brazil Time)
export function formatMatchTime(dateStr: string | Date): string {
    return new Date(dateStr).toLocaleTimeString('pt-BR', {
        hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo'
    });
}

// Relative Time (Hoje/Ontem) respecting Brazil Midnight
export function getTimeAgoBr(dateStr: string | Date): string {
    const now = new Date();
    const matchDate = new Date(dateStr);

    // Get strictly the "Day" string in Brazil for both
    // API: toLocaleDateString with timeZone is reliable for boundaries
    const nowBrStr = now.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' });
    const matchBrStr = matchDate.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' });

    if (nowBrStr === matchBrStr) return 'Hoje';

    // Check Yesterday: Subtract 24h from Now(Brazil) and check string
    // This is safer than manual math if DST or boundaries are tricky, 
    // but UTC-3 is constant.
    const oneDayMs = 24 * 60 * 60 * 1000;
    // We can't just subtract ms from 'now' because 'now' might be 00:01 and match 23:59.
    // Let's compare the objects used for string generation if possible, strictly by day values?
    // String comparison is easiest for "Same Day".

    // For "Ontem":
    // 1. Get Midnight Today Brazil
    const brNow = getBrazilTime(now);
    brNow.setHours(0, 0, 0, 0); // Floor to start of "Today" in shifted time

    const brMatch = getBrazilTime(matchDate); // Shifted match time

    // Diff in days (approx)
    // Actually, let's use the robust logic:
    // If it's not today, check if it matches "Yesterday String"
    const yesterday = new Date(now.getTime() - oneDayMs);
    const yesterdayBrStr = yesterday.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' });

    // Validating "Yesterday" string via subtraction might fail if exactly 24h ago crosses 2 days?
    // No, strictly: "Today" is 13th. "Yesterday" is 12th.
    // If match string is 12th, it IS yesterday.
    // BUT: "now - 24h" gives us a point in time yesterday.
    // If today is 13th, yesterday is 12th.
    // Is it possible match was 11th but "now - 24h" hits 12th? No.
    // Correct way: Construct "Yesterday" date object by subtracting 1 day from today's calendar date?
    // Too complex. Simple diff in days.

    const date1 = new Date(nowBrStr.split('/').reverse().join('-')); // YYYY-MM-DD (safe parse?)
    const date2 = new Date(matchBrStr.split('/').reverse().join('-'));

    // Fix: pt-BR defaults to DD/MM/YYYY. Split and reorder for Date constructor YYYY-MM-DD
    // Actually, just compare timestamps of the floored dates.
    // Or simpler:
    const diffTime = Math.abs(date1.getTime() - date2.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    // If dates are equal, diff is 0 (Handled by string check above)
    // If 1 day apart
    if (diffDays === 1) return 'Ontem';

    return `${diffDays}d atrás`;
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
        // DAILY
        const brTime = getBrazilTime(now);
        brTime.setHours(0, 0, 0, 0);
        const utcTimestamp = brTime.getTime() + (3 * 3600000);
        start = new Date(utcTimestamp);
    }

    return { start, end: now };
}
