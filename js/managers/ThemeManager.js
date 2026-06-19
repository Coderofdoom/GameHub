/**
 * ThemeManager — Global theme management with dark/light modes and custom colors
 */
const ThemeManager = (() => {
  const THEMES = {
    dark: {
      name: 'Dark',
      bg: '#050816',
      card: 'rgba(15, 23, 42, 0.75)',
      text: '#ffffff',
      cyan: '#00f7ff',
      purple: '#c300ff',
      green: '#00ff88',
      accent: '#ff4466'
    },
    light: {
      name: 'Light',
      bg: '#f5f7fa',
      card: 'rgba(255, 255, 255, 0.9)',
      text: '#1a1a2e',
      cyan: '#0088cc',
      purple: '#8800dd',
      green: '#00aa44',
      accent: '#ff2244'
    },
    neon: {
      name: 'Neon',
      bg: '#000000',
      card: 'rgba(10, 10, 20, 0.95)',
      text: '#ffffff',
      cyan: '#00ffff',
      purple: '#ff00ff',
      green: '#00ff00',
      accent: '#ffff00'
    }
  };

  let currentTheme = 'dark';
  const listeners = [];

  function init(saved = 'dark') {
    currentTheme = THEMES[saved] ? saved : 'dark';
    apply();
  }

  function apply() {
    const theme = THEMES[currentTheme];
    const root = document.documentElement;
    root.style.setProperty('--bg', theme.bg);
    root.style.setProperty('--card', theme.card);
    root.style.setProperty('--text', theme.text);
    root.style.setProperty('--cyan', theme.cyan);
    root.style.setProperty('--purple', theme.purple);
    root.style.setProperty('--green', theme.green);
    root.style.setProperty('--accent', theme.accent);
    
    notifyListeners();
  }

  function set(themeName) {
    if (THEMES[themeName]) {
      currentTheme = themeName;
      apply();
      return true;
    }
    return false;
  }

  function get() {
    return THEMES[currentTheme];
  }

  function getCurrent() {
    return currentTheme;
  }

  function getAll() {
    return Object.keys(THEMES);
  }

  function setCustom(property, value) {
    const theme = THEMES[currentTheme];
    theme[property] = value;
    apply();
  }

  function onChange(callback) {
    listeners.push(callback);
  }

  function notifyListeners() {
    listeners.forEach(cb => cb(currentTheme, THEMES[currentTheme]));
  }

  return {
    init,
    apply,
    set,
    get,
    getCurrent,
    getAll,
    setCustom,
    onChange,
    THEMES
  };
})();

if (typeof window !== "undefined") window.ThemeManager = ThemeManager;
