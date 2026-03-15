// flashcards.js — Generador de Flashcards
// Flip 3D, sistema fácil/difícil, exportar mazo

import { askGroq, hasApiKey } from '../../../js/groq.js';
import { renderApiKeyPanel, renderChangeKeyButton } from '../../../js/apikey-panel.js';

const lang = localStorage.getItem('artefactos_lang') || 'es';
const MAZO_KEY = 'artefactos_flashcards_mazo';

let tipoActivo = 'Pregunta-Respuesta';
let numTarjetas = 10;
let generando = false;
let mazo = []; // {pregunta, respuesta, dominada}
let indiceActual = 0;
let flipped = false;

const txt = {
  es: {
    titulo: 'Generador de Flashcards',
    sub: 'Pega tus apuntes y genera un mazo de repaso con flip interactivo.',
    placeholder: 'Pega aquí tu texto, apuntes o artículo…',
    tipo: 'Tipo de flashcard',
    tipos: ['Pregunta-Respuesta', 'Concepto-Definición', 'Fecha-Evento', 'Causa-Efecto', 'Término-Ejemplo'],
    num: 'Tarjetas',
    nums: [5, 10, 15, 20],
    generar: 'Generar mazo', generando: 'Generando…',
    hint: 'Clic para voltear',
    facil: 'Fácil ✓', dificil: 'Difícil ✗',
    reiniciar: 'Reiniciar mazo', exportar: '↓ Exportar .txt', borrar: 'Borrar mazo',
    nuevoMazo: 'Nuevo mazo',
    resultadosTitulo: '¡Mazo completado!',
    dominadas: 'dominadas',
    badge: 'educación', galeria: '← Galería',
    error: 'Error al generar. Intenta de nuevo.'
  },
  en: {
    titulo: 'Flashcard Generator',
    sub: 'Paste your notes and generate a study deck with interactive flip.',
    placeholder: 'Paste your text, notes or article here…',
    tipo: 'Flashcard type',
    tipos: ['Question-Answer', 'Concept-Definition', 'Date-Event', 'Cause-Effect', 'Term-Example'],
    num: 'Cards',
    nums: [5, 10, 15, 20],
    generar: 'Generate deck', generando: 'Generating…',
    hint: 'Click to flip',
    facil: 'Easy ✓', dificil: 'Hard ✗',
    reiniciar: 'Restart deck', exportar: '↓ Export .txt', borrar: 'Delete deck',
    nuevoMazo: 'New deck',
    resultadosTitulo: 'Deck completed!',
    dominadas: 'mastered',
    badge: 'education', galeria: '← Gallery',
    error: 'Error generating. Try again.'
  }
};
const t = txt[lang] || txt.es;

function init() {
  if (!hasApiKey()) { renderApiKeyPanel('app', () => renderArtefacto(), lang); return; }
  // Intentar cargar mazo guardado
  const guardado = localStorage.getItem(MAZO_KEY);
  if (guardado) {
    try { mazo = JSON.parse(guardado); } catch { mazo = []; }
  }
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
      <div id="generador-zona">
        <textarea id="texto-input" class="textarea-input" placeholder="${t.placeholder}" maxlength="12000"></textarea>
        <div class="char-count"><span id="word-count">0</span> palabras</div>
        <div class="controles-row">
          <div class="selector-grupo">
            <span class="selector-label">${t.tipo}</span>
            <div class="pills" id="tipo-pills">
              ${t.tipos.map((tp, i) => `<button class="pill${txt.es.tipos[i] === tipoActivo ? ' active' : ''}" data-val="${txt.es.tipos[i]}">${tp}</button>`).join('')}
            </div>
          </div>
          <div class="selector-grupo" style="max-width:120px;">
            <span class="selector-label">${t.num}</span>
            <div class="pills" id="num-pills">
              ${t.nums.map(n => `<button class="pill${n === numTarjetas ? ' active' : ''}" data-val="${n}">${n}</button>`).join('')}
            </div>
          </div>
        </div>
        <button id="btn-generar" class="btn-principal">${t.generar}</button>
      </div>
      <div id="estudio-zona"></div>
    </div>
  `;
  renderChangeKeyButton('key-btn-wrap', lang);

  const textarea = document.getElementById('texto-input');
  textarea.addEventListener('input', () => {
    const wc = textarea.value.trim().split(/\s+/).filter(Boolean).length;
    document.getElementById('word-count').textContent = wc;
  });

  document.getElementById('tipo-pills').addEventListener('click', e => {
    const p = e.target.closest('.pill'); if (!p) return;
    document.querySelectorAll('#tipo-pills .pill').forEach(x => x.classList.remove('active'));
    p.classList.add('active'); tipoActivo = p.dataset.val;
  });
  document.getElementById('num-pills').addEventListener('click', e => {
    const p = e.target.closest('.pill'); if (!p) return;
    document.querySelectorAll('#num-pills .pill').forEach(x => x.classList.remove('active'));
    p.classList.add('active'); numTarjetas = parseInt(p.dataset.val);
  });
  document.getElementById('btn-generar').addEventListener('click', generarMazo);

  // Si hay mazo guardado, mostrar estudio directamente
  if (mazo.length > 0) iniciarEstudio();
}

async function generarMazo() {
  const texto = document.getElementById('texto-input').value.trim();
  if (!texto || generando) return;

  const btn = document.getElementById('btn-generar');
  const zona = document.getElementById('estudio-zona');
  generando = true; btn.disabled = true; btn.textContent = t.generando;
  zona.innerHTML = '<p class="loading">...</p>';

  const idioma = lang === 'en' ? 'English' : 'Spanish';
  const systemPrompt = `Eres un experto en técnicas de memorización y aprendizaje espaciado. Generas en ${idioma}.
Texto fuente:
${texto}

Tipo de flashcard: ${tipoActivo}
Número de tarjetas: ${numTarjetas}

Genera exactamente ${numTarjetas} flashcards del texto. Responde SOLO en este formato JSON (sin markdown):
[
  { "pregunta": "...", "respuesta": "..." }
]
Reglas:
- Cada pregunta debe ser específica y sin ambigüedad.
- Las respuestas: concisas, máximo 2 oraciones.
- No repitas información entre tarjetas.
- Cubre los conceptos más importantes del texto, no detalles triviales.`;

  try {
    const raw = await llamarGroq({ systemPrompt, userMessage: texto.substring(0, 3000), temperature: 0.7, maxTokens: 1500 });
    if (!raw) return;
    const cards = parseJSON(raw);
    if (!cards || !Array.isArray(cards)) throw new Error('parse');
    mazo = cards.map(c => ({ ...c, dominada: false }));
    localStorage.setItem(MAZO_KEY, JSON.stringify(mazo));
    indiceActual = 0;
    iniciarEstudio();
  } catch { zona.innerHTML = `<p class="loading">${t.error}</p>`; }
  finally { generando = false; btn.disabled = false; btn.textContent = t.generar; }
}

function iniciarEstudio() {
  indiceActual = 0; flipped = false;
  // Mover dominadas al final
  mazo.sort((a, b) => (a.dominada ? 1 : 0) - (b.dominada ? 1 : 0));
  // Buscar primera no dominada
  const primera = mazo.findIndex(c => !c.dominada);
  if (primera >= 0) indiceActual = primera;
  renderEstudio();
}

function renderEstudio() {
  const zona = document.getElementById('estudio-zona');
  const totalNoDomin = mazo.filter(c => !c.dominada).length;

  // Si todas dominadas → resultados
  if (totalNoDomin === 0) {
    renderResultados(); return;
  }

  // Asegurar indice válido y no dominada
  if (indiceActual >= mazo.length || mazo[indiceActual].dominada) {
    const sig = mazo.findIndex(c => !c.dominada);
    if (sig < 0) { renderResultados(); return; }
    indiceActual = sig;
  }

  const card = mazo[indiceActual];
  const dominadas = mazo.filter(c => c.dominada).length;
  const pct = Math.round((dominadas / mazo.length) * 100);

  zona.innerHTML = `
    <div class="progreso-bar">
      <div class="progreso-info">
        <span>${indiceActual + 1} / ${mazo.length}</span>
        <span>${dominadas} ${t.dominadas}</span>
      </div>
      <div class="progreso-bg"><div class="progreso-fill" style="width:${pct}%"></div></div>
    </div>
    <div class="card-container">
      <div class="flashcard" id="flashcard">
        <div class="card-face card-front">
          ${card.pregunta}
          <span class="card-hint">${t.hint}</span>
        </div>
        <div class="card-face card-back">
          ${card.respuesta}
        </div>
      </div>
    </div>
    <div class="estudio-btns" id="estudio-btns" style="display:none;">
      <button class="btn-facil" id="btn-facil">${t.facil}</button>
      <button class="btn-dificil" id="btn-dificil">${t.dificil}</button>
    </div>
    <div class="acciones-post">
      <button class="btn-sec" id="btn-reiniciar">${t.reiniciar}</button>
      <button class="btn-sec" id="btn-exportar">${t.exportar}</button>
      <button class="btn-sec" id="btn-borrar">${t.borrar}</button>
    </div>
  `;

  const flashcard = document.getElementById('flashcard');
  const btns = document.getElementById('estudio-btns');
  flashcard.addEventListener('click', () => {
    flipped = !flipped;
    flashcard.classList.toggle('flipped', flipped);
    if (flipped) btns.style.display = 'flex';
  });

  document.getElementById('btn-facil').addEventListener('click', () => {
    mazo[indiceActual].dominada = true;
    localStorage.setItem(MAZO_KEY, JSON.stringify(mazo));
    avanzar();
  });
  document.getElementById('btn-dificil').addEventListener('click', () => {
    // Mover al final de las no dominadas
    const card = mazo.splice(indiceActual, 1)[0];
    mazo.push(card);
    localStorage.setItem(MAZO_KEY, JSON.stringify(mazo));
    flipped = false;
    renderEstudio();
  });
  document.getElementById('btn-reiniciar').addEventListener('click', () => {
    mazo.forEach(c => c.dominada = false);
    localStorage.setItem(MAZO_KEY, JSON.stringify(mazo));
    iniciarEstudio();
  });
  document.getElementById('btn-exportar').addEventListener('click', exportarMazo);
  document.getElementById('btn-borrar').addEventListener('click', () => {
    mazo = []; localStorage.removeItem(MAZO_KEY);
    document.getElementById('estudio-zona').innerHTML = '';
  });
}

function avanzar() {
  flipped = false;
  indiceActual++;
  renderEstudio();
}

function renderResultados() {
  const zona = document.getElementById('estudio-zona');
  const dominadas = mazo.filter(c => c.dominada).length;
  const pct = Math.round((dominadas / mazo.length) * 100);
  zona.innerHTML = `
    <div class="resultados">
      <div class="resultados-titulo">${t.resultadosTitulo}</div>
      <div class="resultados-pct">${pct}%</div>
      <p style="color:var(--texto-sec);margin-top:0.5rem;">${dominadas} / ${mazo.length} ${t.dominadas}</p>
    </div>
    <div class="acciones-post">
      <button class="btn-sec" id="btn-reiniciar2">${t.reiniciar}</button>
      <button class="btn-sec" id="btn-nuevo">${t.nuevoMazo}</button>
      <button class="btn-sec" id="btn-exportar2">${t.exportar}</button>
    </div>
  `;
  document.getElementById('btn-reiniciar2').addEventListener('click', () => {
    mazo.forEach(c => c.dominada = false);
    localStorage.setItem(MAZO_KEY, JSON.stringify(mazo));
    iniciarEstudio();
  });
  document.getElementById('btn-nuevo').addEventListener('click', () => {
    mazo = []; localStorage.removeItem(MAZO_KEY);
    renderArtefacto();
  });
  document.getElementById('btn-exportar2').addEventListener('click', exportarMazo);
}

function exportarMazo() {
  const texto = mazo.map((c, i) => `${i + 1}.\nP: ${c.pregunta}\nR: ${c.respuesta}`).join('\n\n');
  const blob = new Blob([texto], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = 'flashcards.txt';
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  URL.revokeObjectURL(url);
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
