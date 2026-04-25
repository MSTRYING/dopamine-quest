import {
  DEFAULT_ACHIEVEMENTS_STATE,
  DEFAULT_ANALYTICS,
  DEFAULT_CHARACTER,
  DEFAULT_PHASES,
  DEFAULT_PUZZLES,
  DEFAULT_SETTINGS,
  DEFAULT_STREAKS,
  STORAGE_KEYS,
  STORAGE_VERSION
} from "./data.js";

const DEFAULTS = {
  [STORAGE_KEYS.phases]: DEFAULT_PHASES,
  [STORAGE_KEYS.dailyLog]: {},
  [STORAGE_KEYS.gratitude]: [],
  [STORAGE_KEYS.weeklyGoals]: {},
  [STORAGE_KEYS.monthlyGoals]: {},
  [STORAGE_KEYS.settings]: DEFAULT_SETTINGS,
  [STORAGE_KEYS.streaks]: DEFAULT_STREAKS,
  [STORAGE_KEYS.achievements]: DEFAULT_ACHIEVEMENTS_STATE,
  [STORAGE_KEYS.character]: DEFAULT_CHARACTER,
  [STORAGE_KEYS.analytics]: DEFAULT_ANALYTICS,
  [STORAGE_KEYS.puzzles]: DEFAULT_PUZZLES,
  [STORAGE_KEYS.meta]: { version: STORAGE_VERSION, createdAt: "" }
};

export function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

export function todayKey(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

export function monthKey(date = new Date()) {
  return date.toISOString().slice(0, 7);
}

export function readStore(key, fallback = null) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return clone(fallback ?? DEFAULTS[key] ?? null);
    return JSON.parse(raw);
  } catch (error) {
    console.warn("Failed to read localStorage key", key, error);
    return clone(fallback ?? DEFAULTS[key] ?? null);
  }
}

export function writeStore(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
  return value;
}

export function initializeStorage() {
  Object.entries(DEFAULTS).forEach(([key, value]) => {
    if (localStorage.getItem(key) === null) {
      const next = clone(value);
      if (key === STORAGE_KEYS.meta) next.createdAt = new Date().toISOString();
      writeStore(key, next);
    }
  });
  migrateStorage();
  return loadState();
}

export function migrateStorage() {
  const meta = readStore(STORAGE_KEYS.meta, { version: 0 });
  if ((meta.version || 0) < STORAGE_VERSION) {
    meta.version = STORAGE_VERSION;
    meta.migratedAt = new Date().toISOString();
    writeStore(STORAGE_KEYS.meta, meta);
  }
}

export function loadState() {
  return {
    phases: readStore(STORAGE_KEYS.phases),
    dailyLog: readStore(STORAGE_KEYS.dailyLog),
    gratitude: readStore(STORAGE_KEYS.gratitude),
    weeklyGoals: readStore(STORAGE_KEYS.weeklyGoals),
    monthlyGoals: readStore(STORAGE_KEYS.monthlyGoals),
    settings: readStore(STORAGE_KEYS.settings),
    streaks: readStore(STORAGE_KEYS.streaks),
    achievements: readStore(STORAGE_KEYS.achievements),
    character: readStore(STORAGE_KEYS.character),
    analytics: readStore(STORAGE_KEYS.analytics),
    puzzles: readStore(STORAGE_KEYS.puzzles),
    meta: readStore(STORAGE_KEYS.meta)
  };
}

export function saveState(state) {
  writeStore(STORAGE_KEYS.phases, state.phases);
  writeStore(STORAGE_KEYS.dailyLog, state.dailyLog);
  writeStore(STORAGE_KEYS.gratitude, state.gratitude);
  writeStore(STORAGE_KEYS.weeklyGoals, state.weeklyGoals);
  writeStore(STORAGE_KEYS.monthlyGoals, state.monthlyGoals);
  writeStore(STORAGE_KEYS.settings, state.settings);
  writeStore(STORAGE_KEYS.streaks, state.streaks);
  writeStore(STORAGE_KEYS.achievements, state.achievements);
  writeStore(STORAGE_KEYS.character, state.character);
  writeStore(STORAGE_KEYS.analytics, state.analytics);
  writeStore(STORAGE_KEYS.puzzles, state.puzzles);
  writeStore(STORAGE_KEYS.meta, state.meta);
}

export function getTodayLog(state, date = todayKey()) {
  if (!state.dailyLog[date]) {
    state.dailyLog[date] = {
      date,
      completedTasks: {},
      phaseStarts: {},
      phaseCompletions: {},
      taskEvents: [],
      xpEarned: 0,
      puzzleXp: 0,
      tier: "None",
      gratitudeEntryIds: [],
      notes: {},
      perfectDayAwarded: false,
      comebackAwarded: false
    };
  }
  return state.dailyLog[date];
}

export function exportAllData() {
  const payload = {};
  Object.values(STORAGE_KEYS).forEach((key) => {
    payload[key] = readStore(key);
  });
  return JSON.stringify(payload, null, 2);
}

export function importAllData(jsonText) {
  const parsed = JSON.parse(jsonText);
  Object.values(STORAGE_KEYS).forEach((key) => {
    if (Object.prototype.hasOwnProperty.call(parsed, key)) {
      writeStore(key, parsed[key]);
    }
  });
  initializeStorage();
}

export function resetToday(state, date = todayKey()) {
  delete state.dailyLog[date];
  writeStore(STORAGE_KEYS.dailyLog, state.dailyLog);
}

export function resetCurrentMonth(state, month = monthKey()) {
  Object.keys(state.dailyLog).forEach((date) => {
    if (date.startsWith(month)) delete state.dailyLog[date];
  });
  state.monthlyGoals[month] = {};
  writeStore(STORAGE_KEYS.dailyLog, state.dailyLog);
  writeStore(STORAGE_KEYS.monthlyGoals, state.monthlyGoals);
}

export function fullReset() {
  Object.values(STORAGE_KEYS).forEach((key) => localStorage.removeItem(key));
  return initializeStorage();
}

export function downloadText(filename, text, type = "application/json") {
  const blob = new Blob([text], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 500);
}
