import type { Rating } from './types';

export type ShortcutAction = { type: 'move'; delta: 1 | -1 } | { type: 'rate'; rating: Rating } | { type: 'open' };

interface KeyLike {
  key: string;
  metaKey?: boolean;
  ctrlKey?: boolean;
  altKey?: boolean;
}

const MAP: Record<string, ShortcutAction> = {
  j: { type: 'move', delta: 1 },
  arrowdown: { type: 'move', delta: 1 },
  k: { type: 'move', delta: -1 },
  arrowup: { type: 'move', delta: -1 },
  e: { type: 'rate', rating: 'easy' },
  h: { type: 'rate', rating: 'hard' },
  f: { type: 'rate', rating: 'failed' },
  o: { type: 'open' },
};

/** Today-view keyboard shortcuts: J/K move, E/H/F rate, O opens the problem. */
export function shortcutFor(e: KeyLike): ShortcutAction | null {
  if (e.metaKey || e.ctrlKey || e.altKey) return null;
  return MAP[e.key.toLowerCase()] ?? null;
}

/** Never steal keys while the user is typing or a dialog is open. */
export function shouldIgnoreKeys(target: EventTarget | null): boolean {
  const el = target as HTMLElement | null;
  if (el?.closest?.('input, textarea, select, [contenteditable="true"]')) return true;
  return !!document.querySelector('[role="dialog"]');
}
