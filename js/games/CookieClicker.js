class CookieClicker extends GameTemplate {
  initGame() {
    this.cookies = 0;
    this.perClick = 1;
    this.perSecond = 0;
    this.upgrades = [
      {name: 'Cursor', cost: 15, owned: 0, effect: () => this.perClick += 1},
      {name: 'Grandma', cost: 100, owned: 0, effect: () => this.perSecond += 1},
      {name: 'Farm', cost: 500, owned: 0, effect: () => this.perSecond += 10},
      {name: 'Factory', cost: 2000, owned: 0, effect: () => this.perSecond += 25},
      {name: 'Bank', cost: 10000, owned: 0, effect: () => this.perSecond += 100}
    ];
    this.clickArea = {x: 300, y: 200, w: 200, h: 200};
    this.time = 0;
  }
  setupControls() {
    super.setupControls();
    this.canvas.addEventListener('click', e => this.handleClick(e));
    if (MobileControlsManager.isMobileDevice()) {
      MobileControlsManager.createButton('🍪 CLICK', 'top-center');
      MobileControlsManager.onButton(({label, state}) => {
        if (label === '🍪 CLICK' && state === 'down') this.cookies += this.perClick;
      });
    }
  }
  handleClick(e) {
    const rect = this.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left, y = e.clientY - rect.top;
    if (x > this.clickArea.x && x < this.clickArea.x + this.clickArea.w && y > this.clickArea.y && y < this.clickArea.y + this.clickArea.h) {
      this.cookies += this.perClick;
      this.emitParticle(this.clickArea.x + this.clickArea.w/2, this.clickArea.y + this.clickArea.h/2, {count: 10, color: '#FFD700'});
      AudioManager.play('coin');
    }
    for (let i = 0; i < this.upgrades.length; i++) {
      const btn = {x: 50, y: 450 + i*30, w: 700, h: 25};
      if (x > btn.x && x < btn.x + btn.w && y > btn.y && y < btn.y + btn.h) {
        if (this.cookies >= this.upgrades[i].cost) {
          this.cookies -= this.upgrades[i].cost;
          this.upgrades[i].owned++;
          this.upgrades[i].effect();
          this.upgrades[i].cost = Math.floor(this.upgrades[i].cost * 1.15);
          AudioManager.play('coin');
        }
      }
    }
  }
  update(dt) {
    this.time += dt;
    this.cookies += this.perSecond * dt;
    this.score = Math.floor(this.cookies);
    this.coins_earned = Math.floor(this.cookies / 100);
  }
  render() {
    this.clear();
    this.ctx.fillStyle = '#8B4513';
    this.ctx.beginPath();
    this.ctx.arc(this.clickArea.x + this.clickArea.w/2, this.clickArea.y + this.clickArea.h/2, 100, 0, Math.PI*2);
    this.ctx.fill();
    this.ctx.fillStyle = '#A0522D';
    this.ctx.beginPath();
    this.ctx.arc(this.clickArea.x + this.clickArea.w/2 - 20, this.clickArea.y + this.clickArea.h/2 - 20, 30, 0, Math.PI*2);
    this.ctx.fill();
    this.ctx.beginPath();
    this.ctx.arc(this.clickArea.x + this.clickArea.w/2 + 20, this.clickArea.y + this.clickArea.h/2 + 10, 25, 0, Math.PI*2);
    this.ctx.fill();
    this.drawText('🍪 CLICK ME!', this.width/2, 100, {size: 24, align: 'center'});
    this.drawText('Cookies: '+Math.floor(this.cookies), 20, 30, {size: 16});
    this.drawText('Per Second: '+Math.ceil(this.perSecond), 20, 55, {size: 14});
    this.drawText('=== UPGRADES ===', 50, 420, {size: 14});
    this.upgrades.forEach((u, i) => {
      const canAfford = this.cookies >= u.cost;
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
game = new CookieClicker();
game.start();
