// main.js — Lógica principal de la galería artefactos.pro
// Renderiza tarjetas, filtros, búsqueda, idioma, cursor y animaciones

import { t, detectLang, setLang, translations } from './i18n.js';

// ========================================
// CATÁLOGO COMPLETO DE 50 ARTEFACTOS
// ========================================
const CATALOGO = [
  // — Entretenimiento (10) —
  { id: 'oraculo',           slug: 'gabinete/artefactos/oraculo/',           icono: '🔮', categoria: 'entretenimiento', estado: 'live' },
  { id: 'musicsage',         slug: 'gabinete/artefactos/musicsage/',         icono: '🎵', categoria: 'entretenimiento', estado: 'live' },
  { id: 'alquimista',        slug: 'gabinete/artefactos/alquimista/',        icono: '⚗️', categoria: 'entretenimiento', estado: 'live' },
  { id: 'duelo',             slug: 'gabinete/artefactos/duelo/',             icono: '⚔️', categoria: 'entretenimiento', estado: 'live' },
  { id: 'scriptorium',       slug: 'gabinete/artefactos/scriptorium/',       icono: '📜', categoria: 'entretenimiento', estado: 'live' },
  { id: 'maquina-tiempo',    slug: 'gabinete/artefactos/maquina-tiempo/',    icono: '⏱️', categoria: 'entretenimiento', estado: 'live' },
  { id: 'bestiario',         slug: 'gabinete/artefactos/bestiario/',         icono: '🐉', categoria: 'entretenimiento', estado: 'live' },
  { id: 'sinfonia',          slug: 'gabinete/artefactos/sinfonia/',          icono: '🎼', categoria: 'entretenimiento', estado: 'live' },
  { id: 'detective',         slug: 'artefactos/entretenimiento/detective/',  icono: '🔍', categoria: 'entretenimiento', estado: 'proximamente' },
  { id: 'trivia',            slug: 'artefactos/entretenimiento/trivia/',     icono: '🧩', categoria: 'entretenimiento', estado: 'proximamente' },

  // — Productividad (10) —
  { id: 'redactor-emails',   slug: 'artefactos/productividad/redactor-emails/',   icono: '✉️', categoria: 'productividad', estado: 'proximamente' },
  { id: 'resumidor',         slug: 'artefactos/productividad/resumidor/',         icono: '📋', categoria: 'productividad', estado: 'proximamente' },
  { id: 'generador-tareas',  slug: 'artefactos/productividad/generador-tareas/',  icono: '✅', categoria: 'productividad', estado: 'proximamente' },
  { id: 'mejorador-prompts', slug: 'artefactos/productividad/mejorador-prompts/', icono: '✨', categoria: 'productividad', estado: 'proximamente' },
  { id: 'traductor-tono',    slug: 'artefactos/productividad/traductor-tono/',    icono: '🎭', categoria: 'productividad', estado: 'proximamente' },
  { id: 'planificador',      slug: 'artefactos/productividad/planificador/',      icono: '📅', categoria: 'productividad', estado: 'proximamente' },
  { id: 'feedback-cv',       slug: 'artefactos/productividad/feedback-cv/',       icono: '📄', categoria: 'productividad', estado: 'proximamente' },
  { id: 'carta-presentacion',slug: 'artefactos/productividad/carta-presentacion/',icono: '💼', categoria: 'productividad', estado: 'proximamente' },
  { id: 'simplificador-legal',slug:'artefactos/productividad/simplificador-legal/',icono:'⚖️', categoria: 'productividad', estado: 'proximamente' },
  { id: 'asistente-reuniones',slug:'artefactos/productividad/asistente-reuniones/',icono:'🎙️', categoria: 'productividad', estado: 'proximamente' },

  // — Research (10) —
  { id: 'mapa-ideas',        slug: 'gabinete/artefactos/mapa-ideas/',        icono: '🕸️', categoria: 'research', estado: 'live' },
  { id: 'gabinete-objetos',  slug: 'gabinete/artefactos/gabinete-objetos/',  icono: '🏺', categoria: 'research', estado: 'live' },
  { id: 'comparador',        slug: 'artefactos/research/comparador/',        icono: '⚖️', categoria: 'research', estado: 'proximamente' },
  { id: 'dafo',              slug: 'artefactos/research/dafo/',              icono: '📊', categoria: 'research', estado: 'proximamente' },
  { id: 'detector-sesgos',   slug: 'artefactos/research/detector-sesgos/',   icono: '🔬', categoria: 'research', estado: 'proximamente' },
  { id: 'contraargumentador',slug: 'artefactos/research/contraargumentador/',icono: '🗣️', categoria: 'research', estado: 'proximamente' },
  { id: 'linea-tiempo',      slug: 'artefactos/research/linea-tiempo/',      icono: '📏', categoria: 'research', estado: 'proximamente' },
  { id: 'arbol-decision',    slug: 'artefactos/research/arbol-decision/',    icono: '🌳', categoria: 'research', estado: 'proximamente' },
  { id: 'analogias',         slug: 'artefactos/research/analogias/',         icono: '🔗', categoria: 'research', estado: 'proximamente' },
  { id: 'sintetizador',      slug: 'artefactos/research/sintetizador/',      icono: '🧬', categoria: 'research', estado: 'proximamente' },

  // — Creatividad (10) —
  { id: 'microrrelatos',     slug: 'artefactos/creatividad/microrrelatos/',     icono: '✍️', categoria: 'creatividad', estado: 'proximamente' },
  { id: 'taller-poesia',     slug: 'artefactos/creatividad/taller-poesia/',     icono: '🖊️', categoria: 'creatividad', estado: 'proximamente' },
  { id: 'nombre-marca',      slug: 'artefactos/creatividad/nombre-marca/',      icono: '💡', categoria: 'creatividad', estado: 'proximamente' },
  { id: 'eslogan',           slug: 'artefactos/creatividad/eslogan/',           icono: '📢', categoria: 'creatividad', estado: 'proximamente' },
  { id: 'continuador',       slug: 'artefactos/creatividad/continuador/',       icono: '📖', categoria: 'creatividad', estado: 'proximamente' },
  { id: 'critico-literario',slug: 'artefactos/creatividad/critico-literario/',  icono: '🎓', categoria: 'creatividad', estado: 'proximamente' },
  { id: 'worldbuilder',      slug: 'artefactos/creatividad/worldbuilder/',      icono: '🌍', categoria: 'creatividad', estado: 'proximamente' },
  { id: 'dialogo',           slug: 'artefactos/creatividad/dialogo/',           icono: '💬', categoria: 'creatividad', estado: 'proximamente' },
  { id: 'reescritor',        slug: 'artefactos/creatividad/reescritor/',        icono: '🔄', categoria: 'creatividad', estado: 'proximamente' },
  { id: 'scriptorium2',      slug: 'gabinete/artefactos/scriptorium/',          icono: '📜', categoria: 'creatividad', estado: 'live' },

  // — Educación (10) —
  { id: 'explicador',        slug: 'artefactos/educacion/explicador/',        icono: '🧠', categoria: 'educacion', estado: 'proximamente' },
  { id: 'flashcards',        slug: 'artefactos/educacion/flashcards/',        icono: '🃏', categoria: 'educacion', estado: 'proximamente' },
  { id: 'tutor-socratico',   slug: 'artefactos/educacion/tutor-socratico/',   icono: '🏛️', categoria: 'educacion', estado: 'proximamente' },
  { id: 'quiz',              slug: 'artefactos/educacion/quiz/',              icono: '❓', categoria: 'educacion', estado: 'proximamente' },
  { id: 'jerga-tecnica',     slug: 'artefactos/educacion/jerga-tecnica/',     icono: '🔤', categoria: 'educacion', estado: 'proximamente' },
  { id: 'simulador-entrevista',slug:'artefactos/educacion/simulador-entrevista/',icono:'🎯', categoria: 'educacion', estado: 'proximamente' },
  { id: 'mentor-idiomas',    slug: 'artefactos/educacion/mentor-idiomas/',    icono: '🗺️', categoria: 'educacion', estado: 'proximamente' },
  { id: 'resumen-academico', slug: 'artefactos/educacion/resumen-academico/', icono: '📚', categoria: 'educacion', estado: 'proximamente' },
  { id: 'casos-practicos',   slug: 'artefactos/educacion/casos-practicos/',   icono: '💼', categoria: 'educacion', estado: 'proximamente' },
  { id: 'bestiario-edu',     slug: 'gabinete/artefactos/bestiario/',          icono: '🐉', categoria: 'educacion', estado: 'live' },
];

// ========================================
// ESTADO GLOBAL
// ========================================
let lang = detectLang();
let filtroActivo = localStorage.getItem('artefactos_filtro') || 'all';
let busqueda = '';

// ========================================
// ELEMENTOS DEL DOM
// ========================================
const grid = document.getElementById('artefactos-grid');
const searchInput = document.getElementById('search-input');
const langToggle = document.getElementById('lang-toggle');
const catFilter = document.getElementById('cat-filter');
const countEl = document.getElementById('artefacto-count');
const subtitleEl = document.getElementById('site-subtitle');
const footerCredit = document.getElementById('footer-credit');
const cursor = document.getElementById('custom-cursor');

// ========================================
// INICIALIZACIÓN
// ========================================
document.addEventListener('DOMContentLoaded', () => {
  aplicarIdioma();
  aplicarFiltroDesdeHash();
  renderizarGrid();
  initCursorPersonalizado();
  initEventos();
});

// ========================================
// IDIOMA
// ========================================
function aplicarIdioma() {
  // Subtítulo
  subtitleEl.textContent = t(lang, 'site_subtitle');
  // Placeholder de búsqueda
  searchInput.placeholder = t(lang, 'search_placeholder');
  // Botón de idioma muestra el idioma contrario
  langToggle.textContent = lang === 'es' ? 'EN' : 'ES';
  langToggle.setAttribute('aria-label', lang === 'es' ? 'Switch to English' : 'Cambiar a español');
  // Footer
  footerCredit.textContent = t(lang, 'footer_credit');
  // Botones de filtro
  const botonesFiltro = catFilter.querySelectorAll('.cat-btn');
  const claves = ['filter_all', 'filter_entretenimiento', 'filter_productividad', 'filter_research', 'filter_creatividad', 'filter_educacion'];
  botonesFiltro.forEach((btn, i) => {
    btn.textContent = t(lang, claves[i]);
  });
  // Atributo lang del html
  document.documentElement.lang = lang;
}

function toggleIdioma() {
  lang = lang === 'es' ? 'en' : 'es';
  setLang(lang);
  aplicarIdioma();
  renderizarGrid();
}

// ========================================
// FILTROS
// ========================================
function aplicarFiltroDesdeHash() {
  const hash = location.hash.replace('#', '');
  if (hash && ['entretenimiento', 'productividad', 'research', 'creatividad', 'educacion'].includes(hash)) {
    filtroActivo = hash;
  }
  actualizarBotonesFiltro();
}

function actualizarBotonesFiltro() {
  catFilter.querySelectorAll('.cat-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.cat === filtroActivo);
  });
}

function setFiltro(cat) {
  filtroActivo = cat;
  localStorage.setItem('artefactos_filtro', cat);
  location.hash = cat === 'all' ? '' : cat;
  actualizarBotonesFiltro();
  renderizarGrid();
}

// ========================================
// BÚSQUEDA
// ========================================
function filtrarPorBusqueda(items) {
  if (!busqueda) return items;
  const q = busqueda.toLowerCase();
  return items.filter(item => {
    const nombre = t(lang, `${item.id}_nombre`).toLowerCase();
    const desc = t(lang, `${item.id}_desc`).toLowerCase();
    return nombre.includes(q) || desc.includes(q);
  });
}

// ========================================
// RENDERIZADO DEL GRID
// ========================================
function renderizarGrid() {
  // Filtrar por categoría
  let items = filtroActivo === 'all'
    ? [...CATALOGO]
    : CATALOGO.filter(a => a.categoria === filtroActivo);

  // Filtrar por búsqueda
  items = filtrarPorBusqueda(items);

  // Limpiar grid
  grid.innerHTML = '';

  if (items.length === 0) {
    grid.innerHTML = `<div class="no-results">${lang === 'es' ? 'No se encontraron artefactos.' : 'No artifacts found.'}</div>`;
    actualizarContador(0);
    return;
  }

  // Renderizar cada tarjeta con delay staggered
  items.forEach((item, index) => {
    const card = crearTarjeta(item, index);
    grid.appendChild(card);
  });

  // Inyectar slot mid-grid después de la segunda fila (aprox. 8 tarjetas)
  inyectarSlotMidGrid();

  // Actualizar contador
  actualizarContador(items.length);
}

function crearTarjeta(item, index) {
  const esLive = item.estado === 'live';
  const nombre = t(lang, `${item.id}_nombre`);
  const desc = t(lang, `${item.id}_desc`);
  const badgeText = t(lang, esLive ? 'badge_live' : 'badge_proximamente');
  const btnText = t(lang, esLive ? 'btn_entrar' : 'btn_proximamente');

  // Usar <a> para los live, <div> para próximamente
  const tag = esLive ? 'a' : 'div';
  const card = document.createElement(tag);
  card.className = `artefacto-card${esLive ? '' : ' artefacto-card--disabled'}`;
  card.dataset.cat = item.categoria;
  card.dataset.id = item.id;
  card.dataset.estado = item.estado;

  if (esLive) {
    card.href = item.slug;
  }

  // Delay de animación staggered
  card.style.animationDelay = `${index * 0.05}s`;

  card.innerHTML = `
    <div class="card-cat-indicator" data-cat="${item.categoria}"></div>
    <div class="card-header">
      <span class="card-icon">${item.icono}</span>
      <span class="card-badge card-badge--${item.estado}">${badgeText}</span>
    </div>
    <h3 class="card-name">${nombre}</h3>
    <p class="card-desc">${desc}</p>
    <span class="card-action card-action--${esLive ? 'live' : 'proximamente'}">${btnText}</span>
  `;

  return card;
}

function inyectarSlotMidGrid() {
  // Inyectar un slot de AdSense después de ~8 tarjetas (2ª fila en desktop)
  const tarjetas = grid.querySelectorAll('.artefacto-card');
  if (tarjetas.length > 8) {
    const midSlot = document.createElement('div');
    midSlot.className = 'ad-container';
    midSlot.id = 'ad-mid-wrap';
    // REEMPLAZAR SLOT_MID con el ID real de tu unidad de anuncio en AdSense
    midSlot.innerHTML = `
      <span class="ad-label">publicidad</span>
      <ins class="adsbygoogle" id="ad-mid"
           style="display:block"
           data-ad-client="ca-pub-1513893788851225"
           data-ad-slot="SLOT_MID"
           data-ad-format="auto"
           data-full-width-responsive="true"></ins>
    `;
    // Insertar después de la tarjeta nº 8
    tarjetas[7].after(midSlot);

    // Inicializar slot si AdSense está disponible
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (e) { /* adblocker activo */ }
  }
}

function actualizarContador(total) {
  countEl.textContent = `${total} ${t(lang, 'count_label')}`;
}

// ========================================
// CURSOR PERSONALIZADO
// ========================================
function initCursorPersonalizado() {
  // Solo en dispositivos con puntero fino (no touch)
  if (!matchMedia('(hover: hover) and (pointer: fine)').matches) return;

  document.addEventListener('mousemove', (e) => {
    cursor.style.left = `${e.clientX}px`;
    cursor.style.top = `${e.clientY}px`;
    if (!cursor.classList.contains('visible')) {
      cursor.classList.add('visible');
    }
  });

  document.addEventListener('mouseleave', () => {
    cursor.classList.remove('visible');
  });

  // Efecto hover en elementos interactivos
  document.addEventListener('mouseover', (e) => {
    if (e.target.closest('a, button, input, .artefacto-card:not(.artefacto-card--disabled)')) {
      cursor.classList.add('hover');
    }
  });
  document.addEventListener('mouseout', (e) => {
    if (e.target.closest('a, button, input, .artefacto-card:not(.artefacto-card--disabled)')) {
      cursor.classList.remove('hover');
    }
  });
}

// ========================================
// EVENTOS
// ========================================
function initEventos() {
  // Cambio de idioma
  langToggle.addEventListener('click', toggleIdioma);

  // Filtros de categoría (delegación)
  catFilter.addEventListener('click', (e) => {
    const btn = e.target.closest('.cat-btn');
    if (!btn) return;
    setFiltro(btn.dataset.cat);
  });

  // Búsqueda en tiempo real
  searchInput.addEventListener('input', (e) => {
    busqueda = e.target.value.trim();
    renderizarGrid();
  });

  // Reaccionar a cambio de hash
  window.addEventListener('hashchange', () => {
    aplicarFiltroDesdeHash();
    renderizarGrid();
  });
}
