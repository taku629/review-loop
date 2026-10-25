import { describe, expect, it, vi } from 'vitest';
import { DEFAULT_SETTINGS } from '../src/lib/store';
import { syncHandles, type SyncDeps } from '../src/lib/sync';
import type { ProblemDraft } from '../src/lib/types';

const d = (judge: 'atcoder' | 'codeforces', key: string): ProblemDraft => ({ judge, key, title: key, url: '', source: 'import' });
const snapshot = { capturedAt: '2026-10-24', handles: { atcoder: 'chokudai', codeforces: 'tourist' }, picks: [], atcoder: [d('atcoder', 'abc001_a')], codeforces: [d('codeforces', '1A')] };
const deps = (over: Partial<SyncDeps> = {}): SyncDeps => ({
  atcoder: vi.fn(async () => [d('atcoder', 'abc001_a'), d('atcoder', 'abc002_b')]),
  codeforces: vi.fn(async () => [d('codeforces', '1A')]),
  snapshot: async () => snapshot,
  ...over,
});

describe('syncHandles', () => {
  it('adds only struggles that are new since the last import', async () => {
    const settings = { ...DEFAULT_SETTINGS, atcoder: 'someone', codeforces: 'other', known: ['atcoder:abc001_a', 'codeforces:1A'] };
    const r = await syncHandles(settings, {}, deps());
    expect(r.fresh.map((x) => x.key)).toEqual(['abc002_b']);
    expect(r.known).toEqual(expect.arrayContaining(['atcoder:abc001_a', 'atcoder:abc002_b', 'codeforces:1A']));
    expect(r.checked).toEqual({ atcoder: 2, codeforces: 1 });
    expect(r.baseline).toBe(false);
  });

  it('records a baseline instead of flooding the loop when nothing was known', async () => {
    const r = await syncHandles({ ...DEFAULT_SETTINGS, atcoder: 'someone' }, {}, deps());
    expect(r.baseline).toBe(true);
    expect(r.fresh).toEqual([]);
    expect(r.known).toHaveLength(2);
  });

  it('skips handles that are not set and reports API errors', async () => {
    const failing = deps({ atcoder: vi.fn(async () => { throw new Error('AtCoder Problems API is having trouble (HTTP 504).'); }) });
    const r = await syncHandles({ ...DEFAULT_SETTINGS, atcoder: 'someone', known: [] }, {}, failing);
    expect(r.errors).toEqual(['AtCoder Problems API is having trouble (HTTP 504).']);
    expect(failing.codeforces).not.toHaveBeenCalled();
  });

  it('falls back to the bundled snapshot for the demo handles', async () => {
    const down = deps({ atcoder: vi.fn(async () => { throw new Error('down'); }), codeforces: vi.fn(async () => { throw new Error('down'); }) });
    const settings = { ...DEFAULT_SETTINGS, atcoder: 'chokudai', codeforces: 'tourist', known: ['atcoder:abc001_a', 'codeforces:1A'] };
    const r = await syncHandles(settings, {}, down);
    expect(r.errors).toEqual([]);
    expect(r.fresh).toEqual([]);
  });
});
