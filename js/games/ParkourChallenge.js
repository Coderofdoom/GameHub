class ParkourChallenge extends GameTemplate {
  initGame() {
    this.player = { x: 50, y: this.height-100, vx: 0, vy: 0, width: 20, height: 30, jumping: false, jumpPower: 0, speed: 5 };
    this.platforms = [];
    this.obstacles = [];
    this.finish = {};
    this.level = 1;
    this.generateLevel();
  }
  generateLevel() {
    this.platforms = [];
    this.obstacles = [];
    let x = 150;
    for (let i = 0; i < 8 + this.level; i++) {
      const y = this.height - 100 - Math.random()*200;
      const type = Math.random() < 0.5 ? 'platform' : 'obstacle';
      if (type === 'platform') {
        this.platforms.push({x, y, w: 80 + Math.random()*40, h: 15});
      } else {
        this.obstacles.push({x: x + 40, y: y - 30, w: 30, h: 50});
      }
      x += 150 + Math.random()*100;
    }
    this.finish = {x: x + 100, y: this.height - 100, w: 60, h: 30};
  }
  setupControls() {
    super.setupControls();
    const keys = {};
    document.addEventListener('keydown', e => { keys[e.key] = true; });
    document.addEventListener('keyup', e => { keys[e.key] = false; });
    if (MobileControlsManager.isMobileDevice()) {
      MobileControlsManager.createButton('↑ JUMP', 'top-center');
      MobileControlsManager.createButton('← LEFT', 'left-center');
      MobileControlsManager.createButton('RIGHT →', 'right-center');
      MobileControlsManager.onButton(({label, state}) => {
        if (label === '↑ JUMP' && state === 'down') { if (!this.player.jumping) { this.player.vy = -12; this.player.jumping = true; AudioManager.play('shoot'); } }
        if (label === '← LEFT' && state === 'down') keys['a'] = true;
        if (label === '← LEFT' && state === 'up') keys['a'] = false;
        if (label === 'RIGHT →' && state === 'down') keys['d'] = true;
        if (label === 'RIGHT →' && state === 'up') keys['d'] = false;
      });
    }
    this.updateControls = () => {
      this.player.vx = 0;
      if (keys['ArrowLeft'] || keys['a']) this.player.vx = -this.player.speed;
      if (keys['ArrowRight'] || keys['d']) this.player.vx = this.player.speed;
      if ((keys[' '] || keys['ArrowUp'] || keys['w']) && !this.player.jumping) {
        this.player.vy = -12;
        this.player.jumping = true;
        AudioManager.play('shoot');
      }
    };
  }
  update(dt) {
    this.updateControls();
    this.player.x += this.player.vx;
    this.player.vy += 0.4;
    this.player.y += this.player.vy;
    let onGround = false;
    for (let p of this.platforms) {
      if (this.player.x + this.player.width/2 > p.x && this.player.x - this.player.width/2 < p.x + p.w && this.player.y + this.player.height/2 > p.y && this.player.y + this.player.height/2 < p.y + p.h && this.player.vy > 0) {
        this.player.y = p.y - this.player.height/2;
        this.player.vy = 0;
        this.player.jumping = false;
        onGround = true;
        AudioManager.play('coin');
      }
    }
    for (let o of this.obstacles) {
      if (this.player.x + this.player.width/2 > o.x && this.player.x - this.player.width/2 < o.x + o.w && this.player.y + this.player.height/2 > o.y && this.player.y - this.player.height/2 < o.y + o.h) {
        this.endGame();
        AudioManager.play('gameOver');
      }
    }
    if (this.player.x > this.finish.x && this.player.x < this.finish.x + this.finish.w && this.player.y > this.finish.y && this.player.y < this.finish.y + this.finish.h) {
      this.level++;
      this.score += 100;
      this.coins_earned += 10;
      this.player.x = 50;
      this.player.y = this.height - 100;
      this.generateLevel();
      AudioManager.play('coin');
    }
    if (this.player.y > this.height + 50) {
      this.endGame();
      AudioManager.play('gameOver');
    }
  }
  render() {
    this.clear('#87CEEB');
    this.ctx.fillStyle = '#8B7355';
    this.platforms.forEach(p => {
      this.ctx.fillRect(p.x, p.y, p.w, p.h);
    });
    this.ctx.fillStyle = '#ff0000';
    this.obstacles.forEach(o => {
      this.ctx.fillRect(o.x, o.y, o.w, o.h);
    });
    this.ctx.fillStyle = '#00ff00';
    this.ctx.fillRect(this.finish.x, this.finish.y, this.finish.w, this.finish.h);
    this.ctx.fillStyle = '#0000ff';
    this.ctx.fillRect(this.player.x - this.player.width/2, this.player.y - this.player.height/2, this.player.width, this.player.height);
    this.drawText('Level: '+this.level, 20, 25, {size: 14});
    this.drawText('Score: '+this.score, 20, 45, {size: 14});
    this.drawText('Coins: '+this.coins_earned, this.width-120, 25, {size: 14});
    ParticleManager.render(this.ctx);
  }
}
game = new ParkourChallenge();
game.coins_earned = 0;
game.updateControls = () => {};
game.start();
