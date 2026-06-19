/**
 * XPManager — XP, levels, and prestige progression.
 */
const XPManager = (() => {
  const XP_PER_LEVEL = 150;
  const PRESTIGE_LEVEL_REQ = 50;

  function xpForLevel(level) {
    return (level - 1) * XP_PER_LEVEL;
  }

  function xpToNextLevel(xp, level) {
    const currentLevelXp = xpForLevel(level);
    const nextLevelXp = xpForLevel(level + 1);
    return nextLevelXp - xp;
  }

  function levelProgress(xp, level) {
    const current = xp - xpForLevel(level);
    return Math.min(100, Math.max(0, (current / XP_PER_LEVEL) * 100));
  }

  function calculateLevel(xp) {
    return Math.floor(xp / XP_PER_LEVEL) + 1;
  }

  function addXP(player, amount, managers) {
    if (amount <= 0) return { leveledUp: false, tiers: [] };
    const booster = player.powerups?.xpBooster > 0 ? 1.5 : 1;
    const prestigeBonus = 1 + player.prestige * 0.05;
    const finalAmount = Math.floor(amount * booster * prestigeBonus);

    const oldLevel = player.level;
    player.xp += finalAmount;
    player.level = calculateLevel(player.xp);

    const leveledUp = player.level > oldLevel;
    const tiers = [];

    if (leveledUp && managers?.battlePass) {
      tiers.push(...managers.battlePass.addXP(player, (player.level - oldLevel) * 50));
    }

    if (leveledUp && managers?.achievement) {
      managers.achievement.checkLevelAchievements(player);
    }

    return { leveledUp, amount: finalAmount, oldLevel, newLevel: player.level, tiers };
  }

  function canPrestige(player) {
    return player.level >= PRESTIGE_LEVEL_REQ;
  }

  function prestige(player) {
    if (!canPrestige(player)) return false;
    player.prestige += 1;
    player.xp = 0;
    player.level = 1;
    player.gems += 50 + player.prestige * 10;
    player.coins += 1000;
    return true;
  }

  function getRank(level, prestige) {
    if (prestige >= 5) return "Transcendent";
    if (prestige >= 3) return "Ascended";
    if (prestige >= 1) return "Prestige";
    if (level >= 50) return "Legend";
    if (level >= 40) return "Master";
    if (level >= 30) return "Diamond";
    if (level >= 20) return "Platinum";
    if (level >= 10) return "Gold";
    if (level >= 5) return "Silver";
    return "Rookie";
  }

  return {
    XP_PER_LEVEL,
    PRESTIGE_LEVEL_REQ,
    xpForLevel,
    xpToNextLevel,
    levelProgress,
    calculateLevel,
    addXP,
    canPrestige,
    prestige,
    getRank,
  };
})();

if (typeof window !== "undefined") window.XPManager = XPManager;
