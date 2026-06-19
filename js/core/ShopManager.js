/**
 * ShopManager — cosmetics, powerups, and currency purchases.
 */
const ShopManager = (() => {
  const CATALOG = [
    { id: "skin_default", name: "Default Skin", category: "skins", price: 0, currency: "coins", color: "#00f7ff" },
    { id: "skin_neon", name: "Neon Skin", category: "skins", price: 500, currency: "coins", color: "#00ff88" },
    { id: "skin_diamond", name: "Diamond Skin", category: "skins", price: 50, currency: "gems", color: "#b9f2ff" },
    { id: "skin_fire", name: "Fire Skin", category: "skins", price: 800, currency: "coins", color: "#ff4400" },
    { id: "skin_cyber", name: "Cyber Skin", category: "skins", price: 75, currency: "gems", color: "#c300ff" },
    { id: "char_robot", name: "Robot", category: "characters", price: 1200, currency: "coins", color: "#8899aa" },
    { id: "char_ninja", name: "Shadow Ninja", category: "characters", price: 100, currency: "gems", color: "#333344" },
    { id: "char_alien", name: "Alien", category: "characters", price: 1500, currency: "coins", color: "#00ff00" },
    { id: "trail_none", name: "No Trail", category: "trails", price: 0, currency: "coins", color: "transparent" },
    { id: "trail_fire", name: "Fire Trail", category: "trails", price: 400, currency: "coins", color: "#ff6600" },
    { id: "trail_rainbow", name: "Rainbow Trail", category: "trails", price: 60, currency: "gems", color: "rainbow" },
    { id: "trail_ice", name: "Ice Trail", category: "trails", price: 350, currency: "coins", color: "#88ddff" },
    { id: "bg_default", name: "Default BG", category: "backgrounds", price: 0, currency: "coins", color: "#050816" },
    { id: "bg_cyber", name: "Cyber Background", category: "backgrounds", price: 600, currency: "coins", color: "#0a1628" },
    { id: "bg_space", name: "Space Background", category: "backgrounds", price: 80, currency: "gems", color: "#0d0221" },
    { id: "bg_neon_city", name: "Neon City", category: "backgrounds", price: 900, currency: "coins", color: "#1a0030" },
    { id: "effect_none", name: "No Effect", category: "effects", price: 0, currency: "coins", color: "transparent" },
    { id: "effect_sparkle", name: "Sparkle Effect", category: "effects", price: 450, currency: "coins", color: "#ffff00" },
    { id: "effect_glitch", name: "Glitch Effect", category: "effects", price: 55, currency: "gems", color: "#ff00ff" },
    { id: "title_rookie", name: "Rookie Title", category: "titles", price: 0, currency: "coins", color: "#aaa" },
    { id: "title_champion", name: "Champion", category: "titles", price: 300, currency: "coins", color: "#ffd700" },
    { id: "title_legend", name: "Legend", category: "titles", price: 40, currency: "gems", color: "#c300ff" },
    { id: "pet_none", name: "No Pet", category: "pets", price: 0, currency: "coins", color: "transparent" },
    { id: "pet_drone", name: "Drone Pet", category: "pets", price: 700, currency: "coins", color: "#00f7ff" },
    { id: "pet_ghost", name: "Ghost Pet", category: "pets", price: 65, currency: "gems", color: "#aabbcc" },
    { id: "powerup_xp", name: "XP Booster", category: "powerups", price: 200, currency: "coins", consumable: true },
    { id: "powerup_coin", name: "Coin Booster", category: "powerups", price: 200, currency: "coins", consumable: true },
    { id: "powerup_shield", name: "Shield Booster", category: "powerups", price: 250, currency: "coins", consumable: true },
  ];

  const CATEGORIES = ["characters", "skins", "trails", "backgrounds", "effects", "titles", "pets", "powerups"];

  function getItem(id) {
    return CATALOG.find((i) => i.id === id);
  }

  function getByCategory(category) {
    return CATALOG.filter((i) => i.category === category);
  }

  function owns(player, id) {
    return player.ownedItems.includes(id);
  }

  function isEquipped(player, id) {
    const item = getItem(id);
    if (!item) return false;
    const slotMap = {
      skins: "skin",
      characters: "skin",
      trails: "trail",
      backgrounds: "background",
      titles: "title",
      pets: "pet",
      effects: "effect",
    };
    const slot = slotMap[item.category];
    return slot && player.equipped[slot] === id;
  }

  function canAfford(player, item) {
    if (item.currency === "gems") return player.gems >= item.price;
    return player.coins >= item.price;
  }

  function buy(player, id, ui) {
    const item = getItem(id);
    if (!item) return { success: false, reason: "Item not found" };
    if (owns(player, id) && !item.consumable) return { success: false, reason: "Already owned" };
    if (item.price > 0 && !canAfford(player, item)) return { success: false, reason: "Not enough currency" };

    if (item.price > 0) {
      if (item.currency === "gems") player.gems -= item.price;
      else player.coins -= item.price;
    }

    if (item.consumable) {
      const key = id.replace("powerup_", "") + "Booster";
      player.powerups[key] = (player.powerups[key] || 0) + 1;
    } else if (!owns(player, id)) {
      player.ownedItems.push(id);
    }

    if (window.AchievementManager) {
      window.AchievementManager.unlock(player, "shop_first", ui);
    }

    return { success: true, item };
  }

  function equip(player, id) {
    const item = getItem(id);
    if (!item || item.consumable) return false;
    if (!owns(player, id)) return false;

    const slotMap = {
      skins: "skin",
      characters: "skin",
      trails: "trail",
      backgrounds: "background",
      titles: "title",
      pets: "pet",
      effects: "effect",
    };
    const slot = slotMap[item.category];
    if (!slot) return false;
    player.equipped[slot] = id;
    return true;
  }

  function getSkinColor(player) {
    const skin = getItem(player.equipped.skin);
    return skin?.color || "#00f7ff";
  }

  function getTrailColor(player) {
    const trail = getItem(player.equipped.trail);
    return trail?.color || "transparent";
  }

  function getBackground(player) {
    const bg = getItem(player.equipped.background);
    return bg?.color || "#050816";
  }

  return {
    CATALOG,
    CATEGORIES,
    getItem,
    getByCategory,
    owns,
    isEquipped,
    canAfford,
    buy,
    equip,
    getSkinColor,
    getTrailColor,
    getBackground,
  };
})();

if (typeof window !== "undefined") window.ShopManager = ShopManager;
