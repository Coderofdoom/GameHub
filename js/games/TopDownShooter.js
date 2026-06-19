class TopDownShooter extends GameTemplate {
  initGame() {
    this.player = { x: this.width/2, y: this.height-50, vx: 0, vy: 0, width: 25, height: 35, angle: 0, speed: 4 };
    this.bullets = [];
    this.enemies = [];
    this.explosions = [];
    this.wave = 1;
    this.waveEnemies = 0;
    this.waveKilled = 0;
    this.spawnWave();
  }
  spawnWave() {
    this.waveEnemies = this.wave + 4;
    this.waveKilled = 0;
    for (let i = 0; i < this.waveEnemies; i++) {
      const x = Math.random() * this.width;
      const y = Math.random() * (this.height/2);
      this.enemies.push({x, y, vx: Math.random()*2-1, vy: Math.random()*2-1, health: 1 + Math.floor(this.wave/3), maxHealth: 1 + Math.floor(this.wave/3), radius: 10});
    }
  }
  setupControls() {
    super.setupControls();
    const keys = {};
    document.addEventListener('keydown', e => { keys[e.key] = true; });
    document.addEventListener('keyup', e => { keys[e.key] = false; });
    document.addEventListener('mousemove', e => {
      const rect = this.canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      this.player.angle = Math.atan2(my - this.player.y, mx - this.player.x);
    });
    this.canvas.addEventListener('click', () => this.shoot());
    if (MobileControlsManager.isMobileDevice()) {
      MobileControlsManager.createButton('🔥 SHOOT', 'bottom-center');
      MobileControlsManager.createButton('↑ UP', 'top-center');
      MobileControlsManager.createButton('↓ DOWN', 'bottom-center-2');
      MobileControlsManager.onMove(state => {
        this.player.angle = Math.atan2(state.y, state.x);
      });
      MobileControlsManager.onButton(({label, state}) => {
        if (label === '🔥 SHOOT' && state === 'down') this.shoot();
        if (label === '↑ UP' && state === 'down') this.player.vy = -this.player.speed;
        if (label === '↓ DOWN' && state === 'down') this.player.vy = this.player.speed;
        if (state === 'up' && (label === '↑ UP' || label === '↓ DOWN')) this.player.vy = 0;
      });
    }
    this.updateControls = () => {
      this.player.vx = 0;
      this.player.vy = 0;
      if (keys['ArrowUp'] || keys['w']) this.player.vy = -this.player.speed;
      if (keys['ArrowDown'] || keys['s']) this.player.vy = this.player.speed;
      if (keys['ArrowLeft'] || keys['a']) this.player.vx = -this.player.speed;
      if (keys['ArrowRight'] || keys['d']) this.player.vx = this.player.speed;
      if (keys[' ']) this.shoot();
    };
  }
  update(dt) {
    this.updateControls();
    this.player.x += this.player.vx;
    this.player.y += this.player.vy;
    this.player.x = Math.max(this.player.width/2, Math.min(this.player.x, this.width - this.player.width/2));
    this.player.y = Math.max(this.player.height/2, Math.min(this.player.y, this.height - this.player.height/2));
    this.bullets = this.bullets.filter(b => {
      b.x += b.vx; b.y += b.vy;
      for (let i = this.enemies.length-1; i >= 0; i--) {
        let e = this.enemies[i];
        if (Math.hypot(b.x - e.x, b.y - e.y) < e.radius + 3) {
          e.health--;
          this.score += 10;
          this.explosions.push({x: b.x, y: b.y, life: 8, radius: 0});
          if (e.health <= 0) {
            this.enemies.splice(i, 1);
            this.coins_earned++;
            this.emitParticle(e.x, e.y, {count: 12, color: '#FF6B6B'});
            AudioManager.play('coin');
          }
          return false;
        }
      }
      return b.x > -10 && b.x < this.width + 10 && b.y > -10 && b.y < this.height + 10;
    });
    this.enemies = this.enemies.filter(e => {
      e.x += e.vx;
      e.y += e.vy;
      if (e.x < 0 || e.x > this.width) e.vx *= -1;
      if (e.y < 0 || e.y > this.height) e.vy *= -1;
      const dx = this.player.x - e.x, dy = this.player.y - e.y;
      if (Math.hypot(dx, dy) < this.player.width/2 + e.radius) {
        this.endGame();
        AudioManager.play('gameOver');
      }
      return true;
    });
    this.explosions = this.explosions.filter(e => { e.life--; e.radius += 2; return e.life > 0; });
    if (this.enemies.length === 0 && this.waveKilled === this.waveEnemies) {
      this.wave++; this.spawnWave();
      AudioManager.play('coin');
    }
  }
  shoot() {
    this.bullets.push({
      x: this.player.x + Math.cos(this.player.angle)*15,
      y: this.player.y + Math.sin(this.player.angle)*15,
      vx: Math.cos(this.player.angle)*6,
      vy: Math.sin(this.player.angle)*6
    });
    this.waveKilled++;
    AudioManager.play('shoot');
  }
  render() {
    this.clear();
    this.ctx.save();
    this.ctx.translate(this.player.x, this.player.y);
    this.ctx.rotate(this.player.angle);
    this.ctx.fillStyle = '#00ff00';
    this.ctx.fillRect(-this.player.width/2, -this.player.height/2, this.player.width, this.player.height);
    this.ctx.fillRect(-3, -this.player.height/2-8, 6, 8);
    this.ctx.restore();
    this.enemies.forEach(e => {
      this.ctx.fillStyle = '#ff0000';
      this.ctx.beginPath();
      this.ctx.arc(e.x, e.y, e.radius, 0, Math.PI*2);
      this.ctx.fill();
      const hpRatio = e.health / e.maxHealth;
      this.ctx.fillStyle = '#00ff00';
      this.ctx.fillRect(e.x - 10, e.y - 18, 20 * hpRatio, 3);
    });
    this.bullets.forEach(b => {
      this.ctx.fillStyle = '#ffff00';
      this.ctx.fillRect(b.x-2, b.y-2, 4, 4);
    });
    this.explosions.forEach(e => {
      this.ctx.strokeStyle = 'rgba(255, 165, 0, '+(e.life/8)+')';
      this.ctx.lineWidth = 2;
      this.ctx.beginPath();
      this.ctx.arc(e.x, e.y, e.radius, 0, Math.PI*2);
      this.ctx.stroke();
    });
    this.drawText('Wave: '+this.wave, 20, 25, {size: 14});
    this.drawText('Coins: '+this.coins_earned, this.width-120, 25, {size: 14});
    ParticleManager.render(this.ctx);
  }
}
game = new TopDownShooter();
game.coins_earned = 0;
game.updateControls = () => {};
game.start();
