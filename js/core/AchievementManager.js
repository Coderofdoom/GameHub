/**
 * AchievementManager — unlockable achievements across GameHub.
 */
const AchievementManager = (() => {
  const DEFINITIONS = [
    { id: "first_game", name: "First Steps", desc: "Play your first game", icon: "🎮", reward: { coins: 50, xp: 25 } },
    { id: "first_win", name: "First Win", desc: "Win any game", icon: "🏆", reward: { coins: 100, xp: 50 } },
    { id: "daily_claim", name: "Daily Grind", desc: "Claim a daily reward", icon: "📅", reward: { coins: 25, xp: 25 } },
    { id: "streak_3", name: "On Fire", desc: "3-day login streak", icon: "🔥", reward: { coins: 75, gems: 5 } },
    { id: "streak_7", name: "Dedicated", desc: "7-day login streak", icon: "💪", reward: { coins: 200, gems: 15 } },
    { id: "level_5", name: "Rising Star", desc: "Reach level 5", icon: "⭐", reward: { coins: 100 } },
    { id: "level_10", name: "Veteran", desc: "Reach level 10", icon: "🎖️", reward: { coins: 250, gems: 10 } },
    { id: "level_25", name: "Elite", desc: "Reach level 25", icon: "💎", reward: { coins: 500, gems: 25 } },
    { id: "level_50", name: "Legendary", desc: "Reach level 50", icon: "👑", reward: { coins: 1000, gems: 50 } },
    { id: "shop_first", name: "Shopper", desc: "Buy your first item", icon: "🛒", reward: { xp: 50 } },
    { id: "coins_1000", name: "Coin Collector", desc: "Hold 1000 coins", icon: "🪙", reward: { xp: 100 } },
    { id: "gems_50", name: "Gem Hoarder", desc: "Hold 50 gems", icon: "💠", reward: { xp: 150 } },
    { id: "games_10", name: "Arcade Regular", desc: "Play 10 games", icon: "🕹️", reward: { coins: 150 } },
    { id: "games_50", name: "Marathon", desc: "Play 50 games", icon: "🏃", reward: { coins: 500, gems: 20 } },
    { id: "prestige_1", name: "Reborn", desc: "Prestige once", icon: "🔄", reward: { gems: 30 } },
    { id: "snake_100", name: "Serpent Master", desc: "Score 100 in Snake", icon: "🐍", reward: { coins: 200 } },
    { id: "shooter_500", name: "Ace Pilot", desc: "Score 500 in Space Shooter", icon: "🚀", reward: { coins: 200 } },
    { id: "platformer_500", name: "Platform Pro", desc: "Score 500 in Platformer", icon: "🏔️", reward: { coins: 200 } },
    { id: "racer_1000", name: "Speed Demon", desc: "Score 1000 in Racer", icon: "🏎️", reward: { coins: 200 } },
    { id: "zombie_50", name: "Survivor", desc: "Kill 50 zombies", icon: "🧟", reward: { coins: 250 } },
    { id: "blockcraft_survive", name: "Builder", desc: "Survive a night in BlockCraft", icon: "⛏️", reward: { coins: 200 } },
    { id: "battlepass_5", name: "Pass Holder", desc: "Reach Battle Pass tier 5", icon: "🎫", reward: { gems: 15 } },
    { id: "equip_neon", name: "Neon Style", desc: "Equip the Neon Skin", icon: "✨", reward: { xp: 75 } },
    { id: "combo_10", name: "Combo King", desc: "Get a 10x combo in any game", icon: "⚡", reward: { coins: 100 } },
  ];

  function has(player, id) {
    return player.achievements.includes(id);
  }

  function unlock(player, id, ui) {
    if (has(player, id)) return false;
    const def = DEFINITIONS.find((a) => a.id === id);
    if (!def) return false;

    player.achievements.push(id);
    if (def.reward?.coins) player.coins += def.reward.coins;
    if (def.reward?.gems) player.gems += def.reward.gems;
    if (def.reward?.xp && window.XPManager) {
      window.XPManager.addXP(player, def.reward.xp, window.GameHub?.managers);
    }

    if (ui) {
      ui.toast(`${def.icon} Achievement: ${def.name}`, "achievement");
    }
    return def;
  }

  function checkLevelAchievements(player) {
    if (player.level >= 5) unlock(player, "level_5");
    if (player.level >= 10) unlock(player, "level_10");
    if (player.level >= 25) unlock(player, "level_25");
    if (player.level >= 50) unlock(player, "level_50");
  }

  function checkProgressAchievements(player) {
    if (player.gamesPlayed >= 1) unlock(player, "first_game");
    if (player.gamesPlayed >= 10) unlock(player, "games_10");
    if (player.gamesPlayed >= 50) unlock(player, "games_50");
    if (player.wins >= 1) unlock(player, "first_win");
    if (player.coins >= 1000) unlock(player, "coins_1000");
    if (player.gems >= 50) unlock(player, "gems_50");
    if (player.prestige >= 1) unlock(player, "prestige_1");
    if (player.battlePass?.tier >= 5) unlock(player, "battlepass_5");
    if (player.equipped?.skin === "skin_neon") unlock(player, "equip_neon");

    const s = player.stats || {};
    if (s.snake?.highScore >= 100) unlock(player, "snake_100");
    if (s.shooter?.highScore >= 500) unlock(player, "shooter_500");
    if (s.platformer?.highScore >= 500) unlock(player, "platformer_500");
    if (s.racer?.highScore >= 1000) unlock(player, "racer_1000");
    if (s.zombie?.kills >= 50) unlock(player, "zombie_50");
  }

  function getAll() {
    return DEFINITIONS;
  }

  function getUnlocked(player) {
    return DEFINITIONS.filter((a) => has(player, a.id));
  }

  function getLocked(player) {
    return DEFINITIONS.filter((a) => !has(player, a.id));
  }

  return {
    DEFINITIONS,
    has,
    unlock,
    checkLevelAchievements,
    checkProgressAchievements,
    getAll,
    getUnlocked,
    getLocked,
  };
})();

if (typeof window !== "undefined") window.AchievementManager = AchievementManager;
