/**
 * GameBridge — shared integration for all GameHub games.
 */
const GameBridge = (() => {
  let player = null;
  let gameId = null;
  let paused = false;
  let pauseOverlay = null;

  function init(id) {
    gameId = id;
    if (typeof SaveManager !== "undefined") {
      player = SaveManager.loadPlayer();
    } else {
      try {
        player = JSON.parse(localStorage.getItem("gamehub_player"));
      } catch {
        player = null;
      }
    }
    createPauseMenu();
    return player;
  }

  function getPlayer() {
    return player;
  }

  function getCosmetics() {
    if (!player || typeof ShopManager === "undefined") {
      return { skin: "#00f7ff", trail: "transparent", background: "#050816" };
    }
    return {
      skin: ShopManager.getSkinColor(player),
      trail: ShopManager.getTrailColor(player),
      background: ShopManager.getBackground(player),
      skinId: player.equipped?.skin,
      trailId: player.equipped?.trail,
    };
  }

  function endGame({ score = 0, won = false, kills = 0, combo = 0, xpMultiplier = 1 } = {}) {
    if (!player) return null;

    const baseXp = Math.floor(score * xpMultiplier) + (won ? 50 : 10);
    const coins = Math.floor(score * 0.5) + (won ? 25 : 5) + Math.floor(kills * 2);

    if (typeof XPManager !== "undefined") {
      XPManager.addXP(player, baseXp, window.GameHub?.managers);
    } else {
      player.xp = (player.xp || 0) + baseXp;
      player.level = Math.floor((player.xp || 0) / 150) + 1;
    }

    player.coins = (player.coins || 0) + coins;
    player.gamesPlayed = (player.gamesPlayed || 0) + 1;
    if (won) player.wins = (player.wins || 0) + 1;

    const stats = player.stats?.[gameId] || { highScore: 0, games: 0, wins: 0, kills: 0 };
    stats.games += 1;
    if (won) stats.wins += 1;
    if (score > stats.highScore) stats.highScore = score;
    stats.kills = (stats.kills || 0) + kills;
    if (!player.stats) player.stats = {};
    player.stats[gameId] = stats;

    if (typeof QuestManager !== "undefined") {
      QuestManager.updateProgress(player, { type: "play", game: gameId });
      QuestManager.updateProgress(player, { type: "score", game: gameId, score });
      QuestManager.updateProgress(player, { type: "kills", amount: kills });
      QuestManager.updateProgress(player, { type: "xp", amount: baseXp });
      QuestManager.updateProgress(player, { type: "coins", amount: coins });
      if (won) QuestManager.updateProgress(player, { type: "win" });
      if (combo >= 10) QuestManager.updateProgress(player, { type: "combo", amount: combo });
    }

    if (typeof BattlePassManager !== "undefined") {
      BattlePassManager.addXP(player, Math.floor(baseXp * 0.5));
    }

    if (typeof LeaderboardManager !== "undefined") {
      LeaderboardManager.updatePlayer(player);
      LeaderboardManager.addLocalScore(gameId, score, player);
    }

    if (typeof AchievementManager !== "undefined") {
      AchievementManager.checkProgressAchievements(player);
    }

    SaveManager?.savePlayer(player);

    return { xp: baseXp, coins, highScore: stats.highScore };
  }

  function createPauseMenu() {
    if (document.getElementById("gh-pause-menu")) return;

    pauseOverlay = document.createElement("div");
    pauseOverlay.id = "gh-pause-menu";
    pauseOverlay.innerHTML = `
      <div class="gh-pause-panel">
        <h2>PAUSED</h2>
        <button id="gh-resume">Resume</button>
        <button id="gh-restart">Restart</button>
        <a href="Index.html" id="gh-hub">Back to Hub</a>
        <div class="gh-pause-stats">
          <span id="gh-pause-score">Score: 0</span>
        </div>
      </div>`;
    pauseOverlay.style.display = "none";
    document.body.appendChild(pauseOverlay);

    document.getElementById("gh-resume")?.addEventListener("click", () => togglePause(false));
    document.getElementById("gh-restart")?.addEventListener("click", () => location.reload());
  }

  function togglePause(force) {
    paused = force !== undefined ? force : !paused;
    if (pauseOverlay) pauseOverlay.style.display = paused ? "flex" : "none";
    return paused;
  }

  function isPaused() {
    return paused;
  }

  function updatePauseScore(score) {
    const el = document.getElementById("gh-pause-score");
    if (el) el.textContent = `Score: ${score}`;
  }

  function screenShake(intensity = 5, duration = 200) {
    if (!player?.settings?.screenShake) return;
    const canvas = document.querySelector("canvas");
    if (!canvas) return;
    const start = performance.now();
    function shake(now) {
      const t = now - start;
      if (t > duration) {
        canvas.style.transform = "";
        return;
      }
      const dx = (Math.random() - 0.5) * intensity;
      const dy = (Math.random() - 0.5) * intensity;
      canvas.style.transform = `translate(${dx}px, ${dy}px)`;
      requestAnimationFrame(shake);
    }
    requestAnimationFrame(shake);
  }

  function createMobileControls(config) {
    if (!player?.settings?.mobileControls && window.innerWidth > 900) return;
    if (document.getElementById("gh-mobile-controls")) return;

    const div = document.createElement("div");
    div.id = "gh-mobile-controls";
    div.className = "gh-mobile-controls";

    if (config.dpad) {
      div.innerHTML += `
        <div class="gh-dpad">
          <button data-dir="up">▲</button>
          <div class="gh-dpad-mid">
            <button data-dir="left">◀</button>
            <button data-dir="right">▶</button>
          </div>
          <button data-dir="down">▼</button>
        </div>`;
    }

    if (config.action) {
      div.innerHTML += `<button class="gh-action-btn" data-action="action">${config.actionLabel || "A"}</button>`;
    }

    document.body.appendChild(div);

    div.querySelectorAll("button").forEach((btn) => {
      const handler = (e) => {
        e.preventDefault();
        if (btn.dataset.dir && config.onDirection) config.onDirection(btn.dataset.dir);
        if (btn.dataset.action && config.onAction) config.onAction();
      };
      btn.addEventListener("touchstart", handler);
      btn.addEventListener("mousedown", handler);
    });
  }

  function bindPauseKey(getScore) {
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" || e.key === "p" || e.key === "P") {
        togglePause();
        if (getScore) updatePauseScore(getScore());
        AudioManager?.play("click");
      }
    });
  }

  function emitEvent(type, data = {}) {
    if (!player || typeof QuestManager === "undefined") return;
    QuestManager.updateProgress(player, { type, game: gameId, ...data });
    SaveManager?.savePlayer(player);
  }

  return {
    init,
    getPlayer,
    getCosmetics,
    endGame,
    togglePause,
    isPaused,
    updatePauseScore,
    screenShake,
    createMobileControls,
    bindPauseKey,
    emitEvent,
  };
})();

if (typeof window !== "undefined") window.GameBridge = GameBridge;
