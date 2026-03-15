// critico.js — Crítico Literario
// Análisis en 5 dimensiones con acordeón y barras de puntuación

import { askGroq, hasApiKey } from '../../../js/groq.js';
import { renderApiKeyPanel, renderChangeKeyButton } from '../../../js/apikey-panel.js';

const lang = localStorage.getItem('artefactos_lang') || 'es';
let generando = false;

const txt = {
  es: {
    titulo: 'Crítico Literario',
    sub: 'Pega un fragmento y recibe un análisis profesional con puntuación.',
    placeholder: 'Pega aquí tu texto literario (mínimo 50 caracteres)…',
    analizar: 'Analizar texto', analizando: 'Analizando…',
    dimensiones: ['Estilo', 'Estructura', 'Personajes', 'Originalidad', 'Impacto emocional'],
    secciones: ['Resumen general', 'Análisis de estilo', 'Estructura narrativa', 'Fortalezas', 'Áreas de mejora', 'Veredicto final'],
    badge: 'creatividad', galeria: '← Galería',
    error: 'Error al analizar. Intenta de nuevo.'
  },
  en: {
    titulo: 'Literary Critic',
    sub: 'Paste a fragment and receive a professional scored analysis.',
    placeholder: 'Paste your literary text here (minimum 50 characters)…',
    analizar: 'Analyze text', analizando: 'Analyzing…',
    dimensiones: ['Style', 'Structure', 'Characters', 'Originality', 'Emotional Impact'],
    secciones: ['General Summary', 'Style Analysis', 'Narrative Structure', 'Strengths', 'Areas for Improvement', 'Final Verdict'],
    badge: 'creativity', galeria: '← Gallery',
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
      <textarea id="texto-input" class="textarea-texto" placeholder="${t.placeholder}" maxlength="5000"></textarea>
      <button id="btn-analizar" class="btn-principal">${t.analizar}</button>
      <div id="resultado"></div>
    </div>
  `;
  renderChangeKeyButton('key-btn-wrap', lang);
  document.getElementById('btn-analizar').addEventListener('click', analizar);
}

async function analizar() {
  const texto = document.getElementById('texto-input').value.trim();
  if (!texto || texto.length < 50 || generando) return;

  const btn = document.getElementById('btn-analizar');
  const resultado = document.getElementById('resultado');
  generando = true; btn.disabled = true; btn.textContent = t.analizando;
  resultado.innerHTML = '<p class="loading">...</p>';

  const idioma = lang === 'en' ? 'English' : 'Spanish';
  const dimKeys = ['estilo', 'estructura', 'personajes', 'originalidad', 'impacto_emocional'];
  const secKeys = ['resumen', 'estilo_analisis', 'estructura_narrativa', 'fortalezas', 'mejoras', 'veredicto'];

  const systemPrompt = `Eres un crítico literario experto con formación académica. Analiza el texto proporcionado de forma rigurosa pero constructiva. Responde en ${idioma}.

Responde SOLO con este JSON (sin markdown ni texto extra):
{
  "puntuaciones": {
    "estilo": <1-10>,
    "estructura": <1-10>,
    "personajes": <1-10>,
    "originalidad": <1-10>,
    "impacto_emocional": <1-10>
  },
  "secciones": {
    "resumen": "Resumen general del texto en 2-3 oraciones",
    "estilo_analisis": "Análisis detallado del estilo literario, uso del lenguaje, figuras retóricas",
    "estructura_narrativa": "Cómo está construida la narrativa, ritmo, progresión",
    "fortalezas": "Los puntos fuertes más destacados del texto",
    "mejoras": "Sugerencias concretas y constructivas para mejorar",
    "veredicto": "Opinión final en 1-2 oraciones con recomendación"
  }
}
Reglas:
- Sé específico, cita pasajes breves del texto cuando sea relevante.
- Puntuaciones realistas: no des 10 fácilmente, no seas cruel con 1-2 sin razón.
- Cada sección entre 40 y 100 palabras.`;

  try {
    const raw = await llamarGroq({ systemPrompt, userMessage: texto, temperature: 0.6, maxTokens: 1200 });
    if (!raw) return;
    const data = parseJSON(raw);
    if (!data || !data.puntuaciones || !data.secciones) throw new Error('parse');
    renderAnalisis(data, dimKeys, secKeys);
  } catch { resultado.innerHTML = `<p class="loading">${t.error}</p>`; }
  finally { generando = false; btn.disabled = false; btn.textContent = t.analizar; }
}

function renderAnalisis(data, dimKeys, secKeys) {
  const resultado = document.getElementById('resultado');

  // Barras de puntuación
  const scoresHTML = dimKeys.map((key, i) => {
    const val = Math.min(10, Math.max(0, data.puntuaciones[key] || 0));
    const pct = val * 10;
    return `<div class="score-item">
      <div class="score-label">${t.dimensiones[i]}</div>
      <div class="score-bar-bg"><div class="score-bar-fill" style="width:${pct}%"></div></div>
      <div class="score-value">${val}/10</div>
    </div>`;
  }).join('');

  // Secciones accordion
  const seccionesHTML = secKeys.map((key, i) => {
    const contenido = data.secciones[key] || '';
    return `<div class="analisis-seccion${i === 0 ? ' open' : ''}">
      <div class="seccion-header">
        <span>${t.secciones[i]}</span>
        <span class="seccion-flecha">▸</span>
      </div>
      <div class="seccion-body"><p>${contenido}</p></div>
    </div>`;
  }).join('');

  resultado.innerHTML = `
    <div class="scores-panel">${scoresHTML}</div>
    <div class="analisis-secciones">${seccionesHTML}</div>
  `;

  // Accordion toggle
  resultado.querySelectorAll('.seccion-header').forEach(header => {
    header.addEventListener('click', () => {
      header.closest('.analisis-seccion').classList.toggle('open');
    });
  });
}

function parseJSON(raw) {
  try {
    let limpio = raw.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
    const inicio = limpio.indexOf('{');
    const fin = limpio.lastIndexOf('}');
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
