import { ACHIEVEMENTS } from "./data.js";
import { calculateDailyGoal, getLevelInfo, getTier, getCurrentTheme } from "./game.js";
import { getTodayLog, todayKey } from "./storage.js";

export const ICONS = {
  sun: "☀",
  spark: "✦",
  focus: "◎",
  bolt: "ϟ",
  candle: "♢",
  flame: "▲",
  drop: "◌",
  moon: "☾",
  puzzle: "▦",
  report: "✧",
  settings: "⚙"
};

export function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export function icon(name) {
  return ICONS[name] || String(name || "?").slice(0, 2).toUpperCase();
}

export function renderHud(state) {
  const log = getTodayLog(state);
  const level = getLevelInfo(state.character.totalXp);
  const goal = calculateDailyGoal(state);
  const tier = getTier(log.xpEarned, goal);
  const theme = getCurrentTheme(state.settings);
  return `
    <header class="hud">
      <div class="avatar">${escapeHtml(level.level)}</div>
      <div class="hud-stack">
        <h1>${escapeHtml(level.title)}</h1>
        <p>${escapeHtml(theme.name)} · ${escapeHtml(tier)} tier · ${log.xpEarned}/${goal} daily XP</p>
        <div class="xp-track" aria-label="Level progress"><span class="xp-fill" style="width:${level.progress}%"></span></div>
      </div>
      <div class="hud-metrics">
        <strong>Lv ${level.level}</strong>
        <span>${state.streaks.current} day streak</span>
      </div>
    </header>
  `;
}

export function renderNav(route) {
  const tabs = [
    ["today", "☀", "Today"],
    ["phase", "◇", "Phase"],
    ["puzzles", "▦", "Puzzle"],
    ["journal", "☾", "Journal"],
    ["reports", "✧", "Report"],
    ["settings", "⚙", "Settings"]
  ];
  return `
    <nav class="bottom-nav" aria-label="Primary">
      ${tabs.map(([id, glyph, label]) => `
        <button class="tab ${route === id ? "active" : ""}" data-route="${id}">
          <span>${glyph}</span>
          <span>${label}</span>
        </button>
      `).join("")}
    </nav>
  `;
}

export function progress(width, className = "") {
  return `<div class="mini-track ${className}"><span class="mini-fill" style="width:${Math.max(0, Math.min(100, width))}%"></span></div>`;
}

export function button(label, action, className = "", attrs = "") {
  return `<button class="btn ${className}" data-action="${action}" ${attrs}>${label}</button>`;
}

export function panel(title, body, options = {}) {
  return `
    <section class="panel ${options.className || ""}">
      ${options.eyebrow ? `<p class="eyebrow">${escapeHtml(options.eyebrow)}</p>` : ""}
      ${title ? `<h3>${escapeHtml(title)}</h3>` : ""}
      ${body}
    </section>
  `;
}

export function tags(items) {
  return `<div class="tags">${items.filter(Boolean).map((item) => `<span class="tag">${escapeHtml(item)}</span>`).join("")}</div>`;
}

export function toast(message) {
  const root = document.getElementById("toast-root");
  const node = document.createElement("div");
  node.className = "toast";
  node.textContent = message;
  root.appendChild(node);
  setTimeout(() => node.remove(), 3600);
}

export function showModal(html) {
  const root = document.getElementById("modal-root");
  root.innerHTML = `
    <div class="modal-backdrop" data-action="close-modal">
      <section class="modal-card" role="dialog" aria-modal="true" onclick="event.stopPropagation()">
        ${html}
      </section>
    </div>
  `;
}

export function closeModal() {
  document.getElementById("modal-root").innerHTML = "";
}

export function applyTheme(theme) {
  Object.entries(theme.vars).forEach(([key, value]) => document.documentElement.style.setProperty(key, value));
  document.body.dataset.theme = theme.id;
  document.querySelector("meta[name='theme-color']")?.setAttribute("content", theme.vars["--bg-a"] || "#120817");
}

export function renderAchievements(state) {
  const unlocked = state.achievements.unlocked;
  return `
    <div class="grid">
      ${ACHIEVEMENTS.map((achievement) => {
        const got = unlocked[achievement.id];
        return `
          <div class="setting-row">
            <div class="phase-dot" style="--phase-color:${got ? "var(--accent-2)" : "rgba(255,255,255,.16)"}">${got ? "✓" : "?"}</div>
            <div class="phase-body">
              <strong>${escapeHtml(achievement.name)}</strong>
              <span class="muted small">${escapeHtml(achievement.desc)}</span>
            </div>
          </div>
        `;
      }).join("")}
    </div>
  `;
}

export function renderThemePills(themes, activeId) {
  return tags(themes.map((theme) => `${theme.id === activeId ? "Current: " : ""}${theme.name}`));
}

export function renderRaw(value) {
  return `<pre class="raw-box">${escapeHtml(JSON.stringify(value, null, 2))}</pre>`;
}

export function getInputValue(selector) {
  return document.querySelector(selector)?.value || "";
}

export function todayLabel() {
  return new Date(`${todayKey()}T12:00:00`).toLocaleDateString(undefined, {
    weekday: "long",
    month: "short",
    day: "numeric"
  });
}
