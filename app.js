import {
  addGratitude,
  activePhasesForToday,
  activeTasksForPhase,
  awardPuzzleXp,
  calculateDailyGoal,
  completePhase,
  completeTask,
  getCurrentTheme,
  getLevelInfo,
  getTier,
  maybeSwapMonthlyTheme,
  quoteOfDay,
  startPhase,
  taskKey,
  updateStreakOnOpen
} from "./game.js";
import { renderDailyProgress, renderReports } from "./analytics.js";
import {
  closeModal,
  escapeHtml,
  icon,
  applyTheme,
  panel,
  renderHud,
  renderNav,
  showModal,
  tags,
  toast,
  todayLabel
} from "./ui.js";
import {
  downloadText,
  exportAllData,
  fullReset,
  getTodayLog,
  importAllData,
  initializeStorage,
  monthKey,
  resetCurrentMonth,
  resetToday,
  saveState,
  todayKey
} from "./storage.js";
import {
  checkLogic,
  checkSudoku,
  createPuzzleSession,
  cycleLogicMark,
  drawDifferenceCanvases,
  handleDifferenceClick,
  puzzleResultFromSession,
  renderPuzzleHub,
  renderPuzzleSession,
  sudokuHint,
  updateSudokuValue
} from "./puzzles.js";
import { readSettingsForm, renderPhaseEditor, renderSettings } from "./settings.js";

const app = document.getElementById("app");

let state = initializeStorage();
let route = getRoute();
let activePhaseId = "";
let puzzleSession = null;

updateStreakOnOpen(state);
maybeSwapMonthlyTheme(state);
saveState(state);
render();

window.addEventListener("hashchange", () => {
  route = getRoute();
  render();
});

document.addEventListener("click", handleClick);
document.addEventListener("submit", handleSubmit);
document.addEventListener("input", handleInput);

function getRoute() {
  const hash = window.location.hash.replace("#", "");
  return ["today", "phase", "puzzles", "journal", "reports", "settings"].includes(hash) ? hash : "today";
}

function navigate(nextRoute) {
  window.location.hash = nextRoute;
  route = nextRoute;
  render();
}

function commit(message = "") {
  const levelBefore = state.character.lastLevel;
  const theme = getCurrentTheme(state.settings);
  applyTheme(theme);
  saveState(state);
  render();
  if (message) toast(message);
  if (state.character.lastLevel > levelBefore) {
    toast(`Level up: ${state.character.title}. The crystal council approves.`);
  }
}

function render() {
  const theme = getCurrentTheme(state.settings);
  applyTheme(theme);
  const body = {
    today: renderToday,
    phase: renderPhase,
    puzzles: renderPuzzles,
    journal: renderJournal,
    reports: () => renderReports(state),
    settings: () => renderSettings(state)
  }[route]();

  app.innerHTML = `
    <div class="phone">
      ${renderHud(state)}
      <main class="view ${route}-view">${body}</main>
      ${renderNav(route)}
    </div>
  `;

  if (puzzleSession?.type === "difference") {
    requestAnimationFrame(() => drawDifferenceCanvases(puzzleSession));
  }
}

function renderToday() {
  const log = getTodayLog(state);
  const phases = activePhasesForToday(state);
  const goal = calculateDailyGoal(state);
  const tier = getTier(log.xpEarned, goal);
  const theme = getCurrentTheme(state.settings);
  return `
    <section class="panel hero full-span">
      <p class="eyebrow">${escapeHtml(todayLabel())}</p>
      <h2>Dopamine Quest</h2>
      <p class="muted">${escapeHtml(quoteOfDay())}</p>
      ${tags([theme.name, `${tier} tier`, `${state.character.totalXp} total XP`])}
    </section>
    ${renderDailyProgress(state)}
    <section class="panel">
      <p class="eyebrow">Current Character</p>
      ${renderCharacterCard()}
    </section>
    <section class="panel full-span">
      <div class="row" style="justify-content:space-between">
        <div>
          <p class="eyebrow">Today's Quest Line</p>
          <h3>${phases.length} active phases</h3>
        </div>
        <button class="btn secondary" data-route="settings">Edit</button>
      </div>
      <div class="grid">
        ${phases.map((phase) => renderPhaseRow(phase, log)).join("")}
      </div>
    </section>
  `;
}

function renderCharacterCard() {
  const level = getLevelInfo(state.character.totalXp);
  return `
    <div class="grid">
      <div class="stat"><strong>Level ${level.level}</strong><span class="muted small">${escapeHtml(level.title)}</span></div>
      <div class="mini-track"><span class="mini-fill" style="width:${level.progress}%"></span></div>
      <p class="muted small">${level.intoLevel} / ${level.needed} XP to next level. Current streak multiplier scales gently as you keep showing up.</p>
    </div>
  `;
}

function renderPhaseRow(phase, log) {
  const tasks = activeTasksForPhase(state, phase);
  const done = tasks.filter((task) => log.completedTasks[taskKey(phase.id, task.id)]).length;
  const complete = Boolean(log.phaseCompletions[phase.id]);
  const pct = tasks.length ? Math.round((done / tasks.length) * 100) : 0;
  return `
    <button class="phase-row ${complete ? "done" : ""}" data-action="open-phase" data-id="${escapeHtml(phase.id)}" style="--phase-color:${escapeHtml(phase.color)}">
      <div class="phase-dot">${icon(phase.icon)}</div>
      <div class="phase-body">
        <strong>${escapeHtml(phase.name)}</strong>
        <span class="muted small">${done}/${tasks.length} tasks · ${escapeHtml(phase.music?.mood || "No mood")}</span>
        <div class="mini-track"><span class="mini-fill" style="width:${pct}%"></span></div>
      </div>
      <span class="tag">${complete ? "Closed" : "Open"}</span>
    </button>
  `;
}

function renderPhase() {
  const phases = activePhasesForToday(state);
  const log = getTodayLog(state);
  if (!activePhaseId || !phases.some((phase) => phase.id === activePhaseId)) {
    activePhaseId = phases.find((phase) => !log.phaseCompletions[phase.id])?.id || phases[0]?.id || "";
  }
  const phase = state.phases.find((item) => item.id === activePhaseId);
  if (!phase) {
    return panel("No active phase", `<p class="muted">There are no active phases for today. Settings can summon one.</p>`, { className: "full-span" });
  }
  const tasks = activeTasksForPhase(state, phase);
  const standardDone = tasks
    .filter((task) => task.type !== "Bonus" && task.type !== "Display")
    .every((task) => log.completedTasks[taskKey(phase.id, task.id)]);
  const playlist = phase.music?.playlist || state.settings.musicLinks[phase.music?.mood] || "";
  return `
    <section class="panel hero full-span" style="--phase-color:${escapeHtml(phase.color)}">
      <p class="eyebrow">Active Phase</p>
      <h2>${escapeHtml(phase.name)}</h2>
      <p class="muted">${escapeHtml(phase.description || phase.intro || "")}</p>
      ${tags([phase.trigger?.label, phase.music?.mood, phase.music?.bpm])}
      <div class="grid two">
        <button class="btn" data-action="start-phase" data-id="${escapeHtml(phase.id)}">Start timer</button>
        ${playlist ? `<a class="btn secondary" href="${escapeHtml(playlist)}" target="_blank" rel="noreferrer">Open Apple Music</a>` : `<button class="btn secondary" data-route="settings">Add music</button>`}
      </div>
    </section>
    <section class="panel full-span">
      <p class="eyebrow">Tasks</p>
      <div class="grid">
        ${tasks.map((task) => renderTaskRow(phase, task, log)).join("")}
      </div>
      <button class="btn full" data-action="complete-phase" data-id="${escapeHtml(phase.id)}" ${standardDone ? "" : "disabled"}>Close phase and claim bonus</button>
    </section>
  `;
}

function renderTaskRow(phase, task, log) {
  const key = taskKey(phase.id, task.id);
  const done = Boolean(log.completedTasks[key]);
  return `
    <button class="task-row ${done ? "done" : ""}" data-action="complete-task" data-phase="${escapeHtml(phase.id)}" data-task="${escapeHtml(task.id)}" style="--phase-color:${escapeHtml(phase.color)}" ${done ? "disabled" : ""}>
      <span class="check ${done ? "done" : ""}">✓</span>
      <span class="task-body">
        <strong>${escapeHtml(task.name)}</strong>
        <span class="muted small">${escapeHtml(task.type)} · ${task.duration || 0} min · ${task.xp || 0} XP ${task.bonusCondition ? `· ${escapeHtml(task.bonusCondition)}` : ""}</span>
      </span>
    </button>
  `;
}

function renderPuzzles() {
  if (puzzleSession) return renderPuzzleSession(puzzleSession);
  return renderPuzzleHub(state);
}

function renderJournal() {
  const month = monthKey();
  const weekly = state.weeklyGoals[month] || { goal: "", updates: [] };
  const monthly = state.monthlyGoals[month] || { goal: "", summary: "" };
  return `
    <section class="panel hero full-span">
      <p class="eyebrow">Journal</p>
      <h2>Evidence that you are here.</h2>
      <p class="muted">Gratitude is checked against your configured uniqueness window before XP is awarded.</p>
    </section>
    <section class="panel">
      <h3>Quick gratitude</h3>
      <form class="form-grid" data-submit="add-gratitude">
        <label>One thing I am grateful for
          <textarea name="gratitude" required></textarea>
        </label>
        <button class="btn full" type="submit">Save gratitude</button>
      </form>
    </section>
    <section class="panel">
      <h3>Goals</h3>
      <form class="form-grid" data-submit="save-goals">
        <label>Weekly goal
          <textarea name="weeklyGoal">${escapeHtml(weekly.goal || "")}</textarea>
        </label>
        <label>Monthly goal
          <textarea name="monthlyGoal">${escapeHtml(monthly.goal || "")}</textarea>
        </label>
        <button class="btn full" type="submit">Save goals</button>
      </form>
    </section>
    <section class="panel full-span">
      <div class="row" style="justify-content:space-between">
        <div>
          <p class="eyebrow">Gratitude Log</p>
          <h3>${state.gratitude.length} entries</h3>
        </div>
        <button class="btn secondary" data-action="export-journal">Export</button>
      </div>
      <div class="grid">
        ${state.gratitude.length ? state.gratitude.slice(0, 30).map((entry) => `
          <div class="setting-row">
            <div class="phase-dot" style="--phase-color:var(--accent-2)">☾</div>
            <div class="phase-body">
              <strong>${escapeHtml(entry.text)}</strong>
              <span class="muted small">${escapeHtml(entry.date)}</span>
            </div>
          </div>
        `).join("") : `<p class="muted">No entries yet. The gratitude shelf is dusted and waiting.</p>`}
      </div>
    </section>
  `;
}

function handleClick(event) {
  const routeButton = event.target.closest("[data-route]");
  if (routeButton) {
    navigate(routeButton.dataset.route);
    return;
  }

  const actionNode = event.target.closest("[data-action]");
  if (!actionNode) return;
  const action = actionNode.dataset.action;

  if (action === "close-modal") return closeModal();
  if (action === "open-phase") return openPhase(actionNode.dataset.id);
  if (action === "start-phase") return startCurrentPhase(actionNode.dataset.id);
  if (action === "complete-task") return completeTaskAction(actionNode.dataset.phase, actionNode.dataset.task);
  if (action === "complete-phase") return completePhaseAction(actionNode.dataset.id);
  if (action === "mark-month-report") return markMonthReport();
  if (action === "add-phase") return showModal(renderPhaseEditor(state));
  if (action === "edit-phase") return showModal(renderPhaseEditor(state, actionNode.dataset.id));
  if (action === "move-phase") return movePhase(actionNode.dataset.id, Number(actionNode.dataset.dir));
  if (action === "toggle-phase") return togglePhase(actionNode.dataset.id);
  if (action === "delete-phase") return deletePhase(actionNode.dataset.id);
  if (action === "set-theme") return setTheme(actionNode.dataset.id);
  if (action === "export-json") return downloadText(`dopamine-quest-${todayKey()}.json`, exportAllData());
  if (action === "export-journal") return exportJournal();
  if (action === "import-json") return showImportModal();
  if (action === "reset-today") return resetTodayAction();
  if (action === "reset-month") return resetMonthAction();
  if (action === "full-reset") return fullResetAction();
  if (action === "start-puzzle") return startPuzzle(actionNode.dataset.type, actionNode.dataset.difficulty);
  if (action === "exit-puzzle") return exitPuzzle();
  if (action === "check-sudoku") return checkSudokuAction();
  if (action === "sudoku-hint") return sudokuHintAction();
  if (action === "difference-click") return differenceClickAction(event);
  if (action === "logic-mark") return logicMark(actionNode.dataset.key);
  if (action === "logic-clear") return logicClear();
  if (action === "check-logic") return checkLogicAction();
}

function handleSubmit(event) {
  const form = event.target.closest("form[data-submit]");
  if (!form) return;
  event.preventDefault();
  const action = form.dataset.submit;
  if (action === "task-input") return submitTaskInput(form);
  if (action === "phase-end") return submitPhaseEnd(form);
  if (action === "save-settings") return saveSettings(form);
  if (action === "save-phase-json") return savePhaseJson(form);
  if (action === "add-gratitude") return addGratitudeAction(form);
  if (action === "save-goals") return saveGoals(form);
  if (action === "import-json-submit") return importJsonAction(form);
  if (action === "rate-puzzle") return ratePuzzle(form);
}

function handleInput(event) {
  if (puzzleSession?.type === "sudoku" && event.target.matches(".sudoku input")) {
    updateSudokuValue(puzzleSession, Number(event.target.dataset.index), event.target.value);
    event.target.value = puzzleSession.values[Number(event.target.dataset.index)];
  }
}

function openPhase(id) {
  activePhaseId = id;
  startPhase(state, id);
  commit("");
  navigate("phase");
}

function startCurrentPhase(id) {
  startPhase(state, id);
  commit("Timer started. The quest has noticed.");
}

function completeTaskAction(phaseId, taskId) {
  const phase = state.phases.find((item) => item.id === phaseId);
  const task = phase?.tasks.find((item) => item.id === taskId);
  if (!task) return;
  if (task.inputPrompt) {
    showModal(`
      <form class="form-grid" data-submit="task-input">
        <input type="hidden" name="phaseId" value="${escapeHtml(phaseId)}">
        <input type="hidden" name="taskId" value="${escapeHtml(taskId)}">
        <p class="eyebrow">Mandatory Input</p>
        <h3>${escapeHtml(task.name)}</h3>
        <label>${escapeHtml(task.inputPrompt)}
          <textarea name="taskInput" required></textarea>
        </label>
        <button class="btn full" type="submit">Complete task</button>
        <button class="btn secondary full" type="button" data-action="close-modal">Cancel</button>
      </form>
    `);
    return;
  }
  const result = completeTask(state, phaseId, taskId);
  commit(result.ok ? `+${result.xp} XP` : result.message);
}

function submitTaskInput(form) {
  const fd = new FormData(form);
  const result = completeTask(state, fd.get("phaseId"), fd.get("taskId"), fd.get("taskInput"));
  closeModal();
  commit(result.ok ? `+${result.xp} XP. The tiny goblin claps.` : result.message);
}

function completePhaseAction(phaseId) {
  const phase = state.phases.find((item) => item.id === phaseId);
  if (phase?.mandatoryEnd?.enabled) {
    showModal(`
      <form class="form-grid" data-submit="phase-end">
        <input type="hidden" name="phaseId" value="${escapeHtml(phaseId)}">
        <p class="eyebrow">Close Phase</p>
        <h3>${escapeHtml(phase.name)}</h3>
        <label>${escapeHtml(phase.mandatoryEnd.prompt)}
          <textarea name="endInput" required></textarea>
        </label>
        <button class="btn full" type="submit">Close phase</button>
      </form>
    `);
    return;
  }
  const result = completePhase(state, phaseId);
  commit(result.ok ? `${result.message} +${result.xp} XP bonus.` : result.message);
}

function submitPhaseEnd(form) {
  const fd = new FormData(form);
  const result = completePhase(state, fd.get("phaseId"), fd.get("endInput"));
  closeModal();
  commit(result.ok ? `${result.message} +${result.xp} XP bonus.` : result.message);
}

function markMonthReport() {
  state.settings.lastMonthReportSeen = monthKey();
  maybeSwapMonthlyTheme(state);
  commit("Month report complete. Theme calendar updated.");
}

function movePhase(id, dir) {
  const index = state.phases.findIndex((phase) => phase.id === id);
  const next = index + dir;
  if (index < 0 || next < 0 || next >= state.phases.length) return;
  const [phase] = state.phases.splice(index, 1);
  state.phases.splice(next, 0, phase);
  commit("Phase order updated.");
}

function togglePhase(id) {
  const phase = state.phases.find((item) => item.id === id);
  if (!phase) return;
  phase.active = !phase.active;
  commit(`${phase.name} is now ${phase.active ? "active" : "inactive"}.`);
}

function deletePhase(id) {
  const phase = state.phases.find((item) => item.id === id);
  if (!phase) return;
  if (!confirm(`Delete "${phase.name}"? This removes the phase config from this browser.`)) return;
  state.phases = state.phases.filter((item) => item.id !== id);
  closeModal();
  commit("Phase deleted.");
}

function setTheme(id) {
  state.settings.activeThemeId = id;
  if (!state.character.unlockedThemes.includes(id)) state.character.unlockedThemes.push(id);
  commit("Theme applied.");
}

function saveSettings(form) {
  const next = readSettingsForm(form);
  state.settings = { ...state.settings, ...next, preferredMusicPlatform: "Apple Music" };
  commit("Settings saved.");
}

function savePhaseJson(form) {
  const fd = new FormData(form);
  let phase;
  try {
    phase = JSON.parse(fd.get("phaseJson"));
  } catch (error) {
    toast("Phase JSON is not valid yet.");
    return;
  }
  phase.name = String(fd.get("phaseName") || phase.name);
  phase.icon = String(fd.get("phaseIcon") || phase.icon);
  phase.color = String(fd.get("phaseColor") || phase.color);
  phase.active = fd.get("phaseActive") === "true";
  if (!phase.id) phase.id = `phase-${Date.now()}`;
  if (!Array.isArray(phase.tasks)) phase.tasks = [];
  const existing = state.phases.findIndex((item) => item.id === fd.get("phaseId") || item.id === phase.id);
  if (existing >= 0) state.phases[existing] = phase;
  else state.phases.push(phase);
  closeModal();
  commit("Phase saved.");
}

function addGratitudeAction(form) {
  const text = new FormData(form).get("gratitude");
  const phase = state.phases.find((item) => item.id === "day-close");
  const gratitudeTask = phase?.tasks.find((task) => task.id === "log-gratitude");
  if (phase && gratitudeTask) {
    const result = completeTask(state, phase.id, gratitudeTask.id, text);
    if (!result.ok && result.message === "Already complete.") {
      const gratitude = addGratitude(state, text);
      form.reset();
      commit(gratitude.ok ? "Gratitude saved." : gratitude.message);
      return;
    }
    form.reset();
    commit(result.ok ? `Gratitude saved. +${result.xp} XP` : result.message);
    return;
  }
  toast("Day Close gratitude task is missing. Add it back in Settings.");
}

function saveGoals(form) {
  const fd = new FormData(form);
  const month = monthKey();
  state.weeklyGoals[month] = {
    ...(state.weeklyGoals[month] || {}),
    goal: String(fd.get("weeklyGoal") || ""),
    updatedAt: new Date().toISOString()
  };
  state.monthlyGoals[month] = {
    ...(state.monthlyGoals[month] || {}),
    goal: String(fd.get("monthlyGoal") || ""),
    updatedAt: new Date().toISOString()
  };
  commit("Goals saved.");
}

function exportJournal() {
  const text = state.gratitude.map((entry) => `${entry.date}: ${entry.text}`).join("\n");
  downloadText(`dopamine-quest-gratitude-${todayKey()}.txt`, text, "text/plain");
}

function showImportModal() {
  showModal(`
    <form class="form-grid" data-submit="import-json-submit">
      <p class="eyebrow">Import Backup</p>
      <h3>Restore localStorage JSON</h3>
      <p class="muted">This replaces matching Dopamine Quest keys in this browser.</p>
      <label>Backup JSON
        <textarea name="json" required style="min-height:260px"></textarea>
      </label>
      <button class="btn full" type="submit">Import backup</button>
      <button class="btn secondary full" type="button" data-action="close-modal">Cancel</button>
    </form>
  `);
}

function importJsonAction(form) {
  if (!confirm("Import this backup? It will overwrite matching Dopamine Quest data in this browser.")) return;
  try {
    importAllData(new FormData(form).get("json"));
    state = initializeStorage();
    closeModal();
    commit("Backup imported.");
  } catch (error) {
    toast("Import failed. The JSON could not be parsed.");
  }
}

function resetTodayAction() {
  if (!confirm("Reset today's local quest log? This removes today's completions and XP from the daily log.")) return;
  resetToday(state);
  state = initializeStorage();
  commit("Today reset.");
}

function resetMonthAction() {
  if (!confirm("Reset the current month? This removes this month's daily logs and monthly goal summary.")) return;
  resetCurrentMonth(state);
  state = initializeStorage();
  commit("Current month reset.");
}

function fullResetAction() {
  if (!confirm("Full reset? This clears all Dopamine Quest localStorage in this browser.")) return;
  state = fullReset();
  activePhaseId = "";
  puzzleSession = null;
  commit("Full reset complete.");
}

function startPuzzle(type, difficulty) {
  puzzleSession = createPuzzleSession(type, difficulty);
  render();
}

function exitPuzzle() {
  puzzleSession = null;
  render();
}

function checkSudokuAction() {
  if (!puzzleSession) return;
  const ok = checkSudoku(puzzleSession);
  toast(ok ? "Sudoku complete. Rating portal unlocked." : "Not quite yet. The grid goblin remains smug.");
  render();
}

function sudokuHintAction() {
  if (!puzzleSession) return;
  sudokuHint(puzzleSession);
  render();
}

function differenceClickAction(event) {
  if (!puzzleSession) return;
  const canvas = event.target.closest("[data-action='difference-click']");
  const hit = handleDifferenceClick(puzzleSession, event, canvas);
  toast(hit ? "Found one." : "Sneaky, but not that spot.");
  render();
}

function logicMark(key) {
  if (!puzzleSession) return;
  cycleLogicMark(puzzleSession, key);
  render();
}

function logicClear() {
  if (!puzzleSession) return;
  puzzleSession.marks = {};
  render();
}

function checkLogicAction() {
  if (!puzzleSession) return;
  const ok = checkLogic(puzzleSession);
  toast(ok ? "Logic grid solved. Deliciously structured." : "Not solved yet. One clue is still side-eyeing us.");
  render();
}

function ratePuzzle(form) {
  if (!puzzleSession) return;
  const result = puzzleResultFromSession(puzzleSession, new FormData(form));
  const xp = awardPuzzleXp(state, result);
  puzzleSession = null;
  commit(`Puzzle logged. +${xp} XP and one more clue about your brain.`);
  navigate("puzzles");
}
