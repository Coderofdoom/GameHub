/**
 * Tic Tac Toe — vs AI with difficulty levels
 */
class TicTacToe {
  constructor() {
    this.bridge = GameBridge.init("tictactoe");
    this.board = Array(9).fill(null);
    this.human = "X";
    this.ai = "O";
    this.gameOver = false;
    this.winner = null;
    this.wins = 0;
    this.losses = 0;
    this.coins = 0;
    this.difficulty = 2;
    this.render();
    this.setupBoard();
  }

  setupBoard() {
    const boardEl = document.getElementById("board");
    boardEl.innerHTML = "";
    for (let i = 0; i < 9; i++) {
      const cell = document.createElement("div");
      cell.className = "ttt-cell";
      cell.textContent = this.board[i] || "";
      cell.addEventListener("click", () => this.playerMove(i));
      boardEl.appendChild(cell);
    }
  }

  playerMove(index) {
    if (this.gameOver || this.board[index]) return;

    this.board[index] = this.human;
    this.render();

    if (this.checkWinner(this.human)) {
      this.endGame("You win! +10 coins");
      this.wins++;
      this.coins += 10;
      return;
    }

    if (this.isBoardFull()) {
      this.endGame("Draw!");
      return;
    }

    setTimeout(() => this.aiMove(), 500);
  }

  aiMove() {
    let bestScore = -Infinity;
    let bestMove = null;

    for (let i = 0; i < 9; i++) {
      if (this.board[i]) continue;
      this.board[i] = this.ai;
      const score = this.minimax(this.difficulty - 1, false);
      this.board[i] = null;

      if (score > bestScore) {
        bestScore = score;
        bestMove = i;
      }
    }

    if (bestMove !== null) {
      this.board[bestMove] = this.ai;
      this.render();

      if (this.checkWinner(this.ai)) {
        this.endGame("CPU wins!");
        this.losses++;
        return;
      }

      if (this.isBoardFull()) {
        this.endGame("Draw!");
        return;
      }
    }
  }

  minimax(depth, isMaximizing) {
    const winner = this.getWinner();
    if (winner === this.ai) return 10 - depth;
    if (winner === this.human) return depth - 10;
    if (this.isBoardFull()) return 0;

    if (isMaximizing) {
      let bestScore = -Infinity;
      for (let i = 0; i < 9; i++) {
        if (this.board[i]) continue;
        this.board[i] = this.ai;
        bestScore = Math.max(bestScore, this.minimax(depth - 1, false));
        this.board[i] = null;
      }
      return bestScore;
    } else {
      let bestScore = Infinity;
      for (let i = 0; i < 9; i++) {
        if (this.board[i]) continue;
        this.board[i] = this.human;
        bestScore = Math.min(bestScore, this.minimax(depth - 1, true));
        this.board[i] = null;
      }
      return bestScore;
    }
  }

  getWinner() {
    const lines = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8],
      [0, 3, 6], [1, 4, 7], [2, 5, 8],
      [0, 4, 8], [2, 4, 6]
    ];
    for (let line of lines) {
      const [a, b, c] = line;
      if (this.board[a] && this.board[a] === this.board[b] && this.board[a] === this.board[c]) {
        return this.board[a];
      }
    }
    return null;
  }

  checkWinner(player) {
    return this.getWinner() === player;
  }

  isBoardFull() {
    return this.board.every(cell => cell !== null);
  }

  endGame(message) {
    this.gameOver = true;
    const statusEl = document.getElementById("status");
    if (statusEl) statusEl.textContent = message;
    const restartBtn = document.getElementById("restart-btn");
    if (restartBtn) restartBtn.style.display = "block";
    AudioManager.play("levelUp");
  }

  restart() {
    this.board = Array(9).fill(null);
    this.gameOver = false;
    this.winner = null;
    const statusEl = document.getElementById("status");
    if (statusEl) statusEl.textContent = "You (X) vs CPU (O)";
    const restartBtn = document.getElementById("restart-btn");
    if (restartBtn) restartBtn.style.display = "none";
    this.render();
  }

  render() {
    this.setupBoard();
    document.getElementById("score").textContent = this.wins;
    document.getElementById("combo").textContent = this.losses;
    document.getElementById("coins").textContent = this.coins;
  }
}

const game = new TicTacToe();
