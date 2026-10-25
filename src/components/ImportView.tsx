import { useEffect, useMemo, useRef, useState } from 'react';
import { importAtCoder } from '../lib/importers/atcoder';
import { importCodeforces } from '../lib/importers/codeforces';
import { DEMO_HANDLES, loadDemoSnapshot } from '../lib/demo';
import { ImportError } from '../lib/importers/errors';
import { SAMPLE_DRAFTS } from '../lib/importers/sample';
import { useDemoHints } from '../lib/hints';
import { useStore } from '../lib/store';
import { problemId, type ProblemDraft } from '../lib/types';
import { JudgeBadge } from './JudgeBadge';
import { ManualAdd } from './ManualAdd';
import { StruggleStatus, VerdictChips } from './VerdictChips';

type Status = { state: 'idle' | 'loading' | 'done' | 'cached' | 'error'; msg: string; kind?: string };
const IDLE: Status = { state: 'idle', msg: '' };
const DEFAULT_PICK = 15;

/** Round-robin across judges so the first days of the queue mix AtCoder and Codeforces. */
function interleave(list: ProblemDraft[]): ProblemDraft[] {
  const byJudge = new Map<string, ProblemDraft[]>();
  for (const d of list) byJudge.set(d.judge, [...(byJudge.get(d.judge) ?? []), d]);
  const out: ProblemDraft[] = [];
  for (let i = 0; out.length < list.length; i++) for (const l of byJudge.values()) if (l[i]) out.push(l[i]);
  return out;
}

interface Props {
  onToast: (m: string) => void;
  onDone: () => void;
  demoRequest: number;
  onDemoConsumed: () => void;
}

export function ImportView({ onToast, onDone, demoRequest, onDemoConsumed }: Props) {
  const { state, dispatch, today } = useStore();
  const [ac, setAc] = useState(state.settings.atcoder);
  const [cf, setCf] = useState(state.settings.codeforces);
  const [acStatus, setAcStatus] = useState<Status>(IDLE);
  const [cfStatus, setCfStatus] = useState<Status>(IDLE);
  const [drafts, setDrafts] = useState<ProblemDraft[] | null>(null);
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const abort = useRef<AbortController | null>(null);
  const demoHints = useDemoHints();
  const busy = acStatus.state === 'loading' || cfStatus.state === 'loading';

  const showPreview = (list: ProblemDraft[]) => {
    const fresh = list.filter((d) => !state.problems[problemId(d.judge, d.key)]);
    setDrafts(list);
    setPicked(new Set(interleave(fresh).slice(0, DEFAULT_PICK).map((d) => problemId(d.judge, d.key))));
  };

  const run = async (acHandle: string, cfHandle: string) => {
    abort.current?.abort();
    const ctl = new AbortController();
    abort.current = ctl;
    setDrafts(null);
    dispatch({ type: 'settings', patch: { atcoder: acHandle.trim(), codeforces: cfHandle.trim() } });
    const job = async (judge: 'atcoder' | 'codeforces', handle: string, set: (s: Status) => void, fn: typeof importAtCoder) => {
      if (!handle.trim()) {
        set(IDLE);
        return [] as ProblemDraft[];
      }
      set({ state: 'loading', msg: 'Starting…' });
      try {
        const list = await fn(handle, (msg) => set({ state: 'loading', msg }), ctl.signal);
        set({ state: 'done', msg: `${list.length} struggle${list.length === 1 ? '' : 's'} found` });
        return list;
      } catch (e) {
        if (ctl.signal.aborted) return [];
        const msg = e instanceof Error ? e.message : String(e);
        const kind = e instanceof ImportError ? e.kind : 'server';
        if (handle.trim().toLowerCase() === DEMO_HANDLES[judge] && kind !== 'invalid') {
          try {
            const snap = await loadDemoSnapshot();
            set({ state: 'cached', msg: `${snap[judge].length} struggles from the cached demo snapshot (${snap.capturedAt}) — live API failed: ${msg}` });
            return snap[judge];
          } catch {
            /* fall through to the error */
          }
        }
        set({ state: 'error', msg, kind });
        return [];
      }
    };
    const [a, c] = await Promise.all([job('atcoder', acHandle, setAcStatus, importAtCoder), job('codeforces', cfHandle, setCfStatus, importCodeforces)]);
    if (ctl.signal.aborted) return;
    const merged = [...a, ...c].sort((x, y) => (y.struggle?.lastAt ?? 0) - (x.struggle?.lastAt ?? 0));
    if (merged.length) showPreview(merged);
  };

  useEffect(() => {
    if (demoRequest > 0) {
      onDemoConsumed();
      setAc('chokudai');
      setCf('tourist');
      void run('chokudai', 'tourist');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [demoRequest]);
  useEffect(() => () => abort.current?.abort(), []);

  const freshCount = useMemo(() => drafts?.filter((d) => !state.problems[problemId(d.judge, d.key)]).length ?? 0, [drafts, state.problems]);

  const toggle = (id: string) =>
    setPicked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const add = () => {
    if (!drafts) return;
    const chosen = interleave(drafts.filter((d) => picked.has(problemId(d.judge, d.key))));
    dispatch({ type: 'add', drafts: chosen, today });
    const per = state.settings.newPerDay;
    onToast(`Added ${chosen.length} problems · up to ${per} new per day are scheduled, starting today`);
    setDrafts(null);
    onDone();
  };

  const line = (label: string, s: Status) =>
    s.state !== 'idle' && (
      <div className={s.state === 'error' ? 'error' : s.state === 'cached' ? 'warn-text' : s.state === 'done' ? '' : 'muted'}>
        <b>{label}</b> · {s.state === 'loading' ? '⏳ ' : s.state === 'done' ? '✓ ' : s.state === 'cached' ? '↺ ' : '⚠ '}
        {s.msg}
      </div>
    );

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Import</h1>
          <p>Pull problems you failed — or only solved after WA/TLE — from your judges. Nothing is stored except in this browser.</p>
        </div>
      </div>
      <div className="grid-2">
        <form className="card stack" onSubmit={(e) => { e.preventDefault(); void run(ac, cf); }}>
          <div>
            <h2>From your handles</h2>
            <p className="hint-text" style={{ margin: 0 }}>Public data via AtCoder Problems (kenkoooo) and the Codeforces API.</p>
          </div>
          <label className="field">
            AtCoder handle
            <input className="input" value={ac} onChange={(e) => setAc(e.target.value)} placeholder="chokudai" aria-label="AtCoder handle" />
          </label>
          <label className="field">
            Codeforces handle
            <input className="input" value={cf} onChange={(e) => setCf(e.target.value)} placeholder="tourist" aria-label="Codeforces handle" />
          </label>
          <div className="row">
            <button className="btn btn-primary" disabled={busy || (!ac.trim() && !cf.trim())}>{busy ? 'Importing…' : 'Find my struggles'}</button>
            <button type="button" className="btn btn-ghost" disabled={busy} onClick={() => { setAc('chokudai'); setCf('tourist'); }}>Use demo handles</button>
          </div>
          <div className="progress-lines" aria-live="polite">
            {line('AtCoder', acStatus)}
            {line('Codeforces', cfStatus)}
            {[acStatus, cfStatus].some((s) => s.state === 'error' && s.kind !== 'invalid' && s.kind !== 'not-found') && !busy && (
              <button type="button" className="btn btn-sm" style={{ alignSelf: 'flex-start' }} onClick={() => showPreview(SAMPLE_DRAFTS)}>
                API unavailable? Load offline sample problems
              </button>
            )}
          </div>
        </form>
        <ManualAdd onToast={onToast} />
      </div>

      {drafts && (
        <div className="preview card" style={{ padding: 0 }}>
          <div className="preview-head">
            <div>
              <b>{drafts.length} struggles found</b> <span className="muted">· {freshCount} new · {picked.size} selected</span>
            </div>
            <div className="row">
              <button className="btn btn-sm btn-ghost" onClick={() => setPicked(new Set(drafts.filter((d) => !state.problems[problemId(d.judge, d.key)]).map((d) => problemId(d.judge, d.key))))}>Select all new</button>
              <button className="btn btn-sm btn-ghost" onClick={() => setPicked(new Set())}>Clear</button>
              <button className="btn btn-sm btn-primary" disabled={picked.size === 0} onClick={add}>Add {picked.size} to my loop</button>
            </div>
          </div>
          <div className="preview-list">
            {drafts.map((d) => {
              const id = problemId(d.judge, d.key);
              const tracked = !!state.problems[id];
              return (
                <label key={id} className={`preview-item${tracked ? ' tracked' : ''}`}>
                  <input type="checkbox" checked={picked.has(id)} disabled={tracked} onChange={() => toggle(id)} />
                  <JudgeBadge judge={d.judge} />
                  <span className="title">
                    {d.title}
                    {d.source === 'sample' && <span className="tag">sample</span>}
                    {tracked && <span className="tag">already tracked</span>}
                    {demoHints[id] && <span className="tag tag-hint" title="Pre-generated AI demo hints">✦ hints</span>}
                  </span>
                  <span className="row" style={{ justifyContent: 'flex-end' }}>
                    {d.struggle && <StruggleStatus struggle={d.struggle} />}
                    {d.struggle && <VerdictChips struggle={d.struggle} />}
                    {d.difficulty !== undefined && <span className="faint mono">{d.difficulty}</span>}
                  </span>
                </label>
              );
            })}
          </div>
        </div>
      )}
    </>
  );
}
