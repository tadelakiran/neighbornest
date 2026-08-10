/**
 * Shared date helpers for the Nest Hub (Module 4).
 * Both assume `startDate`/`endDate` arrive as `yyyy-MM-dd` (LocalDate).
 */

/**
 * Computes the current week (1–6) of a Nest from its start date.
 * Nests run for six weeks; anything before/after is clamped.
 *
 * @param startDate - the Nest start date (`yyyy-MM-dd`) or undefined
 * @returns the current week, 1 through 6
 */
export function weekOf(startDate?: string): number {
  if (!startDate) return 1;
  const start = new Date(`${startDate}T00:00:00`);
  if (Number.isNaN(start.getTime())) return 1;
  const elapsedDays = Math.floor((Date.now() - start.getTime()) / 86_400_000);
  return Math.min(6, Math.max(1, Math.floor(elapsedDays / 7) + 1));
}

/**
 * Days remaining until a date, or null when the date is unknown or in the past.
 *
 * @param endDate - the target date (`yyyy-MM-dd`) or undefined
 * @returns whole days remaining (≥ 0), or null
 */
export function daysRemaining(endDate?: string): number | null {
  if (!endDate) return null;
  const end = new Date(`${endDate}T00:00:00`);
  if (Number.isNaN(end.getTime())) return null;
  return Math.max(0, Math.ceil((end.getTime() - Date.now()) / 86_400_000));
}

/**
 * Adds a number of weeks to a `yyyy-MM-dd` date and returns a new ISO string.
 *
 * @param startDate - base date
 * @param weeks - weeks to add (e.g. 2 = vibe-check unlock)
 * @returns the shifted `yyyy-MM-dd` string, or undefined when unparsable
 */
export function addWeeks(startDate: string | undefined, weeks: number): string | undefined {
  if (!startDate) return undefined;
  const base = new Date(`${startDate}T00:00:00`);
  if (Number.isNaN(base.getTime())) return undefined;
  base.setDate(base.getDate() + weeks * 7);
  const m = String(base.getMonth() + 1).padStart(2, '0');
  const d = String(base.getDate()).padStart(2, '0');
  return `${base.getFullYear()}-${m}-${d}`;
}
