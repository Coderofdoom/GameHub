class Asteroids extends GameTemplate {
  initGame() {
    this.ship = { x: this.width/2, y: this.height/2, vx: 0, vy: 0, angle: 0, radius: 10, shield: 120 };
    this.asteroids = [];
    this.bullets = [];
    this.lives = 3;
    this.level = 1;
    this.spawnAsteroids(this.level);
    this.keys = {};
  }
  setupControls() {
    super.setupControls();
    document.addEventListener('keydown', e => { this.keys[e.key] = true; });
    document.addEventListener('keyup', e => { this.keys[e.key] = false; });
    if (MobileControlsManager.isMobileDevice()) {
      MobileControlsManager.createButton('🔥', 'bottom-right');
      MobileControlsManager.onButton(({label, state}) => { if (label === '🔥' && state === 'down') this.shoot(); });
      MobileControlsManager.onMove(state => { this.ship.angle = Math.atan2(state.y, state.x); });
    }
  }
  spawnAsteroids(level) {
    this.asteroids = [];
    for (let i = 0; i < 2 + level; i++) {
      let x = Math.random() * this.width, y = Math.random() * this.height;
      if (Math.hypot(x - this.ship.x, y - this.ship.y) < 150) [x, y] = [Math.random() < 0.5 ? 0 : this.width, Math.random() < 0.5 ? 0 : this.height];
      this.asteroids.push({ x, y, vx: (Math.random()-0.5)*3, vy: (Math.random()-0.5)*3, size: 3, angle: Math.random()*Math.PI*2, spin: (Math.random()-0.5)*0.1 });
    }
  }
  update(dt) {
    if (this.keys['ArrowUp'] || this.keys['w']) { this.ship.vx += Math.cos(this.ship.angle) * 0.3; this.ship.vy += Math.sin(this.ship.angle) * 0.3; }
    if (this.keys['ArrowLeft'] || this.keys['a']) this.ship.angle -= 0.1;
    if (this.keys['ArrowRight'] || this.keys['d']) this.ship.angle += 0.1;
    if (this.keys[' ']) this.shoot();
    this.ship.vx *= 0.99; this.ship.vy *= 0.99;
    this.ship.x = (this.ship.x + this.ship.vx + this.width) % this.width;
    this.ship.y = (this.ship.y + this.ship.vy + this.height) % this.height;
    this.bullets = this.bullets.filter(b => {
      b.x += b.vx; b.y += b.vy; b.life--;
      for (let i = this.asteroids.length-1; i >= 0; i--) {
        let a = this.asteroids[i];
        if (Math.hypot(b.x-a.x, b.y-a.y) < a.size*8) {
          this.asteroids.splice(i, 1);
          this.score += 10 * a.size; this.coins += a.size;
          if (a.size > 1) {
            for (let j = 0; j < 2; j++) this.asteroids.push({...a, size: a.size-1, vx: a.vx + (Math.random()-0.5)*2, vy: a.vy + (Math.random()-0.5)*2});
          }
          this.emitParticle(a.x, a.y, {count: 8, color: '#FFD700'});
          AudioManager.play('coin');
          return false;
        }
      }
      return b.life > 0;
    });
    for (let i = this.asteroids.length-1; i >= 0; i--) {
      let a = this.asteroids[i];
      a.x = (a.x + a.vx + this.width) % this.width;
      a.y = (a.y + a.vy + this.height) % this.height;
      a.angle += a.spin;
      if (Math.hypot(a.x-this.ship.x, a.y-this.ship.y) < a.size*8 + this.ship.radius) {
        this.lives--;
        if (this.lives <= 0) { this.endGame(); return; }
        this.ship = {x: this.width/2, y: this.height/2, vx: 0, vy: 0, angle: 0, radius: 10, shield: 120};
        AudioManager.play('gameOver');
      }
    }
    if (this.asteroids.length === 0) { this.level++; this.spawnAsteroids(this.level); }
  }
  shoot() {
    if (this.bullets.length < 5) {
      this.bullets.push({
        x: this.ship.x + Math.cos(this.ship.angle)*15,
        y: this.ship.y + Math.sin(this.ship.angle)*15,
        vx: Math.cos(this.ship.angle)*5 + this.ship.vx,
        vy: Math.sin(this.ship.angle)*5 + this.ship.vy,
        life: 60
      });
      AudioManager.play('shoot');
    }
  }
  render() {
    this.clear();
    this.ctx.strokeStyle = '#00f7ff';
    this.ctx.lineWidth = 2;
    this.ctx.save();
    this.ctx.translate(this.ship.x, this.ship.y);
    this.ctx.rotate(this.ship.angle);
    this.ctx.beginPath();
    this.ctx.moveTo(15, 0);
    this.ctx.lineTo(-10, -10);
    this.ctx.lineTo(-5, 0);
    this.ctx.lineTo(-10, 10);
    this.ctx.closePath();
    this.ctx.stroke();
    this.ctx.restore();
    this.asteroids.forEach(a => {
      this.ctx.save();
      this.ctx.translate(a.x, a.y);
      this.ctx.rotate(a.angle);
      this.ctx.strokeStyle = '#c300ff';
      this.ctx.lineWidth = 2;
      this.ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        let r = a.size * 8 * (0.8 + Math.random()*0.2);
        let angle = (i/6)*Math.PI*2;
        if (i === 0) this.ctx.moveTo(Math.cos(angle)*r, Math.sin(angle)*r);
        else this.ctx.lineTo(Math.cos(angle)*r, Math.sin(angle)*r);
      }
      this.ctx.closePath();
      this.ctx.stroke();
      this.ctx.restore();
    });
    this.bullets.forEach(b => this.drawCircle(b.x, b.y, 3, '#FFD700'));
    this.drawText('Lives: '+this.lives, 20, 25, {size: 14});
    this.drawText('Level: '+this.level, this.width-120, 25, {size: 14});
    ParticleManager.render(this.ctx);
  }
}
game = new Asteroids();
game.start();
