// resumen-academico.js — Resumen Académico
// Análisis en 8 secciones, keyword chips expandibles, generador de citas

import { askGroq, hasApiKey } from '../../../js/groq.js';
import { renderApiKeyPanel, renderChangeKeyButton } from '../../../js/apikey-panel.js';

const lang = localStorage.getItem('artefactos_lang') || 'es';
let citaFormato = 'APA';
let generando = false;
let ultimoResultado = null;

const txt = {
  es: {
    titulo: 'Resumen Académico',
    sub: 'Pega un texto académico y obtén un análisis profundo estilo revista.',
    placeholder: 'Pega aquí un artículo, ensayo o texto académico…',
    generar: 'Analizar texto', generando: 'Analizando…',
    secciones: ['Resumen ejecutivo', 'Tesis principal', 'Argumentos clave', 'Metodología', 'Hallazgos', 'Limitaciones', 'Implicaciones', 'Preguntas abiertas'],
    keywords: 'Conceptos clave',
    citaLabel: 'Generar cita bibliográfica',
    copiar: 'Copiar', copiado: '✓',
    badge: 'educación', galeria: '← Galería',
    error: 'Error al analizar. Intenta de nuevo.'
  },
  en: {
    titulo: 'Academic Summary',
    sub: 'Paste academic text and get a deep magazine-style analysis.',
    placeholder: 'Paste an article, essay or academic text here…',
    generar: 'Analyze text', generando: 'Analyzing…',
    secciones: ['Executive summary', 'Main thesis', 'Key arguments', 'Methodology', 'Findings', 'Limitations', 'Implications', 'Open questions'],
    keywords: 'Key concepts',
    citaLabel: 'Generate bibliographic citation',
    copiar: 'Copy', copiado: '✓',
    badge: 'education', galeria: '← Gallery',
    error: 'Error analyzing. Try again.'
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
      <textarea id="texto-input" class="campo" placeholder="${t.placeholder}" maxlength="6000"></textarea>
      <button id="btn-generar" class="btn-principal">${t.generar}</button>
      <div id="resultado"></div>
    </div>
  `;
  renderChangeKeyButton('key-btn-wrap', lang);
  document.getElementById('btn-generar').addEventListener('click', analizar);
}

async function analizar() {
  const texto = document.getElementById('texto-input').value.trim();
  if (!texto || generando) return;
  generando = true;
  const btn = document.getElementById('btn-generar');
  btn.disabled = true; btn.textContent = t.generando;
  const resultado = document.getElementById('resultado');
  resultado.innerHTML = '<p class="loading">…</p>';

  const seccionesJSON = t.secciones.map((s, i) => `"seccion${i + 1}": "${s}: ..."`).join(', ');
  const sys = `Eres un analista académico experto. Analiza el texto proporcionado y genera un resumen profundo.

Responde SOLO con JSON válido:
{
  "secciones": [
    {"titulo": "${t.secciones[0]}", "contenido": "..."},
    {"titulo": "${t.secciones[1]}", "contenido": "..."},
    {"titulo": "${t.secciones[2]}", "contenido": "..."},
    {"titulo": "${t.secciones[3]}", "contenido": "..."},
    {"titulo": "${t.secciones[4]}", "contenido": "..."},
    {"titulo": "${t.secciones[5]}", "contenido": "..."},
    {"titulo": "${t.secciones[6]}", "contenido": "..."},
    {"titulo": "${t.secciones[7]}", "contenido": "..."}
  ],
  "keywords": ["concepto1", "concepto2", "concepto3", "concepto4", "concepto5"],
  "autor_inferido": "autor si se puede inferir o vacío",
  "titulo_inferido": "título si se puede inferir o vacío",
  "anio_inferido": "año si se puede inferir o vacío"
}

Cada sección debe tener contenido sustancial (2-4 frases). Keywords: 5-8 conceptos clave.`;

  try {
    const resp = await askGroq({ systemPrompt: sys, userMessage: texto, temperature: 0.6, maxTokens: 1500 });
    if (resp === 'NO_KEY' || resp === 'INVALID_KEY') { resultado.innerHTML = `<p class="loading">${t.error}</p>`; reset(); return; }
    const data = parsearJSON(resp);
    if (!data || !data.secciones) { resultado.innerHTML = `<p class="loading">${t.error}</p>`; reset(); return; }
    ultimoResultado = data;
    renderResultado(data, texto);
  } catch {
    resultado.innerHTML = `<p class="loading">${t.error}</p>`;
  }
  reset();
}

function reset() {
  generando = false;
  const btn = document.getElementById('btn-generar');
  if (btn) { btn.disabled = false; btn.textContent = t.generar; }
}

function renderResultado(data, textoOriginal) {
  const resultado = document.getElementById('resultado');
  const secciones = (data.secciones || []).map(s =>
    `<div class="resumen-seccion"><h3>${escaparHTML(s.titulo)}</h3><p>${escaparHTML(s.contenido)}</p></div>`
  ).join('');

  const keywords = (data.keywords || []).map(k =>
    `<span class="keyword-chip" data-keyword="${escaparAttr(k)}">${escaparHTML(k)}</span>`
  ).join('');

  resultado.innerHTML = `
    <div class="resumen-resultado">
      ${keywords ? `
        <div class="keywords-zona">
          <div class="keywords-label">${t.keywords}</div>
          <div class="keyword-chips">${keywords}</div>
          <div id="keyword-expansion"></div>
        </div>` : ''}
      ${secciones}
      <div class="cita-zona">
        <div class="cita-label">${t.citaLabel}</div>
        <div class="cita-formato">
          ${['APA', 'MLA', 'Chicago'].map(f => `<button class="pill${f === citaFormato ? ' active' : ''}" data-formato="${f}">${f}</button>`).join('')}
        </div>
        <div class="cita-texto" id="cita-texto" title="${t.copiar}">${generarCita(data, citaFormato)}</div>
      </div>
    </div>
  `;

  // Bind keyword chips
  document.querySelectorAll('.keyword-chip').forEach(chip => {
    chip.addEventListener('click', () => expandirKeyword(chip.dataset.keyword, textoOriginal));
  });

  // Bind formato cita
  document.querySelectorAll('.cita-formato .pill').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.cita-formato .pill').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      citaFormato = btn.dataset.formato;
      document.getElementById('cita-texto').textContent = generarCita(data, citaFormato);
    });
  });

  // Copiar cita
  document.getElementById('cita-texto').addEventListener('click', () => {
    navigator.clipboard.writeText(document.getElementById('cita-texto').textContent);
  });
}

async function expandirKeyword(keyword, textoOriginal) {
  const expansion = document.getElementById('keyword-expansion');
  expansion.innerHTML = '<p class="loading">…</p>';

  const sys = `Basándote en el contexto del texto académico analizado, explica el concepto "${keyword}" en 2-3 frases claras. Relaciona con el texto original.`;
  try {
    const resp = await askGroq({ systemPrompt: sys, userMessage: `Concepto: ${keyword}`, temperature: 0.7, maxTokens: 200 });
    if (resp === 'NO_KEY' || resp === 'INVALID_KEY') { expansion.innerHTML = ''; return; }
    expansion.innerHTML = `<div class="keyword-expansion"><strong>${escaparHTML(keyword)}:</strong> ${escaparHTML(resp)}</div>`;
  } catch {
    expansion.innerHTML = '';
  }
}

function generarCita(data, formato) {
  const autor = data.autor_inferido || 'Autor';
  const titulo = data.titulo_inferido || 'Título del documento';
  const anio = data.anio_inferido || new Date().getFullYear();
  switch (formato) {
    case 'APA': return `${autor} (${anio}). ${titulo}.`;
    case 'MLA': return `${autor}. "${titulo}." ${anio}.`;
    case 'Chicago': return `${autor}. "${titulo}." ${anio}.`;
    default: return `${autor} (${anio}). ${titulo}.`;
  }
}

function parsearJSON(raw) {
  let limpio = raw.trim();
  limpio = limpio.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/g, '');
  try { return JSON.parse(limpio); } catch { return null; }
}
function escaparHTML(str) { const d = document.createElement('div'); d.textContent = str; return d.innerHTML; }
function escaparAttr(str) { return str.replace(/"/g, '&quot;').replace(/'/g, '&#39;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }

init();
