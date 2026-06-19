const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const miniCanvas = document.getElementById("minimap");
const miniCtx = miniCanvas.getContext("2d");

const bridge = GameBridge.init("snake");
const cosmetics = GameBridge.getCosmetics();
AudioManager.init(bridge?.settings);

const GRID = 30;
const TILES = canvas.width / GRID;

let snake = [{ x: 10, y: 10 }];
let dx = 1, dy = 0;
let score = 0, coins = 0, combo = 0, comboTimer = 0, level = 1;
let gameOver = false, paused = false;
let boostActive = false, boostTimer = 0, shield = false;
let tickRate = 120;
let particles = [];
let powerups = [];
let aiSnakes = [];
let bossSnake = null;
let bossSpawnScore = 50;
let frame = 0;

const SKIN_COLORS = {
  skin_default: ["#00f7ff", "#00aa88"],
  skin_neon: ["#00ff88", "#00cc66"],
  skin_diamond: ["#b9f2ff", "#88ccff"],
  skin_fire: ["#ff4400", "#cc2200"],
  skin_cyber: ["#c300ff", "#8800cc"],
  char_robot: ["#8899aa", "#667788"],
  char_ninja: ["#333344", "#222233"],
  char_alien: ["#00ff00", "#00aa00"],
};

function getSkinColors() {
  const id = bridge?.equipped?.skin || "skin_default";
  return SKIN_COLORS[id] || SKIN_COLORS.skin_default;
}

let food = spawnFood();

function spawnFood() {
  return { x: Math.floor(Math.random() * TILES), y: Math.floor(Math.random() * TILES), type: Math.random() < 0.15 ? "coin" : "food" };
}

function spawnPowerup() {
  const types = ["boost", "shield", "coin"];
  powerups.push({
    x: Math.floor(Math.random() * TILES),
    y: Math.floor(Math.random() * TILES),
    type: types[Math.floor(Math.random() * types.length)],
    life: 300,
  });
}

function spawnAI() {
  if (aiSnakes.length >= 2 + Math.floor(level / 3)) return;
  aiSnakes.push({
    body: [{ x: Math.floor(Math.random() * TILES), y: Math.floor(Math.random() * TILES) }],
    dx: Math.random() < 0.5 ? 1 : -1,
    dy: 0,
    color: `hsl(${Math.random() * 360}, 70%, 50%)`,
    timer: 0,
  });
}

function spawnBoss() {
  if (bossSnake || score < bossSpawnScore) return;
  bossSnake = {
    body: Array.from({ length: 8 }, (_, i) => ({ x: TILES - 5 - i, y: 5 })),
    dx: -1, dy: 0, hp: 5, maxHp: 5,
  };
  GameBridge.screenShake(8, 400);
  AudioManager.play("powerup");
}

function addParticle(x, y, color) {
  for (let i = 0; i < 6; i++) {
    particles.push({ x: x * GRID + GRID / 2, y: y * GRID + GRID / 2, dx: (Math.random() - 0.5) * 4, dy: (Math.random() - 0.5) * 4, life: 30, color });
  }
}

function moveSnake() {
  if (gameOver || paused || GameBridge.isPaused()) return;

  const speed = boostActive ? 2 : 1;
  for (let s = 0; s < speed; s++) {
    const head = { x: snake[0].x + dx, y: snake[0].y + dy };

    if (head.x < 0 || head.y < 0 || head.x >= TILES || head.y >= TILES) {
      if (!shield) { endGame(); return; }
      head.x = (head.x + TILES) % TILES;
      head.y = (head.y + TILES) % TILES;
    }

    for (const seg of snake) {
      if (seg.x === head.x && seg.y === head.y) {
        if (!shield) { endGame(); return; }
        shield = false;
        break;
      }
    }

    snake.unshift(head);

    let ate = false;
    if (head.x === food.x && head.y === food.y) {
      ate = true;
      if (food.type === "coin") { coins += 5; combo++; comboTimer = 60; }
      else { score++; combo++; comboTimer = 60; }
      addParticle(food.x, food.y, "#ff0044");
      food = spawnFood();
      document.getElementById("score").textContent = score;
      document.getElementById("coins").textContent = coins;
      document.getElementById("combo").textContent = combo;
      AudioManager.play("coin");

      if (score % 10 === 0) { level++; document.getElementById("level").textContent = level; tickRate = Math.max(60, tickRate - 5); }
      if (score % 15 === 0) spawnPowerup();
      if (score % 20 === 0) spawnAI();
      spawnBoss();
    }

    for (let i = powerups.length - 1; i >= 0; i--) {
      const p = powerups[i];
      if (head.x === p.x && head.y === p.y) {
        if (p.type === "boost") { boostActive = true; boostTimer = 100; }
        if (p.type === "shield") shield = true;
        if (p.type === "coin") { coins += 10; document.getElementById("coins").textContent = coins; }
        powerups.splice(i, 1);
        AudioManager.play("powerup");
        addParticle(p.x, p.y, "#ffff00");
      }
    }

    if (bossSnake) {
      for (let i = bossSnake.body.length - 1; i >= 0; i--) {
        if (bossSnake.body[i].x === head.x && bossSnake.body[i].y === head.y) {
          bossSnake.hp--;
          bossSnake.body.splice(i, 1);
          score += 5;
          combo += 2;
          GameBridge.screenShake(6, 200);
          AudioManager.play("hit");
          if (bossSnake.hp <= 0 || bossSnake.body.length === 0) {
            score += 25;
            coins += 20;
            bossSnake = null;
            bossSpawnScore = score + 50;
            GameBridge.emitEvent("boss");
          }
          ate = true;
          break;
        }
      }
    }

    if (!ate) snake.pop();
  }

  if (boostTimer > 0) { boostTimer--; if (boostTimer <= 0) boostActive = false; }
  if (comboTimer > 0) { comboTimer--; if (comboTimer <= 0) combo = 0; document.getElementById("combo").textContent = combo; }

  updateAI();
  updateBoss();
}

function updateAI() {
  aiSnakes.forEach((ai) => {
    ai.timer++;
    if (ai.timer % 8 === 0) {
      const head = ai.body[0];
      const fx = food.x - head.x;
      const fy = food.y - head.y;
      if (Math.abs(fx) > Math.abs(fy)) { ai.dx = fx > 0 ? 1 : -1; ai.dy = 0; }
      else { ai.dy = fy > 0 ? 1 : -1; ai.dx = 0; }
    }
    const newHead = { x: ai.body[0].x + ai.dx, y: ai.body[0].y + ai.dy };
    if (newHead.x >= 0 && newHead.x < TILES && newHead.y >= 0 && newHead.y < TILES) {
      ai.body.unshift(newHead);
      if (newHead.x === food.x && newHead.y === food.y) food = spawnFood();
      else ai.body.pop();
    }
  });
}

function updateBoss() {
  if (!bossSnake) return;
  if (frame % 4 !== 0) return;
  const head = bossSnake.body[0];
  const px = snake[0].x;
  const py = snake[0].y;
  if (Math.abs(px - head.x) > Math.abs(py - head.y)) bossSnake.dx = px > head.x ? 1 : -1;
  else bossSnake.dy = py > head.y ? 1 : -1;
  const nh = { x: head.x + bossSnake.dx, y: head.y + bossSnake.dy };
  bossSnake.body.unshift(nh);
  bossSnake.body.pop();
}

function drawGrid() {
  ctx.strokeStyle = "#1a1a2e";
  for (let i = 0; i <= TILES; i++) {
    ctx.beginPath(); ctx.moveTo(i * GRID, 0); ctx.lineTo(i * GRID, canvas.height); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, i * GRID); ctx.lineTo(canvas.width, i * GRID); ctx.stroke();
  }
}

function drawSnake(body, colors, glow) {
  body.forEach((seg, i) => {
    ctx.fillStyle = i === 0 ? colors[0] : colors[1];
    if (glow) { ctx.shadowBlur = 15; ctx.shadowColor = colors[0]; }
    ctx.fillRect(seg.x * GRID + 1, seg.y * GRID + 1, GRID - 2, GRID - 2);
    ctx.shadowBlur = 0;
  });
}

function draw() {
  if (gameOver) return;
  ctx.fillStyle = cosmetics.background || "#0a0a14";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  drawGrid();

  ctx.fillStyle = food.type === "coin" ? "#ffd700" : "#ff2244";
  ctx.beginPath();
  ctx.arc(food.x * GRID + GRID / 2, food.y * GRID + GRID / 2, GRID / 2.5, 0, Math.PI * 2);
  ctx.fill();

  powerups.forEach((p) => {
    const colors = { boost: "#00ff88", shield: "#0088ff", coin: "#ffd700" };
    ctx.fillStyle = colors[p.type];
    ctx.fillRect(p.x * GRID + 4, p.y * GRID + 4, GRID - 8, GRID - 8);
    p.life--;
  });
  powerups = powerups.filter((p) => p.life > 0);

  const [c1, c2] = getSkinColors();
  drawSnake(snake, [c1, c2], true);
  aiSnakes.forEach((ai) => drawSnake(ai.body, [ai.color, ai.color], false));
  if (bossSnake) drawSnake(bossSnake.body, ["#ff0044", "#aa0022"], true);

  if (shield) {
    ctx.strokeStyle = "rgba(0,136,255,0.5)";
    ctx.lineWidth = 3;
    ctx.strokeRect(snake[0].x * GRID, snake[0].y * GRID, GRID, GRID);
  }

  particles.forEach((p) => {
    ctx.fillStyle = p.color;
    ctx.globalAlpha = p.life / 30;
    ctx.fillRect(p.x, p.y, 4, 4);
    p.x += p.dx; p.y += p.dy; p.life--;
    ctx.globalAlpha = 1;
  });
  particles = particles.filter((p) => p.life > 0);

  if (bossSnake) {
    ctx.fillStyle = "#fff";
    ctx.font = "12px Orbitron";
    ctx.fillText(`BOSS HP: ${bossSnake.hp}`, 10, canvas.height - 10);
  }

  drawMinimap();
  moveSnake();
  frame++;
}

function drawMinimap() {
  miniCtx.fillStyle = "rgba(0,0,0,0.8)";
  miniCtx.fillRect(0, 0, 120, 120);
  const scale = 120 / TILES;
  miniCtx.fillStyle = "#ff2244";
  miniCtx.fillRect(food.x * scale, food.y * scale, 3, 3);
  miniCtx.fillStyle = getSkinColors()[0];
  snake.forEach((s) => miniCtx.fillRect(s.x * scale, s.y * scale, 2, 2));
  if (bossSnake) {
    miniCtx.fillStyle = "#ff0044";
    bossSnake.body.forEach((s) => miniCtx.fillRect(s.x * scale, s.y * scale, 2, 2));
  }
}

function endGame() {
  gameOver = true;
  const comboBonus = combo * 2;
  const finalScore = score + comboBonus;

  ctx.fillStyle = "rgba(0,0,0,0.85)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#00f7ff";
  ctx.font = "bold 42px Orbitron";
  ctx.textAlign = "center";
  ctx.fillText("GAME OVER", canvas.width / 2, canvas.height / 2 - 60);
  ctx.font = "20px Orbitron";
  ctx.fillStyle = "#fff";
  ctx.fillText(`Score: ${finalScore}  |  Coins: ${coins}`, canvas.width / 2, canvas.height / 2);
  ctx.fillText(`Combo Bonus: +${comboBonus}`, canvas.width / 2, canvas.height / 2 + 30);
  ctx.fillText("Press R to Restart", canvas.width / 2, canvas.height / 2 + 70);

  const rewards = GameBridge.endGame({ score: finalScore, won: score >= 30, kills: score, combo });
  if (rewards) {
    ctx.fillStyle = "#00ff88";
    ctx.fillText(`+${rewards.xp} XP  +${rewards.coins} Coins`, canvas.width / 2, canvas.height / 2 + 110);
  }
  AudioManager.play("gameOver");
}

function setDirection(dir) {
  if (dir === "up" && dy !== 1) { dx = 0; dy = -1; }
  if (dir === "down" && dy !== -1) { dx = 0; dy = 1; }
  if (dir === "left" && dx !== 1) { dx = -1; dy = 0; }
  if (dir === "right" && dx !== -1) { dx = 1; dy = 0; }
}
window.setDirection = setDirection;

document.addEventListener("keydown", (e) => {
  switch (e.key) {
    case "ArrowUp": case "w": case "W": setDirection("up"); break;
    case "ArrowDown": case "s": case "S": setDirection("down"); break;
    case "ArrowLeft": case "a": case "A": setDirection("left"); break;
    case "ArrowRight": case "d": case "D": setDirection("right"); break;
    case " ": boostActive = true; boostTimer = 50; break;
    case "r": case "R": if (gameOver) location.reload(); break;
  }
});

GameBridge.bindPauseKey(() => score);
GameBridge.createMobileControls({
  dpad: true,
  action: true,
  actionLabel: "⚡",
  onDirection: setDirection,
  onAction: () => { boostActive = true; boostTimer = 50; },
});

let interval = setInterval(draw, tickRate);
setInterval(() => {
  clearInterval(interval);
  interval = setInterval(draw, tickRate);
}, 5000);

if (frame % 200 === 0) spawnPowerup();
