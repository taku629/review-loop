---
doc: checklist
status: approved
---
# Build Checklist

Build mode: fast (learner asked for autonomous execution from the brief; agent ran each mechanical verification and the learner checks itself, recorded below)

## Slices

- [x] **1. Add a problem by URL, see it in Today, rate it and watch it move**
  Becomes usable: A running app where a pasted yukicoder/AtCoder/Codeforces/LeetCode/AOJ URL appears in Today with a judge badge and link; Easy/Hard/Failed reschedules it; it survives reload.
  Why now: This is the kernel's scheduling loop end to end (scaffold, URL parser, SM-2, Today, persistence) — everything later feeds into it.
  PRD ref: `prd.md > Manual add by URL`, `prd.md > Review scheduling (forgetting curve)`, `prd.md > Today view`
  Spec ref: `spec.md > Scheduler (lib/srs.ts)`, `spec.md > URL parser (lib/urlParse.ts)`, `spec.md > Store (lib/store.ts)`, `spec.md > File Structure`
  Build: Scaffold Vite+React+TS, styles per Look and Feel, store with localStorage, srs.ts, urlParse.ts, Today + ReviewRow, manual add form, unit tests.
  Verify (mechanical): `npm test` passes (srs, urlParse); `npm run build` succeeds; in the browser, add a yukicoder URL, rate Easy, confirm toast "Next review in 3 days" and that it persists after reload.
  Learner check: Open the app, paste https://yukicoder.me/problems/no/3, rate it Easy, reload — it's gone from Today and listed for 3 days later.
  Commit: `Add manual problems, SM-2 scheduling and Today view`

- [x] **2. Import struggles from AtCoder and Codeforces with a preview**
  Becomes usable: Typing `chokudai` / `tourist` fetches real histories, previews struggled problems with verdict chips, and adds the chosen ones to the schedule (≤ N new per day).
  Why now: The cross-judge import is the riskiest external dependency and the unique kernel.
  PRD ref: `prd.md > Importing struggles from judges`, `prd.md > The Core Journey` (steps 2–3)
  Spec ref: `spec.md > Importers (lib/importers/atcoder.ts, codeforces.ts, struggles.ts)`, `spec.md > External Services and Dependencies`, `spec.md > Import view (components/ImportView.tsx)`
  Build: Importers, struggle detection with tests, Import view with progress, errors, preview checkboxes, sample-data fallback, queueNew.
  Verify (mechanical): `npm test` (struggles fixtures) passes; in the browser import chokudai + tourist, preview non-empty, add 20, Today shows ≤ 5 new today plus manual ones; re-import does not duplicate.
  Learner check: Import with the demo handles and look at the preview — do the verdict chips match what you'd expect?
  Commit: `Import AtCoder and Codeforces struggles with preview`

- [x] **3. Library and problem drawer with mistake notes, history and memory curve**
  Becomes usable: Browse/filter everything tracked; open a problem to write a mistake note (shown on Today), see review history and a forgetting-curve chart.
  Why now: Turns a list into a coherent product and makes the forgetting curve visible.
  PRD ref: `prd.md > Library`, `prd.md > Mistake notes`, `prd.md > Screens and Layout`
  Spec ref: `spec.md > Library view (components/LibraryView.tsx)`, `spec.md > Problem drawer (components/ProblemDrawer.tsx, MemoryCurve.tsx, HintPanel.tsx)`
  Build: LibraryView with filters/search/remove, ProblemDrawer, MemoryCurve SVG, note editing.
  Verify (mechanical): build + tests pass; in the browser filter by judge, open drawer, edit note, see it on Today row after reload.
  Learner check: Open a Codeforces problem, write "forgot overflow", and see it on its Today row.
  Commit: `Add library, problem drawer, notes and memory curve`

- [x] **4. Settings, demo clock, backup and polished states**
  Becomes usable: New-per-day, demo clock (+N days), export/import JSON, reset; welcome, caught-up and forecast states.
  Why now: Makes the schedule demonstrable over time and the first-run experience complete.
  PRD ref: `prd.md > States and Boundaries`, `prd.md > Today view`
  Spec ref: `spec.md > Settings (components/SettingsView.tsx)`, `spec.md > Dates (lib/dates.ts)`
  Build: SettingsView, clock offset wiring, export/import, forecast strip, empty states, demo-handles button.
  Verify (mechanical): build + tests pass; set demo clock +3 and see the Easy-rated problem due again; export then import round-trips.
  Learner check: Move the demo clock 3 days ahead and watch yesterday's Easy problem come back.
  Commit: `Add settings, demo clock, backup and empty states`

- [x] **5. Optional tiered hints**
  Becomes usable: Metadata topic hint always; with `OPENAI_API_KEY`, Hint 1 → Hint 2 → Approach revealed one at a time and saved.
  Why now: Optional layer on top of a complete loop; must never break the no-key path.
  PRD ref: `prd.md > Tiered hints (optional AI)`
  Spec ref: `spec.md > Hint endpoint (server/hintApi.ts)`, `spec.md > Problem drawer (components/ProblemDrawer.tsx, MemoryCurve.tsx, HintPanel.tsx)`
  Build: Vite plugin endpoint, hintsClient, HintPanel.
  Verify (mechanical): without key `/api/hint/status` → disabled and UI shows "AI hints are off"; with a local mock OpenAI-compatible server, Hint 1 then Hint 2 appear in order.
  Learner check: Open a problem with and without a key set and compare the hint panel.
  Commit: `Add optional tiered AI hints`

- [x] **6. Ship: README, CI and GitHub Pages deploy**
  Becomes usable: Public repo with README (what/who/how/What I learned), CI running tests+build, live site on GitHub Pages.
  Why now: Required submission artifacts.
  PRD ref: `prd.md > What We're Building`
  Spec ref: `spec.md > Where It Runs and How Someone Tries It`
  Build: README, .env.example, workflows, push, enable Pages.
  Verify (mechanical): CI green; live URL loads and imports chokudai/tourist.
  Learner check: Open the live URL on your phone/laptop and run the demo handles.
  Commit: `Add README, CI and Pages deploy`

## Hands-on Checkpoints

- [x] Early usable behavior explored — after slice 2 (import + Today): agent-driven browser run imported chokudai (231 struggles) + tourist (572); found AtCoder metadata CORS failure and Today showing only Codeforces → fixed (snapshot fallback, judge interleaving).
- [x] Final kick-the-tires exploration and feedback completed (agent-run, autonomous mode): Today/rate/reload, import, library filters/search, drawer note, demo clock +3d, export→reset→import round-trip, invalid backup error, hints off + mock-LLM hints on, 390px mobile layout.

## Final Review

- [x] Final review complete — feedback resolved; learner asked for autonomous build-and-ship from the brief

## Code Tour and App Map

- [x] Learning activity complete — guided route, focused alternative, prior practice connected, or brief recap
- [x] Optional edit and transfer reflection addressed — offered/declined/already covered/not applicable as appropriate
- [x] `devpost/app-map.html` generated from finished code, checked, and shown, including a project-grounded practice to reuse

Activity and evidence: brief evidence-based recap (autonomous mode, no interactive tour) — the CORS finding in Build-time Notes of spec.md and its fix in `src/lib/importers/atcoder.ts` `loadMeta`.
Route and stops: reference route in app-map.html (not toured interactively): ReviewRow rate → store reducer `review` → `srs.ts` `review`.
Edit outcome: not applicable (autonomous build).
Reflection: not offered (autonomous build).
Activity mode: recap

## Revisions

- Slices 3–5 landed in one commit; slice 5 endpoint is `server/hintPlugin.ts` (spec said `hintApi.ts`), client is `src/lib/hints.ts`.
- Added build-time AtCoder metadata snapshot after the browser CORS failure (see spec Build-time Notes).
- Import preselects and queues problems round-robin across judges so day one mixes AtCoder and Codeforces.
