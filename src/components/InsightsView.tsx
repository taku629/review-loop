import { useMemo } from 'react';
import { useT } from '../lib/i18n';
import { computeInsights, type Bucket } from '../lib/insights';
import { useStore } from '../lib/store';
import { JudgeBadge } from './JudgeBadge';

const pct = (x: number | null) => (x == null ? '—' : `${Math.round(x * 100)}%`);

export function InsightsView({ onOpen, onGo }: { onOpen: (id: string) => void; onGo: () => void }) {
  const { state, today } = useStore();
  const t = useT();
  const ins = useMemo(() => computeInsights(state, today), [state, today]);

  if (Object.keys(state.problems).length === 0) {
    return (
      <div className="card caught-up">
        <h2>{t('Nothing to analyze yet')}</h2>
        <p className="muted">{t('Import your struggles or try the demo to see your weak spots.')}</p>
        <button className="btn btn-primary" onClick={onGo}>{t('Go to Import')}</button>
      </div>
    );
  }

  const label = (b: Bucket) => (b.kind === 'tag' ? b.label : t('Difficulty {label}', { label: b.label }));
  const reason = (b: Bucket) =>
    b.weekFailed + b.weekHard > 0
      ? t('{failed} Failed · {hard} Hard this week', { failed: b.weekFailed, hard: b.weekHard })
      : b.reviews > 0
        ? t('{failed} Failed in {reviews} reviews', { failed: b.failed, reviews: b.reviews })
        : t('{n} problems · {wa} wrong submissions before AC · {u} unsolved', { n: b.problems, wa: b.wrongBeforeAc, u: b.unsolved });
  const { totals } = ins;

  const bars = (list: Bucket[]) => {
    const max = Math.max(1, ...list.map((b) => b.problems));
    return (
      <div className="bars">
        {list.map((b) => (
          <div
            key={b.key}
            className="bar-row"
            title={t('{n} problems · {u} unsolved · avg {wa} WA before AC · review fail rate {rate}', {
              n: b.problems,
              u: b.unsolved,
              wa: (b.wrongBeforeAc / b.problems).toFixed(1),
              rate: pct(b.reviews ? b.failed / b.reviews : null),
            })}
          >
            <span className="bar-label">{b.label}</span>
            <span className="bar">
              <span className="bar-fill" style={{ width: `${(b.problems / max) * 100}%` }}>
                <span className="bar-bad" style={{ width: `${(b.unsolved / b.problems) * 100}%` }} />
              </span>
            </span>
            <span className="bar-val mono">
              {b.problems}
              <span className={b.reviews && b.failed / b.reviews >= 0.5 ? 'rate-failed' : 'faint'}> · {pct(b.reviews ? b.failed / b.reviews : null)}</span>
            </span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <>
      <div className="page-head">
        <div>
          <h1>{t('Insights')}</h1>
          <p>{t('Where your mistakes cluster — by algorithm tag and difficulty — and how your reviews are going.')}</p>
        </div>
      </div>

      <section className="card weak-card" aria-label={t('Top 3 weak spots this week')}>
        <h2 style={{ margin: 0 }}>{ins.week ? t('Top 3 weak spots this week') : t('Top 3 weak spots')}</h2>
        <p className="hint-text" style={{ marginTop: 4 }}>
          {ins.week ? t('Based on your Failed / Hard reviews in the last 7 days.') : t('No reviews this week yet — ranked from your import history (wrong submissions, unsolved problems) and past reviews.')}
        </p>
        {ins.top.length === 0 ? (
          <p className="muted">{t('No weak spots found — keep reviewing.')}</p>
        ) : (
          <ol className="weak-list">
            {ins.top.map((b, i) => (
              <li key={b.kind + b.key}>
                <span className="weak-rank">{i + 1}</span>
                <div className="weak-body">
                  <div className="row" style={{ gap: 8 }}>
                    <b>{label(b)}</b>
                    <span className="hint-text">{reason(b)}</span>
                  </div>
                  <div className="row weak-probs">
                    {b.ids.slice(0, 3).map((id) => {
                      const p = state.problems[id];
                      return (
                        <button key={id} className="btn btn-sm" onClick={() => onOpen(id)}>
                          <JudgeBadge judge={p.judge} /> <span className="ellipsis">{p.title}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </li>
            ))}
          </ol>
        )}
      </section>

      <div className="grid-2" style={{ marginTop: 16 }}>
        <section className="card stack">
          <h2 style={{ margin: 0 }}>{t('Review results')}</h2>
          <div className="kv kv-3">
            <div>{t('Reviews')}<b>{totals.reviews}</b></div>
            <div>{t('This week')}<b>{totals.week}</b></div>
            <div>{t('Recall rate')}<b>{pct(totals.recall)}</b></div>
          </div>
          {totals.reviews > 0 ? (
            <>
              <div className="split" role="img" aria-label={`Easy ${totals.easy}, Hard ${totals.hard}, Failed ${totals.failed}`}>
                {(['easy', 'hard', 'failed'] as const).map((r) => (
                  <span key={r} className={`split-${r}`} style={{ flexGrow: totals[r] }} />
                ))}
              </div>
              <div className="row hint-text">
                <span className="rate-easy">● Easy {totals.easy}</span>
                <span className="rate-hard">● Hard {totals.hard}</span>
                <span className="rate-failed">● Failed {totals.failed}</span>
                <span>· {t('Recall rate')} = {t('(Easy + Hard) / all reviews')}</span>
              </div>
            </>
          ) : (
            <p className="muted" style={{ margin: 0 }}>{t('No reviews yet — rate a problem on Today to start the stats.')}</p>
          )}
        </section>

        <section className="card stack">
          <h2 style={{ margin: 0 }}>{t('By difficulty')}</h2>
          {ins.levels.length ? bars(ins.levels) : <p className="muted" style={{ margin: 0 }}>{t('No problems with a difficulty rating yet.')}</p>}
          <p className="hint-text" style={{ margin: 0 }}>{t('Bar = problems in your loop (red = still unsolved). Right: review fail rate.')}</p>
        </section>
      </div>

      <section className="card stack" style={{ marginTop: 16 }}>
        <h2 style={{ margin: 0 }}>{t('By algorithm tag')}</h2>
        {ins.tags.length ? bars(ins.tags) : <p className="muted" style={{ margin: 0 }}>{t('No tagged problems yet.')}</p>}
        <p className="hint-text" style={{ margin: 0 }}>{t('Tags come from Codeforces; AtCoder problems have no tags and are grouped by difficulty.')}</p>
      </section>
    </>
  );
}
