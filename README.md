# Review Loop

**A spaced-repetition review coach for competitive programmers — across every judge.**

Live demo: **https://taku629.github.io/review-loop/** (works fully in the browser; data stays in your localStorage)

Demo video (2:06): [`demo/review-loop-demo.mp4`](demo/review-loop-demo.mp4) · also on the [v1.0 release](https://github.com/taku629/review-loop/releases/tag/v1.0) · Devpost write-up: [`devpost/submission.md`](devpost/submission.md)

Review Loop pulls the problems you **failed**, or solved only after **WA / TLE / MLE / RE**, from **AtCoder** and **Codeforces**, lets you add any other problem by URL (**yukicoder, LeetCode, AOJ**, or any judge), and schedules each one on a forgetting curve. Every day, the **Today** view shows what's due across all judges in one list, linked to the original problem. After re-solving, rate it **Easy / Hard / Failed** and the next review date moves (SM-2 style).

## Who it's for

Student competitive programmers who practise on several judges and keep forgetting the mistakes they already paid for. Existing tools track progress per judge; Review Loop keeps one memory queue for all of them.

## Features

- **Import struggles by handle** — AtCoder via the public [AtCoder Problems API](https://github.com/kenkoooo/AtCoderProblems) (kenkoooo), Codeforces via the public [`user.status`](https://codeforces.com/apiHelp/methods#user.status) API. A problem counts as a struggle if it was never solved but had a real failure, or was solved only after one or more WA/TLE/MLE/RE/OLE (compile errors ignored). Preview with verdict chips and difficulty, choose what to add.
- **Add anything by URL** — AtCoder, Codeforces (contest/problemset/gym), yukicoder, LeetCode, AOJ and arbitrary URLs are recognised and get a judge badge.
- **SM-2 style scheduler** — Easy 3 d → 7 d → ~19 d → …, Hard grows slowly, Failed brings it back tomorrow and lowers ease. Each button shows the interval it will give.
- **Today** — one list across judges, overdue first, with progress and a 7-day forecast. Imports are spread at *N new per day* (default 5) so a big backlog never floods you.
- **Library & problem drawer** — filter/search everything, write a **mistake note** (shown on Today), see review history and an estimated **memory curve**, reveal tags as a spoiler-level hint.
- **Settings** — handles, pace, **demo clock** (jump +1/+3/+7 days to see reviews come due), JSON export/import, reset.
- **Optional AI hints** — *Hint 1 → Hint 2 → Approach*, revealed one at a time, only if `OPENAI_API_KEY` is set for the local server. Without it everything else works; the key never reaches the browser.

Demo handles: `chokudai` (AtCoder) and `tourist` (Codeforces) — the welcome screen has a one-click button.

## Run it locally

Requires Node 20+.

```bash
npm install
npm run dev          # http://localhost:5173/review-loop/
```

Other commands:

```bash
npm test             # unit tests (scheduler, URL parser, struggle detection)
npm run build        # type-check + production build into dist/
npm run preview      # serve the build (also serves the optional hint API)
```

### Optional: AI hints

```bash
cp .env.example .env    # then set OPENAI_API_KEY (any OpenAI-compatible endpoint via OPENAI_BASE_URL)
npm run dev
```

The `/review-loop/api/hint` endpoint is a tiny Vite dev/preview-server middleware (`server/hintPlugin.ts`). The static GitHub Pages deployment has no server, so hints show as "off" there by design.

## How it works

- **Stack:** Vite + React 19 + TypeScript, no backend, no router/state library, hand-written CSS. State is a single reducer persisted to `localStorage` (`review-loop/v1`).
- **Key files:** `src/lib/srs.ts` (scheduler), `src/lib/importers/` (AtCoder/Codeforces fetch + `struggles.ts` detection), `src/lib/urlParse.ts`, `src/lib/store.ts`, `src/components/` (views).
- **AtCoder titles:** the build step (`scripts/fetch-atcoder-meta.mjs`) snapshots problem titles/difficulties into `public/atcoder-meta.json`, because the kenkoooo CDN sometimes serves cached copies without CORS headers. The app falls back to the live files, then to IDs.
- **Deploy:** GitHub Actions runs tests + build on every push (`ci.yml`) and publishes `dist/` to GitHub Pages (`pages.yml`).
- **Planning docs** from the Devpost *Build With AI: Basics* skill pack: [`devpost/scope.md`](devpost/scope.md), [`devpost/prd.md`](devpost/prd.md), [`devpost/spec.md`](devpost/spec.md), [`devpost/checklist.md`](devpost/checklist.md), [`devpost/app-map.html`](devpost/app-map.html).

## What I learned

- **Writing scope → PRD → spec before code paid off.** Cutting accounts, scraping and auto-detecting re-solves in `scope.md` kept the build to one coherent loop that could be finished and polished.
- **"Struggle" needed a precise definition to be testable.** Counting only failures *before the first AC* and ignoring compile errors turned a fuzzy idea into a few unit tests (`tests/struggles.test.ts`).
- **Public APIs behave differently in a browser than with curl.** The AtCoder metadata files returned CORS headers to curl but were blocked in Chrome because a CDN cached a copy without them; a build-time snapshot plus fallbacks fixed it.
- **A demo clock makes a time-based product demonstrable.** Spaced repetition is invisible in a 2-minute video unless you can move time forward.
- **Optional AI should be a layer, not a dependency.** Keeping the key server-side and the no-key path first-class meant the core product never depends on an LLM.

## License

MIT
