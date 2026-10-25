import { addDays, diffDays, parseISODate } from './dates';
import type { AppState } from './types';

export type Cell = { date: string; n: number } | null;

export interface Activity {
  current: number;
  longest: number;
  reviewedToday: boolean;
  activeDays: number;
  /** Heatmap columns (weeks, Sunday first), oldest first; null = outside the range. */
  weeks: Cell[][];
  max: number;
  forecast: { date: string; n: number }[];
}

export function computeActivity(state: AppState, today: string, weeks = 20): Activity {
  const counts = new Map<string, number>();
  for (const r of state.reviewLog) if (r.date <= today) counts.set(r.date, (counts.get(r.date) ?? 0) + 1);

  const reviewedToday = counts.has(today);
  let current = 0;
  for (let d = reviewedToday ? today : addDays(today, -1); counts.has(d); d = addDays(d, -1)) current++;

  const days = [...counts.keys()].sort();
  let longest = 0;
  let run = 0;
  days.forEach((d, i) => {
    run = i > 0 && diffDays(d, days[i - 1]) === 1 ? run + 1 : 1;
    longest = Math.max(longest, run);
  });

  const start = addDays(today, -(weeks * 7 - 1));
  const first = addDays(start, -parseISODate(start).getDay());
  const grid: Cell[][] = [];
  for (let w = 0; addDays(first, w * 7) <= today; w++) {
    grid.push(
      Array.from({ length: 7 }, (_, i) => {
        const date = addDays(first, w * 7 + i);
        return date < start || date > today ? null : { date, n: counts.get(date) ?? 0 };
      }),
    );
  }

  const problems = Object.values(state.problems);
  const forecast = Array.from({ length: 7 }, (_, i) => {
    const date = addDays(today, i);
    return { date, n: problems.filter((p) => (i === 0 ? p.card.due <= today : p.card.due === date)).length };
  });

  return { current, longest, reviewedToday, activeDays: days.length, weeks: grid, max: Math.max(1, ...counts.values()), forecast };
}
