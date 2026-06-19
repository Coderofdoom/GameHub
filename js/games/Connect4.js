class Connect4 extends GameTemplate {
  initGame() {
    this.cols = 7; this.rows = 6;
    this.board = Array(this.rows).fill(0).map(() => Array(this.cols).fill(0));
    this.currentPlayer = 1;
    this.gameOver = false;
    this.winner = 0;
    this.wins = 0;
    this.cellSize = 80;
  }
  setupControls() {
    super.setupControls();
    this.canvas.addEventListener('click', e => {
      const rect = this.canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const col = Math.floor(x / this.cellSize);
      this.dropPiece(col);
    });
    if (MobileControlsManager.isMobileDevice()) {
      for (let i = 0; i < this.cols; i++) {
        MobileControlsManager.createButton('Col '+(i+1), 'top-left', i);
        MobileControlsManager.onButton(({label, state}) => {
          if (state === 'down') {
            const col = parseInt(label.match(/\d+/)[0]) - 1;
            this.dropPiece(col);
          }
        });
      }
    }
  }
  dropPiece(col) {
    if (this.gameOver || col < 0 || col >= this.cols) return;
    for (let row = this.rows - 1; row >= 0; row--) {
      if (this.board[row][col] === 0) {
        this.board[row][col] = this.currentPlayer;
        AudioManager.play('coin');
        if (this.checkWin(row, col, this.currentPlayer)) {
          this.winner = this.currentPlayer;
          this.gameOver = true;
          if (this.currentPlayer === 1) { this.wins++; this.score = this.wins; }
          AudioManager.play('gameOver');
          this.emitParticle(this.width/2, this.height/2, {count: 30, color: this.currentPlayer === 1 ? '#FF0000' : '#FFD700'});
          setTimeout(() => this.resetGame(), 2000);
        } else {
          this.currentPlayer = this.currentPlayer === 1 ? 2 : 1;
          if (this.currentPlayer === 2) setTimeout(() => this.aiMove(), 500);
        }
        return;
      }
    }
  }
  checkWin(row, col, player) {
    const dirs = [[0,1], [1,0], [1,1], [1,-1]];
    for (let [dr, dc] of dirs) {
      let count = 1;
      for (let i = 1; i < 4; i++) {
        const nr = row + dr*i, nc = col + dc*i;
        if (nr >= 0 && nr < this.rows && nc >= 0 && nc < this.cols && this.board[nr][nc] === player) count++;
        else break;
      }
      for (let i = 1; i < 4; i++) {
        const nr = row - dr*i, nc = col - dc*i;
        if (nr >= 0 && nr < this.rows && nc >= 0 && nc < this.cols && this.board[nr][nc] === player) count++;
        else break;
      }
      if (count >= 4) return true;
    }
    return false;
  }
  aiMove() {
    for (let col = 0; col < this.cols; col++) {
      if (this.board[0][col] === 0) {
        for (let row = this.rows - 1; row >= 0; row--) {
          if (this.board[row][col] === 0) {
            this.board[row][col] = 2;
            if (this.checkWin(row, col, 2)) {
              this.winner = 2;
              this.gameOver = true;
              AudioManager.play('gameOver');
              this.emitParticle(this.width/2, this.height/2, {count: 30, color: '#FFD700'});
              setTimeout(() => this.resetGame(), 2000);
            } else {
              this.currentPlayer = 1;
            }
            AudioManager.play('coin');
            return;
          }
        }
      }
    }
  }
  resetGame() {
    this.gameOver = false; this.winner = 0; this.currentPlayer = 1;
    this.board = Array(this.rows).fill(0).map(() => Array(this.cols).fill(0));
  }
  update(dt) {}
  render() {
    this.clear();
    this.ctx.fillStyle = '#0066ff';
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        this.ctx.fillRect(c * this.cellSize + 20, r * this.cellSize + 60, this.cellSize - 10, this.cellSize - 10);
      }
    }
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        if (this.board[r][c] > 0) {
          this.ctx.fillStyle = this.board[r][c] === 1 ? '#FF0000' : '#FFD700';
          this.ctx.beginPath();
          this.ctx.arc(c * this.cellSize + 25 + (this.cellSize - 20)/2, r * this.cellSize + 65 + (this.cellSize - 20)/2, (this.cellSize - 20)/2 - 5, 0, Math.PI*2);
          this.ctx.fill();
        }
      }
    }
    this.drawText('Player 1 (RED)', 20, 30, {size: 16});
    this.drawText('AI (YELLOW)', this.width - 200, 30, {size: 16});
    if (this.gameOver) {
      this.drawText(this.winner === 1 ? '🎉 YOU WIN!' : '😢 YOU LOSE', this.width/2, this.height/2, {size: 36, color: this.winner === 1 ? '#00ff00' : '#ff0000', align: 'center'});
    }
    ParticleManager.render(this.ctx);
  }
}
game = new Connect4();
game.start();
