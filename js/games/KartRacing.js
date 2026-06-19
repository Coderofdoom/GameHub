class KartRacing extends GameTemplate {
  initGame() {
    this.player = { x: 400, y: 500, vx: 0, vy: 0, angle: 0, speed: 0, maxSpeed: 6, steer: 0, lap: 1, position: 1 };
    this.track = [];
    this.opponents = [];
    this.checkpoints = [];
    this.generateTrack();
    this.spawnOpponents(3);
  }
  generateTrack() {
    const centerX = 400, centerY = 300;
    const outerRadius = 180, innerRadius = 100;
    this.track = [];
    this.checkpoints = [];
    for (let angle = 0; angle < Math.PI*2; angle += 0.15) {
      const x1 = centerX + Math.cos(angle) * outerRadius, y1 = centerY + Math.sin(angle) * outerRadius;
      const x2 = centerX + Math.cos(angle) * innerRadius, y2 = centerY + Math.sin(angle) * innerRadius;
      this.track.push({x1, y1, x2, y2});
      if (angle % (Math.PI/2) < 0.15) {
        this.checkpoints.push({x: centerX + Math.cos(angle)*((innerRadius+outerRadius)/2), y: centerY + Math.sin(angle)*((innerRadius+outerRadius)/2), passed: false});
      }
    }
  }
  spawnOpponents(count) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = 140;
      this.opponents.push({
        x: 400 + Math.cos(angle)*radius, y: 300 + Math.sin(angle)*radius,
        vx: 0, vy: 0, angle: 0, speed: 0, maxSpeed: 5 + Math.random(),
        lap: 1, checkpointIndex: 0
      });
    }
  }
  setupControls() {
    super.setupControls();
    const keys = {};
    document.addEventListener('keydown', e => { keys[e.key] = true; });
    document.addEventListener('keyup', e => { keys[e.key] = false; });
    if (MobileControlsManager.isMobileDevice()) {
      MobileControlsManager.createButton('↑ ACCEL', 'top-center');
      MobileControlsManager.createButton('← LEFT', 'left-center');
      MobileControlsManager.createButton('RIGHT →', 'right-center');
      MobileControlsManager.onButton(({label, state}) => {
        if (label === '↑ ACCEL' && state === 'down') keys['w'] = true;
        else if (label === '↑ ACCEL' && state === 'up') keys['w'] = false;
        if (label === '← LEFT' && state === 'down') keys['a'] = true;
        else if (label === '← LEFT' && state === 'up') keys['a'] = false;
        if (label === 'RIGHT →' && state === 'down') keys['d'] = true;
        else if (label === 'RIGHT →' && state === 'up') keys['d'] = false;
      });
    }
    this.updateControls = () => {
      this.player.steer = 0;
      if (keys['a'] || keys['ArrowLeft']) this.player.steer = -1;
      if (keys['d'] || keys['ArrowRight']) this.player.steer = 1;
      this.player.speed = 0;
      if (keys['w'] || keys['ArrowUp']) this.player.speed = 0.25;
    };
  }
  update(dt) {
    this.updateControls();
    this.player.speed = Math.min(this.player.maxSpeed, this.player.speed + 0.02);
    this.player.angle += this.player.steer * this.player.speed * 0.15;
    this.player.vx = Math.cos(this.player.angle) * this.player.speed;
    this.player.vy = Math.sin(this.player.angle) * this.player.speed;
    this.player.x += this.player.vx;
    this.player.y += this.player.vy;
    this.player.x = Math.max(50, Math.min(this.player.x, this.width-50));
    this.player.y = Math.max(50, Math.min(this.player.y, this.height-50));
    for (let checkpoint of this.checkpoints) {
      if (!checkpoint.passed && Math.hypot(this.player.x - checkpoint.x, this.player.y - checkpoint.y) < 30) {
        checkpoint.passed = true;
        this.coins_earned++;
        AudioManager.play('coin');
      }
    }
    this.opponents.forEach(opp => {
      opp.speed = Math.min(opp.maxSpeed, opp.speed + 0.01);
      const nextCheckpoint = this.checkpoints[(Math.floor(Math.random()*this.checkpoints.length))];
      const dx = nextCheckpoint.x - opp.x, dy = nextCheckpoint.y - opp.y;
      const desiredAngle = Math.atan2(dy, dx);
      const angleDiff = desiredAngle - opp.angle;
      opp.angle += Math.sign(angleDiff) * Math.min(Math.abs(angleDiff), 0.1);
      opp.vx = Math.cos(opp.angle) * opp.speed;
      opp.vy = Math.sin(opp.angle) * opp.speed;
      opp.x += opp.vx;
      opp.y += opp.vy;
      opp.x = Math.max(50, Math.min(opp.x, this.width-50));
      opp.y = Math.max(50, Math.min(opp.y, this.height-50));
    });
    const checkpointsPassed = this.checkpoints.filter(c => c.passed).length;
    this.player.position = 1 + this.opponents.filter(o => this.checkpoints.filter(c => c.passed).length < checkpointsPassed).length;
    this.score = this.player.position;
  }
  render() {
    this.clear('#1a5c1a');
    this.ctx.strokeStyle = '#ffff00';
    this.ctx.lineWidth = 40;
    this.ctx.beginPath();
    this.track.forEach((segment, i) => {
      if (i === 0) this.ctx.moveTo(segment.x1, segment.y1);
      else this.ctx.lineTo(segment.x1, segment.y1);
    });
    this.ctx.closePath();
    this.ctx.stroke();
    this.ctx.lineWidth = 20;
    this.ctx.beginPath();
    this.track.forEach((segment, i) => {
      if (i === 0) this.ctx.moveTo(segment.x2, segment.y2);
      else this.ctx.lineTo(segment.x2, segment.y2);
    });
    this.ctx.closePath();
    this.ctx.stroke();
    this.checkpoints.forEach(c => {
      this.ctx.fillStyle = c.passed ? '#00ff00' : '#ff0000';
      this.ctx.beginPath();
      this.ctx.arc(c.x, c.y, 15, 0, Math.PI*2);
      this.ctx.fill();
    });
    this.ctx.save();
    this.ctx.translate(this.player.x, this.player.y);
    this.ctx.rotate(this.player.angle);
    this.ctx.fillStyle = '#0000ff';
    this.ctx.fillRect(-15, -10, 30, 20);
    this.ctx.restore();
    this.opponents.forEach(opp => {
      this.ctx.save();
      this.ctx.translate(opp.x, opp.y);
      this.ctx.rotate(opp.angle);
      this.ctx.fillStyle = '#ff0000';
      this.ctx.fillRect(-12, -8, 24, 16);
      this.ctx.restore();
    });
    this.drawText('Position: '+this.player.position, 20, 25, {size: 14});
    this.drawText('Lap: '+this.player.lap, 20, 45, {size: 14});
    this.drawText('Coins: '+this.coins_earned, this.width-120, 25, {size: 14});
    ParticleManager.render(this.ctx);
  }
}
game = new KartRacing();
game.coins_earned = 0;
game.updateControls = () => {};
game.start();
