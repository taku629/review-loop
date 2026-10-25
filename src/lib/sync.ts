import { DEMO_HANDLES, loadDemoSnapshot, type DemoSnapshot } from './demo';
import { importAtCoder } from './importers/atcoder';
import { importCodeforces } from './importers/codeforces';
import { problemId, type Problem, type ProblemDraft, type Settings } from './types';

type Importer = typeof importAtCoder;
type SyncJudge = 'atcoder' | 'codeforces';

export interface SyncDeps {
  atcoder: Importer;
  codeforces: Importer;
  snapshot: () => Promise<DemoSnapshot>;
}

export interface SyncResult {
  /** Struggles not seen by any earlier import/sync and not already in the loop. */
  fresh: ProblemDraft[];
  /** Every struggle id seen so far (old baseline + this fetch). */
  known: string[];
  /** True when there was no baseline yet: this sync only records one. */
  baseline: boolean;
  checked: Partial<Record<SyncJudge, number>>;
  errors: string[];
}

const idOf = (d: ProblemDraft) => problemId(d.judge, d.key);

export function diffNew(drafts: ProblemDraft[], known: Set<string>, problems: Record<string, Problem>): ProblemDraft[] {
  return drafts.filter((d) => !known.has(idOf(d)) && !problems[idOf(d)]);
}

const DEFAULT_DEPS: SyncDeps = { atcoder: importAtCoder, codeforces: importCodeforces, snapshot: loadDemoSnapshot };

/** Re-fetch the saved handles and keep only struggles that are new since the last import or sync. */
export async function syncHandles(settings: Settings, problems: Record<string, Problem>, deps: SyncDeps = DEFAULT_DEPS): Promise<SyncResult> {
  const checked: SyncResult['checked'] = {};
  const errors: string[] = [];
  const fetched: ProblemDraft[] = [];
  const jobs = (['atcoder', 'codeforces'] as const).map(async (judge) => {
    const handle = settings[judge].trim();
    if (!handle) return;
    try {
      const list = await deps[judge](handle, () => {});
      checked[judge] = list.length;
      fetched.push(...list);
    } catch (e) {
      if (handle.toLowerCase() === DEMO_HANDLES[judge]) {
        try {
          const list = (await deps.snapshot())[judge];
          checked[judge] = list.length;
          fetched.push(...list);
          return;
        } catch {
          /* report the original error */
        }
      }
      errors.push(e instanceof Error ? e.message : String(e));
    }
  });
  await Promise.all(jobs);

  const baseline = !settings.known;
  const known = new Set(settings.known ?? Object.keys(problems));
  const fresh = baseline ? [] : diffNew(fetched, known, problems);
  for (const d of fetched) known.add(idOf(d));
  return { fresh, known: [...known], baseline: baseline && fetched.length > 0, checked, errors };
}
