import { describe, expect, it } from 'vitest';
import { detectStruggles, normalizeAtCoder, normalizeCodeforces, type NormSubmission } from '../src/lib/importers/struggles';

const s = (key: string, verdict: NormSubmission['verdict'], at: number): NormSubmission => ({ key, verdict, at });

describe('detectStruggles', () => {
  it('skips first-try AC', () => {
    expect(detectStruggles([s('a', 'AC', 1)]).size).toBe(0);
  });
  it('flags AC after WA/TLE and counts failures before the first AC only', () => {
    const m = detectStruggles([s('a', 'AC', 5), s('a', 'WA', 1), s('a', 'TLE', 2), s('a', 'WA', 9)]);
    expect(m.get('a')).toEqual({ solved: true, failures: 2, verdicts: { WA: 1, TLE: 1 }, lastAt: 9 });
  });
  it('flags unsolved problems with failures', () => {
    const m = detectStruggles([s('b', 'RE', 3), s('b', 'WA', 4)]);
    expect(m.get('b')?.solved).toBe(false);
    expect(m.get('b')?.failures).toBe(2);
  });
  it('ignores compile errors and pending verdicts', () => {
    expect(detectStruggles([s('c', 'IGNORE', 1), s('c', 'AC', 2)]).size).toBe(0);
  });
});

describe('verdict normalization', () => {
  it('maps Codeforces verdicts', () => {
    expect(normalizeCodeforces('OK')).toBe('AC');
    expect(normalizeCodeforces('WRONG_ANSWER')).toBe('WA');
    expect(normalizeCodeforces('TIME_LIMIT_EXCEEDED')).toBe('TLE');
    expect(normalizeCodeforces('COMPILATION_ERROR')).toBe('IGNORE');
    expect(normalizeCodeforces(undefined)).toBe('IGNORE');
  });
  it('maps AtCoder verdicts', () => {
    expect(normalizeAtCoder('WA')).toBe('WA');
    expect(normalizeAtCoder('CE')).toBe('IGNORE');
    expect(normalizeAtCoder('WJ')).toBe('IGNORE');
  });
});
