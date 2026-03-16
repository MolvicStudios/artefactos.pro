// trivia.js — Trivia Imposible: preguntas ultra-específicas con IA
import { askGroq, hasApiKey } from '../../../js/groq.js';
import { renderApiKeyPanel, renderChangeKeyButton } from '../../../js/apikey-panel.js';

const lang = localStorage.getItem('artefactos_lang') || 'es';
let generando = false;
let puntos = 0;
let racha = 0;
let preguntaActual = 0;
let temaActivo = '';

const txt = {
  es: {
    titulo: 'Trivia Imposible',
    sub: 'Preguntas ultra-específicas generadas por IA. ¿Cuántas puedes acertar?',
    badge: 'diversión', galeria: '← Galería',
    tema: 'Tema (opcional)', tema_ph: 'Ej: historia, ciencia, cine, música…',
    dificultad: 'Dificultad',
    difs: ['Fácil', 'Normal', 'Difícil', 'Imposible'],
    empezar: 'Empezar trivia', siguiente: 'Siguiente pregunta',
    cargando: 'Generando pregunta…',
    puntos: 'Puntos', racha: 'Racha', pregunta: 'Pregunta',
    correcto: '¡Correcto!', incorrecto: 'Incorrecto.',
    explicacion: 'Explicación:',
    error: 'Error al generar. Intenta de nuevo.',
    reiniciar: 'Reiniciar'
  },
  en: {
    titulo: 'Impossible Trivia',
    sub: 'Ultra-specific AI-generated questions. How many can you get right?',
    badge: 'fun', galeria: '← Gallery',
    tema: 'Topic (optional)', tema_ph: 'E.g.: history, science, movies, music…',
    dificultad: 'Difficulty',
    difs: ['Easy', 'Normal', 'Hard', 'Impossible'],
    empezar: 'Start trivia', siguiente: 'Next question',
    cargando: 'Generating question…',
    puntos: 'Points', racha: 'Streak', pregunta: 'Question',
    correcto: 'Correct!', incorrecto: 'Incorrect.',
    explicacion: 'Explanation:',
    error: 'Error generating. Try again.',
    reiniciar: 'Restart'
  }
};
const t = txt[lang] || txt.es;
const difs_es = ['Fácil', 'Normal', 'Difícil', 'Imposible'];
let difActiva = 'Normal';

function init() {
  if (!hasApiKey()) { renderApiKeyPanel('app', () => render(), lang); return; }
  render();
}

function render() {
  document.getElementById('app').innerHTML = `
    <header class="art-header">
      <div class="art-header-left">
        <a href="../../../index.html" class="back-link">${t.galeria}</a>
        <span class="cat-badge">${t.badge}</span>
      </div>
    </header>
    <div class="main-wrap">
      <h1>🧩 ${t.titulo}</h1>
      <p class="subtitulo">${t.sub}</p>
      <div class="field-group">
        <span class="field-label">${t.tema}</span>
        <input type="text" id="tema" class="field-input" placeholder="${t.tema_ph}" maxlength="80">
      </div>
      <div class="field-group">
        <span class="field-label">${t.dificultad}</span>
        <div class="pills" id="difs">
          ${t.difs.map((d, i) => `<button class="pill${i === 1 ? ' active' : ''}" data-val="${difs_es[i]}">${d}</button>`).join('')}
        </div>
      </div>
      <button id="btn-empezar" class="btn-primary">${t.empezar}</button>
      <div id="trivia-area"></div>
    </div>`;
  renderChangeKeyButton('key-btn-wrap', lang);
  document.getElementById('difs').addEventListener('click', e => {
    const pill = e.target.closest('.pill'); if (!pill) return;
    document.querySelectorAll('#difs .pill').forEach(p => p.classList.remove('active'));
    pill.classList.add('active'); difActiva = pill.dataset.val;
  });
  document.getElementById('btn-empezar').addEventListener('click', empezar);
}

function empezar() {
  temaActivo = document.getElementById('tema').value.trim();
  puntos = 0; racha = 0; preguntaActual = 0;
  document.getElementById('btn-empezar').style.display = 'none';
  generarPregunta();
}

async function generarPregunta() {
  if (generando) return;
  generando = true;
  preguntaActual++;
  const area = document.getElementById('trivia-area');
  area.innerHTML = `
    <div class="score-bar">
      <span>${t.puntos}: <strong>${puntos}</strong></span>
      <span>${t.racha}: <strong>${racha}</strong></span>
      <span>${t.pregunta}: <strong>${preguntaActual}</strong></span>
    </div>
    <p class="loading">${t.cargando}</p>`;

  const idioma = lang === 'en' ? 'English' : 'Spanish';
  try {
    const raw = await askGroq({
      systemPrompt: `You are a trivia master. Write in ${idioma}.
Generate ONE trivia question with difficulty: ${difActiva}.
${temaActivo ? `Topic: ${temaActivo}` : 'Any interesting topic.'}
Format EXACTLY as JSON:
{"question":"...","options":["A","B","C","D"],"correct":0,"explanation":"..."}
correct is the 0-based index of the right answer.
Only output the JSON, nothing else.`,
      userMessage: `Generate a ${difActiva} trivia question${temaActivo ? ` about ${temaActivo}` : ''}.`,
      temperature: 0.9,
      maxTokens: 400
    });
    const data = JSON.parse(raw.replace(/```json?\s*/g, '').replace(/```/g, '').trim());
    renderPregunta(data);
  } catch {
    area.innerHTML += `<p class="loading">${t.error}</p>`;
  }
  generando = false;
}

function renderPregunta(data) {
  const area = document.getElementById('trivia-area');
  area.innerHTML = `
    <div class="score-bar">
      <span>${t.puntos}: <strong>${puntos}</strong></span>
      <span>${t.racha}: <strong>${racha}</strong></span>
      <span>${t.pregunta}: <strong>${preguntaActual}</strong></span>
    </div>
    <div class="question-box">${data.question}</div>
    <div class="options-grid" id="options">
      ${data.options.map((opt, i) => `<button class="option-btn" data-idx="${i}">${opt}</button>`).join('')}
    </div>
    <div id="feedback" style="display:none;"></div>`;

  document.getElementById('options').addEventListener('click', e => {
    const btn = e.target.closest('.option-btn'); if (!btn) return;
    const idx = parseInt(btn.dataset.idx);
    document.querySelectorAll('.option-btn').forEach(b => { b.disabled = true; });
    const correctIdx = data.correct;
    document.querySelectorAll('.option-btn')[correctIdx].classList.add('correct');
    if (idx === correctIdx) {
      puntos += difActiva === 'Imposible' ? 4 : difActiva === 'Difícil' ? 3 : difActiva === 'Normal' ? 2 : 1;
      racha++;
      btn.classList.add('correct');
    } else {
      btn.classList.add('wrong');
      racha = 0;
    }
    const fb = document.getElementById('feedback');
    fb.style.display = 'block';
    fb.innerHTML = `
      <p style="color:${idx === correctIdx ? '#34d399' : '#f87171'}; font-weight:500; margin-bottom:0.5rem;">
        ${idx === correctIdx ? t.correcto : t.incorrecto}
      </p>
      <div class="explanation-box">${t.explicacion} ${data.explanation}</div>
      <button id="btn-sig" class="btn-primary" style="margin-top:0.75rem;">${t.siguiente}</button>
      <button id="btn-reiniciar" class="btn-sec" style="margin-top:0.5rem;">${t.reiniciar}</button>`;
    document.getElementById('btn-sig').addEventListener('click', generarPregunta);
    document.getElementById('btn-reiniciar').addEventListener('click', () => {
      document.getElementById('btn-empezar').style.display = '';
      area.innerHTML = '';
    });
    area.querySelector('.score-bar').innerHTML = `
      <span>${t.puntos}: <strong>${puntos}</strong></span>
      <span>${t.racha}: <strong>${racha}</strong></span>
      <span>${t.pregunta}: <strong>${preguntaActual}</strong></span>`;
  });
}

document.addEventListener('DOMContentLoaded', init);
