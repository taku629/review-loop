import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const hints: Record<string, { title: string; url: string; levels: string[] }> = JSON.parse(readFileSync('public/demo-hints.json', 'utf8')).hints;
const snap = JSON.parse(readFileSync('public/demo/snapshot.json', 'utf8')) as {
  picks: string[];
  atcoder: { judge: string; key: string; title: string; url: string }[];
  codeforces: { judge: string; key: string; title: string; url: string }[];
};
const drafts = new Map([...snap.atcoder, ...snap.codeforces].map((d) => [`${d.judge}:${d.key}`, d]));

describe('demo hints vs. the demo snapshot', () => {
  it('ships at least 40 hints', () => {
    expect(Object.keys(hints).length).toBeGreaterThanOrEqual(40);
  });

  it('only covers real struggles of the demo handles, with matching title and URL', () => {
    for (const [id, h] of Object.entries(hints)) {
      const d = drafts.get(id);
      expect(d, id).toBeDefined();
      expect(h.url).toBe(d!.url);
      expect(h.title).toBe(d!.title);
    }
  });

  it('covers every problem of the one-click demo', () => {
    for (const id of snap.picks) expect(hints[id], id).toBeDefined();
  });
});
