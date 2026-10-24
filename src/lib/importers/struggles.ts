import type { Struggle } from '../types';

export type Verdict = 'AC' | 'WA' | 'TLE' | 'MLE' | 'RE' | 'OLE' | 'IGNORE';

export interface NormSubmission {
  key: string;
  verdict: Verdict;
  at: number;
}

const CF_VERDICT: Record<string, Verdict> = {
  OK: 'AC',
  WRONG_ANSWER: 'WA',
  CHALLENGED: 'WA',
  TIME_LIMIT_EXCEEDED: 'TLE',
  IDLENESS_LIMIT_EXCEEDED: 'TLE',
  MEMORY_LIMIT_EXCEEDED: 'MLE',
  RUNTIME_ERROR: 'RE',
  OUTPUT_LIMIT_EXCEEDED: 'OLE',
};

export const normalizeCodeforces = (v: string | undefined): Verdict => (v ? CF_VERDICT[v] ?? 'IGNORE' : 'IGNORE');

export function normalizeAtCoder(v: string): Verdict {
  if (v === 'AC' || v === 'WA' || v === 'TLE' || v === 'MLE' || v === 'RE' || v === 'OLE') return v;
  return 'IGNORE';
}

/**
 * A problem is a "struggle" if the user never got AC but had at least one real failure,
 * or got AC only after one or more WA/TLE/MLE/RE/OLE. Compile errors and pending verdicts are ignored.
 */
export function detectStruggles(subs: NormSubmission[]): Map<string, Struggle> {
  const byKey = new Map<string, NormSubmission[]>();
  for (const s of subs) {
    if (s.verdict === 'IGNORE') continue;
    const list = byKey.get(s.key);
    if (list) list.push(s);
    else byKey.set(s.key, [s]);
  }
  const out = new Map<string, Struggle>();
  for (const [key, list] of byKey) {
    list.sort((a, b) => a.at - b.at);
    const verdicts: Record<string, number> = {};
    let failures = 0;
    let solved = false;
    for (const s of list) {
      if (s.verdict === 'AC') {
        solved = true;
        break;
      }
      failures++;
      verdicts[s.verdict] = (verdicts[s.verdict] ?? 0) + 1;
    }
    if (failures === 0) continue;
    out.set(key, { solved, failures, verdicts, lastAt: list[list.length - 1].at });
  }
  return out;
}
