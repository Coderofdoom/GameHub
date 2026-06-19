class JetpackAdventure extends GameTemplate {
  initGame() {
    this.player = { x: this.width/2, y: this.height/2, vx: 0, vy: 0, width: 30, height: 35, fuel: 100, maxFuel: 100 };
    this.platforms = [];
    this.coins = [];
    this.obstacles = [];
    this.level = 1;
    this.offsetY = 0;
    this.generateLevel();
  }
  generateLevel() {
    this.platforms = [];
    this.coins = [];
    this.obstacles = [];
    for (let i = 0; i < 12; i++) {
      const y = this.height - (i+1) * 80;
      const x = Math.random() * (this.width - 100) + 50;
      this.platforms.push({x, y, width: 100, height: 15, type: 'normal'});
      if (i > 0 && Math.random() < 0.3) {
        this.coins.push({x: x + 50, y: y - 40, radius: 8, collected: false});
      }
      if (i > 2 && Math.random() < 0.2) {
        this.obstacles.push({x: x + Math.random()*80, y: y - 40, vx: (Math.random()-0.5)*3, width: 30, height: 20});
      }
    }
  }
  setupControls() {
    super.setupControls();
    document.addEventListener('keydown', e => {
      if (e.key === ' ') { if (this.player.fuel > 0) { this.player.vy = -8; this.player.fuel -= 2; AudioManager.play('shoot'); } }
      if (e.key === 'ArrowLeft') this.player.vx = -5;
      if (e.key === 'ArrowRight') this.player.vx = 5;
    });
    document.addEventListener('keyup', e => {
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') this.player.vx = 0;
    });
    if (MobileControlsManager.isMobileDevice()) {
      MobileControlsManager.createButton('🔥 BOOST', 'bottom-center');
      MobileControlsManager.createButton('← Left', 'bottom-left');
      MobileControlsManager.createButton('Right →', 'bottom-right');
      MobileControlsManager.onButton(({label, state}) => {
        if (label === '🔥 BOOST' && state === 'down') { if (this.player.fuel > 0) { this.player.vy = -8; this.player.fuel -= 2; AudioManager.play('shoot'); } }
        if (label === '← Left' && state === 'down') this.player.vx = -5;
        if (label === 'Right →' && state === 'down') this.player.vx = 5;
        if (state === 'up') this.player.vx = 0;
      });
      MobileControlsManager.onMove(state => { this.player.vx = state.x * 5; });
    }
  }
  update(dt) {
    this.player.vy += 0.3;
    this.player.x += this.player.vx;
    this.player.y += this.player.vy;
    this.player.fuel = Math.min(this.player.maxFuel, this.player.fuel + 0.1);
    if (this.player.x < 0) this.player.x = this.width;
    if (this.player.x > this.width) this.player.x = 0;
    for (let p of this.platforms) {
      if (this.player.vy > 0 && this.player.y + this.player.height/2 >= p.y && this.player.y + this.player.height/2 <= p.y + p.height && this.player.x > p.x && this.player.x < p.x + p.width) {
        this.player.vy = -10;
        AudioManager.play('coin');
      }
    }
    for (let c of this.coins) {
      if (!c.collected && Math.hypot(this.player.x - c.x, this.player.y - c.y) < 30) {
        c.collected = true;
        this.coins_earned += 10;
        this.emitParticle(c.x, c.y, {count: 10, color: '#FFD700'});
        AudioManager.play('coin');
      }
    }
    this.obstacles.forEach(o => {
      o.x += o.vx;
      if (o.x < 0) o.x = this.width;
      if (o.x > this.width) o.x = 0;
      if (Math.hypot(this.player.x - (o.x + o.width/2), this.player.y - (o.y + o.height/2)) < 35) {
        this.endGame();
        AudioManager.play('gameOver');
      }
    });
    if (this.player.y > this.height + 50) {
      this.level++; this.player.y = this.height/2; this.player.vy = 0; this.generateLevel();
      AudioManager.play('coin');
    }
    if (this.player.y < -50) {
      this.endGame();
      AudioManager.play('gameOver');
    }
  }
  render() {
    this.clear();
    this.ctx.fillStyle = '#c300ff';
    for (let p of this.platforms) {
      this.ctx.fillRect(p.x, p.y, p.width, p.height);
    }
    for (let c of this.coins) {
      if (!c.collected) {
        this.ctx.fillStyle = '#FFD700';
        this.ctx.beginPath();
        this.ctx.arc(c.x, c.y, c.radius, 0, Math.PI*2);
        this.ctx.fill();
      }
    }
    this.obstacles.forEach(o => {
      this.ctx.fillStyle = '#ff0000';
      this.ctx.fillRect(o.x, o.y, o.width, o.height);
    });
    this.ctx.fillStyle = '#00ff00';
    this.ctx.fillRect(this.player.x - 15, this.player.y - 17.5, 30, 35);
    this.ctx.fillStyle = '#ffff00';
    this.ctx.fillRect(this.player.x - 8, this.player.y + 10, 5, 10);
    this.ctx.fillRect(this.player.x + 3, this.player.y + 10, 5, 10);
    this.drawText('Fuel: '+Math.ceil(this.player.fuel)+'%', 20, 25, {size: 14});
    this.drawText('Level: '+this.level, this.width - 120, 25, {size: 14});
    this.drawText('Coins: '+this.coins_earned, this.width/2, 25, {size: 14, align: 'center'});
    ParticleManager.render(this.ctx);
  }
}
game = new JetpackAdventure();
game.coins_earned = 0;
game.start();
