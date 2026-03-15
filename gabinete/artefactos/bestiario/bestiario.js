// artefactos/bestiario/bestiario.js
import { askGroq, hasGroqKey } from '../../js/groq.js';
import { renderApiKeyPanel, renderChangeKeyButton } from '../../js/apikey-panel.js';
import { t, getLang, setLang } from '../../js/i18n.js';

const lang = () => getLang();

const CRIATURAS_SUGERENCIAS = [
  'Dragón','Fénix','Grifo','Basilisco','Quimera','Hidra','Manticora','Sirena','Kraken','Banshee',
  'Wendigo','Kappa','Kitsune','Tengu','Oni','Bakunawa','Ammit','Esfinge','Minotauro','Cíclope',
  'Medusa','Harpía','Centauro','Unicornio','Pegaso','Leviatán','Behemoth','Golem','Vampiro',
  'Hombre Lobo','Striga','Rusalka','Domovoi','Peri','Djinn','Ifrit','Simurgh','Garuda','Naga',
  'Rakshasa','Thunderbird','Chupacabras','La Llorona','Patasola','Coco','Carbunclo','Luz Mala',
  'Jörmungandr','Fenrir','Cerbero'
];

let exploredCreatures = [];
let currentCreature = null;

function init() {
  if (!hasGroqKey()) {
    renderApiKeyPanel('app-container', () => renderArtefacto(), lang());
    return;
  }
  renderArtefacto();
}

function renderArtefacto() {
  const app = document.getElementById('app-container');
  document.body.className = 'bestiario-page';

  app.innerHTML = `
    <div class="bestiario-header">
      <a href="../../index.html" class="bestiario-back">${t('backBtn')}</a>
      <button class="bestiario-lang" id="lang-toggle">${t('selectLang')}</button>
    </div>
    <div class="bestiario-content">
      <h1 class="bestiario-title">${t('bestiario_name')}</h1>

      <!-- Celtic border decoration -->
      <div class="bestiario-border">
        <svg viewBox="0 0 240 20" fill="none">
          <path d="M0 10 Q30 0 60 10 Q90 20 120 10 Q150 0 180 10 Q210 20 240 10" stroke="#d4a017" stroke-width="1" fill="none" opacity="0.4"/>
          <path d="M0 10 Q30 20 60 10 Q90 0 120 10 Q150 20 180 10 Q210 0 240 10" stroke="#6b0f0f" stroke-width="0.8" fill="none" opacity="0.3"/>
        </svg>
      </div>

      <!-- Search -->
      <div class="bestiario-search" id="search-container">
        <input class="bestiario-search__input" id="search-input" type="text" placeholder="${t('bestiario_search_placeholder')}" autocomplete="off">
        <button class="bestiario-search__btn" id="search-btn">${t('bestiario_search')}</button>
        <div class="bestiario-suggestions" id="suggestions"></div>
      </div>
      <button class="bestiario-random-btn" id="random-btn">🎲 ${t('bestiario_random')}</button>

      <!-- Entry area -->
      <div id="entry-area"></div>

      <!-- Explored panel -->
      <div id="explored-panel"></div>
    </div>
  `;

  bindEvents();
  renderChangeKeyButton('apikey-change-container', lang());

  if (currentCreature) renderEntry(currentCreature);
  renderExplored();
}

function bindEvents() {
  const input = document.getElementById('search-input');
  const searchBtn = document.getElementById('search-btn');
  const randomBtn = document.getElementById('random-btn');
  const suggestions = document.getElementById('suggestions');

  document.getElementById('lang-toggle').addEventListener('click', () => {
    setLang(getLang() === 'es' ? 'en' : 'es');
    renderArtefacto();
  });

  input.addEventListener('input', () => {
    const val = input.value.trim().toLowerCase();
    if (val.length < 2) { suggestions.classList.remove('visible'); return; }
    const matches = CRIATURAS_SUGERENCIAS.filter(c => c.toLowerCase().includes(val)).slice(0, 8);
    if (matches.length === 0) { suggestions.classList.remove('visible'); return; }
    suggestions.innerHTML = matches.map(m => `<div class="bestiario-suggestion-item" data-name="${m}">${m}</div>`).join('');
    suggestions.classList.add('visible');
    suggestions.querySelectorAll('.bestiario-suggestion-item').forEach(item => {
      item.addEventListener('click', () => {
        input.value = item.dataset.name;
        suggestions.classList.remove('visible');
        searchCreature(item.dataset.name);
      });
    });
  });

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && input.value.trim()) {
      suggestions.classList.remove('visible');
      searchCreature(input.value.trim());
    }
  });

  searchBtn.addEventListener('click', () => {
    if (input.value.trim()) {
      suggestions.classList.remove('visible');
      searchCreature(input.value.trim());
    }
  });

  randomBtn.addEventListener('click', () => {
    const random = CRIATURAS_SUGERENCIAS[Math.floor(Math.random() * CRIATURAS_SUGERENCIAS.length)];
    input.value = random;
    suggestions.classList.remove('visible');
    searchCreature(random);
  });

  document.addEventListener('click', (e) => {
    if (!e.target.closest('#search-container')) suggestions.classList.remove('visible');
  });
}

async function searchCreature(name) {
  const area = document.getElementById('entry-area');
  area.innerHTML = `<div class="bestiario-loading">${t('bestiario_loading')}</div>`;

  const idioma = lang() === 'es' ? 'español' : 'inglés';

  const systemPrompt = `Eres el autor de un bestiario medieval erudito. Hablas en ${idioma}.
Escribe la entrada completa para la criatura: ${name}.
Responde SOLO en este formato JSON (sin markdown):
{
  "nombre": "Nombre oficial",
  "nombre_original": "Nombre en idioma de origen",
  "cultura": "Mitología o cultura de origen",
  "descripcion_fisica": "Descripción detallada del aspecto (2-3 oraciones)",
  "poderes": ["poder1", "poder2", "poder3"],
  "debilidades": ["debilidad1", "debilidad2"],
  "como_invocar": "Método de invocación o aparición (1-2 oraciones, tono de grimorio)",
  "como_protegerse": "Protección o repelente (1-2 oraciones)",
  "textos_historicos": "Mención en textos o fuentes reales (1-2 oraciones con títulos reales)",
  "nivel_peligro": número del 1 al 5,
  "habitat": "Dónde habita o se manifiesta",
  "tipo_svg": "Una de: serpiente / humanoide / bestia / amorfo / alado / acuatico"
}`;

  try {
    const response = await callGroq(systemPrompt, `Genera la ficha de: ${name}`);
    if (!response) return;

    const creature = parseJSON(response);
    if (!creature) {
      area.innerHTML = `<div class="bestiario-loading" style="color:#ff6b6b">Error parsing. Retrying...</div>`;
      setTimeout(() => searchCreature(name), 1500);
      return;
    }

    currentCreature = creature;
    if (!exploredCreatures.find(c => c.nombre === creature.nombre)) {
      exploredCreatures.push(creature);
    }
    renderEntry(creature);
    renderExplored();
  } catch (err) {
    area.innerHTML = `<div class="bestiario-loading" style="color:#ff6b6b">${err.message}</div>`;
  }
}

function parseJSON(text) {
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start === -1 || end === -1) return null;
  try {
    return JSON.parse(text.substring(start, end + 1));
  } catch {
    return null;
  }
}

function renderEntry(creature) {
  const area = document.getElementById('entry-area');
  const danger = parseInt(creature.nivel_peligro) || 3;
  const skulls = Array.from({ length: 5 }, (_, i) =>
    `<span class="bestiario-danger__skull ${i < danger ? '' : 'empty'}">☠</span>`
  ).join('');

  const firstLetter = creature.nombre.charAt(0);
  const restName = creature.nombre.slice(1);
  const powers = (creature.poderes || []).map(p => `<li>${p}</li>`).join('');
  const weaknesses = (creature.debilidades || []).map(w => `<li>${w}</li>`).join('');

  area.innerHTML = `
    <div class="bestiario-entry">
      <div class="bestiario-entry__text">
        <h2 class="bestiario-entry__name">${creature.nombre}</h2>
        <div class="bestiario-entry__original-name">${creature.nombre_original || ''}</div>
        <span class="bestiario-entry__culture">${creature.cultura || ''}</span>

        <p class="bestiario-entry__desc">
          <span class="bestiario-entry__dropcap">${firstLetter}</span>${restName.length > 0 ? restName + '. ' : ''}${creature.descripcion_fisica || ''}
        </p>

        <div class="bestiario-field">
          <div class="bestiario-field__label">${t('bestiario_danger')}</div>
          <div class="bestiario-danger">${skulls}</div>
        </div>

        <div class="bestiario-field">
          <div class="bestiario-field__label">${t('bestiario_habitat')}</div>
          <div class="bestiario-field__value">${creature.habitat || ''}</div>
        </div>

        <div class="bestiario-field">
          <div class="bestiario-field__label">${t('bestiario_powers')}</div>
          <ul class="bestiario-field__list">${powers}</ul>
        </div>

        <div class="bestiario-field">
          <div class="bestiario-field__label">${t('bestiario_weaknesses')}</div>
          <ul class="bestiario-field__list">${weaknesses}</ul>
        </div>

        <div class="bestiario-field">
          <div class="bestiario-field__label">${t('bestiario_invoke')}</div>
          <div class="bestiario-field__value">${creature.como_invocar || ''}</div>
        </div>

        <div class="bestiario-field">
          <div class="bestiario-field__label">${t('bestiario_protect')}</div>
          <div class="bestiario-field__value">${creature.como_protegerse || ''}</div>
        </div>

        <div class="bestiario-field">
          <div class="bestiario-field__label">${t('bestiario_texts')}</div>
          <div class="bestiario-field__value">${creature.textos_historicos || ''}</div>
        </div>
      </div>

      <div class="bestiario-illustration">
        ${generateCreatureSVG(creature.tipo_svg)}
      </div>
    </div>
  `;
}

function renderExplored() {
  const panel = document.getElementById('explored-panel');
  if (!panel || exploredCreatures.length === 0) { if (panel) panel.innerHTML = ''; return; }

  panel.innerHTML = `
    <div class="bestiario-explored">
      <h3 class="bestiario-explored__title">${t('bestiario_explored')} (${exploredCreatures.length})</h3>
      <div class="bestiario-explored__grid">
        ${exploredCreatures.map(c => `<button class="bestiario-explored__item" data-name="${c.nombre}">${c.nombre}</button>`).join('')}
      </div>
    </div>
  `;

  panel.querySelectorAll('.bestiario-explored__item').forEach(btn => {
    btn.addEventListener('click', () => {
      const found = exploredCreatures.find(c => c.nombre === btn.dataset.name);
      if (found) { currentCreature = found; renderEntry(found); }
    });
  });
}

// === SVG CREATURE ILLUSTRATIONS ===
function generateCreatureSVG(tipo) {
  const t = (tipo || 'bestia').toLowerCase();
  const svgs = {
    serpiente: `<svg viewBox="0 0 160 200" fill="none">
      <path d="M80 20 Q60 40 80 60 Q100 80 80 100 Q60 120 80 140 Q100 160 80 180" stroke="#d4a017" stroke-width="2" fill="none"/>
      <circle cx="76" cy="22" r="2" fill="#6b0f0f"/>
      <circle cx="84" cy="22" r="2" fill="#6b0f0f"/>
      <path d="M72 28 L80 32 L88 28" stroke="#d4a017" stroke-width="1" fill="none"/>
      <path d="M65 58 Q80 50 95 58" stroke="#d4a017" stroke-width="0.8" fill="none" opacity="0.4"/>
      <path d="M65 98 Q80 90 95 98" stroke="#d4a017" stroke-width="0.8" fill="none" opacity="0.4"/>
    </svg>`,
    humanoide: `<svg viewBox="0 0 160 200" fill="none">
      <circle cx="80" cy="40" r="20" stroke="#d4a017" stroke-width="1.5" fill="none"/>
      <circle cx="74" cy="36" r="3" fill="#6b0f0f"/>
      <circle cx="86" cy="36" r="3" fill="#6b0f0f"/>
      <line x1="80" y1="60" x2="80" y2="130" stroke="#d4a017" stroke-width="1.5"/>
      <line x1="80" y1="80" x2="50" y2="110" stroke="#d4a017" stroke-width="1.5"/>
      <line x1="80" y1="80" x2="110" y2="110" stroke="#d4a017" stroke-width="1.5"/>
      <line x1="80" y1="130" x2="60" y2="175" stroke="#d4a017" stroke-width="1.5"/>
      <line x1="80" y1="130" x2="100" y2="175" stroke="#d4a017" stroke-width="1.5"/>
      <path d="M72 45 Q80 50 88 45" stroke="#6b0f0f" stroke-width="1" fill="none"/>
    </svg>`,
    bestia: `<svg viewBox="0 0 160 200" fill="none">
      <ellipse cx="80" cy="80" rx="45" ry="30" stroke="#d4a017" stroke-width="1.5" fill="none"/>
      <circle cx="50" cy="60" r="15" stroke="#d4a017" stroke-width="1.5" fill="none"/>
      <circle cx="45" cy="56" r="3" fill="#6b0f0f"/>
      <circle cx="55" cy="56" r="3" fill="#6b0f0f"/>
      <path d="M42 65 Q50 70 58 65" stroke="#d4a017" stroke-width="1" fill="none"/>
      <line x1="50" y1="110" x2="40" y2="160" stroke="#d4a017" stroke-width="1.5"/>
      <line x1="70" y1="110" x2="60" y2="160" stroke="#d4a017" stroke-width="1.5"/>
      <line x1="90" y1="110" x2="100" y2="160" stroke="#d4a017" stroke-width="1.5"/>
      <line x1="110" y1="110" x2="120" y2="160" stroke="#d4a017" stroke-width="1.5"/>
      <path d="M125 80 Q140 75 145 85" stroke="#d4a017" stroke-width="1.5" fill="none"/>
    </svg>`,
    amorfo: `<svg viewBox="0 0 160 200" fill="none">
      <path d="M40 80 Q50 30 90 40 Q130 50 120 90 Q140 130 100 150 Q80 170 60 150 Q20 130 40 80Z" stroke="#d4a017" stroke-width="1.5" fill="rgba(212,160,23,0.04)"/>
      <circle cx="70" cy="75" r="5" fill="#6b0f0f" opacity="0.7"/>
      <circle cx="95" cy="70" r="4" fill="#6b0f0f" opacity="0.5"/>
      <circle cx="85" cy="90" r="3" fill="#6b0f0f" opacity="0.3"/>
      <path d="M60 110 Q80 100 100 110" stroke="#d4a017" stroke-width="0.8" fill="none" opacity="0.4"/>
    </svg>`,
    alado: `<svg viewBox="0 0 160 200" fill="none">
      <circle cx="80" cy="80" r="15" stroke="#d4a017" stroke-width="1.5" fill="none"/>
      <circle cx="75" cy="76" r="2.5" fill="#6b0f0f"/>
      <circle cx="85" cy="76" r="2.5" fill="#6b0f0f"/>
      <path d="M75 85 L80 88 L85 85" stroke="#d4a017" stroke-width="0.8" fill="none"/>
      <line x1="80" y1="95" x2="80" y2="145" stroke="#d4a017" stroke-width="1.5"/>
      <path d="M65 80 Q30 40 10 60 Q25 50 40 65 Q50 72 65 80" stroke="#d4a017" stroke-width="1.2" fill="none"/>
      <path d="M95 80 Q130 40 150 60 Q135 50 120 65 Q110 72 95 80" stroke="#d4a017" stroke-width="1.2" fill="none"/>
      <line x1="80" y1="145" x2="65" y2="180" stroke="#d4a017" stroke-width="1.2"/>
      <line x1="80" y1="145" x2="95" y2="180" stroke="#d4a017" stroke-width="1.2"/>
    </svg>`,
    acuatico: `<svg viewBox="0 0 160 200" fill="none">
      <ellipse cx="80" cy="90" rx="50" ry="25" stroke="#1a2f6b" stroke-width="1.5" fill="none"/>
      <circle cx="55" cy="82" r="4" fill="#6b0f0f"/>
      <path d="M35 90 Q25 90 20 80" stroke="#1a2f6b" stroke-width="1.2" fill="none"/>
      <path d="M130 85 L145 80 L130 95Z" fill="none" stroke="#1a2f6b" stroke-width="1.2"/>
      <path d="M60 115 Q80 130 100 115" stroke="#d4a017" stroke-width="0.8" fill="none" opacity="0.3"/>
      <path d="M50 125 Q80 140 110 125" stroke="#d4a017" stroke-width="0.6" fill="none" opacity="0.2"/>
      <path d="M70 100 Q80 105 90 100" stroke="#1a2f6b" stroke-width="1" fill="none"/>
    </svg>`
  };

  return svgs[t] || svgs.bestia;
}

// === GROQ CALL ===
async function callGroq(systemPrompt, userMessage) {
  try {
    return await askGroq({ systemPrompt, userMessage, temperature: 0.9, maxTokens: 700 });
  } catch (err) {
    if (err.message === 'API_KEY_MISSING' || err.message === 'NO_KEY' || err.message === 'INVALID_KEY') {
      renderApiKeyPanel('app-container', () => renderArtefacto(), lang());
      return null;
    }
    throw err;
  }
}

document.addEventListener('DOMContentLoaded', init);
