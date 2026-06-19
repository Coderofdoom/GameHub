/**
 * AudioManager — procedural Web Audio effects.
 */
const AudioManager = (() => {
  let ctx = null;
  let enabled = true;

  function init(settings) {
    enabled = settings?.sfx !== false;
    try {
      if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
    } catch {
      enabled = false;
    }
  }

  function tone(freq, duration, type = "square", volume = 0.08) {
    if (!enabled || !ctx) return;
    try {
      if (ctx.state === "suspended") ctx.resume();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.value = freq;
      gain.gain.value = volume;
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch {
      /* silent fail */
    }
  }

  function play(name) {
    const sounds = {
      click: () => tone(800, 0.05, "sine", 0.06),
      buy: () => { tone(600, 0.08); setTimeout(() => tone(900, 0.1), 80); },
      levelUp: () => { tone(400, 0.1); setTimeout(() => tone(600, 0.1), 100); setTimeout(() => tone(800, 0.15), 200); },
      achievement: () => { tone(500, 0.1); setTimeout(() => tone(700, 0.1), 100); setTimeout(() => tone(1000, 0.2), 200); },
      coin: () => tone(1200, 0.06, "sine", 0.05),
      hit: () => tone(150, 0.15, "sawtooth", 0.1),
      shoot: () => tone(900, 0.04, "square", 0.04),
      explosion: () => tone(80, 0.3, "sawtooth", 0.12),
      powerup: () => { tone(700, 0.08); setTimeout(() => tone(1000, 0.12), 60); },
      gameOver: () => { tone(300, 0.2); setTimeout(() => tone(200, 0.3), 150); },
    };
    if (sounds[name]) sounds[name]();
  }

  function setEnabled(val) {
    enabled = val;
  }

  return { init, play, setEnabled, tone };
})();

if (typeof window !== "undefined") window.AudioManager = AudioManager;
