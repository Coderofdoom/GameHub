/**
 * MobileControlsManager — Virtual joystick, buttons, swipe detection
 */
const MobileControlsManager = (() => {
  let enabled = false;
  let joystick = null;
  let buttons = new Map();
  let swipeHandlers = new Map();
  let listeners = new Map();

  function init(config = {}) {
    if (!isMobileDevice()) return;
    enabled = config.enabled !== false;
    if (!enabled) return;

    joystick = createVirtualJoystick();
    listeners.set('move', () => {});
    listeners.set('button', () => {});
    listeners.set('swipe', () => {});
  }

  function isMobileDevice() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || 
           window.innerWidth <= 768 || 
           ('ontouchstart' in window);
  }

  function createVirtualJoystick() {
    const wrapper = document.createElement('div');
    wrapper.id = 'mobile-joystick';
    wrapper.style.cssText = `
      position: fixed;
      bottom: 20px;
      left: 20px;
      width: 100px;
      height: 100px;
      z-index: 9000;
      display: ${isMobileDevice() ? 'flex' : 'none'};
      align-items: center;
      justify-content: center;
      opacity: 0.8;
      touch-action: none;
    `;

    const base = document.createElement('div');
    base.style.cssText = `
      width: 100px;
      height: 100px;
      border-radius: 50%;
      background: rgba(0, 247, 255, 0.1);
      border: 2px solid rgba(0, 247, 255, 0.4);
      position: relative;
    `;

    const stick = document.createElement('div');
    stick.style.cssText = `
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: linear-gradient(135deg, rgba(0, 247, 255, 0.6), rgba(195, 0, 255, 0.6));
      position: absolute;
      top: 30px;
      left: 30px;
      box-shadow: 0 0 10px rgba(0, 247, 255, 0.5);
      transition: all 0.05s linear;
      pointer-events: none;
    `;

    base.appendChild(stick);
    wrapper.appendChild(base);
    document.body.appendChild(wrapper);

    const state = { x: 0, y: 0, active: false };
    let touchId = null;

    base.addEventListener('touchstart', (e) => {
      if (e.touches.length === 0) return;
      touchId = e.touches[0].identifier;
      state.active = true;
      updateJoystick(e.touches[0], base, stick, state);
    }, { passive: true });

    document.addEventListener('touchmove', (e) => {
      if (touchId === null) return;
      for (let touch of e.touches) {
        if (touch.identifier === touchId) {
          updateJoystick(touch, base, stick, state);
          break;
        }
      }
    }, { passive: true });

    document.addEventListener('touchend', (e) => {
      if (touchId === null) return;
      let found = false;
      for (let touch of e.touches) {
        if (touch.identifier === touchId) found = true;
      }
      if (!found) {
        touchId = null;
        state.active = false;
        state.x = 0;
        state.y = 0;
        resetStick(stick);
        listeners.get('move')({ x: 0, y: 0 });
      }
    }, { passive: true });

    return { state, element: wrapper };
  }

  function updateJoystick(touch, base, stick, state) {
    const rect = base.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = touch.clientX - cx;
    const dy = touch.clientY - cy;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const maxDist = 40;

    if (dist > maxDist) {
      state.x = (dx / dist) * maxDist;
      state.y = (dy / dist) * maxDist;
    } else {
      state.x = dx;
      state.y = dy;
    }

    stick.style.left = (30 + state.x) + 'px';
    stick.style.top = (30 + state.y) + 'px';
    listeners.get('move')({ x: state.x / maxDist, y: state.y / maxDist });
  }

  function resetStick(stick) {
    stick.style.left = '30px';
    stick.style.top = '30px';
  }

  function createButton(label, position = 'bottom-right') {
    const btn = document.createElement('button');
    btn.textContent = label;
    btn.className = 'mobile-btn';
    btn.setAttribute('data-position', position);
    
    const positions = {
      'bottom-left': 'bottom: 20px; left: 140px;',
      'bottom-right': 'bottom: 20px; right: 20px;',
      'bottom-center': 'bottom: 20px; left: 50%; transform: translateX(-50%);',
      'center-right': 'top: 50%; right: 20px; transform: translateY(-50%);'
    };

    btn.style.cssText = `
      position: fixed;
      ${positions[position] || positions['bottom-right']}
      width: 50px;
      height: 50px;
      border-radius: 50%;
      background: linear-gradient(135deg, rgba(0, 247, 255, 0.5), rgba(195, 0, 255, 0.5));
      border: 2px solid rgba(0, 247, 255, 0.6);
      color: white;
      font-weight: bold;
      font-size: 1.5rem;
      cursor: pointer;
      z-index: 9000;
      display: ${isMobileDevice() ? 'flex' : 'none'};
      align-items: center;
      justify-content: center;
      transition: all 0.1s;
      box-shadow: 0 0 10px rgba(0, 247, 255, 0.3);
      user-select: none;
      -webkit-user-select: none;
      -webkit-touch-callout: none;
      font-family: inherit;
    `;

    btn.addEventListener('touchstart', (e) => {
      e.preventDefault();
      btn.style.transform = position.includes('center-right') ? 'translateY(-50%) scale(0.9)' : 'scale(0.9)';
      listeners.get('button')({ label, state: 'down' });
    }, { passive: false });

    btn.addEventListener('touchend', (e) => {
      e.preventDefault();
      btn.style.transform = position.includes('center-right') ? 'translateY(-50%)' : '';
      listeners.get('button')({ label, state: 'up' });
    }, { passive: false });

    document.body.appendChild(btn);
    buttons.set(label, btn);
    return btn;
  }

  function onMove(callback) {
    listeners.set('move', callback);
  }

  function onButton(callback) {
    listeners.set('button', callback);
  }

  function onSwipe(direction, callback) {
    swipeHandlers.set(direction, callback);
    if (swipeHandlers.size === 1) setupSwipeDetection();
  }

  function setupSwipeDetection() {
    let startX = 0, startY = 0;

    document.addEventListener('touchstart', (e) => {
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
    }, { passive: true });

    document.addEventListener('touchend', (e) => {
      const endX = e.changedTouches[0].clientX;
      const endY = e.changedTouches[0].clientY;
      const diffX = endX - startX;
      const diffY = endY - startY;
      const minSwipeDistance = 50;

      if (Math.abs(diffX) > minSwipeDistance) {
        const direction = diffX > 0 ? 'right' : 'left';
        swipeHandlers.get(direction)?.(e);
      } else if (Math.abs(diffY) > minSwipeDistance) {
        const direction = diffY > 0 ? 'down' : 'up';
        swipeHandlers.get(direction)?.(e);
      }
    }, { passive: true });
  }

  function getJoystickState() {
    return joystick ? { ...joystick.state } : { x: 0, y: 0, active: false };
  }

  function isEnabled() {
    return enabled && isMobileDevice();
  }

  function setEnabled(val) {
    enabled = val;
    if (joystick) joystick.element.style.display = val && isMobileDevice() ? 'flex' : 'none';
    buttons.forEach(btn => btn.style.display = val && isMobileDevice() ? 'flex' : 'none');
  }

  return {
    init,
    createButton,
    onMove,
    onButton,
    onSwipe,
    getJoystickState,
    isEnabled,
    setEnabled,
    isMobileDevice
  };
})();

if (typeof window !== "undefined") window.MobileControlsManager = MobileControlsManager;
