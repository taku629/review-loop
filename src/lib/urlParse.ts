import type { Judge, ProblemDraft } from './types';

export type ParseResult = { ok: true; draft: ProblemDraft } | { ok: false; error: string };

const titleCase = (slug: string) =>
  slug
    .split('-')
    .filter(Boolean)
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join(' ');

function draft(judge: Judge, key: string, url: string, title: string): ParseResult {
  return { ok: true, draft: { judge, key, url, title, source: 'manual' } };
}

export function atcoderTitle(taskId: string, contestId?: string): string {
  const parts = taskId.split('_');
  const idx = parts.length > 1 ? parts.pop()! : '';
  const contest = (contestId ?? parts.join('_')).toUpperCase();
  return idx ? `${contest} ${idx.toUpperCase()}` : taskId;
}

export function parseProblemUrl(input: string): ParseResult {
  const text = input.trim();
  if (!text) return { ok: false, error: 'Paste a problem URL first' };
  const withScheme = /^[a-z][a-z0-9+.-]*:\/\//i.test(text) ? text : `https://${text}`;
  let u: URL;
  try {
    u = new URL(withScheme);
  } catch {
    return { ok: false, error: "That doesn't look like a URL" };
  }
  if (!/^https?:$/.test(u.protocol) || !u.hostname.includes('.') || /\s/.test(text)) {
    return { ok: false, error: "That doesn't look like a URL" };
  }
  const host = u.hostname.replace(/^www\./, '').toLowerCase();
  const path = u.pathname.replace(/\/+$/, '');
  let m: RegExpMatchArray | null;

  if (host === 'atcoder.jp' && (m = path.match(/^\/contests\/([^/]+)\/tasks\/([^/]+)$/))) {
    const [, contest, task] = m;
    return draft('atcoder', task, `https://atcoder.jp/contests/${contest}/tasks/${task}`, atcoderTitle(task, contest));
  }

  if (/(^|\.)codeforces\.(com|ml)$/.test(host)) {
    m =
      path.match(/^\/(contest|gym)\/(\d+)\/problem\/([A-Za-z0-9]+)$/) ??
      path.match(/^\/problemset\/(problem)\/(\d+)\/([A-Za-z0-9]+)$/);
    if (m) {
      const [, kind, id, index] = m;
      const section = kind === 'gym' || Number(id) >= 100000 ? 'gym' : 'contest';
      const idx = index.toUpperCase();
      return draft('codeforces', `${id}${idx}`, `https://codeforces.com/${section}/${id}/problem/${idx}`, `CF ${id}${idx}`);
    }
  }

  if (host === 'yukicoder.me') {
    if ((m = path.match(/^\/problems\/no\/(\d+)$/))) {
      return draft('yukicoder', m[1], `https://yukicoder.me/problems/no/${m[1]}`, `yukicoder No.${m[1]}`);
    }
    if ((m = path.match(/^\/problems\/(\d+)$/))) {
      return draft('yukicoder', `id${m[1]}`, `https://yukicoder.me/problems/${m[1]}`, `yukicoder problem #${m[1]}`);
    }
  }

  if (/^leetcode\.(com|cn)$/.test(host) && (m = path.match(/^\/problems\/([a-z0-9-]+)/))) {
    return draft('leetcode', m[1], `https://${host}/problems/${m[1]}/`, titleCase(m[1]));
  }

  if (host === 'onlinejudge.u-aizu.ac.jp' && (m = path.match(/\/(?:problems|description)\/([A-Za-z0-9_]+)$/))) {
    return draft('aoj', m[1], `https://onlinejudge.u-aizu.ac.jp/problems/${m[1]}`, `AOJ ${m[1]}`);
  }
  if (host === 'judge.u-aizu.ac.jp' && u.searchParams.get('id')) {
    const id = u.searchParams.get('id')!;
    return draft('aoj', id, `https://onlinejudge.u-aizu.ac.jp/problems/${id}`, `AOJ ${id}`);
  }

  const last = path.split('/').filter(Boolean).pop();
  const key = `${host}${path}${u.search}`;
  return draft('other', key, u.toString(), last ? `${host} · ${decodeURIComponent(last)}` : host);
}
