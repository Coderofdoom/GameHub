const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const bridge = GameBridge.init("racer");
const cosmetics = GameBridge.getCosmetics();
AudioManager.init(bridge?.settings);

function resize() { canvas.width = window.innerWidth; canvas.height = window.innerHeight - 80; }
window.addEventListener("resize", resize);
resize();

const TRACKS = [
  { name: "Neon City", road: "#1a1a2e", line: "#00f7ff", sky: "#050816" },
  { name: "Desert Storm", road: "#3a2a1a", line: "#ffaa00", sky: "#2a1a0a" },
  { name: "Ice Highway", road: "#2a3a4a", line: "#88ddff", sky: "#0a1a2a" },
  { name: "Volcano Rush", road: "#2a1010", line: "#ff4400", sky: "#1a0505" },
];

const lanes = [0.2, 0.5, 0.8];
let frame = 0, score = 0, gameOver = false, trackIndex = 0;
let speedMultiplier = 1, nitro = 100, drifts = 0, driftCombo = 0;
let timeTrial = 0, bestTime = Infinity;
let particles = [];

const upgrades = { engine: 0, tires: 0, nitroCap: 0 };
const keys = {};

const SKIN_MAP = { skin_default: "#00f7ff", skin_neon: "#00ff88", skin_diamond: "#b9f2ff", skin_fire: "#ff4400", skin_cyber: "#c300ff" };
const carColor = SKIN_MAP[bridge?.equipped?.skin] || cosmetics.skin || "#00ff88";

const player = { lane: 1, x: 0, y: 0, w: 55, h: 100, targetX: 0, drifting: false };
const traffic = [];
const aiRacers = [];

document.addEventListener("keydown", (e) => {
  keys[e.key] = true;
  if (e.key === "ArrowLeft" && player.lane > 0) { player.lane--; checkDrift(); }
  if (e.key === "ArrowRight" && player.lane < 2) { player.lane++; checkDrift(); }
  if (e.key === "r" && gameOver) location.reload();
});
document.addEventListener("keyup", (e) => { keys[e.key] = false; player.drifting = false; });

function checkDrift() {
  if (keys["Shift"]) {
    drifts++;
    driftCombo++;
    GameBridge.emitEvent("drift");
    addParticles(player.x + player.w / 2, player.y + player.h, "#c300ff");
    document.getElementById("hud-drifts").textContent = drifts;
    score += 5 * driftCombo;
    AudioManager.play("shoot");
  }
}

function getLaneX(i) { return canvas.width * lanes[i] - player.w / 2; }

function spawnCar() {
  traffic.push({
    lane: Math.floor(Math.random() * 3),
    y: -200, w: 50 + Math.random() * 20, h: 90 + Math.random() * 30,
    color: `hsl(${Math.random() * 360}, 70%, 50%)`,
    speed: 4 + Math.random() * 3 + trackIndex,
  });
}

function spawnAI() {
  if (aiRacers.length >= 3) return;
  aiRacers.push({
    lane: Math.floor(Math.random() * 3),
    y: -300, w: 50, h: 90,
    speed: 5 + trackIndex * 0.5 + Math.random() * 2,
    color: "#ff00ff",
  });
}

function addParticles(x, y, color) {
  for (let i = 0; i < 5; i++) particles.push({ x, y, dx: (Math.random() - 0.5) * 4, dy: Math.random() * 3, life: 20, color });
}

function collide(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

function updatePlayer() {
  player.targetX = getLaneX(player.lane);
  player.x += (player.targetX - player.x) * (0.15 + upgrades.tires * 0.02);
  player.y = canvas.height - 160;

  if (keys["Shift"] && nitro > 0) {
    speedMultiplier = 3 + upgrades.engine * 0.3;
    nitro -= 1;
    player.drifting = true;
    if (frame % 5 === 0) addParticles(player.x + player.w / 2, player.y + player.h, carColor);
  } else {
    speedMultiplier = 1 + upgrades.engine * 0.1;
    nitro += 0.4 + upgrades.nitroCap * 0.1;
    if (nitro > 100 + upgrades.nitroCap * 20) nitro = 100 + upgrades.nitroCap * 20;
    driftCombo = 0;
  }
}

function updateTraffic() {
  if (!gameOver && frame % Math.max(20, 50 - trackIndex * 5) === 0) spawnCar();
  if (frame % 120 === 0) spawnAI();

  for (let i = traffic.length - 1; i >= 0; i--) {
    traffic[i].y += traffic[i].speed * speedMultiplier;
    if (traffic[i].y > canvas.height + 200) {
      traffic.splice(i, 1);
      score += 10 * speedMultiplier;
      document.getElementById("hud-score").textContent = Math.floor(score);
    }
  }

  for (let i = aiRacers.length - 1; i >= 0; i--) {
    const ai = aiRacers[i];
    ai.y += ai.speed * speedMultiplier;
    if (ai.y > canvas.height + 200) { aiRacers.splice(i, 1); continue; }

    const ax = getLaneX(ai.lane);
    if (collide(player, { x: ax, y: ai.y, w: ai.w, h: ai.h })) {
      if (speedMultiplier > 2) {
        aiRacers.splice(i, 1);
        score += 50;
        GameBridge.screenShake(6, 200);
        AudioManager.play("explosion");
      } else {
        gameOver = true;
        finishGame();
      }
    }
  }
}

function checkCrash() {
  const p = { x: player.x, y: player.y, w: player.w, h: player.h };
  for (const c of traffic) {
    const e = { x: getLaneX(c.lane), y: c.y, w: c.w, h: c.h };
    if (collide(p, e)) {
      if (bridge?.powerups?.shieldBooster > 0) {
        bridge.powerups.shieldBooster--;
        traffic.splice(traffic.indexOf(c), 1);
        return;
      }
      gameOver = true;
      finishGame();
    }
  }
}

function finishGame() {
  GameBridge.endGame({ score: Math.floor(score), won: score >= 500, kills: drifts, combo: driftCombo });
  AudioManager.play("gameOver");
}

function drawRoad() {
  const track = TRACKS[trackIndex % TRACKS.length];
  ctx.fillStyle = track.sky;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = track.road;
  ctx.fillRect(canvas.width * 0.08, 0, canvas.width * 0.84, canvas.height);

  ctx.strokeStyle = track.line;
  ctx.lineWidth = 3;
  ctx.setLineDash([30, 30]);
  ctx.lineDashOffset = -(frame * speedMultiplier * 2);

  for (let i = 1; i < 3; i++) {
    const x = canvas.width * (i / 3);
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, canvas.height);
    ctx.stroke();
  }
  ctx.setLineDash([]);
}

function drawCar(x, y, w, h, color, isPlayer) {
  ctx.fillStyle = color;
  if (isPlayer) { ctx.shadowBlur = 15; ctx.shadowColor = color; }
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = "rgba(0,0,0,0.5)";
  ctx.fillRect(x + 8, y + 15, w - 16, h * 0.3);
  ctx.shadowBlur = 0;

  if (isPlayer && cosmetics.trail && cosmetics.trail !== "transparent") {
    ctx.fillStyle = cosmetics.trail === "rainbow" ? `hsl(${frame * 5 % 360}, 100%, 60%)` : cosmetics.trail;
    ctx.globalAlpha = 0.5;
    ctx.fillRect(x + w / 2 - 3, y + h, 6, 20 + speedMultiplier * 5);
    ctx.globalAlpha = 1;
  }
}

function drawHUD() {
  const track = TRACKS[trackIndex % TRACKS.length];
  ctx.fillStyle = "#fff";
  ctx.font = "16px Orbitron";
  ctx.textAlign = "left";
  ctx.fillText(`Nitro: ${Math.floor(nitro)}%`, 20, 30);
  ctx.fillText(`Speed: x${speedMultiplier.toFixed(1)}`, 20, 55);
  ctx.fillText(`Time: ${(timeTrial / 60).toFixed(1)}s`, 20, 80);

  if (score > 0 && score % 500 < 10 && score > 100) {
    trackIndex++;
    document.getElementById("hud-track").textContent = TRACKS[trackIndex % TRACKS.length].name;
    upgrades.engine = Math.min(5, upgrades.engine + 1);
    UIManager?.toast?.("Track changed! Engine upgraded!", "success");
  }

  if (gameOver) {
    ctx.textAlign = "center";
    ctx.fillStyle = "rgba(0,0,0,0.8)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#00f7ff";
    ctx.font = "bold 50px Orbitron";
    ctx.fillText("CRASH!", canvas.width / 2, canvas.height / 2 - 30);
    ctx.font = "22px Orbitron";
    ctx.fillText(`Score: ${Math.floor(score)}  Drifts: ${drifts}`, canvas.width / 2, canvas.height / 2 + 20);
    ctx.fillText("Press R to Restart", canvas.width / 2, canvas.height / 2 + 60);
  }
}

function loop() {
  if (!gameOver && !GameBridge.isPaused()) {
    drawRoad();
    updatePlayer();
    updateTraffic();
    checkCrash();
    timeTrial++;

    traffic.forEach((c) => drawCar(getLaneX(c.lane), c.y, c.w, c.h, c.color, false));
    aiRacers.forEach((a) => drawCar(getLaneX(a.lane), a.y, a.w, a.h, a.color, false));
    drawCar(player.x, player.y, player.w, player.h, carColor, true);

    particles.forEach((p) => {
      ctx.fillStyle = p.color;
      ctx.globalAlpha = p.life / 20;
      ctx.fillRect(p.x, p.y, 4, 4);
      p.x += p.dx; p.y += p.dy; p.life--;
      ctx.globalAlpha = 1;
    });
    particles = particles.filter((p) => p.life > 0);

    frame++;
  } else if (gameOver) {
    drawRoad();
    drawCar(player.x, player.y, player.w, player.h, carColor, true);
  }
  drawHUD();
  requestAnimationFrame(loop);
}

GameBridge.bindPauseKey(() => Math.floor(score));
GameBridge.createMobileControls({
  dpad: true,
  action: true,
  actionLabel: "N",
  onDirection: (dir) => {
    if (dir === "left" && player.lane > 0) { player.lane--; checkDrift(); }
    if (dir === "right" && player.lane < 2) { player.lane++; checkDrift(); }
  },
  onAction: () => { keys["Shift"] = true; setTimeout(() => { keys["Shift"] = false; }, 200); },
});

loop();
