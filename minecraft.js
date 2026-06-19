const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const minimap = document.getElementById("minimap");
const miniCtx = minimap.getContext("2d");

const titleScreen = document.getElementById("title-screen");
const loadingScreen = document.getElementById("loading-screen");
const pauseScreen = document.getElementById("pause-screen");
const deathScreen = document.getElementById("death-screen");
const inventoryScreen = document.getElementById("inventory-screen");
const craftScreen = document.getElementById("craft-screen");
const howScreen = document.getElementById("how-screen");
const hotbarEl = document.getElementById("hotbar");
const statsBar = document.getElementById("stats-bar");
const healthBar = document.getElementById("health-bar");
const hungerBar = document.getElementById("hunger-bar");
const xpFill = document.getElementById("xp-bar-fill");
const dayIndicator = document.getElementById("day-indicator");
const tooltip = document.getElementById("tooltip");
const toastContainer = document.getElementById("toast-container");
const recipesList = document.getElementById("recipes-list");
const invHotbarGrid = document.getElementById("inv-hotbar-grid");
const invBackpackGrid = document.getElementById("inv-backpack-grid");

const btnPlay = document.getElementById("btn-play");
const btnHow = document.getElementById("btn-how");
const btnResume = document.getElementById("btn-resume");
const btnSave = document.getElementById("btn-save");
const btnLoad = document.getElementById("btn-load");
const btnRespawn = document.getElementById("btn-respawn");
const invClose = document.getElementById("inv-close");
const craftClose = document.getElementById("craft-close");

const world = {
  width: 80,
  height: 40,
  grid: [],
  time: 0,
  dayLength: 18000,
};

const blocks = {
  0: {
    id: 0,
    name: "Air",
    color: "#08111f",
    solid: false,
    placeable: false,
    drop: 0,
  },
  1: { id: 1, name: "Grass", color: "#5da34d", placeable: true, drop: 1 },
  2: { id: 2, name: "Dirt", color: "#7a5f42", placeable: true, drop: 2 },
  3: { id: 3, name: "Stone", color: "#6f6f6f", placeable: true, drop: 3 },
  4: { id: 4, name: "Wood", color: "#8b5a30", placeable: true, drop: 4 },
  5: { id: 5, name: "Leaf", color: "#33813c", placeable: false, drop: 7 },
  6: { id: 6, name: "Plank", color: "#c48d57", placeable: true, drop: 6 },
  7: { id: 7, name: "Stick", color: "#dbc18d", placeable: false, drop: 7 },
};

const recipes = [
  {
    name: "Wood Planks",
    ingredients: { 4: 1 },
    result: { id: 6, count: 4 },
  },
  {
    name: "Sticks",
    ingredients: { 6: 2 },
    result: { id: 7, count: 4 },
  },
  {
    name: "Torch",
    ingredients: { 6: 1, 7: 1 },
    result: { id: 6, count: 2 },
  },
];

const state = {
  scene: "loading",
  inventoryOpen: false,
  craftOpen: false,
  paused: false,
  death: false,
};

const keys = {};
const mouse = { x: 0, y: 0 };

const player = {
  x: 40,
  y: 10,
  speed: 0.12,
  health: 100,
  hunger: 100,
  xp: 0,
  level: 1,
  aimAngle: -Math.PI / 2,
};

let selectedHotbar = 0;
const hotbar = [
  { id: 4, count: 10 },
  { id: 1, count: 20 },
  { id: 2, count: 12 },
  { id: 0, count: 0 },
  { id: 0, count: 0 },
  { id: 0, count: 0 },
  { id: 0, count: 0 },
  { id: 0, count: 0 },
  { id: 0, count: 0 },
];
const backpack = Array.from({ length: 27 }, () => ({ id: 0, count: 0 }));

const tileSize = 22;
let frame = 0;

const gameBridge = typeof GameBridge !== "undefined" ? GameBridge.init("blockcraft") : null;
if (typeof AudioManager !== "undefined") AudioManager.init(gameBridge?.settings);

const mobs = [];
let survivedNight = false;
let lastNightPhase = false;
let mobKills = 0;

function spawnMob() {
  const angle = Math.random() * Math.PI * 2;
  const dist = 8 + Math.random() * 4;
  mobs.push({
    x: player.x + Math.cos(angle) * dist,
    y: player.y + Math.sin(angle) * dist,
    hp: 3,
    speed: 0.04 + Math.random() * 0.02,
    size: 0.6,
  });
}

function updateMobs() {
  const night = world.time > world.dayLength * 0.65;
  if (night && !lastNightPhase) survivedNight = false;
  if (!night && lastNightPhase && !survivedNight) {
    survivedNight = true;
    gameBridge?.emitEvent("survive_night");
    showToast("Survived the night! +XP");
  }
  lastNightPhase = night;

  if (night && frame % 300 === 0 && mobs.length < 8) spawnMob();

  for (let i = mobs.length - 1; i >= 0; i--) {
    const m = mobs[i];
    const dx = player.x - m.x;
    const dy = player.y - m.y;
    const d = Math.max(0.1, Math.hypot(dx, dy));
    m.x += (dx / d) * m.speed;
    m.y += (dy / d) * m.speed;

    if (d < 1.2) {
      player.health = Math.max(0, player.health - 0.5);
      if (player.health <= 0) die();
    }

    const target = getTargetTile();
    if (Math.hypot(target.x - m.x, target.y - m.y) < 2 && keys["mouse0"]) {
      m.hp -= 1;
      if (m.hp <= 0) {
        mobs.splice(i, 1);
        mobKills++;
        player.xp += 15;
        addItem(4, 1);
        showToast("Mob defeated!");
        if (typeof AudioManager !== "undefined") AudioManager.play("hit");
      }
    }
  }
}

function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}

window.addEventListener("resize", resize);
resize();

function createSlot(id = 0, count = 0) {
  return { id, count };
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function generateWorld() {
  world.grid = Array.from({ length: world.height }, (_, y) => {
    return Array.from({ length: world.width }, (_, x) => {
      if (y > 28) return 3;
      if (y > 25) return 2;
      if (y === 25) return 1;
      return 0;
    });
  });

  for (let x = 2; x < world.width - 2; x += 10) {
    if (Math.random() < 0.75) {
      const treeHeight = 4 + Math.floor(Math.random() * 3);
      for (let y = 24; y > 24 - treeHeight; y--) {
        world.grid[y][x] = 4;
      }
      for (let ox = x - 2; ox <= x + 2; ox++) {
        for (let oy = 24 - treeHeight - 2; oy <= 24 - treeHeight + 1; oy++) {
          if (ox >= 0 && ox < world.width && oy >= 0 && oy < world.height) {
            if (Math.abs(ox - x) + Math.abs(oy - (24 - treeHeight - 1)) < 4) {
              if (world.grid[oy][ox] === 0) world.grid[oy][ox] = 5;
            }
          }
        }
      }
    }
  }
}

function saveWorldData() {
  const save = {
    world: {
      width: world.width,
      height: world.height,
      time: world.time,
      grid: world.grid,
    },
    player: {
      x: player.x,
      y: player.y,
      health: player.health,
      hunger: player.hunger,
      xp: player.xp,
      level: player.level,
    },
    hotbar,
    backpack,
    selectedHotbar,
  };

  localStorage.setItem("blockcraft_save", JSON.stringify(save));
  showToast("World saved.");
}

function loadWorldData() {
  const data = localStorage.getItem("blockcraft_save");
  if (!data) return false;

  try {
    const save = JSON.parse(data);
    if (save.world && Array.isArray(save.world.grid)) {
      world.width = save.world.width;
      world.height = save.world.height;
      world.time = save.world.time || 0;
      world.grid = save.world.grid;
      player.x = save.player.x;
      player.y = save.player.y;
      player.health = save.player.health;
      player.hunger = save.player.hunger;
      player.xp = save.player.xp;
      player.level = save.player.level;
      selectedHotbar = save.selectedHotbar || 0;
      if (Array.isArray(save.hotbar)) {
        hotbar.splice(
          0,
          hotbar.length,
          ...save.hotbar.map((slot) => createSlot(slot.id, slot.count)),
        );
      }
      if (Array.isArray(save.backpack)) {
        backpack.splice(
          0,
          backpack.length,
          ...save.backpack.map((slot) => createSlot(slot.id, slot.count)),
        );
      }
      showToast("World loaded.");
      return true;
    }
  } catch (error) {
    console.warn("Failed to load save data", error);
  }

  return false;
}

function startGame() {
  state.scene = "game";
  titleScreen.style.display = "none";
  loadingScreen.style.display = "none";
  state.paused = false;
  pauseScreen.classList.remove("open");
}

function toggleInventory() {
  if (state.scene !== "game" || state.paused) return;
  state.inventoryOpen = !state.inventoryOpen;
  state.craftOpen = false;
  inventoryScreen.classList.toggle("open", state.inventoryOpen);
  craftScreen.classList.remove("open");
  if (state.inventoryOpen) renderInventory();
}

function toggleCraft() {
  if (state.scene !== "game" || state.paused) return;
  state.craftOpen = !state.craftOpen;
  state.inventoryOpen = false;
  craftScreen.classList.toggle("open", state.craftOpen);
  inventoryScreen.classList.remove("open");
  if (state.craftOpen) renderRecipes();
}

function togglePause() {
  if (state.scene !== "game" || state.inventoryOpen || state.craftOpen) return;
  state.paused = !state.paused;
  pauseScreen.classList.toggle("open", state.paused);
}

function die() {
  state.death = true;
  state.scene = "death";
  deathScreen.classList.add("open");
  document.getElementById("death-stats").textContent =
    `You reached X:${Math.floor(player.x)} Y:${Math.floor(player.y)} — Level ${player.level}`;
  gameBridge?.endGame({
    score: player.level * 100 + mobKills * 10,
    won: player.level >= 3,
    kills: mobKills,
  });
}

function respawn() {
  player.health = 100;
  player.hunger = 100;
  player.x = 40;
  player.y = 10;
  state.scene = "game";
  state.death = false;
  deathScreen.classList.remove("open");
}

function canCraft(recipe) {
  return Object.entries(recipe.ingredients).every(
    ([id, amount]) => itemCount(Number(id)) >= amount,
  );
}

function itemCount(id) {
  return (
    hotbar.reduce((sum, slot) => sum + (slot.id === id ? slot.count : 0), 0) +
    backpack.reduce((sum, slot) => sum + (slot.id === id ? slot.count : 0), 0)
  );
}

function removeItem(id, amount) {
  let remaining = amount;

  for (const slot of hotbar.concat(backpack)) {
    if (slot.id !== id) continue;
    const used = Math.min(slot.count, remaining);
    slot.count -= used;
    remaining -= used;
    if (slot.count === 0) slot.id = 0;
    if (remaining === 0) break;
  }
}

function addItem(id, count = 1) {
  if (id === 0) return true;

  let remaining = count;
  for (const slot of hotbar) {
    if (slot.id === id && slot.count < 99) {
      const available = Math.min(99 - slot.count, remaining);
      slot.count += available;
      remaining -= available;
      if (remaining === 0) return true;
    }
  }

  for (const slot of backpack) {
    if (slot.id === id && slot.count < 99) {
      const available = Math.min(99 - slot.count, remaining);
      slot.count += available;
      remaining -= available;
      if (remaining === 0) return true;
    }
  }

  for (const slot of hotbar) {
    if (slot.id === 0) {
      slot.id = id;
      slot.count = Math.min(remaining, 99);
      remaining -= slot.count;
      if (remaining === 0) return true;
    }
  }

  for (const slot of backpack) {
    if (slot.id === 0) {
      slot.id = id;
      slot.count = Math.min(remaining, 99);
      remaining -= slot.count;
      if (remaining === 0) return true;
    }
  }

  return remaining === 0;
}

function craft(recipe) {
  if (!canCraft(recipe)) {
    showToast("Missing materials.");
    return;
  }

  const copyHotbar = hotbar.map((slot) => ({ ...slot }));
  const copyBackpack = backpack.map((slot) => ({ ...slot }));
  const added = addItem(recipe.result.id, recipe.result.count);

  if (!added) {
    hotbar.splice(0, hotbar.length, ...copyHotbar);
    backpack.splice(0, backpack.length, ...copyBackpack);
    showToast("Not enough inventory space.");
    return;
  }

  Object.entries(recipe.ingredients).forEach(([id, amount]) =>
    removeItem(Number(id), amount),
  );
  showToast(`Crafted ${recipe.name}.`);
  renderHotbar();
  renderInventory();
}

function getTargetTile() {
  const reach = 6;
  const tx = Math.round(player.x + Math.cos(player.aimAngle) * reach);
  const ty = Math.round(player.y + Math.sin(player.aimAngle) * reach);
  return {
    x: clamp(tx, 0, world.width - 1),
    y: clamp(ty, 0, world.height - 1),
  };
}

function mineTile(x, y) {
  const id = world.grid[y][x];
  if (id === 0) return;
  const block = blocks[id];
  const added = addItem(block.drop, 1);
  if (added) {
    world.grid[y][x] = 0;
    player.xp += 5;
    if (player.xp >= 100) {
      player.level += 1;
      player.xp -= 100;
      showToast(`Level up! ${player.level}`);
    }
    showToast(`Mined ${block.name}.`);
  } else {
    showToast("Inventory full.");
  }
}

function placeBlock(x, y) {
  const target = world.grid[y][x];
  if (target !== 0) return;
  const slot = hotbar[selectedHotbar];
  if (!slot || slot.id === 0) {
    showToast("No item selected.");
    return;
  }
  const block = blocks[slot.id];
  if (!block.placeable) {
    showToast("Cannot place that item.");
    return;
  }
  world.grid[y][x] = slot.id;
  slot.count -= 1;
  if (slot.count === 0) slot.id = 0;
  showToast(`Placed ${block.name}.`);
}

function renderHotbar() {
  hotbarEl.innerHTML = "";
  hotbar.forEach((slot, index) => {
    const button = document.createElement("div");
    button.className = `hotbar-slot${index === selectedHotbar ? " active" : ""}`;
    button.dataset.index = index;

    const icon = document.createElement("canvas");
    icon.width = 32;
    icon.height = 32;
    const iconCtx = icon.getContext("2d");
    iconCtx.imageSmoothingEnabled = false;
    if (slot.id !== 0) {
      iconCtx.fillStyle = blocks[slot.id].color;
      iconCtx.fillRect(4, 4, 24, 24);
    }

    const count = document.createElement("div");
    count.className = "slot-count";
    count.textContent = slot.count > 0 ? slot.count : "";

    button.appendChild(icon);
    button.appendChild(count);
    hotbarEl.appendChild(button);
  });
}

hotbarEl.addEventListener("click", (event) => {
  const slot = event.target.closest(".hotbar-slot");
  if (!slot) return;
  selectedHotbar = Number(slot.dataset.index);
  renderHotbar();
});

function renderInventory() {
  invHotbarGrid.innerHTML = "";
  invBackpackGrid.innerHTML = "";

  hotbar.forEach((slot, index) => {
    const elem = createInventorySlot(slot, () => {
      selectedHotbar = index;
      renderHotbar();
      renderInventory();
    });
    invHotbarGrid.appendChild(elem);
  });

  backpack.forEach((slot, index) => {
    const elem = createInventorySlot(slot, () => {
      if (slot.id === 0) return;
      const moved = addItem(slot.id, slot.count);
      if (moved) {
        slot.id = 0;
        slot.count = 0;
      }
      renderHotbar();
      renderInventory();
    });
    invBackpackGrid.appendChild(elem);
  });
}

function createInventorySlot(slot, onClick) {
  const element = document.createElement("div");
  element.className = "inv-slot";
  const icon = document.createElement("canvas");
  icon.width = 36;
  icon.height = 36;
  const iconCtx = icon.getContext("2d");
  iconCtx.imageSmoothingEnabled = false;
  if (slot.id !== 0) {
    iconCtx.fillStyle = blocks[slot.id].color;
    iconCtx.fillRect(4, 4, 28, 28);
  }

  const count = document.createElement("div");
  count.className = "slot-count";
  count.textContent = slot.count > 0 ? slot.count : "";

  element.appendChild(icon);
  element.appendChild(count);
  element.addEventListener("click", onClick);
  return element;
}

function renderRecipes() {
  recipesList.innerHTML = "";
  recipes.forEach((recipe) => {
    const card = document.createElement("div");
    card.className = "recipe-card";
    if (canCraft(recipe)) card.classList.add("can-craft");

    const title = document.createElement("div");
    title.className = "recipe-name";
    title.textContent = recipe.name;

    const cost = document.createElement("div");
    cost.className = "recipe-cost";
    cost.innerHTML = Object.entries(recipe.ingredients)
      .map(([id, amount]) => `${blocks[id].name}: ${amount}`)
      .join("<br>");

    card.appendChild(title);
    card.appendChild(cost);
    card.addEventListener("click", () => craft(recipe));
    recipesList.appendChild(card);
  });
}

function renderHowTo() {
  const table = document.getElementById("how-table");
  table.innerHTML = "";
  const rows = [
    ["Move", "W / A / S / D"],
    ["Mine", "Left click"],
    ["Place", "Right click"],
    ["Switch slot", "1 - 9"],
    ["Open inventory", "E"],
    ["Open crafting", "C"],
    ["Pause", "Escape"],
  ];
  rows.forEach(([action, key]) => {
    const row = document.createElement("tr");
    const actionCell = document.createElement("td");
    actionCell.textContent = action;
    const keyCell = document.createElement("td");
    keyCell.textContent = key;
    row.appendChild(actionCell);
    row.appendChild(keyCell);
    table.appendChild(row);
  });
}

function updateStats() {
  statsBar.innerHTML = `
    <div class="stat-item">X: ${Math.floor(player.x)}</div>
    <div class="stat-item">Y: ${Math.floor(player.y)}</div>
    <div class="stat-item">Level: ${player.level}</div>
    <div class="stat-item">XP: ${player.xp}/100</div>
    <div class="stat-item">Selected: ${blocks[hotbar[selectedHotbar]?.id]?.name || "Empty"}</div>
  `;

  const dayProgress = (world.time / world.dayLength) * 100;
  const isDay = world.time < world.dayLength / 2;
  dayIndicator.textContent = isDay
    ? `DAY • ${Math.floor(dayProgress)}%`
    : `NIGHT • ${Math.floor(dayProgress)}%`;
  xpFill.style.width = `${Math.min(100, (player.xp / 100) * 100)}%`;
}

function updateBars() {
  healthBar.innerHTML = "";
  hungerBar.innerHTML = "";
  const healthCount = Math.ceil(player.health / 10);
  const hungerCount = Math.ceil(player.hunger / 10);

  for (let i = 0; i < 10; i++) {
    const heart = document.createElement("div");
    heart.className = "heart";
    heart.textContent = i < healthCount ? "❤" : "♡";
    healthBar.appendChild(heart);
  }

  for (let i = 0; i < 10; i++) {
    const hunger = document.createElement("div");
    hunger.className = "hunger-icon";
    hunger.textContent = i < hungerCount ? "☻" : "○";
    hungerBar.appendChild(hunger);
  }
}

function showToast(message) {
  const toast = document.createElement("div");
  toast.className = "toast";
  toast.textContent = message;
  toastContainer.appendChild(toast);
  setTimeout(() => {
    toast.remove();
  }, 2800);
}

function handleKeyDown(event) {
  const key = event.key.toLowerCase();
  if (keys[key]) return;
  keys[key] = true;

  if (key === "e") toggleInventory();
  if (key === "c") toggleCraft();
  if (key === "escape") togglePause();
  if (key === "r" && state.death) respawn();
  if (/^[1-9]$/.test(key)) {
    selectedHotbar = Number(key) - 1;
    renderHotbar();
  }
}

function handleKeyUp(event) {
  keys[event.key.toLowerCase()] = false;
}

function handleMouseMove(event) {
  const rect = canvas.getBoundingClientRect();
  mouse.x = event.clientX - rect.left;
  mouse.y = event.clientY - rect.top;
  player.aimAngle = Math.atan2(
    mouse.y - canvas.height / 2,
    mouse.x - canvas.width / 2,
  );
}

function handleMouseDown(event) {
  if (
    state.scene !== "game" ||
    state.paused ||
    state.inventoryOpen ||
    state.craftOpen ||
    state.death
  )
    return;
  event.preventDefault();

  const target = getTargetTile();
  if (event.button === 0) {
    mineTile(target.x, target.y);
  }
  if (event.button === 2) {
    placeBlock(target.x, target.y);
  }
}

canvas.addEventListener("mousemove", handleMouseMove);
canvas.addEventListener("mousedown", handleMouseDown);
canvas.addEventListener("contextmenu", (event) => event.preventDefault());

document.addEventListener("keydown", handleKeyDown);
document.addEventListener("keyup", handleKeyUp);

btnPlay.addEventListener("click", startGame);
btnHow.addEventListener("click", () => (howScreen.style.display = "flex"));
btnResume.addEventListener("click", togglePause);
btnSave.addEventListener("click", saveWorldData);
btnLoad.addEventListener("click", () => {
  if (loadWorldData()) {
    renderHotbar();
    renderInventory();
    renderRecipes();
    updateStats();
  }
});
btnRespawn.addEventListener("click", respawn);
invClose.addEventListener("click", toggleInventory);
craftClose.addEventListener("click", toggleCraft);

function update() {
  if (
    state.scene !== "game" ||
    state.paused ||
    state.inventoryOpen ||
    state.craftOpen ||
    state.death
  )
    return;

  if (keys["w"]) player.y -= player.speed;
  if (keys["s"]) player.y += player.speed;
  if (keys["a"]) player.x -= player.speed;
  if (keys["d"]) player.x += player.speed;

  player.x = clamp(player.x, 0, world.width - 1);
  player.y = clamp(player.y, 0, world.height - 1);

  if (frame % 180 === 0) {
    player.hunger = Math.max(0, player.hunger - 1);
  }
  if (player.hunger === 0 && frame % 60 === 0) {
    player.health = Math.max(0, player.health - 1);
  }
  if (player.health === 0) {
    die();
  }

  world.time = (world.time + 1) % world.dayLength;
  updateMobs();
  updateBars();
  updateStats();
}

function draw() {
  const skyShade =
    30 +
    Math.round(
      80 * (0.5 + 0.5 * Math.sin((world.time / world.dayLength) * Math.PI * 2)),
    );
  ctx.fillStyle = `rgb(${skyShade}, ${skyShade}, ${skyShade + 30})`;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.imageSmoothingEnabled = false;

  const viewRadius = 12;
  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;
  const startX = Math.max(0, Math.floor(player.x - viewRadius));
  const endX = Math.min(world.width - 1, Math.ceil(player.x + viewRadius));
  const startY = Math.max(0, Math.floor(player.y - viewRadius));
  const endY = Math.min(world.height - 1, Math.ceil(player.y + viewRadius));

  for (let y = startY; y <= endY; y++) {
    for (let x = startX; x <= endX; x++) {
      const block = blocks[world.grid[y][x]];
      const screenX = centerX + (x - player.x) * tileSize - tileSize / 2;
      const screenY = centerY + (y - player.y) * tileSize - tileSize / 2;
      ctx.fillStyle = block.color;
      ctx.fillRect(screenX, screenY, tileSize, tileSize);
      ctx.strokeStyle = "rgba(0,0,0,0.08)";
      ctx.strokeRect(screenX, screenY, tileSize, tileSize);
    }
  }

  const target = getTargetTile();
  const targetScreenX =
    centerX + (target.x - player.x) * tileSize - tileSize / 2;
  const targetScreenY =
    centerY + (target.y - player.y) * tileSize - tileSize / 2;
  ctx.strokeStyle = "rgba(255,255,255,0.9)";
  ctx.lineWidth = 2;
  ctx.strokeRect(targetScreenX, targetScreenY, tileSize, tileSize);

  ctx.fillStyle = "#ffe680";
  ctx.beginPath();
  ctx.arc(centerX, centerY, tileSize / 3, 0, Math.PI * 2);
  ctx.fill();

  mobs.forEach((m) => {
    const mx = centerX + (m.x - player.x) * tileSize;
    const my = centerY + (m.y - player.y) * tileSize;
    ctx.fillStyle = world.time > world.dayLength * 0.65 ? "#ff2244" : "#aa4422";
    ctx.fillRect(mx - 8, my - 8, 16, 16);
    ctx.fillStyle = "#fff";
    ctx.fillRect(mx - 2, my - 4, 4, 4);
    ctx.fillRect(mx + 4, my - 4, 4, 4);
  });

  drawMinimap();
}

function drawMinimap() {
  miniCtx.clearRect(0, 0, minimap.width, minimap.height);
  const scaleX = minimap.width / world.width;
  const scaleY = minimap.height / world.height;

  for (let y = 0; y < world.height; y++) {
    for (let x = 0; x < world.width; x++) {
      miniCtx.fillStyle = blocks[world.grid[y][x]].color;
      miniCtx.fillRect(
        x * scaleX,
        y * scaleY,
        Math.ceil(scaleX),
        Math.ceil(scaleY),
      );
    }
  }
  miniCtx.fillStyle = "rgba(255,255,255,0.9)";
  miniCtx.fillRect(
    player.x * scaleX,
    player.y * scaleY,
    Math.ceil(scaleX),
    Math.ceil(scaleY),
  );
}

function loop() {
  frame += 1;

  if (state.scene === "loading") {
    if (frame > 50) {
      loadingScreen.style.display = "none";
      titleScreen.style.display = "flex";
      state.scene = "title";
    }
  }

  update();
  draw();
  requestAnimationFrame(loop);
}

function init() {
  renderHowTo();
  generateWorld();
  loadWorldData();
  renderHotbar();
  renderInventory();
  renderRecipes();
  updateBars();
  updateStats();
  loop();
}

init();
