const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const bridge = GameBridge.init("platformer");
const cosmetics = GameBridge.getCosmetics();
AudioManager.init(bridge?.settings);

function resize() { canvas.width = window.innerWidth; canvas.height = window.innerHeight - 80; }
window.addEventListener("resize", resize);
resize();

const keys = {};
document.addEventListener("keydown", (e) => (keys[e.key] = true));
document.addEventListener("keyup", (e) => (keys[e.key] = false));

const BIOMES = [
  { name: "Forest", bg: "#1a2e1a", plat: "#4a7a4a", accent: "#00ff88" },
  { name: "Cave", bg: "#1a1a2e", plat: "#555577", accent: "#8888ff" },
  { name: "Volcano", bg: "#2e1a1a", plat: "#774444", accent: "#ff4400" },
  { name: "Sky", bg: "#1a2e3e", plat: "#6699bb", accent: "#00f7ff" },
];

let biomeIndex = 0, chapter = 1, score = 0, frame = 0, gameOver = false;
let combo = 0, kills = 0, checkpoint = { x: 100, y: 100 };
let particles = [], screenShake = 0;

const skillTree = { doubleJump: true, dash: true, wallJump: true };
const player = { x: 100, y: 100, w: 40, h: 40, vx: 0, vy: 0, onGround: false, onWall: 0, canDoubleJump: true, dashCooldown: 0, color: cosmetics.skin || "#00ff88" };

const camera = { x: 0 };
let platforms = [], coins = [], enemies = [], movingPlatforms = [], bosses = [];
let storyText = "Chapter 1: The Forest Awakens";
let bossActive = false;

function generateLevel() {
  platforms = []; coins = []; enemies = []; movingPlatforms = []; bosses = [];
  const biome = BIOMES[biomeIndex % BIOMES.length];
  let x = 0;

  for (let i = 0; i < 60; i++) {
    const w = 100 + Math.random() * 180;
    const y = 250 + Math.random() * (canvas.height - 350);
    platforms.push({ x, y, w, h: 20, biome: biomeIndex });

    if (Math.random() < 0.3) {
      movingPlatforms.push({ x: x + w / 2, y: y - 80, w: 80, h: 15, startX: x + w / 2, range: 100, speed: 1.5, dir: 1 });
    }

    if (Math.random() < 0.4) {
      coins.push({ x: x + w / 2, y: y - 35, r: 10, taken: false, type: Math.random() < 0.1 ? "powerup" : "coin" });
    }

    if (Math.random() < 0.12) {
      enemies.push({ x: x + w / 2, y: y - 45, w: 35, h: 35, dir: 1, speed: 1.5 + biomeIndex * 0.3, hp: 1 });
    }

    x += w + 50 + Math.random() * 40;
  }

  if (chapter % 2 === 0) {
    bosses.push({ x: x - 100, y: 200, w: 80, h: 80, hp: 5 + chapter, maxHp: 5 + chapter, phase: 0 });
    bossActive = true;
    storyText = `Boss Battle: ${biome.name} Guardian`;
  } else {
    bossActive = false;
    storyText = `Chapter ${chapter}: Explore the ${biome.name}`;
  }

  document.getElementById("hud-biome").textContent = biome.name;
  document.getElementById("hud-story").textContent = `Ch ${chapter}`;
}

generateLevel();

function collide(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

function addParticles(x, y, color, n = 10) {
  for (let i = 0; i < n; i++) particles.push({ x, y, dx: (Math.random() - 0.5) * 6, dy: (Math.random() - 0.5) * 6, life: 25, color });
}

function updatePlayer() {
  if (gameOver || GameBridge.isPaused()) return;

  player.vx = 0;
  if (keys["ArrowLeft"] || keys["a"]) player.vx = -6;
  if (keys["ArrowRight"] || keys["d"]) player.vx = 6;

  player.vy += 0.7;
  player.x += player.vx;
  player.y += player.vy;
  player.onGround = false;
  player.onWall = 0;

  const allPlats = [...platforms, ...movingPlatforms.map((m) => ({ x: m.x, y: m.y, w: m.w, h: m.h }))];

  for (const p of allPlats) {
    if (collide(player, p)) {
      if (player.vy > 0 && player.y + player.h - player.vy <= p.y + 5) {
        player.y = p.y - player.h;
        player.vy = 0;
        player.onGround = true;
        player.canDoubleJump = true;
      } else if (player.vx > 0 && player.x + player.w - player.vx <= p.x + 5) {
        player.onWall = 1;
      } else if (player.vx < 0 && player.x - player.vx >= p.x + p.w - 5) {
        player.onWall = -1;
      }
    }
  }

  if ((keys[" "] || keys["ArrowUp"] || keys["w"]) && player.onGround) {
    player.vy = -14;
    player.onGround = false;
    player.canDoubleJump = true;
  }

  if ((keys[" "] || keys["ArrowUp"] || keys["w"]) && !player.onGround && player.canDoubleJump && skillTree.doubleJump) {
    player.vy = -13;
    player.canDoubleJump = false;
    addParticles(player.x + player.w / 2, player.y + player.h, "#00f7ff", 5);
  }

  if (skillTree.wallJump && player.onWall && (keys[" "] || keys["w"])) {
    player.vy = -13;
    player.vx = player.onWall * -8;
    addParticles(player.x, player.y + player.h / 2, "#c300ff", 5);
  }

  if (player.dashCooldown > 0) player.dashCooldown--;
  if ((keys["Shift"] || keys["x"]) && skillTree.dash && player.dashCooldown === 0) {
    player.vx = (keys["ArrowLeft"] || keys["a"]) ? -18 : 18;
    player.dashCooldown = 45;
    addParticles(player.x, player.y + player.h / 2, cosmetics.skin, 8);
    AudioManager.play("shoot");
  }

  if (player.y > canvas.height + 200) {
    player.x = checkpoint.x;
    player.y = checkpoint.y;
    player.vx = 0;
    player.vy = 0;
    score = Math.max(0, score - 20);
    screenShake = 8;
  }
}

function updateMovingPlatforms() {
  movingPlatforms.forEach((m) => {
    m.x += m.speed * m.dir;
    if (m.x > m.startX + m.range || m.x < m.startX - m.range) m.dir *= -1;
  });
}

function updateEnemies() {
  enemies.forEach((e, idx) => {
    e.x += e.speed * e.dir;
    const plat = platforms.find((p) => e.x > p.x && e.x < p.x + p.w && Math.abs(e.y + e.h - p.y) < 10);
    if (!plat) e.dir *= -1;

    if (collide(player, e)) {
      if (player.vy > 0 && player.y + player.h - 5 < e.y) {
        e.hp--;
        player.vy = -10;
        score += 15;
        combo++;
        kills++;
        addParticles(e.x + e.w / 2, e.y, "#ff0044");
        GameBridge.screenShake(4, 150);
        if (e.hp <= 0) enemies.splice(idx, 1);
        AudioManager.play("hit");
      } else {
        gameOver = true;
        finishGame();
      }
    }
  });
}

function updateBosses() {
  bosses.forEach((b, idx) => {
    b.phase++;
    b.x += Math.sin(b.phase * 0.02) * 2;
    if (b.phase % 90 === 0) enemies.push({ x: b.x, y: b.y + b.h, w: 30, h: 30, dir: 1, speed: 3, hp: 1 });

    if (collide(player, b)) {
      if (player.vy > 0) {
        b.hp--;
        player.vy = -12;
        score += 30;
        addParticles(b.x + b.w / 2, b.y, "#ff4400", 15);
        GameBridge.screenShake(6, 200);
        if (b.hp <= 0) {
          bosses.splice(idx, 1);
          score += 100;
          GameBridge.emitEvent("boss");
          chapter++;
          biomeIndex++;
          checkpoint = { x: player.x, y: player.y };
          generateLevel();
          AudioManager.play("levelUp");
        }
      } else {
        gameOver = true;
        finishGame();
      }
    }
  });
}

function updateCoins() {
  coins.forEach((c) => {
    if (!c.taken && Math.hypot(player.x + player.w / 2 - c.x, player.y + player.h / 2 - c.y) < 35) {
      c.taken = true;
      if (c.type === "powerup") { score += 25; player.dashCooldown = 0; }
      else { score += 10; combo++; }
      addParticles(c.x, c.y, "#ffd700");
      document.getElementById("hud-score").textContent = score;
      AudioManager.play("coin");
    }
  });

  if (player.x > platforms[platforms.length - 1]?.x + 200) {
    chapter++;
    biomeIndex++;
    checkpoint = { x: 100, y: 100 };
    player.x = 100;
    player.y = 100;
    generateLevel();
  }
}

function updateCamera() { camera.x = player.x - canvas.width / 3; }

function finishGame() {
  GameBridge.endGame({ score, won: kills >= 5, kills, combo });
  AudioManager.play("gameOver");
}

document.addEventListener("keydown", (e) => {
  if (e.key === "r" && gameOver) location.reload();
});

function draw() {
  const biome = BIOMES[biomeIndex % BIOMES.length];
  ctx.fillStyle = biome.bg;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  if (screenShake > 0) { ctx.save(); ctx.translate((Math.random() - 0.5) * screenShake, 0); screenShake *= 0.85; }

  ctx.save();
  ctx.translate(-camera.x, 0);

  platforms.forEach((p) => {
    ctx.fillStyle = BIOMES[p.biome % BIOMES.length]?.plat || biome.plat;
    ctx.fillRect(p.x, p.y, p.w, p.h);
  });

  movingPlatforms.forEach((m) => {
    ctx.fillStyle = biome.accent;
    ctx.globalAlpha = 0.7;
    ctx.fillRect(m.x, m.y, m.w, m.h);
    ctx.globalAlpha = 1;
  });

  coins.forEach((c) => {
    if (!c.taken) {
      ctx.fillStyle = c.type === "powerup" ? biome.accent : "#ffd700";
      ctx.beginPath();
      ctx.arc(c.x, c.y, c.r, 0, Math.PI * 2);
      ctx.fill();
    }
  });

  enemies.forEach((e) => { ctx.fillStyle = "#ff2244"; ctx.fillRect(e.x, e.y, e.w, e.h); });

  bosses.forEach((b) => {
    ctx.fillStyle = "#ff4400";
    ctx.shadowBlur = 20;
    ctx.shadowColor = "#ff4400";
    ctx.fillRect(b.x, b.y, b.w, b.h);
    ctx.shadowBlur = 0;
    ctx.fillStyle = "#fff";
    ctx.font = "12px Orbitron";
    ctx.fillText(`BOSS ${b.hp}/${b.maxHp}`, b.x, b.y - 8);
  });

  ctx.fillStyle = player.color;
  ctx.fillRect(player.x, player.y, player.w, player.h);

  particles.forEach((p) => {
    ctx.fillStyle = p.color;
    ctx.globalAlpha = p.life / 25;
    ctx.fillRect(p.x, p.y, 4, 4);
    ctx.globalAlpha = 1;
    p.x += p.dx; p.y += p.dy; p.life--;
  });
  particles = particles.filter((p) => p.life > 0);

  ctx.restore();
  if (screenShake > 0) ctx.restore();

  ctx.fillStyle = "#fff";
  ctx.font = "14px Orbitron";
  ctx.textAlign = "left";
  ctx.fillText(storyText, 20, 25);
  ctx.fillText(`[Space] Jump  [Shift] Dash  [Wall Jump enabled]`, 20, canvas.height - 15);

  if (gameOver) {
    ctx.fillStyle = "rgba(0,0,0,0.8)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.textAlign = "center";
    ctx.fillStyle = "#00f7ff";
    ctx.font = "bold 48px Orbitron";
    ctx.fillText("GAME OVER", canvas.width / 2, canvas.height / 2);
    ctx.font = "20px Orbitron";
    ctx.fillText(`Score: ${score}  Press R`, canvas.width / 2, canvas.height / 2 + 40);
  }
}

function loop() {
  if (!gameOver && !GameBridge.isPaused()) {
    updatePlayer();
    updateMovingPlatforms();
    updateEnemies();
    updateBosses();
    updateCoins();
    updateCamera();
  }
  draw();
  frame++;
  requestAnimationFrame(loop);
}

GameBridge.bindPauseKey(() => score);
GameBridge.createMobileControls({
  dpad: true,
  action: true,
  actionLabel: "⬆",
  onDirection: (dir) => {
    if (dir === "left") keys["ArrowLeft"] = true;
    if (dir === "right") keys["ArrowRight"] = true;
    if (dir === "up") { keys[" "] = true; setTimeout(() => { keys[" "] = false; }, 100); }
    setTimeout(() => { keys["ArrowLeft"] = false; keys["ArrowRight"] = false; }, 100);
  },
  onAction: () => { keys["Shift"] = true; setTimeout(() => { keys["Shift"] = false; }, 100); },
});

loop();
