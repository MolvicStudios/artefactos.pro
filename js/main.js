// main.js v2 — Artefactos.pro gallery controller
// Imports from modular architecture

import { CATALOGO, getLive } from './catalogo.js';
import { initTheme } from './theme.js';
import { initSearch } from './search.js';
import { initPWA } from './pwa.js';
import { translations, detectLang, setLang } from './i18n.js';

// ───────── State ─────────
let lang = detectLang();

// ───────── DOM refs ─────────
const grid = document.getElementById('grid');
const emptyState = document.getElementById('empty-state');
const liveCount = document.getElementById('live-count');
const langToggle = document.getElementById('lang-toggle');

// ───────── Category label map ─────────
const CAT_LABELS = {
  es: { diversion: 'Diversión', productividad: 'Productividad', research: 'Research', creatividad: 'Creatividad', educacion: 'Educación' },
  en: { diversion: 'Fun', productividad: 'Productivity', research: 'Research', creatividad: 'Creativity', educacion: 'Education' }
};

// ───────── Render card ─────────
function renderCard(item, index) {
  const nombre = lang === 'en' ? item.nombre_en : item.nombre_es;
  const desc = lang === 'en' ? item.desc_en : item.desc_es;
  const isLive = item.estado === 'live';
  const catLabel = CAT_LABELS[lang]?.[item.categoria] || item.categoria;
  const badgeText = isLive
    ? catLabel
    : (lang === 'en' ? 'Coming soon' : 'Próximamente');

  const card = document.createElement('a');
  card.className = `card reveal${isLive ? '' : ' proximamente'}`;
  card.style.setProperty('--i', index);
  card.style.setProperty('--card-accent', `var(--cat-${item.categoria})`);
  if (isLive) {
    card.href = item.ruta;
  }
  card.setAttribute('aria-label', nombre);

  card.innerHTML = `
    <span class="card-icon">${item.icono}</span>
    <span class="card-badge" data-cat="${item.categoria}">${badgeText}</span>
    <h3 class="card-name">${nombre}</h3>
    <p class="card-desc">${desc}</p>
  `;

  return card;
}

// ───────── Render grid ─────────
function renderGrid(query, cat) {
  const filtered = CATALOGO.filter(item => {
    // Category filter
    if (cat && cat !== 'todos' && item.categoria !== cat) return false;
    // Search filter
    if (query) {
      const q = query.toLowerCase();
      const haystack = [
        item.nombre_es, item.nombre_en,
        item.desc_es, item.desc_en,
        item.categoria, item.id
      ].join(' ').toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    return true;
  });

  grid.innerHTML = '';
  if (filtered.length === 0) {
    emptyState.hidden = false;
    return;
  }
  emptyState.hidden = true;

  filtered.forEach((item, i) => {
    grid.appendChild(renderCard(item, i));
  });

  // Scroll reveal with IntersectionObserver
  observeCards();
}

// ───────── Scroll reveal ─────────
let observer;
function observeCards() {
  if (observer) observer.disconnect();
  observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });

  document.querySelectorAll('.card.reveal').forEach(card => {
    observer.observe(card);
  });
}

// ───────── Live counter ─────────
function updateCounter() {
  if (liveCount) {
    liveCount.textContent = getLive().length;
  }
}

// ───────── i18n: apply translations to DOM ─────────
function applyI18n() {
  // Translate data-i18n elements
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.dataset.i18n;
    const tr = translations[lang];
    if (tr && tr[key]) el.textContent = tr[key];
  });
  // Translate placeholders
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    const key = el.dataset.i18nPlaceholder;
    const tr = translations[lang];
    if (tr && tr[key]) el.placeholder = tr[key];
  });
  // Update lang toggle button
  if (langToggle) {
    langToggle.textContent = lang === 'es' ? 'EN' : 'ES';
  }
  // Update HTML lang attribute
  document.documentElement.lang = lang;
}

// ───────── Language toggle ─────────
function initLangToggle() {
  if (!langToggle) return;
  langToggle.addEventListener('click', () => {
    lang = lang === 'es' ? 'en' : 'es';
    setLang(lang);
    applyI18n();
    // Re-render grid to update card texts
    const searchInput = document.getElementById('search-input');
    const activeFilter = document.querySelector('.filter-btn.active');
    const query = searchInput ? searchInput.value.trim().toLowerCase() : '';
    const cat = activeFilter ? activeFilter.dataset.filter : 'todos';
    renderGrid(query, cat);
  });
}

// ───────── Init ─────────
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initPWA();
  initLangToggle();
  applyI18n();
  updateCounter();
  initSearch(renderGrid);
});
