import { useState } from 'react';
import { useStore } from '../lib/store';
import { problemId, JUDGE_LABEL } from '../lib/types';
import { parseProblemUrl } from '../lib/urlParse';
import { JudgeBadge } from './JudgeBadge';

export function ManualAdd({ onToast }: { onToast: (m: string) => void }) {
  const { state, dispatch, today } = useStore();
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [note, setNote] = useState('');
  const [touchedTitle, setTouchedTitle] = useState(false);
  const parsed = url.trim() ? parseProblemUrl(url) : null;
  const draft = parsed?.ok ? parsed.draft : null;
  const already = draft ? state.problems[problemId(draft.judge, draft.key)] : undefined;
  const shownTitle = touchedTitle ? title : draft?.title ?? '';

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft || already) return;
    dispatch({ type: 'add', drafts: [{ ...draft, title: shownTitle.trim() || draft.title, note: note.trim() }], today, dueNow: true });
    onToast(`Added ${shownTitle || draft.title} (${JUDGE_LABEL[draft.judge]}) — due today`);
    setUrl('');
    setTitle('');
    setNote('');
    setTouchedTitle(false);
  };

  return (
    <form className="card stack" onSubmit={submit}>
      <div>
        <h2>Add any problem by URL</h2>
        <p className="hint-text" style={{ margin: 0 }}>yukicoder, LeetCode, AOJ, AtCoder, Codeforces — or any other judge.</p>
      </div>
      <label className="field">
        Problem URL
        <input className="input" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://yukicoder.me/problems/no/3" aria-label="Problem URL" />
      </label>
      {parsed && !parsed.ok && <div className="error">{parsed.error}</div>}
      {draft && (
        <>
          <div className="row">
            <span className="hint-text">Detected</span> <JudgeBadge judge={draft.judge} /> <span className="mono faint">{draft.key}</span>
          </div>
          <label className="field">
            Title
            <input className="input" value={shownTitle} onChange={(e) => { setTouchedTitle(true); setTitle(e.target.value); }} />
          </label>
          <label className="field">
            Mistake note (optional)
            <input className="input" value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. forgot that n can be 1; used int instead of long long" />
          </label>
        </>
      )}
      {already && <div className="error">Already in your loop — next review {already.card.due}.</div>}
      <div>
        <button className="btn btn-primary" disabled={!draft || !!already}>Add to today</button>
      </div>
    </form>
  );
}
