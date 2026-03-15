// quiz-adaptativo.js — Quiz Adaptativo
// Dificultad adaptativa, timer 30s, racha, scorecard

import { askGroq, hasApiKey } from '../../../js/groq.js';
import { renderApiKeyPanel, renderChangeKeyButton } from '../../../js/apikey-panel.js';

const lang = localStorage.getItem('artefactos_lang') || 'es';
const RECORD_KEY = 'artefactos_quiz_records';
const NUM_PREGUNTAS = 10;
const TIMER_SEG = 30;

let tema = '';
let dificultad = 3; // 1-5
let preguntaIdx = 0;
let correctas = 0;
let rachaActual = 0;
let mejorRacha = 0;
let consecutivasOk = 0;
let consecutivasMal = 0;
let timer = null;
let tiempoRestante = TIMER_SEG;
let generando = false;
let preguntaActual = null; // {pregunta, opciones[], correcta}

const txt = {
  es: {
    titulo: 'Quiz Adaptativo',
    sub: 'Pon a prueba tu conocimiento con preguntas que se adaptan a tu nivel.',
    placeholder: 'Biología molecular, historia de Roma, programación Python…',
    comenzar: 'Comenzar quiz', comenzando: 'Generando…',
    dif: 'Dificultad',
    difs: ['Muy fácil', 'Fácil', 'Media', 'Difícil', 'Muy difícil'],
    correcto: '¡Correcto!', incorrecto: 'Incorrecto.',
    correctaEra: 'La respuesta correcta era: ',
    siguiente: 'Siguiente pregunta →',
    tiempoAgotado: '⏱ Tiempo agotado',
    racha: '🔥 Racha: ',
    resultTitulo: '¡Quiz completado!',
    aciertos: 'aciertos',
    mejorRacha: 'Mejor racha',
    record: 'Récord en este tema',
    nuevoQuiz: 'Nuevo quiz', otroTema: 'Otro tema',
    badge: 'educación', galeria: '← Galería',
    error: 'Error al generar pregunta. Intenta de nuevo.'
  },
  en: {
    titulo: 'Adaptive Quiz',
    sub: 'Test your knowledge with questions that adapt to your level.',
    placeholder: 'Molecular biology, Roman history, Python programming…',
    comenzar: 'Start quiz', comenzando: 'Generating…',
    dif: 'Difficulty',
    difs: ['Very easy', 'Easy', 'Medium', 'Hard', 'Very hard'],
    correcto: 'Correct!', incorrecto: 'Incorrect.',
    correctaEra: 'The correct answer was: ',
    siguiente: 'Next question →',
    tiempoAgotado: '⏱ Time\'s up',
    racha: '🔥 Streak: ',
    resultTitulo: 'Quiz completed!',
    aciertos: 'correct',
    mejorRacha: 'Best streak',
    record: 'Record for this topic',
    nuevoQuiz: 'New quiz', otroTema: 'Other topic',
    badge: 'education', galeria: '← Gallery',
    error: 'Error generating question. Try again.'
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
      <input type="text" id="tema-input" class="campo" placeholder="${t.placeholder}" maxlength="120" />
      <button id="btn-comenzar" class="btn-principal">${t.comenzar}</button>
      <div id="quiz-zona"></div>
    </div>
  `;
  renderChangeKeyButton('key-btn-wrap', lang);
  bindInicio();
}

function bindInicio() {
  const btn = document.getElementById('btn-comenzar');
  const input = document.getElementById('tema-input');
  input.addEventListener('keydown', e => { if (e.key === 'Enter') btn.click(); });

  btn.addEventListener('click', async () => {
    const val = input.value.trim();
    if (!val || generando) return;
    tema = val;
    dificultad = 3;
    preguntaIdx = 0;
    correctas = 0;
    rachaActual = 0;
    mejorRacha = 0;
    consecutivasOk = 0;
    consecutivasMal = 0;

    input.style.display = 'none';
    btn.style.display = 'none';
    await generarPregunta();
  });
}

async function generarPregunta() {
  generando = true;
  const zona = document.getElementById('quiz-zona');
  zona.innerHTML = '<p class="loading">…</p>';

  const difLabel = t.difs[dificultad - 1];
  const sys = `Eres un generador de preguntas tipo quiz sobre "${tema}".
Genera UNA pregunta de dificultad ${dificultad}/5 (${difLabel}).
Responde SOLO con JSON válido:
{"pregunta":"...","opciones":["A","B","C","D"],"correcta":0}
donde "correcta" es el índice 0-3 de la opción correcta.
La pregunta debe ser específica y clara. Las opciones deben ser plausibles.`;

  try {
    const resp = await askGroq({ systemPrompt: sys, userMessage: `Pregunta ${preguntaIdx + 1} de ${NUM_PREGUNTAS}`, temperature: 0.9, maxTokens: 300 });
    if (resp === 'NO_KEY' || resp === 'INVALID_KEY') { zona.innerHTML = `<p class="loading">${t.error}</p>`; generando = false; return; }
    preguntaActual = parsearJSON(resp);
    if (!preguntaActual || !preguntaActual.opciones || preguntaActual.opciones.length < 4) {
      zona.innerHTML = `<p class="loading">${t.error}</p>`; generando = false; return;
    }
    generando = false;
    renderQuizPregunta();
  } catch {
    zona.innerHTML = `<p class="loading">${t.error}</p>`; generando = false;
  }
}

function renderQuizPregunta() {
  const zona = document.getElementById('quiz-zona');
  tiempoRestante = TIMER_SEG;
  const pct = ((preguntaIdx) / NUM_PREGUNTAS) * 100;
  zona.innerHTML = `
    <div class="quiz-progress">
      <div class="progress-bar"><div class="progress-fill" style="width:${pct}%"></div></div>
      <span class="progress-label">${preguntaIdx + 1}/${NUM_PREGUNTAS}</span>
    </div>
    <div class="quiz-meta">
      <span class="dificultad-badge">${t.dif}: ${t.difs[dificultad - 1]}</span>
      <span class="timer" id="timer">${TIMER_SEG}s</span>
      ${rachaActual > 1 ? `<span class="streak">${t.racha}${rachaActual}</span>` : ''}
    </div>
    <div class="pregunta-texto">${escaparHTML(preguntaActual.pregunta)}</div>
    <div class="opciones-grid" id="opciones">
      ${preguntaActual.opciones.map((op, i) => `<button class="opcion-btn" data-idx="${i}">${escaparHTML(op)}</button>`).join('')}
    </div>
    <div id="feedback-zona"></div>
  `;
  iniciarTimer();
  bindOpciones();
}

function iniciarTimer() {
  clearInterval(timer);
  timer = setInterval(() => {
    tiempoRestante--;
    const el = document.getElementById('timer');
    if (el) {
      el.textContent = `${tiempoRestante}s`;
      if (tiempoRestante <= 10) el.classList.add('warning');
    }
    if (tiempoRestante <= 0) {
      clearInterval(timer);
      resolverPregunta(-1); // tiempo agotado
    }
  }, 1000);
}

function bindOpciones() {
  document.querySelectorAll('.opcion-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      clearInterval(timer);
      resolverPregunta(parseInt(btn.dataset.idx));
    });
  });
}

function resolverPregunta(selIdx) {
  const btns = document.querySelectorAll('.opcion-btn');
  btns.forEach(b => { b.classList.add('disabled'); b.onclick = null; });

  const correctaIdx = preguntaActual.correcta;
  const esCorrecta = selIdx === correctaIdx;
  const tiempoOut = selIdx === -1;

  // Marcar botones
  btns.forEach((b, i) => {
    if (i === correctaIdx) b.classList.add('correcta');
    if (i === selIdx && !esCorrecta) b.classList.add('incorrecta');
  });

  // Actualizar stats
  if (esCorrecta) {
    correctas++;
    rachaActual++;
    consecutivasOk++;
    consecutivasMal = 0;
    if (rachaActual > mejorRacha) mejorRacha = rachaActual;
  } else {
    rachaActual = 0;
    consecutivasMal++;
    consecutivasOk = 0;
  }

  // Adaptar dificultad
  if (consecutivasOk >= 3 && dificultad < 5) { dificultad++; consecutivasOk = 0; }
  if (consecutivasMal >= 2 && dificultad > 1) { dificultad--; consecutivasMal = 0; }

  // Feedback
  const fb = document.getElementById('feedback-zona');
  let msg = '';
  if (tiempoOut) {
    msg = `<div class="feedback mal">${t.tiempoAgotado}. ${t.correctaEra}<strong>${escaparHTML(preguntaActual.opciones[correctaIdx])}</strong></div>`;
  } else if (esCorrecta) {
    msg = `<div class="feedback ok">${t.correcto}</div>`;
  } else {
    msg = `<div class="feedback mal">${t.incorrecto} ${t.correctaEra}<strong>${escaparHTML(preguntaActual.opciones[correctaIdx])}</strong></div>`;
  }

  preguntaIdx++;
  if (preguntaIdx >= NUM_PREGUNTAS) {
    fb.innerHTML = msg + `<button class="btn-siguiente" id="btn-ver-result">${lang === 'en' ? 'See results' : 'Ver resultados'}</button>`;
    document.getElementById('btn-ver-result').addEventListener('click', renderResultados);
  } else {
    fb.innerHTML = msg + `<button class="btn-siguiente" id="btn-sig">${t.siguiente}</button>`;
    document.getElementById('btn-sig').addEventListener('click', () => generarPregunta());
  }
}

function renderResultados() {
  clearInterval(timer);
  const pct = Math.round((correctas / NUM_PREGUNTAS) * 100);
  const zona = document.getElementById('quiz-zona');

  // Guardar récord
  const records = JSON.parse(localStorage.getItem(RECORD_KEY) || '{}');
  const temaKey = tema.toLowerCase().trim();
  const prevRecord = records[temaKey] || 0;
  if (pct > prevRecord) records[temaKey] = pct;
  localStorage.setItem(RECORD_KEY, JSON.stringify(records));

  zona.innerHTML = `
    <div class="scorecard">
      <h2>${t.resultTitulo}</h2>
      <div class="score-big">${pct}%</div>
      <div class="score-detalle">${correctas}/${NUM_PREGUNTAS} ${t.aciertos} · ${t.mejorRacha}: ${mejorRacha}</div>
      ${prevRecord > 0 && prevRecord < pct ? `<div class="score-best">🏆 ${t.record}: ${pct}% (${lang === 'en' ? 'prev' : 'ant'}: ${prevRecord}%)</div>` : ''}
      <div class="btns-final">
        <button class="btn-principal" id="btn-reintentar">${t.nuevoQuiz}</button>
        <button class="btn-siguiente" id="btn-otro">${t.otroTema}</button>
      </div>
    </div>
  `;
  document.getElementById('btn-reintentar').addEventListener('click', () => {
    dificultad = 3; preguntaIdx = 0; correctas = 0; rachaActual = 0; mejorRacha = 0;
    consecutivasOk = 0; consecutivasMal = 0;
    generarPregunta();
  });
  document.getElementById('btn-otro').addEventListener('click', () => renderArtefacto());
}

function parsearJSON(raw) {
  let limpio = raw.trim();
  // Eliminar backticks de bloque de código
  limpio = limpio.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/g, '');
  try { return JSON.parse(limpio); } catch { return null; }
}

function escaparHTML(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

init();
