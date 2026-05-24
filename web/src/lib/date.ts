
export const DateUtils = {
    /**
     * Returns the ISO Week Range (Monday 00:00 to Sunday 23:59)
     * @param date Date within the target week
     */
    getIsoWeekRange(date: Date = new Date()) {
        const d = new Date(date);
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday

        const monday = new Date(d.setDate(diff));
        monday.setHours(0, 0, 0, 0);

        const sunday = new Date(monday);
        sunday.setDate(monday.getDate() + 6);
        sunday.setHours(23, 59, 59, 999);

        return { start: monday, end: sunday };
    },

    /**
     * Normalizes a date to UTC Midnight (YYYY-MM-DDT00:00:00.000Z)
     * Removes time component safely
     */
    normalizeDate(date: Date): Date {
        const d = new Date(date);
        return new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    },

    /**
     * Check if date is today (UTC)
     */
    isToday(date: Date): boolean {
        const now = this.normalizeDate(new Date());
        const target = this.normalizeDate(date);
        return now.getTime() === target.getTime();
    }
};
