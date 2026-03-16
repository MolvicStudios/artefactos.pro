// artefactos/gabinete-objetos/gabinete-objetos.js
import { askGroq, hasApiKey } from '../../../js/groq.js';
import { renderApiKeyPanel, renderChangeKeyButton } from '../../../js/apikey-panel.js';

const lang = () => localStorage.getItem('artefactos_lang') || 'es';
function setLang(l) { localStorage.setItem('artefactos_lang', l); }

const TXT = {
  es: {
    back: '← Volver', langToggle: 'EN', title: 'Gabinete de Objetos',
    counter: 'Objetos descubiertos:', ofInf: 'de ∞',
    loading: 'Buscando en las vitrinas...',
    reveal: 'Revelar objeto', use: 'Uso original', story: 'Historia',
    anecdote: 'Anécdota', location: 'Ubicación actual',
    rarity: 'Rareza', next: 'Siguiente objeto',
    parseError: 'No se pudo interpretar la respuesta. Intenta de nuevo.'
  },
  en: {
    back: '← Back', langToggle: 'ES', title: 'Cabinet of Objects',
    counter: 'Objects discovered:', ofInf: 'of ∞',
    loading: 'Searching the display cases...',
    reveal: 'Reveal object', use: 'Original use', story: 'Story',
    anecdote: 'Anecdote', location: 'Current location',
    rarity: 'Rarity', next: 'Next object',
    parseError: 'Could not parse the response. Try again.'
  }
};
function T(key) { return (TXT[lang()] || TXT.es)[key] || key; }

let objectCount = 0;
let seenNames = [];
let currentObject = null;
let revealed = false;

function init() {
  if (!hasApiKey()) {
    renderApiKeyPanel('app-container', () => renderArtefacto(), lang());
    return;
  }
  renderArtefacto();
}

function renderArtefacto() {
  const app = document.getElementById('app-container');
  document.body.className = 'gabobj-page';

  app.innerHTML = `
    <div class="gabobj-header">
      <a href="../../../index.html" class="gabobj-back">${T('back')}</a>
      <button class="gabobj-lang" id="lang-toggle">${T('langToggle')}</button>
    </div>
    <h1 class="gabobj-title">${T('title')}</h1>
    <div class="gabobj-counter" id="obj-counter"></div>
    <div class="gabobj-vitrina" id="vitrina"></div>
  `;

  document.getElementById('lang-toggle').addEventListener('click', () => {
    setLang(lang() === 'es' ? 'en' : 'es');
    renderArtefacto();
    if (currentObject) {
      if (revealed) renderRevealed();
      else renderMystery();
    } else {
      loadNewObject();
    }
  });

  renderChangeKeyButton('apikey-change-container', lang());

  if (currentObject) {
    updateCounter();
    if (revealed) renderRevealed();
    else renderMystery();
  } else {
    loadNewObject();
  }
}

function updateCounter() {
  const el = document.getElementById('obj-counter');
  if (el) el.textContent = `${T('counter')} ${objectCount} ${T('ofInf')}`;
}

async function loadNewObject() {
  const vitrina = document.getElementById('vitrina');
  vitrina.innerHTML = `<div class="gabobj-loading">${T('loading')}</div>`;
  revealed = false;

  const idioma = lang() === 'es' ? 'español' : 'inglés';
  const avoidList = seenNames.length > 0 ? `\nNo repitas estos objetos: ${seenNames.join(', ')}` : '';

  const systemPrompt = `Eres el curador de un gabinete de curiosidades. Hablas en ${idioma}.
Genera un objeto histórico real, insólito y fascinante que podría estar en una vitrina de museo.
Responde SOLO en este formato JSON (sin markdown, sin explicación extra):
{
  "nombre": "Nombre real del objeto",
  "epoca": "Siglo o año aproximado",
  "origen": "País o región de origen",
  "categoria": "Una de: instrumento / aparato / joya / arma / reliquia / juguete / otro",
  "uso_original": "Para qué servía realmente (1 oración)",
  "historia": "Historia fascinante del objeto (3-4 oraciones con datos reales)",
  "anecdota": "La anécdota más insólita o perturbadora (1-2 oraciones)",
  "ubicacion_actual": "Museo o colección donde se puede ver hoy (real)",
  "rareza": puntuación del 1 al 5 de lo extraño que es
}
No repitas objetos comunes. Prioriza lo realmente insólito y verificable.${avoidList}`;

  try {
    const response = await callGroq(systemPrompt, 'Genera un objeto para la vitrina.');
    if (!response) return;

    const obj = parseJSON(response);
    if (!obj) {
      vitrina.innerHTML = `<div class="gabobj-loading" style="color:#ff6b6b">${T('parseError')}</div>`;
      return;
    }

    currentObject = obj;
    objectCount++;
    seenNames.push(obj.nombre);
    updateCounter();
    renderMystery();
  } catch (err) {
    vitrina.innerHTML = `<div class="gabobj-loading" style="color:#ff6b6b">${err.message}</div>`;
  }
}

function parseJSON(text) {
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start === -1 || end === -1) return null;
  try { return JSON.parse(text.substring(start, end + 1)); }
  catch { return null; }
}

function renderMystery() {
  const vitrina = document.getElementById('vitrina');
  const obj = currentObject;
  const catalogNum = `MV-${String(objectCount).padStart(4, '0')}`;

  vitrina.innerHTML = `
    <div class="gabobj-case">
      <div class="gabobj-illustration">${generateSVG(obj.categoria)}</div>
      <div class="gabobj-label">
        <div class="gabobj-label__catalog">${catalogNum}</div>
        <div class="gabobj-label__origin">${obj.origen}</div>
        <div class="gabobj-label__era">${obj.epoca}</div>
      </div>
      <button class="gabobj-reveal-btn" id="reveal-btn">${T('reveal')}</button>
    </div>
  `;

  document.getElementById('reveal-btn').addEventListener('click', () => {
    revealed = true;
    renderRevealed();
  });
}

function renderRevealed() {
  const vitrina = document.getElementById('vitrina');
  const obj = currentObject;
  const catalogNum = `MV-${String(objectCount).padStart(4, '0')}`;
  const rareza = parseInt(obj.rareza) || 3;

  const stars = Array.from({ length: 5 }, (_, i) =>
    `<svg class="gabobj-rarity__star ${i < rareza ? '' : 'empty'}" viewBox="0 0 14 14"><polygon points="7,1 9,5 13,5.5 10,8.5 11,13 7,10.5 3,13 4,8.5 1,5.5 5,5"/></svg>`
  ).join('');

  vitrina.innerHTML = `
    <div class="gabobj-case">
      <div class="gabobj-illustration">${generateSVG(obj.categoria)}</div>
      <div class="gabobj-label">
        <div class="gabobj-label__catalog">${catalogNum}</div>
        <div class="gabobj-label__origin">${obj.origen}</div>
        <div class="gabobj-label__era">${obj.epoca}</div>
      </div>
      <div class="gabobj-info">
        <h2 class="gabobj-info__name">${obj.nombre}</h2>
        <div class="gabobj-info__field">
          <div class="gabobj-info__field-label">${T('use')}</div>
          <div class="gabobj-info__field-value">${obj.uso_original}</div>
        </div>
        <div class="gabobj-info__field">
          <div class="gabobj-info__field-label">${T('story')}</div>
          <div class="gabobj-info__field-value">${obj.historia}</div>
        </div>
        <div class="gabobj-info__field">
          <div class="gabobj-info__field-label">${T('anecdote')}</div>
          <div class="gabobj-info__field-value">${obj.anecdota}</div>
        </div>
        <div class="gabobj-info__field">
          <div class="gabobj-info__field-label">${T('location')}</div>
          <div class="gabobj-info__field-value">${obj.ubicacion_actual}</div>
        </div>
        <div class="gabobj-info__field">
          <div class="gabobj-info__field-label">${T('rarity')}</div>
          <div class="gabobj-rarity">${stars}</div>
        </div>
      </div>
      <button class="gabobj-next-btn" id="next-btn">${T('next')}</button>
    </div>
  `;

  document.getElementById('next-btn').addEventListener('click', () => {
    currentObject = null;
    revealed = false;
    loadNewObject();
  });
}

function generateSVG(categoria) {
  const cat = (categoria || 'otro').toLowerCase();
  const svgs = {
    instrumento: `<svg viewBox="0 0 140 140" fill="none">
      <rect x="50" y="20" width="40" height="100" rx="4" stroke="#c8a951" stroke-width="1.5" fill="none"/>
      <circle cx="70" cy="50" r="8" stroke="#c8a951" stroke-width="1" fill="none"/>
      <circle cx="70" cy="50" r="3" fill="#c8a951" opacity="0.5"/>
      <line x1="50" y1="75" x2="90" y2="75" stroke="#c8a951" stroke-width="0.8"/>
      <circle cx="60" cy="90" r="4" stroke="#c8a951" stroke-width="1" fill="none"/>
      <circle cx="80" cy="90" r="4" stroke="#c8a951" stroke-width="1" fill="none"/>
      <rect x="46" y="16" width="48" height="4" rx="2" fill="#c8a951" opacity="0.3"/>
    </svg>`,
    joya: `<svg viewBox="0 0 140 140" fill="none">
      <polygon points="70,15 95,50 85,95 55,95 45,50" stroke="#c8a951" stroke-width="1.5" fill="none"/>
      <polygon points="70,25 88,50 80,85 60,85 52,50" stroke="#c8a951" stroke-width="0.8" fill="rgba(200,169,81,0.08)"/>
      <line x1="70" y1="25" x2="70" y2="85" stroke="#c8a951" stroke-width="0.5" opacity="0.4"/>
      <line x1="52" y1="50" x2="88" y2="50" stroke="#c8a951" stroke-width="0.5" opacity="0.4"/>
      <circle cx="70" cy="50" r="6" fill="rgba(200,169,81,0.15)" stroke="#c8a951" stroke-width="0.8"/>
      <ellipse cx="70" cy="110" rx="30" ry="6" fill="rgba(200,169,81,0.06)"/>
    </svg>`,
    arma: `<svg viewBox="0 0 140 140" fill="none">
      <line x1="70" y1="15" x2="70" y2="100" stroke="#c8a951" stroke-width="2.5"/>
      <path d="M58 100 L70 120 L82 100Z" fill="none" stroke="#c8a951" stroke-width="1.5"/>
      <line x1="50" y1="30" x2="90" y2="30" stroke="#c8a951" stroke-width="1.5"/>
      <circle cx="50" cy="30" r="3" fill="#c8a951" opacity="0.4"/>
      <circle cx="90" cy="30" r="3" fill="#c8a951" opacity="0.4"/>
      <path d="M64 18 Q70 10 76 18" stroke="#c8a951" stroke-width="1" fill="none"/>
    </svg>`,
    reliquia: `<svg viewBox="0 0 140 140" fill="none">
      <rect x="35" y="30" width="70" height="80" rx="6" stroke="#c8a951" stroke-width="1.5" fill="none"/>
      <rect x="42" y="37" width="56" height="66" rx="3" stroke="#c8a951" stroke-width="0.8" fill="rgba(200,169,81,0.04)"/>
      <line x1="70" y1="45" x2="70" y2="85" stroke="#c8a951" stroke-width="1.5"/>
      <line x1="55" y1="65" x2="85" y2="65" stroke="#c8a951" stroke-width="1.5"/>
      <circle cx="70" cy="25" r="8" stroke="#c8a951" stroke-width="1" fill="none"/>
      <circle cx="70" cy="25" r="3" fill="#c8a951" opacity="0.4"/>
    </svg>`,
    aparato: `<svg viewBox="0 0 140 140" fill="none">
      <rect x="30" y="30" width="80" height="80" rx="4" stroke="#c8a951" stroke-width="1.5" fill="none"/>
      <circle cx="55" cy="55" r="12" stroke="#c8a951" stroke-width="1" fill="none"/>
      <circle cx="55" cy="55" r="5" fill="#c8a951" opacity="0.2"/>
      <circle cx="90" cy="50" r="8" stroke="#c8a951" stroke-width="1" fill="none"/>
      <line x1="90" y1="42" x2="90" y2="50" stroke="#c8a951" stroke-width="1"/>
      <rect x="75" y="70" width="25" height="12" rx="2" stroke="#c8a951" stroke-width="0.8" fill="none"/>
      <path d="M40 78 Q50 72 60 78 Q70 84 80 78" stroke="#c8a951" stroke-width="0.8" fill="none"/>
    </svg>`,
    juguete: `<svg viewBox="0 0 140 140" fill="none">
      <circle cx="70" cy="60" r="30" stroke="#c8a951" stroke-width="1.5" fill="rgba(200,169,81,0.05)"/>
      <circle cx="60" cy="52" r="4" fill="#c8a951" opacity="0.4"/>
      <circle cx="80" cy="52" r="4" fill="#c8a951" opacity="0.4"/>
      <path d="M60 70 Q70 80 80 70" stroke="#c8a951" stroke-width="1.2" fill="none"/>
      <line x1="70" y1="90" x2="70" y2="115" stroke="#c8a951" stroke-width="1.5"/>
      <line x1="55" y1="100" x2="85" y2="100" stroke="#c8a951" stroke-width="1.5"/>
    </svg>`,
    otro: `<svg viewBox="0 0 140 140" fill="none">
      <polygon points="70,15 110,45 95,95 45,95 30,45" stroke="#c8a951" stroke-width="1.5" fill="none"/>
      <circle cx="70" cy="60" r="15" stroke="#c8a951" stroke-width="0.8" fill="rgba(200,169,81,0.06)"/>
      <circle cx="70" cy="60" r="5" fill="#c8a951" opacity="0.3"/>
      <line x1="70" y1="45" x2="70" y2="75" stroke="#c8a951" stroke-width="0.5" opacity="0.4"/>
    </svg>`
  };
  return svgs[cat] || svgs.otro;
}

async function callGroq(systemPrompt, userMessage) {
  try {
    return await askGroq({ systemPrompt, userMessage, temperature: 0.95, maxTokens: 700 });
  } catch (err) {
    if (err.message === 'NO_KEY' || err.message === 'INVALID_KEY') {
      renderApiKeyPanel('app-container', () => renderArtefacto(), lang());
      return null;
    }
    throw err;
  }
}

document.addEventListener('DOMContentLoaded', init);
