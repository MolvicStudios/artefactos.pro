// dialogo.js — Generador de Diálogos
// Burbujas A (naranja, izquierda) y B (azul, derecha) con reveal secuencial

import { askGroq, hasApiKey } from '../../../js/groq.js';
import { renderApiKeyPanel, renderChangeKeyButton } from '../../../js/apikey-panel.js';

const lang = localStorage.getItem('artefactos_lang') || 'es';
let tonoActivo = 'Dramático';
let generando = false;
let dialogoActual = []; // array de líneas
let contextoEscena = {};

const txt = {
  es: {
    titulo: 'Generador de Diálogos',
    sub: 'Crea escenas dialogadas entre dos personajes con distintos tonos.',
    personajeA_ph: 'Personaje A (ej: detective cansado)',
    personajeB_ph: 'Personaje B (ej: sospechosa enigmática)',
    situacion_ph: 'Situación (ej: interrogatorio nocturno en comisaría)',
    tono: 'Tono',
    tonos: ['Dramático', 'Cómico', 'Tenso', 'Romántico', 'Filosófico', 'Absurdo'],
    generar: 'Generar diálogo', generando: 'Generando...',
    continuar: 'Continuar escena', direccion: 'Cambiar dirección',
    direccion_ph: 'Ej: que ella confiese algo inesperado',
    badge: 'creatividad', galeria: '← Galería',
    error: 'Error al generar. Intenta de nuevo.'
  },
  en: {
    titulo: 'Dialogue Generator',
    sub: 'Create scripted scenes between two characters with different tones.',
    personajeA_ph: 'Character A (e.g., tired detective)',
    personajeB_ph: 'Character B (e.g., enigmatic suspect)',
    situacion_ph: 'Situation (e.g., late night interrogation)',
    tono: 'Tone',
    tonos: ['Dramatic', 'Comic', 'Tense', 'Romantic', 'Philosophical', 'Absurd'],
    generar: 'Generate dialogue', generando: 'Generating...',
    continuar: 'Continue scene', direccion: 'Change direction',
    direccion_ph: 'E.g., she confesses something unexpected',
    badge: 'creativity', galeria: '← Gallery',
    error: 'Error generating. Try again.'
  }
};
const t = txt[lang] || txt.es;

function init() {
  if (!hasApiKey()) { renderApiKeyPanel('app', () => renderArtefacto(), lang); return; }
  renderArtefacto();
}

function renderArtefacto() {
  const app = document.getElementById('app');
  dialogoActual = [];
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
        <div class="form-row">
          <input type="text" id="personajeA" class="campo campo-flex" placeholder="${t.personajeA_ph}" maxlength="80" />
          <input type="text" id="personajeB" class="campo campo-flex" placeholder="${t.personajeB_ph}" maxlength="80" />
        </div>
        <input type="text" id="situacion" class="campo" placeholder="${t.situacion_ph}" maxlength="200" />
      </div>
      <div class="selector-grupo">
        <span class="selector-label">${t.tono}</span>
        <div class="pills" id="tono-pills">
          ${t.tonos.map((tn, i) => `<button class="pill${txt.es.tonos[i] === tonoActivo ? ' active' : ''}" data-val="${txt.es.tonos[i]}">${tn}</button>`).join('')}
        </div>
      </div>
      <button id="btn-generar" class="btn-principal">${t.generar}</button>
      <div id="chat-zona" class="chat-zona"></div>
      <div id="acciones-post" class="acciones-post" style="display:none">
        <button id="btn-continuar" class="btn-sec">${t.continuar}</button>
        <button id="btn-direccion" class="btn-sec">${t.direccion}</button>
      </div>
      <div id="direccion-zona" style="display:none;margin-top:0.5rem;">
        <input type="text" id="direccion-input" class="campo" placeholder="${t.direccion_ph}" maxlength="150" />
      </div>
    </div>
  `;
  renderChangeKeyButton('key-btn-wrap', lang);

  document.getElementById('tono-pills').addEventListener('click', e => {
    const p = e.target.closest('.pill'); if (!p) return;
    document.querySelectorAll('#tono-pills .pill').forEach(x => x.classList.remove('active'));
    p.classList.add('active'); tonoActivo = p.dataset.val;
  });
  document.getElementById('btn-generar').addEventListener('click', generar);
  document.getElementById('btn-continuar').addEventListener('click', () => continuarEscena());
  document.getElementById('btn-direccion').addEventListener('click', () => {
    const zona = document.getElementById('direccion-zona');
    zona.style.display = zona.style.display === 'none' ? 'block' : 'none';
  });
}

async function generar() {
  const pA = document.getElementById('personajeA').value.trim();
  const pB = document.getElementById('personajeB').value.trim();
  const sit = document.getElementById('situacion').value.trim();
  if (!pA || !pB || !sit || generando) return;

  contextoEscena = { pA, pB, sit };
  dialogoActual = [];

  const btn = document.getElementById('btn-generar');
  const zona = document.getElementById('chat-zona');
  generando = true; btn.disabled = true; btn.textContent = t.generando;
  zona.innerHTML = '<p class="loading">...</p>';

  const idioma = lang === 'en' ? 'English' : 'Spanish';
  const systemPrompt = `Eres un guionista experto en diálogos cinematográficos. Responde en ${idioma}.
Personaje A: ${pA}
Personaje B: ${pB}
Situación: ${sit}
Tono: ${tonoActivo}

Genera un diálogo de 8-12 líneas alternando entre A y B. Incluye acotaciones (acciones, gestos) entre paréntesis cuando aporten.

Responde SOLO en JSON (sin markdown):
[
  {"personaje":"A","texto":"...","acotacion":"(opcional, o cadena vacía)"},
  {"personaje":"B","texto":"...","acotacion":""},
  ...
]
Reglas:
- Diálogo naturalista, no explicativo.
- Cada línea máximo 2 oraciones.
- Las acotaciones son breves (3-6 palabras) o vacías.
- Que se sienta como una escena real de película.`;

  try {
    const raw = await llamarGroq({ systemPrompt, userMessage: sit, temperature: 0.85, maxTokens: 800 });
    if (!raw) return;
    const lineas = parseJSON(raw);
    if (!lineas || !Array.isArray(lineas)) throw new Error('parse');
    dialogoActual = lineas;
    revealBurbujas(lineas);
    document.getElementById('acciones-post').style.display = 'flex';
  } catch { zona.innerHTML = `<p class="loading">${t.error}</p>`; }
  finally { generando = false; btn.disabled = false; btn.textContent = t.generar; }
}

async function continuarEscena(direccion) {
  if (generando || !dialogoActual.length) return;
  generando = true;

  const dir = direccion || document.getElementById('direccion-input').value.trim();
  const idioma = lang === 'en' ? 'English' : 'Spanish';
  const resumen = dialogoActual.map(l => `${l.personaje}: ${l.texto}`).join('\n');

  const systemPrompt = `Eres un guionista experto. Continúa este diálogo. Responde en ${idioma}.
Personaje A: ${contextoEscena.pA}
Personaje B: ${contextoEscena.pB}
Tono: ${tonoActivo}
${dir ? `Nueva dirección: ${dir}` : 'Continúa la escena de forma natural.'}

Diálogo hasta ahora:
${resumen}

Genera 4-6 líneas más. SOLO JSON:
[{"personaje":"A","texto":"...","acotacion":""},...]`;

  const zona = document.getElementById('chat-zona');
  try {
    const raw = await llamarGroq({ systemPrompt, userMessage: 'Continuar', temperature: 0.85, maxTokens: 500 });
    if (!raw) return;
    const nuevas = parseJSON(raw);
    if (!nuevas || !Array.isArray(nuevas)) throw new Error('parse');
    dialogoActual = dialogoActual.concat(nuevas);
    revealBurbujas(nuevas, true);
    document.getElementById('direccion-input').value = '';
    document.getElementById('direccion-zona').style.display = 'none';
  } catch { zona.innerHTML += `<p class="loading">${t.error}</p>`; }
  finally { generando = false; }
}

function revealBurbujas(lineas, append = false) {
  const zona = document.getElementById('chat-zona');
  if (!append) zona.innerHTML = '';

  lineas.forEach((linea, i) => {
    setTimeout(() => {
      const esA = linea.personaje === 'A';
      const nombre = esA ? contextoEscena.pA : contextoEscena.pB;
      const div = document.createElement('div');
      div.className = `burbuja ${esA ? 'burbuja-a' : 'burbuja-b'}`;
      div.innerHTML = `
        <div class="burbuja-nombre">${nombre}</div>
        <div class="burbuja-texto">${linea.texto}</div>
        ${linea.acotacion ? `<div class="burbuja-acotacion">${linea.acotacion}</div>` : ''}
      `;
      zona.appendChild(div);
      div.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, i * 350);
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
