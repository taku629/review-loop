import type { ProblemDraft } from '../types';
import { atcoderTitle } from '../urlParse';
import { checkHandle, fetchApi, httpError, ImportError } from './errors';
import { detectStruggles, normalizeAtCoder } from './struggles';

const API = 'https://kenkoooo.com/atcoder/atcoder-api/v3/user/submissions';
const RES = 'https://kenkoooo.com/atcoder/resources';
const PAGE = 500;
const MAX_PAGES = 40;

interface AcSubmission {
  epoch_second: number;
  problem_id: string;
  contest_id: string;
  result: string;
}
interface AcProblem {
  id: string;
  contest_id: string;
  title: string;
}
interface AcModel {
  difficulty?: number;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function getJson<T>(url: string, signal?: AbortSignal): Promise<T> {
  const res = await fetchApi('AtCoder Problems API', url, signal);
  if (!res.ok) throw httpError('AtCoder Problems API', res.status);
  return res.json() as Promise<T>;
}

/** Raw AtCoder difficulty is clipped below 400 by AtCoder Problems; mirror that for display. */
export function clipDifficulty(d: number): number {
  return Math.round(d >= 400 ? d : 400 / Math.exp(1 - d / 400));
}

interface Meta {
  contest: string;
  title: string;
  difficulty?: number;
}

/** Build-time snapshot first (the kenkoooo CDN sometimes caches responses without CORS headers), then the live files. */
async function loadMeta(signal?: AbortSignal): Promise<Map<string, Meta>> {
  try {
    const snap = await getJson<Record<string, [string, string, number?]>>(`${import.meta.env.BASE_URL}atcoder-meta.json`, signal);
    const entries = Object.entries(snap);
    if (entries.length) return new Map(entries.map(([id, [contest, title, difficulty]]) => [id, { contest, title, difficulty }]));
  } catch (e) {
    if (signal?.aborted) throw e;
  }
  try {
    const [problems, models] = await Promise.all([
      getJson<AcProblem[]>(`${RES}/problems.json`, signal),
      getJson<Record<string, AcModel>>(`${RES}/problem-models.json`, signal).catch(() => ({}) as Record<string, AcModel>),
    ]);
    return new Map(problems.map((p) => [p.id, { contest: p.contest_id, title: p.title, difficulty: models[p.id]?.difficulty }]));
  } catch (e) {
    if (signal?.aborted) throw e;
    return new Map();
  }
}

export async function importAtCoder(handle: string, onProgress: (msg: string) => void, signal?: AbortSignal): Promise<ProblemDraft[]> {
  checkHandle('AtCoder', handle);
  const user = encodeURIComponent(handle.trim());
  const subs: AcSubmission[] = [];
  let from = 0;
  for (let page = 0; page < MAX_PAGES; page++) {
    onProgress(`AtCoder: fetching submissions… ${subs.length}`);
    const batch = await getJson<AcSubmission[]>(`${API}?user=${user}&from_second=${from}`, signal);
    subs.push(...batch);
    if (batch.length < PAGE) break;
    from = batch[batch.length - 1].epoch_second + 1;
    await sleep(1000); // AtCoder Problems asks clients to wait ≥1s between calls
  }
  if (subs.length === 0)
    throw new ImportError('not-found', `No AtCoder submissions found for “${handle.trim()}”. Check the spelling — AtCoder Problems only knows users who have submitted at least once.`);
  onProgress(`AtCoder: ${subs.length} submissions · loading problem titles…`);
  const meta = await loadMeta(signal);
  const contestOf = new Map(subs.map((s) => [s.problem_id, s.contest_id]));
  const struggles = detectStruggles(subs.map((s) => ({ key: s.problem_id, verdict: normalizeAtCoder(s.result), at: s.epoch_second })));
  const drafts: ProblemDraft[] = [];
  for (const [key, struggle] of struggles) {
    const p = meta.get(key);
    const contest = p?.contest ?? contestOf.get(key) ?? key.replace(/_[^_]+$/, '');
    const diff = p?.difficulty;
    drafts.push({
      judge: 'atcoder',
      key,
      title: p ? `${contest.toUpperCase()} ${p.title}` : atcoderTitle(key, contest),
      url: `https://atcoder.jp/contests/${contest}/tasks/${key}`,
      source: 'import',
      difficulty: diff === undefined ? undefined : clipDifficulty(diff),
      struggle,
    });
  }
  return drafts.sort((a, b) => (b.struggle?.lastAt ?? 0) - (a.struggle?.lastAt ?? 0));
}
