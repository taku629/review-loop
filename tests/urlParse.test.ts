import { describe, expect, it } from 'vitest';
import { parseProblemUrl } from '../src/lib/urlParse';

const ok = (s: string) => {
  const r = parseProblemUrl(s);
  if (!r.ok) throw new Error(r.error);
  return r.draft;
};

describe('parseProblemUrl', () => {
  it('detects AtCoder', () => {
    expect(ok('https://atcoder.jp/contests/abc300/tasks/abc300_e')).toMatchObject({
      judge: 'atcoder', key: 'abc300_e', title: 'ABC300 E',
    });
  });
  it('detects Codeforces contest, problemset and gym', () => {
    expect(ok('https://codeforces.com/contest/1919/problem/e')).toMatchObject({ judge: 'codeforces', key: '1919E', url: 'https://codeforces.com/contest/1919/problem/E' });
    expect(ok('codeforces.com/problemset/problem/4/A')).toMatchObject({ key: '4A' });
    expect(ok('https://codeforces.com/gym/104114/problem/B').url).toBe('https://codeforces.com/gym/104114/problem/B');
  });
  it('detects yukicoder', () => {
    expect(ok('https://yukicoder.me/problems/no/3')).toMatchObject({ judge: 'yukicoder', key: '3', title: 'yukicoder No.3' });
  });
  it('detects LeetCode with title from slug', () => {
    expect(ok('https://leetcode.com/problems/two-sum/description/')).toMatchObject({ judge: 'leetcode', key: 'two-sum', title: 'Two Sum' });
  });
  it('detects AOJ (both URL styles)', () => {
    expect(ok('https://onlinejudge.u-aizu.ac.jp/problems/ALDS1_1_A')).toMatchObject({ judge: 'aoj', key: 'ALDS1_1_A' });
    expect(ok('http://judge.u-aizu.ac.jp/onlinejudge/description.jsp?id=0001&lang=jp').key).toBe('0001');
  });
  it('accepts other judges as Other', () => {
    expect(ok('https://www.spoj.com/problems/PRIME1/')).toMatchObject({ judge: 'other', title: 'spoj.com · PRIME1' });
  });
  it('rejects non-URLs', () => {
    expect(parseProblemUrl('dp on trees')).toEqual({ ok: false, error: "That doesn't look like a URL" });
    expect(parseProblemUrl('   ').ok).toBe(false);
  });
});
