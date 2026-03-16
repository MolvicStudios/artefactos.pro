// scriptorium.js — Lógica del Scriptorium
import { askGroq, hasApiKey } from '../../../js/groq.js';
import { renderApiKeyPanel } from '../../../js/apikey-panel.js';

const lang = localStorage.getItem('artefactos_lang') || 'es';

const ERAS = ['medieval', 'renaissance', 'enlightenment', 'romanticism', 'beat', 'cyberpunk'];

const txt = {
  es: {
    langToggle: 'EN', back: '← Volver',
    title: 'El Scriptorium',
    inputLabel: 'Tu texto original', outputLabel: 'Texto transformado',
    placeholder: 'Pega o escribe tu texto aquí (máx. 500 palabras)...',
    transform: 'Transformar', copy: 'Copiar', copied: '¡Copiado!',
    historyTitle: 'Transformaciones anteriores',
    writing: 'Transcribiendo...',
    words: 'palabras', exceeded: 'El texto excede las 500 palabras.',
    eras: { medieval: 'Medieval', renaissance: 'Renacimiento', enlightenment: 'Iluminismo', romanticism: 'Romanticismo', beat: 'Beat', cyberpunk: 'Cyberpunk' },
    error: 'Error al transformar'
  },
  en: {
    langToggle: 'ES', back: '← Back',
    title: 'The Scriptorium',
    inputLabel: 'Your original text', outputLabel: 'Transformed text',
    placeholder: 'Paste or write your text here (max 500 words)...',
    transform: 'Transform', copy: 'Copy', copied: 'Copied!',
    historyTitle: 'Previous transformations',
    writing: 'Transcribing...',
    words: 'words', exceeded: 'Text exceeds 500 words.',
    eras: { medieval: 'Medieval', renaissance: 'Renaissance', enlightenment: 'Enlightenment', romanticism: 'Romanticism', beat: 'Beat', cyberpunk: 'Cyberpunk' },
    error: 'Error transforming'
  }
};
const t = txt[lang] || txt.es;

const ERA_PROMPT_NAMES = {
  medieval: 'Medieval', renaissance: 'Renacimiento', enlightenment: 'Iluminismo',
  romanticism: 'Romanticismo', beat: 'Modernismo Beat', cyberpunk: 'Cyberpunk Poético',
};

let selectedEra = 'medieval';
let history = [];
const MAX_HISTORY = 2;
const MAX_WORDS = 500;

function getSystemPrompt(era) {
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

document.addEventListener('DOMContentLoaded', () => {
  if (!hasApiKey()) {
    document.querySelector('main').style.display = 'none';
    renderApiKeyPanel('key-panel', () => {
      document.getElementById('key-panel').innerHTML = '';
      document.querySelector('main').style.display = '';
      setup();
    }, lang);
    return;
  }
  setup();
});

function setup() {
  updateTexts();
  initEras();
  initEvents();
  updateWordCount();
}

function updateTexts() {
  document.getElementById('lang-toggle').textContent = t.langToggle;
  document.getElementById('back-btn').textContent = t.back;
  document.getElementById('scriptorium-title').textContent = t.title;
  document.getElementById('input-label').textContent = t.inputLabel;
  document.getElementById('output-label').textContent = t.outputLabel;
  document.getElementById('scriptorium-textarea').placeholder = t.placeholder;
  document.getElementById('btn-transform').textContent = t.transform;
  document.getElementById('btn-copy').textContent = t.copy;
  document.getElementById('history-title').textContent = t.historyTitle;
  document.getElementById('writing-text').textContent = t.writing;

  document.querySelectorAll('.scriptorium-era').forEach(btn => {
    const era = btn.dataset.era;
    if (t.eras[era]) btn.textContent = t.eras[era];
  });
}

function initEras() {
  const container = document.getElementById('eras-container');
  container.innerHTML = '';

  ERAS.forEach(era => {
    const btn = document.createElement('button');
    btn.className = 'scriptorium-era' + (era === selectedEra ? ' selected' : '');
    btn.dataset.era = era;
    btn.textContent = t.eras[era] || era;
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

function initEvents() {
  document.getElementById('lang-toggle').addEventListener('click', () => {
    localStorage.setItem('artefactos_lang', lang === 'es' ? 'en' : 'es');
    location.reload();
  });

  document.getElementById('btn-transform').addEventListener('click', handleTransform);
  document.getElementById('btn-copy').addEventListener('click', handleCopy);
  document.getElementById('scriptorium-textarea').addEventListener('input', updateWordCount);
}

function updateWordCount() {
  const textarea = document.getElementById('scriptorium-textarea');
  const text = textarea.value.trim();
  const words = text ? text.split(/\s+/).length : 0;
  const el = document.getElementById('word-count');
  el.textContent = `${words} / ${MAX_WORDS} ${t.words}`;
  el.style.color = words > MAX_WORDS ? '#e74c3c' : '';
}

async function handleTransform() {
  const textarea = document.getElementById('scriptorium-textarea');
  const text = textarea.value.trim();
  if (!text) return;

  const words = text.split(/\s+/).length;
  if (words > MAX_WORDS) { alert(t.exceeded); return; }

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
      systemPrompt: getSystemPrompt(selectedEra),
      userMessage: text,
      temperature: 0.9,
      maxTokens: 800
    });

    output.textContent = answer;
    const eraLabel = t.eras[selectedEra] || selectedEra;
    document.getElementById('seal-text').textContent = eraLabel;
    seal.classList.add('active');

    history.unshift({ era: eraLabel, eraKey: selectedEra, text: answer });
    if (history.length > MAX_HISTORY) history.pop();
    renderHistory();
  } catch (err) {
    errorBox.textContent = t.error + ' — ' + err.message;
    errorBox.classList.add('active');
  } finally {
    btnTransform.disabled = false;
    writing.classList.remove('active');
  }
}

async function handleCopy() {
  const output = document.getElementById('scriptorium-output');
  const text = output.textContent;
  if (!text) return;

  const btn = document.getElementById('btn-copy');
  try {
    await navigator.clipboard.writeText(text);
    btn.textContent = t.copied;
    setTimeout(() => { btn.textContent = t.copy; }, 2000);
  } catch {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
    btn.textContent = t.copied;
    setTimeout(() => { btn.textContent = t.copy; }, 2000);
  }
}

function renderHistory() {
  const container = document.getElementById('history-list');
  const section = document.getElementById('scriptorium-history');

  if (history.length === 0) { section.classList.remove('active'); return; }

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

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
