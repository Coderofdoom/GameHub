class HighwayRacer extends GameTemplate {
  initGame() {
    this.car = { x: this.width/2, y: this.height-80, vx: 0, vy: -8, speed: 0, angle: 0, lane: 1, width: 30, height: 40 };
    this.traffic = [];
    this.coins = [];
    this.distance = 0;
    this.roadOffset = 0;
    this.spawnRate = 0;
    this.difficulty = 1;
  }
  setupControls() {
    super.setupControls();
    const keys = {};
    document.addEventListener('keydown', e => { keys[e.key] = true; });
    document.addEventListener('keyup', e => { keys[e.key] = false; });
    if (MobileControlsManager.isMobileDevice()) {
      MobileControlsManager.createButton('← LEFT', 'left-center');
      MobileControlsManager.createButton('RIGHT →', 'right-center');
      MobileControlsManager.onButton(({label, state}) => {
        if (label === '← LEFT' && state === 'down') this.car.lane = Math.max(0, this.car.lane - 1);
        if (label === 'RIGHT →' && state === 'down') this.car.lane = Math.min(2, this.car.lane + 1);
      });
    }
    this.updateControls = () => {
      if (keys['ArrowLeft'] || keys['a']) this.car.lane = Math.max(0, this.car.lane - 1);
      if (keys['ArrowRight'] || keys['d']) this.car.lane = Math.min(2, this.car.lane + 1);
    };
  }
  update(dt) {
    this.updateControls();
    this.distance += 5 * dt * 60;
    this.score = Math.floor(this.distance);
    this.difficulty = 1 + Math.floor(this.distance / 2000);
    this.car.x = 200 + this.car.lane * 200;
    this.roadOffset = (this.roadOffset + 5) % 100;
    this.spawnRate -= dt;
    if (this.spawnRate < 0) {
      if (Math.random() < 0.6) {
        this.traffic.push({x: 200 + Math.floor(Math.random()*3) * 200, y: -50, vx: 0, vy: (4 + Math.random()*2)*this.difficulty, width: 30, height: 40});
      } else {
        this.coins.push({x: 200 + Math.floor(Math.random()*3) * 200, y: -30, vx: 0, vy: 6*this.difficulty, radius: 10, collected: false});
      }
      this.spawnRate = 0.5 / this.difficulty;
    }
    this.traffic = this.traffic.filter(t => {
      t.y += t.vy;
      if (Math.abs(this.car.x - t.x) < 60 && Math.abs(this.car.y - t.y) < 50) {
        this.endGame();
        AudioManager.play('gameOver');
        return false;
      }
      return t.y < this.height + 50;
    });
    this.coins = this.coins.filter(c => {
      c.y += c.vy;
      if (!c.collected && Math.hypot(this.car.x - c.x, this.car.y - c.y) < 40) {
        c.collected = true;
        this.coins_earned++;
        this.emitParticle(c.x, c.y, {count: 10, color: '#FFD700'});
        AudioManager.play('coin');
      }
      return c.y < this.height + 50;
    });
  }
  render() {
    this.clear('#4d4d4d');
    this.ctx.fillStyle = '#ffff00';
    this.ctx.lineWidth = 3;
    for (let i = 0; i < this.height/50 + 1; i++) {
      const y = (i*50 + this.roadOffset) % (this.height + 50);
      this.ctx.fillRect(395, y, 10, 30);
      this.ctx.fillRect(595, y, 10, 30);
    }
    this.ctx.fillStyle = '#ffffff';
    this.ctx.fillRect(150, 0, 500, this.height);
    this.ctx.fillStyle = '#ffff00';
    this.ctx.fillRect(350, 0, 3, this.height);
    this.ctx.fillRect(550, 0, 3, this.height);
    this.traffic.forEach(t => {
      this.ctx.fillStyle = '#ff0000';
      this.ctx.fillRect(t.x - 15, t.y - 20, 30, 40);
      this.ctx.fillStyle = '#ffff00';
      this.ctx.fillRect(t.x - 10, t.y - 15, 8, 8);
      this.ctx.fillRect(t.x + 2, t.y - 15, 8, 8);
    });
    this.coins.forEach(c => {
      if (!c.collected) {
        this.ctx.fillStyle = '#FFD700';
        this.ctx.beginPath();
        this.ctx.arc(c.x, c.y, c.radius, 0, Math.PI*2);
        this.ctx.fill();
      }
    });
    this.ctx.fillStyle = '#0000ff';
    this.ctx.fillRect(this.car.x - 15, this.car.y - 20, 30, 40);
    this.ctx.fillStyle = '#00ff00';
    this.ctx.fillRect(this.car.x - 10, this.car.y - 15, 8, 8);
    this.ctx.fillRect(this.car.x + 2, this.car.y - 15, 8, 8);
    this.drawText('Distance: '+Math.floor(this.distance), 20, 25, {size: 14});
    this.drawText('Speed: '+this.difficulty.toFixed(1)+'x', 20, 45, {size: 14});
    this.drawText('Coins: '+this.coins_earned, this.width-120, 25, {size: 14});
    ParticleManager.render(this.ctx);
  }
}
game = new HighwayRacer();
game.coins_earned = 0;
game.updateControls = () => {};
game.start();
