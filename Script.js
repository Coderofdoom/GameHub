/**
 * GameHub Portal — main hub controller
 */
const GameHub = (() => {
  let player = null;
  let currentShopCategory = "skins";
  let currentSection = "dashboard";
  let filteredGames = [];
  let currentFilter = "all";
  let carouselIndex = 0;

  const GAMES = [
    // Original games
    { id: "snake", name: "Snake", icon: "🐍", desc: "Classic snake with AI rivals, powerups, boss fights, and skins.", url: "snake.html", category: "arcade", featured: true, tag: "Popular" },
    { id: "shooter", name: "Space Shooter", icon: "🚀", desc: "Multiple weapons, boss waves, skill tree, and ship skins.", url: "Space-Shooter.html", category: "action", featured: false },
    { id: "platformer", name: "Platformer", icon: "🏔️", desc: "Double jump, dash, wall jump, biomes, bosses, and story mode.", url: "platformer.html", category: "action", featured: false },
    { id: "racer", name: "Racer", icon: "🏎️", desc: "Nitro, drift system, AI racers, upgrades, and multiple tracks.", url: "racer.html", category: "racing", featured: false },
    { id: "zombie", name: "Zombie World", icon: "🧟", desc: "Open world survival with crafting, quests, NPCs, and boss zombies.", url: "openWorld.html", category: "survival", featured: true, tag: "Survival" },
    { id: "blockcraft", name: "BlockCraft", icon: "⛏️", desc: "Sandbox survival with crafting, mobs, day/night, and world saves.", url: "minecraft.html", category: "survival", featured: true, tag: "Sandbox" },
    // Arcade games
    { id: "flappybird", name: "Flappy Bird", icon: "🐦", desc: "Tap to flap and avoid pipes. Collect coins for bonuses.", url: "games/FlappyBird.html", category: "arcade", featured: false },
    { id: "pong", name: "Pong", icon: "🎾", desc: "Classic paddle game. Beat the CPU in a fast-paced rally.", url: "games/Pong.html", category: "arcade", featured: false },
    { id: "breakout", name: "Breakout", icon: "🧱", desc: "Break all bricks with the ball. Catch powerups!", url: "games/Breakout.html", category: "arcade", featured: false },
    { id: "asteroids", name: "Asteroids", icon: "⭐", desc: "Destroy asteroids with your ship. Complete the levels!", url: "games/Asteroids.html", category: "arcade", featured: false },
    { id: "fruitslice", name: "Fruit Slice", icon: "🍎", desc: "Slice fruit by swiping. Avoid bombs!", url: "games/FruitSlice.html", category: "arcade", featured: false },
    { id: "missiledefense", name: "Missile Defense", icon: "🚀", desc: "Defend your base from incoming missiles.", url: "games/MissileDefense.html", category: "arcade", featured: false },
    { id: "endlessrunner", name: "Endless Runner", icon: "🏃", desc: "Run forever and collect coins. Dodge obstacles!", url: "games/EndlessRunner.html", category: "arcade", featured: false },
    { id: "jetpack", name: "Jetpack Adventure", icon: "🚀", desc: "Manage fuel and reach the top! Collect coins on the way.", url: "games/JetpackAdventure.html", category: "arcade", featured: false },
    // Puzzle games
    { id: "tictactoe", name: "Tic Tac Toe", icon: "⭕", desc: "Strategy puzzle. Outsmart the AI CPU opponent.", url: "games/TicTacToe.html", category: "puzzle", featured: false },
    { id: "memory", name: "Memory Match", icon: "🎮", desc: "Match pairs of cards. Level up to harder challenges.", url: "games/MemoryMatch.html", category: "puzzle", featured: false },
    { id: "connect4", name: "Connect 4", icon: "🔴", desc: "Strategic 4-in-a-row game. Beat the AI!", url: "games/Connect4.html", category: "puzzle", featured: false },
    { id: "whamacmole", name: "Whack-A-Mole", icon: "🔨", desc: "Fast reaction game. Hit all moles before they hide!", url: "games/WhackAMole.html", category: "puzzle", featured: false },
    // Action games
    { id: "topdownshooter", name: "Top Down Shooter", icon: "🎯", desc: "Wave-based shooter. Defeat enemies and level up!", url: "games/TopDownShooter.html", category: "action", featured: false },
    { id: "arenasurvival", name: "Arena Survival", icon: "⚔️", desc: "Survive waves of enemies. Pick up powerups!", url: "games/ArenaSurvival.html", category: "action", featured: false },
    { id: "bullethell", name: "Bullet Hell", icon: "💥", desc: "Dodge intense bullet patterns. Defeat the boss!", url: "games/BulletHell.html", category: "action", featured: false },
    { id: "bossrush", name: "Boss Rush", icon: "👹", desc: "Face bosses back-to-back. Each fight is harder!", url: "games/BossRush.html", category: "action", featured: false },
    // .IO games
    { id: "snakeio", name: "Snake.io", icon: "🐍", desc: "Multiplayer-style snake arena. Grow and dominate!", url: "games/SnakeIO.html", category: "io", featured: false },
    { id: "agario", name: "Agar.io Style", icon: "🔵", desc: "Grow your cell by eating others. Become the biggest!", url: "games/AgarIO.html", category: "io", featured: false },
    { id: "takarena", name: "Tank Arena", icon: "🎖️", desc: "Tank battles on tactical maps. Destroy enemies!", url: "games/TankArena.html", category: "io", featured: false },
    // Racing games
    { id: "driftracer", name: "Drift Racer", icon: "🚗", desc: "Master drift mechanics on circular track.", url: "games/DriftRacer.html", category: "racing", featured: false },
    { id: "highwayracer", name: "Highway Racer", icon: "🛣️", desc: "Dodge traffic and collect coins. How far can you go?", url: "games/HighwayRacer.html", category: "racing", featured: false },
    { id: "bikestunts", name: "Bike Stunts", icon: "🏍️", desc: "Pull tricks on your bike. Land jumps perfectly!", url: "games/BikeStunts.html", category: "racing", featured: false },
    { id: "kartracing", name: "Kart Racing", icon: "🏎️", desc: "Arcade racing with multiple opponents on varied tracks.", url: "games/KartRacing.html", category: "racing", featured: false },
    // Survival games
    { id: "dungeonstrvl", name: "Dungeon Survival", icon: "🗡️", desc: "Floor-crawling roguelike. Fight enemies and collect loot!", url: "games/DungeonSurvival.html", category: "survival", featured: false },
    { id: "islandsurvial", name: "Island Survival", icon: "🏝️", desc: "Manage resources through day/night cycles.", url: "games/IslandSurvival.html", category: "survival", featured: false },
    { id: "parkour", name: "Parkour Challenge", icon: "🤸", desc: "Platforming levels with obstacles. Reach the finish!", url: "games/ParkourChallenge.html", category: "survival", featured: false },
    // Idle games
    { id: "cookieclicker", name: "Cookie Clicker", icon: "🍪", desc: "Click cookies and buy upgrades. Build your empire!", url: "games/CookieClicker.html", category: "idle", featured: false },
    { id: "miningclicker", name: "Mining Clicker", icon: "⛏️", desc: "Mine ore and upgrade your equipment.", url: "games/MiningClicker.html", category: "idle", featured: false },
    { id: "moneytycoon", name: "Money Tycoon", icon: "💰", desc: "Build businesses and earn passive income!", url: "games/MoneyTycoon.html", category: "idle", featured: false },
    { id: "idlefactory", name: "Idle Factory", icon: "🏭", desc: "Automate production. Upgrade machines for more output!", url: "games/IdleFactory.html", category: "idle", featured: false },
  ];

  const managers = {
    save: SaveManager,
    xp: XPManager,
    achievement: AchievementManager,
    shop: ShopManager,
    quest: QuestManager,
    battlePass: BattlePassManager,
    leaderboard: LeaderboardManager,
    audio: AudioManager,
    ui: UIManager,
    player: PlayerManager,
  };

  function init() {
    player = PlayerManager.init();
    QuestManager.resetIfNeeded(player);
    LeaderboardManager.seedBots();
    AudioManager.init(player.settings);
    UIManager.init();

    bindNavigation();
    bindRewards();
    bindSettings();
    bindShopTabs();
    bindLeaderboardTabs();
    bindMobileMenu();
    bindProfile();
    bindBattlePass();
    bindSearchAndFilters();
    bindCarousel();

    renderAll();
    PlayerManager.save();

    SaveManager.onSave(() => renderAll());

    setInterval(() => {
      AchievementManager.checkProgressAchievements(player);
      PlayerManager.save();
    }, 10000);

    console.log("%c GAMEHUB PORTAL LOADED ", "background: linear-gradient(90deg,#00f7ff,#c300ff); color:#000; font-weight:bold; padding:8px;");
  }

  function navigate(section) {
    currentSection = section;
    document.querySelectorAll(".page-section").forEach((s) => s.classList.remove("active"));
    document.querySelectorAll(".nav-link").forEach((a) => a.classList.remove("active"));

    const el = document.getElementById(section);
    if (el) el.classList.add("active");

    const link = document.querySelector(`.nav-link[data-section="${section}"]`);
    if (link) link.classList.add("active");

    document.getElementById("sidebar")?.classList.remove("open");
    renderAll();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function bindNavigation() {
    document.querySelectorAll(".nav-link").forEach((link) => {
      link.addEventListener("click", (e) => {
        e.preventDefault();
        navigate(link.dataset.section);
        AudioManager.play("click");
      });
    });
  }

  function bindMobileMenu() {
    document.getElementById("menu-toggle")?.addEventListener("click", () => {
      document.getElementById("sidebar")?.classList.toggle("open");
    });
  }

  function bindRewards() {
    const claimDaily = () => {
      const now = Date.now();
      const day = 86400000;
      if (now - player.lastDailyReward < day) {
        UIManager.toast("Daily reward already claimed!", "error");
        return;
      }
      player.lastDailyReward = now;
      const coins = 50 + player.loginStreak * 5;
      const xp = 75 + player.loginStreak * 10;
      player.coins += coins;
      XPManager.addXP(player, xp, { battlePass: BattlePassManager, achievement: AchievementManager });
      AchievementManager.unlock(player, "daily_claim", UIManager);
      PlayerManager.save();
      UIManager.toast(`Daily Reward: +${coins} coins, +${xp} XP`, "success");
      AudioManager.play("coin");
      renderAll();
    };

    document.getElementById("daily-reward-btn")?.addEventListener("click", claimDaily);
    document.getElementById("claim-daily-hero")?.addEventListener("click", claimDaily);

    document.getElementById("weekly-reward-btn")?.addEventListener("click", () => {
      const now = Date.now();
      const week = 86400000 * 7;
      if (now - player.lastWeeklyReward < week) {
        UIManager.toast("Weekly reward already claimed!", "error");
        return;
      }
      player.lastWeeklyReward = now;
      player.coins += 300;
      player.gems += 25;
      XPManager.addXP(player, 500, { battlePass: BattlePassManager, achievement: AchievementManager });
      PlayerManager.save();
      UIManager.toast("Weekly Reward: +300 coins, +25 gems, +500 XP!", "success");
      AudioManager.play("levelUp");
      renderAll();
    });
  }

  function bindSettings() {
    const bind = (id, key) => {
      const el = document.getElementById(id);
      if (!el) return;
      el.checked = player.settings[key];
      el.addEventListener("change", () => {
        PlayerManager.updateSettings(key, el.checked);
        if (key === "sfx") AudioManager.setEnabled(el.checked);
        UIManager.toast("Settings saved", "success");
      });
    };
    bind("set-sfx", "sfx");
    bind("set-music", "music");
    bind("set-particles", "particles");
    bind("set-shake", "screenShake");
    bind("set-mobile", "mobileControls");

    document.getElementById("export-save")?.addEventListener("click", () => {
      const data = SaveManager.exportSave();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = "gamehub_save.json";
      a.click();
      UIManager.toast("Save exported!", "success");
    });

    document.getElementById("import-save")?.addEventListener("click", () => {
      const input = document.createElement("input");
      input.type = "file";
      input.accept = ".json";
      input.onchange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => {
          try {
            const data = JSON.parse(reader.result);
            if (SaveManager.importSave(data)) {
              player = PlayerManager.init();
              renderAll();
              UIManager.toast("Save imported!", "success");
            } else {
              UIManager.toast("Invalid save file", "error");
            }
          } catch {
            UIManager.toast("Failed to import save", "error");
          }
        };
        reader.readAsText(file);
      };
      input.click();
    });

    document.getElementById("reset-save")?.addEventListener("click", () => {
      if (confirm("Reset ALL progress? This cannot be undone.")) {
        player = SaveManager.resetPlayer();
        PlayerManager.init();
        renderAll();
        UIManager.toast("Progress reset", "success");
      }
    });
  }

  function bindProfile() {
    document.getElementById("save-username")?.addEventListener("click", () => {
      const input = document.getElementById("username-input");
      PlayerManager.setUsername(input.value);
      LeaderboardManager.updatePlayer(player);
      UIManager.toast("Username saved!", "success");
      renderAll();
    });

    document.getElementById("prestige-btn")?.addEventListener("click", () => {
      if (!XPManager.canPrestige(player)) {
        UIManager.toast("Reach level 50 to prestige!", "error");
        return;
      }
      if (confirm("Prestige? You'll reset to level 1 but gain permanent bonuses.")) {
        XPManager.prestige(player);
        AchievementManager.unlock(player, "prestige_1", UIManager);
        PlayerManager.save();
        UIManager.toast("Prestige achieved! +50 gems", "achievement");
        AudioManager.play("levelUp");
        renderAll();
      }
    });
  }

  function bindShopTabs() {
    const tabs = document.getElementById("shop-tabs");
    if (!tabs) return;
    ShopManager.CATEGORIES.forEach((cat, i) => {
      const btn = document.createElement("button");
      btn.className = "shop-tab" + (i === 0 ? " active" : "");
      btn.textContent = cat;
      btn.dataset.category = cat;
      btn.addEventListener("click", () => {
        currentShopCategory = cat;
        document.querySelectorAll(".shop-tab").forEach((t) => t.classList.remove("active"));
        btn.classList.add("active");
        renderShop();
        AudioManager.play("click");
      });
      tabs.appendChild(btn);
    });
  }

  function bindLeaderboardTabs() {
    document.querySelectorAll(".lb-tab").forEach((tab) => {
      tab.addEventListener("click", () => {
        document.querySelectorAll(".lb-tab").forEach((t) => t.classList.remove("active"));
        document.querySelectorAll(".lb-panel").forEach((p) => p.classList.remove("active"));
        tab.classList.add("active");
        document.getElementById(`lb-${tab.dataset.lb}`)?.classList.add("active");
        renderLeaderboards();
      });
    });

    const select = document.getElementById("lb-game-select");
    if (select) {
      GAMES.forEach((g) => {
        const opt = document.createElement("option");
        opt.value = g.id;
        opt.textContent = g.name;
        select.appendChild(opt);
      });
      select.addEventListener("change", renderLeaderboards);
    }
  }

  function bindBattlePass() {
    document.getElementById("bp-premium-btn")?.addEventListener("click", () => {
      if (BattlePassManager.buyPremium(player)) {
        PlayerManager.save();
        UIManager.toast("Premium Battle Pass unlocked!", "success");
        renderBattlePass();
      } else {
        UIManager.toast("Need 500 gems!", "error");
      }
    });
  }

  function bindSearchAndFilters() {
    const searchInput = document.getElementById("game-search");
    if (searchInput) {
      searchInput.addEventListener("input", (e) => {
        const query = e.target.value.toLowerCase();
        filterGames(query, currentFilter);
        renderGameGrid();
      });
    }

    document.querySelectorAll(".filter-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        document.querySelectorAll(".filter-btn").forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        currentFilter = btn.dataset.filter;
        const searchQuery = document.getElementById("game-search")?.value.toLowerCase() || "";
        filterGames(searchQuery, currentFilter);
        renderGameGrid();
        AudioManager.play("click");
      });
    });
  }

  function bindCarousel() {
    const prevBtn = document.getElementById("carousel-prev");
    const nextBtn = document.getElementById("carousel-next");
    if (prevBtn) prevBtn.addEventListener("click", () => scrollCarousel(-1));
    if (nextBtn) nextBtn.addEventListener("click", () => scrollCarousel(1));
  }

  function scrollCarousel(direction) {
    const carousel = document.querySelector(".carousel");
    if (!carousel) return;
    const scrollAmount = 300;
    carousel.scrollBy({ left: direction * scrollAmount, behavior: "smooth" });
  }

  function filterGames(query, category) {
    filteredGames = GAMES.filter((g) => {
      const matchesSearch = !query || g.name.toLowerCase().includes(query) || g.desc.toLowerCase().includes(query);
      const matchesCategory = category === "all" || g.category === category;
      return matchesSearch && matchesCategory;
    });
  }

  function toggleFavorite(gameId) {
    if (!player.favorites) player.favorites = [];
    const idx = player.favorites.indexOf(gameId);
    if (idx >= 0) {
      player.favorites.splice(idx, 1);
    } else {
      player.favorites.push(gameId);
    }
    PlayerManager.save();
    renderDashboard();
  }

  function addToRecentlyPlayed(gameId) {
    if (!player.recentlyPlayed) player.recentlyPlayed = [];
    const idx = player.recentlyPlayed.indexOf(gameId);
    if (idx >= 0) {
      player.recentlyPlayed.splice(idx, 1);
    }
    player.recentlyPlayed.unshift({ id: gameId, timestamp: Date.now() });
    if (player.recentlyPlayed.length > 10) {
      player.recentlyPlayed.pop();
    }
    PlayerManager.save();
  }

  function renderGameGrid() {
    const grid = document.getElementById("featured-grid");
    if (grid) grid.innerHTML = filteredGames.map(makeGameCard).join("");
    attachGameCardListeners();
  }

  function makeGameCard(g) {
    const isFavorite = player.favorites?.includes(g.id);
    const tag = g.tag ? `<span class="game-tag">${g.tag}</span>` : "";
    const favoriteBtn = `<button class="favorite-btn ${isFavorite ? "active" : ""}" data-game-id="${g.id}" title="Add to favorites">⭐</button>`;
    
    return `<div class="game-card">
      ${tag}
      ${favoriteBtn}
      <div class="game-card-banner">${g.icon}</div>
      <div class="game-card-body">
        <h3>${g.name}</h3>
        <p>${g.desc}</p>
        <button class="play-btn" onclick="GameHub.playGame('${g.url}', '${g.id}')">Play Now</button>
      </div>
    </div>`;
  }

  function attachGameCardListeners() {
    document.querySelectorAll(".favorite-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const gameId = btn.dataset.gameId;
        toggleFavorite(gameId);
        btn.classList.toggle("active");
        AudioManager.play("click");
      });
    });
  }

  function renderFavorites() {
    if (!player.favorites || player.favorites.length === 0) {
      document.getElementById("favorites-section").style.display = "none";
      return;
    }

    document.getElementById("favorites-section").style.display = "block";
    const favGames = GAMES.filter((g) => player.favorites.includes(g.id));
    const grid = document.getElementById("favorites-grid");
    if (grid) grid.innerHTML = favGames.map(makeGameCard).join("");
    attachGameCardListeners();
  }

  function renderRecentlyPlayed() {
    if (!player.recentlyPlayed || player.recentlyPlayed.length === 0) {
      document.getElementById("recently-played-section").style.display = "none";
      return;
    }

    document.getElementById("recently-played-section").style.display = "block";
    const recentGames = player.recentlyPlayed
      .map((r) => GAMES.find((g) => g.id === r.id))
      .filter(Boolean);
    const grid = document.getElementById("recently-played-grid");
    if (grid) grid.innerHTML = recentGames.map(makeGameCard).join("");
    attachGameCardListeners();
  }

  function playGame(url, gameId) {
    addToRecentlyPlayed(gameId);
    player.gamesPlayed++;
    PlayerManager.save();
    location.href = url;
  }

  function renderAll() {
    renderDashboard();
    renderGames();
    renderShop();
    renderProfile();
    renderQuests();
    renderBattlePass();
    renderAchievements();
    renderLeaderboards();
    renderStatistics();
    renderFavorites();
    renderRecentlyPlayed();
    filterGames("", "all");
    renderGameGrid();
  }

  function renderDashboard() {
    const d = PlayerManager.getDisplayStats();
    const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = UIManager.formatNumber(val); };

    set("top-coins", player.coins);
    set("top-gems", player.gems);
    set("stat-xp", player.xp);
    set("stat-level", player.level);
    set("stat-coins", player.coins);
    set("stat-gems", player.gems);
    set("stat-games", player.gamesPlayed);
    set("stat-wins", player.wins);
    set("stat-streak", player.loginStreak);
    set("stat-achievements", player.achievements.length);
    set("stat-prestige", player.prestige);

    const rankEls = ["stat-rank", "top-rank"];
    rankEls.forEach((id) => { const el = document.getElementById(id); if (el) el.textContent = d.rank; });

    const userEls = ["top-username"];
    userEls.forEach((id) => { const el = document.getElementById(id); if (el) el.textContent = player.username; });

    const avatar = player.username.charAt(0).toUpperCase();
    ["user-avatar", "profile-avatar"].forEach((id) => {
      const el = document.getElementById(id);
      if (el) el.textContent = avatar;
    });

    const welcome = document.getElementById("welcome-msg");
    if (welcome) welcome.textContent = `Welcome back, ${player.username}! Streak: ${player.loginStreak} days 🔥`;

    const xpFill = document.getElementById("xp-progress");
    if (xpFill) xpFill.style.width = XPManager.levelProgress(player.xp, player.level) + "%";

    const nextText = document.getElementById("next-level-text");
    if (nextText) nextText.textContent = `Next level in ${XPManager.xpToNextLevel(player.xp, player.level)} XP`;
  }

  function renderGames() {
    const makeCard = (g) => {
      const tag = g.tag ? `<span class="game-tag">${g.tag}</span>` : "";
      return `<div class="game-card">
        ${tag}
        <div class="game-card-banner">${g.icon}</div>
        <div class="game-card-body">
          <h3>${g.name}</h3>
          <p>${g.desc}</p>
          <button class="play-btn" onclick="location.href='${g.url}'">Play Now</button>
        </div>
      </div>`;
    };

    const featured = document.getElementById("featured-grid");
    if (featured) featured.innerHTML = GAMES.filter((g) => g.featured).map(makeCard).join("");

    const grid = document.getElementById("game-grid");
    if (grid) grid.innerHTML = GAMES.map(makeCard).join("");
  }

  function renderShop() {
    const grid = document.getElementById("shop-grid");
    if (!grid) return;

    const items = ShopManager.getByCategory(currentShopCategory);
    grid.innerHTML = items.map((item) => {
      const owned = ShopManager.owns(player, item.id);
      const equipped = ShopManager.isEquipped(player, item.id);
      const canBuy = ShopManager.canAfford(player, item);
      const previewClass = item.color === "rainbow" ? "rainbow" : "";
      const previewStyle = item.color && item.color !== "rainbow" && item.color !== "transparent" ? `background:${item.color}` : "";

      let actions = "";
      if (item.price === 0 && !item.consumable) {
        actions = `<button class="shop-btn owned-label">Free</button>`;
      } else if (item.consumable) {
        actions = `<button class="shop-btn buy" data-buy="${item.id}" ${canBuy ? "" : "disabled"}>Buy (${item.price} ${item.currency === "gems" ? "💎" : "🪙"})</button>`;
      } else if (!owned) {
        actions = `<button class="shop-btn buy" data-buy="${item.id}" ${canBuy ? "" : "disabled"}>Buy (${item.price} ${item.currency === "gems" ? "💎" : "🪙"})</button>`;
      } else {
        actions = `<button class="shop-btn owned-label">Owned</button>`;
        if (!equipped) actions += `<button class="shop-btn equip" data-equip="${item.id}">Equip</button>`;
        else actions += `<button class="shop-btn owned-label">Equipped ✓</button>`;
      }

      return `<div class="shop-item ${owned ? "owned" : ""} ${equipped ? "equipped" : ""}">
        <div class="shop-preview ${previewClass}" style="${previewStyle}"></div>
        <h4>${item.name}</h4>
        <div class="shop-price ${item.currency}">${item.price > 0 ? item.price + (item.currency === "gems" ? " 💎" : " 🪙") : "Free"}</div>
        <div class="shop-actions">${actions}</div>
      </div>`;
    }).join("");

    grid.querySelectorAll("[data-buy]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const result = ShopManager.buy(player, btn.dataset.buy, UIManager);
        if (result.success) {
          QuestManager.updateProgress(player, { type: "shop" });
          PlayerManager.save();
          UIManager.toast(`Purchased ${result.item.name}!`, "success");
          AudioManager.play("buy");
          renderShop();
          renderDashboard();
        } else {
          UIManager.toast(result.reason, "error");
        }
      });
    });

    grid.querySelectorAll("[data-equip]").forEach((btn) => {
      btn.addEventListener("click", () => {
        if (ShopManager.equip(player, btn.dataset.equip)) {
          PlayerManager.save();
          UIManager.toast("Equipped!", "success");
          AudioManager.play("click");
          renderShop();
          renderProfile();
        }
      });
    });
  }

  function renderProfile() {
    const input = document.getElementById("username-input");
    if (input) input.value = player.username;

    const title = document.getElementById("profile-title");
    if (title) title.textContent = ShopManager.getItem(player.equipped.title)?.name || "Rookie";

    const stats = document.getElementById("profile-stats");
    if (stats) {
      const d = PlayerManager.getDisplayStats();
      stats.innerHTML = Object.entries({
        Level: d.level, XP: d.xp, Rank: d.rank, Prestige: d.prestige,
        Coins: d.coins, Gems: d.gems, "Games Played": d.gamesPlayed, Wins: d.wins,
        "Login Streak": d.loginStreak + " days",
      }).map(([k, v]) => `<div class="profile-stat"><label>${k}</label><span>${UIManager.formatNumber(v)}</span></div>`).join("");
    }

    const equipped = document.getElementById("equipped-grid");
    if (equipped) {
      equipped.innerHTML = Object.entries(player.equipped).map(([slot, id]) => {
        const item = ShopManager.getItem(id);
        return `<span class="equipped-tag">${slot}: ${item?.name || id}</span>`;
      }).join("");
    }
  }

  function renderQuests() {
    QuestManager.resetIfNeeded(player);
    const renderList = (list, containerId, listType) => {
      const container = document.getElementById(containerId);
      if (!container) return;
      container.innerHTML = (list || []).map((q, i) => {
        const pct = Math.min(100, (q.progress / q.target) * 100);
        const done = q.progress >= q.target;
        const rewardText = Object.entries(q.reward || {}).map(([k, v]) => `+${v} ${k}`).join(", ");
        return `<div class="quest-item ${done ? "completed" : ""} ${q.claimed ? "claimed" : ""}">
          <div class="quest-text">${q.text}</div>
          <div class="quest-reward">${rewardText}</div>
          ${UIManager.createProgressBar(pct)}
          <small>${q.progress}/${q.target}</small>
          ${done && !q.claimed ? `<button class="quest-claim" data-claim="${listType}" data-index="${i}">Claim</button>` : ""}
          ${q.claimed ? "<small>✓ Claimed</small>" : ""}
        </div>`;
      }).join("");

      container.querySelectorAll(".quest-claim").forEach((btn) => {
        btn.addEventListener("click", () => {
          const claimed = QuestManager.claimQuest(player, btn.dataset.claim, parseInt(btn.dataset.index));
          if (claimed) {
            PlayerManager.save();
            UIManager.toast(`Quest complete! ${claimed.text}`, "success");
            AudioManager.play("achievement");
            renderQuests();
            renderDashboard();
          }
        });
      });
    };

    renderList(player.quests.daily, "daily-quests", "daily");
    renderList(player.quests.weekly, "weekly-quests", "weekly");
    renderList(player.quests.missions, "mission-quests", "missions");
  }

  function renderBattlePass() {
    const tierEl = document.getElementById("bp-tier");
    if (tierEl) tierEl.textContent = player.battlePass.tier;

    const progress = document.getElementById("bp-progress");
    if (progress) progress.style.width = BattlePassManager.tierProgress(player) + "%";

    const track = document.getElementById("bp-track");
    if (!track) return;

    track.innerHTML = "";
    for (let t = 1; t <= BattlePassManager.MAX_TIER; t++) {
      const reward = BattlePassManager.getRewardForTier(t);
      const unlocked = player.battlePass.tier >= t;
      const freeClaimed = player.battlePass.claimedTiers.includes(`f${t}`);
      const card = document.createElement("div");
      card.className = `bp-tier-card ${unlocked ? "unlocked" : ""} ${freeClaimed ? "claimed" : ""}`;
      card.innerHTML = `
        <div class="bp-tier-num">Tier ${t}</div>
        ${reward ? `<div class="bp-reward">Free: ${formatReward(reward.free)}</div><div class="bp-reward">Premium: ${formatReward(reward.premium)}</div>` : ""}
        ${unlocked && !freeClaimed && reward ? `<button class="shop-btn buy bp-claim" data-tier="${t}">Claim Free</button>` : ""}`;
      track.appendChild(card);
    }

    track.querySelectorAll(".bp-claim").forEach((btn) => {
      btn.addEventListener("click", () => {
        const pack = BattlePassManager.claimTier(player, parseInt(btn.dataset.tier));
        if (pack) {
          PlayerManager.save();
          UIManager.toast("Battle Pass reward claimed!", "success");
          renderBattlePass();
          renderDashboard();
        }
      });
    });
  }

  function formatReward(pack) {
    if (!pack) return "—";
    return Object.entries(pack).map(([k, v]) => `${v} ${k}`).join(", ");
  }

  function renderAchievements() {
    const grid = document.getElementById("achievement-grid");
    if (!grid) return;

    grid.innerHTML = AchievementManager.getAll().map((a) => {
      const unlocked = AchievementManager.has(player, a.id);
      return `<div class="badge ${unlocked ? "unlocked" : "locked"}">
        <div class="badge-icon">${a.icon}</div>
        <div class="badge-name">${a.name}</div>
        <div class="badge-desc">${a.desc}</div>
      </div>`;
    }).join("");
  }

  function renderLeaderboards() {
    const global = LeaderboardManager.getGlobal(10);
    const body = document.getElementById("leaderboard-body");
    if (body) {
      body.innerHTML = global.map((p, i) => {
        const highlight = p.username === player.username ? "highlight" : "";
        return `<tr class="${highlight}"><td>${i + 1}</td><td>${p.username}</td><td>${p.level}</td><td>${UIManager.formatNumber(p.xp)}</td><td>${p.wins || 0}</td></tr>`;
      }).join("");
    }

    const gameId = document.getElementById("lb-game-select")?.value || "snake";
    const local = LeaderboardManager.getLocal(gameId, 10);
    const localBody = document.getElementById("local-leaderboard-body");
    if (localBody) {
      localBody.innerHTML = local.length
        ? local.map((e, i) => `<tr><td>${i + 1}</td><td>${e.username}</td><td>${UIManager.formatNumber(e.score)}</td><td>${new Date(e.date).toLocaleDateString()}</td></tr>`).join("")
        : "<tr><td colspan='4'>No scores yet — play a game!</td></tr>";
    }
  }

  function renderStatistics() {
    const grid = document.getElementById("stats-grid");
    if (!grid) return;

    const gameNames = { snake: "Snake", shooter: "Space Shooter", platformer: "Platformer", racer: "Racer", zombie: "Zombie World", blockcraft: "BlockCraft" };

    grid.innerHTML = Object.entries(player.stats).map(([id, s]) => {
      return `<div class="stat-game-card glass">
        <h3>${gameNames[id] || id}</h3>
        <div class="stat-row"><span>High Score</span><span>${UIManager.formatNumber(s.highScore)}</span></div>
        <div class="stat-row"><span>Games Played</span><span>${s.games}</span></div>
        <div class="stat-row"><span>Wins</span><span>${s.wins}</span></div>
        <div class="stat-row"><span>Kills</span><span>${s.kills || 0}</span></div>
      </div>`;
    }).join("");
  }

  return { init, navigate, managers, GAMES, playGame, toggleFavorite };
})();

window.GameHub = GameHub;

document.addEventListener("DOMContentLoaded", () => GameHub.init());
