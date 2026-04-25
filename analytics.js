import { MONTHLY_THEMES } from "./data.js";
import { calculateDailyGoal, getLevelInfo, getTarotForLevel } from "./game.js";
import { monthKey, todayKey } from "./storage.js";
import { escapeHtml, panel, progress, renderAchievements, renderRaw, tags } from "./ui.js";

export function buildBrainInsights(state) {
  const insights = [];
  const today = todayKey();
  const goal = calculateDailyGoal(state);
  const todayXp = state.dailyLog[today]?.xpEarned || 0;
  const percent = goal ? Math.round((todayXp / goal) * 100) : 0;
  insights.push({
    title: "Daily Voltage",
    body: `Today is at ${percent}% of goal. ${percent >= 100 ? "Your reward circuitry is wearing a little cape." : "The next tiny quest will move the bar more than your brain thinks."}`
  });

  const taskStats = Object.values(state.analytics.taskStats || {});
  const topTask = [...taskStats].sort((a, b) => b.completed - a.completed)[0];
  if (topTask) {
    insights.push({
      title: "Reliable Spell",
      body: `${topTask.name} is currently your most repeated task. Keep its XP honest; reliable tasks deserve respect, not invisibility.`
    });
  }

  const phaseStats = Object.values(state.analytics.phaseStats || {});
  const bestPhase = [...phaseStats].sort((a, b) => b.completed - a.completed)[0];
  if (bestPhase) {
    insights.push({
      title: "Phase Affinity",
      body: `${bestPhase.name} has the strongest completion history. This is a good place to attach one harder habit because the doorway already works.`
    });
  }

  const heatmap = state.analytics.completionHeatmap || {};
  const bestHour = Object.entries(heatmap).sort((a, b) => b[1] - a[1])[0];
  if (bestHour) {
    insights.push({
      title: "Time-of-Day Pattern",
      body: `Your most active quest hour is around ${String(bestHour[0]).padStart(2, "0")}:00. The brain appears to accept bribes at this time.`
    });
  }

  const puzzleProfile = state.puzzles.brainProfile;
  if (state.puzzles.history.length) {
    insights.push({
      title: "Puzzle Brain",
      body: `Your current puzzle recommendation is ${puzzleProfile.recommendedType} at ${puzzleProfile.recommendedDifficulty} difficulty, based on enjoyment and perceived difficulty ratings.`
    });
  }

  return insights;
}

export function renderReports(state) {
  const month = monthKey();
  const monthDays = Object.entries(state.dailyLog).filter(([date]) => date.startsWith(month));
  const monthXp = monthDays.reduce((sum, [, log]) => sum + (log.xpEarned || 0), 0);
  const platinumDays = monthDays.filter(([, log]) => log.tier === "Platinum").length;
  const level = getLevelInfo(state.character.totalXp);
  const tarot = getTarotForLevel(level.level);
  const theme = MONTHLY_THEMES[new Date().getMonth()];
  const insights = buildBrainInsights(state);

  return `
    <section class="panel hero full-span">
      <p class="eyebrow">Brain Report</p>
      <h2>Patterns, not punishment.</h2>
      <p class="muted">All insights are rule-based and generated locally from your own quest data.</p>
      <div class="grid two">
        <div class="stat"><strong>${monthXp}</strong><span class="muted small">XP this month</span></div>
        <div class="stat"><strong>${platinumDays}</strong><span class="muted small">Platinum days</span></div>
      </div>
    </section>

    ${panel("Insight Cards", `
      <div class="grid">
        ${insights.map((item) => `
          <div class="setting-row">
            <div class="phase-dot" style="--phase-color:var(--accent)">✧</div>
            <div class="phase-body">
              <strong>${escapeHtml(item.title)}</strong>
              <span class="muted small">${escapeHtml(item.body)}</span>
            </div>
          </div>
        `).join("")}
      </div>
    `, { className: "full-span" })}

    <section class="panel full-span">
      <p class="eyebrow">Month-End Hall of Fame</p>
      <div class="tarot">
        <p class="eyebrow">${escapeHtml(tarot.card)}</p>
        <div class="tarot-glyph">${level.level}</div>
        <h2>${escapeHtml(level.title)}</h2>
        <p class="muted">${escapeHtml(theme.name)} card · ${monthXp} XP gathered · ${platinumDays} platinum days.</p>
        ${progress(level.progress)}
        <div class="tags">
          <span class="tag">Screenshot-ready</span>
          <span class="tag">Theme unlock after report</span>
        </div>
      </div>
      <button class="btn full" data-action="mark-month-report">Complete month report and unlock theme</button>
    </section>

    ${panel("Trophy Shelf", renderAchievements(state), { className: "full-span" })}

    ${panel("Raw Analytics", renderRaw({
      taskStats: state.analytics.taskStats,
      phaseStats: state.analytics.phaseStats,
      xpByDate: state.analytics.xpByDate,
      puzzles: state.puzzles.brainProfile
    }), { className: "full-span" })}
  `;
}

export function renderDailyProgress(state) {
  const today = todayKey();
  const log = state.dailyLog[today] || { xpEarned: 0, tier: "None" };
  const goal = calculateDailyGoal(state);
  const pct = goal ? Math.round((log.xpEarned / goal) * 100) : 0;
  return `
    <div class="panel">
      <p class="eyebrow">Daily XP Goal</p>
      <h3>${log.xpEarned} / ${goal} XP</h3>
      ${progress(pct)}
      ${tags(["Bronze 50%", "Silver 75%", "Gold 100%", "Platinum 125%+"])}
    </div>
  `;
}
