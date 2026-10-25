import { afterEach, describe, expect, it, vi } from 'vitest';
import { importAtCoder } from '../src/lib/importers/atcoder';
import { importCodeforces } from '../src/lib/importers/codeforces';
import { ImportError } from '../src/lib/importers/errors';

const json = (status: number, body: unknown) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });
const noop = () => {};

async function failure(p: Promise<unknown>): Promise<ImportError> {
  const e = await p.then(() => null, (err: unknown) => err);
  expect(e).toBeInstanceOf(ImportError);
  return e as ImportError;
}

afterEach(() => vi.unstubAllGlobals());

describe('Codeforces import errors', () => {
  it('reports an unknown handle clearly', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => json(400, { status: 'FAILED', comment: 'handle: User with handle nosuchuser123 not found' })));
    const e = await failure(importCodeforces('nosuchuser123', noop));
    expect(e.kind).toBe('not-found');
    expect(e.message).toContain('nosuchuser123');
  });

  it('detects the call limit', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => json(503, { status: 'FAILED', comment: 'Call limit exceeded' })));
    expect((await failure(importCodeforces('tourist', noop))).kind).toBe('rate-limit');
  });

  it('turns network / CORS failures into a readable message', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => { throw new TypeError('Failed to fetch'); }));
    const e = await failure(importCodeforces('tourist', noop));
    expect(e.kind).toBe('network');
    expect(e.message).toMatch(/CORS/);
  });

  it('rejects malformed handles without calling the API', async () => {
    const f = vi.fn();
    vi.stubGlobal('fetch', f);
    expect((await failure(importCodeforces('to urist!', noop))).kind).toBe('invalid');
    expect(f).not.toHaveBeenCalled();
  });
});

describe('AtCoder import errors', () => {
  it('treats an empty submission list as an unknown handle', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => json(200, [])));
    expect((await failure(importAtCoder('nosuchuser', noop))).kind).toBe('not-found');
  });

  it('classifies 429 and 5xx', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => json(429, {})));
    expect((await failure(importAtCoder('chokudai', noop))).kind).toBe('rate-limit');
    vi.stubGlobal('fetch', vi.fn(async () => json(504, {})));
    const e = await failure(importAtCoder('chokudai', noop));
    expect(e.kind).toBe('server');
    expect(e.message).toContain('504');
  });
});
