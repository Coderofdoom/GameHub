class IdleFactory extends GameTemplate {
  initGame() {
    this.items = 0;
    this.perClick = 1;
    this.productionRate = 0;
    this.machines = [
      {name: 'Worker', cost: 20, owned: 0, speed: 1},
      {name: 'Assembly Line', cost: 100, owned: 0, speed: 5},
      {name: 'Robot Arm', cost: 500, owned: 0, speed: 20},
      {name: 'AI System', cost: 2000, owned: 0, speed: 50},
      {name: 'Quantum Processor', cost: 10000, owned: 0, speed: 200}
    ];
    this.clickArea = {x: 200, y: 150, w: 400, h: 200};
  }
  setupControls() {
    super.setupControls();
    this.canvas.addEventListener('click', e => this.handleClick(e));
    if (MobileControlsManager.isMobileDevice()) {
      MobileControlsManager.createButton('📦 PRODUCE', 'top-center');
      MobileControlsManager.onButton(({label, state}) => {
        if (label === '📦 PRODUCE' && state === 'down') this.items += this.perClick;
      });
    }
  }
  handleClick(e) {
    const rect = this.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left, y = e.clientY - rect.top;
    if (x > this.clickArea.x && x < this.clickArea.x + this.clickArea.w && y > this.clickArea.y && y < this.clickArea.y + this.clickArea.h) {
      this.items += this.perClick;
      this.emitParticle(x, y, {count: 8, color: '#00ccff'});
      AudioManager.play('coin');
    }
    for (let i = 0; i < this.machines.length; i++) {
      const btn = {x: 50, y: 380 + i*35, w: 700, h: 30};
      if (x > btn.x && x < btn.x + btn.w && y > btn.y && y < btn.y + btn.h) {
        if (this.items >= this.machines[i].cost) {
          this.items -= this.machines[i].cost;
          this.machines[i].owned++;
          this.productionRate += this.machines[i].speed;
          this.machines[i].cost = Math.floor(this.machines[i].cost * 1.18);
          AudioManager.play('coin');
        }
      }
    }
  }
  update(dt) {
    this.items += this.productionRate * dt;
    this.score = Math.floor(this.items);
    this.coins_earned = Math.floor(this.items / 100);
  }
  render() {
    this.clear('#1a1a2e');
    this.ctx.fillStyle = '#00ccff';
    for (let i = 0; i < this.machines.length; i++) {
      if (this.machines[i].owned > 0) {
        const x = 100 + (i*100)%700;
        const y = 100 + Math.floor(i/7)*40;
        this.ctx.fillRect(x, y, 30, 30);
      }
    }
    this.ctx.fillStyle = '#ffaa00';
    this.ctx.font = '40px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('📦', this.clickArea.x + this.clickArea.w/2, this.clickArea.y + this.clickArea.h/2);
    this.drawText('Click to Produce!', this.width/2, 130, {size: 16, align: 'center'});
    this.drawText('Items: '+Math.floor(this.items), 20, 30, {size: 16});
    this.drawText('Production Rate: '+Math.ceil(this.productionRate)+'/s', 20, 55, {size: 14});
    this.drawText('=== MACHINES ===', 50, 350, {size: 14});
    this.machines.forEach((m, i) => {
      const canAfford = this.items >= m.cost;
      this.ctx.fillStyle = canAfford ? '#0066ff' : '#660000';
      this.ctx.fillRect(50, 380 + i*35, 700, 30);
      this.ctx.fillStyle = '#ffffff';
      this.ctx.font = 'bold 12px Arial';
      this.ctx.textAlign = 'left';
      this.ctx.fillText(m.name + ' x' + m.owned + ' | +' + m.speed + ' items/s | Cost: ' + m.cost, 60, 402 + i*35);
    });
    ParticleManager.render(this.ctx);
  }
}
game = new IdleFactory();
game.start();
