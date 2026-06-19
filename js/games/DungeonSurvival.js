class DungeonSurvival extends GameTemplate {
  initGame() {
    this.player = { x: 400, y: 500, vx: 0, vy: 0, width: 20, height: 30, health: 100, maxHealth: 100, speed: 3, attack: 0 };
    this.enemies = [];
    this.loot = [];
    this.walls = [];
    this.floor = 1;
    this.generateDungeon();
  }
  generateDungeon() {
    this.enemies = [];
    this.loot = [];
    this.walls = [];
    for (let i = 0; i < Math.min(5 + this.floor, 15); i++) {
      this.enemies.push({
        x: Math.random()*(this.width-100)+50, y: Math.random()*(this.height-200)+50,
        vx: 0, vy: 0, health: 20 + this.floor*10, maxHealth: 20 + this.floor*10, radius: 12
      });
    }
    for (let i = 0; i < 3; i++) {
      this.walls.push({x: Math.random()*(this.width-100)+50, y: Math.random()*(this.height-100)+50, w: 80, h: 20});
    }
    this.loot = [{x: Math.random()*this.width, y: Math.random()*(this.height-100)+50, type: 'coin'}];
  }
  setupControls() {
    super.setupControls();
    const keys = {};
    document.addEventListener('keydown', e => { keys[e.key] = true; });
    document.addEventListener('keyup', e => { keys[e.key] = false; });
    document.addEventListener('click', () => this.attack());
    if (MobileControlsManager.isMobileDevice()) {
      MobileControlsManager.createButton('↑', 'top-center');
      MobileControlsManager.createButton('↓', 'bottom-center');
      MobileControlsManager.createButton('←', 'left-center');
      MobileControlsManager.createButton('→', 'right-center');
      MobileControlsManager.createButton('⚔️ ATTACK', 'bottom-right');
      MobileControlsManager.onMove(state => {
        this.player.vx = state.x * this.player.speed;
        this.player.vy = state.y * this.player.speed;
      });
      MobileControlsManager.onButton(({label, state}) => {
        if (label === '⚔️ ATTACK' && state === 'down') this.attack();
        if (state === 'up') { this.player.vx = 0; this.player.vy = 0; }
      });
    }
    this.updateControls = () => {
      this.player.vx = 0; this.player.vy = 0;
      if (keys['ArrowUp'] || keys['w']) this.player.vy = -this.player.speed;
      if (keys['ArrowDown'] || keys['s']) this.player.vy = this.player.speed;
      if (keys['ArrowLeft'] || keys['a']) this.player.vx = -this.player.speed;
      if (keys['ArrowRight'] || keys['d']) this.player.vx = this.player.speed;
      if (keys[' ']) this.attack();
    };
  }
  attack() {
    for (let i = this.enemies.length-1; i >= 0; i--) {
      let e = this.enemies[i];
      if (Math.hypot(this.player.x - e.x, this.player.y - e.y) < 40) {
        e.health -= 15;
        if (e.health <= 0) {
          this.enemies.splice(i, 1);
          this.score += 10; this.coins_earned += 10;
          this.loot.push({x: e.x, y: e.y, type: 'coin'});
          this.emitParticle(e.x, e.y, {count: 15, color: '#ff0000'});
          AudioManager.play('coin');
        }
      }
    }
  }
  update(dt) {
    this.updateControls();
    this.player.x += this.player.vx;
    this.player.y += this.player.vy;
    this.player.x = Math.max(0, Math.min(this.player.x, this.width));
    this.player.y = Math.max(0, Math.min(this.player.y, this.height));
    for (let wall of this.walls) {
      if (this.player.x > wall.x && this.player.x < wall.x + wall.w && this.player.y > wall.y && this.player.y < wall.y + wall.h) {
        this.player.x -= this.player.vx;
        this.player.y -= this.player.vy;
      }
    }
    for (let i = this.loot.length-1; i >= 0; i--) {
      if (Math.hypot(this.player.x - this.loot[i].x, this.player.y - this.loot[i].y) < 25) {
        this.coins_earned++;
        this.loot.splice(i, 1);
        AudioManager.play('coin');
      }
    }
    this.enemies.forEach(e => {
      const dx = this.player.x - e.x, dy = this.player.y - e.y, dist = Math.hypot(dx, dy);
      if (dist < 250) {
        e.vx += (dx/dist)*0.3; e.vy += (dy/dist)*0.3;
      }
      e.vx *= 0.95; e.vy *= 0.95;
      e.x += e.vx; e.y += e.vy;
      e.x = Math.max(0, Math.min(e.x, this.width));
      e.y = Math.max(0, Math.min(e.y, this.height));
      if (Math.hypot(this.player.x - e.x, this.player.y - e.y) < 25) {
        this.player.health -= 5;
        if (this.player.health <= 0) this.endGame();
      }
    });
    if (this.enemies.length === 0) {
      this.floor++; this.generateDungeon();
      AudioManager.play('coin');
    }
  }
  render() {
    this.clear('#2a2a2a');
    this.ctx.fillStyle = '#664444';
    for (let wall of this.walls) {
      this.ctx.fillRect(wall.x, wall.y, wall.w, wall.h);
    }
    this.ctx.fillStyle = '#00ff00';
    this.ctx.fillRect(this.player.x - this.player.width/2, this.player.y - this.player.height/2, this.player.width, this.player.height);
    this.enemies.forEach(e => {
      this.ctx.fillStyle = '#ff0000';
      this.ctx.beginPath();
      this.ctx.arc(e.x, e.y, e.radius, 0, Math.PI*2);
      this.ctx.fill();
    });
    this.loot.forEach(l => {
      this.ctx.fillStyle = '#FFD700';
      this.ctx.beginPath();
      this.ctx.arc(l.x, l.y, 8, 0, Math.PI*2);
      this.ctx.fill();
    });
    const hpRatio = this.player.health / this.player.maxHealth;
    this.ctx.fillStyle = '#ff0000';
    this.ctx.fillRect(20, 25, 150, 10);
    this.ctx.fillStyle = '#00ff00';
    this.ctx.fillRect(20, 25, 150*hpRatio, 10);
    this.drawText('Floor: '+this.floor, 20, 50, {size: 14});
    this.drawText('Enemies: '+this.enemies.length, this.width/2, 25, {size: 14, align: 'center'});
    this.drawText('Coins: '+this.coins_earned, this.width-120, 25, {size: 14});
    ParticleManager.render(this.ctx);
  }
}
game = new DungeonSurvival();
game.coins_earned = 0;
game.updateControls = () => {};
game.start();
