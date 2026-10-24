import { useState } from 'react';
import { HINT_LABELS, requestHint } from '../lib/hints';
import { useStore } from '../lib/store';
import type { Problem } from '../lib/types';

export function HintPanel({ problem, enabled }: { problem: Problem; enabled: boolean | null }) {
  const { dispatch } = useStore();
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');
  const next = problem.hints.length;

  if (!enabled) {
    return (
      <p className="muted" style={{ margin: 0 }}>
        {enabled === null ? 'Checking for AI hints…' : 'AI hints are off (no API key on the server). Try re-deriving the idea from your mistake note first — that is the point of the review.'}
      </p>
    );
  }
  const ask = async () => {
    setLoading(true);
    setErr('');
    try {
      dispatch({ type: 'hint', id: problem.id, hint: await requestHint(problem, next + 1) });
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="stack">
      {problem.hints.map((h, i) => (
        <div key={i} className="hint-box"><span className="lvl">{HINT_LABELS[i]}</span>{h}</div>
      ))}
      {next < HINT_LABELS.length && (
        <div>
          <button className="btn btn-sm" onClick={ask} disabled={loading}>{loading ? 'Thinking…' : `Reveal ${HINT_LABELS[next]}`}</button>
        </div>
      )}
      {err && <div className="error">{err}</div>}
    </div>
  );
}
