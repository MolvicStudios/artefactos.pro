// reescritor.js — Reescritor de Estilo
// 5 reescrituras: Minimalista, Barroco, Cinematográfico, Lírico, Irónico

import { askGroq, hasApiKey } from '../../../js/groq.js';
import { renderApiKeyPanel, renderChangeKeyButton } from '../../../js/apikey-panel.js';

const lang = localStorage.getItem('artefactos_lang') || 'es';
let intensidad = 2; // 1-3
let generando = false;

const ESTILOS = ['Minimalista', 'Barroco', 'Cinematográfico', 'Lírico', 'Irónico'];

const txt = {
  es: {
    titulo: 'Reescritor de Estilo',
    sub: 'Pega un texto y recibe 5 versiones en estilos literarios distintos.',
    placeholder: 'Pega aquí tu texto para reescribir…',
    intensidad: 'Intensidad de transformación',
    niveles: ['Sutil', 'Moderada', 'Extrema'],
    generar: 'Reescribir', generando: 'Reescribiendo…',
    copiar: 'Copiar', copiado: '✓',
    estilos: {
      Minimalista: 'Minimalista', Barroco: 'Barroco',
      'Cinematográfico': 'Cinematográfico', 'Lírico': 'Lírico', 'Irónico': 'Irónico'
    },
    badge: 'creatividad', galeria: '← Galería',
    error: 'Error al reescribir. Intenta de nuevo.'
  },
  en: {
    titulo: 'Style Rewriter',
    sub: 'Paste text and receive 5 versions in different literary styles.',
    placeholder: 'Paste your text here to rewrite…',
    intensidad: 'Transformation intensity',
    niveles: ['Subtle', 'Moderate', 'Extreme'],
    generar: 'Rewrite', generando: 'Rewriting…',
    copiar: 'Copy', copiado: '✓',
    estilos: {
      Minimalista: 'Minimalist', Barroco: 'Baroque',
      'Cinematográfico': 'Cinematic', 'Lírico': 'Lyrical', 'Irónico': 'Ironic'
    },
    badge: 'creativity', galeria: '← Gallery',
    error: 'Error rewriting. Try again.'
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
      <textarea id="texto-input" class="textarea-input" placeholder="${t.placeholder}" maxlength="3000"></textarea>
      <div class="intensidad-grupo">
        <span class="intensidad-label">${t.intensidad}</span>
        <div class="slider-wrap">
          <input type="range" id="slider-intensidad" min="1" max="3" value="${intensidad}" step="1" />
          <span class="slider-value" id="intensidad-label">${t.niveles[intensidad - 1]}</span>
        </div>
      </div>
      <button id="btn-generar" class="btn-principal">${t.generar}</button>
      <div id="estilos-grid" class="estilos-grid"></div>
    </div>
  `;
  renderChangeKeyButton('key-btn-wrap', lang);

  document.getElementById('slider-intensidad').addEventListener('input', e => {
    intensidad = parseInt(e.target.value);
    document.getElementById('intensidad-label').textContent = t.niveles[intensidad - 1];
  });
  document.getElementById('btn-generar').addEventListener('click', reescribir);
}

async function reescribir() {
  const texto = document.getElementById('texto-input').value.trim();
  if (!texto || texto.length < 20 || generando) return;

  const btn = document.getElementById('btn-generar');
  const grid = document.getElementById('estilos-grid');
  generando = true; btn.disabled = true; btn.textContent = t.generando;
  grid.innerHTML = '<p class="loading">...</p>';

  const idioma = lang === 'en' ? 'English' : 'Spanish';
  const nivelDesc = ['ligeramente (cambios mínimos, misma estructura)',
    'moderadamente (reestructura y cambia vocabulario)',
    'extremadamente (transformación radical, casi irreconocible)'][intensidad - 1];

  const systemPrompt = `Eres un escritor versátil capaz de transformar textos a cualquier estilo literario. Responde en ${idioma}.

Texto original a reescribir:
"${texto}"

Reescribe el texto en estos 5 estilos, cada uno transformado ${nivelDesc}:

1. Minimalista — frases cortas, sin adornos, esencial
2. Barroco — ornamental, vocabulario rico, oraciones largas y complejas
3. Cinematográfico — visual, como voz en off de película, sensorial
4. Lírico — poético, con ritmo y cadencia, evocador
5. Irónico — sarcástico e ingenioso, doble sentido

Responde SOLO en JSON (sin markdown):
[
  {"estilo":"Minimalista","texto":"..."},
  {"estilo":"Barroco","texto":"..."},
  {"estilo":"Cinematográfico","texto":"..."},
  {"estilo":"Lírico","texto":"..."},
  {"estilo":"Irónico","texto":"..."}
]
Reglas:
- Cada reescritura mantiene el sentido del original.
- Longitud similar al original (±30%).
- Cada estilo debe ser distintivo y coherente.`;

  try {
    const raw = await llamarGroq({ systemPrompt, userMessage: texto, temperature: 0.85, maxTokens: 1200 });
    if (!raw) return;
    const versiones = parseJSON(raw);
    if (!versiones || !Array.isArray(versiones)) throw new Error('parse');
    renderEstilos(versiones);
  } catch { grid.innerHTML = `<p class="loading">${t.error}</p>`; }
  finally { generando = false; btn.disabled = false; btn.textContent = t.generar; }
}

function renderEstilos(versiones) {
  const grid = document.getElementById('estilos-grid');
  grid.innerHTML = versiones.map((v, i) => {
    const nombre = t.estilos[v.estilo] || v.estilo;
    return `<div class="estilo-card" data-estilo="${v.estilo}" style="animation-delay:${i * 0.15}s">
      <div class="estilo-header">
        <span class="estilo-nombre">${nombre}</span>
        <button class="btn-mini btn-copiar" data-texto="${v.texto.replace(/"/g, '&quot;')}">${t.copiar}</button>
      </div>
      <div class="estilo-body">${v.texto}</div>
    </div>`;
  }).join('');

  grid.querySelectorAll('.btn-copiar').forEach(btn => {
    btn.addEventListener('click', () => {
      navigator.clipboard.writeText(btn.dataset.texto).then(() => {
        btn.textContent = t.copiado;
        setTimeout(() => btn.textContent = t.copiar, 1200);
      });
    });
  });
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
