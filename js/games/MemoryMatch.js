/**
 * Memory Match — Cards, progressively harder
 */
class MemoryMatch {
  constructor() {
    this.bridge = GameBridge.init("memory");
    this.emojis = ["🎨", "🎭", "🎪", "🎬", "🎤", "🎸", "🎹", "🎺"];
    this.cards = [];
    this.flipped = [];
    this.matched = 0;
    this.moves = 0;
    this.coins = 0;
    this.level = 1;
    this.gameOver = false;
    this.canFlip = true;
    this.initGame();
  }

  initGame() {
    const pairCount = 4 + Math.floor(this.level / 2);
    this.cards = [];
    const selectedEmojis = this.emojis.slice(0, Math.min(pairCount, 8));
    const deck = [...selectedEmojis, ...selectedEmojis].sort(() => Math.random() - 0.5);

    deck.forEach((emoji, idx) => {
      this.cards.push({
        id: idx,
        emoji: emoji,
        flipped: false,
        matched: false
      });
    });

    this.flipped = [];
    this.matched = 0;
    this.moves = 0;
    this.render();
  }

  flipCard(id) {
    if (!this.canFlip || this.gameOver) return;
    const card = this.cards[id];
    if (card.matched || card.flipped) return;

    card.flipped = true;
    this.flipped.push(id);

    AudioManager.play("click");
    this.render();

    if (this.flipped.length === 2) {
      this.canFlip = false;
      this.moves++;
      setTimeout(() => this.checkMatch(), 600);
    }
  }

  checkMatch() {
    const [id1, id2] = this.flipped;
    const card1 = this.cards[id1];
    const card2 = this.cards[id2];

    if (card1.emoji === card2.emoji) {
      card1.matched = true;
      card2.matched = true;
      this.matched++;
      this.coins += 5;
      AudioManager.play("coin");

      this.flipped = [];
      this.canFlip = true;

      if (this.matched === this.cards.length / 2) {
        this.levelUp();
      }
    } else {
      card1.flipped = false;
      card2.flipped = false;
      this.flipped = [];
      this.canFlip = true;
      AudioManager.play("hit");
    }

    this.render();
  }

  levelUp() {
    this.level++;
    this.coins += 20;
    AudioManager.play("levelUp");
    setTimeout(() => {
      this.initGame();
    }, 800);
  }

  restart() {
    this.level = 1;
    this.coins = 0;
    this.initGame();
  }

  render() {
    const grid = document.getElementById("grid");
    grid.innerHTML = "";
    grid.style.gridTemplateColumns = `repeat(${Math.ceil(Math.sqrt(this.cards.length))}, 80px)`;

    this.cards.forEach((card, idx) => {
      const cardEl = document.createElement("div");
      cardEl.className = "memory-card";
      if (card.flipped || card.matched) cardEl.classList.add("flipped");
      if (card.matched) cardEl.classList.add("matched");
      cardEl.textContent = (card.flipped || card.matched) ? card.emoji : "?";
      cardEl.addEventListener("click", () => this.flipCard(idx));
      grid.appendChild(cardEl);
    });

    document.getElementById("score").textContent = this.matched;
    document.getElementById("combo").textContent = this.moves;
    document.getElementById("coins").textContent = this.coins;
  }
}

const game = new MemoryMatch();
