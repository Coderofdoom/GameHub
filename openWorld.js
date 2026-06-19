const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
canvas.width = innerWidth;
canvas.height = innerHeight - 80;

const bridge = GameBridge.init("zombie");
AudioManager.init(bridge?.settings);

const state = { scene: "menu", inventoryOpen: false, shopOpen: false };
const keys = {};
const mouse = { x: 0, y: 0, down: false };

document.addEventListener("keydown", (e) => (keys[e.key.toLowerCase()] = true));
document.addEventListener("keyup", (e) => (keys[e.key.toLowerCase()] = false));
canvas.addEventListener("mousemove", (e) => { mouse.x = e.clientX; mouse.y = e.clientY - 80; });
canvas.addEventListener("mousedown", () => (mouse.down = true));
canvas.addEventListener("mouseup", () => (mouse.down = false));

const world = { size: 4000, camX: 0, camY: 0, time: 0, dayLength: 3600 };

const player = {
  x: 2000, y: 2000, size: 28, speed: 4, hp: 100, maxHp: 100,
  weapon: "pistol", fireRate: 12, dmg: 1, kills: 0, score: 0,
};

const inventory = [
  { id: "pistol", name: "Pistol", type: "weapon", qty: 1 },
  { id: "bandage", name: "Bandage", type: "consumable", qty: 3 },
  { id: "wood", name: "Wood", type: "material", qty: 0 },
  { id: "iron", name: "Iron", type: "material", qty: 0 },
];

const weapons = {
  pistol: { dmg: 1, rate: 12, price: 0, color: "#ffff00" },
  shotgun: { dmg: 4, rate: 30, price: 60, color: "#ff8800" },
  rifle: { dmg: 2, rate: 6, price: 120, color: "#00ff88" },
  sniper: { dmg: 8, rate: 45, price: 200, color: "#c300ff" },
};

const recipes = [
  { id: "bandage", name: "Bandage", ingredients: { wood: 2 }, result: { id: "bandage", qty: 1 } },
  { id: "ammo", name: "Ammo Pack", ingredients: { iron: 3, wood: 1 }, result: { id: "ammo", qty: 5 } },
];

const shopItems = [
  { name: "shotgun", type: "weapon", price: 60 },
  { name: "rifle", type: "weapon", price: 120 },
  { name: "sniper", type: "weapon", price: 200 },
  { name: "damage +1", type: "upgrade", price: 80 },
  { name: "heal full", type: "heal", price: 50 },
  { name: "bandage x3", type: "item", price: 30 },
];

const zombies = [], bullets = [], loot = [], npcs = [], particles = [];
let boss = null, frame = 0, combo = 0, comboTimer = 0;
let money = 100;

const quests = [
  { id: "q1", text: "Kill 10 zombies", target: 10, progress: 0, reward: 100, done: false },
  { id: "q2", text: "Find the Survivor NPC", target: 1, progress: 0, reward: 150, done: false },
  { id: "q3", text: "Defeat the Boss Zombie", target: 1, progress: 0, reward: 300, done: false },
];
let activeQuest = 0;

npcs.push({ x: 800, y: 800, name: "Survivor", dialog: "Help us! Kill the boss to the north!", talked: false });
npcs.push({ x: 3200, y: 3200, name: "Trader", dialog: "Press B for shop. Craft with C.", talked: false });

function dist(a, b) { return Math.hypot(a.x - b.x, a.y - b.y); }

function spawnZombie(isBoss = false) {
  if (isBoss && !boss) {
    boss = { x: 2000, y: 500, size: 60, hp: 30, maxHp: 30, speed: 1.5, isBoss: true };
    return;
  }
  zombies.push({
    x: player.x + (Math.random() - 0.5) * 800,
    y: player.y + (Math.random() - 0.5) * 800,
    size: 28 + Math.floor(world.time / 1000),
    hp: 2 + Math.floor(frame / 3600),
    speed: 1 + Math.random() * 1.5,
  });
}

function shoot() {
  const w = weapons[player.weapon];
  const angle = Math.atan2(mouse.y + world.camY - (canvas.height / 2), mouse.x + world.camX - (canvas.width / 2));
  bullets.push({
    x: player.x, y: player.y,
    vx: Math.cos(angle) * 12, vy: Math.sin(angle) * 12,
    dmg: player.dmg * w.dmg, color: w.color,
  });
  AudioManager.play("shoot");
}

function addLoot(x, y, item) {
  loot.push({ x, y, item, life: 600 });
}

function addInvItem(id, qty = 1) {
  const existing = inventory.find((i) => i.id === id);
  if (existing) existing.qty += qty;
  else inventory.push({ id, name: id, type: "item", qty });
}

function craft(recipe) {
  for (const [mat, amt] of Object.entries(recipe.ingredients)) {
    const inv = inventory.find((i) => i.id === mat);
    if (!inv || inv.qty < amt) return false;
  }
  for (const [mat, amt] of Object.entries(recipe.ingredients)) {
    inventory.find((i) => i.id === mat).qty -= amt;
  }
  addInvItem(recipe.result.id, recipe.result.qty);
  return true;
}

function updateHUD() {
  document.getElementById("hud-hp").textContent = Math.floor(player.hp);
  document.getElementById("hud-kills").textContent = player.kills;
  const q = quests[activeQuest];
  document.getElementById("hud-quest").textContent = q && !q.done ? q.text : "Complete!";
}

function updateQuests() {
  const q = quests[activeQuest];
  if (!q || q.done) return;
  if (q.id === "q1") q.progress = player.kills;
  if (q.progress >= q.target) {
    q.done = true;
    money += q.reward;
    player.score += q.reward;
    if (q.id === "q3") GameBridge.emitEvent("quest");
    if (activeQuest < quests.length - 1) activeQuest++;
    else GameBridge.emitEvent("quest");
    AudioManager.play("achievement");
  }
}

function update() {
  if (state.scene !== "game" || GameBridge.isPaused()) return;

  if (keys["w"]) player.y -= player.speed;
  if (keys["s"]) player.y += player.speed;
  if (keys["a"]) player.x -= player.speed;
  if (keys["d"]) player.x += player.speed;
  player.x = Math.max(0, Math.min(world.size, player.x));
  player.y = Math.max(0, Math.min(world.size, player.y));

  if (mouse.down && frame % player.fireRate === 0) shoot();
  if (keys["b"]) state.shopOpen = !state.shopOpen;
  if (keys["i"]) state.inventoryOpen = !state.inventoryOpen;
  if (keys["c"]) { if (craft(recipes[0])) AudioManager.play("powerup"); }
  if (keys["1"]) player.weapon = "pistol";
  if (keys["2"] && inventory.some((i) => i.id === "shotgun")) player.weapon = "shotgun";
  if (keys["3"] && inventory.some((i) => i.id === "rifle")) player.weapon = "rifle";
  if (keys["4"]) { const b = inventory.find((i) => i.id === "bandage"); if (b && b.qty > 0) { b.qty--; player.hp = Math.min(player.maxHp, player.hp + 30); } }

  world.time++;
  world.camX = player.x - canvas.width / 2;
  world.camY = player.y - canvas.height / 2;

  if (frame % 45 === 0) spawnZombie();
  if (player.kills >= 25 && !boss) spawnZombie(true);

  for (let i = zombies.length - 1; i >= 0; i--) {
    const z = zombies[i];
    const d = Math.max(1, dist(z, player));
    z.x += ((player.x - z.x) / d) * z.speed;
    z.y += ((player.y - z.y) / d) * z.speed;

    if (dist(z, player) < z.size) player.hp -= 0.4;

    for (let j = bullets.length - 1; j >= 0; j--) {
      if (dist(z, bullets[j]) < z.size) {
        z.hp -= bullets[j].dmg;
        bullets.splice(j, 1);
        if (z.hp <= 0) {
          zombies.splice(i, 1);
          player.kills++;
          combo++;
          comboTimer = 60;
          player.score += 10 * combo;
          money += 10;
          addLoot(z.x, z.y, Math.random() < 0.3 ? "iron" : "wood");
          if (Math.random() < 0.1) addLoot(z.x, z.y, "bandage");
          GameBridge.screenShake(3, 100);
          AudioManager.play("hit");
          updateQuests();
        }
        break;
      }
    }
  }

  if (boss) {
    const d = Math.max(1, dist(boss, player));
    boss.x += ((player.x - boss.x) / d) * boss.speed;
    boss.y += ((player.y - boss.y) / d) * boss.speed;
    if (dist(boss, player) < boss.size) player.hp -= 1;

    for (let j = bullets.length - 1; j >= 0; j--) {
      if (dist(boss, bullets[j]) < boss.size) {
        boss.hp -= bullets[j].dmg;
        bullets.splice(j, 1);
        if (boss.hp <= 0) {
          player.kills += 5;
          player.score += 200;
          money += 100;
          boss = null;
          quests[2].progress = 1;
          updateQuests();
          GameBridge.emitEvent("boss");
          GameBridge.screenShake(10, 400);
          AudioManager.play("explosion");
        }
      }
    }
  }

  for (let i = bullets.length - 1; i >= 0; i--) {
    bullets[i].x += bullets[i].vx;
    bullets[i].y += bullets[i].vy;
    if (bullets[i].x < 0 || bullets[i].y < 0 || bullets[i].x > world.size || bullets[i].y > world.size) bullets.splice(i, 1);
  }

  for (let i = loot.length - 1; i >= 0; i--) {
    loot[i].life--;
    if (loot[i].life <= 0) { loot.splice(i, 1); continue; }
    if (dist(loot[i], player) < 30) {
      addInvItem(loot[i].item);
      loot.splice(i, 1);
      AudioManager.play("coin");
    }
  }

  npcs.forEach((npc) => {
    if (dist(npc, player) < 50 && keys["e"]) {
      npc.talked = true;
      if (npc.name === "Survivor") quests[1].progress = 1;
      updateQuests();
    }
  });

  if (comboTimer > 0) { comboTimer--; if (comboTimer <= 0) combo = 0; }
  if (player.hp <= 0) { state.scene = "dead"; GameBridge.endGame({ score: player.score, won: false, kills: player.kills, combo }); }

  updateHUD();
  frame++;
}

function drawMenu() {
  ctx.fillStyle = "#0a0a14";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#00f7ff";
  ctx.font = "bold 36px Orbitron";
  ctx.textAlign = "center";
  ctx.fillText("ZOMBIE WORLD", canvas.width / 2, canvas.height / 2 - 60);
  ctx.font = "16px Orbitron";
  ctx.fillStyle = "#aaa";
  ctx.fillText("Open world survival • Crafting • Quests • Bosses", canvas.width / 2, canvas.height / 2 - 20);
  ctx.fillStyle = "#fff";
  ctx.fillText("Click or Press ENTER to Start", canvas.width / 2, canvas.height / 2 + 30);
  ctx.fillText("WASD Move • Mouse Shoot • B Shop • I Inventory • C Craft", canvas.width / 2, canvas.height / 2 + 60);
}

function drawGame() {
  const night = (world.time % world.dayLength) > world.dayLength * 0.7;
  ctx.fillStyle = night ? "#0a0814" : "#1a2a1a";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.save();
  ctx.translate(-world.camX, -world.camY);

  ctx.strokeStyle = "rgba(0,255,100,0.1)";
  for (let i = 0; i < world.size; i += 200) {
    ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, world.size); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(world.size, i); ctx.stroke();
  }

  loot.forEach((l) => {
    ctx.fillStyle = l.item === "iron" ? "#aaa" : l.item === "bandage" ? "#ff4488" : "#885522";
    ctx.fillRect(l.x - 8, l.y - 8, 16, 16);
  });

  npcs.forEach((npc) => {
    ctx.fillStyle = "#00f7ff";
    ctx.fillRect(npc.x - 14, npc.y - 14, 28, 28);
    ctx.fillStyle = "#fff";
    ctx.font = "11px Orbitron";
    ctx.fillText(npc.name, npc.x - 30, npc.y - 20);
    if (npc.talked) { ctx.fillStyle = "#00ff88"; ctx.fillText("✓", npc.x + 10, npc.y - 20); }
  });

  zombies.forEach((z) => {
    ctx.fillStyle = "#00aa00";
    ctx.fillRect(z.x - z.size / 2, z.y - z.size / 2, z.size, z.size);
  });

  if (boss) {
    ctx.fillStyle = "#ff0044";
    ctx.shadowBlur = 20;
    ctx.shadowColor = "#ff0044";
    ctx.fillRect(boss.x - boss.size / 2, boss.y - boss.size / 2, boss.size, boss.size);
    ctx.shadowBlur = 0;
    ctx.fillStyle = "#fff";
    ctx.font = "14px Orbitron";
    ctx.fillText(`BOSS ${boss.hp}/${boss.maxHp}`, boss.x - 40, boss.y - boss.size / 2 - 10);
  }

  bullets.forEach((b) => {
    ctx.fillStyle = b.color;
    ctx.fillRect(b.x - 3, b.y - 3, 6, 6);
  });

  ctx.fillStyle = "#00f7ff";
  ctx.fillRect(player.x - player.size / 2, player.y - player.size / 2, player.size, player.size);

  ctx.restore();

  ctx.fillStyle = "#fff";
  ctx.font = "14px Orbitron";
  ctx.textAlign = "left";
  ctx.fillText(`HP: ${Math.floor(player.hp)}/${player.maxHp}`, 15, 25);
  ctx.fillText(`Money: $${money}`, 15, 45);
  ctx.fillText(`Weapon: ${player.weapon} | Kills: ${player.kills} | Combo: ${combo}x`, 15, 65);
  ctx.fillText(`Score: ${player.score}`, 15, 85);

  if (state.inventoryOpen) {
    ctx.fillStyle = "rgba(0,0,0,0.85)";
    ctx.fillRect(canvas.width / 2 - 150, 100, 300, 200);
    ctx.strokeStyle = "#00f7ff";
    ctx.strokeRect(canvas.width / 2 - 150, 100, 300, 200);
    ctx.fillStyle = "#00f7ff";
    ctx.font = "16px Orbitron";
    ctx.fillText("INVENTORY", canvas.width / 2 - 40, 125);
    inventory.forEach((item, i) => {
      ctx.fillStyle = "#fff";
      ctx.font = "12px Orbitron";
      ctx.fillText(`${item.name}: ${item.qty}`, canvas.width / 2 - 130, 150 + i * 22);
    });
  }

  if (state.shopOpen) {
    ctx.fillStyle = "rgba(0,0,0,0.85)";
    ctx.fillRect(canvas.width / 2 - 160, 100, 320, 280);
    ctx.strokeStyle = "#c300ff";
    ctx.strokeRect(canvas.width / 2 - 160, 100, 320, 280);
    ctx.fillStyle = "#c300ff";
    ctx.font = "16px Orbitron";
    ctx.fillText("SHOP (Click items)", canvas.width / 2 - 70, 125);
    shopItems.forEach((item, i) => {
      const y = 150 + i * 35;
      ctx.fillStyle = mouse.y > y - 15 && mouse.y < y + 15 && mouse.x > canvas.width / 2 - 140 && mouse.x < canvas.width / 2 + 140 ? "#333" : "#222";
      ctx.fillRect(canvas.width / 2 - 140, y - 12, 280, 28);
      ctx.fillStyle = "#fff";
      ctx.font = "12px Orbitron";
      ctx.fillText(`${item.name} — $${item.price}`, canvas.width / 2 - 130, y + 5);
    });
  }
}

function handleShopClick() {
  if (!state.shopOpen) return;
  shopItems.forEach((item, i) => {
    const y = 150 + i * 35;
    if (mouse.y > y - 12 && mouse.y < y + 16 && mouse.x > canvas.width / 2 - 140 && mouse.x < canvas.width / 2 + 140 && money >= item.price) {
      money -= item.price;
      if (item.type === "weapon") { player.weapon = item.name; addInvItem(item.name); player.dmg = 1; player.fireRate = weapons[item.name].rate; }
      if (item.type === "upgrade") player.dmg += 1;
      if (item.type === "heal") player.hp = player.maxHp;
      if (item.type === "item") addInvItem("bandage", 3);
      AudioManager.play("buy");
    }
  });
}

function draw() {
  if (state.scene === "menu") drawMenu();
  else if (state.scene === "dead") {
    ctx.fillStyle = "rgba(0,0,0,0.9)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#ff0044";
    ctx.font = "bold 48px Orbitron";
    ctx.textAlign = "center";
    ctx.fillText("YOU DIED", canvas.width / 2, canvas.height / 2);
    ctx.fillStyle = "#fff";
    ctx.font = "20px Orbitron";
    ctx.fillText(`Score: ${player.score}  Kills: ${player.kills}`, canvas.width / 2, canvas.height / 2 + 40);
    ctx.fillText("Press R to Restart", canvas.width / 2, canvas.height / 2 + 80);
  } else drawGame();
}

canvas.addEventListener("click", () => {
  if (state.scene === "menu") state.scene = "game";
  handleShopClick();
});

document.addEventListener("keydown", (e) => {
  if (state.scene === "menu" && e.key === "Enter") state.scene = "game";
  if (state.scene === "dead" && e.key === "r") location.reload();
});

function loop() {
  update();
  draw();
  requestAnimationFrame(loop);
}

GameBridge.bindPauseKey(() => player.score);
GameBridge.createMobileControls({
  dpad: true,
  action: true,
  actionLabel: "🔫",
  onDirection: (dir) => {
    if (dir === "up") keys["w"] = true;
    if (dir === "down") keys["s"] = true;
    if (dir === "left") keys["a"] = true;
    if (dir === "right") keys["d"] = true;
    setTimeout(() => { keys["w"] = keys["s"] = keys["a"] = keys["d"] = false; }, 150);
  },
  onAction: shoot,
});

loop();
