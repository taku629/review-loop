---
doc: prd
status: approved
---
<!-- Product answers come from the learner's written product brief; approval per their instruction. -->

# Review Loop — Product Requirements

A cross-judge spaced-repetition review coach for student competitive programmers who forget their past mistakes.
Source: `scope.md > The Unique Kernel`, `scope.md > Who It's For`.

## The Core Journey
1. **First visit.** The user lands on an empty **Today** view that explains what Review Loop does and offers two buttons: "Import my struggles" and "Try with demo handles (chokudai / tourist)".
2. **Import.** On **Import**, the user types an AtCoder handle and/or Codeforces handle and presses **Find struggles**. A progress line shows each judge being fetched.
3. **Preview.** A preview list shows every struggled problem found: judge badge, title, verdict chips (e.g. `WA×3 TLE×1`), and status ("Unsolved" or "AC after 4 tries"). The most recent 20 are pre-checked. The user adjusts and presses **Add N to review**.
4. **Manual add.** In the same view, the user pastes any problem URL (yukicoder, LeetCode, AOJ, …). The judge and an ID/title are detected; the user can edit the title and add a mistake note, then **Add**.
5. **Today.** Today lists every due problem across all judges in one list, overdue first. Each row: judge badge, title (links to the original problem in a new tab), struggle summary, mistake note preview, and **Easy / Hard / Failed** buttons showing the next interval ("Easy · 3d").
6. **Review.** The user opens the problem, re-solves or re-thinks it, then rates it. The row leaves Today with a toast "Next review in 3 days (Oct 27)". A progress bar shows "3 / 8 reviewed today".
7. **Come back.** Tomorrow, Today shows a different, short list. New imports are fed in at most *N new per day* (default 5) so Today never floods.

## Screens and Layout
Single-page app, top bar with logo, today's stats, and four tabs:
- **Today** — the daily review list (default).
- **Library** — every tracked problem with filters (judge, status, search) and next due date.
- **Import** — handle import with preview, and manual add by URL.
- **Settings** — handles, new-per-day limit, demo clock, export/import JSON backup, reset, AI-hint status.

Clicking a problem title area (not the link) opens a **problem drawer** on the right: link, struggle details, editable mistake note, review history, memory curve, and hints.

## Look and Feel
Assumption from the brief ("clean UI", "polished"): dark, calm developer-tool aesthetic. Near-black blue background, soft card surfaces, one indigo/violet accent for the "loop". Inter-style sans for UI, monospace for problem IDs and verdict chips. Each judge has a consistent badge color (AtCoder dark/white, Codeforces blue, yukicoder green, LeetCode amber, AOJ teal, other grey). Verdict chips colored like judges do (WA orange/red, TLE amber). Generous spacing, no clutter, keyboard-friendly. Avoid generic gradient-blob "AI app" styling.

## Features and Behavior

### Importing struggles from judges
Implements `scope.md > The POC Boundary`.
- A problem counts as a **struggle** if the user has at least one failed verdict (WA, TLE, MLE, RE, OLE, etc.; compile errors excluded) either before their first AC, or with no AC at all.
- AtCoder via AtCoder Problems API; Codeforces via `user.status`.
- [ ] Entering `chokudai` and pressing Find struggles shows a non-empty preview with titles and verdict chips.
- [ ] Entering `tourist` (Codeforces) does the same.
- [ ] Re-importing does not duplicate problems or reset their schedule; struggle stats are refreshed.
- [ ] Unknown handle → a clear inline error for that judge; the other judge still imports.

### Manual add by URL
- Recognizes AtCoder, Codeforces (contest/problemset/gym), yukicoder, LeetCode, AOJ; any other URL is accepted as "Other" with its hostname.
- [ ] Pasting `https://yukicoder.me/problems/no/3` shows badge "yukicoder" and a title "yukicoder No.3" which the user can edit.
- [ ] Pasting text that is not a URL shows "That doesn't look like a URL".
- [ ] Adding a URL already tracked shows "Already in your loop" instead of duplicating.
- [ ] Manually added problems are due today.

### Review scheduling (forgetting curve)
SM-2 style. Ratings: **Easy**, **Hard**, **Failed**.
- Failed → reset; due tomorrow; ease drops.
- Hard → short interval growth, ease drops slightly.
- Easy → longer interval growth, ease rises.
- Buttons preview the resulting interval.
- [ ] Rating a new problem Easy schedules it 3 days out; Hard 1 day; Failed 1 day.
- [ ] Repeated Easy ratings produce growing intervals (3 → 7 → ~19 days).
- [ ] The rated problem leaves Today immediately and a toast shows the new date.

### Today view
- [ ] Shows only problems due today or earlier, across all judges, overdue first (with "overdue Nd" label).
- [ ] Each title links to the original judge page in a new tab.
- [ ] Empty state when nothing is due: "All caught up" with the next due date and count.
- [ ] Shows a 7-day "coming up" forecast strip.

### Mistake notes
- [ ] The user can write/edit a note per problem in the drawer; it shows on the Today row.

### Library
- [ ] Lists all tracked problems with judge filter chips, text search, status, reviews and next due.
- [ ] A problem can be removed (with confirm).

### Tiered hints (optional AI)
- Without an API key: the drawer shows judge metadata as a free "topic" hint when available (Codeforces tags/rating, AtCoder difficulty) and states that AI hints are off and how to turn them on.
- With an API key set on the server side: buttons reveal **Hint 1 → Hint 2 → Approach** one at a time; revealed hints are saved with the problem.
- [ ] With no key, every other feature works and no error appears.
- [ ] With a key, Hint 1 appears after clicking, and Hint 2 is only available after Hint 1.

## States and Boundaries
- **First use** — Today shows a welcome card with "Import my struggles" and "Try with demo handles".
- **Loading** — import shows per-judge progress ("AtCoder: fetched 1,500 submissions…").
- **Network / API failure** — per-judge error message; offer "Load sample data" (clearly labeled sample) so the demo can continue offline.
- **Nothing due** — "All caught up" state.
- **Persistence** — everything (problems, schedule, notes, hints, settings) persists in this browser across reloads; export/import JSON for backup.
- **Demo clock** — Settings can shift "today" forward by N days, clearly labeled, to demonstrate the schedule.

## Product Decisions
- Only struggles are imported, not every AC — the brief targets "problems they failed or solved only after WA/TLE".
- Rating is Easy / Hard / Failed (three buttons), from the brief.
- AI is optional and server-side only; the app is fully useful without it (brief).
- New-per-day cap (default 5) — assumption to keep Today usable when a user imports hundreds of struggles.
- Compile errors are not counted as struggles — assumption; a CE is rarely a conceptual mistake.

## What We're Building
Import (AtCoder + Codeforces) with preview; manual add by URL; SM-2 scheduling; Today; Library; problem drawer with note, history, memory curve and hints; Settings with backup and demo clock; local persistence; optional AI hints.

## Deferred From the POC
- Accounts and cross-device sync — local storage proves the loop.
- Auto-import from yukicoder / AOJ / LeetCode — manual URL covers them now.
- Notifications — the user opens the app daily.

## Possible Later Enhancements
Weakness analytics by tag; contest-day "warm-up" set; browser extension that adds a problem from the judge page.

## Non-Goals
- Scraping or displaying problem statements (ToS, fragility).
- Judging/submitting code.
- Leaderboards or social features.

## Open Questions
None blocking.
