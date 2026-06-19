class SnakeIO extends GameTemplate {
  initGame() {
    this.width = 1200; this.height = 800;
    this.canvas.width = this.width; this.canvas.height = this.height;
    this.player = { body: [{x:600, y:400}], vx: 5, vy: 0, nextVx: 5, nextVy: 0, speed: 3, boost: 0, maxBoost: 100 };
    this.food = [];
    this.enemies = [];
    this.coins_earned = 0;
    this.spawnFood(50);
    this.spawnEnemies(3);
    this.cameraX = 0; this.cameraY = 0;
  }
  spawnFood(count) {
    for (let i = 0; i < count; i++) {
      this.food.push({ x: Math.random()*this.width, y: Math.random()*this.height, value: 1 });
    }
  }
  spawnEnemies(count) {
    for (let i = 0; i < count; i++) {
      const x = Math.random()*this.width, y = Math.random()*this.height;
      this.enemies.push({
        body: [{x, y}, {x: x-10, y}], vx: Math.random()-0.5, vy: Math.random()-0.5, speed: 2, target: null
      });
    }
  }
  setupControls() {
    super.setupControls();
    const keys = {};
    document.addEventListener('keydown', e => { keys[e.key] = true; });
    document.addEventListener('keyup', e => { keys[e.key] = false; });
    if (MobileControlsManager.isMobileDevice()) {
      MobileControlsManager.createButton('↑ UP', 'top-center');
      MobileControlsManager.createButton('↓ DOWN', 'bottom-center');
      MobileControlsManager.createButton('← LEFT', 'left-center');
      MobileControlsManager.createButton('RIGHT →', 'right-center');
      MobileControlsManager.createButton('⚡ BOOST', 'bottom-right');
      MobileControlsManager.onButton(({label, state}) => {
        if (state === 'down') {
          if (label === '↑ UP') { this.player.nextVx = 0; this.player.nextVy = -this.player.speed; }
          if (label === '↓ DOWN') { this.player.nextVx = 0; this.player.nextVy = this.player.speed; }
          if (label === '← LEFT') { this.player.nextVx = -this.player.speed; this.player.nextVy = 0; }
          if (label === 'RIGHT →') { this.player.nextVx = this.player.speed; this.player.nextVy = 0; }
          if (label === '⚡ BOOST' && this.player.boost > 10) { this.player.speed = 5; this.player.boost -= 20; }
        } else if (state === 'up' && label === '⚡ BOOST') this.player.speed = 3;
      });
    }
    this.updateControls = () => {
      if (keys['ArrowUp'] || keys['w']) { this.player.nextVx = 0; this.player.nextVy = -this.player.speed; }
      if (keys['ArrowDown'] || keys['s']) { this.player.nextVx = 0; this.player.nextVy = this.player.speed; }
      if (keys['ArrowLeft'] || keys['a']) { this.player.nextVx = -this.player.speed; this.player.nextVy = 0; }
      if (keys['ArrowRight'] || keys['d']) { this.player.nextVx = this.player.speed; this.player.nextVy = 0; }
      if ((keys[' '] || keys['Shift']) && this.player.boost > 10) { this.player.speed = 5; this.player.boost -= 1; }
      else this.player.speed = 3;
    };
  }
  update(dt) {
    this.updateControls();
    this.player.vx = this.player.nextVx; this.player.vy = this.player.nextVy;
    const head = this.player.body[0];
    head.x += this.player.vx; head.y += this.player.vy;
    head.x = (head.x + this.width) % this.width;
    head.y = (head.y + this.height) % this.height;
    for (let i = this.food.length-1; i >= 0; i--) {
      if (Math.hypot(head.x - this.food[i].x, head.y - this.food[i].y) < 8) {
        this.player.body.push({x: this.player.body[this.player.body.length-1].x, y: this.player.body[this.player.body.length-1].y});
        this.score = this.player.body.length - 1;
        this.coins_earned++;
        this.player.boost = Math.min(100, this.player.boost + 5);
        this.food.splice(i, 1);
        AudioManager.play('coin');
        if (Math.random() < 0.3) this.food.push({ x: Math.random()*this.width, y: Math.random()*this.height, value: 1 });
      }
    }
    if (this.player.body.length > 3) {
      for (let i = 4; i < this.player.body.length; i++) {
        if (Math.hypot(head.x - this.player.body[i].x, head.y - this.player.body[i].y) < 6) {
          this.endGame();
          AudioManager.play('gameOver');
        }
      }
    }
    this.enemies.forEach(enemy => {
      const eHead = enemy.body[0];
      eHead.x += enemy.vx; eHead.y += enemy.vy;
      eHead.x = (eHead.x + this.width) % this.width;
      eHead.y = (eHead.y + this.height) % this.height;
      if (Math.random() < 0.02) {
        enemy.vx = (Math.random()-0.5)*2;
        enemy.vy = (Math.random()-0.5)*2;
      }
      if (enemy.body.length < 10 && Math.random() < 0.01) {
        const foodNear = this.food.find(f => Math.hypot(eHead.x-f.x, eHead.y-f.y) < 100);
        if (foodNear) { enemy.body.push({x: eHead.x, y: eHead.y}); }
      }
      if (enemy.body.length > 3) {
        for (let i = 1; i < enemy.body.length; i++) {
          if (Math.hypot(eHead.x - enemy.body[i].x, eHead.y - enemy.body[i].y) < 4) {
            enemy.body.splice(1);
          }
        }
      }
      if (Math.hypot(head.x - eHead.x, head.y - eHead.y) < 10) {
        if (this.player.body.length > enemy.body.length) {
          this.player.body.push({x: eHead.x, y: eHead.y});
          this.score = this.player.body.length - 1;
          this.coins_earned += enemy.body.length;
          enemy.body = [{x: Math.random()*this.width, y: Math.random()*this.height}];
          AudioManager.play('coin');
        } else {
          this.endGame();
          AudioManager.play('gameOver');
        }
      }
    });
  }
  render() {
    this.clear();
    this.cameraX = this.player.body[0].x - this.canvas.width/2;
    this.cameraY = this.player.body[0].y - this.canvas.height/2;
    const ctx = this.ctx;
    ctx.save();
    ctx.translate(-this.cameraX, -this.cameraY);
    this.player.body.forEach((segment, i) => {
      ctx.fillStyle = i === 0 ? '#00ff00' : '#00cc00';
      ctx.beginPath();
      ctx.arc(segment.x, segment.y, 7, 0, Math.PI*2);
      ctx.fill();
    });
    this.enemies.forEach(enemy => {
      enemy.body.forEach((segment, i) => {
        ctx.fillStyle = i === 0 ? '#ff0000' : '#cc0000';
        ctx.beginPath();
        ctx.arc(segment.x, segment.y, 5, 0, Math.PI*2);
        ctx.fill();
      });
    });
    this.food.forEach(f => {
      ctx.fillStyle = '#FFD700';
      ctx.beginPath();
      ctx.arc(f.x, f.y, 3, 0, Math.PI*2);
      ctx.fill();
    });
    ctx.restore();
    this.drawText('Length: '+this.score, 20, 25, {size: 14});
    this.drawText('Boost: '+Math.ceil(this.player.boost)+'%', 20, 45, {size: 14});
    this.drawText('Coins: '+this.coins_earned, this.canvas.width-120, 25, {size: 14});
    ParticleManager.render(this.ctx);
  }
}
game = new SnakeIO();
game.updateControls = () => {};
game.start();
