import { addDays, formatShort, formatWeekday, relativeDays } from '../lib/dates';
import { formatInterval, review } from '../lib/srs';
import { selectDue, useStore } from '../lib/store';
import type { Rating } from '../lib/types';
import { LoopMark } from './Logo';
import { ReviewRow } from './ReviewRow';

interface Props {
  onOpen: (id: string) => void;
  onToast: (msg: string) => void;
  onGo: (tab: 'import') => void;
  onDemo: () => void;
}

export function TodayView({ onOpen, onToast, onGo, onDemo }: Props) {
  const { state, dispatch, today } = useStore();
  const all = Object.values(state.problems);
  const due = selectDue(state, today);
  const reviewedToday = state.reviewLog.filter((r) => r.date === today).length;
  const total = reviewedToday + due.length;

  if (all.length === 0) {
    return (
      <div className="card hero">
        <LoopMark className="loop" />
        <h1>Never repeat a contest mistake.</h1>
        <p>
          Review Loop pulls the problems you <b>failed</b> or solved only after <b>WA/TLE</b> from AtCoder and Codeforces, adds anything else
          by URL, and brings each one back right before you'd forget it.
        </p>
        <div className="row" style={{ justifyContent: 'center' }}>
          <button className="btn btn-primary" onClick={() => onGo('import')}>Import my struggles</button>
          <button className="btn" onClick={onDemo}>Try with demo handles (chokudai / tourist)</button>
        </div>
        <div className="steps">
          <div className="step"><b>1 · Import</b>Your AtCoder & Codeforces handles, or paste any problem URL (yukicoder, LeetCode, AOJ…).</div>
          <div className="step"><b>2 · Review today</b>One list across every judge. Open the problem, re-solve or re-think it.</div>
          <div className="step"><b>3 · Rate it</b>Easy, Hard or Failed — the next review moves along your forgetting curve.</div>
        </div>
      </div>
    );
  }

  const rate = (id: string, title: string, rating: Rating) => {
    const p = state.problems[id];
    if (!p) return;
    const next = review(p.card, rating, today);
    dispatch({ type: 'review', id, rating, today });
    onToast(`${title} → next review ${relativeDays(next.due, today)} (${formatShort(next.due)})`);
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
          <h1>Today</h1>
          <p>
            {due.length > 0
              ? `${due.length} problem${due.length === 1 ? '' : 's'} to review across ${new Set(due.map((p) => p.judge)).size} judge${new Set(due.map((p) => p.judge)).size === 1 ? '' : 's'}.`
              : 'Nothing due right now.'}{' '}
            Open it, re-solve or re-think it, then rate honestly.
          </p>
        </div>
        <div style={{ minWidth: 220 }}>
          <div className="hint-text">{reviewedToday} / {total} reviewed today</div>
          <div className="progress"><span style={{ width: `${total ? (reviewedToday / total) * 100 : 0}%` }} /></div>
        </div>
      </div>

      {due.length > 0 ? (
        <ul className="review-list" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {due.map((p) => (
            <ReviewRow key={p.id + p.history.length} problem={p} today={today} onOpen={() => onOpen(p.id)} onRate={(r) => rate(p.id, p.title, r)} />
          ))}
        </ul>
      ) : (
        <div className="card caught-up">
          <div className="big">✓</div>
          <h2>All caught up</h2>
          <p className="muted">
            {nextDue
              ? `Next review ${relativeDays(nextDue, today)} (${formatShort(nextDue)}) — ${all.filter((p) => p.card.due === nextDue).length} problem(s).`
              : 'Add more problems to keep the loop going.'}
          </p>
        </div>
      )}

      <h2 style={{ marginTop: 32 }}>Coming up</h2>
      <div className="forecast" aria-label="Reviews due in the next 7 days">
        {forecast.map((f) => (
          <div key={f.day} className="forecast-day" title={formatShort(f.day)}>
            {formatWeekday(f.day)} <span className="faint">{formatShort(f.day).split(' ')[1]}</span>
            <b>{f.n}</b>
            <div className="forecast-bar"><span style={{ width: `${(f.n / maxF) * 100}%` }} /></div>
          </div>
        ))}
      </div>
      <p className="hint-text" style={{ marginTop: 12 }}>
        Tracking {all.length} problem{all.length === 1 ? '' : 's'} · intervals grow like {formatInterval(3)} → {formatInterval(7)} → {formatInterval(19)} when you rate Easy.
      </p>
    </>
  );
}
