// eslogan.js — Generador de Eslóganes Creativos
// 6 enfoques: Emocional, Racional, Humorístico, Aspiracional, Minimalista, Provocador

import { askGroq, hasApiKey } from '../../../js/groq.js';
import { renderApiKeyPanel, renderChangeKeyButton } from '../../../js/apikey-panel.js';

const lang = localStorage.getItem('artefactos_lang') || 'es';
const FAV_KEY = 'artefactos_eslogan_favs';

let idiomaSlogan = 'ES';
let generando = false;

const txt = {
  es: {
    titulo: 'Eslogan Creativo', sub: 'Tu marca merece una frase que resuene.',
    marca_ph: 'Nombre de tu marca',
    desc_ph: 'Describe tu producto o servicio',
    audiencia_ph: 'Audiencia objetivo',
    idioma: 'Idioma del eslogan',
    idiomas: ['ES', 'EN', 'Ambos'],
    generar: 'Generar esloganes', generando: 'Generando...',
    regenerar: '↻ Regenerar', copiar: 'Copiar', copiado: '✓',
    fav: '♡', favActive: '♥', favoritos: 'Mis favoritos',
    badge: 'creatividad', galeria: '← Galería',
    error: 'Error al generar. Intenta de nuevo.',
    enfoques: { Emocional: 'Emocional', Racional: 'Racional', Humorístico: 'Humor', Aspiracional: 'Aspiracional', Minimalista: 'Minimal', Provocador: 'Provocador' }
  },
  en: {
    titulo: 'Creative Slogan', sub: 'Your brand deserves a phrase that resonates.',
    marca_ph: 'Your brand name',
    desc_ph: 'Describe your product or service',
    audiencia_ph: 'Target audience',
    idioma: 'Slogan language',
    idiomas: ['ES', 'EN', 'Both'],
    generar: 'Generate slogans', generando: 'Generating...',
    regenerar: '↻ Regenerate', copiar: 'Copy', copiado: '✓',
    fav: '♡', favActive: '♥', favoritos: 'My favorites',
    badge: 'creativity', galeria: '← Gallery',
    error: 'Error generating. Try again.',
    enfoques: { Emocional: 'Emotional', Racional: 'Rational', Humorístico: 'Humor', Aspiracional: 'Aspirational', Minimalista: 'Minimal', Provocador: 'Provocative' }
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
      <div class="form-stack">
        <input type="text" id="marca-input" class="campo" placeholder="${t.marca_ph}" maxlength="60" />
        <input type="text" id="desc-input" class="campo" placeholder="${t.desc_ph}" maxlength="200" />
        <input type="text" id="audiencia-input" class="campo" placeholder="${t.audiencia_ph}" maxlength="100" />
      </div>
      <div class="selector-grupo">
        <span class="selector-label">${t.idioma}</span>
        <div class="pills" id="idioma-pills">
          ${t.idiomas.map((id, i) => `<button class="pill${txt.es.idiomas[i] === idiomaSlogan ? ' active' : ''}" data-val="${txt.es.idiomas[i]}">${id}</button>`).join('')}
        </div>
      </div>
      <button id="btn-generar" class="btn-principal">${t.generar}</button>
      <div id="esloganes-list" class="esloganes-list"></div>
      <div id="acciones-post" class="acciones-post" style="display:none">
        <button id="btn-regenerar" class="btn-sec">${t.regenerar}</button>
      </div>
      <details class="favoritos-panel" id="fav-panel" style="margin-top:1.5rem;">
        <summary style="cursor:pointer;color:var(--texto-sec);font-size:0.85rem;">${t.favoritos} (<span id="fav-count">0</span>)</summary>
        <div id="fav-list" style="margin-top:0.5rem;"></div>
      </details>
    </div>
  `;
  renderChangeKeyButton('key-btn-wrap', lang);

  document.getElementById('idioma-pills').addEventListener('click', e => {
    const p = e.target.closest('.pill'); if (!p) return;
    document.querySelectorAll('#idioma-pills .pill').forEach(x => x.classList.remove('active'));
    p.classList.add('active'); idiomaSlogan = p.dataset.val;
  });
  document.getElementById('btn-generar').addEventListener('click', generar);
  document.getElementById('btn-regenerar').addEventListener('click', generar);
  renderFavoritos();
}

async function generar() {
  const marca = document.getElementById('marca-input').value.trim();
  const desc = document.getElementById('desc-input').value.trim();
  const audiencia = document.getElementById('audiencia-input').value.trim();
  if (!marca || generando) return;

  const btn = document.getElementById('btn-generar');
  const lista = document.getElementById('esloganes-list');
  generando = true; btn.disabled = true; btn.textContent = t.generando;
  lista.innerHTML = '<p class="loading">...</p>';

  const idiomaTexto = idiomaSlogan === 'Ambos' ? 'español e inglés'
    : idiomaSlogan === 'EN' ? 'inglés' : 'español';

  const systemPrompt = `Eres un copywriter creativo de primer nivel.
Marca: ${marca}
Descripción: ${desc || 'No especificada'}
Audiencia: ${audiencia || 'General'}
Idioma de los esloganes: ${idiomaTexto}

Genera exactamente 6 esloganes, uno por cada enfoque:
1. Emocional — apela a sentimientos profundos
2. Racional — destaca beneficios concretos
3. Humorístico — usa ingenio y humor
4. Aspiracional — inspira y eleva
5. Minimalista — máximo impacto con mínimas palabras (≤5 palabras)
6. Provocador — desafía, genera curiosidad

Responde SOLO con este JSON (sin markdown ni texto extra):
[
  {"enfoque":"Emocional","eslogan":"..."},
  {"enfoque":"Racional","eslogan":"..."},
  {"enfoque":"Humorístico","eslogan":"..."},
  {"enfoque":"Aspiracional","eslogan":"..."},
  {"enfoque":"Minimalista","eslogan":"..."},
  {"enfoque":"Provocador","eslogan":"..."}
]
Reglas:
- Cada eslogan debe ser memorable, corto (máx 10 palabras, el Minimalista ≤5).
- No usar comillas dentro del eslogan.
- Que suenen profesionales, dignos de una campaña real.`;

  try {
    const raw = await llamarGroq({ systemPrompt, userMessage: `Marca: ${marca}`, temperature: 0.9, maxTokens: 500 });
    if (!raw) return;
    const esloganes = parseJSON(raw);
    if (!esloganes || !Array.isArray(esloganes)) throw new Error('parse');
    renderEsloganes(esloganes);
    document.getElementById('acciones-post').style.display = 'flex';
  } catch { lista.innerHTML = `<p class="loading">${t.error}</p>`; }
  finally { generando = false; btn.disabled = false; btn.textContent = t.generar; }
}

function renderEsloganes(esloganes) {
  const lista = document.getElementById('esloganes-list');
  const favs = JSON.parse(localStorage.getItem(FAV_KEY) || '[]');

  lista.innerHTML = esloganes.map((s, i) => {
    const isFav = favs.some(f => f.eslogan === s.eslogan);
    const label = t.enfoques[s.enfoque] || s.enfoque;
    return `<div class="eslogan-row" style="animation: fadeUp 0.4s ease both;animation-delay:${i * 0.08}s">
      <span class="eslogan-enfoque">${label}</span>
      <span class="eslogan-texto">${s.eslogan}</span>
      <div class="eslogan-acciones">
        <button class="btn-mini btn-copiar" data-texto="${s.eslogan.replace(/"/g, '&quot;')}">${t.copiar}</button>
        <button class="btn-mini btn-fav${isFav ? ' copiado' : ''}" data-obj='${JSON.stringify(s).replace(/'/g, '&#39;')}'>${isFav ? t.favActive : t.fav}</button>
      </div>
    </div>`;
  }).join('');

  lista.querySelectorAll('.btn-copiar').forEach(btn => {
    btn.addEventListener('click', () => {
      navigator.clipboard.writeText(btn.dataset.texto).then(() => {
        btn.textContent = t.copiado;
        setTimeout(() => btn.textContent = t.copiar, 1200);
      });
    });
  });

  lista.querySelectorAll('.btn-fav').forEach(btn => {
    btn.addEventListener('click', () => {
      const data = JSON.parse(btn.dataset.obj);
      toggleFav(data, btn);
    });
  });
}

function toggleFav(eslogan, btn) {
  let favs = JSON.parse(localStorage.getItem(FAV_KEY) || '[]');
  const idx = favs.findIndex(f => f.eslogan === eslogan.eslogan);
  if (idx >= 0) {
    favs.splice(idx, 1);
    btn.textContent = t.fav; btn.classList.remove('copiado');
  } else {
    favs.unshift(eslogan);
    if (favs.length > 20) favs.pop();
    btn.textContent = t.favActive; btn.classList.add('copiado');
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
    <div style="padding:0.4rem 0;border-bottom:1px solid rgba(255,255,255,0.04);font-size:0.85rem;">
      <span style="color:var(--texto-muted);font-size:0.7rem;margin-right:0.4rem;">${t.enfoques[f.enfoque] || f.enfoque}</span>
      <span style="font-family:'Bebas Neue',sans-serif;font-size:1.1rem;">${f.eslogan}</span>
    </div>
  `).join('');
}

function parseJSON(raw) {
  try {
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
