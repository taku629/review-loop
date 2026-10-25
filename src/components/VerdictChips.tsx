import { useT } from '../lib/i18n';
import type { Struggle } from '../lib/types';

const KNOWN = new Set(['WA', 'TLE', 'MLE', 'OLE', 'RE']);

export function VerdictChips({ struggle }: { struggle?: Struggle }) {
  if (!struggle) return null;
  const entries = Object.entries(struggle.verdicts).sort((a, b) => b[1] - a[1]);
  return (
    <span className="chips">
      {entries.map(([v, n]) => (
        <span key={v} className={`chip ${KNOWN.has(v) ? `v-${v}` : 'v-other'}`}>
          {v}×{n}
        </span>
      ))}
    </span>
  );
}

export function StruggleStatus({ struggle }: { struggle?: Struggle }) {
  const t = useT();
  if (!struggle) return null;
  return struggle.solved ? (
    <span className="status status-solved">{t('AC after {n} tries', { n: struggle.failures + 1 })}</span>
  ) : (
    <span className="status status-unsolved">{t('Unsolved')}</span>
  );
}
