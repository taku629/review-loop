import { describe, expect, it } from 'vitest';
import { computeActivity } from '../src/lib/activity';
import { emptyState } from '../src/lib/store';
import type { AppState, Rating } from '../src/lib/types';

const TODAY = '2026-10-25';
const withLog = (dates: string[]): AppState => ({ ...emptyState(), reviewLog: dates.map((date, i) => ({ date, id: `x:${i}`, rating: 'easy' as Rating })) });

describe('computeActivity', () => {
  it('counts the current streak ending today', () => {
    const a = computeActivity(withLog(['2026-10-23', '2026-10-24', '2026-10-25', '2026-10-25']), TODAY);
    expect(a).toMatchObject({ current: 3, longest: 3, reviewedToday: true, activeDays: 3 });
    expect(a.max).toBe(2);
  });

  it('keeps yesterday’s streak alive until today ends', () => {
    const a = computeActivity(withLog(['2026-10-23', '2026-10-24']), TODAY);
    expect(a).toMatchObject({ current: 2, reviewedToday: false });
  });

  it('breaks the streak after a missed day but remembers the longest', () => {
    const a = computeActivity(withLog(['2026-10-01', '2026-10-02', '2026-10-03', '2026-10-04', '2026-10-23']), TODAY);
    expect(a).toMatchObject({ current: 0, longest: 4 });
  });

  it('builds Sunday-first week columns that end today', () => {
    const a = computeActivity(withLog([TODAY]), TODAY, 20);
    expect(a.weeks.every((c) => c.length === 7)).toBe(true);
    const cells = a.weeks.flat().filter((c) => c !== null);
    expect(cells).toHaveLength(140);
    expect(cells[cells.length - 1]).toEqual({ date: TODAY, n: 1 });
    expect(a.weeks[a.weeks.length - 1][new Date(2026, 9, 25).getDay()]).toEqual({ date: TODAY, n: 1 });
  });

  it('forecasts overdue reviews into today', () => {
    const s = emptyState();
    const card = (due: string) => ({ ease: 2.5, interval: 1, reps: 1, lapses: 0, due });
    const p = (id: string, due: string) => ({ id, judge: 'atcoder' as const, key: id, title: id, url: '', source: 'manual' as const, note: '', hints: [], history: [], addedAt: TODAY, card: card(due) });
    s.problems = { a: p('a', '2026-10-20'), b: p('b', TODAY), c: p('c', '2026-10-27') };
    const f = computeActivity(s, TODAY).forecast;
    expect(f.map((d) => d.n)).toEqual([2, 0, 1, 0, 0, 0, 0]);
  });
});
