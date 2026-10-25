import { selectDue, useStore } from '../lib/store';
import { useLang, useT } from '../lib/i18n';
import { LoopMark } from './Logo';

export type Tab = 'today' | 'library' | 'import' | 'settings';
const TABS: { id: Tab; label: string }[] = [
  { id: 'today', label: 'Today' },
  { id: 'library', label: 'Library' },
  { id: 'import', label: 'Import' },
  { id: 'settings', label: 'Settings' },
];

export function Header({ tab, onTab }: { tab: Tab; onTab: (t: Tab) => void }) {
  const { state, dispatch, today } = useStore();
  const tr = useT();
  const lang = useLang();
  const due = selectDue(state, today).length;
  const reviewed = state.reviewLog.filter((r) => r.date === today).length;
  const tracked = Object.keys(state.problems).length;
  return (
    <header className="topbar">
      <div className="topbar-inner">
        <a className="logo" href="#today" onClick={(e) => { e.preventDefault(); onTab('today'); }}>
          <LoopMark /> Review Loop
        </a>
        <nav className="tabs" role="tablist" aria-label="Sections">
          {TABS.map((t) => (
            <button key={t.id} role="tab" aria-selected={tab === t.id} className="tab" onClick={() => onTab(t.id)}>
              {tr(t.label)}
              {t.id === 'today' && due > 0 && <span className="count">{due}</span>}
            </button>
          ))}
        </nav>
        <div className="stats">
          {state.settings.clockOffset !== 0 && <span className="clock-pill">{tr('Demo clock +{n}d · {today}', { n: state.settings.clockOffset, today })}</span>}
          <span><b>{reviewed}</b> {tr('reviewed today')}</span>
          <span><b>{tracked}</b> {tr('tracked')}</span>
        </div>
        <button
          className="btn btn-sm lang-toggle"
          lang={lang === 'ja' ? 'en' : 'ja'}
          aria-label={lang === 'ja' ? 'Switch to English' : '日本語に切り替え'}
          onClick={() => dispatch({ type: 'settings', patch: { lang: lang === 'ja' ? 'en' : 'ja' } })}
        >
          {lang === 'ja' ? 'English' : '日本語'}
        </button>
      </div>
    </header>
  );
}
