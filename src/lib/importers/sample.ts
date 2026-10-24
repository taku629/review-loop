import type { ProblemDraft } from '../types';

const t = (daysAgo: number) => Math.floor(Date.now() / 1000) - daysAgo * 86400;

/** Offline fallback so the demo still works if a judge API is down. Clearly labelled "sample" in the UI. */
export const SAMPLE_DRAFTS: ProblemDraft[] = [
  { judge: 'atcoder', key: 'abc086_a', title: 'ABC086 A - Product', url: 'https://atcoder.jp/contests/abc086/tasks/abc086_a', source: 'sample', difficulty: 9, struggle: { solved: true, failures: 1, verdicts: { WA: 1 }, lastAt: t(40) } },
  { judge: 'atcoder', key: 'abc081_a', title: 'ABC081 A - Placing Marbles', url: 'https://atcoder.jp/contests/abc081/tasks/abc081_a', source: 'sample', struggle: { solved: true, failures: 2, verdicts: { WA: 1, RE: 1 }, lastAt: t(25) } },
  { judge: 'codeforces', key: '4A', title: '4A · Watermelon', url: 'https://codeforces.com/contest/4/problem/A', source: 'sample', difficulty: 800, tags: ['brute force', 'math'], struggle: { solved: true, failures: 1, verdicts: { WA: 1 }, lastAt: t(60) } },
  { judge: 'codeforces', key: '1A', title: '1A · Theatre Square', url: 'https://codeforces.com/contest/1/problem/A', source: 'sample', difficulty: 1000, tags: ['math'], struggle: { solved: true, failures: 3, verdicts: { WA: 2, TLE: 1 }, lastAt: t(12) } },
  { judge: 'codeforces', key: '71A', title: '71A · Way Too Long Words', url: 'https://codeforces.com/contest/71/problem/A', source: 'sample', difficulty: 800, tags: ['strings'], struggle: { solved: false, failures: 2, verdicts: { WA: 2 }, lastAt: t(5) } },
];
