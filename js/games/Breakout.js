/**
 * Breakout — Paddle, brick destruction, powerups
 */
class Breakout extends GameTemplate {
  initGame() {
    this.paddle = { x: this.width / 2 - 40, y: this.height - 30, w: 80, h: 10, speed: 8 };
    this.ball = { x: this.paddle.x + 40, y: this.paddle.y - 10, vx: 4, vy: -5, r: 6, attached: true };
    this.bricks = [];
    this.powerups = [];
    this.lives = 3;
    this.brickCounter = 0;
    this.setupBricks();
    this.setupControls();
  }

  setupBricks() {
    const cols = 10;
    const rows = 5;
    const brickW = this.width / cols;
    const brickH = 20;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        this.bricks.push({
          x: c * brickW,
          y: 40 + r * (brickH + 5),
          w: brickW - 2,
          h: brickH,
          health: 1,
          color: ["#00f7ff", "#c300ff", "#00ff88"][r % 3]
        });
      }
    }
  }

  setupControls() {
    const keyState = {};
    document.addEventListener("keydown", (e) => { keyState[e.key] = true; });
    document.addEventListener("keyup", (e) => { keyState[e.key] = false; });

    this.getInput = () => {
      if (keyState["ArrowLeft"] || keyState["a"]) return -1;
      if (keyState["ArrowRight"] || keyState["d"]) return 1;
      return 0;
    };

    this.canvas.addEventListener("click", () => {
      if (this.ball.attached) this.ball.attached = false;
    });

    this.canvas.addEventListener("touchstart", () => {
      if (this.ball.attached) this.ball.attached = false;
    });

    if (MobileControlsManager.isMobileDevice()) {
      MobileControlsManager.onMove((state) => {
        this.paddle.x += state.x * this.paddle.speed * 2;
      });
    }
  }

  update(dt) {
    // Paddle movement
    const input = this.getInput();
    this.paddle.x += input * this.paddle.speed * 2;
    this.paddle.x = Math.max(0, Math.min(this.width - this.paddle.w, this.paddle.x));

    // Ball attached to paddle
    if (this.ball.attached) {
      this.ball.x = this.paddle.x + this.paddle.w / 2;
      return;
    }

    // Ball physics
    this.ball.x += this.ball.vx;
    this.ball.y += this.ball.vy;

    // Bounce off walls
    if (this.ball.x - this.ball.r < 0 || this.ball.x + this.ball.r > this.width) {
      this.ball.vx *= -1;
      this.ball.x = Math.max(this.ball.r, Math.min(this.width - this.ball.r, this.ball.x));
      AudioManager.play("hit");
    }

    if (this.ball.y - this.ball.r < 0) {
      this.ball.vy *= -1;
      AudioManager.play("hit");
    }

    // Lose condition
    if (this.ball.y - this.ball.r > this.height) {
      this.lives--;
      if (this.lives <= 0) {
        this.endGame();
        return;
      }
      this.ball.attached = true;
      this.ball.vx = 0;
      this.ball.vy = 0;
      AudioManager.play("gameOver");
    }

    // Paddle collision
    if (this.checkCollision(this.ball, {
      x: this.paddle.x,
      y: this.paddle.y,
      w: this.paddle.w,
      h: this.paddle.h
    })) {
      this.ball.vy *= -1;
      this.ball.y = this.paddle.y - this.ball.r;
      const relX = (this.ball.x - this.paddle.x) / this.paddle.w - 0.5;
      this.ball.vx = relX * 10;
      AudioManager.play("shoot");
    }

    // Brick collisions
    for (let i = this.bricks.length - 1; i >= 0; i--) {
      const brick = this.bricks[i];
      if (this.checkCollision(this.ball, brick)) {
        brick.health--;
        this.score += 10;
        this.coins += 2;
        this.brickCounter++;

        // Bounce ball
        const brickCenterX = brick.x + brick.w / 2;
        const ballCenterX = this.ball.x;
        if (Math.abs(this.ball.vy) < Math.abs(this.ball.vx)) {
          this.ball.vy *= -1;
        } else {
          this.ball.vx *= -1;
        }

        this.emitParticle(brick.x + brick.w / 2, brick.y + brick.h / 2, { count: 8, color: brick.color });
        AudioManager.play("coin");

        // Spawn powerup
        if (Math.random() < 0.2) {
          this.powerups.push({
            x: brick.x + brick.w / 2,
            y: brick.y + brick.h,
            w: 15,
            h: 15,
            vy: 3,
            type: ["expand", "slow", "ball"][Math.floor(Math.random() * 3)]
          });
        }

        if (brick.health <= 0) {
          this.bricks.splice(i, 1);
        }
        break;
      }
    }

    // Powerups
    for (let i = this.powerups.length - 1; i >= 0; i--) {
      const p = this.powerups[i];
      p.y += p.vy;

      if (this.checkCollision(this.ball, {
        x: p.x,
        y: p.y,
        w: p.w,
        h: p.h
      }) || this.checkCollision(this.paddle, {
        x: p.x,
        y: p.y,
        w: p.w,
        h: p.h
      })) {
        if (p.type === "expand") this.paddle.w = Math.min(150, this.paddle.w + 20);
        if (p.type === "slow") this.ball.vx *= 0.7; this.ball.vy *= 0.7;
        if (p.type === "ball") this.lives++;
        this.powerups.splice(i, 1);
        AudioManager.play("powerup");
        continue;
      }

      if (p.y > this.height) {
        this.powerups.splice(i, 1);
      }
    }

    // Level up
    if (this.bricks.length === 0) {
      this.level++;
      this.setupBricks();
      this.ball.attached = true;
    }
  }

  checkCollision(ball, rect) {
    return !(ball.x + ball.r < rect.x || ball.x - ball.r > rect.x + rect.w ||
             ball.y + ball.r < rect.y || ball.y - ball.r > rect.y + rect.h);
  }

  render() {
    this.clear();

    // Bricks
    this.bricks.forEach((brick) => {
      this.drawRect(brick.x, brick.y, brick.w, brick.h, brick.color);
      this.ctx.strokeStyle = "rgba(255,255,255,0.3)";
      this.ctx.lineWidth = 1;
      this.ctx.strokeRect(brick.x, brick.y, brick.w, brick.h);
    });

    // Powerups
    this.powerups.forEach((p) => {
      this.drawRect(p.x, p.y, p.w, p.h, "#FFD700");
      this.drawText(["⬅", "↓", "⚡"][["expand", "slow", "ball"].indexOf(p.type)], p.x + 7.5, p.y + 10, { size: 10 });
    });

    // Paddle
    this.drawRect(this.paddle.x, this.paddle.y, this.paddle.w, this.paddle.h, "#00f7ff");

    // Ball
    this.drawCircle(this.ball.x, this.ball.y, this.ball.r, "#FFD700");

    // HUD
    this.drawText("Lives: " + this.lives, 20, 25, { size: 14 });
    this.drawText("Level: " + this.level, this.width / 2 - 30, 25, { size: 14 });

    ParticleManager.render(this.ctx);
  }
}

game = new Breakout();
game.start();
