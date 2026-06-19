class EndlessRunner extends GameTemplate {
  initGame() {
    this.player = { x: 100, y: this.height-100, width: 30, height: 40, vx: 5, vy: 0, jumping: false, jumpPower: 0, lane: 1 };
    this.obstacles = [];
    this.coins = [];
    this.bg_offset = 0;
    this.distance = 0;
    this.spawnTimer = 0;
    this.speed = 1;
  }
  setupControls() {
    super.setupControls();
    const jump = () => { if (!this.player.jumping) { this.player.vy = -15; this.player.jumping = true; AudioManager.play('coin'); } };
    document.addEventListener('keydown', e => { if (e.key === ' ') { jump(); e.preventDefault(); } });
    document.addEventListener('click', jump);
    if (MobileControlsManager.isMobileDevice()) {
      MobileControlsManager.createButton('↑ JUMP', 'bottom-center');
      MobileControlsManager.onButton(({label, state}) => { if (label === '↑ JUMP' && state === 'down') jump(); });
      MobileControlsManager.createButton('← Left', 'bottom-left');
      MobileControlsManager.createButton('Right →', 'bottom-right');
      MobileControlsManager.onButton(({label, state}) => {
        if (label === '← Left' && state === 'down') this.player.lane = Math.max(0, this.player.lane - 1);
        if (label === 'Right →' && state === 'down') this.player.lane = Math.min(2, this.player.lane + 1);
      });
    }
    document.addEventListener('keydown', e => {
      if (e.key === 'ArrowLeft') this.player.lane = Math.max(0, this.player.lane - 1);
      if (e.key === 'ArrowRight') this.player.lane = Math.min(2, this.player.lane + 1);
    });
  }
  update(dt) {
    this.distance += this.player.vx * dt * 60;
    this.score = Math.floor(this.distance / 10);
    this.player.vy += 0.4;
    this.player.y += this.player.vy;
    if (this.player.y > this.height - 100) {
      this.player.y = this.height - 100;
      this.player.vy = 0;
      this.player.jumping = false;
    }
    this.player.x = 50 + this.player.lane * 240;
    this.bg_offset = (this.bg_offset - this.player.vx) % 100;
    this.spawnTimer -= dt;
    if (this.spawnTimer < 0) {
      const type = Math.random() < 0.7 ? 'obstacle' : 'coin';
      const lane = Math.floor(Math.random() * 3);
      if (type === 'obstacle') {
        this.obstacles.push({ x: this.width, y: this.height - 100, lane, width: 30, height: 50, vx: -this.player.vx });
      } else {
        this.coins.push({ x: this.width, y: this.height - 150, lane, radius: 10, vx: -this.player.vx });
      }
      this.spawnTimer = 0.6 / this.speed;
      this.speed = 1 + Math.floor(this.distance / 1000) * 0.1;
    }
    this.obstacles = this.obstacles.filter(o => {
      o.x += o.vx;
      const playerLaneX = 50 + o.lane * 240;
      if (Math.abs(this.player.x - (o.x + o.width/2)) < 40 && Math.abs(this.player.y - (o.y + o.height/2)) < 40) {
        this.endGame();
        AudioManager.play('gameOver');
        return false;
      }
      return o.x > -50;
    });
    this.coins = this.coins.filter(c => {
      c.x += c.vx;
      const playerLaneX = 50 + c.lane * 240;
      if (Math.abs(this.player.x - c.x) < 30 && Math.abs(this.player.y - c.y) < 30) {
        this.coins_earned += 5;
        this.emitParticle(c.x, c.y, {count: 8, color: '#FFD700'});
        AudioManager.play('coin');
        return false;
      }
      return c.x > -20;
    });
  }
  render() {
    this.clear('#1a3a1a');
    this.ctx.fillStyle = '#00aa00';
    for (let i = 0; i < this.width / 100 + 2; i++) {
      this.ctx.fillRect((i*100 + this.bg_offset) % this.width, this.height - 80, 100, 3);
    }
    this.ctx.fillStyle = '#00ff00';
    this.ctx.fillRect(this.player.x - 15, this.player.y, 30, 40);
    this.ctx.fillStyle = '#ffff00';
    this.ctx.fillRect(this.player.x - 5, this.player.y - 15, 10, 15);
    this.obstacles.forEach(o => {
      this.ctx.fillStyle = '#ff0000';
      this.ctx.fillRect(o.x, o.y, o.width, o.height);
    });
    this.coins.forEach(c => {
      this.ctx.fillStyle = '#FFD700';
      this.ctx.beginPath();
      this.ctx.arc(c.x, c.y, c.radius, 0, Math.PI*2);
      this.ctx.fill();
    });
    this.drawText('Coins: '+this.coins_earned, this.width-150, 25, {size: 14});
    ParticleManager.render(this.ctx);
  }
}
game = new EndlessRunner();
game.coins_earned = 0;
game.start();
