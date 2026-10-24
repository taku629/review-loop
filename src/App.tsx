import { useCallback, useEffect, useRef, useState } from 'react';
import { Header, type Tab } from './components/Header';
import { ImportView } from './components/ImportView';
import { TodayView } from './components/TodayView';
import { StoreContext, usePersistentStore } from './lib/store';

const TAB_IDS: Tab[] = ['today', 'library', 'import', 'settings'];
const tabFromHash = (): Tab => {
  const h = window.location.hash.replace('#', '') as Tab;
  return TAB_IDS.includes(h) ? h : 'today';
};

export default function App() {
  const store = usePersistentStore();
  const [tab, setTabState] = useState<Tab>(tabFromHash);
  const [demoRequest, setDemoRequest] = useState(0);
  const [toast, setToast] = useState<string | null>(null);
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => {
    const onHash = () => setTabState(tabFromHash());
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  const setTab = useCallback((t: Tab) => {
    window.location.hash = t;
    setTabState(t);
    window.scrollTo({ top: 0 });
  }, []);

  const showToast = useCallback((m: string) => {
    setToast(m);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setToast(null), 3200);
  }, []);

  return (
    <StoreContext.Provider value={store}>
      <Header tab={tab} onTab={setTab} />
      <main>
        {tab === 'today' && <TodayView onOpen={() => {}} onToast={showToast} onGo={setTab} onDemo={() => { setDemoRequest((n) => n + 1); setTab('import'); }} />}
        {tab === 'import' && <ImportView onToast={showToast} onDone={() => setTab('today')} demoRequest={demoRequest} onDemoConsumed={() => setDemoRequest(0)} />}
        {(tab === 'library' || tab === 'settings') && <div className="card muted">Coming soon.</div>}
      </main>
      {toast && <div className="toast" role="status">{toast}</div>}
    </StoreContext.Provider>
  );
}
