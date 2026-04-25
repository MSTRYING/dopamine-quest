export const STORAGE_VERSION = 1;

export const STORAGE_KEYS = {
  phases: "dq_phases",
  dailyLog: "dq_daily_log",
  gratitude: "dq_gratitude_journal",
  weeklyGoals: "dq_weekly_goals",
  monthlyGoals: "dq_monthly_goals",
  settings: "dq_settings",
  streaks: "dq_streaks",
  achievements: "dq_achievements",
  character: "dq_character",
  analytics: "dq_analytics",
  puzzles: "dq_puzzles",
  meta: "dq_meta"
};

export const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export const QUOTES = [
  "Tiny rituals become enormous magic when you keep showing up.",
  "The mountain is climbed by pebbles with ambition.",
  "Your brain is not broken. It is a glitter cannon with tabs open.",
  "Do the next kind thing. Momentum loves a breadcrumb.",
  "One candle can bully a surprising amount of darkness.",
  "Discipline is just devotion wearing practical shoes.",
  "You are allowed to begin again without filing paperwork with shame."
];

export const LEVEL_TITLES = [
  { level: 1, title: "Pebble Padawan", card: "The Small Beginning" },
  { level: 3, title: "Stone-Cold Beginner", card: "The First Spark" },
  { level: 5, title: "Rough Diamond", card: "The Pressure Cooker" },
  { level: 8, title: "Crystal Curious", card: "The Glimmer Goblin" },
  { level: 12, title: "Quartz Quester", card: "The Polished Path" },
  { level: 18, title: "Amethyst Acolyte", card: "The Purple Prophet" },
  { level: 25, title: "Obsidian Oracle", card: "The Shadow Snack" },
  { level: 35, title: "Gemstone Guardian", card: "The Sacred Sorting Hat" },
  { level: 50, title: "Crystal Clear", card: "The No-Notes Mystic" },
  { level: 70, title: "Philosopher's Stoner", card: "The Cosmic Giggle" },
  { level: 99, title: "Fully Faceted", card: "The Many-Sided Miracle" },
  { level: 100, title: "Sage Harvester", card: "The Harvested Sage" }
];

export const MONTHLY_THEMES = [
  {
    id: "cosmic-reset",
    month: 0,
    name: "Cosmic Reset",
    tagline: "New year, same gorgeous chaos, better quest log.",
    palette: ["#040614", "#1029a6", "#f8c76a", "#6fd7e3"],
    vars: {
      "--bg-a": "#040614",
      "--bg-b": "#101b4f",
      "--bg-c": "#120817",
      "--accent": "#6fd7e3",
      "--accent-2": "#f8c76a",
      "--accent-3": "#7c5cff",
      "--card": "rgba(14, 20, 45, 0.72)"
    }
  },
  {
    id: "valentines",
    month: 1,
    name: "Valentine's",
    tagline: "Romance, rose-gold, and tiny acts of self-devotion.",
    palette: ["#1b0710", "#a31645", "#f7a6c2", "#ffd1a9"],
    vars: {
      "--bg-a": "#1b0710",
      "--bg-b": "#4b0c22",
      "--bg-c": "#160716",
      "--accent": "#f7a6c2",
      "--accent-2": "#ffd1a9",
      "--accent-3": "#ff4f8b",
      "--card": "rgba(55, 12, 35, 0.72)"
    }
  },
  {
    id: "birthday-month",
    month: 2,
    name: "Birthday Month",
    tagline: "Purple, gold, and main-character renewal.",
    palette: ["#10061d", "#5c24a3", "#f8d66d", "#ffffff"],
    vars: {
      "--bg-a": "#10061d",
      "--bg-b": "#35135f",
      "--bg-c": "#08040f",
      "--accent": "#b890ff",
      "--accent-2": "#f8d66d",
      "--accent-3": "#ffffff",
      "--card": "rgba(42, 18, 69, 0.74)"
    }
  },
  {
    id: "autumn",
    month: 3,
    name: "Autumn",
    tagline: "Burnt orange, purple, gold, and harvest-brain softness.",
    palette: ["#170b08", "#b64a1b", "#4b197a", "#e9b949"],
    vars: {
      "--bg-a": "#170b08",
      "--bg-b": "#4a170d",
      "--bg-c": "#251035",
      "--accent": "#e66a2c",
      "--accent-2": "#e9b949",
      "--accent-3": "#9f6bff",
      "--card": "rgba(58, 24, 23, 0.74)"
    }
  },
  {
    id: "star-wars",
    month: 4,
    name: "Star Wars",
    tagline: "May the focus be with you.",
    palette: ["#020407", "#0d1b2a", "#4dffef", "#ff3d3d"],
    vars: {
      "--bg-a": "#020407",
      "--bg-b": "#0d1b2a",
      "--bg-c": "#120912",
      "--accent": "#4dffef",
      "--accent-2": "#ffe66d",
      "--accent-3": "#ff3d3d",
      "--card": "rgba(10, 18, 28, 0.78)"
    }
  },
  {
    id: "winter",
    month: 5,
    name: "Winter",
    tagline: "Ice blue, indigo, aurora, and blanket-based excellence.",
    palette: ["#03111f", "#12245d", "#9ee7ff", "#d8f3ff"],
    vars: {
      "--bg-a": "#03111f",
      "--bg-b": "#12245d",
      "--bg-c": "#061426",
      "--accent": "#9ee7ff",
      "--accent-2": "#d8f3ff",
      "--accent-3": "#7c9cff",
      "--card": "rgba(12, 30, 58, 0.72)"
    }
  },
  {
    id: "psychedelia",
    month: 6,
    name: "Psychedelia",
    tagline: "Bioluminescent mushrooms, trippy neons, responsible weirdness.",
    palette: ["#080515", "#581c87", "#ff3dd8", "#7cff6b"],
    vars: {
      "--bg-a": "#080515",
      "--bg-b": "#2c0f55",
      "--bg-c": "#001f23",
      "--accent": "#ff3dd8",
      "--accent-2": "#7cff6b",
      "--accent-3": "#46f7ff",
      "--card": "rgba(38, 15, 65, 0.72)"
    }
  },
  {
    id: "womens-month",
    month: 7,
    name: "Women's Month",
    tagline: "Fuchsia, gold, power, and unbothered competence.",
    palette: ["#190318", "#9c1a80", "#f5c542", "#bb7cff"],
    vars: {
      "--bg-a": "#190318",
      "--bg-b": "#4a0f48",
      "--bg-c": "#150920",
      "--accent": "#ff5bd8",
      "--accent-2": "#f5c542",
      "--accent-3": "#bb7cff",
      "--card": "rgba(58, 12, 58, 0.72)"
    }
  },
  {
    id: "spring",
    month: 8,
    name: "Spring",
    tagline: "Fresh greens, floral pinks, warm yellows, and tiny rebellions.",
    palette: ["#07170e", "#1d7a46", "#ff8fbd", "#f8d66d"],
    vars: {
      "--bg-a": "#07170e",
      "--bg-b": "#123b26",
      "--bg-c": "#1e1020",
      "--accent": "#69e18f",
      "--accent-2": "#ff8fbd",
      "--accent-3": "#f8d66d",
      "--card": "rgba(13, 49, 31, 0.72)"
    }
  },
  {
    id: "halloween",
    month: 9,
    name: "Halloween",
    tagline: "Witch purple, candlelight, and spooky little checkboxes.",
    palette: ["#080508", "#f97316", "#7e22ce", "#facc15"],
    vars: {
      "--bg-a": "#080508",
      "--bg-b": "#351008",
      "--bg-c": "#1b082b",
      "--accent": "#f97316",
      "--accent-2": "#facc15",
      "--accent-3": "#a855f7",
      "--card": "rgba(35, 15, 22, 0.76)"
    }
  },
  {
    id: "dinosaurs",
    month: 10,
    name: "Sophisticated Dinosaurs",
    tagline: "Museum-grade fossils. Absolutely no cartoon nonsense.",
    palette: ["#100d08", "#8a5a2b", "#c49a5a", "#52606d"],
    vars: {
      "--bg-a": "#100d08",
      "--bg-b": "#2a2118",
      "--bg-c": "#111820",
      "--accent": "#c49a5a",
      "--accent-2": "#8fd0b0",
      "--accent-3": "#8aa1b2",
      "--card": "rgba(38, 31, 24, 0.76)"
    }
  },
  {
    id: "festive-summer",
    month: 11,
    name: "Festive Summer",
    tagline: "Sun-drenched cheer, warm gold, and year-end confetti.",
    palette: ["#160707", "#b91c1c", "#1d7a46", "#f7c948"],
    vars: {
      "--bg-a": "#160707",
      "--bg-b": "#4d1010",
      "--bg-c": "#092015",
      "--accent": "#f7c948",
      "--accent-2": "#4ade80",
      "--accent-3": "#ff6b6b",
      "--card": "rgba(58, 22, 18, 0.74)"
    }
  }
];

export const ACHIEVEMENTS = [
  { id: "first-step", name: "First Step", desc: "Complete any task for the first time." },
  { id: "early-bird", name: "Early Bird", desc: "Complete Morning Routine before 08:00 seven times." },
  { id: "iron-will", name: "Iron Will", desc: "Hold a 30-day streak." },
  { id: "grateful-soul", name: "Grateful Soul", desc: "Log 30 unique gratitude entries." },
  { id: "the-chef", name: "The Chef", desc: "Complete Dinner Mode 20 times." },
  { id: "sweat-equity", name: "Sweat Equity", desc: "Complete 20 workouts." },
  { id: "perfect-week", name: "Perfect Week", desc: "Hit Platinum seven days in a row." },
  { id: "sunday-sage", name: "Sunday Sage", desc: "Complete Sunday planning four weeks in a row." }
];

export const DEFAULT_SETTINGS = {
  version: STORAGE_VERSION,
  dailyXpGoal: 0,
  autoDailyGoal: true,
  preferredMusicPlatform: "Apple Music",
  musicLinks: {
    "High Energy": "",
    Focus: "",
    Calm: "",
    Ambient: "",
    Restaurant: "",
    Uplifting: ""
  },
  gratitudeWindowDays: 21,
  streakSoftReset: true,
  sabbathMode: true,
  sabbathDay: 0,
  animations: true,
  activeThemeId: "",
  lastThemeSwapMonth: "",
  lastMonthReportSeen: "",
  puzzleXpBonus: 30
};

export const DEFAULT_CHARACTER = {
  totalXp: 0,
  level: 1,
  title: "Pebble Padawan",
  lastLevel: 1,
  unlockedThemes: ["cosmic-reset"],
  titleHistory: [],
  prestigeHistory: []
};

export const DEFAULT_STREAKS = {
  current: 0,
  longest: 0,
  lastActiveDate: "",
  tierHistory: {},
  perfectDays: 0,
  softResetDrops: 0
};

export const DEFAULT_ACHIEVEMENTS_STATE = {
  unlocked: {},
  counters: {},
  badges: []
};

export const DEFAULT_ANALYTICS = {
  taskStats: {},
  phaseStats: {},
  xpByDate: {},
  completionHeatmap: {},
  insightsDismissed: {}
};

export const DEFAULT_PUZZLES = {
  history: [],
  brainProfile: {
    favoriteTypes: {},
    averageEnjoyment: {},
    averageDifficulty: {},
    recommendedType: "logic-grid",
    recommendedDifficulty: "hard",
    reason: "No ratings yet. Starting with structured deduction because it gives the clearest signal."
  },
  unlocks: {}
};

export const DEFAULT_PHASES = [
  {
    id: "morning-ignition",
    name: "Morning Ignition",
    icon: "sun",
    color: "#ff7b54",
    description: "Light the pilot flame before the day starts asking questions.",
    active: true,
    trigger: { type: "first-open", label: "First app open of the day", time: "" },
    days: [0, 1, 2, 3, 4, 5, 6],
    music: { playlist: "", mood: "Uplifting", bpm: "120-150 BPM" },
    intro: "Daily quote",
    mandatoryEnd: { enabled: false, prompt: "" },
    closeStyle: "Minimal",
    xp: { completionBonus: 0, speedBonus: 0, streakBonus: false },
    tasks: [
      {
        id: "good-today",
        name: "Answer: What good will I do today?",
        duration: 3,
        xp: 10,
        type: "Mandatory",
        frequencyDays: 0,
        bonusCondition: "",
        sound: "Subtle",
        inputPrompt: "What good will I do today?"
      }
    ]
  },
  {
    id: "morning-routine",
    name: "Morning Routine",
    icon: "spark",
    color: "#ffb26b",
    description: "The gentle boss battle where socks become destiny.",
    active: true,
    trigger: { type: "after-phase", label: "After Morning Ignition", afterPhaseId: "morning-ignition", time: "" },
    days: [0, 1, 2, 3, 4, 5, 6],
    music: { playlist: "", mood: "High Energy", bpm: "140-160 BPM" },
    intro: "Momentum is a spell. Cast it badly if needed.",
    mandatoryEnd: { enabled: false, prompt: "" },
    closeStyle: "Celebration",
    xp: { completionBonus: 50, speedBonus: 25, streakBonus: false },
    tasks: [
      { id: "make-bed", name: "Make the bed", duration: 5, xp: 20, type: "Standard", frequencyDays: 0, bonusCondition: "", sound: "Satisfying" },
      { id: "brush-teeth", name: "Brush teeth", duration: 3, xp: 10, type: "Standard", frequencyDays: 0, bonusCondition: "", sound: "Subtle" },
      { id: "make-breakfast", name: "Make breakfast", duration: 15, xp: 25, type: "Standard", frequencyDays: 0, bonusCondition: "", sound: "Satisfying" },
      { id: "feed-cats", name: "Feed the cats", duration: 3, xp: 15, type: "Standard", frequencyDays: 0, bonusCondition: "", sound: "Epic" },
      { id: "ready-work", name: "Get ready for work", duration: 20, xp: 30, type: "Standard", frequencyDays: 0, bonusCondition: "", sound: "Satisfying" }
    ]
  },
  {
    id: "work-mode",
    name: "Work Mode",
    icon: "focus",
    color: "#6fa8ff",
    description: "Professional goblin containment field.",
    active: true,
    trigger: { type: "manual", label: "I'm at work", time: "" },
    days: [0, 1, 2, 3, 4, 5, 6],
    music: { playlist: "", mood: "Focus", bpm: "" },
    intro: "Pick the next clean line through the fog.",
    mandatoryEnd: { enabled: false, prompt: "" },
    closeStyle: "Minimal",
    xp: { completionBonus: 0, speedBonus: 0, streakBonus: false },
    tasks: [
      { id: "weekly-goal", name: "Lock in weekly goal", duration: 10, xp: 30, type: "Mandatory", days: [0, 1], frequencyDays: 0, bonusCondition: "Sunday or Monday planning", sound: "Satisfying", inputPrompt: "What is the weekly goal?" },
      { id: "daily-progress", name: "Log daily work progress update", duration: 5, xp: 20, type: "Mandatory", frequencyDays: 0, bonusCondition: "", sound: "Subtle", inputPrompt: "What moved forward today?" }
    ]
  },
  {
    id: "evening-ignition",
    name: "Evening Ignition",
    icon: "bolt",
    color: "#9b7bff",
    description: "Transition spell: from outside-world mode to home wizard.",
    active: true,
    trigger: { type: "manual", label: "I'm home", time: "" },
    days: [0, 1, 2, 3, 4, 5, 6],
    music: { playlist: "", mood: "High Energy", bpm: "Psytrance / Techno" },
    intro: "The couch is persuasive. Be more dramatic than the couch.",
    mandatoryEnd: { enabled: false, prompt: "" },
    closeStyle: "Celebration",
    xp: { completionBonus: 60, speedBonus: 0, streakBonus: false },
    tasks: [
      { id: "cook-supper", name: "Cook supper", duration: 30, xp: 40, type: "Standard", frequencyDays: 0, bonusCondition: "", sound: "Satisfying" },
      { id: "pack-lunchboxes", name: "Pack lunchboxes", duration: 10, xp: 20, type: "Standard", frequencyDays: 0, bonusCondition: "", sound: "Subtle" },
      { id: "water-plants", name: "Water house plants", duration: 5, xp: 15, type: "Standard", frequencyDays: 0, bonusCondition: "", sound: "Subtle" },
      { id: "clean-kitchen", name: "Clean the kitchen", duration: 20, xp: 30, type: "Standard", frequencyDays: 0, bonusCondition: "", sound: "Epic" },
      { id: "daily-washing", name: "Daily washing", duration: 10, xp: 20, type: "Standard", frequencyDays: 0, bonusCondition: "", sound: "Satisfying" }
    ]
  },
  {
    id: "dinner-mode",
    name: "Dinner Mode",
    icon: "candle",
    color: "#f49cc6",
    description: "Restaurant ambience, domestic edition.",
    active: true,
    trigger: { type: "manual", label: "Fiance is home", time: "" },
    days: [0, 1, 2, 3, 4, 5, 6],
    music: { playlist: "", mood: "Restaurant", bpm: "Ambient" },
    intro: "Set the scene. Romance likes mise en place.",
    mandatoryEnd: { enabled: false, prompt: "" },
    closeStyle: "Celebration",
    xp: { completionBonus: 0, speedBonus: 0, streakBonus: false },
    tasks: [
      { id: "set-table", name: "Set the table", duration: 5, xp: 20, type: "Standard", frequencyDays: 0, bonusCondition: "", sound: "Satisfying" },
      { id: "table-decor", name: "Table decor", duration: 3, xp: 15, type: "Bonus", frequencyDays: 0, bonusCondition: "Add table decor", sound: "Epic" },
      { id: "light-candle", name: "Light a candle", duration: 1, xp: 15, type: "Bonus", frequencyDays: 0, bonusCondition: "Light a candle", sound: "Epic" }
    ]
  },
  {
    id: "workout",
    name: "Workout",
    icon: "flame",
    color: "#ff5b8a",
    description: "Sweat equity, but make it sacred.",
    active: true,
    trigger: { type: "manual", label: "Start workout", time: "" },
    days: [0, 1, 2, 3, 4, 5, 6],
    music: { playlist: "", mood: "High Energy", bpm: "140-170 BPM" },
    intro: "Move the vessel. The spirit likes circulation.",
    mandatoryEnd: { enabled: true, prompt: "What workout type did you do?" },
    closeStyle: "Fireworks",
    xp: { completionBonus: 0, speedBonus: 0, streakBonus: true },
    tasks: [
      { id: "workout-45", name: "45-minute workout", duration: 45, xp: 100, type: "Standard", frequencyDays: 0, bonusCondition: "", sound: "Epic" },
      { id: "log-workout-type", name: "Log workout type", duration: 2, xp: 0, type: "Mandatory", frequencyDays: 0, bonusCondition: "strength / cardio / yoga / walk / other", sound: "Subtle", inputPrompt: "Workout type" }
    ]
  },
  {
    id: "bath-self-care",
    name: "Bath & Self-Care",
    icon: "drop",
    color: "#6fd7e3",
    description: "Soft reset for the skin-suit and soul.",
    active: true,
    trigger: { type: "manual", label: "Start self-care", time: "" },
    days: [0, 1, 2, 3, 4, 5, 6],
    music: { playlist: "", mood: "Calm", bpm: "Slow" },
    intro: "Water is a portal. Enter dramatically.",
    mandatoryEnd: { enabled: false, prompt: "" },
    closeStyle: "Minimal",
    xp: { completionBonus: 0, speedBonus: 0, streakBonus: false },
    tasks: [
      { id: "face-care", name: "Face care routine", duration: 10, xp: 25, type: "Standard", frequencyDays: 0, bonusCondition: "Sub-steps optional", sound: "Satisfying" },
      { id: "moisturise", name: "Moisturise", duration: 5, xp: 15, type: "Standard", frequencyDays: 0, bonusCondition: "", sound: "Subtle" },
      { id: "wash-hair", name: "Wash hair", duration: 15, xp: 20, type: "Alternating", frequencyDays: 3, bonusCondition: "Every 3 days", sound: "Epic" },
      { id: "shave-legs", name: "Shave legs", duration: 15, xp: 20, type: "Alternating", frequencyDays: 3, bonusCondition: "Every 3 days", sound: "Satisfying" },
      { id: "full-exfoliation", name: "Full exfoliation", duration: 15, xp: 30, type: "Alternating", frequencyDays: 7, bonusCondition: "Every 7 days", sound: "Epic" }
    ]
  },
  {
    id: "day-close",
    name: "Day Close",
    icon: "moon",
    color: "#4b5ba6",
    description: "Close the portal gently. File today's magic.",
    active: true,
    trigger: { type: "manual", label: "Before bed", time: "" },
    days: [0, 1, 2, 3, 4, 5, 6],
    music: { playlist: "", mood: "Calm", bpm: "Slow" },
    intro: "No matter how messy it was, you came back to yourself.",
    mandatoryEnd: { enabled: false, prompt: "" },
    closeStyle: "Fireworks",
    xp: { completionBonus: 0, speedBonus: 0, streakBonus: false },
    tasks: [
      { id: "kindness-reminder", name: "Kindness reminder", duration: 1, xp: 0, type: "Display", frequencyDays: 0, bonusCondition: "You deserve gentleness too.", sound: "Subtle" },
      { id: "log-gratitude", name: "Log gratitude", duration: 5, xp: 20, type: "Mandatory", frequencyDays: 0, bonusCondition: "Must be unique within the gratitude window", sound: "Satisfying", inputPrompt: "One thing I am grateful for" }
    ]
  }
];

export const LOGIC_GRID_TEMPLATES = [
  {
    id: "evening-schedule",
    title: "Evening Portal Planner",
    difficulty: "hard",
    prompt: "Match each task to its correct time and mood.",
    categories: {
      Task: ["Cook", "Plants", "Workout"],
      Time: ["18:00", "19:00", "20:00"],
      Mood: ["Techno", "Calm", "Focus"]
    },
    clues: [
      "Workout is later than Plants.",
      "Cook is paired with Techno.",
      "The Calm mood happens at 19:00.",
      "Plants are not at 20:00."
    ],
    solution: {
      Cook: { Time: "18:00", Mood: "Techno" },
      Plants: { Time: "19:00", Mood: "Calm" },
      Workout: { Time: "20:00", Mood: "Focus" }
    }
  },
  {
    id: "crystal-errands",
    title: "Crystal Errand Conspiracy",
    difficulty: "expert",
    prompt: "Assign each crystal to a shelf and quest.",
    categories: {
      Crystal: ["Quartz", "Amethyst", "Obsidian"],
      Shelf: ["Top", "Middle", "Bottom"],
      Quest: ["Focus", "Rest", "Courage"]
    },
    clues: [
      "Obsidian is not on the Top shelf.",
      "The Focus crystal is Quartz.",
      "Amethyst is above the Courage crystal.",
      "Rest is on the Middle shelf."
    ],
    solution: {
      Quartz: { Shelf: "Top", Quest: "Focus" },
      Amethyst: { Shelf: "Middle", Quest: "Rest" },
      Obsidian: { Shelf: "Bottom", Quest: "Courage" }
    }
  }
];

export const SUDOKU_PUZZLES = {
  easy: {
    puzzle: "530070000600195000098000060800060003400803001700020006060000280000419005000080079",
    solution: "534678912672195348198342567859761423426853791713924856961537284287419635345286179"
  },
  medium: {
    puzzle: "000260701680070090190004500820100040004602900050003028009300074040050036703018000",
    solution: "435269781682571493197834562826195347374682915951743628519326874248957136763418259"
  },
  hard: {
    puzzle: "000000907000420180000705026100904000050000040000507009920108000034059000507000000",
    solution: "462831957795426183381795426173984265659312748248567319926178534834259671517643892"
  },
  expert: {
    puzzle: "100007090030020008009600500005300900010080002600004000300000010040000007007000300",
    solution: "162857493534129678789643521475312986913586742628794135356478219241935867897261354"
  }
};

export const DIFFERENCE_SCENES = [
  {
    id: "mushroom-museum",
    title: "Museum of Respectable Mushrooms",
    difficulty: "hard",
    differences: [
      { id: "star", x: 72, y: 68, r: 18, label: "missing star" },
      { id: "cap", x: 236, y: 128, r: 22, label: "changed mushroom cap" },
      { id: "gem", x: 126, y: 250, r: 18, label: "extra crystal" },
      { id: "moon", x: 292, y: 46, r: 18, label: "shifted moon" },
      { id: "fern", x: 52, y: 302, r: 20, label: "different fern" }
    ]
  }
];
