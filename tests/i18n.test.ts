import { afterEach, describe, expect, it } from 'vitest';
import { formatShort, relativeDays, setDateLang } from '../src/lib/dates';
import { JA, translate } from '../src/lib/i18n';

const placeholders = (s: string) => new Set(s.match(/\{\w+\}/g) ?? []);

afterEach(() => setDateLang('en'));

describe('Japanese UI strings', () => {
  it('only use placeholders the English source provides', () => {
    for (const [en, ja] of Object.entries(JA)) {
      const allowed = en.startsWith('import.') ? new Set(['{judge}', '{handle}', '{msg}']) : placeholders(en);
      expect(ja.trim(), en).not.toBe('');
      for (const p of placeholders(ja)) expect(allowed.has(p), `${en} → ${p}`).toBe(true);
    }
  });

  it('interpolates, and falls back to English for unknown keys', () => {
    expect(translate('en', 'AC after {n} tries', { n: 3 })).toBe('AC after 3 tries');
    expect(translate('ja', 'AC after {n} tries', { n: 3 })).toBe('3回目でAC');
    expect(translate('ja', 'untranslated {x}', { x: 1 })).toBe('untranslated 1');
  });

  it('localizes dates', () => {
    setDateLang('ja');
    expect(relativeDays('2026-10-28', '2026-10-25')).toBe('3日後');
    expect(relativeDays('2026-10-26', '2026-10-25')).toBe('明日');
    expect(formatShort('2026-10-28')).toBe('10月28日');
    setDateLang('en');
    expect(relativeDays('2026-10-28', '2026-10-25')).toBe('in 3 days');
  });
});
