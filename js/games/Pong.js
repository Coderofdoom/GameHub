/**
 * Pong — 2-player or vs AI, smooth physics
 */
class Pong extends GameTemplate {
  initGame() {
    this.paddleH = 80;
    this.paddleW = 10;
    this.player = { x: 10, y: this.height / 2 - this.paddleH / 2, dy: 0 };
    this.enemy = { x: this.width - 20, y: this.height / 2 - this.paddleH / 2, dy: 0 };
    this.ball = { x: this.width / 2, y: this.height / 2, vx: 5, vy: 3, r: 5 };
    this.playerScore = 0;
    this.enemyScore = 0;
    this.maxScore = 0;
    this.setupControls();
  }

  setupControls() {
    const keyState = {};
    document.addEventListener("keydown", (e) => { keyState[e.key] = true; });
    document.addEventListener("keyup", (e) => { keyState[e.key] = false; });

    this.getPlayerInput = () => {
      if (keyState["ArrowUp"] || keyState["w"]) return -1;
      if (keyState["ArrowDown"] || keyState["s"]) return 1;
      return 0;
    };

    this.canvas.addEventListener("touchmove", (e) => {
      const touch = e.touches[0];
      const rect = this.canvas.getBoundingClientRect();
      const y = touch.clientY - rect.top;
      const targetY = y - this.paddleH / 2;
      const currentY = this.player.y;
      const diff = targetY - currentY;
      this.player.dy = Math.max(-8, Math.min(8, diff * 0.1));
      e.preventDefault();
    });

    if (MobileControlsManager.isMobileDevice()) {
      MobileControlsManager.onMove((state) => {
        this.player.dy = state.y * 6;
      });
    }
  }

  update(dt) {
    const speed = 5;
    const input = this.getPlayerInput();
    this.player.dy = input * speed;

    // Player movement
    this.player.y += this.player.dy;
    this.player.y = Math.max(0, Math.min(this.height - this.paddleH, this.player.y));

    // Enemy AI
    const enemyCenterY = this.enemy.y + this.paddleH / 2;
    const ballCenterY = this.ball.y;
    const diff = ballCenterY - enemyCenterY;
    this.enemy.dy = Math.sign(diff) * Math.min(speed, Math.abs(diff) * 0.1);
    this.enemy.y = Math.max(0, Math.min(this.height - this.paddleH, this.enemy.y + this.enemy.dy));

    // Ball physics
    this.ball.x += this.ball.vx;
    this.ball.y += this.ball.vy;

    // Bounce off top/bottom
    if (this.ball.y - this.ball.r < 0 || this.ball.y + this.ball.r > this.height) {
      this.ball.vy *= -1;
      this.ball.y = Math.max(this.ball.r, Math.min(this.height - this.ball.r, this.ball.y));
      AudioManager.play("hit");
      this.emitParticle(this.ball.x, this.ball.y, { count: 3 });
    }

    // Check paddle collisions
    if (this.checkPaddleCollision(this.ball, this.player)) {
      this.ball.vx = Math.abs(this.ball.vx) + 0.5;
      this.ball.x = this.player.x + this.paddleW + this.ball.r;
      this.ball.vy += this.player.dy * 0.3;
      AudioManager.play("shoot");
      this.emitParticle(this.ball.x, this.ball.y, { count: 5, color: '#00ff88' });
    }

    if (this.checkPaddleCollision(this.ball, this.enemy)) {
      this.ball.vx = -Math.abs(this.ball.vx) - 0.5;
      this.ball.x = this.enemy.x - this.ball.r;
      this.ball.vy += this.enemy.dy * 0.3;
      AudioManager.play("shoot");
      this.emitParticle(this.ball.x, this.ball.y, { count: 5, color: '#c300ff' });
    }

    // Score
    if (this.ball.x - this.ball.r < 0) {
      this.enemyScore++;
      this.resetBall();
    }
    if (this.ball.x + this.ball.r > this.width) {
      this.playerScore++;
      this.coins += 5;
      AudioManager.play("coin");
      this.resetBall();
    }

    // Cap speed
    this.ball.vx = Math.max(-10, Math.min(10, this.ball.vx));
    this.ball.vy = Math.max(-8, Math.min(8, this.ball.vy));

    // Win condition
    if (this.playerScore > this.maxScore) {
      this.maxScore = this.playerScore;
    }
    if (this.playerScore >= 5) {
      this.score = this.playerScore * 10;
      this.endGame();
    }
  }

  checkPaddleCollision(ball, paddle) {
    return !(ball.x + ball.r < paddle.x || ball.x - ball.r > paddle.x + this.paddleW ||
             ball.y + ball.r < paddle.y || ball.y - ball.r > paddle.y + this.paddleH);
  }

  resetBall() {
    this.ball.x = this.width / 2;
    this.ball.y = this.height / 2;
    const angle = (Math.random() - 0.5) * 0.5;
    this.ball.vx = (Math.random() > 0.5 ? 1 : -1) * 4;
    this.ball.vy = angle * 8;
  }

  render() {
    this.clear();

    // Center line
    for (let y = 0; y < this.height; y += 20) {
      this.drawRect(this.width / 2 - 1, y, 2, 10, "rgba(0,247,255,0.2)");
    }

    // Paddles
    this.drawRect(this.player.x, this.player.y, this.paddleW, this.paddleH, "#00f7ff");
    this.drawRect(this.enemy.x, this.enemy.y, this.paddleW, this.paddleH, "#c300ff");

    // Ball
    this.drawCircle(this.ball.x, this.ball.y, this.ball.r, "#FFD700");

    // Scores
    this.drawText(this.playerScore, this.width / 4, 40, { size: 32, align: "center", color: "#00f7ff" });
    this.drawText(this.enemyScore, (this.width * 3) / 4, 40, { size: 32, align: "center", color: "#c300ff" });

    ParticleManager.render(this.ctx);
  }
}

game = new Pong();
game.start();
