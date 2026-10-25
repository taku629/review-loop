import { problemId, type ProblemDraft } from './types';

export const DEMO_HANDLES = { atcoder: 'chokudai', codeforces: 'tourist' } as const;

export interface DemoSnapshot {
  capturedAt: string;
  handles: { atcoder: string; codeforces: string };
  picks: string[];
  atcoder: ProblemDraft[];
  codeforces: ProblemDraft[];
}

let cache: Promise<DemoSnapshot> | null = null;

/** Real submission data for the demo handles, captured at build time and shipped with the site. */
export function loadDemoSnapshot(): Promise<DemoSnapshot> {
  if (!cache) {
    cache = fetch(`${import.meta.env.BASE_URL}demo/snapshot.json`).then((r) => {
      if (!r.ok) throw new Error(`Demo data unavailable (HTTP ${r.status})`);
      return r.json() as Promise<DemoSnapshot>;
    });
    cache.catch(() => {
      cache = null;
    });
  }
  return cache;
}

/** The curated first-run set: alternating judges, every problem has pre-generated demo hints. */
export function demoPicks(s: DemoSnapshot): ProblemDraft[] {
  const all = new Map([...s.atcoder, ...s.codeforces].map((d) => [problemId(d.judge, d.key), d]));
  return s.picks.map((id) => all.get(id)).filter((d): d is ProblemDraft => !!d);
}
