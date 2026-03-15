// musicsage.js — Lógica de MusicSage
import { askGroq } from '../../../js/groq.js';
import { getLang, setLang, t } from '../../../js/i18n.js';

// === ESTADO ===
let chatHistory = []; // Mensajes para contexto Groq (máx. 6 roles user/assistant)
const MAX_DISPLAY = 6;

// === SYSTEM PROMPT ===
function getSystemPrompt(lang) {
  const idioma = lang === 'es' ? 'español' : 'English';
  return `Eres MusicSage, un musicólogo apasionado y erudito. Hablas en ${idioma}. Conoces profundamente teoría musical, historia de la música desde la antigüedad hasta hoy, todos los géneros y tradiciones del mundo. Explicas con pasión pero con rigor académico. Cuando nombras obras, añades el año. Máximo 5 oraciones por respuesta. Ocasionalmente usas metáforas sonoras para explicar conceptos abstractos.`;
}

// === INICIALIZACIÓN ===
document.addEventListener('DOMContentLoaded', () => {
  updateTexts();
  initEvents();
});

// === TEXTOS BILINGÜES ===
function updateTexts() {
  document.getElementById('lang-toggle').textContent = t('selectLang');
  document.getElementById('back-btn').textContent = t('backBtn');
  document.getElementById('musicsage-title').textContent = t('musicsage_name');
  document.getElementById('musicsage-input').placeholder = t('musicsage_placeholder');
  document.getElementById('btn-send').textContent = t('musicsage_send');

  // Sugerencias
  const suggestions = document.querySelectorAll('.musicsage-suggestion');
  const keys = ['musicsage_suggestion1', 'musicsage_suggestion2', 'musicsage_suggestion3', 'musicsage_suggestion4', 'musicsage_suggestion5'];
  suggestions.forEach((el, i) => {
    if (keys[i]) el.textContent = t(keys[i]);
  });
}

// === EVENTOS ===
function initEvents() {
  // Idioma
  document.getElementById('lang-toggle').addEventListener('click', () => {
    const next = getLang() === 'es' ? 'en' : 'es';
    setLang(next);
    updateTexts();
  });

  // Enviar mensaje
  document.getElementById('btn-send').addEventListener('click', handleSend);
  document.getElementById('musicsage-input').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSend();
    }
  });

  // Sugerencias clickeables
  document.querySelectorAll('.musicsage-suggestion').forEach(btn => {
    btn.addEventListener('click', () => {
      document.getElementById('musicsage-input').value = btn.textContent;
      handleSend();
    });
  });
}

// === ENVIAR MENSAJE ===
async function handleSend() {
  const input = document.getElementById('musicsage-input');
  const message = input.value.trim();
  if (!message) return;

  const btnSend = document.getElementById('btn-send');
  const equalizer = document.getElementById('musicsage-equalizer');
  const errorBox = document.getElementById('musicsage-error');

  // Añadir mensaje del usuario al chat visual y al historial
  addMessage('user', message);
  chatHistory.push({ role: 'user', content: message });
  input.value = '';

  // Estado de carga
  btnSend.disabled = true;
  equalizer.classList.add('active');
  errorBox.classList.remove('active');

  try {
    // Enviar con historial para contexto conversacional
    const recentHistory = chatHistory.slice(-MAX_DISPLAY);

    const answer = await askGroq({
      systemPrompt: getSystemPrompt(getLang()),
      messages: recentHistory,
      temperature: 0.8,
      maxTokens: 500
    });

    chatHistory.push({ role: 'assistant', content: answer });
    addMessage('ai', answer);

    // Limitar historial almacenado
    if (chatHistory.length > MAX_DISPLAY) {
      chatHistory = chatHistory.slice(-MAX_DISPLAY);
    }

  } catch (err) {
    errorBox.textContent = t('errorMsg') + ' — ' + err.message;
    errorBox.classList.add('active');
  } finally {
    btnSend.disabled = false;
    equalizer.classList.remove('active');
  }
}

// === AÑADIR MENSAJE AL CHAT VISUAL ===
function addMessage(type, text) {
  const chat = document.getElementById('musicsage-chat');
  const div = document.createElement('div');
  div.className = `musicsage-message musicsage-message--${type}`;
  div.textContent = text;
  chat.appendChild(div);

  // Scroll al último mensaje
  chat.scrollTop = chat.scrollHeight;

  // Limitar mensajes visibles
  const messages = chat.querySelectorAll('.musicsage-message');
  if (messages.length > MAX_DISPLAY * 2) {
    messages[0].remove();
  }
}
