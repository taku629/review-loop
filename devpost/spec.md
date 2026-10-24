---
doc: spec
status: approved
---
<!-- Stack follows the learner's brief ("Vite+React with local storage"); approval per their instruction. -->

# Review Loop — Technical Spec

## How This Works, In Plain Language
Review Loop is a single web page that runs entirely in your browser. When you type your handles, the page asks the public AtCoder Problems and Codeforces APIs for your submission history, finds the problems where you got a wrong verdict, and saves them — plus anything you add by URL — in your browser's local storage (a small per-site notebook the browser keeps). A tiny scheduling function (SM-2 style) decides each problem's next review date from your Easy / Hard / Failed ratings. The Today view is just "every saved problem whose date is today or earlier".

The only optional server piece is the AI hint endpoint. It lives inside the Vite dev/preview server, so your API key stays on your machine and is never shipped to the browser. If no key is set (or on the static deploy), the endpoint reports "off" and the app hides the AI buttons — everything else works the same.

Why this shape: no account, no database, no backend to host → it deploys free as static files to GitHub Pages and runs end to end in a demo.

## The Core Journey Through the System
PRD ref: `prd.md > The Core Journey`.
1. User opens the page → `App` loads state from `localStorage` (`storage.ts`) → Today shows the welcome card if empty.
2. User enters handles on Import → `importers/atcoder.ts` pages through `GET kenkoooo.com/.../v3/user/submissions` (500 per page, 1 s apart) and `importers/codeforces.ts` calls `GET codeforces.com/api/user.status` → both produce normalized submissions → `importers/struggles.ts` groups by problem and keeps struggles.
3. Titles/difficulty for AtCoder come from `resources/problems.json` + `problem-models.json`; Codeforces submissions already carry name, rating and tags.
4. Preview list renders candidates → **Add N** → `store.addProblems()` merges by id (`judge:key`), assigns due dates through `srs.queueNew()` (≤ N new per day), persists.
5. Manual URL → `urlParse.ts` detects judge/key/title → `store.addProblems()` with due = today.
6. Today → `selectDue(today)` → rows; rating → `srs.review(card, rating, today)` → new due date → persist → toast.
7. Drawer "Get hint" → `hintsClient.ts` `POST /api/hint` → `server/hintApi.ts` → OpenAI-compatible chat completions → hint text saved on the problem.

## Stack
- **Vite 7** (dev server + static build) — https://vite.dev/guide/ — fast, zero-config, and its server plugin hook hosts the optional hint endpoint.
- **React 19 + TypeScript 5.9** — https://react.dev/ , https://www.typescriptlang.org/docs/ — component UI with typed data model.
- **Vitest 3** — https://vitest.dev/ — unit tests for the scheduler, URL parser and struggle detection.
- No router, no state library, no CSS framework: tabs are React state mirrored to the URL hash; one hand-written `styles.css`.

## Where It Runs and How Someone Tries It
- Requirements: Node 20+.
- `npm install` → `npm run dev` → open http://localhost:5173/review-loop/ .
- Production build: `npm run build` → `npm run preview` (http://localhost:4173/review-loop/).
- Optional AI hints: `OPENAI_API_KEY=... npm run dev` (also `OPENAI_BASE_URL`, `OPENAI_MODEL`, default `gpt-4o-mini`; any OpenAI-compatible endpoint). See `.env.example`.
- Deployment (optional, chosen): GitHub Pages via GitHub Actions on push to `main` → https://taku629.github.io/review-loop/ . Static only — AI hints are off there by design.
- Demo recording: use the live URL or `npm run dev`; handles `chokudai` (AtCoder) and `tourist` (Codeforces).

## Look and Feel
From `prd.md > Look and Feel`: dark navy background `#0b1020`, surfaces `#121a2f` / `#18213a`, borders `#24304f`, text `#e6e9f2` / muted `#8b95b0`, accent indigo-violet `#7c6cff` (gradient to `#4fd1c5` only on the logo loop). Font stack: Inter / system-ui for UI; `JetBrains Mono`, ui-monospace for IDs and verdict chips. Judge badges: AtCoder `#e6e9f2` on `#000`, Codeforces `#1f8acb`, yukicoder `#3fb950`, LeetCode `#ffa116`, AOJ `#14b8a6`, Other `#64748b`. Verdict chips: WA `#f85149`, TLE/MLE `#d29922`, RE `#bc8cff`, AC `#3fb950`. 12 px radius cards, 8 px spacing grid, subtle focus rings, responsive down to 380 px. Copy tone: short, encouraging, CP vocabulary.

## Components

### App shell (`App.tsx`, `Header.tsx`)
Tab state (hash-synced), stats (due today, reviewed today, tracked), toast host, drawer host. PRD ref: `prd.md > Screens and Layout`.

### Store (`lib/store.ts`)
`useReviewStore()` hook: `useReducer` over `AppState`, persisted to `localStorage` on every change. Actions: addProblems, review, updateNote, saveHint, remove, updateSettings, importBackup, reset. PRD ref: `prd.md > States and Boundaries` (persistence).

### Scheduler (`lib/srs.ts`)
Pure functions. PRD ref: `prd.md > Review scheduling (forgetting curve)`.
- `newCard(due)` → `{ ease: 2.5, interval: 0, reps: 0, lapses: 0, due }`.
- `review(card, rating, today)`:
  - ease update (SM-2): q = Easy 5, Hard 3, Failed 1; `ease += 0.1 - (5-q)*(0.08+(5-q)*0.02)`, clamped to [1.3, 3.0].
  - Failed → reps 0, lapses+1, interval 1.
  - Hard → interval = reps 0 ? 1 : reps 1 ? 3 : max(interval+1, round(interval*1.2)); reps+1.
  - Easy → interval = reps 0 ? 3 : reps 1 ? 7 : max(interval+1, round(interval*ease)); reps+1.
  - due = today + interval.
- `previewIntervals(card)` for button labels.
- `queueNew(existingDueCounts, count, perDay, today)` → due dates filling at most `perDay` new items per day starting today.
- `retention(daysSinceReview, interval)` → `exp(ln(0.9) * t / interval)` (90 % at the due date) for the memory curve.

### Dates (`lib/dates.ts`)
Local `YYYY-MM-DD` strings, `addDays`, `diffDays`, `today(offsetDays)` (demo clock).

### URL parser (`lib/urlParse.ts`)
`parseProblemUrl(text)` → `{ judge, key, url, title }` or error. Patterns: `atcoder.jp/contests/{c}/tasks/{t}`, `codeforces.com/(contest|gym)/{id}/problem/{i}`, `codeforces.com/problemset/problem/{id}/{i}`, `yukicoder.me/problems/no/{n}`, `leetcode.com/problems/{slug}`, `onlinejudge.u-aizu.ac.jp/problems/{id}` / `judge.u-aizu.ac.jp/onlinejudge/description.jsp?id={id}`, otherwise `other:{host+path}`. PRD ref: `prd.md > Manual add by URL`.

### Importers (`lib/importers/atcoder.ts`, `codeforces.ts`, `struggles.ts`)
Fetch + normalize to `Submission { judge, key, title, url, verdict, ok, time, difficulty?, tags? }`; `findStruggles(subs)` groups per problem, sorts by time, counts failed verdicts before the first AC (or all if never AC), excludes CE/pending/skipped. PRD ref: `prd.md > Importing struggles from judges`.

### Today view (`components/TodayView.tsx`, `ReviewRow.tsx`)
Due list, progress bar, forecast strip, welcome & caught-up states. PRD ref: `prd.md > Today view`.

### Library view (`components/LibraryView.tsx`)
Filter chips, search, table, remove. PRD ref: `prd.md > Library`.

### Import view (`components/ImportView.tsx`)
Handle form, per-judge progress/errors, preview with checkboxes, sample-data fallback, manual URL form. PRD refs: `prd.md > Importing struggles from judges`, `prd.md > Manual add by URL`.

### Problem drawer (`components/ProblemDrawer.tsx`, `MemoryCurve.tsx`, `HintPanel.tsx`)
Details, note editor, history, SVG memory curve, hints. PRD refs: `prd.md > Mistake notes`, `prd.md > Tiered hints (optional AI)`.

### Settings (`components/SettingsView.tsx`)
Handles, new-per-day, demo clock, export/import JSON, reset, AI status.

### Hint endpoint (`server/hintApi.ts`)
Vite plugin (`configureServer` + `configurePreviewServer`): `GET /api/hint/status` → `{ enabled, model }`; `POST /api/hint` `{ judge, title, url, tags, note, level: 1|2|3, previous: string[] }` → `{ hint }`. Reads `OPENAI_API_KEY` from env; never exposed to client code.

## Data Model
`localStorage["review-loop/v1"]`:
```ts
AppState = {
  version: 1,
  problems: Record<string, Problem>,   // id = `${judge}:${key}`
  settings: { atcoder: string; codeforces: string; newPerDay: number; clockOffset: number },
  reviewLog: { date: string; id: string; rating: Rating }[]   // for "reviewed today"
}
Problem = {
  id, judge: 'atcoder'|'codeforces'|'yukicoder'|'leetcode'|'aoj'|'other', key, title, url,
  source: 'import'|'manual'|'sample', difficulty?: number, tags?: string[],
  struggle?: { solved: boolean; failures: number; verdicts: Record<string, number>; lastAt: number },
  note: string, card: Card, history: { date: string; rating: Rating; interval: number }[],
  hints: string[], addedAt: string
}
```
Updated only through store actions; loaded on start; survives reloads; backup via JSON export.

## File Structure
```
review-loop/
├── index.html
├── package.json / tsconfig.json
├── vite.config.ts            # base '/review-loop/', react + hint plugins
├── server/hintApi.ts         # optional AI hint endpoint (dev/preview only)
├── src/
│   ├── main.tsx, App.tsx, styles.css
│   ├── lib/
│   │   ├── types.ts, dates.ts, srs.ts, urlParse.ts, store.ts, hintsClient.ts
│   │   └── importers/ atcoder.ts, codeforces.ts, struggles.ts
│   ├── components/ Header, TodayView, ReviewRow, LibraryView, ImportView,
│   │               ProblemDrawer, MemoryCurve, HintPanel, SettingsView, JudgeBadge, VerdictChips
│   └── data/sample.ts        # labeled offline sample
├── tests/                    # vitest: srs, urlParse, struggles
├── .github/workflows/        # ci.yml (test+build), deploy.yml (Pages)
├── .env.example
├── devpost/                  # scope.md, prd.md, spec.md, checklist.md, app-map.html
└── README.md
```

## External Services and Dependencies
- **AtCoder Problems API** (kenkoooo, unofficial, free, CORS `*` verified with curl):
  `GET https://kenkoooo.com/atcoder/atcoder-api/v3/user/submissions?user={u}&from_second={s}` → up to 500 `{ id, epoch_second, problem_id, contest_id, result }`; paginate with last epoch+1, ≥1 s between requests (author's request). Metadata: `GET /atcoder/resources/problems.json` (`id,title`), `/resources/problem-models.json` (`difficulty`). Docs: https://github.com/kenkoooo/AtCoderProblems/blob/master/doc/api.md
- **Codeforces API**: `GET https://codeforces.com/api/user.status?handle={h}&from=1&count=10000` → `{ status, result: [{ problem: { contestId, index, name, rating, tags }, verdict, creationTimeSeconds }] }`; error `{ status: "FAILED", comment }`. 1 req / 2 s limit. CORS `*` verified. Docs: https://codeforces.com/apiHelp/methods#user.status
- **OpenAI-compatible Chat Completions** (optional): `POST {OPENAI_BASE_URL}/chat/completions` with Bearer key. Docs: https://platform.openai.com/docs/api-reference/chat
- **GitHub Pages** via `actions/deploy-pages`: free hosting.

## Important Failure Modes
- **Judge API down / blocked / unknown handle** → per-judge inline error; other judge continues; "Load sample data" button (labeled sample).
- **Huge histories** → AtCoder capped at 30 pages (15k submissions); preview pre-checks only the 20 most recent; new-per-day cap spreads due dates.
- **No AI key / static deploy** → status endpoint missing → hint panel shows metadata hint + "AI hints are off" explanation.

## What Was Simplified and Why
- **localStorage** instead of accounts/DB — single user, zero hosting; JSON export covers backup.
- **Hint endpoint inside Vite server** instead of a separate backend — keeps the key server-side without a second service; static deploy simply runs without AI.
- **Manual add** for yukicoder/LeetCode/AOJ instead of more importers — proves cross-judge with one URL parser.

## Decisions and Open Issues
- Stack: Vite + React + localStorage (learner's brief suggestion); deployment GitHub Pages (free, static).
- Learner uncertainty addressed: can the browser call both judge APIs directly? Verified both return `access-control-allow-origin: *`, so no proxy is needed.
- Assumptions (agent, not learner): CE excluded from struggles; new-per-day default 5; Easy first interval 3 days.
- Open: none blocking.
