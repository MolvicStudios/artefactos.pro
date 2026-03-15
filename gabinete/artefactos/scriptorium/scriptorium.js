// scriptorium.js — Lógica del Scriptorium
import { askGroq } from '../../js/groq.js';
import { getLang, setLang, t } from '../../js/i18n.js';

// === ESTADO ===
let selectedEra = 'medieval';
let history = []; // Últimas 2 transformaciones
const MAX_HISTORY = 2;
const MAX_WORDS = 500;

// === ÉPOCAS DISPONIBLES ===
const ERAS = ['medieval', 'renaissance', 'enlightenment', 'romanticism', 'beat', 'cyberpunk'];

// Mapeo de era a claves i18n
const ERA_KEYS = {
  medieval: 'scriptorium_era_medieval',
  renaissance: 'scriptorium_era_renaissance',
  enlightenment: 'scriptorium_era_enlightenment',
  romanticism: 'scriptorium_era_romanticism',
  beat: 'scriptorium_era_beat',
  cyberpunk: 'scriptorium_era_cyberpunk',
};

// Nombres de época para el prompt (en el idioma del estilo, no del usuario)
const ERA_PROMPT_NAMES = {
  medieval: 'Medieval',
  renaissance: 'Renacimiento',
  enlightenment: 'Iluminismo',
  romanticism: 'Romanticismo',
  beat: 'Modernismo Beat',
  cyberpunk: 'Cyberpunk Poético',
};

// === SYSTEM PROMPT ===
function getSystemPrompt(lang, era) {
  const idioma = lang === 'es' ? 'español' : 'English';
  const eraName = ERA_PROMPT_NAMES[era] || era;
  return `Eres un maestro del estilo literario. Hablas en ${idioma}.
Reescribe el siguiente texto adaptando su vocabulario, sintaxis y tono al estilo ${eraName}:
- Medieval: latín eclesiástico, metáforas religiosas, sintaxis arcaica
- Renacimiento: humanismo, referencia a clásicos grecolatinos, retórica elaborada
- Iluminismo: razón, claridad, estilo enciclopédico, citas filosóficas
- Romanticismo: emoción intensa, naturaleza, melancolía, vocabulario sublime
- Modernismo Beat: espontáneo, callejero, ritmo jazzístico, ruptura gramatical
- Cyberpunk Poético: tecnicismo mezclado con lírica, distopía, neologismos
Mantén el significado esencial. Adapta solo la forma. No expliques, solo reescribe.`;
}

// === INICIALIZACIÓN ===
document.addEventListener('DOMContentLoaded', () => {
  updateTexts();
  initEras();
  initEvents();
  updateWordCount();
});

// === TEXTOS BILINGÜES ===
function updateTexts() {
  document.getElementById('lang-toggle').textContent = t('selectLang');
  document.getElementById('back-btn').textContent = t('backBtn');
  document.getElementById('scriptorium-title').textContent = t('scriptorium_name');
  document.getElementById('input-label').textContent = t('scriptorium_input_label');
  document.getElementById('output-label').textContent = t('scriptorium_output_label');
  document.getElementById('scriptorium-textarea').placeholder = t('scriptorium_input_placeholder');
  document.getElementById('btn-transform').textContent = t('scriptorium_transform');
  document.getElementById('btn-copy').textContent = t('copyBtn');
  document.getElementById('history-title').textContent = t('scriptorium_history');

  // Actualizar texto de épocas
  document.querySelectorAll('.scriptorium-era').forEach(btn => {
    const era = btn.dataset.era;
    if (ERA_KEYS[era]) {
      btn.textContent = t(ERA_KEYS[era]);
    }
  });
}

// === INICIALIZAR BOTONES DE ÉPOCA ===
function initEras() {
  const container = document.getElementById('eras-container');
  container.innerHTML = '';

  ERAS.forEach(era => {
    const btn = document.createElement('button');
    btn.className = 'scriptorium-era' + (era === selectedEra ? ' selected' : '');
    btn.dataset.era = era;
    btn.textContent = t(ERA_KEYS[era]);
    btn.addEventListener('click', () => selectEra(era));
    container.appendChild(btn);
  });
}

function selectEra(era) {
  selectedEra = era;
  document.querySelectorAll('.scriptorium-era').forEach(btn => {
    btn.classList.toggle('selected', btn.dataset.era === era);
  });
}

// === EVENTOS ===
function initEvents() {
  // Idioma
  document.getElementById('lang-toggle').addEventListener('click', () => {
    const next = getLang() === 'es' ? 'en' : 'es';
    setLang(next);
    updateTexts();
    initEras();
    renderHistory();
  });

  // Transformar
  document.getElementById('btn-transform').addEventListener('click', handleTransform);

  // Copiar
  document.getElementById('btn-copy').addEventListener('click', handleCopy);

  // Contador de palabras
  document.getElementById('scriptorium-textarea').addEventListener('input', updateWordCount);
}

// === CONTADOR DE PALABRAS ===
function updateWordCount() {
  const textarea = document.getElementById('scriptorium-textarea');
  const text = textarea.value.trim();
  const words = text ? text.split(/\s+/).length : 0;
  const lang = getLang();
  document.getElementById('word-count').textContent = `${words} / ${MAX_WORDS} ${t('scriptorium_words')}`;

  // Limitar input si excede el máximo
  if (words > MAX_WORDS) {
    document.getElementById('word-count').style.color = '#e74c3c';
  } else {
    document.getElementById('word-count').style.color = '';
  }
}

// === TRANSFORMAR ===
async function handleTransform() {
  const textarea = document.getElementById('scriptorium-textarea');
  const text = textarea.value.trim();

  if (!text) return;

  // Validar límite de palabras
  const words = text.split(/\s+/).length;
  if (words > MAX_WORDS) {
    const lang = getLang();
    alert(lang === 'es' ? `El texto excede las ${MAX_WORDS} palabras.` : `Text exceeds ${MAX_WORDS} words.`);
    return;
  }

  const btnTransform = document.getElementById('btn-transform');
  const writing = document.getElementById('scriptorium-writing');
  const output = document.getElementById('scriptorium-output');
  const errorBox = document.getElementById('scriptorium-error');
  const seal = document.getElementById('scriptorium-seal');

  btnTransform.disabled = true;
  errorBox.classList.remove('active');
  seal.classList.remove('active');
  output.textContent = '';
  writing.classList.add('active');

  try {
    const answer = await askGroq({
      systemPrompt: getSystemPrompt(getLang(), selectedEra),
      userMessage: text,
      temperature: 0.9,
      maxTokens: 800
    });

    output.textContent = answer;

    // Mostrar sello visual
    const eraLabel = t(ERA_KEYS[selectedEra]);
    document.getElementById('seal-text').textContent = eraLabel;
    seal.classList.add('active');

    // Guardar en historial
    history.unshift({ era: eraLabel, eraKey: selectedEra, text: answer });
    if (history.length > MAX_HISTORY) history.pop();
    renderHistory();

  } catch (err) {
    errorBox.textContent = t('errorMsg') + ' — ' + err.message;
    errorBox.classList.add('active');
  } finally {
    btnTransform.disabled = false;
    writing.classList.remove('active');
  }
}

// === COPIAR RESULTADO ===
async function handleCopy() {
  const output = document.getElementById('scriptorium-output');
  const text = output.textContent;
  if (!text) return;

  const btn = document.getElementById('btn-copy');
  try {
    await navigator.clipboard.writeText(text);
    btn.textContent = t('copiedBtn');
    setTimeout(() => {
      btn.textContent = t('copyBtn');
    }, 2000);
  } catch {
    // Fallback para navegadores sin clipboard API
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
    btn.textContent = t('copiedBtn');
    setTimeout(() => {
      btn.textContent = t('copyBtn');
    }, 2000);
  }
}

// === RENDERIZAR HISTORIAL ===
function renderHistory() {
  const container = document.getElementById('history-list');
  const section = document.getElementById('scriptorium-history');

  if (history.length === 0) {
    section.classList.remove('active');
    return;
  }

  section.classList.add('active');
  container.innerHTML = '';

  history.forEach(item => {
    const div = document.createElement('div');
    div.className = 'scriptorium-history__item';
    div.innerHTML = `
      <div class="scriptorium-history__era">${escapeHtml(item.era)}</div>
      <div class="scriptorium-history__text">${escapeHtml(item.text)}</div>
    `;
    container.appendChild(div);
  });
}

// === UTILIDADES ===
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
