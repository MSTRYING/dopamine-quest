# Dopamine Quest

Dopamine Quest is a mobile-first, localStorage-powered ADHD life gamification app. It runs as a static GitHub Pages site with no backend, no framework, no build step, and no external dependencies.

## Run Locally

Because the app uses JavaScript modules, open it through a local static server instead of double-clicking `index.html`.

```powershell
cd "C:\Users\migsl\OneDrive\Documents\VS\ADHD Codex"
python -m http.server 8080
```

Then open:

```text
http://localhost:8080
```

## Mobile Smoke Test

If Chrome or Edge is installed, run the dependency-free mobile smoke test:

```powershell
node tools/mobile-smoke.mjs
```

To test the live GitHub Pages version:

```powershell
node tools/mobile-smoke.mjs https://mstrying.github.io/dopamine-quest/
```

## Upload To GitHub Pages

1. Upload all files in this folder to a GitHub repository.
2. In GitHub, go to `Settings` -> `Pages`.
3. Set the source to the repository branch and root folder.
4. Open the generated GitHub Pages URL on your phone.
5. Optional on mobile: use the browser share menu and choose `Add to Home Screen`.

## Included

- Dynamic quest phases, tasks, timers, XP, levels, streaks, achievements, and daily tiers.
- Settings with phase add/edit/delete/reorder/toggle, music links, XP preferences, resets, import/export, and raw data view.
- Gratitude journal, weekly/monthly goals, Brain Report, month-end tarot card, and seasonal themes.
- Sudoku, find-the-difference, and logic-grid puzzles with difficulty/enjoyment ratings.

## Data

All progress is stored in the browser using `localStorage`. Export JSON from Settings before clearing browser data or switching devices.
