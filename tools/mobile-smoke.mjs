import { spawn } from "node:child_process";
import { createServer } from "node:http";
import { readFile, rm, mkdtemp } from "node:fs/promises";
import { existsSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

const ROOT = process.cwd();
const MOBILE = { width: 390, height: 844, dpr: 3 };
const CHROME_PATHS = [
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe"
];

const SUDOKU_SOLUTIONS = {
  easy: "534678912672195348198342567859761423426853791713924856961537284287419635345286179",
  medium: "435269781682571493197834562826195347374682915951743628519326874248957136763418259",
  hard: "462831957795426183381795426173984265659312748567319926178534834259671517643892",
  expert: "162857493534129678789643521475312986913586742628794135356478219241935867897261354"
};

const DIFFERENCE_POINTS = [
  [72, 68],
  [236, 128],
  [126, 250],
  [292, 46],
  [52, 302]
];

const LOGIC_SOLUTIONS = {
  evening: [
    "Cook||Time||18:00",
    "Cook||Mood||Techno",
    "Plants||Time||19:00",
    "Plants||Mood||Calm",
    "Workout||Time||20:00",
    "Workout||Mood||Focus"
  ],
  crystal: [
    "Quartz||Shelf||Top",
    "Quartz||Quest||Focus",
    "Amethyst||Shelf||Middle",
    "Amethyst||Quest||Rest",
    "Obsidian||Shelf||Bottom",
    "Obsidian||Quest||Courage"
  ]
};

class CDP {
  constructor(wsUrl) {
    this.wsUrl = wsUrl;
    this.id = 0;
    this.pending = new Map();
    this.listeners = new Map();
    this.errors = [];
  }

  async connect() {
    this.ws = new WebSocket(this.wsUrl);
    await new Promise((resolve, reject) => {
      this.ws.addEventListener("open", resolve, { once: true });
      this.ws.addEventListener("error", reject, { once: true });
    });
    this.ws.addEventListener("message", (event) => {
      const message = JSON.parse(event.data);
      if (message.id && this.pending.has(message.id)) {
        const { resolve, reject } = this.pending.get(message.id);
        this.pending.delete(message.id);
        if (message.error) reject(new Error(message.error.message));
        else resolve(message.result || {});
        return;
      }
      const handlers = this.listeners.get(message.method) || [];
      handlers.forEach((handler) => handler(message.params || {}));
    });
  }

  on(method, handler) {
    const handlers = this.listeners.get(method) || [];
    handlers.push(handler);
    this.listeners.set(method, handlers);
  }

  send(method, params = {}) {
    const id = ++this.id;
    this.ws.send(JSON.stringify({ id, method, params }));
    return new Promise((resolve, reject) => this.pending.set(id, { resolve, reject }));
  }

  close() {
    this.ws?.close();
  }
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function withTimeout(promise, ms, message) {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error(message)), ms))
  ]);
}

async function getFreePort() {
  const server = createServer();
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const port = server.address().port;
  await new Promise((resolve) => server.close(resolve));
  return port;
}

async function startStaticServer() {
  const server = createServer(async (req, res) => {
    const url = new URL(req.url, "http://127.0.0.1");
    const cleanPath = url.pathname === "/" ? "/index.html" : url.pathname;
    const filePath = path.normalize(path.join(ROOT, cleanPath));
    if (!filePath.startsWith(ROOT)) {
      res.writeHead(403);
      res.end("Forbidden");
      return;
    }
    try {
      const body = await readFile(filePath);
      res.writeHead(200, { "content-type": contentType(filePath) });
      res.end(body);
    } catch {
      res.writeHead(404);
      res.end("Not found");
    }
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  return {
    server,
    url: `http://127.0.0.1:${server.address().port}/`
  };
}

function contentType(filePath) {
  if (filePath.endsWith(".html")) return "text/html";
  if (filePath.endsWith(".css")) return "text/css";
  if (filePath.endsWith(".js") || filePath.endsWith(".mjs")) return "text/javascript";
  if (filePath.endsWith(".json") || filePath.endsWith(".webmanifest")) return "application/manifest+json";
  if (filePath.endsWith(".svg")) return "image/svg+xml";
  return "application/octet-stream";
}

async function startBrowser(debugPort, userDataDir) {
  const chrome = CHROME_PATHS.find((candidate) => existsSync(candidate));
  assert(chrome, "Chrome or Edge executable not found.");
  const args = [
    "--headless=new",
    "--disable-gpu",
    "--no-first-run",
    "--no-default-browser-check",
    "--hide-scrollbars",
    `--user-data-dir=${userDataDir}`,
    `--remote-debugging-port=${debugPort}`,
    `--window-size=${MOBILE.width},${MOBILE.height}`,
    "about:blank"
  ];
  const child = spawn(chrome, args, { stdio: "ignore" });
  return child;
}

async function getPageWebSocket(debugPort) {
  const base = `http://127.0.0.1:${debugPort}`;
  for (let i = 0; i < 60; i += 1) {
    try {
      const targets = await (await fetch(`${base}/json/list`)).json();
      const page = targets.find((target) => target.type === "page");
      if (page?.webSocketDebuggerUrl) return page.webSocketDebuggerUrl;
    } catch {
      await delay(250);
    }
    await delay(250);
  }
  throw new Error("Could not connect to Chrome DevTools Protocol.");
}

async function bootPage(cdp, url) {
  const pageErrors = [];
  cdp.on("Runtime.exceptionThrown", (params) => {
    pageErrors.push(params.exceptionDetails?.text || params.exceptionDetails?.exception?.description || "Runtime exception");
  });
  cdp.on("Runtime.consoleAPICalled", (params) => {
    if (["error", "warning"].includes(params.type)) {
      pageErrors.push(params.args?.map((arg) => arg.value || arg.description).join(" ") || `console.${params.type}`);
    }
  });
  cdp.on("Page.javascriptDialogOpening", async () => {
    await cdp.send("Page.handleJavaScriptDialog", { accept: true }).catch(() => {});
  });
  await cdp.send("Page.enable");
  await cdp.send("Runtime.enable");
  await cdp.send("Log.enable");
  await cdp.send("Emulation.setDeviceMetricsOverride", {
    width: MOBILE.width,
    height: MOBILE.height,
    deviceScaleFactor: MOBILE.dpr,
    mobile: true
  });
  await cdp.send("Emulation.setUserAgentOverride", {
    userAgent:
      "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1"
  });
  await cdp.send("Page.navigate", { url });
  await waitFor(cdp, "document.querySelector('.bottom-nav') && document.readyState === 'complete'");
  return pageErrors;
}

async function evaluate(cdp, expression) {
  const result = await cdp.send("Runtime.evaluate", {
    expression,
    awaitPromise: true,
    returnByValue: true
  });
  if (result.exceptionDetails) {
    throw new Error(result.exceptionDetails.text || result.exceptionDetails.exception?.description || "Evaluation failed");
  }
  return result.result?.value;
}

async function waitFor(cdp, expression, timeout = 8000) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    const value = await evaluate(cdp, `Boolean(${expression})`).catch(() => false);
    if (value) return true;
    await delay(120);
  }
  throw new Error(`Timed out waiting for ${expression}`);
}

async function click(cdp, selector) {
  const rect = await evaluate(
    cdp,
    `(() => {
      const el = document.querySelector(${JSON.stringify(selector)});
      if (!el) return null;
      el.scrollIntoView({ block: 'center', inline: 'center' });
      const r = el.getBoundingClientRect();
      return { x: r.left + r.width / 2, y: r.top + r.height / 2, width: r.width, height: r.height, disabled: Boolean(el.disabled) };
    })()`
  );
  assert(rect, `Element not found: ${selector}`);
  assert(!rect.disabled, `Element disabled: ${selector}`);
  await cdp.send("Input.dispatchMouseEvent", { type: "mouseMoved", x: rect.x, y: rect.y });
  await cdp.send("Input.dispatchMouseEvent", { type: "mousePressed", x: rect.x, y: rect.y, button: "left", clickCount: 1 });
  await cdp.send("Input.dispatchMouseEvent", { type: "mouseReleased", x: rect.x, y: rect.y, button: "left", clickCount: 1 });
  await delay(180);
}

async function setValue(cdp, selector, value) {
  const ok = await evaluate(
    cdp,
    `(() => {
      const el = document.querySelector(${JSON.stringify(selector)});
      if (!el) return false;
      el.value = ${JSON.stringify(value)};
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
      return true;
    })()`
  );
  assert(ok, `Could not set value for ${selector}`);
}

async function gotoRoute(cdp, route) {
  await evaluate(cdp, `location.hash = ${JSON.stringify(route)}`);
  await waitFor(cdp, `document.querySelector('main.${route}-view')`);
  await delay(150);
}

async function routeCheck(cdp, route) {
  await gotoRoute(cdp, route);
  const check = await evaluate(
    cdp,
    `(() => {
      const doc = document.documentElement;
      const body = document.body;
      const tinyTargets = [...document.querySelectorAll('button, a.btn, input, textarea, select')]
        .map((el) => {
          const r = el.getBoundingClientRect();
          return { tag: el.tagName, text: (el.textContent || el.getAttribute('aria-label') || el.name || '').trim(), width: r.width, height: r.height };
        })
        .filter((r) => r.width > 0 && r.height > 0 && (r.height < 34 || r.width < 30));
      const zoomRiskControls = [...document.querySelectorAll('input:not([type="hidden"]), textarea, select')]
        .map((el) => {
          const r = el.getBoundingClientRect();
          const fontSize = Number.parseFloat(getComputedStyle(el).fontSize);
          return { tag: el.tagName, name: el.name || el.className || '', width: r.width, height: r.height, fontSize };
        })
        .filter((r) => r.width > 0 && r.height > 0 && r.fontSize < 16);
      return {
        route: ${JSON.stringify(route)},
        scrollWidth: Math.max(doc.scrollWidth, body.scrollWidth),
        innerWidth,
        hasNav: Boolean(document.querySelector('.bottom-nav')),
        panels: document.querySelectorAll('.panel').length,
        tinyTargets,
        zoomRiskControls
      };
    })()`
  );
  assert(check.hasNav, `${route}: bottom nav missing`);
  assert(check.panels > 0, `${route}: no panels rendered`);
  assert(check.scrollWidth <= check.innerWidth + 2, `${route}: horizontal overflow ${check.scrollWidth} > ${check.innerWidth}`);
  assert(check.tinyTargets.length === 0, `${route}: tiny tap targets ${JSON.stringify(check.tinyTargets)}`);
  assert(check.zoomRiskControls.length === 0, `${route}: controls below 16px can trigger mobile focus zoom ${JSON.stringify(check.zoomRiskControls)}`);
  return check;
}

async function testQuestFlow(cdp) {
  await gotoRoute(cdp, "today");
  const chestLocked = await evaluate(
    cdp,
    `(() => {
      const button = document.querySelector("[data-action='open-reward-chest']");
      return Boolean(button?.disabled && document.body.innerText.includes("Locked until Bronze"));
    })()`
  );
  assert(chestLocked, "Reward chest should start locked before earning Bronze.");

  await gotoRoute(cdp, "phase");
  await click(cdp, "[data-action='toggle-task-timer']");
  await waitFor(cdp, `document.querySelector('.task-row.timer-running')`);
  await delay(1100);
  await click(cdp, "[data-action='toggle-task-timer']");
  await click(cdp, "[data-action='complete-task']");
  await setValue(cdp, "textarea[name='taskInput']", "Make the day kinder and less feral.");
  await click(cdp, "form[data-submit='task-input'] button[type='submit']");
  await waitFor(cdp, `document.querySelector("[data-action='complete-phase']:not([disabled])")`);
  await click(cdp, "[data-action='complete-phase']");
  const state = await evaluate(
    cdp,
    `(() => {
      const logs = JSON.parse(localStorage.getItem('dq_daily_log'));
      const today = new Date().toISOString().slice(0, 10);
      return logs[today];
    })()`
  );
  assert(state.xpEarned > 0, "Quest flow did not award XP.");
  assert(state.phaseCompletions["morning-ignition"], "Morning Ignition did not complete.");
  assert(Object.values(state.completedTasks).some((task) => task.xpIdentifier && task.timerMs > 0), "Completed tasks did not keep XP identifiers and timer receipts.");
  await gotoRoute(cdp, "today");
  await click(cdp, "[data-action='open-day-reward']");
  await waitFor(cdp, `document.querySelector('#modal-root')?.innerText.toLowerCase().includes('day close reward')`);
  await click(cdp, "[data-action='close-modal']");
}

async function testWorkModeGoal(cdp) {
  await evaluate(
    cdp,
    `(() => {
      const phases = JSON.parse(localStorage.getItem('dq_phases'));
      const work = phases.find((phase) => phase.id === 'work-mode');
      const today = new Date().getDay();
      if (work) {
        work.active = true;
        work.days = Array.from(new Set([...(work.days || []), today]));
      }
      localStorage.setItem('dq_phases', JSON.stringify(phases));
      location.hash = 'today';
      location.reload();
    })()`
  );
  await waitFor(cdp, `document.querySelector('main.today-view')`);
  await evaluate(
    cdp,
    `(() => {
      const row = [...document.querySelectorAll('[data-action="open-phase"]')].find((el) => el.dataset.id === 'work-mode');
      row?.click();
    })()`
  );
  await waitFor(cdp, `document.querySelector("form[data-submit='work-goal']")`);
  await setValue(cdp, "textarea[name='workGoal']", "Finish the presentation pass and ship the live update.");
  await click(cdp, "form[data-submit='work-goal'] button[type='submit']");
  const goal = await evaluate(
    cdp,
    `(() => {
      const logs = JSON.parse(localStorage.getItem('dq_daily_log'));
      const today = new Date().toISOString().slice(0, 10);
      return logs[today]?.notes?.workDailyGoal?.text || "";
    })()`
  );
  assert(goal.includes("presentation"), "Work Mode did not save the daily goal prompt.");
}

async function earnPuzzleReward(cdp) {
  await evaluate(
    cdp,
    `(() => {
      const settings = JSON.parse(localStorage.getItem('dq_settings'));
      settings.dailyXpGoal = 100;
      settings.autoDailyGoal = false;
      localStorage.setItem('dq_settings', JSON.stringify(settings));
      location.hash = 'today';
      location.reload();
    })()`
  );
  await waitFor(cdp, `document.querySelector('main.today-view')`);
  await evaluate(
    cdp,
    `(() => {
      const row = [...document.querySelectorAll('[data-action="open-phase"]')].find((el) => el.textContent.includes('Morning Routine'));
      row?.click();
    })()`
  );
  await waitFor(cdp, `document.body.innerText.includes('Make the bed')`);
  let safety = 0;
  while ((await evaluate(cdp, `Boolean(document.querySelector('[data-action="complete-task"]:not([disabled])'))`)) && safety < 8) {
    await click(cdp, "[data-action='complete-task']:not([disabled])");
    safety += 1;
  }
  await waitFor(cdp, `document.querySelector("[data-action='complete-phase']:not([disabled])")`);
  await click(cdp, "[data-action='complete-phase']");
  const tier = await evaluate(
    cdp,
    `(() => {
      const logs = JSON.parse(localStorage.getItem('dq_daily_log'));
      const today = new Date().toISOString().slice(0, 10);
      return logs[today].tier;
    })()`
  );
  assert(tier !== "None", `Puzzle reward was not unlocked after earning XP; tier=${tier}`);

  await evaluate(cdp, `document.querySelector("[data-action='close-modal']")?.click()`);
  await gotoRoute(cdp, "today");
  await waitFor(cdp, `document.querySelector("[data-action='open-reward-chest']:not([disabled])")`);
  await evaluate(cdp, `document.querySelector("[data-action='open-reward-chest']")?.click()`);
  await waitFor(cdp, `document.querySelector('#modal-root')?.innerText.toLowerCase().includes('reward chest opened')`).catch(async () => {
    const debug = await evaluate(
      cdp,
      `(() => {
        const logs = JSON.parse(localStorage.getItem('dq_daily_log'));
        const settings = JSON.parse(localStorage.getItem('dq_settings'));
        const today = new Date().toISOString().slice(0, 10);
        const button = document.querySelector("[data-action='open-reward-chest']");
        return {
          button: button?.outerHTML,
          modal: document.querySelector('#modal-root')?.innerText,
          toast: document.querySelector('#toast-root')?.innerText,
          route: location.hash,
          xp: logs[today]?.xpEarned,
          tier: logs[today]?.tier,
          goal: settings.dailyXpGoal,
          autoDailyGoal: settings.autoDailyGoal
        };
      })()`
    );
    throw new Error(`Reward chest did not open. Debug: ${JSON.stringify(debug, null, 2)}`);
  });
  await click(cdp, "[data-action='close-modal']");
  await waitFor(cdp, `!document.querySelector('#modal-root')?.innerText.toLowerCase().includes('reward chest opened')`);
}

async function testJournalAndGoals(cdp) {
  await gotoRoute(cdp, "journal");
  await setValue(cdp, "textarea[name='gratitude']", "A small functional test with a surprisingly nice hat.");
  await click(cdp, "form[data-submit='add-gratitude'] button[type='submit']");
  await setValue(cdp, "textarea[name='weeklyGoal']", "QA the quest loop.");
  await setValue(cdp, "textarea[name='monthlyGoal']", "Ship a delightful static app.");
  await click(cdp, "form[data-submit='save-goals'] button[type='submit']");
  const counts = await evaluate(
    cdp,
    `(() => ({
      gratitude: JSON.parse(localStorage.getItem('dq_gratitude_journal')).length,
      weekly: Object.keys(JSON.parse(localStorage.getItem('dq_weekly_goals'))).length,
      monthly: Object.keys(JSON.parse(localStorage.getItem('dq_monthly_goals'))).length
    }))()`
  );
  assert(counts.gratitude >= 1, "Gratitude entry was not saved.");
  assert(counts.weekly >= 1 && counts.monthly >= 1, "Goals were not saved.");
}

async function testSettings(cdp) {
  await gotoRoute(cdp, "settings");
  await click(cdp, "[data-action='toggle-phase']");
  await click(cdp, "[data-action='toggle-phase']");
  await setValue(cdp, "input[name='dailyXpGoal']", "500");
  await evaluate(cdp, `document.querySelector("select[name='autoDailyGoal']").value = "false"; document.querySelector("select[name='autoDailyGoal']").dispatchEvent(new Event('change', { bubbles: true }));`);
  await evaluate(cdp, `document.querySelector("select[name='soundEffects']").value = "false"; document.querySelector("select[name='soundEffects']").dispatchEvent(new Event('change', { bubbles: true }));`);
  await evaluate(cdp, `document.querySelector("select[name='haptics']").value = "false"; document.querySelector("select[name='haptics']").dispatchEvent(new Event('change', { bubbles: true }));`);
  await click(cdp, "form[data-submit='save-settings'] button[type='submit']");
  const settings = await evaluate(cdp, `JSON.parse(localStorage.getItem('dq_settings'))`);
  assert(settings.dailyXpGoal === 500 && settings.autoDailyGoal === false, "Settings form did not persist.");
  assert(settings.soundEffects === false && settings.haptics === false, "Sound/haptic settings did not persist.");
  await click(cdp, "[data-action='add-phase']");
  await waitFor(cdp, `document.querySelector("form[data-submit='save-phase-json']")`);
  const friendlyBuilder = await evaluate(
    cdp,
    `Boolean(document.querySelector("[data-task-editor]") && document.querySelector("details.advanced-editor"))`
  );
  assert(friendlyBuilder, "Friendly phase builder fields were not present.");
  await click(cdp, "[data-action='add-task-row']");
  await waitFor(cdp, `document.querySelectorAll("[data-task-row]").length === 1`);
  await setValue(cdp, "[data-task-row] input[name='taskName']", "Smoke test task");
  await evaluate(cdp, `document.querySelector("[data-task-row] select[name='taskType']").value = "Alternating"; document.querySelector("[data-task-row] select[name='taskType']").dispatchEvent(new Event('change', { bubbles: true }));`);
  await setValue(cdp, "[data-task-row] input[name='taskFrequencyDays']", "3");
  await setValue(cdp, "[data-task-row] input[name='taskBonusCondition']", "Every 3 days");
  const taskEditorWorks = await evaluate(
    cdp,
    `(() => {
      const row = document.querySelector("[data-task-row]");
      return row?.querySelector("select[name='taskType']").value === "Alternating"
        && row?.querySelector("input[name='taskFrequencyDays']").value === "3";
    })()`
  );
  assert(taskEditorWorks, "Task editor controls did not update.");
  await click(cdp, "[data-action='remove-task-row']");
  await waitFor(cdp, `document.querySelectorAll("[data-task-row]").length === 0`);
  await evaluate(cdp, `document.querySelector("form[data-submit='save-phase-json'] [data-action='close-modal']").click()`);
  await waitFor(cdp, `!document.querySelector("form[data-submit='save-phase-json']")`);
}

async function testSudoku(cdp) {
  await gotoRoute(cdp, "puzzles");
  const locked = await evaluate(cdp, `document.querySelector("[data-type='sudoku']")?.disabled`);
  if (locked) {
    await earnPuzzleReward(cdp);
    await gotoRoute(cdp, "puzzles");
  }
  const difficulty = await evaluate(cdp, `document.querySelector("[data-type='sudoku']").dataset.difficulty`);
  await click(cdp, "[data-type='sudoku']");
  await waitFor(cdp, `document.querySelector('.sudoku')`, 3000).catch(async () => {
    const visible = await evaluate(cdp, `document.body.innerText.slice(0, 1000)`);
    throw new Error(`Sudoku screen did not open. Visible text:\n${visible}`);
  });
  const solution = SUDOKU_SOLUTIONS[difficulty] || SUDOKU_SOLUTIONS.easy;
  await evaluate(
    cdp,
    `(() => {
      const solution = ${JSON.stringify(solution)};
      [...document.querySelectorAll('.sudoku input')].forEach((el, i) => {
        if (!el.readOnly) {
          el.value = solution[i];
          el.dispatchEvent(new Event('input', { bubbles: true }));
        }
      });
    })()`
  );
  await click(cdp, "[data-action='check-sudoku']");
  await waitFor(cdp, `document.querySelector("form[data-submit='rate-puzzle']")`);
  await click(cdp, "form[data-submit='rate-puzzle'] button[type='submit']");
}

async function testDifference(cdp) {
  await gotoRoute(cdp, "puzzles");
  await click(cdp, "[data-type='difference']");
  for (const [x, y] of DIFFERENCE_POINTS) {
    const rect = await evaluate(
      cdp,
      `(() => {
        const el = document.querySelector('#diff-right');
        if (!el) return null;
        const r = el.getBoundingClientRect();
        return { left: r.left, top: r.top, width: r.width, height: r.height };
      })()`
    );
    if (!rect) break;
    const px = rect.left + (x / 360) * rect.width;
    const py = rect.top + (y / 360) * rect.height;
    await cdp.send("Input.dispatchMouseEvent", { type: "mouseMoved", x: px, y: py });
    await cdp.send("Input.dispatchMouseEvent", { type: "mousePressed", x: px, y: py, button: "left", clickCount: 1 });
    await cdp.send("Input.dispatchMouseEvent", { type: "mouseReleased", x: px, y: py, button: "left", clickCount: 1 });
    await delay(150);
  }
  await waitFor(cdp, `document.querySelector("form[data-submit='rate-puzzle']")`);
  await click(cdp, "form[data-submit='rate-puzzle'] button[type='submit']");
}

async function testLogicGrid(cdp) {
  await gotoRoute(cdp, "puzzles");
  await click(cdp, "[data-type='logic-grid']");
  const isCrystal = await evaluate(cdp, `document.body.innerText.includes('Crystal Errand')`);
  const keys = isCrystal ? LOGIC_SOLUTIONS.crystal : LOGIC_SOLUTIONS.evening;
  for (const key of keys) {
    await evaluate(cdp, `document.querySelector(${JSON.stringify(`[data-key="${key}"]`)})?.click()`);
    await delay(80);
  }
  await click(cdp, "[data-action='check-logic']");
  await waitFor(cdp, `document.querySelector("form[data-submit='rate-puzzle']")`);
  await click(cdp, "form[data-submit='rate-puzzle'] button[type='submit']");
  const history = await evaluate(cdp, `JSON.parse(localStorage.getItem('dq_puzzles')).history.length`);
  assert(history >= 3, `Expected 3 puzzle history entries, got ${history}`);
}

async function testReportsAndData(cdp) {
  await gotoRoute(cdp, "reports");
  await click(cdp, "[data-action='mark-month-report']");
  const settings = await evaluate(cdp, `JSON.parse(localStorage.getItem('dq_settings'))`);
  assert(settings.lastMonthReportSeen, "Month report was not marked seen.");

  await gotoRoute(cdp, "settings");
  await click(cdp, "[data-action='import-json']");
  await waitFor(cdp, `document.querySelector("form[data-submit='import-json-submit']")`);
  const backup = await evaluate(
    cdp,
    `(() => {
      const keys = ['dq_phases','dq_daily_log','dq_gratitude_journal','dq_weekly_goals','dq_monthly_goals','dq_settings','dq_streaks','dq_achievements','dq_character','dq_analytics','dq_puzzles','dq_meta'];
      const payload = {};
      keys.forEach((key) => payload[key] = JSON.parse(localStorage.getItem(key)));
      return JSON.stringify(payload);
    })()`
  );
  await setValue(cdp, "form[data-submit='import-json-submit'] textarea[name='json']", backup);
  await click(cdp, "[data-action='preview-import']");
  await waitFor(cdp, `document.querySelector("[data-import-preview]")?.innerText.includes("dq_phases")`);
  await click(cdp, "form[data-submit='import-json-submit'] button[type='submit']");
  await waitFor(cdp, `!document.querySelector("form[data-submit='import-json-submit']")`);
  await click(cdp, "[data-action='export-json']");
  const meta = await evaluate(cdp, `JSON.parse(localStorage.getItem('dq_meta'))`);
  assert(Boolean(meta.lastBackupAt), "Export JSON did not record lastBackupAt.");
}

async function testPwa(cdp) {
  const canUseServiceWorker = await evaluate(
    cdp,
    `location.protocol !== 'file:' && 'serviceWorker' in navigator`
  );
  if (!canUseServiceWorker) return;
  const swFetchOk = await evaluate(cdp, `(async () => (await fetch('./sw.js', { cache: 'no-store' })).ok)()`);
  assert(swFetchOk, "Service worker file was not reachable.");
  for (let i = 0; i < 40; i += 1) {
    const registered = await evaluate(
      cdp,
      `(async () => Boolean(await navigator.serviceWorker.getRegistration()))()`
    );
    if (registered) {
      await evaluate(cdp, `(async () => Boolean(await navigator.serviceWorker.ready))()`);
      await assertOfflineReload(cdp);
      return;
    }
    await delay(250);
  }
  throw new Error("Service worker did not register.");
}

async function assertOfflineReload(cdp) {
  await cdp.send("Network.enable");
  await cdp.send("Network.emulateNetworkConditions", {
    offline: true,
    latency: 0,
    downloadThroughput: 0,
    uploadThroughput: 0,
    connectionType: "none"
  });
  try {
    await withTimeout(cdp.send("Page.navigate", { url: await evaluate(cdp, "location.href") }), 10000, "Offline reload navigation timed out.");
    await waitFor(cdp, "document.querySelector('.bottom-nav') && document.readyState === 'complete'", 10000);
    const loaded = await evaluate(cdp, `document.body.innerText.includes('Dopamine Quest')`);
    assert(loaded, "Offline reload did not render the app shell.");
  } finally {
    await cdp.send("Network.emulateNetworkConditions", {
      offline: false,
      latency: 0,
      downloadThroughput: -1,
      uploadThroughput: -1,
      connectionType: "wifi"
    });
  }
}

async function main() {
  const targetUrl = process.argv[2];
  const staticServer = targetUrl ? null : await startStaticServer();
  const url = targetUrl || staticServer.url;
  const debugPort = await getFreePort();
  const userDataDir = await mkdtemp(path.join(tmpdir(), "dq-mobile-"));
  const browser = await startBrowser(debugPort, userDataDir);
  let cdp;
  try {
    const wsUrl = await getPageWebSocket(debugPort);
    cdp = new CDP(wsUrl);
    await cdp.connect();
    const pageErrors = await bootPage(cdp, url);
    await testPwa(cdp);

    const routeResults = [];
    for (const route of ["today", "phase", "puzzles", "journal", "reports", "settings"]) {
      routeResults.push(await routeCheck(cdp, route));
    }

    await testQuestFlow(cdp);
    await testWorkModeGoal(cdp);
    await testJournalAndGoals(cdp);
    await testSettings(cdp);
    await testSudoku(cdp);
    await testDifference(cdp);
    await testLogicGrid(cdp);
    await testReportsAndData(cdp);

    if (pageErrors.length) {
      throw new Error(`Browser console/runtime errors:\n${pageErrors.join("\n")}`);
    }

    console.log(JSON.stringify({ ok: true, url, mobile: MOBILE, routes: routeResults }, null, 2));
  } finally {
    cdp?.close();
    browser.kill();
    staticServer?.server.close();
    await delay(500);
    await rm(userDataDir, { recursive: true, force: true, maxRetries: 3, retryDelay: 250 }).catch(() => {});
  }
}

main().catch((error) => {
  console.error(error.stack || error.message);
  process.exit(1);
});
