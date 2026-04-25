import { randomUUID } from "node:crypto";

class MemoryStorage {
  constructor() {
    this.store = new Map();
  }

  getItem(key) {
    return this.store.has(key) ? this.store.get(key) : null;
  }

  setItem(key, value) {
    this.store.set(key, String(value));
  }

  removeItem(key) {
    this.store.delete(key);
  }

  clear() {
    this.store.clear();
  }
}

globalThis.localStorage = new MemoryStorage();
if (!globalThis.crypto?.randomUUID) {
  globalThis.crypto = { randomUUID };
}

const data = await import("../data.js");
const storage = await import("../storage.js");
const game = await import("../game.js");
const settings = await import("../settings.js");

const {
  DEFAULT_ACHIEVEMENTS_STATE,
  DEFAULT_ANALYTICS,
  DEFAULT_CHARACTER,
  DEFAULT_PHASES,
  DEFAULT_PUZZLES,
  DEFAULT_SETTINGS,
  DEFAULT_STREAKS,
  STORAGE_KEYS
} = data;

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function createState(overrides = {}) {
  return {
    phases: clone(DEFAULT_PHASES),
    dailyLog: {},
    gratitude: [],
    weeklyGoals: {},
    monthlyGoals: {},
    settings: clone(DEFAULT_SETTINGS),
    streaks: clone(DEFAULT_STREAKS),
    achievements: clone(DEFAULT_ACHIEVEMENTS_STATE),
    character: clone(DEFAULT_CHARACTER),
    analytics: clone(DEFAULT_ANALYTICS),
    puzzles: clone(DEFAULT_PUZZLES),
    meta: { version: data.STORAGE_VERSION },
    ...overrides
  };
}

function testXpAndTier() {
  const state = createState({
    settings: { ...clone(DEFAULT_SETTINGS), autoDailyGoal: false, dailyXpGoal: 100 }
  });
  const phase = state.phases.find((item) => item.id === "morning-ignition");
  const task = phase.tasks.find((item) => item.type === "Mandatory") || phase.tasks[0];
  const empty = game.completeTask(state, phase.id, task.id, "");
  if (task.inputPrompt) assert(!empty.ok, "Mandatory task accepted empty input.");
  const result = game.completeTask(state, phase.id, task.id, task.inputPrompt ? "Tiny offering" : "");
  assert(result.ok, `Task did not complete: ${result.message}`);
  const log = storage.getTodayLog(state);
  assert(log.xpEarned > 0, "Task completion did not award XP.");
  assert(["None", "Bronze", "Silver", "Gold", "Platinum"].includes(log.tier), "Daily tier was not set.");
}

function testGratitudeUniqueness() {
  const state = createState();
  const first = game.addGratitude(state, "Clean water and a quiet minute", "2026-04-25");
  const duplicate = game.addGratitude(state, "clean water and a quiet minute", "2026-04-26");
  assert(first.ok, "First gratitude entry failed.");
  assert(!duplicate.ok, "Duplicate gratitude inside the uniqueness window was accepted.");
}

function testResetBehavior() {
  localStorage.clear();
  const state = storage.initializeStorage();
  storage.getTodayLog(state, "2026-04-25").xpEarned = 42;
  state.monthlyGoals["2026-04"] = { goal: "Ship the thing" };
  storage.saveState(state);
  storage.resetToday(state, "2026-04-25");
  assert(!JSON.parse(localStorage.getItem(STORAGE_KEYS.dailyLog))["2026-04-25"], "resetToday left today's log behind.");
  storage.getTodayLog(state, "2026-04-20").xpEarned = 10;
  storage.saveState(state);
  storage.resetCurrentMonth(state, "2026-04");
  const logs = JSON.parse(localStorage.getItem(STORAGE_KEYS.dailyLog));
  const goals = JSON.parse(localStorage.getItem(STORAGE_KEYS.monthlyGoals));
  assert(!Object.keys(logs).some((date) => date.startsWith("2026-04")), "resetCurrentMonth left month logs behind.");
  assert(Object.keys(goals["2026-04"] || {}).length === 0, "resetCurrentMonth did not clear the month summary.");
}

function testPhaseFormParsing() {
  const NativeFormData = globalThis.FormData;
  globalThis.FormData = class FakeFormData {
    constructor(values) {
      this.values = values;
    }

    get(key) {
      return this.values[key];
    }

    getAll(key) {
      const value = this.values[key];
      return Array.isArray(value) ? value : value === undefined ? [] : [value];
    }
  };

  try {
    const phase = settings.readPhaseForm({
      phaseJson: JSON.stringify({ id: "test-phase", tasks: [] }),
      phaseName: "Test Phase",
      phaseDescription: "Friendly editing works.",
      phaseIcon: "spark",
      phaseColor: "#abcdef",
      phaseActive: "true",
      phaseTriggerLabel: "After tea",
      phaseMusicMood: "Focus",
      phasePlaylist: "https://music.apple.com/test",
      phaseBonus: "not-a-number",
      phaseClosingPrompt: "What changed?",
      taskId: ["", ""],
      taskName: ["Write note", "Stretch"],
      taskType: ["Mandatory", "Alternating"],
      taskDuration: ["nope", "5"],
      taskXp: ["25", "nope"],
      taskFrequencyDays: ["0", "3"],
      taskBonusCondition: ["", "Every 3 days"],
      taskInputPrompt: ["What did you write?", ""],
      taskSound: ["Epic", "Satisfying"]
    });
    assert(phase.name === "Test Phase", "Phase name was not parsed.");
    assert(phase.xp.completionBonus === 0, "Invalid completion bonus did not fall back safely.");
    assert(phase.tasks.length === 2, "Task editor rows were not parsed.");
    assert(phase.tasks[0].type === "Mandatory" && phase.tasks[0].inputPrompt, "Mandatory task prompt was lost.");
    assert(phase.tasks[1].type === "Alternating" && phase.tasks[1].frequencyDays === 3, "Alternating frequency was not saved.");
    assert(phase.tasks[0].sound === "Epic" && phase.tasks[1].sound === "Satisfying", "Task sound settings were not saved.");
    assert(phase.tasks[0].duration === 0 && phase.tasks[1].xp === 0, "Invalid task numbers did not fall back safely.");
  } finally {
    globalThis.FormData = NativeFormData;
  }
}

function testPuzzleScoring() {
  const state = createState();
  state.puzzles.history = [
    { type: "sudoku", difficulty: "easy", enjoyment: 1, perceivedDifficulty: 1, xp: 30 },
    { type: "logic-grid", difficulty: "hard", enjoyment: 5, perceivedDifficulty: 4, xp: 30 },
    { type: "logic-grid", difficulty: "hard", enjoyment: 5, perceivedDifficulty: 3, xp: 30 }
  ];
  game.updatePuzzleBrainProfile(state);
  assert(state.puzzles.brainProfile.recommendedType === "logic-grid", "Puzzle profile did not prefer better-rated logic grids.");
  assert(state.puzzles.brainProfile.reason.includes("logic-grid"), "Puzzle recommendation did not explain itself.");
}

function testImportPreview() {
  const preview = storage.previewImportData(JSON.stringify({
    [STORAGE_KEYS.phases]: [{ id: "phase-a" }],
    [STORAGE_KEYS.settings]: { dailyXpGoal: 100 },
    mystery: true
  }));
  assert(preview.included.length === 2, "Import preview did not count recognized stores.");
  assert(preview.unknown.length === 1, "Import preview did not flag unknown keys.");
}

function testSettingsDefaultMerge() {
  localStorage.setItem(STORAGE_KEYS.settings, JSON.stringify({ dailyXpGoal: 123, musicLinks: { Focus: "focus-url" } }));
  const state = storage.initializeStorage();
  assert(state.settings.dailyXpGoal === 123, "Existing setting was not preserved during default merge.");
  assert(state.settings.soundEffects === true && state.settings.haptics === true, "New feedback settings were not merged into old storage.");
  assert(state.settings.musicLinks.Focus === "focus-url", "Nested music link was not preserved during default merge.");
  assert("High Energy" in state.settings.musicLinks, "Nested music defaults were not restored.");
}

const tests = [
  testXpAndTier,
  testGratitudeUniqueness,
  testResetBehavior,
  testPhaseFormParsing,
  testPuzzleScoring,
  testImportPreview,
  testSettingsDefaultMerge
];

for (const test of tests) {
  localStorage.clear();
  test();
  console.log(`PASS ${test.name}`);
}

console.log(`All ${tests.length} logic tests passed.`);
