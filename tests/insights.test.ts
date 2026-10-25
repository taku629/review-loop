import { describe, expect, it } from 'vitest';
import { computeInsights, levelOf } from '../src/lib/insights';
import { emptyState } from '../src/lib/store';
import type { AppState, Problem, Rating } from '../src/lib/types';

const TODAY = '2026-10-25';
let n = 0;
function prob(over: Partial<Problem>): Problem {
  n++;
  return {
    id: `codeforces:${n}A`, judge: 'codeforces', key: `${n}A`, title: `P${n}`, url: '', source: 'import', note: '', hints: [], addedAt: '2026-10-01',
    card: { ease: 2.5, interval: 0, reps: 0, lapses: 0, due: TODAY }, history: [], ...over,
  };
}
function stateOf(problems: Problem[], log: { date: string; id: string; rating: Rating }[] = []): AppState {
  return { ...emptyState(), problems: Object.fromEntries(problems.map((p) => [p.id, p])), reviewLog: log };
}

describe('levelOf', () => {
  it('buckets difficulty', () => {
    expect(levelOf(undefined)).toBeUndefined();
    expect(levelOf(250)).toBe('< 800');
    expect(levelOf(1200)).toBe('1200–1599');
    expect(levelOf(3500)).toBe('2400+');
  });
});

describe('computeInsights', () => {
  it('ranks from the import history before any review', () => {
    const a = prob({ tags: ['dp'], difficulty: 1700, struggle: { solved: false, failures: 6, verdicts: { WA: 6 }, lastAt: 0 } });
    const b = prob({ tags: ['greedy'], difficulty: 900, struggle: { solved: true, failures: 1, verdicts: { WA: 1 }, lastAt: 0 } });
    const ins = computeInsights(stateOf([a, b]), TODAY);
    expect(ins.week).toBe(false);
    expect(ins.top[0].key === 'dp' || ins.top[0].key === '1600–1999').toBe(true);
    expect(ins.tags.map((t) => t.key)).toEqual(expect.arrayContaining(['dp', 'greedy']));
    expect(ins.totals.recall).toBeNull();
  });

  it("lets this week's Failed reviews dominate", () => {
    const a = prob({ tags: ['dp'], struggle: { solved: false, failures: 6, verdicts: { WA: 6 }, lastAt: 0 } });
    const b = prob({ tags: ['graphs'], history: [{ date: '2026-10-24', rating: 'failed', interval: 1 }] });
    const c = prob({ tags: ['graphs'], history: [{ date: '2026-10-10', rating: 'easy', interval: 3 }] });
    const log = [
      { date: '2026-10-24', id: b.id, rating: 'failed' as Rating },
      { date: '2026-10-10', id: c.id, rating: 'easy' as Rating },
    ];
    const ins = computeInsights(stateOf([a, b, c], log), TODAY);
    expect(ins.week).toBe(true);
    expect(ins.top[0].key).toBe('graphs');
    expect(ins.top[0].ids[0]).toBe(b.id);
    expect(ins.totals).toMatchObject({ reviews: 2, week: 1, easy: 1, failed: 1, recall: 0.5 });
  });

  it('ignores reviews older than 7 days for the weekly part', () => {
    const b = prob({ tags: ['math'] });
    const ins = computeInsights(stateOf([b], [{ date: '2026-10-18', id: b.id, rating: 'failed' }]), TODAY);
    expect(ins.week).toBe(false);
    expect(ins.top[0]?.weekFailed ?? 0).toBe(0);
  });
});
