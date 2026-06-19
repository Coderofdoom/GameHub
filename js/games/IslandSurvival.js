class IslandSurvival extends GameTemplate {
  initGame() {
    this.player = { x: 400, y: 500, vx: 0, vy: 0, width: 20, height: 20, speed: 3, resources: 50, health: 100 };
    this.trees = [];
    this.rocks = [];
    this.water = [];
    this.enemies = [];
    this.day = 1;
    this.dayTimer = 20;
    this.isNight = false;
    this.generateIsland();
  }
  generateIsland() {
    this.trees = [];
    this.rocks = [];
    this.enemies = [];
    for (let i = 0; i < 8; i++) {
      this.trees.push({x: Math.random()*(this.width-100)+50, y: Math.random()*(this.height-200)+50, resource: 20});
    }
    for (let i = 0; i < 5; i++) {
      this.rocks.push({x: Math.random()*(this.width-100)+50, y: Math.random()*(this.height-200)+50, resource: 10});
    }
    if (this.isNight) {
      for (let i = 0; i < 2 + this.day; i++) {
        this.enemies.push({
          x: Math.random()*this.width, y: Math.random()*(this.height-200)+50,
          vx: 0, vy: 0, health: 15, radius: 10
        });
      }
    }
  }
  setupControls() {
    super.setupControls();
    const keys = {};
    document.addEventListener('keydown', e => { keys[e.key] = true; });
    document.addEventListener('keyup', e => { keys[e.key] = false; });
    document.addEventListener('click', e => this.handleClick(e));
    if (MobileControlsManager.isMobileDevice()) {
      MobileControlsManager.createButton('↑', 'top-center');
      MobileControlsManager.createButton('↓', 'bottom-center');
      MobileControlsManager.createButton('←', 'left-center');
      MobileControlsManager.createButton('→', 'right-center');
      MobileControlsManager.createButton('🪓 HARVEST', 'bottom-right');
      MobileControlsManager.onMove(state => {
        this.player.vx = state.x * this.player.speed;
        this.player.vy = state.y * this.player.speed;
      });
      MobileControlsManager.onButton(({label, state}) => {
        if (label === '🪓 HARVEST' && state === 'down') this.harvest();
        if (state === 'up') { this.player.vx = 0; this.player.vy = 0; }
      });
    }
    this.updateControls = () => {
      this.player.vx = 0; this.player.vy = 0;
      if (keys['ArrowUp'] || keys['w']) this.player.vy = -this.player.speed;
      if (keys['ArrowDown'] || keys['s']) this.player.vy = this.player.speed;
      if (keys['ArrowLeft'] || keys['a']) this.player.vx = -this.player.speed;
      if (keys['ArrowRight'] || keys['d']) this.player.vx = this.player.speed;
      if (keys[' ']) this.harvest();
    };
  }
  handleClick(e) {
    const rect = this.canvas.getBoundingClientRect();
    this.clickX = e.clientX - rect.left;
    this.clickY = e.clientY - rect.top;
    this.harvest();
  }
  harvest() {
    for (let i = this.trees.length-1; i >= 0; i--) {
      if (Math.hypot(this.player.x - this.trees[i].x, this.player.y - this.trees[i].y) < 40) {
        this.player.resources += this.trees[i].resource;
        this.score = this.player.resources;
        this.trees.splice(i, 1);
        this.emitParticle(this.trees[i].x, this.trees[i].y, {count: 10, color: '#228B22'});
        AudioManager.play('coin');
      }
    }
    for (let i = this.rocks.length-1; i >= 0; i--) {
      if (Math.hypot(this.player.x - this.rocks[i].x, this.player.y - this.rocks[i].y) < 40) {
        this.player.resources += this.rocks[i].resource;
        this.score = this.player.resources;
        this.rocks.splice(i, 1);
        this.emitParticle(this.rocks[i].x, this.rocks[i].y, {count: 10, color: '#808080'});
        AudioManager.play('coin');
      }
    }
  }
  update(dt) {
    this.updateControls();
    this.player.x += this.player.vx;
    this.player.y += this.player.vy;
    this.player.x = Math.max(0, Math.min(this.player.x, this.width));
    this.player.y = Math.max(0, Math.min(this.player.y, this.height));
    this.dayTimer -= dt;
    if (this.dayTimer <= 0) {
      this.day++;
      this.isNight = !this.isNight;
      this.dayTimer = this.isNight ? 15 : 20;
      this.generateIsland();
      this.player.resources -= 5;
      if (this.player.resources <= 0) { this.endGame(); AudioManager.play('gameOver'); }
    }
    this.enemies.forEach(e => {
      const dx = this.player.x - e.x, dy = this.player.y - e.y, dist = Math.hypot(dx, dy);
      e.vx += (dx/dist)*0.2; e.vy += (dy/dist)*0.2;
      e.x += e.vx; e.y += e.vy;
      if (Math.hypot(this.player.x - e.x, this.player.y - e.y) < 25) {
        this.player.health -= 10;
        if (this.player.health <= 0) this.endGame();
      }
    });
  }
  render() {
    this.clear(this.isNight ? '#001a1a' : '#87CEEB');
    this.ctx.fillStyle = '#228B22';
    this.trees.forEach(t => {
      this.ctx.beginPath();
      this.ctx.arc(t.x, t.y, 12, 0, Math.PI*2);
      this.ctx.fill();
      this.ctx.fillStyle = '#8B4513';
      this.ctx.fillRect(t.x-4, t.y+10, 8, 15);
      this.ctx.fillStyle = '#228B22';
    });
    this.ctx.fillStyle = '#808080';
    this.rocks.forEach(r => {
      this.ctx.fillRect(r.x-10, r.y-10, 20, 20);
    });
    this.ctx.fillStyle = '#00ff00';
    this.ctx.fillRect(this.player.x - this.player.width/2, this.player.y - this.player.height/2, this.player.width, this.player.height);
    this.enemies.forEach(e => {
      this.ctx.fillStyle = '#ff0000';
      this.ctx.beginPath();
      this.ctx.arc(e.x, e.y, e.radius, 0, Math.PI*2);
      this.ctx.fill();
    });
    this.drawText('Day: '+this.day + (this.isNight ? ' (Night)' : ' (Day)'), 20, 25, {size: 14});
    this.drawText('Resources: '+this.player.resources, 20, 45, {size: 14});
    this.drawText('Coins: '+this.coins_earned, this.width-120, 25, {size: 14});
    ParticleManager.render(this.ctx);
  }
}
game = new IslandSurvival();
game.coins_earned = 0;
game.updateControls = () => {};
game.start();
