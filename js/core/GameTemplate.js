/**
 * GameTemplate — Base class for all games with common features
 * Provides: Save/load, mobile controls, pause menu, performance monitoring, audio, animations
 */
class GameTemplate {
  constructor(config = {}) {
    this.bridge = GameBridge.init(config.id || "game");
    this.canvas = document.getElementById("game");
    this.ctx = this.canvas?.getContext("2d");
    this.width = this.canvas?.width || 800;
    this.height = this.canvas?.height || 600;

    this.score = 0;
    this.coins = 0;
    this.level = 1;
    this.gameOver = false;
    this.paused = false;
    this.frame = 0;
    this.fps = 0;
    this.frameTime = 0;

    this.particles = [];
    this.objects = [];
    this.enemies = [];

    // Performance monitoring
    this.lastFrameTime = performance.now();
    this.frameCount = 0;
    this.fpsUpdateTime = 0;

    // Settings
    this.settings = this.bridge?.settings || {};
    
    // Mobile controls
    this.setupMobileControls();
    this.setupPauseMenu();
    this.setupAudio();
  }

  setupMobileControls() {
    if (!MobileControlsManager.isMobileDevice()) return;
    MobileControlsManager.init({ enabled: true });
    this.mobileInput = { x: 0, y: 0, action1: false, action2: false };
    MobileControlsManager.onMove((state) => {
      this.mobileInput.x = state.x;
      this.mobileInput.y = state.y;
    });
  }

  setupPauseMenu() {
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" || e.key === "p" || e.key === "P") {
        this.togglePause();
      }
    });

    if (MobileControlsManager.isMobileDevice()) {
      const pauseBtn = MobileControlsManager.createButton("⏸", "center-right");
      MobileControlsManager.onButton(({ label, state }) => {
        if (label === "⏸" && state === "down") this.togglePause();
      });
    }
  }

  setupAudio() {
    AudioManager.init(this.settings);
  }

  togglePause() {
    if (this.gameOver) return;
    this.paused = !this.paused;
    if (this.paused) {
      this.showPauseMenu();
    } else {
      this.hidePauseMenu();
    }
  }

  showPauseMenu() {
    let menu = document.getElementById("pause-menu");
    if (!menu) {
      menu = document.createElement("div");
      menu.id = "pause-menu";
      menu.innerHTML = `
        <div class="pause-overlay">
          <div class="pause-panel glass">
            <h1>PAUSED</h1>
            <button onclick="game.togglePause()" class="btn-primary">Resume</button>
            <button onclick="game.restart()" class="btn-secondary">Restart</button>
            <button onclick="location.href='Index.html'" class="btn-secondary">Back to Hub</button>
            <div class="pause-settings">
              <label><input type="checkbox" ${this.settings.sfx ? "checked" : ""} onchange="AudioManager.setEnabled(this.checked); game.settings.sfx = this.checked;"> Sound</label>
              <label><input type="checkbox" ${this.settings.particles ? "checked" : ""} onchange="game.settings.particles = this.checked;"> Particles</label>
            </div>
          </div>
        </div>
      `;
      menu.style.cssText = `
        position: fixed;
        inset: 0;
        z-index: 10000;
        display: flex;
        align-items: center;
        justify-content: center;
        backdrop-filter: blur(5px);
      `;
      document.body.appendChild(menu);
    }
    menu.style.display = "flex";
  }

  hidePauseMenu() {
    const menu = document.getElementById("pause-menu");
    if (menu) menu.style.display = "none";
  }

  emitParticle(x, y, config = {}) {
    if (!this.settings.particles) return;
    ParticleManager.emit(this.bridge?.id || "game", x, y, config);
  }

  updateStats() {
    const scoreEl = document.getElementById("score");
    const coinsEl = document.getElementById("coins");
    const levelEl = document.getElementById("level");
    const comboEl = document.getElementById("combo");

    if (scoreEl) scoreEl.textContent = UIManager.formatNumber(this.score);
    if (coinsEl) coinsEl.textContent = UIManager.formatNumber(this.coins);
    if (levelEl) levelEl.textContent = this.level;
    if (comboEl) comboEl.textContent = this.combo || 0;
  }

  updateFPS() {
    const now = performance.now();
    const deltaTime = (now - this.lastFrameTime) / 1000;
    this.lastFrameTime = now;

    this.frameCount++;
    this.fpsUpdateTime += deltaTime;

    if (this.fpsUpdateTime >= 1) {
      this.fps = this.frameCount;
      this.frameCount = 0;
      this.fpsUpdateTime = 0;
    }

    return deltaTime;
  }

  saveProgress() {
    this.bridge?.saveGameStats?.({
      score: this.score,
      coins: this.coins,
      level: this.level,
      timestamp: Date.now()
    });
  }

  restart() {
    if (confirm("Restart game?")) {
      this.gameOver = false;
      this.paused = false;
      this.score = 0;
      this.coins = 0;
      this.level = 1;
      this.frame = 0;
      this.initGame();
      this.hidePauseMenu();
    }
  }

  endGame() {
    this.gameOver = true;
    this.saveProgress();
    AudioManager.play("gameOver");
    this.showGameOverScreen();
  }

  showGameOverScreen() {
    let screen = document.getElementById("game-over-screen");
    if (!screen) {
      screen = document.createElement("div");
      screen.id = "game-over-screen";
      screen.innerHTML = `
        <div class="gameover-overlay">
          <div class="gameover-panel glass">
            <h1>GAME OVER</h1>
            <div class="stats">
              <div>Score: <strong>${UIManager.formatNumber(this.score)}</strong></div>
              <div>Coins: <strong>${UIManager.formatNumber(this.coins)}</strong></div>
              <div>Level: <strong>${this.level}</strong></div>
            </div>
            <button onclick="game.restart()" class="btn-primary">Play Again</button>
            <button onclick="location.href='Index.html'" class="btn-secondary">Back to Hub</button>
          </div>
        </div>
      `;
      screen.style.cssText = `
        position: fixed;
        inset: 0;
        z-index: 10001;
        display: flex;
        align-items: center;
        justify-content: center;
        backdrop-filter: blur(5px);
      `;
      document.body.appendChild(screen);
    }
    screen.style.display = "flex";
  }

  clear() {
    this.ctx.fillStyle = "#050816";
    this.ctx.fillRect(0, 0, this.width, this.height);
  }

  drawText(text, x, y, options = {}) {
    this.ctx.save();
    this.ctx.font = `${options.size || 20}px Orbitron`;
    this.ctx.fillStyle = options.color || "#00f7ff";
    this.ctx.textAlign = options.align || "left";
    this.ctx.globalAlpha = options.alpha || 1;
    this.ctx.fillText(text, x, y);
    this.ctx.restore();
  }

  drawRect(x, y, w, h, color) {
    this.ctx.fillStyle = color;
    this.ctx.fillRect(x, y, w, h);
  }

  drawCircle(x, y, r, color) {
    this.ctx.fillStyle = color;
    this.ctx.beginPath();
    this.ctx.arc(x, y, r, 0, Math.PI * 2);
    this.ctx.fill();
  }

  update(deltaTime) {
    // Override in subclass
  }

  render() {
    // Override in subclass
  }

  gameLoop() {
    if (!this.gameOver && !this.paused) {
      const deltaTime = this.updateFPS();
      this.update(deltaTime);
      this.updateStats();
    }

    this.render();

    requestAnimationFrame(() => this.gameLoop());
  }

  start() {
    this.initGame();
    this.gameLoop();
  }

  initGame() {
    // Override in subclass
  }
}

let game = null;
