import { useT } from '../lib/i18n';
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
  const t = useT();
  const parsed = url.trim() ? parseProblemUrl(url) : null;
  const draft = parsed?.ok ? parsed.draft : null;
  const already = draft ? state.problems[problemId(draft.judge, draft.key)] : undefined;
  const shownTitle = touchedTitle ? title : draft?.title ?? '';

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft || already) return;
    dispatch({ type: 'add', drafts: [{ ...draft, title: shownTitle.trim() || draft.title, note: note.trim() }], today, dueNow: true });
    onToast(t('Added {title} ({judge}) — due today', { title: shownTitle || draft.title, judge: JUDGE_LABEL[draft.judge] }));
    setUrl('');
    setTitle('');
    setNote('');
    setTouchedTitle(false);
  };

  return (
    <form className="card stack" onSubmit={submit}>
      <div>
        <h2>{t('Add any problem by URL')}</h2>
        <p className="hint-text" style={{ margin: 0 }}>{t('yukicoder, LeetCode, AOJ, AtCoder, Codeforces — or any other judge.')}</p>
      </div>
      <label className="field">
        {t('Problem URL')}
        <input className="input" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://yukicoder.me/problems/no/3" aria-label="Problem URL" />
      </label>
      {parsed && !parsed.ok && <div className="error">{parsed.error}</div>}
      {draft && (
        <>
          <div className="row">
            <span className="hint-text">{t('Detected')}</span> <JudgeBadge judge={draft.judge} /> <span className="mono faint">{draft.key}</span>
          </div>
          <label className="field">
            {t('Title')}
            <input className="input" value={shownTitle} onChange={(e) => { setTouchedTitle(true); setTitle(e.target.value); }} />
          </label>
          <label className="field">
            {t('Mistake note (optional)')}
            <input className="input" value={note} onChange={(e) => setNote(e.target.value)} placeholder={t('e.g. forgot that n can be 1; used int instead of long long')} />
          </label>
        </>
      )}
      {already && <div className="error">{t('Already in your loop — next review {date}.', { date: already.card.due })}</div>}
      <div>
        <button className="btn btn-primary" disabled={!draft || !!already}>{t('Add to today')}</button>
      </div>
    </form>
  );
}
