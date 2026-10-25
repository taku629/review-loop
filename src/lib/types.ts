export type Judge = 'atcoder' | 'codeforces' | 'yukicoder' | 'leetcode' | 'aoj' | 'other';
export type Rating = 'easy' | 'hard' | 'failed';

export interface Card {
  ease: number;
  interval: number;
  reps: number;
  lapses: number;
  due: string;
}

export interface Struggle {
  solved: boolean;
  failures: number;
  verdicts: Record<string, number>;
  lastAt: number;
}

export interface ReviewEntry {
  date: string;
  rating: Rating;
  interval: number;
}

export interface Problem {
  id: string;
  judge: Judge;
  key: string;
  title: string;
  url: string;
  source: 'import' | 'manual' | 'sample';
  difficulty?: number;
  tags?: string[];
  struggle?: Struggle;
  note: string;
  card: Card;
  history: ReviewEntry[];
  hints: string[];
  addedAt: string;
}

export type Lang = 'en' | 'ja';

export interface Settings {
  atcoder: string;
  codeforces: string;
  newPerDay: number;
  clockOffset: number;
  demoTour?: boolean;
  lang?: Lang;
  /** Every struggle id seen by an import or sync — the baseline for incremental re-sync. */
  known?: string[];
  syncedAt?: number;
}

export interface AppState {
  version: 1;
  problems: Record<string, Problem>;
  settings: Settings;
  reviewLog: { date: string; id: string; rating: Rating }[];
}

/** A problem as found by a parser or importer, before it gets a schedule. */
export interface ProblemDraft {
  judge: Judge;
  key: string;
  title: string;
  url: string;
  source: Problem['source'];
  difficulty?: number;
  tags?: string[];
  struggle?: Struggle;
  note?: string;
}

export const problemId = (judge: Judge, key: string) => `${judge}:${key}`;

export const JUDGE_LABEL: Record<Judge, string> = {
  atcoder: 'AtCoder',
  codeforces: 'Codeforces',
  yukicoder: 'yukicoder',
  leetcode: 'LeetCode',
  aoj: 'AOJ',
  other: 'Other',
};
