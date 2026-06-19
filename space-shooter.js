const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const scoreEl = document.getElementById("score");
const waveEl = document.getElementById("wave");
const comboEl = document.getElementById("combo");
const weaponEl = document.getElementById("weapon");

const bridge = GameBridge.init("shooter");
const cosmetics = GameBridge.getCosmetics();
AudioManager.init(bridge?.settings);

let score = 0, frame = 0, gameOver = false, combo = 0, comboTimer = 0;
let wave = 1, waveTimer = 0, kills = 0;
let screenShake = 0;

const keys = {};
const bullets = [], enemies = [], particles = [], stars = [], powerups = [], rockets = [];

const WEAPONS = {
  laser: { name: "Laser", dmg: 1, rate: 8, color: "#00ff88", speed: 14, spread: 0 },
  plasma: { name: "Plasma", dmg: 2, rate: 14, color: "#c300ff", speed: 10, spread: 0 },
  rocket: { name: "Rocket", dmg: 5, rate: 30, color: "#ff4400", speed: 8, spread: 0, explosive: true },
};

const skillTree = { dmg: 0, rate: 0, speed: 0, shield: 0 };
let currentWeapon = "laser";
let shootCooldown = 0;

const player = {
  x: 0, y: 0, width: 50, height: 50, speed: 7, lives: 5, maxLives: 5, shield: false,
};

let boss = null;

function resizeCanvas() {
  canvas.width = Math.min(window.innerWidth * 0.95, 1200);
  canvas.height = Math.min(window.innerHeight * 0.75, 700);
  player.x = canvas.width / 2 - 25;
  player.y = canvas.height - 80;
}
resizeCanvas();
window.addEventListener("resize", resizeCanvas);

for (let i = 0; i < 200; i++) {
  stars.push({ x: Math.random() * 1200, y: Math.random() * 700, size: Math.random() * 3, speed: 1 + Math.random() * 3 });
}

function drawStars() {
  stars.forEach((star) => {
    star.y += star.speed;
    if (star.y > canvas.height) { star.y = 0; star.x = Math.random() * canvas.width; }
    ctx.fillStyle = "#00ffff";
    ctx.fillRect(star.x, star.y, star.size, star.size);
  });
}

document.addEventListener("keydown", (e) => {
  keys[e.key] = true;
  if (e.key === " ") shoot();
  if (e.key === "1") currentWeapon = "laser";
  if (e.key === "2") currentWeapon = "plasma";
  if (e.key === "3") currentWeapon = "rocket";
  if (e.key === "Tab") { e.preventDefault(); upgradeSkill(); }
  if (gameOver && (e.key === "r" || e.key === "R")) location.reload();
});
document.addEventListener("keyup", (e) => { keys[e.key] = false; });

function shoot() {
  if (gameOver || shootCooldown > 0) return;
  const w = WEAPONS[currentWeapon];
  shootCooldown = Math.max(4, w.rate - skillTree.rate * 2);
  weaponEl.textContent = w.name;

  if (currentWeapon === "rocket") {
    rockets.push({ x: player.x + player.width / 2 - 5, y: player.y, vx: 0, vy: -w.speed, dmg: w.dmg + skillTree.dmg, life: 120 });
  } else {
    bullets.push({
      x: player.x + player.width / 2 - 3, y: player.y,
      width: 6, height: 16, speed: w.speed + skillTree.speed,
      dmg: w.dmg + skillTree.dmg, color: w.color,
    });
  }
  AudioManager.play("shoot");
}

function upgradeSkill() {
  const options = ["dmg", "rate", "speed", "shield"];
  const pick = options[Math.floor(Math.random() * options.length)];
  if (skillTree[pick] < 5) skillTree[pick]++;
  if (pick === "shield") { player.shield = true; setTimeout(() => { player.shield = false; }, 5000); }
}

function spawnEnemy() {
  const isBossWave = wave % 5 === 0 && !boss;
  if (isBossWave) {
    boss = { x: canvas.width / 2 - 60, y: -120, width: 120, height: 80, hp: 20 + wave * 5, maxHp: 20 + wave * 5, phase: 0 };
    return;
  }
  enemies.push({
    x: Math.random() * (canvas.width - 50), y: -60,
    width: 40 + Math.random() * 20, height: 40 + Math.random() * 20,
    speed: 2 + Math.random() * 3 + wave * 0.3, hp: 1 + Math.floor(wave / 3),
  });
}

function spawnPowerup(x, y) {
  if (Math.random() > 0.3) return;
  const types = ["life", "weapon_plasma", "weapon_rocket", "skill"];
  powerups.push({ x, y, type: types[Math.floor(Math.random() * types.length)], life: 300 });
}

function collide(a, b) {
  return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
}

function createExplosion(x, y, count = 20) {
  for (let i = 0; i < count; i++) {
    particles.push({ x, y, dx: (Math.random() - 0.5) * 8, dy: (Math.random() - 0.5) * 8, life: 40, color: `hsl(${Math.random() * 60 + 160}, 100%, 60%)` });
  }
  screenShake = 5;
  AudioManager.play("explosion");
}

function updatePlayer() {
  if (keys["ArrowLeft"] || keys["a"]) player.x -= player.speed;
  if (keys["ArrowRight"] || keys["d"]) player.x += player.speed;
  if (keys["ArrowUp"] || keys["w"]) player.y -= player.speed;
  if (keys["ArrowDown"] || keys["s"]) player.y += player.speed;
  player.x = Math.max(0, Math.min(canvas.width - player.width, player.x));
  player.y = Math.max(0, Math.min(canvas.height - player.height, player.y));
  if (shootCooldown > 0) shootCooldown--;
  if (keys[" "] && shootCooldown <= 0) shoot();
}

function damageEnemy(enemy, dmg, idx) {
  enemy.hp -= dmg;
  if (enemy.hp <= 0) {
    createExplosion(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2);
    if (idx >= 0) enemies.splice(idx, 1);
    score += 10 * (combo + 1);
    combo++; comboTimer = 90;
    kills++;
    scoreEl.textContent = score;
    comboEl.textContent = combo;
    spawnPowerup(enemy.x, enemy.y);
    return true;
  }
  return false;
}

function updateBullets() {
  for (let i = bullets.length - 1; i >= 0; i--) {
    bullets[i].y -= bullets[i].speed;
    if (bullets[i].y < -20) { bullets.splice(i, 1); continue; }

    if (boss && collide(bullets[i], boss)) {
      if (damageEnemy(boss, bullets[i].dmg, -1)) {
        score += 100; kills += 5;
        GameBridge.emitEvent("boss");
        boss = null;
        wave++;
        waveEl.textContent = wave;
      }
      bullets.splice(i, 1);
      continue;
    }

    for (let j = enemies.length - 1; j >= 0; j--) {
      if (collide(bullets[i], enemies[j])) {
        damageEnemy(enemies[j], bullets[i].dmg, j);
        bullets.splice(i, 1);
        break;
      }
    }
  }

  for (let i = rockets.length - 1; i >= 0; i--) {
    rockets[i].y += rockets[i].vy;
    rockets[i].life--;
    if (rockets[i].life <= 0) { rockets.splice(i, 1); continue; }

    let hit = false;
    if (boss && Math.hypot(rockets[i].x - boss.x, rockets[i].y - boss.y) < 80) {
      damageEnemy(boss, rockets[i].dmg * 2, -1);
      createExplosion(rockets[i].x, rockets[i].y, 30);
      hit = true;
    }
    enemies.forEach((e, j) => {
      if (Math.hypot(rockets[i].x - e.x, rockets[i].y - e.y) < 60) {
        damageEnemy(e, rockets[i].dmg * 2, j);
        hit = true;
      }
    });
    if (hit) rockets.splice(i, 1);
  }
}

function updateEnemies() {
  const spawnRate = boss ? 999 : Math.max(15, 45 - wave * 3);
  if (frame % spawnRate === 0) spawnEnemy();

  if (boss) {
    boss.y = Math.min(boss.y + 1, 80);
    boss.phase++;
    if (boss.phase % 60 === 0) {
      enemies.push({ x: boss.x + Math.random() * boss.width, y: boss.y + boss.height, width: 30, height: 30, speed: 4, hp: 1 });
    }
  }

  for (let i = enemies.length - 1; i >= 0; i--) {
    enemies[i].y += enemies[i].speed;
    if (enemies[i].y > canvas.height) { enemies.splice(i, 1); continue; }

    if (collide(player, enemies[i])) {
      createExplosion(enemies[i].x, enemies[i].y);
      enemies.splice(i, 1);
      if (!player.shield) {
        player.lives--;
        GameBridge.screenShake(10, 300);
        if (player.lives <= 0) endGame();
      }
    }
  }

  waveTimer++;
  if (waveTimer > 1800 && !boss) { wave++; waveTimer = 0; waveEl.textContent = wave; }
}

function updatePowerups() {
  for (let i = powerups.length - 1; i >= 0; i--) {
    powerups[i].y += 2;
    powerups[i].life--;
    if (powerups[i].life <= 0) { powerups.splice(i, 1); continue; }
    if (collide(player, { x: powerups[i].x, y: powerups[i].y, width: 20, height: 20 })) {
      const p = powerups[i];
      if (p.type === "life") player.lives = Math.min(player.maxLives, player.lives + 1);
      if (p.type === "weapon_plasma") currentWeapon = "plasma";
      if (p.type === "weapon_rocket") currentWeapon = "rocket";
      if (p.type === "skill") upgradeSkill();
      AudioManager.play("powerup");
      powerups.splice(i, 1);
    }
  }
}

function updateParticles() {
  for (let i = particles.length - 1; i >= 0; i--) {
    particles[i].x += particles[i].dx;
    particles[i].y += particles[i].dy;
    particles[i].life--;
    if (particles[i].life <= 0) particles.splice(i, 1);
  }
  if (comboTimer > 0) { comboTimer--; if (comboTimer <= 0) { combo = 0; comboEl.textContent = 0; } }
}

function drawPlayer() {
  ctx.save();
  ctx.shadowBlur = 25;
  ctx.shadowColor = cosmetics.skin || "#00ffff";
  ctx.fillStyle = cosmetics.skin || "#00ffff";
  ctx.beginPath();
  ctx.moveTo(player.x + player.width / 2, player.y);
  ctx.lineTo(player.x, player.y + player.height);
  ctx.lineTo(player.x + player.width, player.y + player.height);
  ctx.closePath();
  ctx.fill();
  if (player.shield) {
    ctx.strokeStyle = "rgba(0,255,255,0.5)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(player.x + player.width / 2, player.y + player.height / 2, 35, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();
}

function drawBoss() {
  if (!boss) return;
  ctx.fillStyle = "#ff0044";
  ctx.shadowBlur = 30;
  ctx.shadowColor = "#ff0044";
  ctx.fillRect(boss.x, boss.y, boss.width, boss.height);
  ctx.shadowBlur = 0;
  ctx.fillStyle = "#fff";
  ctx.font = "14px Orbitron";
  ctx.fillText(`BOSS ${boss.hp}/${boss.maxHp}`, boss.x, boss.y - 10);
}

function drawHUD() {
  ctx.fillStyle = "#fff";
  ctx.font = "16px Orbitron";
  ctx.textAlign = "left";
  ctx.fillText(`Lives: ${"❤".repeat(player.lives)}`, 20, canvas.height - 60);
  ctx.fillText(`Skills: DMG${skillTree.dmg} RATE${skillTree.rate} SPD${skillTree.speed}`, 20, canvas.height - 35);
  ctx.fillText("[1]Laser [2]Plasma [3]Rocket [Tab]Upgrade", 20, canvas.height - 10);
}

function endGame() {
  gameOver = true;
  const rewards = GameBridge.endGame({ score, won: score >= 200, kills, combo });
  GameBridge.updatePauseScore(score);
}

function drawGameOver() {
  ctx.fillStyle = "rgba(0,0,0,0.85)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.textAlign = "center";
  ctx.fillStyle = "#00ffff";
  ctx.font = "bold 60px Orbitron";
  ctx.fillText("GAME OVER", canvas.width / 2, canvas.height / 2 - 40);
  ctx.font = "28px Orbitron";
  ctx.fillText(`Score: ${score}  Wave: ${wave}  Kills: ${kills}`, canvas.width / 2, canvas.height / 2 + 20);
  ctx.fillText("Press R To Restart", canvas.width / 2, canvas.height / 2 + 70);
}

function gameLoop() {
  if (screenShake > 0) {
    ctx.save();
    ctx.translate((Math.random() - 0.5) * screenShake, (Math.random() - 0.5) * screenShake);
    screenShake *= 0.9;
  }

  ctx.fillStyle = cosmetics.background || "#03060d";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  drawStars();

  if (!gameOver && !GameBridge.isPaused()) {
    updatePlayer();
    updateBullets();
    updateEnemies();
    updatePowerups();
    updateParticles();

    bullets.forEach((b) => {
      ctx.fillStyle = b.color;
      ctx.shadowBlur = 15;
      ctx.shadowColor = b.color;
      ctx.fillRect(b.x, b.y, b.width, b.height);
      ctx.shadowBlur = 0;
    });

    rockets.forEach((r) => {
      ctx.fillStyle = "#ff4400";
      ctx.fillRect(r.x - 3, r.y, 10, 20);
    });

    enemies.forEach((e) => {
      ctx.fillStyle = "#ff00ff";
      ctx.shadowBlur = 15;
      ctx.shadowColor = "#ff00ff";
      ctx.fillRect(e.x, e.y, e.width, e.height);
      ctx.shadowBlur = 0;
    });

    powerups.forEach((p) => {
      ctx.fillStyle = "#ffd700";
      ctx.fillRect(p.x, p.y, 20, 20);
    });

    particles.forEach((p) => {
      ctx.fillStyle = p.color;
      ctx.globalAlpha = p.life / 40;
      ctx.fillRect(p.x, p.y, 4, 4);
      ctx.globalAlpha = 1;
    });

    drawBoss();
    drawPlayer();
    drawHUD();
    frame++;
  } else if (gameOver) {
    drawGameOver();
  }

  if (screenShake > 0) ctx.restore();
  requestAnimationFrame(gameLoop);
}

GameBridge.bindPauseKey(() => score);
GameBridge.createMobileControls({
  dpad: true,
  action: true,
  actionLabel: "🔫",
  onDirection: (dir) => {
    if (dir === "left") player.x -= 20;
    if (dir === "right") player.x += 20;
    if (dir === "up") player.y -= 20;
    if (dir === "down") player.y += 20;
  },
  onAction: shoot,
});

gameLoop();
