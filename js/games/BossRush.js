class BossRush extends GameTemplate {
  initGame() {
    this.player = { x: this.width/2, y: this.height-60, vx: 0, vy: 0, width: 25, height: 35, speed: 4, health: 100 };
    this.boss = this.createBoss(1);
    this.bullets = [];
    this.bossAttacks = [];
    this.bossNum = 1;
    this.shootTimer = 0;
  }
  createBoss(num) {
    return {
      num, x: this.width/2, y: 100, vx: 0, vy: 0, width: 50, height: 50,
      health: 50 + num*30, maxHealth: 50 + num*30, shootTimer: 0, pattern: 0
    };
  }
  setupControls() {
    super.setupControls();
    const keys = {};
    document.addEventListener('keydown', e => { keys[e.key] = true; if (e.key === ' ') this.playerShoot(); });
    document.addEventListener('keyup', e => { keys[e.key] = false; });
    this.canvas.addEventListener('click', () => this.playerShoot());
    if (MobileControlsManager.isMobileDevice()) {
      MobileControlsManager.createButton('🔥 SHOOT', 'bottom-center');
      MobileControlsManager.createButton('← Left', 'bottom-left');
      MobileControlsManager.createButton('Right →', 'bottom-right');
      MobileControlsManager.onMove(state => {
        this.player.vx = state.x * this.player.speed;
      });
      MobileControlsManager.onButton(({label, state}) => {
        if (label === '🔥 SHOOT' && state === 'down') this.playerShoot();
        if (label === '← Left') this.player.vx = state === 'down' ? -this.player.speed : 0;
        if (label === 'Right →') this.player.vx = state === 'down' ? this.player.speed : 0;
      });
    }
    this.updateControls = () => {
      if (keys['ArrowLeft'] || keys['a']) this.player.vx = -this.player.speed;
      else if (keys['ArrowRight'] || keys['d']) this.player.vx = this.player.speed;
      else this.player.vx = 0;
    };
  }
  playerShoot() {
    this.bullets.push({ x: this.player.x, y: this.player.y-20, vx: 0, vy: -6 });
    AudioManager.play('shoot');
  }
  update(dt) {
    this.updateControls();
    this.player.x += this.player.vx;
    this.player.x = Math.max(0, Math.min(this.player.x, this.width));
    this.bullets = this.bullets.filter(b => {
      b.y -= 6;
      if (Math.hypot(b.x - this.boss.x, b.y - this.boss.y) < 40) {
        this.boss.health--;
        this.score += 5;
        this.emitParticle(b.x, b.y, {count: 8, color: '#FFD700'});
        if (this.boss.health <= 0) {
          this.bossNum++;
          this.coins_earned += 20 * this.bossNum;
          this.boss = this.createBoss(this.bossNum);
          AudioManager.play('coin');
        }
        return false;
      }
      return b.y > 0;
    });
    this.boss.shootTimer -= dt;
    if (this.boss.shootTimer < 0) {
      this.bossAttack();
      this.boss.shootTimer = 1.5 - Math.min(0.8, this.bossNum * 0.2);
    }
    this.boss.x += Math.sin(Date.now()*0.001) * 1.5;
    this.boss.x = Math.max(30, Math.min(this.boss.x, this.width-30));
    this.bossAttacks = this.bossAttacks.filter(a => {
      a.y += a.vy;
      if (Math.hypot(a.x - this.player.x, a.y - this.player.y) < 20) {
        this.player.health -= 10;
        this.emitParticle(a.x, a.y, {count: 10, color: '#FF0000'});
        if (this.player.health <= 0) this.endGame();
        return false;
      }
      return a.y < this.height;
    });
  }
  bossAttack() {
    const pattern = this.boss.pattern;
    this.boss.pattern = (pattern + 1) % 3;
    if (pattern === 0) {
      for (let i = -2; i <= 2; i++) {
        this.bossAttacks.push({ x: this.boss.x + i*20, y: this.boss.y, vx: 0, vy: 3 });
      }
    } else if (pattern === 1) {
      for (let i = 0; i < 8; i++) {
        const angle = (i/8) * Math.PI * 2;
        this.bossAttacks.push({
          x: this.boss.x, y: this.boss.y,
          vx: Math.cos(angle)*2, vy: Math.sin(angle)*2
        });
      }
    } else {
      for (let i = -1; i <= 1; i++) {
        this.bossAttacks.push({ x: this.boss.x + i*15, y: this.boss.y, vx: 0, vy: 4 });
      }
    }
    AudioManager.play('shoot');
  }
  render() {
    this.clear();
    this.ctx.fillStyle = '#00ff00';
    this.ctx.fillRect(this.player.x-12.5, this.player.y-17.5, 25, 35);
    this.ctx.fillStyle = '#8B0000';
    this.ctx.fillRect(this.boss.x - this.boss.width/2, this.boss.y - this.boss.height/2, this.boss.width, this.boss.height);
    this.ctx.fillStyle = '#ffff00';
    this.ctx.fillRect(this.boss.x-15, this.boss.y-15, 15, 15);
    this.ctx.fillRect(this.boss.x, this.boss.y-15, 15, 15);
    const bossHpRatio = this.boss.health / this.boss.maxHealth;
    this.ctx.fillStyle = '#ff0000';
    this.ctx.fillRect(this.width/2-100, 20, 200, 10);
    this.ctx.fillStyle = '#00ff00';
    this.ctx.fillRect(this.width/2-100, 20, 200*bossHpRatio, 10);
    this.bullets.forEach(b => {
      this.ctx.fillStyle = '#ffff00';
      this.ctx.fillRect(b.x-2, b.y-8, 4, 8);
    });
    this.bossAttacks.forEach(a => {
      this.ctx.fillStyle = '#ff0000';
      this.ctx.fillRect(a.x-4, a.y-4, 8, 8);
    });
    const playerHpRatio = this.player.health / 100;
    this.ctx.fillStyle = '#ff0000';
    this.ctx.fillRect(20, this.height-50, 100, 8);
    this.ctx.fillStyle = '#00ff00';
    this.ctx.fillRect(20, this.height-50, 100*playerHpRatio, 8);
    this.drawText('Boss '+this.bossNum, 20, 40, {size: 16});
    this.drawText('Coins: '+this.coins_earned, this.width-120, 40, {size: 14});
    ParticleManager.render(this.ctx);
  }
}
game = new BossRush();
game.coins_earned = 0;
game.updateControls = () => {};
game.start();
