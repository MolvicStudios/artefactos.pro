// musicsage.js — Lógica de MusicSage
import { askGroq, hasApiKey } from '../../../js/groq.js';
import { renderApiKeyPanel } from '../../../js/apikey-panel.js';

const lang = localStorage.getItem('artefactos_lang') || 'es';

const txt = {
  es: {
    langToggle: 'EN', back: '← Volver',
    title: 'MusicSage', placeholder: 'Pregunta sobre música...', send: 'Enviar',
    suggestions: ['¿Qué es el modo dórico?', 'Historia del jazz', '¿Por qué suena triste el modo menor?', 'Explica la forma sonata', 'Orígenes del blues'],
    error: 'Error al consultar'
  },
  en: {
    langToggle: 'ES', back: '← Back',
    title: 'MusicSage', placeholder: 'Ask about music...', send: 'Send',
    suggestions: ['What is the Dorian mode?', 'History of jazz', 'Why does minor key sound sad?', 'Explain sonata form', 'Origins of the blues'],
    error: 'Error consulting'
  }
};
const t = txt[lang] || txt.es;

let chatHistory = [];
const MAX_DISPLAY = 6;

function getSystemPrompt() {
  const idioma = lang === 'es' ? 'español' : 'English';
  return `Eres MusicSage, un musicólogo apasionado y erudito. Hablas en ${idioma}. Conoces profundamente teoría musical, historia de la música desde la antigüedad hasta hoy, todos los géneros y tradiciones del mundo. Explicas con pasión pero con rigor académico. Cuando nombras obras, añades el año. Máximo 5 oraciones por respuesta. Ocasionalmente usas metáforas sonoras para explicar conceptos abstractos.`;
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
  document.getElementById('musicsage-title').textContent = t.title;
  document.getElementById('musicsage-input').placeholder = t.placeholder;
  document.getElementById('btn-send').textContent = t.send;

  const suggestions = document.querySelectorAll('.musicsage-suggestion');
  suggestions.forEach((el, i) => {
    if (t.suggestions[i]) el.textContent = t.suggestions[i];
  });
}

function initEvents() {
  document.getElementById('lang-toggle').addEventListener('click', () => {
    localStorage.setItem('artefactos_lang', lang === 'es' ? 'en' : 'es');
    location.reload();
  });

  document.getElementById('btn-send').addEventListener('click', handleSend);
  document.getElementById('musicsage-input').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { e.preventDefault(); handleSend(); }
  });

  document.querySelectorAll('.musicsage-suggestion').forEach(btn => {
    btn.addEventListener('click', () => {
      document.getElementById('musicsage-input').value = btn.textContent;
      handleSend();
    });
  });
}

async function handleSend() {
  const input = document.getElementById('musicsage-input');
  const message = input.value.trim();
  if (!message) return;

  const btnSend = document.getElementById('btn-send');
  const equalizer = document.getElementById('musicsage-equalizer');
  const errorBox = document.getElementById('musicsage-error');

  addMessage('user', message);
  chatHistory.push({ role: 'user', content: message });
  input.value = '';

  btnSend.disabled = true;
  equalizer.classList.add('active');
  errorBox.classList.remove('active');

  try {
    const recentHistory = chatHistory.slice(-MAX_DISPLAY);
    const historyText = recentHistory.map(m => `${m.role}: ${m.content}`).join('\n');

    const answer = await askGroq({
      systemPrompt: getSystemPrompt(),
      userMessage: historyText,
      temperature: 0.8,
      maxTokens: 500
    });

    chatHistory.push({ role: 'assistant', content: answer });
    addMessage('ai', answer);

    if (chatHistory.length > MAX_DISPLAY) {
      chatHistory = chatHistory.slice(-MAX_DISPLAY);
    }
  } catch (err) {
    errorBox.textContent = t.error + ' — ' + err.message;
    errorBox.classList.add('active');
  } finally {
    btnSend.disabled = false;
    equalizer.classList.remove('active');
  }
}

function addMessage(type, text) {
  const chat = document.getElementById('musicsage-chat');
  const div = document.createElement('div');
  div.className = `musicsage-message musicsage-message--${type}`;
  div.textContent = text;
  chat.appendChild(div);
  chat.scrollTop = chat.scrollHeight;

  const messages = chat.querySelectorAll('.musicsage-message');
  if (messages.length > MAX_DISPLAY * 2) messages[0].remove();
}
