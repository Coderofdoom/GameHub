class MissileDefense extends GameTemplate {
  initGame() {
    this.base = { x: this.width/2, y: this.height-30, width: 40, height: 30, health: 100 };
    this.missiles = [];
    this.explosions = [];
    this.enemies = [];
    this.wave = 1;
    this.waveTimer = 0;
    this.spawnTimer = 0;
    this.enemyCount = this.wave + 2;
    this.enemySpawned = 0;
  }
  setupControls() {
    super.setupControls();
    document.addEventListener('mousemove', e => {
      let x = e.clientX - this.canvas.getBoundingClientRect().left;
      this.base.x = Math.max(this.base.width/2, Math.min(x, this.width - this.base.width/2));
    });
    if (MobileControlsManager.isMobileDevice()) {
      MobileControlsManager.createButton('SHOOT', 'bottom-center');
      MobileControlsManager.onMove(state => {
        this.base.x = this.width/2 + state.x * this.width/4;
        this.base.x = Math.max(this.base.width/2, Math.min(this.base.x, this.width - this.base.width/2));
      });
      MobileControlsManager.onButton(({label, state}) => { if (label === 'SHOOT' && state === 'down') this.shoot(); });
    }
    document.addEventListener('click', e => this.shoot());
  }
  update(dt) {
    this.waveTimer += dt;
    this.spawnTimer -= dt;
    if (this.spawnTimer < 0 && this.enemySpawned < this.enemyCount) {
      this.enemies.push({
        x: Math.random() * this.width,
        y: -30,
        vx: (Math.random()-0.5)*2,
        vy: 2 + Math.random()*1,
        health: 1 + Math.floor(this.wave*0.5)
      });
      this.enemySpawned++;
      this.spawnTimer = 0.5;
    }
    this.missiles = this.missiles.filter(m => {
      m.x += m.vx; m.y += m.vy;
      for (let i = this.enemies.length-1; i >= 0; i--) {
        let e = this.enemies[i];
        if (Math.hypot(m.x-e.x, m.y-e.y) < 20) {
          this.score += 10; this.coins += 1;
          e.health--;
          this.explosions.push({x: m.x, y: m.y, life: 8, radius: 0});
          if (e.health <= 0) {
            this.enemies.splice(i, 1);
            this.emitParticle(e.x, e.y, {count: 10, color: '#FF0000'});
            AudioManager.play('coin');
          }
          return false;
        }
      }
      return m.y > 0 && m.y < this.height;
    });
    this.enemies = this.enemies.filter(e => {
      e.x += e.vx; e.y += e.vy;
      if (e.y > this.height) {
        this.base.health -= 10;
        if (this.base.health <= 0) this.endGame();
        return false;
      }
      return true;
    });
    this.explosions = this.explosions.filter(e => {
      e.life--; e.radius += 3;
      return e.life > 0;
    });
    if (this.enemies.length === 0 && this.enemySpawned === this.enemyCount && this.waveTimer > 2) {
      this.wave++; this.waveTimer = 0; this.enemyCount = this.wave + 2; this.enemySpawned = 0; this.spawnTimer = 0;
    }
  }
  shoot() {
    this.missiles.push({
      x: this.base.x,
      y: this.base.y,
      vx: 0,
      vy: -8
    });
    AudioManager.play('shoot');
  }
  render() {
    this.clear();
    this.ctx.fillStyle = '#00ff00';
    this.ctx.fillRect(this.base.x - this.base.width/2, this.base.y, this.base.width, this.base.height);
    this.ctx.fillStyle = '#00aa00';
    this.ctx.fillRect(this.base.x - 2, this.base.y - 15, 4, 15);
    this.enemies.forEach(e => {
      this.ctx.fillStyle = '#ff0000';
      this.ctx.beginPath();
      this.ctx.arc(e.x, e.y, 12, 0, Math.PI*2);
      this.ctx.fill();
      this.ctx.fillStyle = '#ffff00';
      this.ctx.font = '12px Arial';
      this.ctx.textAlign = 'center';
      this.ctx.fillText(e.health, e.x, e.y+4);
    });
    this.missiles.forEach(m => {
      this.ctx.fillStyle = '#ffff00';
      this.ctx.fillRect(m.x-2, m.y-8, 4, 8);
    });
    this.explosions.forEach(e => {
      this.ctx.strokeStyle = 'rgba(255, 165, 0, '+(e.life/8)+')';
      this.ctx.lineWidth = 3;
      this.ctx.beginPath();
      this.ctx.arc(e.x, e.y, e.radius, 0, Math.PI*2);
      this.ctx.stroke();
    });
    this.drawText('BASE HP: '+this.base.health, 20, 25, {size: 14});
    this.drawText('WAVE: '+this.wave, this.width/2, 25, {size: 14, align: 'center'});
    ParticleManager.render(this.ctx);
  }
}
game = new MissileDefense();
game.start();
