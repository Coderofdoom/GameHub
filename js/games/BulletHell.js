class BulletHell extends GameTemplate {
  initGame() {
    this.player = { x: this.width/2, y: this.height-60, vx: 0, vy: 0, width: 20, height: 20, speed: 4, shield: 100 };
    this.bullets = [];
    this.enemy = { x: this.width/2, y: 80, health: 50, maxHealth: 50, shootAngle: 0, pattern: 0 };
    this.level = 1;
    this.enemyShootTimer = 0;
    this.currentPattern = 0;
  }
  setupControls() {
    super.setupControls();
    const keys = {};
    document.addEventListener('keydown', e => { keys[e.key] = true; });
    document.addEventListener('keyup', e => { keys[e.key] = false; });
    if (MobileControlsManager.isMobileDevice()) {
      MobileControlsManager.createButton('← Left', 'bottom-left');
      MobileControlsManager.createButton('Right →', 'bottom-right');
      MobileControlsManager.onMove(state => {
        this.player.vx = state.x * this.player.speed;
      });
      MobileControlsManager.onButton(({label, state}) => {
        if (label === '← Left') this.player.vx = state === 'down' ? -this.player.speed : 0;
        if (label === 'Right →') this.player.vx = state === 'down' ? this.player.speed : 0;
      });
    }
    this.updateControls = () => {
      this.player.vx = 0;
      if (keys['ArrowLeft'] || keys['a']) this.player.vx = -this.player.speed;
      if (keys['ArrowRight'] || keys['d']) this.player.vx = this.player.speed;
    };
  }
  update(dt) {
    this.updateControls();
    this.player.x += this.player.vx;
    this.player.x = Math.max(this.player.width/2, Math.min(this.player.x, this.width - this.player.width/2));
    this.enemyShootTimer -= dt;
    if (this.enemyShootTimer < 0) {
      this.enemyShoot();
      this.enemyShootTimer = 0.2;
    }
    this.bullets = this.bullets.filter(b => {
      b.x += b.vx; b.y += b.vy;
      if (b.player) {
        if (Math.hypot(b.x - this.enemy.x, b.y - this.enemy.y) < 30) {
          this.enemy.health--;
          this.score += 10;
          this.emitParticle(b.x, b.y, {count: 8, color: '#FFD700'});
          AudioManager.play('coin');
          if (this.enemy.health <= 0) {
            this.level++; this.coins_earned += 10;
            this.enemy = { x: this.width/2, y: 80, health: 30 + this.level*10, maxHealth: 30 + this.level*10, shootAngle: 0 };
            this.currentPattern = (this.currentPattern + 1) % 3;
          }
          return false;
        }
      } else {
        if (Math.hypot(b.x - this.player.x, b.y - this.player.y) < 15) {
          this.player.shield -= 10;
          this.emitParticle(this.player.x, this.player.y, {count: 12, color: '#FF0000'});
          if (this.player.shield <= 0) this.endGame();
          return false;
        }
      }
      return b.x > -10 && b.x < this.width+10 && b.y > -10 && b.y < this.height+10;
    });
  }
  enemyShoot() {
    const pattern = this.currentPattern;
    if (pattern === 0) {
      for (let i = 0; i < 8; i++) {
        const angle = (i / 8) * Math.PI * 2 + this.enemy.shootAngle;
        this.bullets.push({
          x: this.enemy.x, y: this.enemy.y,
          vx: Math.cos(angle) * 2.5, vy: Math.sin(angle) * 2.5,
          player: false
        });
      }
    } else if (pattern === 1) {
      for (let i = -3; i <= 3; i++) {
        this.bullets.push({
          x: this.enemy.x + i*15, y: this.enemy.y,
          vx: 0, vy: 2,
          player: false
        });
      }
    } else {
      for (let i = 0; i < 12; i++) {
        const angle = (i / 12) * Math.PI * 2;
        this.bullets.push({
          x: this.enemy.x, y: this.enemy.y,
          vx: Math.cos(angle) * (1.5 + Math.random()), vy: Math.sin(angle) * (1.5 + Math.random()),
          player: false
        });
      }
    }
    this.enemy.shootAngle += 0.2;
    AudioManager.play('shoot');
  }
  render() {
    this.clear('#001a4d');
    this.ctx.fillStyle = '#00ff00';
    this.ctx.fillRect(this.player.x - this.player.width/2, this.player.y - this.player.height/2, this.player.width, this.player.height);
    this.ctx.fillStyle = '#ffff00';
    for (let i = 0; i < 3; i++) {
      this.ctx.fillRect(this.player.x - 8 + i*8, this.player.y - this.player.height/2 - 5, 4, 5);
    }
    this.ctx.fillStyle = '#ff0000';
    this.ctx.beginPath();
    this.ctx.arc(this.enemy.x, this.enemy.y, 30, 0, Math.PI*2);
    this.ctx.fill();
    const hpRatio = this.enemy.health / this.enemy.maxHealth;
    this.ctx.fillStyle = '#ff0000';
    this.ctx.fillRect(20, 25, 150, 8);
    this.ctx.fillStyle = '#00ff00';
    this.ctx.fillRect(20, 25, 150 * hpRatio, 8);
    this.bullets.forEach(b => {
      this.ctx.fillStyle = b.player ? '#FFD700' : '#00ffff';
      this.ctx.fillRect(b.x-3, b.y-3, 6, 6);
    });
    this.drawText('Shield: '+this.player.shield, 20, 50, {size: 14, color: '#00ff00'});
    this.drawText('Level: '+this.level, this.width/2, 25, {size: 14, align: 'center'});
    this.drawText('Coins: '+this.coins_earned, this.width-120, 25, {size: 14});
    ParticleManager.render(this.ctx);
  }
}
game = new BulletHell();
game.coins_earned = 0;
game.updateControls = () => {};
game.start();
