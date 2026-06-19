class TankArena extends GameTemplate {
  initGame() {
    this.player = { x: this.width/2, y: this.height/2, vx: 0, vy: 0, width: 35, height: 35, angle: 0, health: 100, speed: 3 };
    this.bullets = [];
    this.enemies = [];
    this.walls = [];
    this.kills = 0;
    this.wave = 1;
    this.spawnWalls();
    this.spawnEnemies(3);
  }
  spawnWalls() {
    this.walls = [
      {x: 150, y: 150, w: 200, h: 30},
      {x: this.width-350, y: 150, w: 200, h: 30},
      {x: 150, y: this.height-180, w: 200, h: 30},
      {x: this.width-350, y: this.height-180, w: 200, h: 30},
    ];
  }
  spawnEnemies(count) {
    for (let i = 0; i < count; i++) {
      let x, y;
      do { x = Math.random()*this.width; y = Math.random()*this.height; }
      while (Math.hypot(x - this.player.x, y - this.player.y) < 150);
      this.enemies.push({x, y, vx: 0, vy: 0, angle: 0, health: 30 + this.wave*10, maxHealth: 30 + this.wave*10, width: 30, height: 30, shootTimer: 0});
    }
  }
  setupControls() {
    super.setupControls();
    const keys = {};
    document.addEventListener('keydown', e => { keys[e.key] = true; });
    document.addEventListener('keyup', e => { keys[e.key] = false; });
    document.addEventListener('mousemove', e => {
      const rect = this.canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left, my = e.clientY - rect.top;
      this.player.angle = Math.atan2(my - this.player.y, mx - this.player.x);
    });
    document.addEventListener('click', () => this.shoot());
    if (MobileControlsManager.isMobileDevice()) {
      MobileControlsManager.createButton('🔥 SHOOT', 'bottom-center');
      MobileControlsManager.createButton('↑', 'top-center');
      MobileControlsManager.createButton('↓', 'bottom-center-2');
      MobileControlsManager.createButton('←', 'left-center');
      MobileControlsManager.createButton('→', 'right-center');
      MobileControlsManager.onMove(state => { this.player.angle = Math.atan2(state.y, state.x); });
      MobileControlsManager.onButton(({label, state}) => {
        if (label === '🔥 SHOOT' && state === 'down') this.shoot();
        if (label === '↑' && state === 'down') this.player.vy = -this.player.speed;
        if (label === '↓' && state === 'down') this.player.vy = this.player.speed;
        if (label === '←' && state === 'down') this.player.vx = -this.player.speed;
        if (label === '→' && state === 'down') this.player.vx = this.player.speed;
        if (state === 'up') { if (label === '↑' || label === '↓') this.player.vy = 0; if (label === '←' || label === '→') this.player.vx = 0; }
      });
    }
    this.updateControls = () => {
      this.player.vx = 0; this.player.vy = 0;
      if (keys['ArrowUp'] || keys['w']) this.player.vy = -this.player.speed;
      if (keys['ArrowDown'] || keys['s']) this.player.vy = this.player.speed;
      if (keys['ArrowLeft'] || keys['a']) this.player.vx = -this.player.speed;
      if (keys['ArrowRight'] || keys['d']) this.player.vx = this.player.speed;
      if (keys[' ']) this.shoot();
    };
  }
  shoot() {
    this.bullets.push({x: this.player.x + Math.cos(this.player.angle)*20, y: this.player.y + Math.sin(this.player.angle)*20, vx: Math.cos(this.player.angle)*5, vy: Math.sin(this.player.angle)*5});
    AudioManager.play('shoot');
  }
  update(dt) {
    this.updateControls();
    this.player.x += this.player.vx; this.player.y += this.player.vy;
    for (let wall of this.walls) {
      if (this.player.x + this.player.width/2 > wall.x && this.player.x - this.player.width/2 < wall.x + wall.w && this.player.y + this.player.height/2 > wall.y && this.player.y - this.player.height/2 < wall.y + wall.h) {
        this.player.x -= this.player.vx; this.player.y -= this.player.vy;
      }
    }
    this.player.x = Math.max(0, Math.min(this.player.x, this.width));
    this.player.y = Math.max(0, Math.min(this.player.y, this.height));
    this.bullets = this.bullets.filter(b => {
      b.x += b.vx; b.y += b.vy;
      for (let wall of this.walls) {
        if (b.x > wall.x && b.x < wall.x + wall.w && b.y > wall.y && b.y < wall.y + wall.h) return false;
      }
      for (let i = this.enemies.length-1; i >= 0; i--) {
        let e = this.enemies[i];
        if (Math.hypot(b.x - e.x, b.y - e.y) < 25) {
          e.health--;
          if (e.health <= 0) {
            this.enemies.splice(i, 1);
            this.score++; this.kills++;
            this.coins_earned += 5;
            this.emitParticle(e.x, e.y, {count: 15, color: '#ff0000'});
            AudioManager.play('coin');
          }
          return false;
        }
      }
      return b.x > -10 && b.x < this.width+10 && b.y > -10 && b.y < this.height+10;
    });
    this.enemies = this.enemies.filter(e => {
      e.shootTimer -= dt;
      const dx = this.player.x - e.x, dy = this.player.y - e.y, dist = Math.hypot(dx, dy);
      if (dist < 300) {
        e.vx += (dx/dist)*0.5; e.vy += (dy/dist)*0.5;
        if (e.shootTimer < 0) {
          e.angle = Math.atan2(this.player.y - e.y, this.player.x - e.x);
          this.bullets.push({x: e.x + Math.cos(e.angle)*15, y: e.y + Math.sin(e.angle)*15, vx: Math.cos(e.angle)*3.5, vy: Math.sin(e.angle)*3.5});
          e.shootTimer = 1;
        }
      }
      e.vx *= 0.9; e.vy *= 0.9;
      e.x += e.vx; e.y += e.vy;
      for (let wall of this.walls) {
        if (e.x + e.width/2 > wall.x && e.x - e.width/2 < wall.x + wall.w && e.y + e.height/2 > wall.y && e.y - e.height/2 < wall.y + wall.h) {
          e.x -= e.vx; e.y -= e.vy;
        }
      }
      e.x = Math.max(e.width/2, Math.min(e.x, this.width - e.width/2));
      e.y = Math.max(e.height/2, Math.min(e.y, this.height - e.height/2));
      if (Math.hypot(this.player.x - e.x, this.player.y - e.y) < 30) {
        this.player.health -= 5;
        if (this.player.health <= 0) this.endGame();
      }
      return true;
    });
    if (this.enemies.length === 0) {
      this.wave++; this.spawnEnemies(3 + this.wave);
      AudioManager.play('coin');
    }
  }
  render() {
    this.clear();
    this.ctx.fillStyle = '#888888';
    for (let wall of this.walls) {
      this.ctx.fillRect(wall.x, wall.y, wall.w, wall.h);
    }
    this.ctx.save();
    this.ctx.translate(this.player.x, this.player.y);
    this.ctx.rotate(this.player.angle);
    this.ctx.fillStyle = '#00ff00';
    this.ctx.fillRect(-17.5, -17.5, 35, 35);
    this.ctx.fillRect(10, -5, 15, 10);
    this.ctx.restore();
    this.enemies.forEach(e => {
      this.ctx.save();
      this.ctx.translate(e.x, e.y);
      this.ctx.rotate(e.angle);
      this.ctx.fillStyle = '#ff0000';
      this.ctx.fillRect(-15, -15, 30, 30);
      this.ctx.fillRect(10, -4, 12, 8);
      this.ctx.restore();
    });
    this.bullets.forEach(b => {
      this.ctx.fillStyle = '#ffff00';
      this.ctx.fillRect(b.x-3, b.y-3, 6, 6);
    });
    const hpRatio = this.player.health / 100;
    this.ctx.fillStyle = '#ff0000';
    this.ctx.fillRect(20, 25, 100, 10);
    this.ctx.fillStyle = '#00ff00';
    this.ctx.fillRect(20, 25, 100*hpRatio, 10);
    this.drawText('Wave: '+this.wave, 20, 50, {size: 14});
    this.drawText('Kills: '+this.kills, this.width/2, 25, {size: 14, align: 'center'});
    this.drawText('Coins: '+this.coins_earned, this.width-120, 25, {size: 14});
    ParticleManager.render(this.ctx);
  }
}
game = new TankArena();
game.coins_earned = 0;
game.updateControls = () => {};
game.start();
