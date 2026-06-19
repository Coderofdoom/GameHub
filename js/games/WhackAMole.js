class WhackAMole extends GameTemplate {
  initGame() {
    this.holes = [];
    this.moles = {};
    this.timeLeft = 30;
    this.gameStarted = false;
    const cols = 3, rows = 3;
    const cellW = this.width / cols, cellH = (this.height - 100) / rows;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const id = r*cols + c;
        this.holes.push({
          id, x: c * cellW + cellW/2, y: r * cellH + cellH/2, radius: 40, active: false, moleY: 0
        });
        this.moles[id] = {up: false, popTime: 0};
      }
    }
  }
  setupControls() {
    super.setupControls();
    this.canvas.addEventListener('click', e => { this.handleClick(e); });
    this.canvas.addEventListener('touchstart', e => { this.handleClick(e.touches[0]); }, false);
  }
  handleClick(e) {
    const rect = this.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    for (let hole of this.holes) {
      if (this.moles[hole.id].up && Math.hypot(x - hole.x, y - hole.y) < hole.radius) {
        this.score += 10; this.coins_earned++;
        this.moles[hole.id].up = false;
        this.emitParticle(hole.x, hole.y, {count: 15, color: '#8B4513'});
        AudioManager.play('coin');
      }
    }
  }
  update(dt) {
    if (!this.gameStarted) { this.gameStarted = true; }
    this.timeLeft -= dt;
    if (this.timeLeft <= 0) { this.endGame(); return; }
    for (let hole of this.holes) {
      const m = this.moles[hole.id];
      if (m.up) {
        m.popTime -= dt;
        if (m.popTime <= 0) m.up = false;
      } else if (Math.random() < 0.02) {
        m.up = true;
        m.popTime = 1.5;
        AudioManager.play('shoot');
      }
    }
  }
  render() {
    this.clear('#228B22');
    this.holes.forEach(hole => {
      this.ctx.fillStyle = '#654321';
      this.ctx.beginPath();
      this.ctx.arc(hole.x, hole.y, hole.radius, 0, Math.PI*2);
      this.ctx.fill();
      this.ctx.fillStyle = '#3D2817';
      this.ctx.beginPath();
      this.ctx.arc(hole.x, hole.y, hole.radius - 5, 0, Math.PI*2);
      this.ctx.fill();
      const m = this.moles[hole.id];
      if (m.up) {
        this.ctx.fillStyle = '#8B4513';
        this.ctx.beginPath();
        this.ctx.arc(hole.x, hole.y - (1 - m.popTime/1.5) * hole.radius * 0.8, hole.radius * 0.6, 0, Math.PI*2);
        this.ctx.fill();
        this.ctx.fillStyle = '#000000';
        this.ctx.beginPath();
        this.ctx.arc(hole.x - 8, hole.y - (1 - m.popTime/1.5) * hole.radius * 0.8 - 5, 4, 0, Math.PI*2);
        this.ctx.fill();
        this.ctx.beginPath();
        this.ctx.arc(hole.x + 8, hole.y - (1 - m.popTime/1.5) * hole.radius * 0.8 - 5, 4, 0, Math.PI*2);
        this.ctx.fill();
      }
    });
    this.drawText('Time: '+Math.ceil(this.timeLeft), this.width/2, 30, {size: 24, color: '#FFD700', align: 'center'});
    this.drawText('Score: '+this.score + ' | Coins: '+this.coins_earned, this.width/2, 70, {size: 16, color: '#ffffff', align: 'center'});
    ParticleManager.render(this.ctx);
  }
}
game = new WhackAMole();
game.coins_earned = 0;
game.start();
