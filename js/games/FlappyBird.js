/**
 * Flappy Bird — Tap to flap, avoid pipes, collect coins
 */
class FlappyBird extends GameTemplate {
  initGame() {
    this.bird = { x: 50, y: this.height / 2, w: 20, h: 20, vy: 0, flapping: false };
    this.gravity = 0.5;
    this.jumpForce = -12;
    this.pipes = [];
    this.coins = [];
    this.pipeFreq = 120;
    this.pipeTimer = 0;
    this.bestScore = parseInt(localStorage.getItem("flappybird_best") || "0");
    this.combo = 0;
    this.comboTimer = 0;
    this.setupControls();
  }

  setupControls() {
    document.addEventListener("keydown", (e) => {
      if (e.key === " ") {
        e.preventDefault();
        this.bird.vy = this.jumpForce;
      }
    });

    this.canvas.addEventListener("click", () => {
      this.bird.vy = this.jumpForce;
    });

    this.canvas.addEventListener("touchstart", (e) => {
      e.preventDefault();
      this.bird.vy = this.jumpForce;
    });

    if (MobileControlsManager.isMobileDevice()) {
      const jumpBtn = MobileControlsManager.createButton("▲", "bottom-right");
      MobileControlsManager.onButton(({ label, state }) => {
        if (label === "▲" && state === "down") {
          this.bird.vy = this.jumpForce;
        }
      });
    }
  }

  update(dt) {
    // Bird physics
    this.bird.vy += this.gravity;
    this.bird.y += this.bird.vy;

    // Boundary check
    if (this.bird.y + this.bird.h > this.height) {
      this.endGame();
      return;
    }
    if (this.bird.y < 0) {
      this.bird.y = 0;
      this.bird.vy = 0;
    }

    // Spawn pipes
    this.pipeTimer++;
    if (this.pipeTimer >= this.pipeFreq) {
      this.spawnPipe();
      this.pipeTimer = 0;
      if (this.pipeFreq > 80) this.pipeFreq -= 1;
    }

    // Update pipes
    for (let i = this.pipes.length - 1; i >= 0; i--) {
      const pipe = this.pipes[i];
      pipe.x -= 4;

      // Check collision
      if (this.checkCollision(this.bird, pipe.top) || this.checkCollision(this.bird, pipe.bottom)) {
        this.endGame();
        return;
      }

      // Check if passed
      if (pipe.x + pipe.w < this.bird.x && !pipe.scored) {
        pipe.scored = true;
        this.score++;
        this.combo++;
        this.comboTimer = 60;
        if (this.score % 5 === 0) this.coins += 10;
        if (this.score % 10 === 0) this.level++;
        AudioManager.play("coin");
        this.emitParticle(this.bird.x, this.bird.y, { count: 5, color: '#FFD700' });
      }

      // Remove off-screen pipes
      if (pipe.x + pipe.w < 0) {
        this.pipes.splice(i, 1);
      }
    }

    // Update coins
    for (let i = this.coins.length - 1; i >= 0; i--) {
      const coin = this.coins[i];
      coin.x -= 4;
      coin.angle += 0.1;

      if (this.checkCollisionCircle(this.bird, coin)) {
        this.coins.splice(i, 1);
        this.coins += 5;
        AudioManager.play("powerup");
        this.emitParticle(coin.x, coin.y, { count: 10, color: '#FFD700' });
      }

      if (coin.x < -10) {
        this.coins.splice(i, 1);
      }
    }

    // Update combo
    if (this.comboTimer > 0) {
      this.comboTimer--;
    } else {
      this.combo = 0;
    }

    // Increase difficulty
    if (this.score > 0 && this.score % 20 === 0) {
      this.gravity = Math.min(0.7, this.gravity + 0.01);
      this.pipeFreq = Math.max(80, this.pipeFreq - 2);
    }
  }

  spawnPipe() {
    const gapSize = 100;
    const minGapY = 50;
    const maxGapY = this.height - gapSize - 50;
    const gapY = minGapY + Math.random() * (maxGapY - minGapY);

    this.pipes.push({
      x: this.width,
      w: 60,
      top: { x: this.width, y: 0, w: 60, h: gapY },
      bottom: { x: this.width, y: gapY + gapSize, w: 60, h: this.height - (gapY + gapSize) },
      scored: false
    });

    // Random coin
    if (Math.random() < 0.3) {
      this.coins.push({
        x: this.width + 30,
        y: gapY + 50 + Math.random() * (gapSize - 100),
        r: 8,
        angle: 0
      });
    }
  }

  checkCollision(bird, rect) {
    return !(bird.x + bird.w < rect.x || bird.x > rect.x + rect.w ||
             bird.y + bird.h < rect.y || bird.y > rect.y + rect.h);
  }

  checkCollisionCircle(bird, coin) {
    const dx = bird.x + bird.w / 2 - coin.x;
    const dy = bird.y + bird.h / 2 - coin.y;
    return Math.sqrt(dx * dx + dy * dy) < bird.w / 2 + coin.r;
  }

  render() {
    this.clear();

    // Background
    this.ctx.fillStyle = "rgba(255,255,255,0.1)";
    this.ctx.fillRect(0, 0, this.width, this.height);

    // Pipes
    this.ctx.fillStyle = "#2ECC71";
    this.pipes.forEach((pipe) => {
      this.ctx.fillRect(pipe.top.x, pipe.top.y, pipe.top.w, pipe.top.h);
      this.ctx.fillRect(pipe.bottom.x, pipe.bottom.y, pipe.bottom.w, pipe.bottom.h);
    });

    // Coins
    this.coins.forEach((coin) => {
      this.ctx.save();
      this.ctx.translate(coin.x, coin.y);
      this.ctx.rotate(coin.angle);
      this.ctx.fillStyle = "#FFD700";
      this.ctx.beginPath();
      this.ctx.arc(0, 0, coin.r, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.strokeStyle = "#FFA500";
      this.ctx.lineWidth = 2;
      this.ctx.stroke();
      this.ctx.restore();
    });

    // Bird
    this.ctx.save();
    this.ctx.translate(this.bird.x + this.bird.w / 2, this.bird.y + this.bird.h / 2);
    this.ctx.rotate(this.bird.vy * 0.1);
    this.ctx.fillStyle = "#FF6B6B";
    this.ctx.fillRect(-this.bird.w / 2, -this.bird.h / 2, this.bird.w, this.bird.h);
    this.ctx.fillStyle = "white";
    this.ctx.beginPath();
    this.ctx.arc(5, -3, 2, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.restore();

    // HUD
    this.drawText("Score: " + this.score, 20, 30, { size: 16 });
    this.drawText("Level: " + this.level, 20, 50, { size: 16 });
    if (this.combo > 1) {
      this.drawText("Combo x" + this.combo + "!", this.width / 2, 40, { size: 24, align: "center", color: "#FFD700" });
    }

    ParticleManager.render(this.ctx);

    if (this.paused) {
      this.ctx.fillStyle = "rgba(0,0,0,0.7)";
      this.ctx.fillRect(0, 0, this.width, this.height);
      this.drawText("PAUSED", this.width / 2, this.height / 2, { size: 40, align: "center" });
    }
  }

  endGame() {
    super.endGame();
    if (this.score > this.bestScore) {
      this.bestScore = this.score;
      localStorage.setItem("flappybird_best", this.bestScore);
      AudioManager.play("achievement");
    }
  }
}

game = new FlappyBird();
game.start();
