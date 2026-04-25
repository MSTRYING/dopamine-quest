import { ACHIEVEMENTS, LEVEL_TITLES, MONTHLY_THEMES, QUOTES } from "./data.js";
import { getTodayLog, monthKey, todayKey } from "./storage.js";

export function getLevelInfo(totalXp) {
  let level = 1;
  let currentThreshold = 0;
  let nextThreshold = 100;
  while (totalXp >= nextThreshold) {
    level += 1;
    currentThreshold = nextThreshold;
    nextThreshold += Math.round(100 * Math.pow(1.3, level - 1));
  }
  const title = getTitleForLevel(level);
  return {
    level,
    title,
    currentThreshold,
    nextThreshold,
    intoLevel: totalXp - currentThreshold,
    needed: nextThreshold - currentThreshold,
    progress: Math.min(100, Math.round(((totalXp - currentThreshold) / (nextThreshold - currentThreshold)) * 100))
  };
}

export function getTitleForLevel(level) {
  return LEVEL_TITLES.reduce((best, item) => (level >= item.level ? item : best), LEVEL_TITLES[0]).title;
}

export function getTarotForLevel(level) {
  return LEVEL_TITLES.reduce((best, item) => (level >= item.level ? item : best), LEVEL_TITLES[0]);
}

export function getCurrentTheme(settings, date = new Date()) {
  const byId = MONTHLY_THEMES.find((theme) => theme.id === settings.activeThemeId);
  return byId || MONTHLY_THEMES[date.getMonth()] || MONTHLY_THEMES[0];
}

export function maybeSwapMonthlyTheme(state, date = new Date()) {
  const currentMonth = monthKey(date);
  const reportSeen = state.settings.lastMonthReportSeen === currentMonth;
  if (reportSeen && state.settings.lastThemeSwapMonth !== currentMonth) {
    const theme = MONTHLY_THEMES[date.getMonth()];
    state.settings.activeThemeId = theme.id;
    state.settings.lastThemeSwapMonth = currentMonth;
    if (!state.character.unlockedThemes.includes(theme.id)) {
      state.character.unlockedThemes.push(theme.id);
    }
  }
}

export function quoteOfDay(date = new Date()) {
  const seed = Number(date.toISOString().slice(0, 10).replaceAll("-", ""));
  return QUOTES[seed % QUOTES.length];
}

export function activePhasesForToday(state, date = new Date()) {
  const day = date.getDay();
  return state.phases.filter((phase) => phase.active && phase.days.includes(day));
}

export function activeTasksForPhase(state, phase, date = new Date()) {
  const day = date.getDay();
  const log = getTodayLog(state, todayKey(date));
  return phase.tasks.filter((task) => {
    if (task.days && !task.days.includes(day)) return false;
    if (task.type !== "Alternating" || !task.frequencyDays) return true;
    const last = findLastTaskCompletion(state, phase.id, task.id, todayKey(date));
    if (!last) return true;
    const elapsed = daysBetween(last, todayKey(date));
    const key = taskKey(phase.id, task.id);
    return elapsed >= task.frequencyDays || Boolean(log.completedTasks[key]);
  });
}

export function taskKey(phaseId, taskId) {
  return `${phaseId}:${taskId}`;
}

export function findLastTaskCompletion(state, phaseId, taskId, beforeDate) {
  const key = taskKey(phaseId, taskId);
  return Object.keys(state.dailyLog)
    .filter((date) => date < beforeDate && state.dailyLog[date]?.completedTasks?.[key])
    .sort()
    .pop();
}

export function daysBetween(a, b) {
  const one = new Date(`${a}T00:00:00`);
  const two = new Date(`${b}T00:00:00`);
  return Math.round((two - one) / 86400000);
}

export function calculateDailyGoal(state) {
  if (!state.settings.autoDailyGoal && Number(state.settings.dailyXpGoal) > 0) {
    return Number(state.settings.dailyXpGoal);
  }
  const base = activePhasesForToday(state).reduce((sum, phase) => {
    const taskXp = activeTasksForPhase(state, phase).reduce((taskSum, task) => taskSum + Number(task.xp || 0), 0);
    return sum + taskXp + Number(phase.xp?.completionBonus || 0);
  }, 0);
  return Math.max(250, Math.round(base * 0.78));
}

export function getTier(xp, goal) {
  const ratio = goal > 0 ? xp / goal : 0;
  if (ratio >= 1.25) return "Platinum";
  if (ratio >= 1) return "Gold";
  if (ratio >= 0.75) return "Silver";
  if (ratio >= 0.5) return "Bronze";
  return "None";
}

export function tierDifficulty(tier) {
  return {
    Bronze: "easy",
    Silver: "medium",
    Gold: "hard",
    Platinum: "expert",
    None: "easy"
  }[tier] || "easy";
}

export function streakMultiplier(streak) {
  if (streak >= 30) return 2;
  if (streak >= 14) return 1.5;
  if (streak >= 7) return 1.25;
  if (streak >= 3) return 1.1;
  return 1;
}

export function hotStreakMultiplier(log) {
  const recent = [...log.taskEvents].slice(-3);
  if (recent.length < 3) return 1;
  const now = Date.now();
  const allRecent = recent.every((event) => now - new Date(event.at).getTime() < 20 * 60 * 1000);
  return allRecent ? 1.2 : 1;
}

export function startPhase(state, phaseId, date = todayKey()) {
  const log = getTodayLog(state, date);
  if (!log.phaseStarts[phaseId]) log.phaseStarts[phaseId] = new Date().toISOString();
}

export function completeTask(state, phaseId, taskId, input = "", date = todayKey()) {
  const phase = state.phases.find((item) => item.id === phaseId);
  const task = phase?.tasks.find((item) => item.id === taskId);
  if (!phase || !task) return { ok: false, message: "Task not found." };
  const log = getTodayLog(state, date);
  const key = taskKey(phaseId, taskId);
  if (log.completedTasks[key]) return { ok: false, message: "Already complete." };
  if (task.type === "Mandatory" && task.inputPrompt && !String(input).trim()) {
    return { ok: false, message: "This quest needs a tiny offering of words first." };
  }
  if (task.id === "log-gratitude") {
    const gratitude = addGratitude(state, input, date);
    if (!gratitude.ok) return gratitude;
    log.gratitudeEntryIds.push(gratitude.entry.id);
  }
  const multiplier = streakMultiplier(state.streaks.current) * hotStreakMultiplier(log);
  const xp = Math.round(Number(task.xp || 0) * multiplier);
  log.completedTasks[key] = {
    phaseId,
    taskId,
    name: task.name,
    input,
    baseXp: Number(task.xp || 0),
    xp,
    at: new Date().toISOString(),
    multiplier
  };
  log.taskEvents.push({ phaseId, taskId, name: task.name, xp, at: new Date().toISOString() });
  awardXp(state, xp, date);
  updateAnalyticsForTask(state, phase, task, date, xp);
  unlockAchievements(state, { type: "task", phaseId, taskId, date });
  return { ok: true, xp, levelInfo: getLevelInfo(state.character.totalXp) };
}

export function completePhase(state, phaseId, endInput = "", date = todayKey()) {
  const phase = state.phases.find((item) => item.id === phaseId);
  if (!phase) return { ok: false, message: "Phase not found." };
  const log = getTodayLog(state, date);
  const tasks = activeTasksForPhase(state, phase).filter((task) => task.type !== "Bonus" && task.type !== "Display");
  const missing = tasks.filter((task) => !log.completedTasks[taskKey(phase.id, task.id)]);
  if (missing.length) return { ok: false, message: `Still open: ${missing.map((task) => task.name).join(", ")}` };
  if (phase.mandatoryEnd?.enabled && !String(endInput).trim()) {
    return { ok: false, message: "This phase needs its closing note first." };
  }
  if (log.phaseCompletions[phaseId]) return { ok: false, message: "Phase already closed." };

  let bonus = Number(phase.xp?.completionBonus || 0);
  const startedAt = log.phaseStarts[phaseId] ? new Date(log.phaseStarts[phaseId]).getTime() : Date.now();
  const elapsedMinutes = Math.max(0, Math.round((Date.now() - startedAt) / 60000));
  const targetMinutes = activeTasksForPhase(state, phase).reduce((sum, task) => sum + Number(task.duration || 0), 0);
  if (phase.xp?.speedBonus && elapsedMinutes <= targetMinutes) bonus += Number(phase.xp.speedBonus || 0);
  if (phase.xp?.streakBonus) bonus = Math.round(bonus * 1.2);
  log.phaseCompletions[phaseId] = {
    phaseId,
    name: phase.name,
    at: new Date().toISOString(),
    bonus,
    elapsedMinutes,
    endInput
  };
  if (bonus > 0) awardXp(state, bonus, date);
  updateAnalyticsForPhase(state, phase, date, bonus);
  unlockAchievements(state, { type: "phase", phaseId, date });
  maybeAwardPerfectDay(state, date);
  return { ok: true, xp: bonus, message: `${phase.name} complete.` };
}

export function awardPuzzleXp(state, puzzleResult, date = todayKey()) {
  const log = getTodayLog(state, date);
  const xp = Number(puzzleResult.xp || state.settings.puzzleXpBonus || 30);
  log.puzzleXp += xp;
  state.puzzles.history.push({ ...puzzleResult, xp, date, at: new Date().toISOString() });
  updatePuzzleBrainProfile(state);
  awardXp(state, xp, date);
  return xp;
}

export function awardXp(state, xp, date = todayKey()) {
  const amount = Math.max(0, Math.round(Number(xp || 0)));
  if (!amount) return;
  const log = getTodayLog(state, date);
  const before = getLevelInfo(state.character.totalXp);
  log.xpEarned += amount;
  state.analytics.xpByDate[date] = (state.analytics.xpByDate[date] || 0) + amount;
  state.character.totalXp += amount;
  const after = getLevelInfo(state.character.totalXp);
  state.character.level = after.level;
  state.character.title = after.title;
  if (after.level > before.level) {
    state.character.lastLevel = after.level;
    state.character.titleHistory.push({ level: after.level, title: after.title, at: new Date().toISOString() });
    if (after.level % 5 === 0) {
      const badge = `Level ${after.level}: ${after.title}`;
      state.achievements.badges.push({ id: `level-${after.level}`, name: badge, at: new Date().toISOString() });
    }
  }
  const goal = calculateDailyGoal(state);
  log.tier = getTier(log.xpEarned, goal);
  state.streaks.tierHistory[date] = log.tier;
}

export function updateStreakOnOpen(state, date = todayKey()) {
  const last = state.streaks.lastActiveDate;
  if (last === date) return;
  const yesterday = dateFromOffset(date, -1);
  const isSabbath = new Date(`${date}T00:00:00`).getDay() === Number(state.settings.sabbathDay);
  if (!last) {
    state.streaks.current = 1;
  } else if (last === yesterday || (state.settings.sabbathMode && isSabbath)) {
    state.streaks.current += 1;
  } else {
    if (state.settings.streakSoftReset) {
      state.streaks.current = Math.max(1, Math.floor(state.streaks.current / 2));
      state.streaks.softResetDrops += 1;
      const log = getTodayLog(state, date);
      if (!log.comebackAwarded) {
        log.comebackAwarded = true;
        awardXp(state, 50, date);
      }
    } else {
      state.streaks.current = 1;
    }
  }
  state.streaks.longest = Math.max(state.streaks.longest, state.streaks.current);
  state.streaks.lastActiveDate = date;
}

export function dateFromOffset(date, offset) {
  const d = new Date(`${date}T00:00:00`);
  d.setDate(d.getDate() + offset);
  return todayKey(d);
}

export function maybeAwardPerfectDay(state, date = todayKey()) {
  const log = getTodayLog(state, date);
  if (log.perfectDayAwarded) return false;
  const phases = activePhasesForToday(state, new Date(`${date}T12:00:00`));
  const allDone = phases.length > 0 && phases.every((phase) => log.phaseCompletions[phase.id]);
  if (allDone) {
    log.perfectDayAwarded = true;
    state.streaks.perfectDays += 1;
    awardXp(state, 200, date);
    return true;
  }
  return false;
}

export function addGratitude(state, text, date = todayKey()) {
  const clean = String(text || "").trim();
  if (!clean) return { ok: false, message: "Gratitude cannot be empty." };
  const windowDays = Number(state.settings.gratitudeWindowDays || 21);
  const duplicate = state.gratitude.find((entry) => {
    const age = daysBetween(entry.date, date);
    return age >= 0 && age <= windowDays && entry.text.toLowerCase() === clean.toLowerCase();
  });
  if (duplicate) return { ok: false, message: `That gratitude is already glowing in the last ${windowDays} days.` };
  const entry = { id: crypto.randomUUID(), text: clean, date, at: new Date().toISOString() };
  state.gratitude.unshift(entry);
  return { ok: true, entry };
}

export function updateAnalyticsForTask(state, phase, task, date, xp) {
  const key = taskKey(phase.id, task.id);
  const stat = state.analytics.taskStats[key] || {
    phaseId: phase.id,
    taskId: task.id,
    name: task.name,
    completed: 0,
    skipped: 0,
    totalXp: 0,
    timestamps: []
  };
  stat.completed += 1;
  stat.totalXp += xp;
  stat.timestamps.push(new Date().toISOString());
  state.analytics.taskStats[key] = stat;
  const hour = new Date().getHours();
  state.analytics.completionHeatmap[hour] = (state.analytics.completionHeatmap[hour] || 0) + 1;
  state.analytics.xpByDate[date] = state.analytics.xpByDate[date] || 0;
}

export function updateAnalyticsForPhase(state, phase, date, xp) {
  const stat = state.analytics.phaseStats[phase.id] || { name: phase.name, completed: 0, totalXp: 0, dates: [] };
  stat.completed += 1;
  stat.totalXp += xp;
  stat.dates.push(date);
  state.analytics.phaseStats[phase.id] = stat;
}

export function unlockAchievements(state, context) {
  const unlocked = state.achievements.unlocked;
  const counters = state.achievements.counters;
  if (context.type === "task" && !unlocked["first-step"]) unlock(state, "first-step");
  if (context.phaseId === "dinner-mode" && context.type === "phase") {
    counters.dinner = (counters.dinner || 0) + 1;
    if (counters.dinner >= 20) unlock(state, "the-chef");
  }
  if (context.phaseId === "workout" && context.type === "phase") {
    counters.workouts = (counters.workouts || 0) + 1;
    if (counters.workouts >= 20) unlock(state, "sweat-equity");
  }
  if (state.streaks.current >= 30) unlock(state, "iron-will");
  if (state.gratitude.length >= 30) unlock(state, "grateful-soul");
}

export function unlock(state, achievementId) {
  if (state.achievements.unlocked[achievementId]) return;
  const achievement = ACHIEVEMENTS.find((item) => item.id === achievementId);
  state.achievements.unlocked[achievementId] = {
    id: achievementId,
    name: achievement?.name || achievementId,
    desc: achievement?.desc || "",
    at: new Date().toISOString()
  };
}

export function updatePuzzleBrainProfile(state) {
  const history = state.puzzles.history;
  const profile = {
    favoriteTypes: {},
    averageEnjoyment: {},
    averageDifficulty: {},
    recommendedType: "logic-grid",
    recommendedDifficulty: "hard"
  };
  history.forEach((item) => {
    const type = item.type;
    profile.favoriteTypes[type] = (profile.favoriteTypes[type] || 0) + 1;
    profile.averageEnjoyment[type] = profile.averageEnjoyment[type] || [];
    profile.averageDifficulty[type] = profile.averageDifficulty[type] || [];
    profile.averageEnjoyment[type].push(Number(item.enjoyment || 3));
    profile.averageDifficulty[type].push(Number(item.perceivedDifficulty || 3));
  });
  Object.keys(profile.averageEnjoyment).forEach((type) => {
    const enjoyment = avg(profile.averageEnjoyment[type]);
    const difficulty = avg(profile.averageDifficulty[type]);
    profile.averageEnjoyment[type] = enjoyment;
    profile.averageDifficulty[type] = difficulty;
  });
  const best = Object.keys(profile.averageEnjoyment).sort((a, b) => profile.averageEnjoyment[b] - profile.averageEnjoyment[a])[0];
  if (best) profile.recommendedType = best;
  const diff = profile.averageDifficulty[profile.recommendedType] || 4;
  profile.recommendedDifficulty = diff < 3 ? "medium" : diff > 4.2 ? "expert" : "hard";
  state.puzzles.brainProfile = profile;
}

function avg(values) {
  if (!values.length) return 0;
  return Math.round((values.reduce((sum, value) => sum + value, 0) / values.length) * 10) / 10;
}
