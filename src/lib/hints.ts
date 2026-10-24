import { useEffect, useState } from 'react';
import type { Problem } from './types';

const base = import.meta.env.BASE_URL;

export function useHintsEnabled(): boolean | null {
  const [enabled, setEnabled] = useState<boolean | null>(null);
  useEffect(() => {
    fetch(`${base}api/hint/status`)
      .then((r) => (r.ok ? r.json() : { enabled: false }))
      .then((d: { enabled?: boolean }) => setEnabled(!!d.enabled))
      .catch(() => setEnabled(false));
  }, []);
  return enabled;
}

export async function requestHint(p: Problem, level: number): Promise<string> {
  const r = await fetch(`${base}api/hint`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ title: p.title, url: p.url, judge: p.judge, level, note: p.note, previous: p.hints }),
  });
  const d = (await r.json().catch(() => ({}))) as { hint?: string; error?: string };
  if (!r.ok || !d.hint) throw new Error(d.error ?? `Hint request failed (HTTP ${r.status})`);
  return d.hint;
}

export const HINT_LABELS = ['Hint 1', 'Hint 2', 'Approach'];
