import type { ProblemDraft } from '../types';
import { detectStruggles, normalizeCodeforces } from './struggles';

interface CfSubmission {
  creationTimeSeconds: number;
  verdict?: string;
  problem: { contestId?: number; problemsetName?: string; index: string; name: string; rating?: number; tags?: string[] };
}

export async function importCodeforces(handle: string, onProgress: (msg: string) => void, signal?: AbortSignal): Promise<ProblemDraft[]> {
  onProgress('Codeforces: fetching submissions…');
  const res = await fetch(`https://codeforces.com/api/user.status?handle=${encodeURIComponent(handle.trim())}&from=1&count=10000`, { signal });
  const body = (await res.json().catch(() => null)) as { status: string; comment?: string; result?: CfSubmission[] } | null;
  if (!body) throw new Error(`Codeforces API returned HTTP ${res.status}`);
  if (body.status !== 'OK' || !body.result) throw new Error(body.comment ?? 'Codeforces API error');
  const subs = body.result.filter((s) => s.problem.contestId !== undefined);
  if (subs.length === 0) throw new Error(`No Codeforces submissions found for “${handle}”.`);
  onProgress(`Codeforces: ${subs.length} submissions · finding struggles…`);
  const meta = new Map<string, CfSubmission['problem']>();
  const norm = subs.map((s) => {
    const key = `${s.problem.contestId}${s.problem.index}`;
    meta.set(key, s.problem);
    return { key, verdict: normalizeCodeforces(s.verdict), at: s.creationTimeSeconds };
  });
  const drafts: ProblemDraft[] = [];
  for (const [key, struggle] of detectStruggles(norm)) {
    const p = meta.get(key)!;
    const section = (p.contestId ?? 0) >= 100000 ? 'gym' : 'contest';
    drafts.push({
      judge: 'codeforces',
      key,
      title: `${key} · ${p.name}`,
      url: `https://codeforces.com/${section}/${p.contestId}/problem/${p.index}`,
      source: 'import',
      difficulty: p.rating,
      tags: p.tags,
      struggle,
    });
  }
  return drafts.sort((a, b) => (b.struggle?.lastAt ?? 0) - (a.struggle?.lastAt ?? 0));
}
