// ==========================================
// Global Light/Dark Mode Theme Manager
// ==========================================

(function () {
  const THEME_KEY = 'layarfilm_theme';
  const LIGHT = 'light';
  const DARK = 'dark';

  // Apply stored theme immediately (prevent flash)
  function applyTheme(theme) {
    if (theme === LIGHT) {
      document.body.classList.add('light-mode');
      document.documentElement.classList.remove('light-mode-pending');
    } else {
      document.body.classList.remove('light-mode');
      document.documentElement.classList.remove('light-mode-pending');
    }
  }

  // Update toggle button icon
  function updateIcon(theme) {
    const btn = document.getElementById('theme-toggle-btn');
    if (!btn) return;
    const icon = btn.querySelector('i');
    if (!icon) return;
    if (theme === LIGHT) {
      icon.className = 'fas fa-sun';
      btn.title = 'Switch to Dark Mode';
    } else {
      icon.className = 'fas fa-moon';
      btn.title = 'Switch to Light Mode';
    }
  }

  // Get current persisted theme (default to dark)
  function getSavedTheme() {
    return localStorage.getItem(THEME_KEY) || DARK;
  }

  // Toggle between light and dark
  function toggleTheme() {
    const current = getSavedTheme();
    const next = current === DARK ? LIGHT : DARK;
    localStorage.setItem(THEME_KEY, next);
    applyTheme(next);
    updateIcon(next);
  }

  // Initialize theme on DOMContentLoaded
  document.addEventListener('DOMContentLoaded', function () {
    const savedTheme = getSavedTheme();
    applyTheme(savedTheme);
    updateIcon(savedTheme);

    const btn = document.getElementById('theme-toggle-btn');
    if (btn) {
      btn.addEventListener('click', toggleTheme);
    }
  });

  // Expose toggle globally in case needed
  window.toggleTheme = toggleTheme;
})();

