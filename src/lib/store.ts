import { createContext, useContext, useEffect, useMemo, useReducer } from 'react';
import { todayISO } from './dates';
import { newCard, queueNew, review } from './srs';
import { problemId, type AppState, type Problem, type ProblemDraft, type Rating, type Settings } from './types';

export const STORAGE_KEY = 'review-loop/v1';

export const DEFAULT_SETTINGS: Settings = { atcoder: '', codeforces: '', newPerDay: 5, clockOffset: 0 };

export function emptyState(): AppState {
  return { version: 1, problems: {}, settings: { ...DEFAULT_SETTINGS }, reviewLog: [] };
}

export function loadState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyState();
    return normalizeState(JSON.parse(raw));
  } catch {
    return emptyState();
  }
}

export function normalizeState(data: unknown): AppState {
  const d = data as Partial<AppState> | null;
  if (!d || typeof d !== 'object' || d.version !== 1 || typeof d.problems !== 'object') {
    throw new Error('Not a Review Loop backup');
  }
  return {
    version: 1,
    problems: d.problems ?? {},
    settings: { ...DEFAULT_SETTINGS, ...(d.settings ?? {}) },
    reviewLog: Array.isArray(d.reviewLog) ? d.reviewLog : [],
  };
}

export type Action =
  | { type: 'add'; drafts: ProblemDraft[]; today: string; dueNow?: boolean }
  | { type: 'review'; id: string; rating: Rating; today: string }
  | { type: 'note'; id: string; note: string }
  | { type: 'title'; id: string; title: string }
  | { type: 'hint'; id: string; hint: string }
  | { type: 'remove'; id: string }
  | { type: 'settings'; patch: Partial<Settings> }
  | { type: 'replace'; state: AppState };

const isNew = (p: Problem) => p.history.length === 0;

export function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'add': {
      const problems = { ...state.problems };
      const fresh: ProblemDraft[] = [];
      for (const d of action.drafts) {
        const id = problemId(d.judge, d.key);
        const existing = problems[id];
        if (existing) {
          problems[id] = {
            ...existing,
            struggle: d.struggle ?? existing.struggle,
            difficulty: d.difficulty ?? existing.difficulty,
            tags: d.tags ?? existing.tags,
            title: existing.source === 'manual' ? existing.title : d.title || existing.title,
          };
        } else if (!fresh.some((f) => f.judge === d.judge && f.key === d.key)) {
          fresh.push(d);
        }
      }
      let dues: string[];
      if (action.dueNow) {
        dues = fresh.map(() => action.today);
      } else {
        const perDate: Record<string, number> = {};
        for (const p of Object.values(problems)) {
          if (isNew(p) && p.source !== 'manual') perDate[p.card.due] = (perDate[p.card.due] ?? 0) + 1;
        }
        dues = queueNew(perDate, fresh.length, state.settings.newPerDay, action.today);
      }
      fresh.forEach((d, i) => {
        const id = problemId(d.judge, d.key);
        problems[id] = {
          id,
          judge: d.judge,
          key: d.key,
          title: d.title,
          url: d.url,
          source: d.source,
          difficulty: d.difficulty,
          tags: d.tags,
          struggle: d.struggle,
          note: d.note ?? '',
          card: newCard(dues[i]),
          history: [],
          hints: [],
          addedAt: action.today,
        };
      });
      return { ...state, problems };
    }
    case 'review': {
      const p = state.problems[action.id];
      if (!p) return state;
      const card = review(p.card, action.rating, action.today);
      return {
        ...state,
        problems: {
          ...state.problems,
          [p.id]: { ...p, card, history: [...p.history, { date: action.today, rating: action.rating, interval: card.interval }] },
        },
        reviewLog: [...state.reviewLog, { date: action.today, id: p.id, rating: action.rating }].slice(-2000),
      };
    }
    case 'note':
    case 'title':
    case 'hint': {
      const p = state.problems[action.id];
      if (!p) return state;
      const patch =
        action.type === 'note' ? { note: action.note } : action.type === 'title' ? { title: action.title } : { hints: [...p.hints, action.hint] };
      return { ...state, problems: { ...state.problems, [p.id]: { ...p, ...patch } } };
    }
    case 'remove': {
      const problems = { ...state.problems };
      delete problems[action.id];
      return { ...state, problems };
    }
    case 'settings':
      return { ...state, settings: { ...state.settings, ...action.patch } };
    case 'replace':
      return action.state;
  }
}

export function selectDue(state: AppState, today: string): Problem[] {
  return Object.values(state.problems)
    .filter((p) => p.card.due <= today)
    .sort((a, b) => a.card.due.localeCompare(b.card.due) || a.judge.localeCompare(b.judge) || a.title.localeCompare(b.title));
}

export function usePersistentStore() {
  const [state, dispatch] = useReducer(reducer, undefined, loadState);
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* storage full or disabled: keep working in memory */
    }
  }, [state]);
  const today = todayISO(state.settings.clockOffset);
  return useMemo(() => ({ state, dispatch, today }), [state, today]);
}

export type Store = ReturnType<typeof usePersistentStore>;
export const StoreContext = createContext<Store | null>(null);

export function useStore(): Store {
  const s = useContext(StoreContext);
  if (!s) throw new Error('StoreContext missing');
  return s;
}
