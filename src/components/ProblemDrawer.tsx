import { useT } from '../lib/i18n';
import { useEffect, useState } from 'react';
import { formatShort, relativeDays } from '../lib/dates';
import { formatInterval } from '../lib/srs';
import { useStore } from '../lib/store';
import { HintPanel } from './HintPanel';
import { JudgeBadge } from './JudgeBadge';
import { MemoryCurve } from './MemoryCurve';
import { StruggleStatus, VerdictChips } from './VerdictChips';

const RATING_LABEL = { easy: 'Easy', hard: 'Hard', failed: 'Failed' } as const;

export function ProblemDrawer({ id, onClose, onToast, hintsEnabled }: { id: string; onClose: () => void; onToast: (m: string) => void; hintsEnabled: boolean | null }) {
  const { state, dispatch, today } = useStore();
  const p = state.problems[id];
  const [note, setNote] = useState(p?.note ?? '');
  const [showTags, setShowTags] = useState(false);
  const t = useT();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  if (!p) return null;
  const saveNote = () => {
    if (note !== p.note) {
      dispatch({ type: 'note', id, note });
      onToast(t('Mistake note saved'));
    }
  };
  const remove = () => {
    if (window.confirm(t('Remove “{title}” from your loop? Its review history will be deleted.', { title: p.title }))) {
      dispatch({ type: 'remove', id });
      onToast(t('Removed {title}', { title: p.title }));
      onClose();
    }
  };

  return (
    <>
      <div className="scrim" onClick={onClose} />
      <aside className="drawer" role="dialog" aria-modal="true" aria-label={p.title}>
        <div className="row" style={{ justifyContent: 'space-between' }}>
          <div className="row">
            <JudgeBadge judge={p.judge} />
            {p.source === 'sample' && <span className="tag">{t('sample')}</span>}
            {p.source === 'manual' && <span className="tag">{t('added by URL')}</span>}
          </div>
          <button className="btn btn-ghost btn-sm" onClick={onClose} aria-label="Close">✕</button>
        </div>
        {p.source === 'manual' ? (
          <input className="input" style={{ fontSize: 18, fontWeight: 600, marginTop: 10 }} defaultValue={p.title} aria-label="Title"
            onBlur={(e) => e.target.value.trim() && e.target.value !== p.title && dispatch({ type: 'title', id, title: e.target.value.trim() })} />
        ) : (
          <h2>{p.title}</h2>
        )}
        <div className="row" style={{ marginTop: 8 }}>
          <a className="btn btn-primary btn-sm" href={p.url} target="_blank" rel="noreferrer">{t('Open on judge ↗')}</a>
          {p.struggle && <StruggleStatus struggle={p.struggle} />}
          {p.struggle && <VerdictChips struggle={p.struggle} />}
          {p.difficulty !== undefined && <span className="faint mono">★ {p.difficulty}</span>}
        </div>

        <section>
          <h3>{t('Schedule')}</h3>
          <div className="kv">
            <div>{t('Next review')}<b>{p.card.due <= today ? t('Today') : formatShort(p.card.due)}</b>{p.card.due > today && relativeDays(p.card.due, today)}</div>
            <div>{t('Interval')}<b>{p.card.reps ? formatInterval(p.card.interval) : t('new')}</b></div>
            <div>{t('Ease')}<b>{p.card.ease.toFixed(2)}</b></div>
            <div>{t('Lapses')}<b>{p.card.lapses}</b></div>
          </div>
        </section>

        <section>
          <h3>{t('Memory curve')}</h3>
          {p.history.length > 0 ? (
            <>
              <MemoryCurve problem={p} today={today} />
              <p className="hint-text">{t('Estimated recall. Reviews (dots) reset it; the next review lands before it drops below ~90%.')}</p>
            </>
          ) : (
            <p className="muted" style={{ margin: 0 }}>{t('Your curve starts after the first review.')}</p>
          )}
        </section>

        <section>
          <h3>{t('Mistake note')}</h3>
          <textarea className="input" value={note} onChange={(e) => setNote(e.target.value)} onBlur={saveNote} rows={3}
            placeholder={t('What went wrong? e.g. overflow in a*b, off-by-one on the last index, missed the n=1 case…')} aria-label="Mistake note" />
        </section>

        {p.tags && p.tags.length > 0 && (
          <section>
            <h3>{t('Topic hint')}</h3>
            {showTags ? (
              <div className="chips">{p.tags.map((t) => <span key={t} className="tag">{t}</span>)}</div>
            ) : (
              <button className="btn btn-sm" onClick={() => setShowTags(true)}>{t('Reveal tags (spoiler)')}</button>
            )}
          </section>
        )}

        <section>
          <h3>{t('Tiered hints')}</h3>
          <HintPanel problem={p} enabled={hintsEnabled} />
        </section>

        <section>
          <h3>{t('Review history')}</h3>
          {p.history.length === 0 ? (
            <p className="muted" style={{ margin: 0 }}>{t('Not reviewed yet')}{p.struggle ? t(' — imported because you needed {n} attempts.', { n: p.struggle.failures + (p.struggle.solved ? 1 : 0) }) : '.'}</p>
          ) : (
            <ul className="history">
              {[...p.history].reverse().map((h, i) => (
                <li key={i}>
                  <span>{formatShort(h.date)}</span>
                  <span className={`rate-${h.rating}`}>{RATING_LABEL[h.rating]}</span>
                  <span className="faint">{t('next in {i}', { i: formatInterval(h.interval) })}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section>
          <button className="btn btn-danger btn-sm" onClick={remove}>{t('Remove from loop')}</button>
        </section>
      </aside>
    </>
  );
}
