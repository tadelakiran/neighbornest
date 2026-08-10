import { describe, expect, it, vi } from 'vitest';
import { addWeeks, daysRemaining, weekOf } from '@/lib/nest';

describe('weekOf', () => {
  it('returns 1 when no start date is provided', () => {
    expect(weekOf(undefined)).toBe(1);
  });

  it('clamps to week 6 after six weeks', () => {
    const start = new Date();
    start.setDate(start.getDate() - 70); // 10 weeks ago
    const iso = start.toISOString().slice(0, 10);
    expect(weekOf(iso)).toBe(6);
  });

  it('is week 1 during the first 7 days', () => {
    const start = new Date();
    start.setDate(start.getDate() - 2);
    expect(weekOf(start.toISOString().slice(0, 10))).toBe(1);
  });

  it('treats an unparsable date as week 1', () => {
    expect(weekOf('not-a-date')).toBe(1);
  });
});

describe('daysRemaining', () => {
  it('returns null when the end date is missing', () => {
    expect(daysRemaining(undefined)).toBeNull();
  });

  it('returns the correct day count for a future date', () => {
    const end = new Date();
    end.setDate(end.getDate() + 5);
    expect(daysRemaining(end.toISOString().slice(0, 10))).toBe(5);
  });

  it('clamps past dates to 0', () => {
    const end = new Date();
    end.setDate(end.getDate() - 3);
    expect(daysRemaining(end.toISOString().slice(0, 10))).toBe(0);
  });
});

describe('addWeeks', () => {
  it('adds two weeks to a date', () => {
    expect(addWeeks('2026-07-20', 2)).toBe('2026-08-03');
  });

  it('returns undefined for invalid input', () => {
    expect(addWeeks(undefined, 2)).toBeUndefined();
    expect(addWeeks('garbage', 2)).toBeUndefined();
  });

  it('is used to compute the vibe-check unlock (week 3)', () => {
    vi.setSystemTime(new Date('2026-07-22T12:00:00'));
    const unlock = addWeeks('2026-07-20', 2) as string;
    expect(daysRemaining(unlock)).toBeLessThanOrEqual(12);
    expect(daysRemaining(unlock)).toBeGreaterThanOrEqual(11);
    vi.useRealTimers();
  });
});
