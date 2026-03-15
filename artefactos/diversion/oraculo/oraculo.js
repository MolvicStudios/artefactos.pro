// oraculo.js — Lógica del Oráculo de Delfos
import { askGroq } from '../../../js/groq.js';
import { getLang, setLang, t } from '../../../js/i18n.js';

// === ESTADO ===
let history = []; // Últimas 3 consultas
const MAX_HISTORY = 3;

// === SYSTEM PROMPT ===
function getSystemPrompt(lang) {
  const idioma = lang === 'es' ? 'español' : 'English';
  return `Eres la Pitia, el oráculo de Delfos. Hablas en ${idioma}. Respondes con ambigüedad profética, usando metáforas de la naturaleza, referencias a los dioses olímpicos y el destino. Nunca das respuestas directas. Siempre hay dos lecturas posibles. Máximo 4 oraciones. Comienza siempre con una invocación a Apolo o una imagen natural poderosa.`;
}

// === INICIALIZACIÓN ===
document.addEventListener('DOMContentLoaded', () => {
  updateTexts();
  initEvents();
});

// === TEXTOS BILINGÜES ===
function updateTexts() {
  const lang = getLang();

  document.getElementById('lang-toggle').textContent = t('selectLang');
  document.getElementById('back-btn').textContent = t('backBtn');
  document.getElementById('oraculo-title').textContent = t('oraculo_name');
  document.getElementById('oraculo-input').placeholder = t('oraculo_placeholder');
  document.getElementById('btn-ask').textContent = t('oraculo_ask');
  document.getElementById('btn-new').textContent = t('oraculo_new');
  document.getElementById('loader-text').textContent = t('loading');
  document.getElementById('inscriptions-title').textContent = t('oraculo_inscriptions');

  // Re-renderizar historial con nuevo idioma
  renderHistory();
}

// === EVENTOS ===
function initEvents() {
  // Selector de idioma
  document.getElementById('lang-toggle').addEventListener('click', () => {
    const next = getLang() === 'es' ? 'en' : 'es';
    setLang(next);
    updateTexts();
  });

  // Botón consultar
  document.getElementById('btn-ask').addEventListener('click', handleAsk);

  // Enter para enviar (Shift+Enter para nueva línea)
  document.getElementById('oraculo-input').addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleAsk();
    }
  });

  // Botón nueva consulta
  document.getElementById('btn-new').addEventListener('click', handleNew);
}

// === CONSULTAR AL ORÁCULO ===
async function handleAsk() {
  const input = document.getElementById('oraculo-input');
  const question = input.value.trim();
  if (!question) return;

  const btnAsk = document.getElementById('btn-ask');
  const loader = document.getElementById('oraculo-loader');
  const responseBox = document.getElementById('oraculo-response');
  const responseText = document.getElementById('oraculo-response-text');
  const errorBox = document.getElementById('oraculo-error');

  // Resetear estado visual
  btnAsk.disabled = true;
  errorBox.classList.remove('active');
  responseBox.classList.remove('active');
  loader.classList.add('active');

  try {
    const answer = await askGroq({
      systemPrompt: getSystemPrompt(getLang()),
      userMessage: question,
      temperature: 0.9,
      maxTokens: 300
    });

    loader.classList.remove('active');
    responseBox.classList.add('active');

    // Efecto typewriter letra a letra
    typewriterEffect(responseText, answer);

    // Guardar en historial
    history.unshift({ question, answer });
    if (history.length > MAX_HISTORY) history.pop();
    renderHistory();

  } catch (err) {
    loader.classList.remove('active');
    errorBox.textContent = t('errorMsg') + ' — ' + err.message;
    errorBox.classList.add('active');
  } finally {
    btnAsk.disabled = false;
  }
}

// === EFECTO TYPEWRITER ===
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

// === NUEVA CONSULTA ===
function handleNew() {
  const responseBox = document.getElementById('oraculo-response');
  const input = document.getElementById('oraculo-input');
  const errorBox = document.getElementById('oraculo-error');

  // Efecto de humo al desvanecer
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

// === RENDERIZAR HISTORIAL ===
function renderHistory() {
  const container = document.getElementById('inscriptions-list');
  const section = document.getElementById('oraculo-inscriptions');

  if (history.length === 0) {
    section.style.display = 'none';
    return;
  }

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

// === UTILIDADES ===
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
