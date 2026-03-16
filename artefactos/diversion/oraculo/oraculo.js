// oraculo.js — Lógica del Oráculo de Delfos
import { askGroq, hasApiKey } from '../../../js/groq.js';
import { renderApiKeyPanel } from '../../../js/apikey-panel.js';

const lang = localStorage.getItem('artefactos_lang') || 'es';

const txt = {
  es: {
    langToggle: 'EN', back: '← Volver',
    title: 'El Oráculo de Delfos',
    placeholder: 'Escribe tu pregunta al Oráculo...', ask: 'Consultar al Oráculo',
    newQ: 'Nueva consulta', loading: 'Invocando sabiduría...',
    inscriptions: 'Inscripciones anteriores',
    error: 'Error al consultar'
  },
  en: {
    langToggle: 'ES', back: '← Back',
    title: 'The Oracle of Delphi',
    placeholder: 'Ask the Oracle your question...', ask: 'Consult the Oracle',
    newQ: 'New consultation', loading: 'Invoking wisdom...',
    inscriptions: 'Previous inscriptions',
    error: 'Error consulting'
  }
};
const t = txt[lang] || txt.es;

let history = [];
const MAX_HISTORY = 3;

function getSystemPrompt() {
  const idioma = lang === 'es' ? 'español' : 'English';
  return `Eres la Pitia, el oráculo de Delfos. Hablas en ${idioma}. Respondes con ambigüedad profética, usando metáforas de la naturaleza, referencias a los dioses olímpicos y el destino. Nunca das respuestas directas. Siempre hay dos lecturas posibles. Máximo 4 oraciones. Comienza siempre con una invocación a Apolo o una imagen natural poderosa.`;
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
  initEvents();
}

function updateTexts() {
  document.getElementById('lang-toggle').textContent = t.langToggle;
  document.getElementById('back-btn').textContent = t.back;
  document.getElementById('oraculo-title').textContent = t.title;
  document.getElementById('oraculo-input').placeholder = t.placeholder;
  document.getElementById('btn-ask').textContent = t.ask;
  document.getElementById('btn-new').textContent = t.newQ;
  document.getElementById('loader-text').textContent = t.loading;
  document.getElementById('inscriptions-title').textContent = t.inscriptions;
  renderHistory();
}

function initEvents() {
  document.getElementById('lang-toggle').addEventListener('click', () => {
    localStorage.setItem('artefactos_lang', lang === 'es' ? 'en' : 'es');
    location.reload();
  });

  document.getElementById('btn-ask').addEventListener('click', handleAsk);

  document.getElementById('oraculo-input').addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleAsk(); }
  });

  document.getElementById('btn-new').addEventListener('click', handleNew);
}

async function handleAsk() {
  const input = document.getElementById('oraculo-input');
  const question = input.value.trim();
  if (!question) return;

  const btnAsk = document.getElementById('btn-ask');
  const loader = document.getElementById('oraculo-loader');
  const responseBox = document.getElementById('oraculo-response');
  const responseText = document.getElementById('oraculo-response-text');
  const errorBox = document.getElementById('oraculo-error');

  btnAsk.disabled = true;
  errorBox.classList.remove('active');
  responseBox.classList.remove('active');
  loader.classList.add('active');

  try {
    const answer = await askGroq({
      systemPrompt: getSystemPrompt(),
      userMessage: question,
      temperature: 0.9,
      maxTokens: 300
    });

    loader.classList.remove('active');
    responseBox.classList.add('active');
    typewriterEffect(responseText, answer);

    history.unshift({ question, answer });
    if (history.length > MAX_HISTORY) history.pop();
    renderHistory();
  } catch (err) {
    loader.classList.remove('active');
    errorBox.textContent = t.error + ' — ' + err.message;
    errorBox.classList.add('active');
  } finally {
    btnAsk.disabled = false;
  }
}

function typewriterEffect(element, text) {
  element.innerHTML = '';
  const chars = text.split('');
  chars.forEach((char, i) => {
    const span = document.createElement('span');
    span.className = 'char';
    span.textContent = char;
    span.style.animationDelay = `${i * 30}ms`;
    element.appendChild(span);
  });
}

function handleNew() {
  const responseBox = document.getElementById('oraculo-response');
  const input = document.getElementById('oraculo-input');
  const errorBox = document.getElementById('oraculo-error');

  if (responseBox.classList.contains('active')) {
    responseBox.classList.add('oraculo-fade-out');
    setTimeout(() => {
      responseBox.classList.remove('active', 'oraculo-fade-out');
      document.getElementById('oraculo-response-text').innerHTML = '';
    }, 600);
  }

  errorBox.classList.remove('active');
  input.value = '';
  input.focus();
}

function renderHistory() {
  const container = document.getElementById('inscriptions-list');
  const section = document.getElementById('oraculo-inscriptions');

  if (history.length === 0) { section.style.display = 'none'; return; }

  section.style.display = 'block';
  container.innerHTML = '';

  history.forEach(({ question, answer }) => {
    const div = document.createElement('div');
    div.className = 'oraculo-inscription';
    div.innerHTML = `
      <div class="oraculo-inscription__question">❝ ${escapeHtml(question)} ❞</div>
      <div class="oraculo-inscription__answer">${escapeHtml(answer)}</div>
    `;
    container.appendChild(div);
  });
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
