import { plural, useT } from '../lib/i18n';
import { useDemoHints } from '../lib/hints';
import { useMemo, useState } from 'react';
import { formatShort, relativeDays } from '../lib/dates';
import { formatInterval } from '../lib/srs';
import { useStore } from '../lib/store';
import { JUDGE_LABEL, type Judge } from '../lib/types';
import { JudgeBadge } from './JudgeBadge';
import { StruggleStatus } from './VerdictChips';

type Filter = 'all' | 'due' | 'unsolved' | 'new';

export function LibraryView({ onOpen, onGo }: { onOpen: (id: string) => void; onGo: () => void }) {
  const demoHints = useDemoHints();
  const t = useT();
  const { state, today } = useStore();
  const [judge, setJudge] = useState<Judge | 'all'>('all');
  const [filter, setFilter] = useState<Filter>('all');
  const [q, setQ] = useState('');
  const all = Object.values(state.problems);
  const judges = useMemo(() => [...new Set(all.map((p) => p.judge))], [all]);

  const rows = all
    .filter((p) => judge === 'all' || p.judge === judge)
    .filter((p) =>
      filter === 'due' ? p.card.due <= today : filter === 'unsolved' ? p.struggle && !p.struggle.solved : filter === 'new' ? p.history.length === 0 : true,
    )
    .filter((p) => !q.trim() || `${p.title} ${p.key} ${p.note}`.toLowerCase().includes(q.trim().toLowerCase()))
    .sort((a, b) => a.card.due.localeCompare(b.card.due) || a.title.localeCompare(b.title));

  if (all.length === 0) {
    return (
      <div className="card caught-up">
        <h2>{t('Your library is empty')}</h2>
        <p className="muted">{t('Import from AtCoder / Codeforces or add a problem by URL.')}</p>
        <button className="btn btn-primary" onClick={onGo}>{t('Go to Import')}</button>
      </div>
    );
  }

  return (
    <>
      <div className="page-head">
        <div>
          <h1>{t('Library')}</h1>
          <p>{t('Every problem in your loop, across {j} {judges}. Click a row for notes, history and the memory curve.', { j: judges.length, judges: plural(judges.length, 'judge') })}</p>
        </div>
      </div>
      <div className="toolbar">
        <input className="input" style={{ maxWidth: 240 }} value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('Search title or note…')} aria-label="Search" />
        <button className="filter-chip" aria-pressed={judge === 'all'} onClick={() => setJudge('all')}>{t('All judges')}</button>
        {judges.map((j) => (
          <button key={j} className="filter-chip" aria-pressed={judge === j} onClick={() => setJudge(j)}>{JUDGE_LABEL[j]}</button>
        ))}
        <span className="faint">|</span>
        {(['all', 'due', 'unsolved', 'new'] as Filter[]).map((f) => (
          <button key={f} className="filter-chip" aria-pressed={filter === f} onClick={() => setFilter(f)}>
            {t(f === 'all' ? 'Any status' : f === 'due' ? 'Due' : f === 'unsolved' ? 'Never solved' : 'Not reviewed')}
          </button>
        ))}
      </div>
      <div className="card lib-wrap" style={{ padding: 6 }}>
        <table className="lib">
          <thead>
            <tr>{['Judge', 'Problem', 'Struggle', 'Next review', 'Interval', 'Reviews'].map((h) => <th key={h}>{t(h)}</th>)}</tr>
          </thead>
          <tbody>
            {rows.map((p) => (
              <tr key={p.id} className="clickable" onClick={() => onOpen(p.id)}>
                <td><JudgeBadge judge={p.judge} /></td>
                <td>
                  {p.title}
                  {demoHints[p.id] && <> <span className="tag tag-hint" title={t('Pre-generated AI demo hints')}>{t('✦ hints')}</span></>}
                  {p.note && <div className="faint" style={{ fontSize: 12 }}>{t('Note: {note}', { note: p.note })}</div>}
                </td>
                <td>{p.struggle ? <StruggleStatus struggle={p.struggle} /> : <span className="faint">{t('manual')}</span>}</td>
                <td className={p.card.due < today ? 'overdue' : ''}>{p.card.due <= today ? t('Today') : `${formatShort(p.card.due)} · ${relativeDays(p.card.due, today)}`}</td>
                <td className="mono">{p.card.reps ? formatInterval(p.card.interval) : '—'}</td>
                <td className="mono">{p.history.length}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 && <p className="muted" style={{ padding: 14 }}>{t('No problems match these filters.')}</p>}
      </div>
    </>
  );
}
