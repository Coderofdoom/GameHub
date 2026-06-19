/**
 * SaveManager — localStorage persistence with cloud-ready schema versioning.
 */
const SaveManager = (() => {
  const SCHEMA_VERSION = 3;
  const STORAGE_KEY = "gamehub_player";
  const LEADERBOARD_KEY = "gamehub_leaderboard";
  const LOCAL_LEADERBOARD_KEY = "gamehub_local_leaderboard";
  const listeners = [];

  const DEFAULT_PLAYER = {
    schemaVersion: SCHEMA_VERSION,
    username: "Player",
    xp: 0,
    level: 1,
    prestige: 0,
    coins: 500,
    gems: 25,
    gamesPlayed: 0,
    wins: 0,
    loginStreak: 0,
    lastLogin: 0,
    lastDailyReward: 0,
    lastWeeklyReward: 0,
    achievements: [],
    ownedItems: ["skin_default", "trail_none", "bg_default", "title_rookie"],
    equipped: {
      skin: "skin_default",
      trail: "trail_none",
      background: "bg_default",
      title: "title_rookie",
      pet: "pet_none",
      effect: "effect_none",
    },
    inventory: [],
    battlePass: { tier: 0, xp: 0, premium: false, claimedTiers: [] },
    stats: {
      snake: { highScore: 0, games: 0, wins: 0, kills: 0 },
      shooter: { highScore: 0, games: 0, wins: 0, kills: 0 },
      platformer: { highScore: 0, games: 0, wins: 0, kills: 0 },
      racer: { highScore: 0, games: 0, wins: 0, kills: 0 },
      zombie: { highScore: 0, games: 0, wins: 0, kills: 0 },
      blockcraft: { highScore: 0, games: 0, wins: 0, kills: 0 },
    },
    quests: {
      daily: [],
      weekly: [],
      missions: [],
      lastDailyReset: 0,
      lastWeeklyReset: 0,
    },
    settings: {
      sfx: true,
      music: true,
      particles: true,
      screenShake: true,
      mobileControls: true,
    },
    powerups: { xpBooster: 0, coinBooster: 0, shieldBooster: 0 },
    favorites: [],
    recentlyPlayed: [],
    theme: 'dark',
    language: 'en',
  };

  function migrate(data) {
    if (!data) return structuredClone(DEFAULT_PLAYER);
    if (!data.schemaVersion) {
      data.schemaVersion = 1;
      data.coins = data.coins ?? 500;
      data.gems = data.gems ?? 25;
      data.prestige = data.prestige ?? 0;
      data.gamesPlayed = data.gamesPlayed ?? 0;
      data.wins = data.wins ?? 0;
      data.loginStreak = data.loginStreak ?? 0;
      data.lastLogin = data.lastLogin ?? 0;
      data.lastDailyReward = data.lastReward ?? data.lastDailyReward ?? 0;
      data.ownedItems = data.ownedItems ?? ["skin_default", "trail_none", "bg_default", "title_rookie"];
      data.equipped = data.equipped ?? DEFAULT_PLAYER.equipped;
      data.battlePass = data.battlePass ?? DEFAULT_PLAYER.battlePass;
      data.stats = data.stats ?? structuredClone(DEFAULT_PLAYER.stats);
      data.quests = data.quests ?? structuredClone(DEFAULT_PLAYER.quests);
      data.settings = data.settings ?? structuredClone(DEFAULT_PLAYER.settings);
      data.powerups = data.powerups ?? structuredClone(DEFAULT_PLAYER.powerups);
      data.inventory = data.inventory ?? [];
      data.favorites = data.favorites ?? [];
      data.recentlyPlayed = data.recentlyPlayed ?? [];
      data.theme = data.theme ?? 'dark';
      data.language = data.language ?? 'en';
    }
    data.schemaVersion = SCHEMA_VERSION;
    return data;
  }

  function loadPlayer() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return structuredClone(DEFAULT_PLAYER);
      return migrate(JSON.parse(raw));
    } catch {
      return structuredClone(DEFAULT_PLAYER);
    }
  }

  function savePlayer(player) {
    player.schemaVersion = SCHEMA_VERSION;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(player));
    listeners.forEach((fn) => fn(player));
  }

  function loadLeaderboard() {
    try {
      return JSON.parse(localStorage.getItem(LEADERBOARD_KEY)) || [];
    } catch {
      return [];
    }
  }

  function saveLeaderboard(board) {
    localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(board));
  }

  function loadLocalLeaderboard() {
    try {
      return JSON.parse(localStorage.getItem(LOCAL_LEADERBOARD_KEY)) || [];
    } catch {
      return [];
    }
  }

  function saveLocalLeaderboard(board) {
    localStorage.setItem(LOCAL_LEADERBOARD_KEY, JSON.stringify(board));
  }

  function exportSave() {
    return {
      player: loadPlayer(),
      leaderboard: loadLeaderboard(),
      localLeaderboard: loadLocalLeaderboard(),
      exportedAt: Date.now(),
      version: SCHEMA_VERSION,
    };
  }

  function importSave(data) {
    if (!data || !data.player) return false;
    savePlayer(migrate(data.player));
    if (data.leaderboard) saveLeaderboard(data.leaderboard);
    if (data.localLeaderboard) saveLocalLeaderboard(data.localLeaderboard);
    return true;
  }

  function resetPlayer() {
    localStorage.removeItem(STORAGE_KEY);
    return structuredClone(DEFAULT_PLAYER);
  }

  function onSave(fn) {
    listeners.push(fn);
  }

  return {
    SCHEMA_VERSION,
    STORAGE_KEY,
    DEFAULT_PLAYER,
    loadPlayer,
    savePlayer,
    loadLeaderboard,
    saveLeaderboard,
    loadLocalLeaderboard,
    saveLocalLeaderboard,
    exportSave,
    importSave,
    resetPlayer,
    onSave,
  };
})();

if (typeof window !== "undefined") window.SaveManager = SaveManager;
