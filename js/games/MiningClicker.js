class MiningClicker extends GameTemplate {
  initGame() {
    this.ore = 0;
    this.perClick = 1;
    this.perSecond = 0;
    this.depth = 1;
    this.upgrades = [
      {name: 'Iron Pickaxe', cost: 50, owned: 0, effect: () => this.perClick += 2},
      {name: 'Steel Pickaxe', cost: 250, owned: 0, effect: () => this.perClick += 5},
      {name: 'Drill', cost: 1000, owned: 0, effect: () => this.perSecond += 5},
      {name: 'Excavator', cost: 5000, owned: 0, effect: () => this.perSecond += 25},
      {name: 'Mining Rig', cost: 20000, owned: 0, effect: () => this.perSecond += 100}
    ];
    this.clickArea = {x: 250, y: 150, w: 300, h: 250};
  }
  setupControls() {
    super.setupControls();
    this.canvas.addEventListener('click', e => this.handleClick(e));
    if (MobileControlsManager.isMobileDevice()) {
      MobileControlsManager.createButton('⛏️ MINE', 'top-center');
      MobileControlsManager.onButton(({label, state}) => {
        if (label === '⛏️ MINE' && state === 'down') this.ore += this.perClick;
      });
    }
  }
  handleClick(e) {
    const rect = this.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left, y = e.clientY - rect.top;
    if (x > this.clickArea.x && x < this.clickArea.x + this.clickArea.w && y > this.clickArea.y && y < this.clickArea.y + this.clickArea.h) {
      this.ore += this.perClick;
      this.depth = Math.floor(this.ore / 100) + 1;
      this.emitParticle(x, y, {count: 8, color: '#808080'});
      AudioManager.play('coin');
    }
    for (let i = 0; i < this.upgrades.length; i++) {
      const btn = {x: 50, y: 450 + i*30, w: 700, h: 25};
      if (x > btn.x && x < btn.x + btn.w && y > btn.y && y < btn.y + btn.h) {
        if (this.ore >= this.upgrades[i].cost) {
          this.ore -= this.upgrades[i].cost;
          this.upgrades[i].owned++;
          this.upgrades[i].effect();
          this.upgrades[i].cost = Math.floor(this.upgrades[i].cost * 1.2);
          AudioManager.play('coin');
        }
      }
    }
  }
  update(dt) {
    this.ore += this.perSecond * dt;
    this.score = Math.floor(this.ore);
    this.depth = Math.floor(this.ore / 100) + 1;
    this.coins_earned = Math.floor(this.ore / 50);
  }
  render() {
    this.clear('#4a4a4a');
    this.ctx.fillStyle = '#505050';
    this.ctx.fillRect(this.clickArea.x, this.clickArea.y, this.clickArea.w, this.clickArea.h);
    this.ctx.fillStyle = '#808080';
    for (let i = 0; i < 8; i++) {
      this.ctx.fillRect(this.clickArea.x + Math.random()*this.clickArea.w, this.clickArea.y + Math.random()*this.clickArea.h, 20, 20);
    }
    this.ctx.fillStyle = '#FFD700';
    for (let i = 0; i < Math.min(5, Math.floor(this.ore/50)); i++) {
      this.ctx.fillRect(this.clickArea.x + 30 + i*40, this.clickArea.y + 60, 30, 30);
    }
    this.drawText('⛏️ MINE ORE!', this.width/2, 120, {size: 20, align: 'center'});
    this.drawText('Ore: '+Math.floor(this.ore), 20, 30, {size: 16});
    this.drawText('Depth: '+this.depth+'m', 20, 55, {size: 14});
    this.drawText('Per Second: '+Math.ceil(this.perSecond), 20, 75, {size: 14});
    this.drawText('=== UPGRADES ===', 50, 420, {size: 14});
    this.upgrades.forEach((u, i) => {
      const canAfford = this.ore >= u.cost;
      this.ctx.fillStyle = canAfford ? '#00ff00' : '#ff0000';
      this.ctx.fillRect(50, 450 + i*30, 700, 25);
      this.ctx.fillStyle = '#000000';
      this.ctx.font = '12px Arial';
      this.ctx.textAlign = 'left';
      this.ctx.fillText(u.name + ' x' + u.owned + ' (Cost: ' + u.cost + ')', 60, 466 + i*30);
    });
    ParticleManager.render(this.ctx);
  }
}
game = new MiningClicker();
game.start();
