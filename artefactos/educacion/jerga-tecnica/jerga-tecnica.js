// jerga-tecnica.js — Jerga Técnica
// Dos paneles, glosario, tooltips

import { askGroq, hasApiKey } from '../../../js/groq.js';
import { renderApiKeyPanel, renderChangeKeyButton } from '../../../js/apikey-panel.js';

const lang = localStorage.getItem('artefactos_lang') || 'es';
let dominioActivo = 'Tecnología';
let nivelActivo = 'simple';
let generando = false;

const txt = {
  es: {
    titulo: 'Jerga Técnica',
    sub: 'Pega texto técnico y obtendrás una traducción accesible con glosario.',
    placeholder: 'Pega aquí un texto con terminología técnica…',
    dominio: 'Dominio',
    dominios: ['Tecnología', 'Medicina', 'Derecho', 'Finanzas', 'Ciencia', 'Ingeniería'],
    nivel: 'Nivel de simplificación',
    niveles: { simple: 'Simple', intermedio: 'Intermedio', detallado: 'Detallado' },
    traducir: 'Traducir jerga', traduciendo: 'Traduciendo…',
    panelOrig: '// Original',
    panelTrad: '// Traducción',
    glosarioTit: 'Glosario de términos',
    thTermino: 'Término', thDef: 'Definición',
    badge: 'educación', galeria: '← Galería',
    error: 'Error al traducir. Intenta de nuevo.'
  },
  en: {
    titulo: 'Technical Jargon',
    sub: 'Paste technical text and get an accessible translation with glossary.',
    placeholder: 'Paste technical text here…',
    dominio: 'Domain',
    dominios: ['Technology', 'Medicine', 'Law', 'Finance', 'Science', 'Engineering'],
    nivel: 'Simplification level',
    niveles: { simple: 'Simple', intermedio: 'Intermediate', detallado: 'Detailed' },
    traducir: 'Translate jargon', traduciendo: 'Translating…',
    panelOrig: '// Original',
    panelTrad: '// Translation',
    glosarioTit: 'Glossary',
    thTermino: 'Term', thDef: 'Definition',
    badge: 'education', galeria: '← Gallery',
    error: 'Error translating. Try again.'
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
      <textarea id="texto-input" class="campo" placeholder="${t.placeholder}" maxlength="3000"></textarea>
      <div class="selector-row">
        <div class="selector-grupo">
          <span class="selector-label">${t.dominio}</span>
          <div class="pills" id="dominio-pills">
            ${t.dominios.map((d, i) => `<button class="pill${txt.es.dominios[i] === dominioActivo ? ' active' : ''}" data-val="${txt.es.dominios[i]}">${d}</button>`).join('')}
          </div>
        </div>
        <div class="selector-grupo">
          <span class="selector-label">${t.nivel}</span>
          <div class="pills" id="nivel-pills">
            ${Object.entries(t.niveles).map(([k, v]) => `<button class="pill${k === nivelActivo ? ' active' : ''}" data-val="${k}">${v}</button>`).join('')}
          </div>
        </div>
      </div>
      <button id="btn-traducir" class="btn-principal">${t.traducir}</button>
      <div id="resultado"></div>
    </div>
  `;
  renderChangeKeyButton('key-btn-wrap', lang);
  bindControles();
}

function bindControles() {
  document.querySelectorAll('#dominio-pills .pill').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#dominio-pills .pill').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      dominioActivo = btn.dataset.val;
    });
  });
  document.querySelectorAll('#nivel-pills .pill').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#nivel-pills .pill').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      nivelActivo = btn.dataset.val;
    });
  });

  document.getElementById('btn-traducir').addEventListener('click', traducir);
}

async function traducir() {
  const texto = document.getElementById('texto-input').value.trim();
  if (!texto || generando) return;
  generando = true;
  const btn = document.getElementById('btn-traducir');
  btn.disabled = true; btn.textContent = t.traduciendo;
  const resultado = document.getElementById('resultado');
  resultado.innerHTML = '<p class="loading">…</p>';

  const nivelDesc = nivelActivo === 'simple' ? 'muy simple, como para alguien sin formación' :
    nivelActivo === 'intermedio' ? 'intermedio, explicando conceptos clave' : 'detallado pero accesible';

  const sys = `Eres un traductor de jerga técnica del dominio "${dominioActivo}".
Tu tarea: tomar un texto técnico y producir una versión accesible al nivel "${nivelDesc}".

Responde SOLO con JSON válido:
{
  "traduccion": "texto traducido a lenguaje accesible",
  "glosario": [{"termino": "...", "definicion": "..."}]
}

REGLAS:
- La traducción debe mantener el mismo significado pero usar lenguaje claro.
- El glosario debe incluir todos los términos técnicos encontrados (máximo 15).
- Las definiciones deben ser breves (1-2 frases).`;

  try {
    const resp = await askGroq({ systemPrompt: sys, userMessage: texto, temperature: 0.7, maxTokens: 1200 });
    const data = parsearJSON(resp);
    if (!data || !data.traduccion) { resultado.innerHTML = `<p class="loading">${t.error}</p>`; reset(); return; }
    renderResultado(texto, data);
  } catch {
    resultado.innerHTML = `<p class="loading">${t.error}</p>`;
  }
  reset();
}

function reset() {
  generando = false;
  const btn = document.getElementById('btn-traducir');
  if (btn) { btn.disabled = false; btn.textContent = t.traducir; }
}

function renderResultado(original, data) {
  const resultado = document.getElementById('resultado');
  const glosario = data.glosario || [];

  // Marcar términos en el original
  let origHTML = escaparHTML(original);
  glosario.forEach(g => {
    const regex = new RegExp(`(${escaparRegex(g.termino)})`, 'gi');
    origHTML = origHTML.replace(regex, `<span class="termino" data-def="${escaparAttr(g.definicion)}">$1</span>`);
  });

  resultado.innerHTML = `
    <div class="paneles">
      <div class="panel">
        <div class="panel-titulo">${t.panelOrig}</div>
        <div class="panel-original">${origHTML}</div>
      </div>
      <div class="panel">
        <div class="panel-titulo">${t.panelTrad}</div>
        <div class="panel-traducido">${escaparHTML(data.traduccion)}</div>
      </div>
    </div>
    ${glosario.length ? `
    <div class="glosario">
      <h3>${t.glosarioTit}</h3>
      <table class="glosario-tabla">
        <thead><tr><th>${t.thTermino}</th><th>${t.thDef}</th></tr></thead>
        <tbody>${glosario.map(g => `<tr><td>${escaparHTML(g.termino)}</td><td>${escaparHTML(g.definicion)}</td></tr>`).join('')}</tbody>
      </table>
    </div>` : ''}
  `;
}

function parsearJSON(raw) {
  let limpio = raw.trim();
  limpio = limpio.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/g, '');
  try { return JSON.parse(limpio); } catch { return null; }
}
function escaparHTML(str) { const d = document.createElement('div'); d.textContent = str; return d.innerHTML; }
function escaparAttr(str) { return str.replace(/"/g, '&quot;').replace(/'/g, '&#39;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
function escaparRegex(str) { return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

init();
