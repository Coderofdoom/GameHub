/**
 * UIManager — toasts, modals, particles, and hub UI helpers.
 */
const UIManager = (() => {
  let toastContainer = null;
  let particleContainer = null;

  function init() {
    toastContainer = document.getElementById("toast-container");
    particleContainer = document.getElementById("particles");

    if (particleContainer && !particleContainer.children.length) {
      initParticles(particleContainer);
    }
  }

  function toast(message, type = "info") {
    if (!toastContainer) {
      toastContainer = document.createElement("div");
      toastContainer.id = "toast-container";
      document.body.appendChild(toastContainer);
    }

    const el = document.createElement("div");
    el.className = `toast toast-${type}`;
    el.textContent = message;
    toastContainer.appendChild(el);

    requestAnimationFrame(() => el.classList.add("show"));
    setTimeout(() => {
      el.classList.remove("show");
      setTimeout(() => el.remove(), 400);
    }, 3000);
  }

  function initParticles(container, count = 60) {
    for (let i = 0; i < count; i++) {
      const p = document.createElement("div");
      p.className = "particle";
      p.style.left = Math.random() * 100 + "%";
      p.style.top = Math.random() * 100 + "%";
      p.style.animationDelay = Math.random() * 8 + "s";
      p.style.animationDuration = 4 + Math.random() * 6 + "s";
      const colors = ["#00f7ff", "#c300ff", "#00ff88"];
      p.style.background = colors[Math.floor(Math.random() * colors.length)];
      p.style.width = p.style.height = 2 + Math.random() * 4 + "px";
      container.appendChild(p);
    }
  }

  function formatNumber(n) {
    if (n >= 1000000) return (n / 1000000).toFixed(1) + "M";
    if (n >= 1000) return (n / 1000).toFixed(1) + "K";
    return n.toLocaleString();
  }

  function animateValue(el, from, to, duration = 600) {
    const start = performance.now();
    function step(now) {
      const t = Math.min(1, (now - start) / duration);
      const val = Math.floor(from + (to - from) * t);
      el.textContent = formatNumber(val);
      if (t < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  function showModal(id) {
    const modal = document.getElementById(id);
    if (modal) modal.classList.add("active");
  }

  function hideModal(id) {
    const modal = document.getElementById(id);
    if (modal) modal.classList.remove("active");
  }

  function createProgressBar(percent) {
    return `<div class="progress-bar"><div class="progress-fill" style="width:${percent}%"></div></div>`;
  }

  return { init, toast, initParticles, formatNumber, animateValue, showModal, hideModal, createProgressBar };
})();

if (typeof window !== "undefined") window.UIManager = UIManager;
