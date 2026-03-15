// theme.js — Dark/Light mode toggle with localStorage persistence
// Anti-FOUC: inline <script> in <head> sets data-theme before CSS loads
// This module handles the toggle button and sync

const STORAGE_KEY = 'artefactos_theme';

export function initTheme() {
  const toggle = document.getElementById('theme-toggle');
  if (!toggle) return;

  toggle.addEventListener('click', () => {
    const current = document.documentElement.getAttribute('data-theme');
    const next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem(STORAGE_KEY, next);
    updateToggleIcon(toggle, next);
  });

  const theme = document.documentElement.getAttribute('data-theme') || 'dark';
  updateToggleIcon(toggle, theme);
}

function updateToggleIcon(btn, theme) {
  btn.setAttribute('aria-label', theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro');
  btn.textContent = theme === 'dark' ? '☀️' : '🌙';
}
