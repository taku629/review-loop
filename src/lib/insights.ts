import { addDays } from './dates';
import type { AppState, Problem, Rating } from './types';

export interface Bucket {
  key: string;
  kind: 'tag' | 'level';
  label: string;
  problems: number;
  unsolved: number;
  wrongBeforeAc: number;
  reviews: number;
  easy: number;
  hard: number;
  failed: number;
  weekFailed: number;
  weekHard: number;
  score: number;
  ids: string[];
}

export const LEVELS: [number, number, string][] = [
  [-Infinity, 800, '< 800'],
  [800, 1200, '800–1199'],
  [1200, 1600, '1200–1599'],
  [1600, 2000, '1600–1999'],
  [2000, 2400, '2000–2399'],
  [2400, Infinity, '2400+'],
];

export function levelOf(difficulty?: number): string | undefined {
  if (difficulty == null) return undefined;
  return LEVELS.find(([lo, hi]) => difficulty >= lo && difficulty < hi)?.[2];
}

/**
 * Higher = weaker. This week's Failed/Hard reviews dominate; past reviews and the import
 * history (unsolved, wrong submissions before AC) break ties and fill in before any review.
 */
function weakness(b: Bucket): number {
  return b.weekFailed * 4 + b.weekHard * 2 + b.failed * 1.5 + b.hard * 0.5 - b.easy * 0.75 + b.unsolved * 1 + Math.min(b.wrongBeforeAc, b.problems * 5) * 0.25;
}

/** Problems to practise first: recently failed, then unsolved, then most wrong submissions. */
function needScore(p: Problem): number {
  const last = p.history[p.history.length - 1];
  return (last?.rating === 'failed' ? 100 : last?.rating === 'hard' ? 50 : 0) + (p.struggle && !p.struggle.solved ? 20 : 0) + (p.struggle?.failures ?? 0);
}

export interface Insights {
  tags: Bucket[];
  levels: Bucket[];
  top: Bucket[];
  week: boolean;
  totals: Record<Rating, number> & { reviews: number; week: number; recall: number | null };
}

export function computeInsights(state: AppState, today: string): Insights {
  const weekStart = addDays(today, -6);
  const tags = new Map<string, Bucket>();
  const levels = new Map<string, Bucket>();
  const bucket = (m: Map<string, Bucket>, kind: Bucket['kind'], key: string): Bucket => {
    let b = m.get(key);
    if (!b) {
      b = { key, kind, label: key, problems: 0, unsolved: 0, wrongBeforeAc: 0, reviews: 0, easy: 0, hard: 0, failed: 0, weekFailed: 0, weekHard: 0, score: 0, ids: [] };
      m.set(key, b);
    }
    return b;
  };
  const bucketsOf = (p: Problem): Bucket[] => {
    const out = (p.tags ?? []).map((t) => bucket(tags, 'tag', t));
    const lv = levelOf(p.difficulty);
    if (lv) out.push(bucket(levels, 'level', lv));
    return out;
  };

  for (const p of Object.values(state.problems)) {
    for (const b of bucketsOf(p)) {
      b.problems++;
      b.ids.push(p.id);
      if (p.struggle) {
        b.wrongBeforeAc += p.struggle.failures;
        if (!p.struggle.solved) b.unsolved++;
      }
      for (const h of p.history) {
        b.reviews++;
        b[h.rating]++;
      }
    }
  }

  const totals = { easy: 0, hard: 0, failed: 0, reviews: 0, week: 0, recall: null as number | null };
  for (const r of state.reviewLog) {
    totals[r.rating]++;
    totals.reviews++;
    if (r.date < weekStart || r.date > today) continue;
    totals.week++;
    const p = state.problems[r.id];
    if (!p) continue;
    for (const b of bucketsOf(p)) {
      if (r.rating === 'failed') b.weekFailed++;
      if (r.rating === 'hard') b.weekHard++;
    }
  }
  if (totals.reviews) totals.recall = (totals.easy + totals.hard) / totals.reviews;

  const all = [...tags.values(), ...levels.values()];
  for (const b of all) {
    b.score = weakness(b);
    b.ids.sort((x, y) => needScore(state.problems[y]) - needScore(state.problems[x]));
  }
  const top = all
    .filter((b) => b.score > 0)
    .sort((a, b) => b.score - a.score || b.problems - a.problems)
    .slice(0, 3);

  return {
    tags: [...tags.values()].sort((a, b) => b.problems - a.problems || b.score - a.score).slice(0, 10),
    levels: LEVELS.map(([, , l]) => levels.get(l)).filter((b): b is Bucket => !!b),
    top,
    week: totals.week > 0,
    totals,
  };
}
