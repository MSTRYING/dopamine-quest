import { DEFAULT_PHASES, MONTHLY_THEMES, WEEKDAYS } from "./data.js";
import { exportAllData, monthKey, todayKey } from "./storage.js";
import { escapeHtml, renderRaw, tags } from "./ui.js";

const TASK_TYPES = ["Standard", "Mandatory", "Bonus", "Display", "Alternating"];
const MUSIC_MOODS = ["Uplifting", "High Energy", "Focus", "Calm", "Ambient", "Restaurant"];
const TASK_SOUNDS = ["Subtle", "Satisfying", "Epic"];

export function renderSettings(state) {
  return `
    <section class="panel hero settings-view">
      <p class="eyebrow">Settings</p>
      <h2>Configure the quest engine.</h2>
      <p class="muted">Phases are the source of truth. If you edit them here, the daily loop changes with them.</p>
    </section>
    ${renderPhaseManager(state)}
    ${renderPreferences(state)}
    ${renderThemeSettings(state)}
    ${renderDataPrivacy(state)}
  `;
}

export function renderPhaseManager(state) {
  return `
    <section class="panel settings-view">
      <div class="row" style="justify-content:space-between">
        <div>
          <p class="eyebrow">Manage Game Phases</p>
          <h3>${state.phases.length} phases</h3>
        </div>
        <button class="btn" data-action="add-phase">Add</button>
      </div>
      <div class="grid">
        ${state.phases.map((phase, index) => `
          <div class="setting-row has-actions">
            <div class="phase-dot" style="--phase-color:${escapeHtml(phase.color)}">${escapeHtml(String(index + 1))}</div>
            <div class="phase-body">
              <strong>${escapeHtml(phase.name)}</strong>
              <span class="muted small">${phase.active ? "Active" : "Inactive"} · ${escapeHtml(phase.trigger?.label || phase.trigger?.type || "Manual")} · ${phase.tasks.length} tasks</span>
            </div>
            <button class="icon-btn" data-action="move-phase" data-id="${escapeHtml(phase.id)}" data-dir="-1" aria-label="Move up">↑</button>
            <button class="icon-btn" data-action="move-phase" data-id="${escapeHtml(phase.id)}" data-dir="1" aria-label="Move down">↓</button>
            <button class="icon-btn" data-action="toggle-phase" data-id="${escapeHtml(phase.id)}" aria-label="Toggle active">${phase.active ? "●" : "○"}</button>
            <button class="icon-btn" data-action="edit-phase" data-id="${escapeHtml(phase.id)}" aria-label="Edit">✎</button>
          </div>
        `).join("")}
      </div>
    </section>
  `;
}

export function renderPreferences(state) {
  const s = state.settings;
  return `
    <section class="panel settings-view">
      <p class="eyebrow">XP & Difficulty</p>
      <form class="form-grid" data-submit="save-settings">
        <label>Daily XP goal
          <input name="dailyXpGoal" type="number" min="0" value="${escapeHtml(s.dailyXpGoal)}">
        </label>
        <label>
          Auto-calibrate daily XP goal
          <select name="autoDailyGoal">
            <option value="true" ${s.autoDailyGoal ? "selected" : ""}>Enabled</option>
            <option value="false" ${!s.autoDailyGoal ? "selected" : ""}>Disabled</option>
          </select>
        </label>
        <label>
          Streak soft reset
          <select name="streakSoftReset">
            <option value="true" ${s.streakSoftReset ? "selected" : ""}>Enabled</option>
            <option value="false" ${!s.streakSoftReset ? "selected" : ""}>Hard reset</option>
          </select>
        </label>
        <label>
          Sabbath mode
          <select name="sabbathMode">
            <option value="true" ${s.sabbathMode ? "selected" : ""}>Enabled</option>
            <option value="false" ${!s.sabbathMode ? "selected" : ""}>Disabled</option>
          </select>
        </label>
        <label>Sabbath day
          <select name="sabbathDay">
            ${WEEKDAYS.map((day, index) => `<option value="${index}" ${Number(s.sabbathDay) === index ? "selected" : ""}>${day}</option>`).join("")}
          </select>
        </label>
        <label>Gratitude uniqueness window
          <input name="gratitudeWindowDays" type="number" min="1" value="${escapeHtml(s.gratitudeWindowDays)}">
        </label>
        <label>Animations
          <select name="animations">
            <option value="true" ${s.animations ? "selected" : ""}>Enabled</option>
            <option value="false" ${!s.animations ? "selected" : ""}>Reduced</option>
          </select>
        </label>
        <label>Reward sounds
          <select name="soundEffects">
            <option value="true" ${s.soundEffects !== false ? "selected" : ""}>Enabled</option>
            <option value="false" ${s.soundEffects === false ? "selected" : ""}>Muted</option>
          </select>
        </label>
        <label>Haptics / vibration
          <select name="haptics">
            <option value="true" ${s.haptics !== false ? "selected" : ""}>Enabled</option>
            <option value="false" ${s.haptics === false ? "selected" : ""}>Off</option>
          </select>
        </label>
        <label>Backup reminder days
          <input name="backupReminderDays" type="number" min="1" value="${escapeHtml(s.backupReminderDays || 14)}">
        </label>
        <label>Apple Music - High Energy
          <input name="musicHighEnergy" value="${escapeHtml(s.musicLinks["High Energy"] || "")}" placeholder="https://music.apple.com/...">
        </label>
        <label>Apple Music - Focus
          <input name="musicFocus" value="${escapeHtml(s.musicLinks.Focus || "")}" placeholder="https://music.apple.com/...">
        </label>
        <label>Apple Music - Calm
          <input name="musicCalm" value="${escapeHtml(s.musicLinks.Calm || "")}" placeholder="https://music.apple.com/...">
        </label>
        <button class="btn full" type="submit">Save settings</button>
      </form>
    </section>
  `;
}

export function renderThemeSettings(state) {
  return `
    <section class="panel settings-view">
      <p class="eyebrow">Appearance</p>
      <h3>Monthly theme calendar</h3>
      <p class="muted">Theme auto-swap happens after you complete the month-end tarot report.</p>
      ${tags(MONTHLY_THEMES.map((theme) => `${theme.month + 1}. ${theme.name}`))}
      <div class="grid">
        ${MONTHLY_THEMES.map((theme) => `
          <button class="setting-row" data-action="set-theme" data-id="${escapeHtml(theme.id)}">
            <div class="phase-dot" style="--phase-color:${theme.palette[2]}"></div>
            <div class="phase-body">
              <strong>${escapeHtml(theme.name)}</strong>
              <span class="muted small">${escapeHtml(theme.tagline)}</span>
            </div>
          </button>
        `).join("")}
      </div>
    </section>
  `;
}

export function renderDataPrivacy(state) {
  const lastBackup = state.meta?.lastBackupAt ? new Date(state.meta.lastBackupAt) : null;
  const backupReminderDays = Number(state.settings.backupReminderDays || 14);
  const backupAgeDays = lastBackup ? Math.floor((Date.now() - lastBackup.getTime()) / 86400000) : Infinity;
  const backupCopy = Number.isFinite(backupAgeDays)
    ? `Last backup: ${lastBackup.toISOString().slice(0, 10)} (${backupAgeDays} days ago).`
    : "No backup export recorded in this browser yet.";
  return `
    <section class="panel settings-view">
      <p class="eyebrow">Data & Privacy</p>
      <p class="muted">Everything stays in this browser's localStorage unless you export it. Imports now preview what will change before you commit.</p>
      <div class="backup-reminder ${backupAgeDays >= backupReminderDays ? "due" : ""}">
        <strong>${backupAgeDays >= backupReminderDays ? "Backup reminder glowing." : "Backup rhythm healthy."}</strong>
        <span class="muted small">${escapeHtml(backupCopy)} Reminder window: every ${backupReminderDays} days.</span>
      </div>
      <div class="grid two">
        <button class="btn secondary" data-action="export-json">Export JSON</button>
        <button class="btn secondary" data-action="export-journal">Export Journal</button>
        <button class="btn secondary" data-action="import-json">Import JSON</button>
        <button class="btn danger" data-action="reset-today">Reset Today</button>
        <button class="btn danger" data-action="reset-month">Reset Month</button>
        <button class="btn danger" data-action="full-reset">Full Reset</button>
      </div>
      <details>
        <summary class="tag">View raw data</summary>
        ${renderRaw({
          today: state.dailyLog[todayKey()],
          month: state.monthlyGoals[monthKey()],
          exportedBytes: exportAllData().length
        })}
      </details>
    </section>
  `;
}

export function renderPhaseEditor(state, phaseId = "") {
  const phase = phaseId
    ? state.phases.find((item) => item.id === phaseId) || structuredClone(DEFAULT_PHASES[0])
    : {
        ...structuredClone(DEFAULT_PHASES[0]),
        id: `phase-${Date.now()}`,
        name: "New Phase",
        tasks: []
      };
  return `
    <form class="form-grid" data-submit="save-phase-json">
      <input type="hidden" name="phaseId" value="${escapeHtml(phaseId)}">
      <p class="eyebrow">Phase Builder</p>
      <h3>${phaseId ? "Edit phase" : "Add phase"}</h3>
      <p class="muted">Edit the common fields directly. The advanced JSON drawer stays available for power tuning without making every tiny change feel like defusing a bomb.</p>
      <label>Phase name
        <input name="phaseName" value="${escapeHtml(phase.name)}" required>
      </label>
      <label>Description
        <textarea name="phaseDescription">${escapeHtml(phase.description || phase.intro || "")}</textarea>
      </label>
      <label>Icon token
        <input name="phaseIcon" value="${escapeHtml(phase.icon)}" placeholder="sun, spark, focus, bolt...">
      </label>
      <label>Phase color
        <input name="phaseColor" type="color" value="${escapeHtml(phase.color || "#b890ff")}">
      </label>
      <label>Active
        <select name="phaseActive">
          <option value="true" ${phase.active ? "selected" : ""}>Active</option>
          <option value="false" ${!phase.active ? "selected" : ""}>Inactive</option>
        </select>
      </label>
      <label>Trigger label
        <input name="phaseTriggerLabel" value="${escapeHtml(phase.trigger?.label || "")}" placeholder="After work, First app open, 7:30 PM...">
      </label>
      <div class="grid two">
        <label>Music mood
          <select name="phaseMusicMood">
            ${MUSIC_MOODS.map((mood) => `<option value="${escapeHtml(mood)}" ${phase.music?.mood === mood ? "selected" : ""}>${escapeHtml(mood)}</option>`).join("")}
          </select>
        </label>
        <label>Completion bonus XP
          <input name="phaseBonus" type="number" min="0" step="1" value="${Number(phase.xp?.completionBonus || 0)}">
        </label>
      </div>
      <label>Apple Music playlist URL
        <input name="phasePlaylist" value="${escapeHtml(phase.music?.playlist || "")}" placeholder="https://music.apple.com/...">
      </label>
      <label>Closing prompt
        <input name="phaseClosingPrompt" value="${escapeHtml(phase.mandatoryEnd?.enabled ? phase.mandatoryEnd.prompt : "")}" placeholder="Optional reflection required before closing this phase">
      </label>
      <section class="task-editor" data-task-editor>
        <div class="row" style="justify-content:space-between">
          <div>
            <p class="eyebrow">Task Editor</p>
            <h4>${phase.tasks.length || 0} tasks</h4>
          </div>
          <button class="btn secondary" type="button" data-action="add-task-row">Add task</button>
        </div>
        <p class="muted small">Use Alternating plus frequency days for tasks like hair wash or exfoliation. Bonus conditions show on the task card.</p>
        <div class="task-editor-list" data-task-list>
          ${(phase.tasks || []).map((task, index) => renderTaskEditorRow(task, index)).join("")}
        </div>
      </section>
      <details class="advanced-editor">
        <summary class="tag">Advanced JSON</summary>
        <label>Full phase JSON
          <textarea name="phaseJson" class="code-textarea">${escapeHtml(JSON.stringify(phase, null, 2))}</textarea>
        </label>
      </details>
      <div class="grid two">
        <button class="btn" type="submit">Save phase</button>
        ${phaseId ? `<button class="btn danger" type="button" data-action="delete-phase" data-id="${escapeHtml(phaseId)}">Delete</button>` : ""}
      </div>
      <button class="btn secondary full" type="button" data-action="close-modal">Cancel</button>
    </form>
  `;
}

export function readSettingsForm(form) {
  const fd = new FormData(form);
  return {
    dailyXpGoal: Number(fd.get("dailyXpGoal") || 0),
    autoDailyGoal: fd.get("autoDailyGoal") === "true",
    streakSoftReset: fd.get("streakSoftReset") === "true",
    sabbathMode: fd.get("sabbathMode") === "true",
    sabbathDay: Number(fd.get("sabbathDay") || 0),
    gratitudeWindowDays: Number(fd.get("gratitudeWindowDays") || 21),
    animations: fd.get("animations") === "true",
    soundEffects: fd.get("soundEffects") !== "false",
    haptics: fd.get("haptics") !== "false",
    backupReminderDays: Math.max(1, safeNonNegativeNumber(fd.get("backupReminderDays"), 14)),
    musicLinks: {
      "High Energy": String(fd.get("musicHighEnergy") || ""),
      Focus: String(fd.get("musicFocus") || ""),
      Calm: String(fd.get("musicCalm") || ""),
      Ambient: "",
      Restaurant: "",
      Uplifting: ""
    }
  };
}

export function readPhaseForm(form) {
  const fd = new FormData(form);
  let phase = {};
  try {
    phase = JSON.parse(fd.get("phaseJson") || "{}");
  } catch (error) {
    throw new Error("Phase JSON is not valid yet.");
  }
  phase.id = phase.id || `phase-${Date.now()}`;
  phase.name = String(fd.get("phaseName") || phase.name || "New Phase").trim();
  phase.description = String(fd.get("phaseDescription") || "").trim();
  phase.icon = String(fd.get("phaseIcon") || phase.icon || "spark").trim();
  phase.color = String(fd.get("phaseColor") || phase.color || "#b890ff");
  phase.active = fd.get("phaseActive") === "true";
  phase.trigger = {
    ...(phase.trigger || {}),
    type: phase.trigger?.type || "manual",
    label: String(fd.get("phaseTriggerLabel") || phase.trigger?.label || "Manual").trim()
  };
  phase.music = {
    ...(phase.music || {}),
    mood: String(fd.get("phaseMusicMood") || phase.music?.mood || "Focus"),
    playlist: String(fd.get("phasePlaylist") || "").trim()
  };
  phase.xp = {
    ...(phase.xp || {}),
    completionBonus: safeNonNegativeNumber(fd.get("phaseBonus"), 0)
  };
  const closingPrompt = String(fd.get("phaseClosingPrompt") || "").trim();
  phase.mandatoryEnd = {
    ...(phase.mandatoryEnd || {}),
    enabled: Boolean(closingPrompt),
    prompt: closingPrompt
  };
  phase.tasks = readTaskRows(fd, phase.tasks || []);
  return phase;
}

export function renderTaskEditorRow(task = {}, index = 0) {
  const type = TASK_TYPES.includes(task.type) ? task.type : "Standard";
  const sound = TASK_SOUNDS.includes(task.sound) ? task.sound : "Subtle";
  return `
    <article class="task-edit-card" data-task-row>
      <input type="hidden" name="taskId" value="${escapeHtml(task.id || "")}">
      <div class="task-edit-head">
        <span class="tag">Task ${index + 1}</span>
        <div class="task-edit-actions">
          <button class="icon-btn" type="button" data-action="move-task-row" data-dir="-1" aria-label="Move task up">↑</button>
          <button class="icon-btn" type="button" data-action="move-task-row" data-dir="1" aria-label="Move task down">↓</button>
          <button class="icon-btn danger-lite" type="button" data-action="remove-task-row" aria-label="Remove task">×</button>
        </div>
      </div>
      <label>Task name
        <input name="taskName" value="${escapeHtml(task.name || "")}" required placeholder="Make the bed">
      </label>
      <div class="grid two">
        <label>Type
          <select name="taskType">
            ${TASK_TYPES.map((item) => `<option value="${escapeHtml(item)}" ${type === item ? "selected" : ""}>${escapeHtml(item)}</option>`).join("")}
          </select>
        </label>
        <label>Sound
          <select name="taskSound">
            ${TASK_SOUNDS.map((item) => `<option value="${escapeHtml(item)}" ${sound === item ? "selected" : ""}>${escapeHtml(item)}</option>`).join("")}
          </select>
        </label>
      </div>
      <div class="grid two">
        <label>Minutes
          <input name="taskDuration" type="number" min="0" step="1" value="${Number(task.duration || 0)}">
        </label>
        <label>XP
          <input name="taskXp" type="number" min="0" step="1" value="${Number(task.xp || 0)}">
        </label>
      </div>
      <label>Alternating frequency days
        <input name="taskFrequencyDays" type="number" min="0" step="1" value="${Number(task.frequencyDays || 0)}" placeholder="0 = every active day">
      </label>
      <label>Bonus condition / visible note
        <input name="taskBonusCondition" value="${escapeHtml(task.bonusCondition || "")}" placeholder="Every 3 days, add table decor, optional sub-steps...">
      </label>
      <label>Mandatory input prompt
        <input name="taskInputPrompt" value="${escapeHtml(task.inputPrompt || "")}" placeholder="Only required for Mandatory tasks">
      </label>
    </article>
  `;
}

export function emptyTaskEditorRow(index = 0) {
  return renderTaskEditorRow({
    id: "",
    name: "New task",
    type: "Standard",
    duration: 5,
    xp: 10,
    frequencyDays: 0,
    bonusCondition: "",
    sound: "Subtle",
    inputPrompt: ""
  }, index);
}

function readTaskRows(fd, existingTasks = []) {
  const names = typeof fd.getAll === "function" ? fd.getAll("taskName") : [];
  if (!names.length) return parseTaskLines(fd.get("phaseTasksText"), existingTasks);
  const ids = fd.getAll("taskId");
  const types = fd.getAll("taskType");
  const durations = fd.getAll("taskDuration");
  const xps = fd.getAll("taskXp");
  const frequencies = fd.getAll("taskFrequencyDays");
  const bonuses = fd.getAll("taskBonusCondition");
  const prompts = fd.getAll("taskInputPrompt");
  const sounds = fd.getAll("taskSound");
  const usedIds = new Set();
  return names
    .map((rawName, index) => {
      const name = String(rawName || "").trim();
      if (!name) return null;
      const existing = existingTasks.find((task) => task.id === ids[index])
        || existingTasks.find((task) => (task.name || "").toLowerCase() === name.toLowerCase());
      const type = TASK_TYPES.includes(types[index]) ? types[index] : "Standard";
      const id = uniqueTaskId(ids[index] || existing?.id || slugify(name) || `task-${index + 1}`, usedIds);
      const task = {
        ...(existing || {}),
        id,
        name,
        type,
        duration: safeNonNegativeNumber(durations[index], existing?.duration || 0),
        xp: safeNonNegativeNumber(xps[index], existing?.xp || 0),
        frequencyDays: safeNonNegativeNumber(frequencies[index], existing?.frequencyDays || 0),
        bonusCondition: String(bonuses[index] || "").trim(),
        sound: TASK_SOUNDS.includes(sounds[index]) ? sounds[index] : "Subtle"
      };
      const prompt = String(prompts[index] || "").trim();
      if (type === "Mandatory" && prompt) task.inputPrompt = prompt;
      else delete task.inputPrompt;
      if (type !== "Alternating" && task.frequencyDays === 0) task.frequencyDays = 0;
      return task;
    })
    .filter(Boolean);
}

function formatTaskLines(phase) {
  return (phase.tasks || [])
    .map((task) => [
      task.name || "Untitled task",
      TASK_TYPES.includes(task.type) ? task.type : "Standard",
      Number(task.duration || 0),
      Number(task.xp || 0),
      task.inputPrompt || ""
    ].join(" | ").replace(/\s+\| $/, ""))
    .join("\n");
}

function parseTaskLines(text, existingTasks = []) {
  return String(text || "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line, index) => {
      const [nameRaw, typeRaw = "Standard", durationRaw = "5", xpRaw = "10", promptRaw = ""] = line.split("|").map((part) => part.trim());
      const name = nameRaw || `Task ${index + 1}`;
      const existing = existingTasks.find((task) => (task.name || "").toLowerCase() === name.toLowerCase());
      const type = TASK_TYPES.includes(typeRaw) ? typeRaw : "Standard";
      const task = {
        ...(existing || {}),
        id: existing?.id || slugify(name) || `task-${index + 1}`,
        name,
        type,
        duration: safeNonNegativeNumber(durationRaw, existing?.duration || 0),
        xp: safeNonNegativeNumber(xpRaw, existing?.xp || 0)
      };
      const prompt = promptRaw || existing?.inputPrompt || "";
      if (type === "Mandatory" && prompt) task.inputPrompt = prompt;
      else delete task.inputPrompt;
      return task;
    });
}

function uniqueTaskId(base, usedIds) {
  const raw = String(base || "").trim();
  const clean = /^[a-z0-9-]+$/i.test(raw) ? raw : slugify(raw) || "task";
  let id = clean;
  let suffix = 2;
  while (usedIds.has(id)) {
    id = `${clean}-${suffix}`;
    suffix += 1;
  }
  usedIds.add(id);
  return id;
}

function safeNonNegativeNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? Math.max(0, number) : Math.max(0, Number(fallback) || 0);
}

function slugify(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}
