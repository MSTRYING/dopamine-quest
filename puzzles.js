import { DIFFERENCE_SCENES, LOGIC_GRID_TEMPLATES, SUDOKU_PUZZLES } from "./data.js";
import { calculateDailyGoal, getTier, tierDifficulty } from "./game.js";
import { todayKey } from "./storage.js";
import { escapeHtml, panel, tags } from "./ui.js";

const DIFF_COUNT = { easy: 2, medium: 3, hard: 4, expert: 5 };

export function renderPuzzleHub(state) {
  const log = state.dailyLog[todayKey()] || { xpEarned: 0 };
  const goal = calculateDailyGoal(state);
  const tier = getTier(log.xpEarned || 0, goal);
  const unlocked = tier !== "None";
  const difficulty = tierDifficulty(tier);
  const profile = state.puzzles.brainProfile;
  const remaining = Math.max(0, Math.ceil(goal * 0.5 - (log.xpEarned || 0)));
  const startAttrs = unlocked ? "" : "disabled aria-disabled=\"true\"";
  return `
    <section class="panel hero puzzle-view reward-chest ${unlocked ? "unlocked" : "locked"}">
      <div class="reward-orb" aria-hidden="true">▦</div>
      <p class="eyebrow">Daily Puzzle Reward</p>
      <h2>${unlocked ? "Reward unlocked." : "Earn the brain candy."}</h2>
      <p class="muted">${
        unlocked
          ? `Today's ${escapeHtml(tier)} tier unlocks <strong>${escapeHtml(difficulty)}</strong> difficulty. After each puzzle, rate difficulty and enjoyment so the app learns what your brain actually likes.`
          : `Games unlock once you reach Bronze: 50% of your daily XP goal. Earn ${remaining} more XP to open today's puzzle reward.`
      }</p>
      ${tags([`Tier: ${tier || "None"}`, unlocked ? `Unlocked: ${difficulty}` : `${remaining} XP to Bronze`, `Recommended: ${profile.recommendedType}`])}
      <p class="muted small">${escapeHtml(profile.reason || "Ratings will tune future recommendations.")}</p>
    </section>
    <section class="panel puzzle-card ${profile.recommendedType === "sudoku" ? "recommended" : ""}">
      <h3>Sudoku</h3>
      ${profile.recommendedType === "sudoku" ? `<span class="tag">Recommended today</span>` : ""}
      <p class="muted">${unlocked ? "Classic number sorcery. Validation included. Shame excluded." : "Locked until Bronze. The grid goblin respects boundaries."}</p>
      <button class="btn full" data-action="start-puzzle" data-type="sudoku" data-difficulty="${difficulty}" ${startAttrs}>${unlocked ? "Start Sudoku" : "Locked Reward"}</button>
    </section>
    <section class="panel puzzle-card ${profile.recommendedType === "difference" ? "recommended" : ""}">
      <h3>Find the Difference</h3>
      ${profile.recommendedType === "difference" ? `<span class="tag">Recommended today</span>` : ""}
      <p class="muted">${unlocked ? "Procedural canvas scene with sneaky visual changes." : "Locked until Bronze. Sneaky visual chaos must be earned."}</p>
      <button class="btn full" data-action="start-puzzle" data-type="difference" data-difficulty="${difficulty}" ${startAttrs}>${unlocked ? "Start Difference Hunt" : "Locked Reward"}</button>
    </section>
    <section class="panel puzzle-card ${profile.recommendedType === "logic-grid" ? "recommended" : ""}">
      <h3>Logic Grid</h3>
      ${profile.recommendedType === "logic-grid" ? `<span class="tag">Recommended today</span>` : ""}
      <p class="muted">${unlocked ? "Scheduling-style deduction, because apparently we enjoy suffering with structure." : "Locked until Bronze. The scheduling goblin is behind a velvet rope."}</p>
      <button class="btn full" data-action="start-puzzle" data-type="logic-grid" data-difficulty="${profile.recommendedDifficulty || difficulty}" ${startAttrs}>${unlocked ? "Start Logic Grid" : "Locked Reward"}</button>
    </section>
    ${panel("Puzzle Brain Database", renderPuzzleHistory(state), { className: "full-span" })}
  `;
}

export function renderPuzzleHistory(state) {
  if (!state.puzzles.history.length) return `<p class="muted">No puzzle ratings yet. The database is wearing tiny empty glasses.</p>`;
  return `
    <div class="grid">
      ${state.puzzles.history.slice(-8).reverse().map((item) => `
        <div class="setting-row">
          <div class="phase-dot" style="--phase-color:var(--accent-2)">${item.enjoyment || "?"}</div>
          <div class="phase-body">
            <strong>${escapeHtml(item.type)} · ${escapeHtml(item.difficulty)}</strong>
            <span class="muted small">Enjoyment ${item.enjoyment}/5 · Felt difficulty ${item.perceivedDifficulty}/5 · ${item.xp} XP</span>
          </div>
        </div>
      `).join("")}
    </div>
  `;
}

export function createPuzzleSession(type, difficulty = "easy") {
  if (type === "sudoku") {
    const seed = SUDOKU_PUZZLES[difficulty] || SUDOKU_PUZZLES.easy;
    return {
      type,
      difficulty,
      puzzle: seed.puzzle,
      solution: seed.solution,
      values: seed.puzzle.split("").map((cell) => (cell === "0" ? "" : cell)),
      mistakes: 0,
      hints: 0,
      startedAt: Date.now(),
      complete: false,
      awaitingRating: false
    };
  }
  if (type === "difference") {
    const scene = DIFFERENCE_SCENES[0];
    return {
      type,
      difficulty,
      scene,
      differences: scene.differences.slice(0, DIFF_COUNT[difficulty] || 2),
      found: [],
      startedAt: Date.now(),
      complete: false,
      awaitingRating: false
    };
  }
  const template = difficulty === "expert" ? LOGIC_GRID_TEMPLATES[1] : LOGIC_GRID_TEMPLATES[0];
  return {
    type: "logic-grid",
    difficulty,
    template,
    marks: {},
    mistakes: 0,
    startedAt: Date.now(),
    complete: false,
    awaitingRating: false
  };
}

export function renderPuzzleSession(session) {
  if (!session) return "";
  if (session.awaitingRating) return renderRating(session);
  if (session.type === "sudoku") return renderSudoku(session);
  if (session.type === "difference") return renderDifference(session);
  return renderLogic(session);
}

export function renderSudoku(session) {
  return `
    <section class="panel puzzle-view">
      <p class="eyebrow">Sudoku · ${escapeHtml(session.difficulty)}</p>
      <h2>Number goblin containment.</h2>
      <div class="sudoku" data-puzzle="sudoku">
        ${session.values.map((value, index) => {
          const given = session.puzzle[index] !== "0";
          return `<input inputmode="numeric" maxlength="1" data-index="${index}" value="${escapeHtml(value)}" ${given ? "readonly" : ""} class="${given ? "given" : ""}" aria-label="Cell ${index + 1}">`;
        }).join("")}
      </div>
      <div class="tags">
        <span class="tag">Mistakes: ${session.mistakes}</span>
        <span class="tag">Hints: ${session.hints}</span>
      </div>
      <div class="grid two">
        <button class="btn secondary" data-action="sudoku-hint">Hint</button>
        <button class="btn" data-action="check-sudoku">Check</button>
      </div>
      <button class="btn secondary full" data-action="exit-puzzle">Back to puzzle hub</button>
    </section>
  `;
}

export function renderDifference(session) {
  return `
    <section class="panel puzzle-view">
      <p class="eyebrow">Find the Difference · ${escapeHtml(session.difficulty)}</p>
      <h2>${escapeHtml(session.scene.title)}</h2>
      <p class="muted">Tap differences on the right canvas. Found ${session.found.length}/${session.differences.length}.</p>
      <div class="canvas-pair">
        <canvas class="diff-canvas" id="diff-left" width="360" height="360" aria-label="Original scene"></canvas>
        <canvas class="diff-canvas" id="diff-right" width="360" height="360" data-action="difference-click" aria-label="Changed scene"></canvas>
      </div>
      ${tags(session.found.map((id) => session.differences.find((diff) => diff.id === id)?.label || id))}
      <button class="btn secondary full" data-action="exit-puzzle">Back to puzzle hub</button>
    </section>
  `;
}

export function drawDifferenceCanvases(session) {
  if (!session || session.type !== "difference") return;
  const left = document.getElementById("diff-left");
  const right = document.getElementById("diff-right");
  if (!left || !right) return;
  drawScene(left.getContext("2d"), session, false);
  drawScene(right.getContext("2d"), session, true);
}

function drawScene(ctx, session, changed) {
  ctx.clearRect(0, 0, 360, 360);
  const grad = ctx.createLinearGradient(0, 0, 360, 360);
  grad.addColorStop(0, "#16091f");
  grad.addColorStop(0.5, "#243018");
  grad.addColorStop(1, "#090b18");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 360, 360);
  ctx.fillStyle = "#f7d774";
  ctx.beginPath();
  ctx.arc(changed ? 292 : 282, 46, 18, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#ffffff";
  for (const [x, y] of [[72, 68], [132, 44], [310, 94], [42, 144], [204, 70]]) {
    if (changed && x === 72 && y === 68) continue;
    ctx.beginPath();
    ctx.arc(x, y, 3, 0, Math.PI * 2);
    ctx.fill();
  }
  drawMushroom(ctx, 188, 190, "#bf5af2");
  drawMushroom(ctx, 238, 148, changed ? "#7cff6b" : "#ff5bd8");
  drawMushroom(ctx, 96, 206, "#f97316");
  drawFern(ctx, 52, 302, changed);
  drawCrystal(ctx, 126, 250, "#6fd7e3");
  if (changed) drawCrystal(ctx, 146, 262, "#f8d66d");
  session.found.forEach((id) => {
    const diff = session.differences.find((item) => item.id === id);
    if (!diff || !changed) return;
    ctx.strokeStyle = "#77f2a1";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(diff.x, diff.y, diff.r + 8, 0, Math.PI * 2);
    ctx.stroke();
  });
}

function drawMushroom(ctx, x, y, color) {
  ctx.fillStyle = "#f3dcc6";
  ctx.fillRect(x - 12, y, 24, 58);
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.ellipse(x, y, 45, 28, 0, Math.PI, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "rgba(255,255,255,.72)";
  ctx.beginPath();
  ctx.arc(x - 15, y - 6, 5, 0, Math.PI * 2);
  ctx.arc(x + 14, y - 8, 4, 0, Math.PI * 2);
  ctx.fill();
}

function drawFern(ctx, x, y, changed) {
  ctx.strokeStyle = changed ? "#f8d66d" : "#7cff6b";
  ctx.lineWidth = 4;
  for (let i = 0; i < 6; i += 1) {
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + (i % 2 ? -1 : 1) * (20 + i * 4), y - 16 - i * 12);
    ctx.stroke();
  }
}

function drawCrystal(ctx, x, y, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x, y - 28);
  ctx.lineTo(x + 18, y);
  ctx.lineTo(x, y + 34);
  ctx.lineTo(x - 18, y);
  ctx.closePath();
  ctx.fill();
}

export function handleDifferenceClick(session, event, element = event.currentTarget) {
  const rect = element.getBoundingClientRect();
  const x = ((event.clientX - rect.left) / rect.width) * 360;
  const y = ((event.clientY - rect.top) / rect.height) * 360;
  const hit = session.differences.find((diff) => !session.found.includes(diff.id) && Math.hypot(diff.x - x, diff.y - y) <= diff.r + 12);
  if (hit) {
    session.found.push(hit.id);
    if (session.found.length === session.differences.length) {
      session.complete = true;
      session.awaitingRating = true;
    }
    return true;
  }
  return false;
}

export function renderLogic(session) {
  const template = session.template;
  const primary = Object.keys(template.categories)[0];
  const subjects = template.categories[primary];
  const categories = Object.keys(template.categories).filter((name) => name !== primary);
  return `
    <section class="panel puzzle-view">
      <p class="eyebrow">Logic Grid · ${escapeHtml(session.difficulty)}</p>
      <h2>${escapeHtml(template.title)}</h2>
      <p class="muted">${escapeHtml(template.prompt)}</p>
      <div class="grid">
        ${template.clues.map((clue, index) => `<div class="tag">${index + 1}. ${escapeHtml(clue)}</div>`).join("")}
      </div>
      <div class="logic-grid">
        ${categories.map((category) => `
          <h3>${escapeHtml(primary)} x ${escapeHtml(category)}</h3>
          <table>
            <thead>
              <tr><th>${escapeHtml(primary)}</th>${template.categories[category].map((option) => `<th>${escapeHtml(option)}</th>`).join("")}</tr>
            </thead>
            <tbody>
              ${subjects.map((subject) => `
                <tr>
                  <th>${escapeHtml(subject)}</th>
                  ${template.categories[category].map((option) => {
                    const key = logicKey(subject, category, option);
                    const mark = session.marks[key] || "";
                    return `<td><button class="logic-cell ${mark}" data-action="logic-mark" data-key="${escapeHtml(key)}">${mark === "yes" ? "✓" : mark === "no" ? "×" : ""}</button></td>`;
                  }).join("")}
                </tr>
              `).join("")}
            </tbody>
          </table>
        `).join("")}
      </div>
      <div class="grid two">
        <button class="btn secondary" data-action="logic-clear">Clear</button>
        <button class="btn" data-action="check-logic">Check</button>
      </div>
      <button class="btn secondary full" data-action="exit-puzzle">Back to puzzle hub</button>
    </section>
  `;
}

export function cycleLogicMark(session, key) {
  const current = session.marks[key] || "";
  session.marks[key] = current === "" ? "yes" : current === "yes" ? "no" : "";
}

export function checkLogic(session) {
  const template = session.template;
  const primary = Object.keys(template.categories)[0];
  const subjects = template.categories[primary];
  const categories = Object.keys(template.categories).filter((name) => name !== primary);
  for (const subject of subjects) {
    for (const category of categories) {
      const correct = template.solution[subject][category];
      if (session.marks[logicKey(subject, category, correct)] !== "yes") {
        session.mistakes += 1;
        return false;
      }
    }
  }
  session.complete = true;
  session.awaitingRating = true;
  return true;
}

function logicKey(subject, category, option) {
  return `${subject}||${category}||${option}`;
}

export function updateSudokuValue(session, index, value) {
  const clean = String(value).replace(/[^1-9]/g, "").slice(0, 1);
  if (session.puzzle[index] === "0") session.values[index] = clean;
}

export function checkSudoku(session) {
  const guess = session.values.map((value) => value || "0").join("");
  if (guess === session.solution) {
    session.complete = true;
    session.awaitingRating = true;
    return true;
  }
  session.mistakes += 1;
  return false;
}

export function sudokuHint(session) {
  const index = session.values.findIndex((value, idx) => !value && session.puzzle[idx] === "0");
  if (index >= 0) {
    session.values[index] = session.solution[index];
    session.hints += 1;
  }
}

export function renderRating(session) {
  return `
    <section class="panel puzzle-view">
      <p class="eyebrow">Puzzle Complete</p>
      <h2>Tell the brain database what happened.</h2>
      <p class="muted">This tunes future puzzle recommendations locally. No cloud. Just vibes and JSON.</p>
      <form class="form-grid" data-submit="rate-puzzle">
        <label>Enjoyment
          <select name="enjoyment" required>
            <option value="5">5 - deliciously difficult</option>
            <option value="4">4 - satisfying</option>
            <option value="3">3 - okay</option>
            <option value="2">2 - meh</option>
            <option value="1">1 - brain said absolutely not</option>
          </select>
        </label>
        <label>Perceived difficulty
          <select name="perceivedDifficulty" required>
            <option value="5">5 - cosmic boss fight</option>
            <option value="4">4 - spicy</option>
            <option value="3">3 - balanced</option>
            <option value="2">2 - light stretch</option>
            <option value="1">1 - too easy</option>
          </select>
        </label>
        <label>Notes
          <textarea name="notes" placeholder="Optional: what worked, what annoyed you, what made the dopamine goblin clap?"></textarea>
        </label>
        <button class="btn full" type="submit">Save rating and claim XP</button>
      </form>
    </section>
  `;
}

export function puzzleResultFromSession(session, formData) {
  return {
    type: session.type,
    difficulty: session.difficulty,
    enjoyment: Number(formData.get("enjoyment") || 3),
    perceivedDifficulty: Number(formData.get("perceivedDifficulty") || 3),
    notes: String(formData.get("notes") || ""),
    durationSeconds: Math.round((Date.now() - session.startedAt) / 1000),
    mistakes: session.mistakes || 0,
    hints: session.hints || 0,
    xp: puzzleXp(session)
  };
}

function puzzleXp(session) {
  const base = { easy: 20, medium: 30, hard: 45, expert: 60 }[session.difficulty] || 25;
  const hintPenalty = (session.hints || 0) * 3;
  const mistakePenalty = (session.mistakes || 0) * 2;
  return Math.max(10, base - hintPenalty - mistakePenalty);
}
