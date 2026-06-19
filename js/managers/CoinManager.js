/**
 * CoinManager — Unified economy operations with multipliers and boosters
 */
const CoinManager = (() => {
  let player = null;

  function init(playerRef) {
    player = playerRef;
  }

  function addCoins(amount, config = {}) {
    if (!player) return 0;
    
    let final = Math.floor(amount);
    
    // Apply multipliers
    if (config.multiplier) final = Math.floor(final * config.multiplier);
    if (player.powerups?.coinBooster && config.booster !== false) {
      final = Math.floor(final * 1.5);
      player.powerups.coinBooster--;
    }
    if (player.achievements?.includes('double_coins')) {
      final = Math.floor(final * 2);
    }

    player.coins = Math.max(0, player.coins + final);
    
    if (config.sound) AudioManager?.play('coin');
    if (config.particle) ParticleManager?.emit('coin', 0, 0, { count: 3, color: '#00ff88' });
    
    return final;
  }

  function removeCoins(amount) {
    if (!player) return false;
    if (player.coins < amount) return false;
    player.coins -= amount;
    return true;
  }

  function hasCoins(amount) {
    return player && player.coins >= amount;
  }

  function addGems(amount, config = {}) {
    if (!player) return 0;
    
    let final = Math.floor(amount);
    if (config.multiplier) final = Math.floor(final * config.multiplier);
    
    player.gems = Math.max(0, player.gems + final);
    
    if (config.sound) AudioManager?.play('levelUp');
    
    return final;
  }

  function removeGems(amount) {
    if (!player) return false;
    if (player.gems < amount) return false;
    player.gems -= amount;
    return true;
  }

  function hasGems(amount) {
    return player && player.gems >= amount;
  }

  function getBalance() {
    return player ? { coins: player.coins, gems: player.gems } : { coins: 0, gems: 0 };
  }

  function transaction(cost, currency = 'coins') {
    const hasEnough = currency === 'coins' ? hasCoins(cost) : hasGems(cost);
    if (!hasEnough) return false;
    
    if (currency === 'coins') {
      removeCoins(cost);
    } else {
      removeGems(cost);
    }
    
    return true;
  }

  return {
    init,
    addCoins,
    removeCoins,
    hasCoins,
    addGems,
    removeGems,
    hasGems,
    getBalance,
    transaction
  };
})();

if (typeof window !== "undefined") window.CoinManager = CoinManager;
