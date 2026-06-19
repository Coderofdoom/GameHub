class DriftRacer extends GameTemplate {
  initGame() {
    this.car = { x: 400, y: 500, vx: 0, vy: -5, angle: 0, speed: 0, maxSpeed: 8, accel: 0, friction: 0.95, steer: 0, driftAngle: 0, health: 100 };
    this.track = [];
    this.coins = [];
    this.lap = 1;
    this.time = 0;
    this.bestLapTime = 0;
    this.inFinishZone = false;
    this.lastLapTime = 0;
    this.generateTrack();
    this.spawnCoins();
  }
  generateTrack() {
    const centerX = 400, centerY = 300;
    const outerRadius = 200, innerRadius = 120;
    this.track = [];
    for (let angle = 0; angle < Math.PI*2; angle += 0.1) {
      const x1 = centerX + Math.cos(angle) * outerRadius, y1 = centerY + Math.sin(angle) * outerRadius;
      const x2 = centerX + Math.cos(angle) * innerRadius, y2 = centerY + Math.sin(angle) * innerRadius;
      this.track.push({x1, y1, x2, y2, angle});
    }
  }
  spawnCoins() {
    this.coins = [];
    const centerX = 400, centerY = 300, radius = 160;
    for (let i = 0; i < 12; i++) {
      const angle = (i/12)*Math.PI*2;
      this.coins.push({x: centerX + Math.cos(angle)*radius, y: centerY + Math.sin(angle)*radius, collected: false});
    }
  }
  setupControls() {
    super.setupControls();
    const keys = {};
    document.addEventListener('keydown', e => { keys[e.key] = true; });
    document.addEventListener('keyup', e => { keys[e.key] = false; });
    if (MobileControlsManager.isMobileDevice()) {
      MobileControlsManager.createButton('↑ ACCEL', 'top-center');
      MobileControlsManager.createButton('↓ BRAKE', 'bottom-center');
      MobileControlsManager.createButton('← LEFT', 'left-center');
      MobileControlsManager.createButton('RIGHT →', 'right-center');
      MobileControlsManager.onButton(({label, state}) => {
        if (label === '↑ ACCEL' && state === 'down') keys['w'] = true;
        if (label === '↑ ACCEL' && state === 'up') keys['w'] = false;
        if (label === '↓ BRAKE' && state === 'down') keys['s'] = true;
        if (label === '↓ BRAKE' && state === 'up') keys['s'] = false;
        if (label === '← LEFT' && state === 'down') keys['a'] = true;
        if (label === '← LEFT' && state === 'up') keys['a'] = false;
        if (label === 'RIGHT →' && state === 'down') keys['d'] = true;
        if (label === 'RIGHT →' && state === 'up') keys['d'] = false;
      });
      MobileControlsManager.onMove(state => {
        this.car.steer = Math.max(-1, Math.min(1, state.x));
      });
    }
    this.updateControls = () => {
      this.car.steer = 0;
      if (keys['a'] || keys['ArrowLeft']) this.car.steer = -1;
      if (keys['d'] || keys['ArrowRight']) this.car.steer = 1;
      this.car.accel = 0;
      if (keys['w'] || keys['ArrowUp']) this.car.accel = 0.3;
      if (keys['s'] || keys['ArrowDown']) this.car.accel = -0.2;
    };
  }
  update(dt) {
    this.updateControls();
    this.car.speed += this.car.accel;
    this.car.speed = Math.max(-this.car.maxSpeed*0.5, Math.min(this.car.speed, this.car.maxSpeed));
    this.car.angle += this.car.steer * (this.car.speed/this.car.maxSpeed) * 0.2;
    this.car.vx = Math.cos(this.car.angle) * this.car.speed;
    this.car.vy = Math.sin(this.car.angle) * this.car.speed;
    this.car.x += this.car.vx;
    this.car.y += this.car.vy;
    this.car.x = Math.max(50, Math.min(this.car.x, this.width-50));
    this.car.y = Math.max(50, Math.min(this.car.y, this.height-50));
    this.time += dt;
    this.score = Math.floor(this.time);
    for (let i = this.coins.length-1; i >= 0; i--) {
      if (!this.coins[i].collected && Math.hypot(this.car.x - this.coins[i].x, this.car.y - this.coins[i].y) < 20) {
        this.coins[i].collected = true;
        this.coins_earned++;
        this.emitParticle(this.coins[i].x, this.coins[i].y, {count: 10, color: '#FFD700'});
        AudioManager.play('coin');
      }
    }
    const centerX = 400, centerY = 300;
    const distFromCenter = Math.hypot(this.car.x - centerX, this.car.y - centerY);
    if (distFromCenter > 250) {
      this.car.x = centerX + (this.car.x - centerX)*0.98;
      this.car.y = centerY + (this.car.y - centerY)*0.98;
    }
  }
  render() {
    this.clear('#1a5c1a');
    this.ctx.strokeStyle = '#ffff00';
    this.ctx.lineWidth = 30;
    this.ctx.beginPath();
    this.track.forEach((segment, i) => {
      if (i === 0) this.ctx.moveTo(segment.x1, segment.y1);
      else this.ctx.lineTo(segment.x1, segment.y1);
    });
    this.ctx.closePath();
    this.ctx.stroke();
    this.ctx.lineWidth = 15;
    this.ctx.beginPath();
    this.track.forEach((segment, i) => {
      if (i === 0) this.ctx.moveTo(segment.x2, segment.y2);
      else this.ctx.lineTo(segment.x2, segment.y2);
    });
    this.ctx.closePath();
    this.ctx.stroke();
    this.coins.forEach(c => {
      if (!c.collected) {
        this.ctx.fillStyle = '#FFD700';
        this.ctx.beginPath();
        this.ctx.arc(c.x, c.y, 8, 0, Math.PI*2);
        this.ctx.fill();
      }
    });
    this.ctx.save();
    this.ctx.translate(this.car.x, this.car.y);
    this.ctx.rotate(this.car.angle);
    this.ctx.fillStyle = '#ff0000';
    this.ctx.fillRect(-15, -10, 30, 20);
    this.ctx.fillStyle = '#000000';
    this.ctx.fillRect(-10, -7, 8, 6);
    this.ctx.fillRect(2, -7, 8, 6);
    this.ctx.restore();
    this.drawText('Lap: '+this.lap, 20, 25, {size: 14});
    this.drawText('Time: '+Math.floor(this.time)+'s', 20, 45, {size: 14});
    this.drawText('Coins: '+this.coins_earned, this.width-120, 25, {size: 14});
    ParticleManager.render(this.ctx);
  }
}
game = new DriftRacer();
game.coins_earned = 0;
game.updateControls = () => {};
game.start();
