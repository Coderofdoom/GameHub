/**
 * BattlePassManager — seasonal tier progression.
 */
const BattlePassManager = (() => {
  const MAX_TIER = 30;
  const XP_PER_TIER = 200;

  const REWARDS = [
    { tier: 1, free: { coins: 50 }, premium: { gems: 5 } },
    { tier: 2, free: { xp: 50 }, premium: { coins: 100 } },
    { tier: 3, free: { coins: 75 }, premium: { gems: 8 } },
    { tier: 4, free: { xp: 75 }, premium: { coins: 150 } },
    { tier: 5, free: { coins: 100, gems: 3 }, premium: { gems: 15 } },
    { tier: 6, free: { xp: 100 }, premium: { coins: 200 } },
    { tier: 7, free: { coins: 125 }, premium: { gems: 10 } },
    { tier: 8, free: { xp: 125 }, premium: { coins: 250 } },
    { tier: 9, free: { coins: 150 }, premium: { gems: 12 } },
    { tier: 10, free: { coins: 200, gems: 5 }, premium: { gems: 25 } },
    { tier: 15, free: { coins: 300, gems: 10 }, premium: { gems: 40 } },
    { tier: 20, free: { coins: 500, gems: 15 }, premium: { gems: 60 } },
    { tier: 25, free: { coins: 750, gems: 20 }, premium: { gems: 80 } },
    { tier: 30, free: { coins: 1000, gems: 50 }, premium: { gems: 100 } },
  ];

  function addXP(player, amount) {
    player.battlePass.xp += amount;
    const newTiers = [];

    while (player.battlePass.xp >= XP_PER_TIER && player.battlePass.tier < MAX_TIER) {
      player.battlePass.xp -= XP_PER_TIER;
      player.battlePass.tier += 1;
      newTiers.push(player.battlePass.tier);
    }

    if (player.battlePass.tier >= 5) {
      AchievementManager.unlock(player, "battlepass_5", window.UIManager);
    }

    return newTiers;
  }

  function getRewardForTier(tier) {
    return REWARDS.find((r) => r.tier === tier) || null;
  }

  function claimTier(player, tier, premium = false) {
    const key = premium ? `p${tier}` : `f${tier}`;
    if (player.battlePass.claimedTiers.includes(key)) return false;
    if (player.battlePass.tier < tier) return false;
    if (premium && !player.battlePass.premium) return false;

    const reward = getRewardForTier(tier);
    if (!reward) return false;

    const pack = premium ? reward.premium : reward.free;
    if (pack.xp) XPManager.addXP(player, pack.xp, window.GameHub?.managers);
    if (pack.coins) player.coins += pack.coins;
    if (pack.gems) player.gems += pack.gems;

    player.battlePass.claimedTiers.push(key);
    return pack;
  }

  function buyPremium(player) {
    if (player.battlePass.premium) return false;
    if (player.gems < 500) return false;
    player.gems -= 500;
    player.battlePass.premium = true;
    return true;
  }

  function tierProgress(player) {
    return (player.battlePass.xp / XP_PER_TIER) * 100;
  }

  return { MAX_TIER, XP_PER_TIER, REWARDS, addXP, getRewardForTier, claimTier, buyPremium, tierProgress };
})();

if (typeof window !== "undefined") window.BattlePassManager = BattlePassManager;
