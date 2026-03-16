// nombre-marca.js — Generador de Nombres de Marca
// 5 propuestas con concepto, historia y brandabilidad

import { askGroq, hasApiKey } from '../../../js/groq.js';
import { renderApiKeyPanel, renderChangeKeyButton } from '../../../js/apikey-panel.js';

const lang = localStorage.getItem('artefactos_lang') || 'es';
const FAV_KEY = 'artefactos_marca_favs';

let estiloActivo = 'Evocador';
let generando = false;
let ultimosBriefing = {};

const txt = {
  es: {
    titulo: 'Nombre de Marca', sub: 'Describe tu negocio. Recibe 5 nombres únicos.',
    desc_placeholder: 'Ej: app de meditación para desarrolladores',
    valores_placeholder: 'Ej: calma, foco, minimalismo',
    sector: 'Sector', estilo: 'Estilo de nombre',
    sectores: ['Tech', 'Salud', 'Educación', 'Moda', 'Alimentación', 'Servicios', 'Otro'],
    estilos: ['Inventado', 'Descriptivo', 'Evocador', 'Acrónimo', 'Metafórico'],
    generar: 'Generar nombres', generando: 'Generando...',
    regenerar: 'Regenerar', fav: '♡', favActive: '♥',
    favoritos: 'Mis favoritos',
    badge: 'creatividad', galeria: '← Galería',
    error: 'Error al generar. Intenta de nuevo.',
    brandabilidad: 'Brandabilidad'
  },
  en: {
    titulo: 'Brand Name', sub: 'Describe your business. Get 5 unique names.',
    desc_placeholder: 'Ex: meditation app for developers',
    valores_placeholder: 'Ex: calm, focus, minimalism',
    sector: 'Industry', estilo: 'Name style',
    sectores: ['Tech', 'Health', 'Education', 'Fashion', 'Food', 'Services', 'Other'],
    estilos: ['Invented', 'Descriptive', 'Evocative', 'Acronym', 'Metaphorical'],
    generar: 'Generate names', generando: 'Generating...',
    regenerar: 'Regenerate', fav: '♡', favActive: '♥',
    favoritos: 'My favorites',
    badge: 'creativity', galeria: '← Gallery',
    error: 'Error generating. Try again.',
    brandabilidad: 'Brandability'
  }
};
const t = txt[lang] || txt.es;

function init() {
  if (!hasApiKey()) { renderApiKeyPanel('app', () => renderArtefacto(), lang); return; }
  renderArtefacto();
}

function renderArtefacto() {
  const app = document.getElementById('app');
  app.innerHTML = `
    <header class="art-header">
      <div class="art-header-left">
        <a href="../../../index.html" class="back-link">${t.galeria}</a>
        <span class="cat-badge">${t.badge}</span>
      </div>
      <div id="key-btn-wrap"></div>
    </header>
    <div class="main-wrap">
      <h1>${t.titulo}</h1>
      <p class="subtitulo">${t.sub}</p>
      <div class="form-grid">
        <input type="text" id="desc-input" class="campo campo-full" placeholder="${t.desc_placeholder}" />
        <input type="text" id="valores-input" class="campo" placeholder="${t.valores_placeholder}" />
        <select id="sector-select" class="campo">
          ${t.sectores.map((s, i) => `<option value="${txt.es.sectores[i]}">${s}</option>`).join('')}
        </select>
      </div>
      <div class="selector-grupo">
        <span class="selector-label">${t.estilo}</span>
        <div class="pills" id="estilos">
          ${t.estilos.map((e, i) => `<button class="pill${txt.es.estilos[i] === estiloActivo ? ' active' : ''}" data-val="${txt.es.estilos[i]}">${e}</button>`).join('')}
        </div>
      </div>
      <button id="btn-generar" class="btn-principal">${t.generar}</button>
      <div id="nombres-grid" class="nombres-grid"></div>
      <div id="acciones-post" class="acciones-post" style="display:none">
        <button id="btn-regenerar" class="btn-sec">${t.regenerar}</button>
      </div>
      <details class="favoritos-panel" id="fav-panel">
        <summary>${t.favoritos} (<span id="fav-count">0</span>)</summary>
        <div id="fav-list"></div>
      </details>
    </div>
  `;
  renderChangeKeyButton('key-btn-wrap', lang);

  document.getElementById('estilos').addEventListener('click', e => {
    const p = e.target.closest('.pill'); if (!p) return;
    document.querySelectorAll('#estilos .pill').forEach(x => x.classList.remove('active'));
    p.classList.add('active'); estiloActivo = p.dataset.val;
  });
  document.getElementById('btn-generar').addEventListener('click', generar);
  document.getElementById('btn-regenerar').addEventListener('click', generar);
  renderFavoritos();
}

async function generar() {
  const desc = document.getElementById('desc-input').value.trim();
  const valores = document.getElementById('valores-input').value.trim();
  const sector = document.getElementById('sector-select').value;
  if (!desc || generando) return;

  ultimosBriefing = { desc, valores, sector };
  const btn = document.getElementById('btn-generar');
  const grid = document.getElementById('nombres-grid');
  generando = true; btn.disabled = true; btn.textContent = t.generando;
  grid.innerHTML = '<p class="loading">...</p>';

  const idioma = lang === 'en' ? 'English' : 'Spanish';
  const systemPrompt = `Eres un experto en naming de marcas con experiencia en el mercado latinoamericano. Respondes en ${idioma}.
Negocio: ${desc}
Valores: ${valores || 'No especificados'}
Sector: ${sector}
Estilo de nombre: ${estiloActivo}

Genera exactamente 5 propuestas de nombre. Responde SOLO en este formato JSON (sin markdown):
[
  {
    "nombre": "NombrePropuesto",
    "concepto": "El concepto central del nombre en 1 oración",
    "historia": "Por qué este nombre funciona para esta marca, 2-3 oraciones",
    "dominio_sugerido": ".com o .io o .pro o .co — el que mejor encaje",
    "brandabilidad": número del 1 al 5,
    "pronunciacion": "fácil / media / difícil"
  }
]
Criterios:
- Nombres memorables, únicos, no genéricos.
- Que funcionen en español e inglés si es posible.
- Evitar nombres ya usados por grandes marcas conocidas.
- Variedad: los 5 deben ser conceptualmente distintos entre sí.`;

  try {
    const raw = await llamarGroq({ systemPrompt, userMessage: desc, temperature: 0.9, maxTokens: 800 });
    if (!raw) return;
    const nombres = parseJSON(raw);
    if (!nombres || !Array.isArray(nombres)) throw new Error('parse');
    renderNombres(nombres);
    document.getElementById('acciones-post').style.display = 'flex';
  } catch (err) { grid.innerHTML = `<p class="loading">${t.error}</p>`; }
  finally { generando = false; btn.disabled = false; btn.textContent = t.generar; }
}

function renderNombres(nombres) {
  const grid = document.getElementById('nombres-grid');
  const favs = JSON.parse(localStorage.getItem(FAV_KEY) || '[]');
  grid.innerHTML = nombres.map((n, i) => {
    const isFav = favs.some(f => f.nombre === n.nombre);
    const estrellas = '★'.repeat(n.brandabilidad || 3) + '☆'.repeat(5 - (n.brandabilidad || 3));
    return `<div class="nombre-card${isFav ? ' fav' : ''}" style="animation-delay:${i * 0.1}s" data-idx="${i}">
      <button class="btn-fav${isFav ? ' active' : ''}" data-nombre='${JSON.stringify(n).replace(/'/g, '&#39;')}'>${isFav ? t.favActive : t.fav}</button>
      <div class="nombre-grande">${n.nombre}</div>
      <div class="nombre-concepto">${n.concepto}</div>
      <div class="nombre-historia">${n.historia}</div>
      <div class="nombre-meta">
        <span class="dominio">${n.nombre.toLowerCase()}${n.dominio_sugerido || '.com'}</span>
        <span class="estrellas" title="${t.brandabilidad}">${estrellas}</span>
      </div>
    </div>`;
  }).join('');

  grid.querySelectorAll('.btn-fav').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      const data = JSON.parse(btn.dataset.nombre);
      toggleFav(data, btn);
    });
  });
}

function toggleFav(nombre, btn) {
  let favs = JSON.parse(localStorage.getItem(FAV_KEY) || '[]');
  const exists = favs.findIndex(f => f.nombre === nombre.nombre);
  if (exists >= 0) {
    favs.splice(exists, 1);
    btn.textContent = t.fav;
    btn.classList.remove('active');
    btn.closest('.nombre-card').classList.remove('fav');
  } else {
    favs.unshift(nombre);
    if (favs.length > 15) favs.pop();
    btn.textContent = t.favActive;
    btn.classList.add('active');
    btn.closest('.nombre-card').classList.add('fav');
  }
  localStorage.setItem(FAV_KEY, JSON.stringify(favs));
  renderFavoritos();
}

function renderFavoritos() {
  const favs = JSON.parse(localStorage.getItem(FAV_KEY) || '[]');
  const countEl = document.getElementById('fav-count');
  const listEl = document.getElementById('fav-list');
  if (!countEl) return;
  countEl.textContent = favs.length;
  listEl.innerHTML = favs.map(f => `
    <div class="fav-item">
      <span class="fav-nombre">${f.nombre}</span> — ${f.concepto}
    </div>
  `).join('');
}

function parseJSON(raw) {
  try {
    // Limpiar posibles backticks y texto extra
    let limpio = raw.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
    const inicio = limpio.indexOf('[');
    const fin = limpio.lastIndexOf(']');
    if (inicio >= 0 && fin > inicio) limpio = limpio.substring(inicio, fin + 1);
    return JSON.parse(limpio);
  } catch { return null; }
}

async function llamarGroq(params) {
  try { return await askGroq(params); }
  catch (err) {
    if (err.message === 'NO_KEY' || err.message === 'INVALID_KEY') {
      renderApiKeyPanel('app', () => renderArtefacto(), lang); return null;
    }
    throw err;
  }
}

document.addEventListener('DOMContentLoaded', init);
