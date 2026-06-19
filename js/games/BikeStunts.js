class BikeStunts extends GameTemplate {
  initGame() {
    this.bike = { x: 100, y: this.height-100, vx: 6, vy: 0, angle: 0, wheelRotation: 0, trickRotation: 0, isTricking: false, trickTimer: 0, health: 100 };
    this.platforms = [];
    this.obstacles = [];
    this.ramps = [];
    this.tricks = 0;
    this.generateLevel();
  }
  generateLevel() {
    this.platforms = [];
    this.obstacles = [];
    this.ramps = [];
    let x = 0;
    for (let i = 0; i < 10; i++) {
      x += 150 + Math.random()*100;
      const y = this.height - 100 - Math.random()*150;
      const type = Math.random() < 0.4 ? 'platform' : Math.random() < 0.5 ? 'ramp' : 'gap';
      if (type === 'platform') this.platforms.push({x, y, w: 60, h: 20});
      else if (type === 'ramp') this.ramps.push({x, y, w: 80, h: 30, angle: 0.3});
      else this.obstacles.push({x, y, w: 40, h: 40});
    }
  }
  setupControls() {
    super.setupControls();
    const keys = {};
    document.addEventListener('keydown', e => { keys[e.key] = true; });
    document.addEventListener('keyup', e => { keys[e.key] = false; });
    if (MobileControlsManager.isMobileDevice()) {
      MobileControlsManager.createButton('↑ UP', 'top-center');
      MobileControlsManager.createButton('↓ DOWN', 'bottom-center');
      MobileControlsManager.createButton('⚡ TRICK', 'bottom-right');
      MobileControlsManager.onButton(({label, state}) => {
        if (label === '↑ UP' && state === 'down') { this.bike.vy = -10; AudioManager.play('shoot'); }
        if (label === '↓ DOWN' && state === 'down') this.bike.vy = 5;
        if (label === '⚡ TRICK' && state === 'down') this.startTrick();
      });
    }
    this.updateControls = () => {
      if (keys['ArrowUp'] || keys['w']) { this.bike.vy = -10; AudioManager.play('shoot'); }
      if (keys['ArrowDown'] || keys['s']) this.bike.vy = 5;
      if (keys[' ']) this.startTrick();
    };
  }
  startTrick() {
    if (!this.bike.isTricking) {
      this.bike.isTricking = true;
      this.bike.trickTimer = 1;
      this.tricks++;
      this.score += 100;
      this.coins_earned += 5;
      AudioManager.play('coin');
    }
  }
  update(dt) {
    this.updateControls();
    this.bike.x += this.bike.vx;
    this.bike.vy += 0.4;
    this.bike.y += this.bike.vy;
    this.bike.wheelRotation += this.bike.vx / 5;
    if (this.bike.isTricking) {
      this.bike.trickTimer -= dt;
      this.bike.trickRotation += 0.2;
      if (this.bike.trickTimer <= 0) {
        this.bike.isTricking = false;
        this.bike.trickRotation = 0;
      }
    }
    let onGround = false;
    for (let p of this.platforms) {
      if (this.bike.x + 15 > p.x && this.bike.x - 15 < p.x + p.w && this.bike.y + 15 > p.y && this.bike.y - 15 < p.y + p.h) {
        this.bike.y = p.y - 15;
        this.bike.vy = 0;
        onGround = true;
      }
    }
    for (let r of this.ramps) {
      const rampY = r.y - (this.bike.x - r.x) * r.angle;
      if (this.bike.x > r.x && this.bike.x < r.x + r.w && Math.abs(this.bike.y - rampY) < 20) {
        this.bike.y = rampY;
        this.bike.vy = -5;
        onGround = true;
        AudioManager.play('coin');
      }
    }
    if (this.bike.y > this.height) {
      this.endGame();
      AudioManager.play('gameOver');
    }
    for (let o of this.obstacles) {
      if (this.bike.x + 15 > o.x && this.bike.x - 15 < o.x + o.w && this.bike.y + 15 > o.y && this.bike.y - 15 < o.y + o.h) {
        this.bike.health -= 10;
        if (this.bike.health <= 0) this.endGame();
        this.bike.vy = -8;
        AudioManager.play('gameOver');
      }
    }
  }
  render() {
    this.clear('#87CEEB');
    this.platforms.forEach(p => {
      this.ctx.fillStyle = '#8B7355';
      this.ctx.fillRect(p.x - p.w/2, p.y, p.w, p.h);
    });
    this.ramps.forEach(r => {
      this.ctx.fillStyle = '#A0522D';
      this.ctx.save();
      this.ctx.translate(r.x, r.y);
      this.ctx.rotate(r.angle);
      this.ctx.fillRect(0, 0, r.w, r.h);
      this.ctx.restore();
    });
    this.obstacles.forEach(o => {
      this.ctx.fillStyle = '#ff0000';
      this.ctx.fillRect(o.x - o.w/2, o.y - o.h/2, o.w, o.h);
    });
    this.ctx.save();
    this.ctx.translate(this.bike.x, this.bike.y);
    if (this.bike.isTricking) this.ctx.rotate(this.bike.trickRotation);
    this.ctx.fillStyle = '#0000ff';
    this.ctx.fillRect(-15, -10, 30, 20);
    this.ctx.fillStyle = '#000000';
    this.ctx.beginPath();
    this.ctx.arc(-8, 8, 5, 0, Math.PI*2);
    this.ctx.fill();
    this.ctx.beginPath();
    this.ctx.arc(8, 8, 5, 0, Math.PI*2);
    this.ctx.fill();
    this.ctx.restore();
    const hpRatio = this.bike.health / 100;
    this.ctx.fillStyle = '#ff0000';
    this.ctx.fillRect(20, 25, 100, 10);
    this.ctx.fillStyle = '#00ff00';
    this.ctx.fillRect(20, 25, 100*hpRatio, 10);
    this.drawText('Tricks: '+this.tricks, 20, 50, {size: 14});
    this.drawText('Score: '+this.score, this.width/2, 25, {size: 14, align: 'center'});
    this.drawText('Coins: '+this.coins_earned, this.width-120, 25, {size: 14});
    ParticleManager.render(this.ctx);
  }
}
game = new BikeStunts();
game.coins_earned = 0;
game.updateControls = () => {};
game.start();
