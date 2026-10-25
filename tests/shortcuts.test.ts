import { describe, expect, it } from 'vitest';
import { shortcutFor } from '../src/lib/shortcuts';

describe('shortcutFor', () => {
  it('maps E/H/F to ratings and J/K to movement (case-insensitive)', () => {
    expect(shortcutFor({ key: 'e' })).toEqual({ type: 'rate', rating: 'easy' });
    expect(shortcutFor({ key: 'H' })).toEqual({ type: 'rate', rating: 'hard' });
    expect(shortcutFor({ key: 'f' })).toEqual({ type: 'rate', rating: 'failed' });
    expect(shortcutFor({ key: 'j' })).toEqual({ type: 'move', delta: 1 });
    expect(shortcutFor({ key: 'ArrowUp' })).toEqual({ type: 'move', delta: -1 });
    expect(shortcutFor({ key: 'o' })).toEqual({ type: 'open' });
  });

  it('ignores other keys and browser shortcuts like Ctrl+F', () => {
    expect(shortcutFor({ key: 'x' })).toBeNull();
    expect(shortcutFor({ key: 'f', ctrlKey: true })).toBeNull();
    expect(shortcutFor({ key: 'e', metaKey: true })).toBeNull();
  });
});
