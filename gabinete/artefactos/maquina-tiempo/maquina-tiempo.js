// artefactos/maquina-tiempo/maquina-tiempo.js
import { askGroq, hasGroqKey } from '../../js/groq.js';
import { renderApiKeyPanel, renderChangeKeyButton } from '../../js/apikey-panel.js';
import { t, getLang, setLang } from '../../js/i18n.js';

const lang = () => getLang();
const MAX_TURNS = 4;

const EPOCAS = [
  { id: 'egipto',   label_es: 'Egipto Antiguo (3000 a.C.)', label_en: 'Ancient Egypt (3000 BC)', year: '3000 a.C.' },
  { id: 'roma',     label_es: 'Roma Imperial (100 d.C.)',    label_en: 'Imperial Rome (100 AD)',   year: '100 d.C.' },
  { id: 'medieval', label_es: 'Europa Medieval (1200)',       label_en: 'Medieval Europe (1200)',    year: '1200' },
  { id: 'renacimiento', label_es: 'Renacimiento (1500)',     label_en: 'Renaissance (1500)',        year: '1500' },
  { id: 'industrial', label_es: 'Revolución Industrial (1850)', label_en: 'Industrial Revolution (1850)', year: '1850' },
  { id: 'paris20',  label_es: 'París Años Locos (1920)',     label_en: 'Roaring Twenties Paris (1920)', year: '1920' },
  { id: 'ww2',      label_es: 'Segunda Guerra Mundial (1943)', label_en: 'World War II (1943)',    year: '1943' },
  { id: 'tokio',    label_es: 'Tokio Futurista (2089)',      label_en: 'Futuristic Tokyo (2089)',   year: '2089' }
];

let state = {
  epoca: null,
  rol: '',
  turn: 0,
  history: [],
  narration: '',
  actions: [],
  finished: false
};

function init() {
  if (!hasGroqKey()) {
    renderApiKeyPanel('app-container', () => renderArtefacto(), lang());
    return;
  }
  renderArtefacto();
}

function renderArtefacto() {
  const app = document.getElementById('app-container');
  document.body.className = 'maquina-page';

  app.innerHTML = `
    <canvas class="maquina-stars" id="stars-canvas"></canvas>
    <div class="maquina-flash" id="flash"></div>
    <div class="maquina-content">
      <div class="maquina-header">
        <a href="../../index.html" class="maquina-back">${t('backBtn')}</a>
        <button class="maquina-lang" id="lang-toggle">${t('selectLang')}</button>
      </div>
      <h1 class="maquina-title">${t('maquina_name')}</h1>
      <p class="maquina-subtitle">⚙ ${lang() === 'es' ? 'Cockpit temporal' : 'Temporal cockpit'}</p>

      <!-- Decorative dials -->
      <div class="maquina-dials">
        <svg viewBox="0 0 48 48"><circle cx="24" cy="24" r="20" stroke="#b87333" stroke-width="1" fill="none"/><line x1="24" y1="8" x2="24" y2="20" stroke="#39ff14" stroke-width="1.5"/><circle cx="24" cy="24" r="2" fill="#b87333"/></svg>
        <svg viewBox="0 0 48 48"><circle cx="24" cy="24" r="20" stroke="#b87333" stroke-width="1" fill="none"/><line x1="24" y1="24" x2="36" y2="18" stroke="#b87333" stroke-width="1.5"/><circle cx="24" cy="24" r="2" fill="#39ff14"/></svg>
        <svg viewBox="0 0 48 48"><rect x="8" y="14" width="32" height="20" rx="3" stroke="#b87333" stroke-width="1" fill="none"/><line x1="14" y1="34" x2="14" y2="24" stroke="#39ff14" stroke-width="2"/><line x1="22" y1="34" x2="22" y2="28" stroke="#39ff14" stroke-width="2"/><line x1="30" y1="34" x2="30" y2="20" stroke="#39ff14" stroke-width="2"/><line x1="38" y1="34" x2="38" y2="26" stroke="#39ff14" stroke-width="2"/></svg>
      </div>

      <div id="main-area"></div>
    </div>
  `;

  initStars();
  initLangToggle();
  renderChangeKeyButton('apikey-change-container', lang());

  if (state.finished) {
    renderSummary();
  } else if (state.turn > 0) {
    renderNarrative();
  } else {
    renderSetup();
  }
}

// === STARS CANVAS ===
function initStars() {
  const canvas = document.getElementById('stars-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let w, h, stars = [];

  function resize() {
    w = canvas.width = window.innerWidth;
    h = canvas.height = window.innerHeight;
  }

  function createStars() {
    stars = [];
    for (let i = 0; i < 120; i++) {
      stars.push({ x: Math.random() * w, y: Math.random() * h, r: Math.random() * 1.5 + 0.3, speed: Math.random() * 0.15 + 0.02 });
    }
  }

  function draw() {
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#f2e8d5';
    for (const s of stars) {
      ctx.globalAlpha = 0.3 + Math.sin(Date.now() * s.speed * 0.01) * 0.3;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
      s.y += s.speed;
      if (s.y > h + 2) { s.y = -2; s.x = Math.random() * w; }
    }
    ctx.globalAlpha = 1;
    requestAnimationFrame(draw);
  }

  resize();
  createStars();
  draw();
  window.addEventListener('resize', () => { resize(); createStars(); });
}

// === LANG TOGGLE ===
function initLangToggle() {
  const btn = document.getElementById('lang-toggle');
  if (!btn) return;
  btn.addEventListener('click', () => {
    setLang(getLang() === 'es' ? 'en' : 'es');
    renderArtefacto();
  });
}

// === SETUP SCREEN ===
function renderSetup() {
  const area = document.getElementById('main-area');
  const epocaOptions = EPOCAS.map(e =>
    `<option value="${e.id}">${lang() === 'es' ? e.label_es : e.label_en}</option>`
  ).join('');

  area.innerHTML = `
    <div class="maquina-setup">
      <label class="maquina-label">${t('maquina_select_era')}</label>
      <select id="epoca-select" class="maquina-select">
        <option value="">—</option>
        ${epocaOptions}
      </select>
      <br>
      <input id="role-input" class="maquina-role-input" type="text" placeholder="${t('maquina_role_placeholder')}">
      <br>
      <button id="travel-btn" class="maquina-btn" disabled>${t('maquina_start')}</button>
    </div>
  `;

  const select = document.getElementById('epoca-select');
  const travelBtn = document.getElementById('travel-btn');

  select.addEventListener('change', () => {
    travelBtn.disabled = !select.value;
  });

  travelBtn.addEventListener('click', () => startTravel());
}

// === START TRAVEL ===
async function startTravel() {
  const select = document.getElementById('epoca-select');
  const roleInput = document.getElementById('role-input');
  state.epoca = EPOCAS.find(e => e.id === select.value);
  state.rol = roleInput.value.trim();
  state.turn = 1;
  state.history = [];

  flashEffect();
  await narrate();
}

// === FLASH EFFECT ===
function flashEffect() {
  const flash = document.getElementById('flash');
  if (!flash) return;
  flash.classList.add('active');
  setTimeout(() => flash.classList.remove('active'), 300);
}

// === NARRATE ===
async function narrate(actionText) {
  const area = document.getElementById('main-area');
  area.innerHTML = `<div class="maquina-loading">${t('maquina_traveling')}</div>`;

  const idioma = lang() === 'es' ? 'español' : 'inglés';
  const epocaLabel = lang() === 'es' ? state.epoca.label_es : state.epoca.label_en;
  const rolText = state.rol || (lang() === 'es' ? 'asigna uno coherente con la época' : 'assign one fitting the era');

  let contextHistory = '';
  if (state.history.length > 0) {
    contextHistory = '\n\nHistorial previo:\n' + state.history.map((h, i) =>
      `Turno ${i + 1}: ${h.narration}\nAcción elegida: ${h.action}`
    ).join('\n');
  }

  const systemPrompt = `Eres el narrador de una máquina del tiempo inmersiva. Hablas en ${idioma}.
El viajero ha llegado a: ${epocaLabel} (${state.epoca.year}).
Su rol elegido: ${rolText}.
Narra en segunda persona ("Llegas a...", "Sientes...", "Ves...").
Incluye detalles sensoriales reales y precisos históricamente: arquitectura, vestimenta, sonidos, olores.
Máximo 150 palabras de narración.
Luego genera exactamente 3 opciones de acción en formato:
ACCION_1: [texto corto]
ACCION_2: [texto corto]
ACCION_3: [texto corto]
Las acciones deben ser coherentes con el contexto histórico.${contextHistory}`;

  const userMsg = actionText
    ? `El viajero eligió: "${actionText}". Narra qué sucede a continuación.`
    : `Narra la escena de llegada del viajero.`;

  try {
    const response = await callGroq(systemPrompt, userMsg);
    if (!response) return;
    parseNarration(response);
    renderNarrative();
  } catch (err) {
    area.innerHTML = `<div class="maquina-loading" style="color:#ff4444">${err.message}</div>`;
  }
}

function parseNarration(text) {
  const lines = text.split('\n');
  const actions = [];
  const narrativeLines = [];

  for (const line of lines) {
    const match = line.match(/^ACCION_\d+:\s*(.+)/i);
    if (match) {
      actions.push(match[1].trim());
    } else {
      narrativeLines.push(line);
    }
  }

  state.narration = narrativeLines.join('\n').trim();
  state.actions = actions.length >= 3 ? actions.slice(0, 3) : actions;
}

// === RENDER NARRATIVE ===
function renderNarrative() {
  const area = document.getElementById('main-area');
  const isLastTurn = state.turn >= MAX_TURNS;

  let actionsHTML = '';
  if (!isLastTurn && state.actions.length > 0) {
    actionsHTML = `
      <p class="maquina-label" style="margin-top:24px">${t('maquina_action')}</p>
      <div class="maquina-actions">
        ${state.actions.map((a, i) => `<button class="maquina-action-btn" data-idx="${i}">${a}</button>`).join('')}
      </div>
    `;
  }

  const returnBtn = isLastTurn
    ? `<div style="text-align:center;margin-top:24px"><button class="maquina-btn" id="return-btn">${t('maquina_return')}</button></div>`
    : '';

  area.innerHTML = `
    <div class="maquina-narrative">
      <div class="maquina-turn-indicator">${t('maquina_turn')} ${state.turn} ${t('maquina_of')} ${MAX_TURNS}</div>
      <div class="maquina-text" id="narrative-text"></div>
      ${actionsHTML}
      ${returnBtn}
    </div>
  `;

  typewriterEffect(document.getElementById('narrative-text'), state.narration);

  // Bind action buttons
  area.querySelectorAll('.maquina-action-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const actionText = btn.textContent;
      state.history.push({ narration: state.narration, action: actionText });
      state.turn++;
      flashEffect();
      narrate(actionText);
    });
  });

  const returnBtnEl = document.getElementById('return-btn');
  if (returnBtnEl) {
    returnBtnEl.addEventListener('click', () => {
      state.history.push({ narration: state.narration, action: 'return' });
      state.finished = true;
      flashEffect();
      finishTrip();
    });
  }
}

// === TYPEWRITER ===
function typewriterEffect(el, text) {
  el.textContent = '';
  const cursor = document.createElement('span');
  cursor.className = 'cursor';
  el.appendChild(cursor);

  let i = 0;
  const interval = setInterval(() => {
    if (i < text.length) {
      el.insertBefore(document.createTextNode(text[i]), cursor);
      i++;
    } else {
      clearInterval(interval);
      setTimeout(() => cursor.remove(), 2000);
    }
  }, 18);
}

// === FINISH TRIP ===
async function finishTrip() {
  const area = document.getElementById('main-area');
  area.innerHTML = `<div class="maquina-loading">${t('maquina_traveling')}</div>`;

  const idioma = lang() === 'es' ? 'español' : 'inglés';
  const epocaLabel = lang() === 'es' ? state.epoca.label_es : state.epoca.label_en;

  const systemPrompt = `Proporciona exactamente 3 datos históricos fascinantes y verificables sobre ${epocaLabel} en ${idioma}.
Formato:
DATO_1: [título breve] | [explicación de 1 oración]
DATO_2: [título breve] | [explicación de 1 oración]
DATO_3: [título breve] | [explicación de 1 oración]`;

  try {
    const response = await callGroq(systemPrompt, `Datos sobre ${epocaLabel}`);
    if (!response) return;
    renderSummaryWithFacts(response);
  } catch (err) {
    area.innerHTML = `<div class="maquina-loading" style="color:#ff4444">${err.message}</div>`;
  }
}

function renderSummaryWithFacts(factsText) {
  const facts = [];
  const lines = factsText.split('\n');
  for (const line of lines) {
    const match = line.match(/^DATO_\d+:\s*(.+?)\s*\|\s*(.+)/i);
    if (match) facts.push({ name: match[1].trim(), desc: match[2].trim() });
  }

  renderSummaryUI(facts);
}

function renderSummary() {
  renderSummaryUI([]);
}

function renderSummaryUI(facts) {
  const area = document.getElementById('main-area');
  const epocaLabel = lang() === 'es' ? state.epoca.label_es : state.epoca.label_en;

  const summaryText = state.history.map((h, i) =>
    `${t('maquina_turn')} ${i + 1}: ${h.narration.substring(0, 120)}...`
  ).join('\n\n');

  const factsHTML = facts.length > 0 ? `
    <div class="maquina-facts">
      <h3 class="maquina-facts__title">${t('maquina_facts')}</h3>
      ${facts.map(f => `
        <div class="maquina-fact">
          <div class="maquina-fact__name">${f.name}</div>
          <div class="maquina-fact__desc">${f.desc}</div>
        </div>
      `).join('')}
    </div>
  ` : '';

  area.innerHTML = `
    <div class="maquina-summary">
      <h2 class="maquina-summary__title">${t('maquina_summary')} — ${epocaLabel}</h2>
      <div class="maquina-summary__text">${summaryText}</div>
      ${factsHTML}
      <div style="text-align:center;margin-top:32px">
        <button class="maquina-btn" id="new-trip-btn">${t('maquina_new_trip')}</button>
      </div>
    </div>
  `;

  document.getElementById('new-trip-btn').addEventListener('click', () => {
    state = { epoca: null, rol: '', turn: 0, history: [], narration: '', actions: [], finished: false };
    renderArtefacto();
  });
}

// === GROQ CALL WITH ERROR HANDLING ===
async function callGroq(systemPrompt, userMessage) {
  try {
    return await askGroq({ systemPrompt, userMessage, temperature: 0.9, maxTokens: 600 });
  } catch (err) {
    if (err.message === 'API_KEY_MISSING' || err.message === 'NO_KEY' || err.message === 'INVALID_KEY') {
      renderApiKeyPanel('app-container', () => renderArtefacto(), lang());
      return null;
    }
    throw err;
  }
}

document.addEventListener('DOMContentLoaded', init);
