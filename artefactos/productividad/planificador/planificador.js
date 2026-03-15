// planificador.js — Planificador Semanal con IA
import { askGroq, hasApiKey } from '../../../js/groq.js';
import { renderApiKeyPanel, renderChangeKeyButton } from '../../../js/apikey-panel.js';

const lang = localStorage.getItem('artefactos_lang') || 'es';
let intensidadActiva = 'equilibrada';
let generando = false;
let planActual = null;

const txt = {
  es: {
    titulo: 'Planificador Semanal',
    sub: 'Describe tus objetivos y compromisos, y la IA organizará tu semana.',
    metas: 'Objetivos y compromisos',
    metas_ph: 'Describe tus metas para la semana, compromisos fijos, restricciones de horario…',
    intensidad: 'Intensidad de la semana',
    intensidades: [
      { id: 'relajada', label: 'Relajada' },
      { id: 'equilibrada', label: 'Equilibrada' },
      { id: 'intensiva', label: 'Intensiva' }
    ],
    generar: 'Planificar semana', generando: 'Planificando…',
    copiar: 'Copiar como texto', copiado: '¡Copiado!', nueva: 'Nuevo plan',
    badge: 'productividad', galeria: '← Galería',
    error: 'Error al generar. Intenta de nuevo.',
    dias: ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'],
    bloques: { morning: 'Mañana', afternoon: 'Tarde', evening: 'Noche' }
  },
  en: {
    titulo: 'Weekly Planner',
    sub: 'Describe your goals and commitments, and AI will organize your week.',
    metas: 'Goals & commitments',
    metas_ph: 'Describe your goals for the week, fixed commitments, schedule constraints…',
    intensidad: 'Week intensity',
    intensidades: [
      { id: 'relajada', label: 'Relaxed' },
      { id: 'equilibrada', label: 'Balanced' },
      { id: 'intensiva', label: 'Intensive' }
    ],
    generar: 'Plan my week', generando: 'Planning…',
    copiar: 'Copy as text', copiado: 'Copied!', nueva: 'New plan',
    badge: 'productivity', galeria: '← Gallery',
    error: 'Error generating. Try again.',
    dias: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
    bloques: { morning: 'Morning', afternoon: 'Afternoon', evening: 'Evening' }
  }
};
const t = txt[lang] || txt.es;

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
      <h1>${t.titulo}</h1>
      <p class="subtitulo">${t.sub}</p>
      <div class="field-group">
        <span class="field-label">${t.metas}</span>
        <textarea id="metas-entrada" class="field-textarea" placeholder="${t.metas_ph}" maxlength="4000"></textarea>
      </div>
      <div class="field-group">
        <span class="field-label">${t.intensidad}</span>
        <div class="pills" id="intensidades">
          ${t.intensidades.map(i => `<button class="pill${i.id === 'equilibrada' ? ' active' : ''}" data-val="${i.id}">${i.label}</button>`).join('')}
        </div>
      </div>
      <button id="btn-generar" class="btn-primary">${t.generar}</button>
      <div id="resultado-wrap" class="resultado-wrap">
        <div id="week-grid" class="week-grid"></div>
        <div class="acciones">
          <button id="btn-copiar" class="btn-sec">${t.copiar}</button>
          <button id="btn-nueva" class="btn-sec">${t.nueva}</button>
        </div>
      </div>
    </div>`;
  renderChangeKeyButton('key-btn-wrap', lang);
  initEventos();
}

function initEventos() {
  document.getElementById('intensidades').addEventListener('click', e => {
    const pill = e.target.closest('.pill'); if (!pill) return;
    document.querySelectorAll('#intensidades .pill').forEach(p => p.classList.remove('active'));
    pill.classList.add('active'); intensidadActiva = pill.dataset.val;
  });
  document.getElementById('btn-generar').addEventListener('click', generar);
  document.getElementById('btn-copiar').addEventListener('click', copiar);
  document.getElementById('btn-nueva').addEventListener('click', () => {
    document.getElementById('metas-entrada').value = '';
    document.getElementById('resultado-wrap').classList.remove('visible');
    planActual = null;
  });
}

async function generar() {
  const metas = document.getElementById('metas-entrada').value.trim();
  if (!metas || generando) return;
  const btn = document.getElementById('btn-generar');
  generando = true; btn.disabled = true; btn.textContent = t.generando;

  const idioma = lang === 'en' ? 'English' : 'Spanish';
  const intensidadDesc = {
    relajada: lang === 'en' ? 'relaxed pace with plenty of free time' : 'ritmo relajado con bastante tiempo libre',
    equilibrada: lang === 'en' ? 'balanced pace mixing work and rest' : 'ritmo equilibrado entre trabajo y descanso',
    intensiva: lang === 'en' ? 'intensive pace maximizing productivity' : 'ritmo intensivo maximizando productividad'
  };

  const systemPrompt = lang === 'en'
    ? `You are a weekly planning assistant. Respond ONLY with a valid JSON array of 7 objects (Monday to Sunday). Each object must have: "day" (string), "morning" (string), "afternoon" (string), "evening" (string). Each time block should contain a brief plan with tasks/activities. No markdown, no explanation, only the JSON array.`
    : `Eres un asistente de planificación semanal. Responde SOLO con un array JSON válido de 7 objetos (lunes a domingo). Cada objeto debe tener: "day" (string), "morning" (string), "afternoon" (string), "evening" (string). Cada bloque horario debe contener un plan breve con tareas/actividades. Sin markdown, sin explicación, solo el array JSON.`;

  const userMessage = lang === 'en'
    ? `Create a weekly plan with a ${intensidadDesc[intensidadActiva]}.\n\nGoals and commitments:\n${metas}`
    : `Crea un plan semanal con ${intensidadDesc[intensidadActiva]}.\n\nObjetivos y compromisos:\n${metas}`;

  try {
    const raw = await askGroq({ systemPrompt, userMessage, temperature: 0.7, maxTokens: 1500 });
    const jsonStr = raw.replace(/```json?\s*/g, '').replace(/```/g, '').trim();
    const plan = JSON.parse(jsonStr);
    if (!Array.isArray(plan) || plan.length !== 7) throw new Error('Invalid plan');
    planActual = plan;
    renderPlan(plan);
    document.getElementById('resultado-wrap').classList.add('visible');
  } catch {
    document.getElementById('week-grid').innerHTML = `<p style="color:var(--texto-sec);grid-column:1/-1">${t.error}</p>`;
    document.getElementById('resultado-wrap').classList.add('visible');
  }
  generando = false; btn.disabled = false; btn.textContent = t.generar;
}

function renderPlan(plan) {
  const grid = document.getElementById('week-grid');
  grid.innerHTML = plan.map((d, i) => `
    <div class="day-card">
      <div class="day-name">${t.dias[i]}</div>
      <div class="time-block">
        <span class="time-label">${t.bloques.morning}</span>
        <span class="time-tasks">${esc(d.morning)}</span>
      </div>
      <div class="time-block">
        <span class="time-label">${t.bloques.afternoon}</span>
        <span class="time-tasks">${esc(d.afternoon)}</span>
      </div>
      <div class="time-block">
        <span class="time-label">${t.bloques.evening}</span>
        <span class="time-tasks">${esc(d.evening)}</span>
      </div>
    </div>`).join('');
}

function esc(s) {
  const d = document.createElement('div');
  d.textContent = s || '';
  return d.innerHTML;
}

function copiar() {
  if (!planActual) return;
  const lines = planActual.map((d, i) =>
    `${t.dias[i]}\n  ${t.bloques.morning}: ${d.morning}\n  ${t.bloques.afternoon}: ${d.afternoon}\n  ${t.bloques.evening}: ${d.evening}`
  ).join('\n\n');
  navigator.clipboard.writeText(lines);
  const btn = document.getElementById('btn-copiar');
  btn.textContent = t.copiado; btn.classList.add('copiado');
  setTimeout(() => { btn.textContent = t.copiar; btn.classList.remove('copiado'); }, 1500);
}

document.addEventListener('DOMContentLoaded', init);
