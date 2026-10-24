import { useRef, useState } from 'react';
import { emptyState, useStore } from '../lib/store';
import type { AppState } from '../lib/types';

function isAppState(x: unknown): x is AppState {
  const s = x as AppState;
  return !!s && typeof s === 'object' && s.version === 1 && typeof s.problems === 'object' && typeof s.settings === 'object' && Array.isArray(s.reviewLog);
}

export function SettingsView({ onToast, hintsEnabled }: { onToast: (m: string) => void; hintsEnabled: boolean | null }) {
  const { state, dispatch, today } = useStore();
  const s = state.settings;
  const file = useRef<HTMLInputElement>(null);
  const [err, setErr] = useState('');

  const exportJson = () => {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `review-loop-${today}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  };
  const importJson = async (f: File) => {
    setErr('');
    try {
      const data: unknown = JSON.parse(await f.text());
      if (!isAppState(data)) throw new Error('Not a Review Loop backup (expected version 1).');
      dispatch({ type: 'replace', state: data });
      onToast(`Restored ${Object.keys(data.problems).length} problems from backup`);
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    }
  };
  const shift = (d: number) => dispatch({ type: 'settings', patch: { clockOffset: d === 0 ? 0 : s.clockOffset + d } });

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Settings</h1>
          <p>Everything lives in this browser's local storage — no account, no server.</p>
        </div>
      </div>
      <div className="grid-2">
        <div className="card stack">
          <h2>Handles & pace</h2>
          <label className="field">
            AtCoder handle
            <input className="input" value={s.atcoder} onChange={(e) => dispatch({ type: 'settings', patch: { atcoder: e.target.value.trim() } })} placeholder="chokudai" />
          </label>
          <label className="field">
            Codeforces handle
            <input className="input" value={s.codeforces} onChange={(e) => dispatch({ type: 'settings', patch: { codeforces: e.target.value.trim() } })} placeholder="tourist" />
          </label>
          <label className="field">
            New imported problems per day: <b style={{ color: 'var(--text)' }}>{s.newPerDay}</b>
            <input type="range" min={1} max={20} value={s.newPerDay} onChange={(e) => dispatch({ type: 'settings', patch: { newPerDay: Number(e.target.value) } })} aria-label="New problems per day" />
          </label>
          <p className="hint-text" style={{ margin: 0 }}>Imports are spread out so a big backlog never floods your Today list.</p>
        </div>

        <div className="card stack">
          <h2>Demo clock</h2>
          <p className="hint-text" style={{ margin: 0 }}>Jump forward in time to see reviews come due. Today is <b className="mono">{today}</b>{s.clockOffset ? ` (+${s.clockOffset} days)` : ''}.</p>
          <div className="row">
            <button className="btn" onClick={() => shift(1)}>+1 day</button>
            <button className="btn" onClick={() => shift(3)}>+3 days</button>
            <button className="btn" onClick={() => shift(7)}>+1 week</button>
            <button className="btn btn-ghost" disabled={!s.clockOffset} onClick={() => shift(0)}>Back to real time</button>
          </div>
        </div>

        <div className="card stack">
          <h2>Backup</h2>
          <p className="hint-text" style={{ margin: 0 }}>Move your loop between browsers or keep a safety copy.</p>
          <div className="row">
            <button className="btn" onClick={exportJson}>Export JSON</button>
            <button className="btn" onClick={() => file.current?.click()}>Import JSON…</button>
            <input ref={file} type="file" accept="application/json,.json" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) void importJson(f); e.target.value = ''; }} />
          </div>
          {err && <div className="error">{err}</div>}
          <div>
            <button className="btn btn-danger btn-sm" onClick={() => { if (window.confirm('Delete every problem, note and review? This cannot be undone.')) { dispatch({ type: 'replace', state: emptyState() }); onToast('All data cleared'); } }}>
              Reset all data
            </button>
          </div>
        </div>

        <div className="card stack">
          <h2>AI hints (optional)</h2>
          <p className="hint-text" style={{ margin: 0 }}>
            {hintsEnabled
              ? 'Enabled — the server has an API key. Open any problem to get Hint 1 → Hint 2 → Approach.'
              : 'Off. Review Loop works fully without it. To enable, run it locally with OPENAI_API_KEY set (see README); the key stays on the server.'}
          </p>
          <div><span className={`tag`}>{hintsEnabled ? 'status: on' : hintsEnabled === null ? 'status: checking…' : 'status: off'}</span></div>
        </div>
      </div>
    </>
  );
}
