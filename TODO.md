# Dopamine Quest TODO

This checklist is the live build tracker for the static GitHub Pages app.

## Chunk 1: Scaffold, Foundation, Storage

- [x] Create `index.html` app shell.
- [x] Add `data.js` with defaults, themes, achievements, quotes, and puzzle templates.
- [x] Add `storage.js` with localStorage initialization, migrations, import/export, and reset helpers.
- [x] Add `game.js` with XP, levels, streaks, achievements, phase completion, and puzzle XP helpers.
- [x] Add `styles.css` visual system.
- [x] Add app routing and bootstrapping.

## Chunk 2: Core Quest Engine UI

- [x] Render Today, Active Phase, and dynamic phase/task UI from `dq_phases`.
- [x] Implement task completion, mandatory inputs, timers, phase bonuses, speed bonuses, and day close.
- [x] Show HUD with level, XP bar, streak, daily tier, and active theme.

## Chunk 3: Settings And Phase Builder

- [x] Build Settings screens for phase management.
- [x] Add phase add/edit/delete/reorder/toggle tools.
- [x] Add XP, music, gratitude, accessibility, and data/privacy tools.

## Chunk 4: Journal, Reports, Themes

- [x] Add gratitude journal and uniqueness validation UI.
- [x] Add weekly/monthly goals.
- [x] Add Brain Report cards.
- [x] Add month-end tarot Hall of Fame screen.
- [x] Apply the confirmed monthly theme calendar.

## Chunk 5: Puzzles And Brain Profile

- [x] Add puzzle hub with tier-based unlocks.
- [x] Implement Sudoku.
- [x] Implement canvas find-the-difference.
- [x] Implement scheduling/logic-grid puzzle.
- [x] Add post-puzzle ratings and recommendations.

## Chunk 6: Polish And QA

- [x] Mobile polish and reduced-motion support.
- [x] Narrow-screen responsive pass for HUD, bottom nav, phase/settings rows, Sudoku, canvas puzzles, and logic-grid tables.
- [x] Static JavaScript syntax checks.
- [x] Module import checks for non-DOM modules.
- [x] CSS brace-balance check.
- [x] Local static server smoke test for `index.html`.
- [x] Local static server check for responsive stylesheet.
- [x] Added GitHub Pages/mobile readiness files: `README.md`, `.nojekyll`, `manifest.webmanifest`, and `assets/icon.svg`.
- [x] Validated manifest JSON and static serving for app, CSS, JS, manifest, and icon.
- [x] Added dependency-free Chrome/Edge mobile smoke test in `tools/mobile-smoke.mjs`.
- [x] Ran local mobile smoke test at 390x844 with Today, Phase, Puzzles, Journal, Reports, Settings, Sudoku, find-the-difference, logic-grid, goals, gratitude, settings, import, and month report flows.
- [x] Fixed modal click handling so Cancel/Delete/action buttons inside modals work while backdrop clicks still close the modal.
- [x] Locked puzzle games behind daily reward tier: games now unlock only after Bronze or better is earned.
- [x] Updated mobile smoke test to verify puzzle reward locking before earning XP, then earn Bronze before puzzle simulation.
- [x] Final TODO update.
- [x] Browser smoke test on local static server.
- [ ] Mobile device test after GitHub Pages upload.
- [ ] Verify import/export restore in browser.
- [ ] Verify refresh persistence in browser.
- [ ] Verify GitHub Pages static hosting after upload.
