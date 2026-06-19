class FruitSlice extends GameTemplate {
  initGame() {
    this.fruits = [];
    this.bombs = [];
    this.combos = 0;
    this.maxCombo = 0;
    this.slices = [];
    this.gameTime = 0;
    this.gameOverTime = 0;
    this.spawnRate = 0;
  }
  setupControls() {
    super.setupControls();
    document.addEventListener('mousemove', e => { this.handleSlice(e.clientX - this.canvas.getBoundingClientRect().left, e.clientY - this.canvas.getBoundingClientRect().top); });
    this.canvas.addEventListener('touchmove', e => { e.preventDefault(); let t = e.touches[0]; this.handleSlice(t.clientX - this.canvas.getBoundingClientRect().left, t.clientY - this.canvas.getBoundingClientRect().top); }, {passive: false});
  }
  update(dt) {
    this.gameTime += dt;
    this.spawnRate -= dt;
    if (this.spawnRate < 0) {
      if (Math.random() < 0.7) this.spawnFruit();
      else this.spawnBomb();
      this.spawnRate = 0.3;
    }
    this.fruits = this.fruits.filter(f => {
      f.x += f.vx; f.y += f.vy; f.vy += 0.2; f.spin += f.spinSpeed;
      if (f.y > this.height + 50 || f.life <= 0) {
        if (f.life > 0) this.combos = 0;
        return false;
      }
      return true;
    });
    this.bombs = this.bombs.filter(b => {
      b.x += b.vx; b.y += b.vy; b.vy += 0.2; b.spin += b.spinSpeed;
      if (b.y > this.height + 50) return false;
      return true;
    });
    this.slices = this.slices.filter(s => {s.life--; return s.life > 0;});
  }
  spawnFruit() {
    const fruits = ['🍎', '🍊', '🍇', '🍓', '🍑', '🍋', '🥝'];
    const fx = Math.random() * this.width;
    this.fruits.push({
      emoji: fruits[Math.floor(Math.random()*fruits.length)],
      x: fx, y: this.height - 30,
      vx: (Math.random()-0.5)*4, vy: -12 - Math.random()*8,
      life: 200, spinSpeed: (Math.random()-0.5)*0.1, spin: 0, radius: 20
    });
  }
  spawnBomb() {
    const bx = Math.random() * this.width;
    this.bombs.push({
      emoji: '💣',
      x: bx, y: this.height - 30,
      vx: (Math.random()-0.5)*3, vy: -10 - Math.random()*6,
      spinSpeed: (Math.random()-0.5)*0.1, spin: 0, radius: 18
    });
  }
  handleSlice(x, y) {
    for (let i = this.fruits.length-1; i >= 0; i--) {
      let f = this.fruits[i];
      if (Math.hypot(f.x-x, f.y-y) < f.radius) {
        this.score += 10; this.coins += 2; this.combos++; this.maxCombo = Math.max(this.maxCombo, this.combos);
        this.slices.push({x: f.x, y: f.y, life: 8, size: f.radius});
        this.fruits.splice(i, 1);
        this.emitParticle(f.x, f.y, {count: 12, color: '#FF6B6B'});
        AudioManager.play('coin');
      }
    }
    for (let i = this.bombs.length-1; i >= 0; i--) {
      let b = this.bombs[i];
      if (Math.hypot(b.x-x, b.y-y) < b.radius) {
        this.lives--;
        if (this.lives <= 0) this.endGame();
        this.bombs.splice(i, 1);
        this.emitParticle(b.x, b.y, {count: 20, color: '#000000'});
        AudioManager.play('gameOver');
      }
    }
  }
  render() {
    this.clear('#001a00');
    this.fruits.forEach(f => {
      this.ctx.save();
      this.ctx.translate(f.x, f.y);
      this.ctx.rotate(f.spin);
      this.ctx.font = '40px Arial';
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';
      this.ctx.fillText(f.emoji, 0, 0);
      this.ctx.restore();
    });
    this.bombs.forEach(b => {
      this.ctx.save();
      this.ctx.translate(b.x, b.y);
      this.ctx.rotate(b.spin);
      this.ctx.font = '36px Arial';
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';
      this.ctx.fillText(b.emoji, 0, 0);
      this.ctx.restore();
    });
    this.slices.forEach(s => {
      this.ctx.strokeStyle = 'rgba(255, 100, 100, '+(s.life/8)+')';
      this.ctx.lineWidth = 3;
      this.ctx.beginPath();
      this.ctx.arc(s.x, s.y, s.size, 0, Math.PI*2);
      this.ctx.stroke();
    });
    ParticleManager.render(this.ctx);
    this.drawText('Combo x'+this.combos, this.width/2, 50, {size: 24, color: '#FFD700'});
  }
}
game = new FruitSlice();
game.start();
