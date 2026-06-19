class AgarIO extends GameTemplate {
  initGame() {
    this.width = 1400; this.height = 900;
    this.canvas.width = this.width; this.canvas.height = this.height;
    this.player = { x: this.width/2, y: this.height/2, vx: 0, vy: 0, radius: 15, mass: 100, speed: 3 };
    this.food = [];
    this.enemies = [];
    this.coins_earned = 0;
    this.spawnFood(80);
    this.spawnEnemies(5);
  }
  spawnFood(count) {
    for (let i = 0; i < count; i++) {
      this.food.push({ x: Math.random()*this.width, y: Math.random()*this.height, radius: 3 });
    }
  }
  spawnEnemies(count) {
    for (let i = 0; i < count; i++) {
      this.enemies.push({
        x: Math.random()*this.width, y: Math.random()*this.height,
        vx: (Math.random()-0.5)*2, vy: (Math.random()-0.5)*2, radius: 15, mass: 100
      });
    }
  }
  setupControls() {
    super.setupControls();
    this.canvas.addEventListener('mousemove', e => {
      const rect = this.canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left, my = e.clientY - rect.top;
      const angle = Math.atan2(my - this.canvas.height/2, mx - this.canvas.width/2);
      this.player.vx = Math.cos(angle) * this.player.speed;
      this.player.vy = Math.sin(angle) * this.player.speed;
    });
    this.canvas.addEventListener('click', () => this.split());
    if (MobileControlsManager.isMobileDevice()) {
      MobileControlsManager.createButton('⚡ SPLIT', 'bottom-center');
      MobileControlsManager.onMove(state => {
        this.player.vx = state.x * this.player.speed;
        this.player.vy = state.y * this.player.speed;
      });
      MobileControlsManager.onButton(({label, state}) => {
        if (label === '⚡ SPLIT' && state === 'down') this.split();
      });
    }
  }
  split() {
    if (this.player.mass > 50) {
      this.player.mass /= 2;
      this.player.radius = Math.sqrt(this.player.mass / Math.PI);
      this.emitParticle(this.player.x, this.player.y, {count: 15, color: '#00ff00'});
      AudioManager.play('shoot');
    }
  }
  update(dt) {
    this.player.x += this.player.vx;
    this.player.y += this.player.vy;
    this.player.x = Math.max(this.player.radius, Math.min(this.player.x, this.width - this.player.radius));
    this.player.y = Math.max(this.player.radius, Math.min(this.player.y, this.height - this.player.radius));
    for (let i = this.food.length-1; i >= 0; i--) {
      if (Math.hypot(this.player.x - this.food[i].x, this.player.y - this.food[i].y) < this.player.radius + this.food[i].radius) {
        this.player.mass += 5;
        this.player.radius = Math.sqrt(this.player.mass / Math.PI);
        this.player.speed = Math.max(1.5, 3 - this.player.radius/50);
        this.score = Math.floor(this.player.mass);
        this.coins_earned++;
        this.food.splice(i, 1);
        if (Math.random() < 0.2) this.food.push({ x: Math.random()*this.width, y: Math.random()*this.height, radius: 3 });
        AudioManager.play('coin');
      }
    }
    this.enemies.forEach((enemy, idx) => {
      const toPlayerX = this.player.x - enemy.x, toPlayerY = this.player.y - enemy.y, dist = Math.hypot(toPlayerX, toPlayerY);
      if (dist < 150) {
        enemy.vx += (toPlayerX/dist) * 0.05;
        enemy.vy += (toPlayerY/dist) * 0.05;
      } else if (Math.random() < 0.02) {
        enemy.vx = (Math.random()-0.5)*1.5;
        enemy.vy = (Math.random()-0.5)*1.5;
      }
      enemy.vx *= 0.98; enemy.vy *= 0.98;
      enemy.x += enemy.vx; enemy.y += enemy.vy;
      enemy.x = Math.max(enemy.radius, Math.min(enemy.x, this.width - enemy.radius));
      enemy.y = Math.max(enemy.radius, Math.min(enemy.y, this.height - enemy.radius));
      for (let i = this.food.length-1; i >= 0; i--) {
        if (Math.hypot(enemy.x - this.food[i].x, enemy.y - this.food[i].y) < enemy.radius + this.food[i].radius) {
          enemy.mass += 3; enemy.radius = Math.sqrt(enemy.mass / Math.PI);
          this.food.splice(i, 1);
        }
      }
      if (Math.hypot(this.player.x - enemy.x, this.player.y - enemy.y) < this.player.radius + enemy.radius) {
        if (this.player.mass > enemy.mass) {
          this.player.mass += enemy.mass;
          this.player.radius = Math.sqrt(this.player.mass / Math.PI);
          this.player.speed = Math.max(1.5, 3 - this.player.radius/50);
          this.score = Math.floor(this.player.mass);
          this.coins_earned += Math.floor(enemy.mass/5);
          this.enemies.splice(idx, 1);
          this.emitParticle(enemy.x, enemy.y, {count: 20, color: '#ff0000'});
          AudioManager.play('coin');
        } else {
          this.endGame();
          AudioManager.play('gameOver');
        }
      }
    });
  }
  render() {
    this.clear();
    const ctx = this.ctx;
    ctx.save();
    const cameraX = this.player.x - this.canvas.width/2, cameraY = this.player.y - this.canvas.height/2;
    ctx.translate(-cameraX, -cameraY);
    ctx.fillStyle = '#00ff00';
    ctx.beginPath();
    ctx.arc(this.player.x, this.player.y, this.player.radius, 0, Math.PI*2);
    ctx.fill();
    this.enemies.forEach(e => {
      ctx.fillStyle = '#ff0000';
      ctx.beginPath();
      ctx.arc(e.x, e.y, e.radius, 0, Math.PI*2);
      ctx.fill();
    });
    this.food.forEach(f => {
      ctx.fillStyle = '#FFD700';
      ctx.beginPath();
      ctx.arc(f.x, f.y, f.radius, 0, Math.PI*2);
      ctx.fill();
    });
    ctx.restore();
    this.drawText('Mass: '+this.score, 20, 25, {size: 14});
    this.drawText('Enemies: '+this.enemies.length, 20, 45, {size: 14});
    this.drawText('Coins: '+this.coins_earned, this.canvas.width-120, 25, {size: 14});
    ParticleManager.render(this.ctx);
  }
}
game = new AgarIO();
game.coins_earned = 0;
game.start();
