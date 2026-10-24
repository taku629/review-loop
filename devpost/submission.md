# Review Loop — Devpost submission

**Project name:** Review Loop

**Tagline (≤200 chars):** A cross-judge spaced-repetition coach that turns your WA and TLE history from AtCoder, Codeforces and more into one daily review queue — so you stop repeating mistakes you already paid for.

- Live demo: https://taku629.github.io/review-loop/
- Source: https://github.com/taku629/review-loop
- Demo video: [`demo/review-loop-demo.mp4`](../demo/review-loop-demo.mp4) (also attached to the [v1.0 release](https://github.com/taku629/review-loop/releases/tag/v1.0))

## Inspiration

Every competitive programmer has a graveyard of problems they *eventually* got Accepted on — after five Wrong Answers, a Time Limit Exceeded, and an hour lost to an off-by-one. We pay for those lessons, then forget them, and the same bug costs us again in the next contest. Spaced repetition is known to work for flashcards, but practice is scattered across AtCoder, Codeforces, yukicoder, LeetCode and AOJ, and no tool brings all of those mistakes back in one place at the right time.

## What it does

- **Imports your struggles automatically.** Enter an AtCoder and/or Codeforces handle; Review Loop reads your public submission history (AtCoder Problems API by kenkoooo, Codeforces `user.status`) and keeps only the problems you never solved, or solved only after WA/TLE/RE/MLE. Each one shows its story: "AC after 14 tries", `WA×10`, `TLE×3`, difficulty.
- **Adds anything else by URL.** Paste a yukicoder, LeetCode, AOJ, AtCoder, Codeforces or any other link; the judge and problem ID are detected and you can write down the bug that cost you.
- **Schedules reviews with an SM-2-style forgetting curve.** After re-solving, rate **Easy / Hard / Failed**; every button previews the next interval (e.g. Easy 3d → 7d → ~19d, Failed resets and lowers the ease).
- **One Today queue across all judges**, with links straight to the original problems, a progress bar and a 7-day forecast. Big imports are paced (default 5 new per day, interleaved across judges) so a backlog never floods you.
- **Library + problem drawer** with filters, search, schedule, review history, mistake notes and an estimated memory-retention curve.
- **Demo clock** (+1 day / +3 days / +1 week) to watch reviews come due, plus JSON backup/restore and reset.
- **Optional tiered AI hints** (Hint 1 → Hint 2 → Approach), one tier at a time, only when an `OPENAI_API_KEY` is set on the local server. Without a key the app works fully; the key never reaches the browser.
- No account and no backend: everything lives in the browser's localStorage.

## Who it's for

Student competitive programmers who practice on several judges, solve a lot of problems, and keep forgetting the mistakes they already made — especially those preparing for contests where repeating a known bug is the most expensive kind of error.

## How I built it

I started from an empty folder with the **Devpost Learn Skill Pack** (`npx skills add challengepost/learn-ai-basics --all -y`) and followed it in order:

1. **1-start** — learner profile and goals.
2. **2-scope → [`scope.md`](scope.md)** — cut the idea down to one coherent loop: import struggles → schedule → review today. Accounts, cloud sync, scraping and automatic re-solve detection were explicitly left out.
3. **3-prd → [`prd.md`](prd.md)** — the core journey, every screen, states and edge cases (API down, unknown handle, duplicates, empty queue).
4. **4-spec → [`spec.md`](spec.md)** — stack, data model, API contracts, SRS formula, file layout and deploy target.
5. **5-build** — six vertical slices from [`checklist.md`](checklist.md), each verified in the browser and committed (manual add + SM-2 + Today → AtCoder/Codeforces import → library/drawer/memory curve → settings/demo clock/backup → optional AI hints → README/CI/Pages). An [app map](app-map.html) explains how the pieces connect.
6. **6-ship** — README, CI, GitHub Pages deploy, demo video and this write-up.

Tech: Vite + React 19 + TypeScript (strict), React Context + reducer for state, localStorage persistence, hand-written CSS, inline-SVG memory curve, Vitest unit tests for the URL parser, struggle detection and scheduler, and GitHub Actions for CI and Pages. The optional hint endpoint is a tiny Vite server middleware that calls any OpenAI-compatible API server-side. The demo video was produced by scripting the live site with Playwright, with edge-tts narration and burned-in captions.

## Challenges

- **Defining a "struggle" precisely.** "Failed or solved after WA/TLE" sounds simple, but it needed exact rules to be testable: only failures *before the first AC* count, compile errors and pending verdicts are ignored, and AtCoder and Codeforces verdict names are normalized into one model.
- **Browser vs. curl.** The AtCoder metadata files returned CORS headers to curl but were blocked in Chrome because a CDN cached a copy without them. A build-time metadata snapshot (generated in CI) plus layered fallbacks fixed it.
- **Flaky public APIs.** The AtCoder Problems API sometimes times out; each judge imports independently, so one failing judge never blocks the other, and a sample set keeps the app demoable offline.
- **Making time visible.** Spaced repetition is invisible in a two-minute demo, so I added a demo clock that shifts "today" without touching any data.
- **Not flooding the user.** Importing 800+ struggles at once would make the Today list useless, so new problems are paced per day and interleaved across judges.

## What I learned

- Writing scope → PRD → spec before any code kept the build to one coherent loop that could actually be finished and polished.
- A fuzzy product idea becomes buildable once it has a precise, unit-testable definition.
- Public APIs behave differently in a browser than from the command line — test the real environment early.
- Time-based products need a way to fast-forward time to be demonstrable.
- Optional AI works best as a layer, not a dependency: the no-key path should be first-class.

## What's next

- More importers: yukicoder and AOJ submission APIs, LeetCode via user export.
- Detect re-solves automatically (a new AC after the scheduled date counts as a review).
- Contest-prep mode: prioritize problems by topic tag before a contest.
- Optional sync across devices (export to a GitHub Gist) without adding accounts.
- Weekly "mistake digest" that clusters your notes into recurring bug patterns.

## Built with

- TypeScript
- React
- Vite
- Vitest
- localStorage
- AtCoder Problems API (kenkoooo)
- Codeforces API
- OpenAI-compatible API (optional hints)
- GitHub Actions
- GitHub Pages
- Playwright + edge-tts + FFmpeg (demo video)
- Devpost Learn Skill Pack (learn-ai-basics)
