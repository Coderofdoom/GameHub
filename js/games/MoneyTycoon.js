class MoneyTycoon extends GameTemplate {
  initGame() {
    this.money = 0;
    this.perClick = 1;
    this.perSecond = 0;
    this.businesses = [
      {name: 'Lemonade Stand', cost: 10, owned: 0, income: 1},
      {name: 'Store', cost: 50, owned: 0, income: 5},
      {name: 'Restaurant', cost: 250, owned: 0, income: 25},
      {name: 'Shopping Mall', cost: 1000, owned: 0, income: 100},
      {name: 'Corporation', cost: 5000, owned: 0, income: 500}
    ];
    this.clickArea = {x: 300, y: 150, w: 200, h: 200};
  }
  setupControls() {
    super.setupControls();
    this.canvas.addEventListener('click', e => this.handleClick(e));
    if (MobileControlsManager.isMobileDevice()) {
      MobileControlsManager.createButton('💵 EARN', 'top-center');
      MobileControlsManager.onButton(({label, state}) => {
        if (label === '💵 EARN' && state === 'down') this.money += this.perClick;
      });
    }
  }
  handleClick(e) {
    const rect = this.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left, y = e.clientY - rect.top;
    if (x > this.clickArea.x && x < this.clickArea.x + this.clickArea.w && y > this.clickArea.y && y < this.clickArea.y + this.clickArea.h) {
      this.money += this.perClick;
      this.emitParticle(x, y, {count: 10, color: '#00ff00'});
      AudioManager.play('coin');
    }
    for (let i = 0; i < this.businesses.length; i++) {
      const btn = {x: 50, y: 380 + i*35, w: 700, h: 30};
      if (x > btn.x && x < btn.x + btn.w && y > btn.y && y < btn.y + btn.h) {
        if (this.money >= this.businesses[i].cost) {
          this.money -= this.businesses[i].cost;
          this.businesses[i].owned++;
          this.perSecond += this.businesses[i].income;
          this.businesses[i].cost = Math.floor(this.businesses[i].cost * 1.15);
          AudioManager.play('coin');
        }
      }
    }
  }
  update(dt) {
    this.money += this.perSecond * dt;
    this.score = Math.floor(this.money);
    this.coins_earned = Math.floor(this.money / 100);
  }
  render() {
    this.clear('#1a3a1a');
    this.ctx.fillStyle = '#00ff00';
    this.ctx.font = 'bold 60px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('💵', this.clickArea.x + this.clickArea.w/2, this.clickArea.y + this.clickArea.h/2);
    this.drawText('Tap to Earn!', this.width/2, 130, {size: 18, align: 'center'});
    this.drawText('Money: $'+Math.floor(this.money), 20, 30, {size: 16});
    this.drawText('Per Second: $'+Math.ceil(this.perSecond), 20, 55, {size: 14});
    this.drawText('=== BUSINESSES ===', 50, 350, {size: 14});
    this.businesses.forEach((b, i) => {
      const canAfford = this.money >= b.cost;
      this.ctx.fillStyle = canAfford ? '#00aa00' : '#aa0000';
      this.ctx.fillRect(50, 380 + i*35, 700, 30);
      this.ctx.fillStyle = '#ffffff';
      this.ctx.font = 'bold 12px Arial';
      this.ctx.textAlign = 'left';
      this.ctx.fillText(b.name + ' x' + b.owned + ' | +$' + b.income + '/s | Cost: $' + b.cost, 60, 402 + i*35);
    });
    ParticleManager.render(this.ctx);
  }
}
game = new MoneyTycoon();
game.start();
