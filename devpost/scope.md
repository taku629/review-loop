---
doc: scope
status: approved
---
<!-- Interview answers come from the learner's written product brief (they asked for the skill
     interviews to be answered from it); approval is per that same instruction. -->

# Review Loop

A spaced-repetition review coach for competitive programmers that pulls your past mistakes from every judge into one daily review list.

## The Unique Kernel
**Cross-judge mistake memory.** Review Loop automatically finds the problems you *struggled* with — never solved, or solved only after WA/TLE — on AtCoder and Codeforces, lets you add anything else by URL (yukicoder, LeetCode, AOJ…), and schedules each one on a forgetting curve (SM-2 style). One "Today" list, across all judges, of the mistakes you're about to forget.

Existing tools are per-judge (AtCoder Problems, Codeforces' own history) and track *what you solved*, not *what you got wrong and are forgetting*.

## Who It's For
A student competitive programmer who practices on two or three judges (e.g. AtCoder contests on weekends, Codeforces rounds on weeknights, LeetCode for interviews). They hit a WA on a DP problem, read the editorial, get AC — and three months later make the identical mistake in a contest. Today they keep a scattered spreadsheet or nothing at all.

## The Core Loop
1. Open Review Loop → the **Today** view lists what's due across all judges.
2. Click a problem → it opens on the original judge; re-solve or re-think it (optionally read your own mistake note, or reveal a tiered hint).
3. Rate it **Easy / Hard / Failed** → the next review date moves along the forgetting curve.
4. Come back tomorrow: the list is different and short.

They return because the list is small, personal, and made of their *own* past mistakes.

## Inspiration & Identity
- Anki (SM-2 spaced repetition): https://faqs.ankiweb.net/what-spaced-repetition-algorithm.html
- AtCoder Problems by kenkoooo: https://kenkoooo.com/atcoder/
- Codeforces API: https://codeforces.com/apiHelp
- Feel: clean, focused, "dev tool" calm; judge identity visible at a glance.

## Why This Matters to the Learner
"Student competitive programmers who solve on several judges and forget past mistakes" — the learner is that user.

## What "Working" Looks Like
Enter `chokudai` (AtCoder) and `tourist` (Codeforces), press import, and see a preview of their real struggled problems with verdict counts (e.g. "WA×3, TLE×1"). Add a yukicoder problem by pasting its URL. Today shows all of them in one list with judge badges and links. Rate one "Easy" and watch it leave Today with "next review in 3 days". **The "oh, that's cool" beat:** two judges' real histories merge into one forgetting-curve schedule within seconds, no account needed.

## The POC Boundary
- Import struggles from AtCoder (AtCoder Problems API) and Codeforces (`user.status`) by handle.
- Manual add by URL for any judge, with automatic judge detection.
- SM-2-style scheduling with Easy / Hard / Failed.
- Today view across all judges, with links to the original problems.
- Per-problem mistake note.
- Local-only persistence (browser storage), no account.
- Optional tiered LLM hints (hint 1 → hint 2 → approach) only when an API key env var is set; the app works fully without it.

## Later
- More auto-importers (yukicoder, AOJ, LeetCode) via their APIs.
- Sync across devices; calendar/notification reminders.
- Tag-based weakness analytics ("you keep failing DP on trees").

## Explicitly Cut
- **Accounts / cloud sync** — not needed to prove the loop; local storage is enough for one user.
- **Scraping problem statements** — fragile and against judge ToS; we link to the original instead.
- **Auto-detecting re-solves from new submissions** — the user's own rating is the signal SM-2 needs.
