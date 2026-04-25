import { DEFAULT_PHASES, MONTHLY_THEMES, WEEKDAYS } from "./data.js";
import { exportAllData, monthKey, todayKey } from "./storage.js";
import { escapeHtml, renderRaw, tags } from "./ui.js";

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
  return `
    <section class="panel settings-view">
      <p class="eyebrow">Data & Privacy</p>
      <p class="muted">Everything stays in this browser's localStorage unless you export it.</p>
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
    ? state.phases.find((item) => item.id === phaseId)
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
      <p class="muted">Basic fields are below. The full JSON editor exposes every property from the phase model for power-user tuning.</p>
      <label>Phase name
        <input name="phaseName" value="${escapeHtml(phase.name)}" required>
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
      <label>Full phase JSON
        <textarea name="phaseJson" style="min-height:320px">${escapeHtml(JSON.stringify(phase, null, 2))}</textarea>
      </label>
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
