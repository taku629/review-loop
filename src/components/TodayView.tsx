import { addDays, formatDayOfMonth, formatShort, formatWeekday, relativeDays } from '../lib/dates';
import { plural, useLang, useT } from '../lib/i18n';
import { formatInterval, review } from '../lib/srs';
import { useDemoHints } from '../lib/hints';
import { selectDue, useStore } from '../lib/store';
import type { Rating } from '../lib/types';
import { useState } from 'react';
import { DemoTour } from './DemoTour';
import { LoopMark } from './Logo';
import { ReviewRow } from './ReviewRow';

interface Props {
  onOpen: (id: string) => void;
  onToast: (msg: string) => void;
  onGo: (tab: 'import') => void;
  onDemo: () => Promise<void>;
}

export function TodayView({ onOpen, onToast, onGo, onDemo }: Props) {
  const { state, dispatch, today } = useStore();
  const demoHints = useDemoHints();
  const [loadingDemo, setLoadingDemo] = useState(false);
  const t = useT();
  const lang = useLang();
  const all = Object.values(state.problems);
  const due = selectDue(state, today);
  const reviewedToday = state.reviewLog.filter((r) => r.date === today).length;
  const total = reviewedToday + due.length;
  const judgeCount = new Set(due.map((p) => p.judge)).size;

  if (all.length === 0) {
    return (
      <div className="card hero">
        <LoopMark className="loop" />
        <h1>{t('Never repeat a contest mistake.')}</h1>
        {lang === 'ja' ? (
          <p>
            AtCoder と Codeforces から、<b>解けなかった</b>問題や <b>WA/TLE</b> の末にやっとACした問題を取り込み、他のジャッジの問題もURLで追加。忘れかける直前に、もう一度出題します。
          </p>
        ) : (
          <p>
            Review Loop pulls the problems you <b>failed</b> or solved only after <b>WA/TLE</b> from AtCoder and Codeforces, adds anything else
            by URL, and brings each one back right before you'd forget it.
          </p>
        )}
        <div className="row" style={{ justifyContent: 'center' }}>
          <button className="btn btn-primary" onClick={() => onGo('import')}>{t('Import my struggles')}</button>
          <button
            className="btn"
            disabled={loadingDemo}
            onClick={() => {
              setLoadingDemo(true);
              void onDemo().finally(() => setLoadingDemo(false));
            }}
          >
            {loadingDemo ? t('Loading demo…') : t('Try with demo handles (chokudai / tourist)')}
          </button>
        </div>
        <div className="steps">
          <div className="step"><b>{t('1 · Import')}</b>{t('Your AtCoder & Codeforces handles, or paste any problem URL (yukicoder, LeetCode, AOJ…).')}</div>
          <div className="step"><b>{t('2 · Review today')}</b>{t('One list across every judge. Open the problem, re-solve or re-think it.')}</div>
          <div className="step"><b>{t('3 · Rate it')}</b>{t('Easy, Hard or Failed — the next review moves along your forgetting curve.')}</div>
        </div>
      </div>
    );
  }

  const rate = (id: string, title: string, rating: Rating) => {
    const p = state.problems[id];
    if (!p) return;
    const next = review(p.card, rating, today);
    dispatch({ type: 'review', id, rating, today });
    onToast(t('{title} → next review {rel} ({date})', { title, rel: relativeDays(next.due, today), date: formatShort(next.due) }));
  };

  const forecast = Array.from({ length: 7 }, (_, i) => {
    const day = addDays(today, i + 1);
    return { day, n: all.filter((p) => p.card.due === day).length };
  });
  const maxF = Math.max(1, ...forecast.map((f) => f.n));
  const nextDue = all.map((p) => p.card.due).filter((d) => d > today).sort()[0];

  return (
    <>
      <div className="page-head">
        <div>
          <h1>{t('Today')}</h1>
          <p>
            {due.length > 0
              ? t('{n} {problems} to review across {j} {judges}.', { n: due.length, problems: plural(due.length, 'problem'), j: judgeCount, judges: plural(judgeCount, 'judge') })
              : t('Nothing due right now.')}{' '}
            {t('Open it, re-solve or re-think it, then rate honestly.')}
          </p>
        </div>
        <div style={{ minWidth: 220 }}>
          <div className="hint-text">{t('{done} / {total} reviewed today', { done: reviewedToday, total })}</div>
          <div className="progress"><span style={{ width: `${total ? (reviewedToday / total) * 100 : 0}%` }} /></div>
        </div>
      </div>

      {state.settings.demoTour && <DemoTour onOpen={onOpen} onToast={onToast} />}

      {due.length > 0 ? (
        <ul className="review-list" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {due.map((p) => (
            <ReviewRow key={p.id + p.history.length} problem={p} hasDemoHints={!!demoHints[p.id]} today={today} onOpen={() => onOpen(p.id)} onRate={(r) => rate(p.id, p.title, r)} />
          ))}
        </ul>
      ) : (
        <div className="card caught-up">
          <div className="big">✓</div>
          <h2>{t('All caught up')}</h2>
          <p className="muted">
            {nextDue
              ? t('Next review {rel} ({date}) — {n} problem(s).', { rel: relativeDays(nextDue, today), date: formatShort(nextDue), n: all.filter((p) => p.card.due === nextDue).length })
              : t('Add more problems to keep the loop going.')}
          </p>
        </div>
      )}

      <h2 style={{ marginTop: 32 }}>{t('Coming up')}</h2>
      <div className="forecast" aria-label="Reviews due in the next 7 days">
        {forecast.map((f) => (
          <div key={f.day} className="forecast-day" title={formatShort(f.day)}>
            {formatWeekday(f.day)} <span className="faint">{formatDayOfMonth(f.day)}</span>
            <b>{f.n}</b>
            <div className="forecast-bar"><span style={{ width: `${(f.n / maxF) * 100}%` }} /></div>
          </div>
        ))}
      </div>
      <p className="hint-text" style={{ marginTop: 12 }}>
        {t('Tracking {n} {problems} · intervals grow like {a} → {b} → {c} when you rate Easy.', { n: all.length, problems: plural(all.length, 'problem'), a: formatInterval(3), b: formatInterval(7), c: formatInterval(19) })}
      </p>
    </>
  );
}
