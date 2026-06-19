class ArenaSurvival extends GameTemplate {
  initGame() {
    this.player = { x: this.width/2, y: this.height/2, vx: 0, vy: 0, width: 25, height: 35, health: 100, maxHealth: 100, speed: 3.5, fireRate: 0 };
    this.bullets = [];
    this.enemies = [];
    this.powerups = [];
    this.wave = 1;
    this.waveTimer = 0;
    this.enemyCount = 5;
    this.spawnWave();
  }
  spawnWave() {
    this.enemyCount = 5 + this.wave * 2;
    for (let i = 0; i < this.enemyCount; i++) {
      let x, y;
      if (Math.random() < 0.5) {
        x = Math.random() < 0.5 ? -30 : this.width + 30;
        y = Math.random() * this.height;
      } else {
        x = Math.random() * this.width;
        y = Math.random() < 0.5 ? -30 : this.height + 30;
      }
      this.enemies.push({
        x, y, vx: 0, vy: 0, health: 1 + Math.floor(this.wave*0.3), maxHealth: 1 + Math.floor(this.wave*0.3), radius: 12
      });
      const dx = this.player.x - x, dy = this.player.y - y, dist = Math.hypot(dx, dy);
      this.enemies[this.enemies.length-1].vx = (dx/dist) * 1.5;
      this.enemies[this.enemies.length-1].vy = (dy/dist) * 1.5;
    }
  }
  setupControls() {
    super.setupControls();
    const keys = {};
    document.addEventListener('keydown', e => { keys[e.key] = true; });
    document.addEventListener('keyup', e => { keys[e.key] = false; });
    this.canvas.addEventListener('click', () => this.shoot());
    if (MobileControlsManager.isMobileDevice()) {
      MobileControlsManager.createButton('🔥 SHOOT', 'bottom-center');
      MobileControlsManager.onMove(state => {
        this.player.vx = state.x * this.player.speed;
        this.player.vy = state.y * this.player.speed;
      });
      MobileControlsManager.onButton(({label, state}) => {
        if (label === '🔥 SHOOT' && state === 'down') this.player.fireRate = 1;
        if (state === 'up') this.player.fireRate = 0;
      });
    }
    this.updateControls = () => {
      this.player.vx = 0;
      this.player.vy = 0;
      if (keys['ArrowUp'] || keys['w']) this.player.vy = -this.player.speed;
      if (keys['ArrowDown'] || keys['s']) this.player.vy = this.player.speed;
      if (keys['ArrowLeft'] || keys['a']) this.player.vx = -this.player.speed;
      if (keys['ArrowRight'] || keys['d']) this.player.vx = this.player.speed;
      if (keys[' ']) this.player.fireRate = 1;
    };
  }
  update(dt) {
    this.updateControls();
    this.player.x += this.player.vx;
    this.player.y += this.player.vy;
    this.player.x = Math.max(0, Math.min(this.player.x, this.width));
    this.player.y = Math.max(0, Math.min(this.player.y, this.height));
    if (this.player.fireRate > 0) {
      this.shoot();
      this.player.fireRate -= dt;
    }
    this.bullets = this.bullets.filter(b => {
      b.x += b.vx; b.y += b.vy;
      for (let i = this.enemies.length-1; i >= 0; i--) {
        let e = this.enemies[i];
        if (Math.hypot(b.x - e.x, b.y - e.y) < e.radius + 3) {
          e.health--;
          if (e.health <= 0) {
            this.enemies.splice(i, 1);
            this.score += 10; this.coins_earned++;
            this.emitParticle(e.x, e.y, {count: 10, color: '#FF6B6B'});
            AudioManager.play('coin');
            if (Math.random() < 0.2) this.powerups.push({x: e.x, y: e.y, type: 'health', vx: 0, vy: 0});
          }
          return false;
        }
      }
      return b.x > -10 && b.x < this.width + 10 && b.y > -10 && b.y < this.height + 10;
    });
    this.powerups = this.powerups.filter(p => {
      if (Math.hypot(this.player.x - p.x, this.player.y - p.y) < 25) {
        if (p.type === 'health') this.player.health = Math.min(this.player.maxHealth, this.player.health + 25);
        AudioManager.play('coin');
        return false;
      }
      return true;
    });
    this.enemies = this.enemies.filter(e => {
      const dx = this.player.x - e.x, dy = this.player.y - e.y, dist = Math.hypot(dx, dy);
      e.vx = (dx/dist) * 1.5;
      e.vy = (dy/dist) * 1.5;
      e.x += e.vx;
      e.y += e.vy;
      if (Math.hypot(e.x - this.player.x, e.y - this.player.y) < this.player.width/2 + e.radius) {
        this.player.health -= 5;
        if (this.player.health <= 0) this.endGame();
      }
      return true;
    });
    if (this.enemies.length === 0) {
      this.wave++; this.spawnWave();
      AudioManager.play('coin');
    }
  }
  shoot() {
    const angle = Math.atan2(this.height/2 - this.player.y, this.width/2 - this.player.x);
    this.bullets.push({
      x: this.player.x, y: this.player.y, vx: Math.cos(angle) * 5, vy: Math.sin(angle) * 5
    });
    AudioManager.play('shoot');
  }
  render() {
    this.clear();
    this.ctx.fillStyle = '#00ff00';
    this.ctx.fillRect(this.player.x - 12.5, this.player.y - 17.5, 25, 35);
    const hpRatio = this.player.health / this.player.maxHealth;
    this.ctx.fillStyle = '#ff0000';
    this.ctx.fillRect(20, 25, 100, 10);
    this.ctx.fillStyle = '#00ff00';
    this.ctx.fillRect(20, 25, 100 * hpRatio, 10);
    this.enemies.forEach(e => {
      this.ctx.fillStyle = '#ff0000';
      this.ctx.beginPath();
      this.ctx.arc(e.x, e.y, e.radius, 0, Math.PI*2);
      this.ctx.fill();
    });
    this.bullets.forEach(b => {
      this.ctx.fillStyle = '#ffff00';
      this.ctx.fillRect(b.x-2, b.y-2, 4, 4);
    });
    this.powerups.forEach(p => {
      this.ctx.fillStyle = '#00ffff';
      this.ctx.fillRect(p.x-8, p.y-8, 16, 16);
    });
    this.drawText('Wave: '+this.wave, 20, 50, {size: 14});
    this.drawText('Health: '+this.player.health, 20, 70, {size: 14});
    this.drawText('Coins: '+this.coins_earned, this.width-120, 25, {size: 14});
    ParticleManager.render(this.ctx);
  }
}
game = new ArenaSurvival();
game.coins_earned = 0;
game.updateControls = () => {};
game.start();
