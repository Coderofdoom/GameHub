/**
 * PlayerManager — central player profile and economy.
 */
const PlayerManager = (() => {
  let player = null;

  function init() {
    player = SaveManager.loadPlayer();
    trackLogin();
    return player;
  }

  function get() {
    if (!player) init();
    return player;
  }

  function save() {
    if (player) SaveManager.savePlayer(player);
  }

  function trackLogin() {
    const now = Date.now();
    const day = 86400000;
    const last = player.lastLogin || 0;

    if (now - last > day * 2) {
      player.loginStreak = 1;
    } else if (now - last >= day) {
      player.loginStreak += 1;
    }

    player.lastLogin = now;

    if (player.loginStreak >= 3) AchievementManager.unlock(player, "streak_3", window.UIManager);
    if (player.loginStreak >= 7) AchievementManager.unlock(player, "streak_7", window.UIManager);

    save();
  }

  function addCoins(amount) {
    const booster = player.powerups?.coinBooster > 0 ? 1.5 : 1;
    const final = Math.floor(amount * booster);
    player.coins += final;
    if (player.powerups?.coinBooster > 0 && amount > 0) player.powerups.coinBooster--;
    AchievementManager.checkProgressAchievements(player);
    save();
    return final;
  }

  function addGems(amount) {
    player.gems += amount;
    AchievementManager.checkProgressAchievements(player);
    save();
    return amount;
  }

  function recordGame(gameId, { score = 0, won = false, kills = 0, combo = 0 } = {}) {
    player.gamesPlayed += 1;
    if (won) player.wins += 1;

    const stats = player.stats[gameId] || { highScore: 0, games: 0, wins: 0, kills: 0 };
    stats.games += 1;
    if (won) stats.wins += 1;
    if (score > stats.highScore) stats.highScore = score;
    stats.kills = (stats.kills || 0) + kills;
    player.stats[gameId] = stats;

    if (combo >= 10) AchievementManager.unlock(player, "combo_10", window.UIManager);
    AchievementManager.checkProgressAchievements(player);
    save();
  }

  function setUsername(name) {
    if (name && name.trim()) {
      player.username = name.trim().slice(0, 20);
      save();
    }
  }

  function updateSettings(key, value) {
    player.settings[key] = value;
    save();
  }

  function getDisplayStats() {
    return {
      username: player.username,
      level: player.level,
      xp: player.xp,
      coins: player.coins,
      gems: player.gems,
      rank: XPManager.getRank(player.level, player.prestige),
      prestige: player.prestige,
      gamesPlayed: player.gamesPlayed,
      wins: player.wins,
      achievements: player.achievements.length,
      skin: ShopManager.getItem(player.equipped.skin)?.name || "Default",
      trail: ShopManager.getItem(player.equipped.trail)?.name || "None",
      background: ShopManager.getItem(player.equipped.background)?.name || "Default",
      title: ShopManager.getItem(player.equipped.title)?.name || "Rookie",
      loginStreak: player.loginStreak,
    };
  }

  return {
    init,
    get,
    save,
    trackLogin,
    addCoins,
    addGems,
    recordGame,
    setUsername,
    updateSettings,
    getDisplayStats,
  };
})();

if (typeof window !== "undefined") window.PlayerManager = PlayerManager;
