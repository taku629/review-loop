import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const data = JSON.parse(readFileSync(new URL('../public/demo-hints.json', import.meta.url), 'utf8')) as {
  hints: Record<string, { title: string; url: string; levels: string[] }>;
};

describe('demo hints', () => {
  it('covers both demo judges with three non-empty levels each', () => {
    const entries = Object.entries(data.hints);
    expect(entries.length).toBeGreaterThanOrEqual(10);
    for (const [id, h] of entries) {
      expect(id).toMatch(/^(atcoder|codeforces):\w+$/);
      expect(h.levels).toHaveLength(3);
      for (const l of h.levels) expect(l.trim().length).toBeGreaterThan(20);
      expect(h.url).toMatch(/^https:\/\/(atcoder\.jp|codeforces\.com)\//);
    }
    expect(entries.some(([id]) => id.startsWith('atcoder:'))).toBe(true);
    expect(entries.some(([id]) => id.startsWith('codeforces:'))).toBe(true);
  });
});
