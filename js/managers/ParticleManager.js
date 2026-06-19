/**
 * ParticleManager — Reusable particle system with object pooling
 */
const ParticleManager = (() => {
  const pools = new Map();
  const activeParticles = [];

  function createPool(name, size = 100) {
    const pool = [];
    for (let i = 0; i < size; i++) {
      pool.push({
        x: 0, y: 0,
        vx: 0, vy: 0,
        life: 0, maxLife: 1,
        scale: 1, opacity: 1,
        type: name,
        active: false
      });
    }
    pools.set(name, pool);
  }

  function get(name) {
    if (!pools.has(name)) createPool(name);
    const pool = pools.get(name);
    let particle = pool.find(p => !p.active);
    if (!particle) {
      particle = {
        x: 0, y: 0,
        vx: 0, vy: 0,
        life: 0, maxLife: 1,
        scale: 1, opacity: 1,
        type: name,
        active: false
      };
      pool.push(particle);
    }
    particle.active = true;
    activeParticles.push(particle);
    return particle;
  }

  function emit(name, x, y, config = {}) {
    const count = config.count || 5;
    for (let i = 0; i < count; i++) {
      const p = get(name);
      p.x = x + (Math.random() - 0.5) * (config.spread || 10);
      p.y = y + (Math.random() - 0.5) * (config.spread || 10);
      p.vx = (Math.random() - 0.5) * (config.speed || 2);
      p.vy = (Math.random() - 0.5) * (config.speed || 2) - (config.gravity || 0);
      p.life = 0;
      p.maxLife = config.life || 1;
      p.scale = config.scale || 1;
      p.opacity = 1;
      p.decay = config.decay || 1;
      p.color = config.color || '#00f7ff';
    }
  }

  function update(dt) {
    for (let i = activeParticles.length - 1; i >= 0; i--) {
      const p = activeParticles[i];
      p.life += dt;
      if (p.life >= p.maxLife) {
        p.active = false;
        activeParticles.splice(i, 1);
        continue;
      }

      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += (p.gravity || 0) * dt;
      p.opacity = Math.max(0, 1 - (p.life / p.maxLife));
      p.scale *= (1 - p.decay * dt);
    }
  }

  function render(ctx) {
    activeParticles.forEach(p => {
      ctx.save();
      ctx.globalAlpha = p.opacity;
      ctx.fillStyle = p.color;
      ctx.translate(p.x, p.y);
      ctx.scale(p.scale, p.scale);
      ctx.fillRect(-2, -2, 4, 4);
      ctx.restore();
    });
  }

  function clear() {
    activeParticles.forEach(p => p.active = false);
    activeParticles.length = 0;
  }

  return {
    createPool,
    get,
    emit,
    update,
    render,
    clear,
    getActive: () => activeParticles.length
  };
})();

if (typeof window !== "undefined") window.ParticleManager = ParticleManager;
