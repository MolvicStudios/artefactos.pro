// alquimista.js — Lógica del Alquimista
import { askGroq, hasApiKey } from '../../../js/groq.js';
import { renderApiKeyPanel } from '../../../js/apikey-panel.js';

const lang = localStorage.getItem('artefactos_lang') || 'es';

const txt = {
  es: {
    langToggle: 'EN', back: '← Volver',
    title: 'El Alquimista',
    placeholder: 'Pregunta al Alquimista...', send: 'Preguntar',
    grimoire: 'Grimorio',
    error: 'Error al consultar'
  },
  en: {
    langToggle: 'ES', back: '← Back',
    title: 'The Alchemist',
    placeholder: 'Ask the Alchemist...', send: 'Ask',
    grimoire: 'Grimoire',
    error: 'Error consulting'
  }
};
const t = txt[lang] || txt.es;

let chatHistory = [];
const MAX_DISPLAY = 8;

const symbols = [
  { icon: '☿', es: 'Mercurio — El mensajero, la mente fluida', en: 'Mercury — The messenger, the fluid mind' },
  { icon: '☉', es: 'Sol — El oro espiritual, la perfección', en: 'Sun — Spiritual gold, perfection' },
  { icon: '☽', es: 'Luna — La plata del alma, lo receptivo', en: 'Moon — Silver of the soul, the receptive' },
  { icon: '♀', es: 'Venus — El cobre, la armonía', en: 'Venus — Copper, harmony' },
  { icon: '♂', es: 'Marte — El hierro, la voluntad', en: 'Mars — Iron, willpower' },
  { icon: '♃', es: 'Júpiter — El estaño, la expansión', en: 'Jupiter — Tin, expansion' },
  { icon: '♄', es: 'Saturno — El plomo, la transmutación', en: 'Saturn — Lead, transmutation' },
  { icon: '△', es: 'Fuego — Elemento de transformación', en: 'Fire — Element of transformation' },
  { icon: '▽', es: 'Agua — Elemento de disolución', en: 'Water — Element of dissolution' },
  { icon: '◇', es: 'Piedra filosofal — La obra magna', en: "Philosopher's stone — The great work" },
];

const grimoire = {
  es: [
    { icon: '☿', name: 'Mercurio', def: 'Principio de fluidez y transformación. El mediador entre Sol y Luna.' },
    { icon: '🜍', name: 'Azufre', def: 'El alma combustible, principio de actividad y voluntad.' },
    { icon: '🜔', name: 'Sal', def: 'El cuerpo, la materia fija, principio de solidificación.' },
    { icon: '◇', name: 'Piedra Filosofal', def: 'El agente perfecto de transmutación. Meta de la Gran Obra.' },
    { icon: '🝔', name: 'Athanor', def: 'El horno alquímico, símbolo del cuerpo humano como crisol.' },
    { icon: '△', name: 'Fuego', def: 'Elemento activo, seco y caliente. Motor de toda calcinación.' },
    { icon: '▽', name: 'Agua', def: 'Elemento pasivo, frío y húmedo. Principio de disolución.' },
    { icon: '☉', name: 'Oro', def: 'Metal perfecto. Símbolo del Sol y la iluminación espiritual.' },
    { icon: '☽', name: 'Plata', def: 'Metal lunar. Reflejo, intuición y lo femenino sagrado.' },
    { icon: '⊛', name: 'Quintaesencia', def: 'El quinto elemento, la esencia pura más allá de los cuatro.' },
  ],
  en: [
    { icon: '☿', name: 'Mercury', def: 'Principle of fluidity and transformation. Mediator between Sun and Moon.' },
    { icon: '🜍', name: 'Sulphur', def: 'The combustible soul, principle of activity and will.' },
    { icon: '🜔', name: 'Salt', def: 'The body, fixed matter, principle of solidification.' },
    { icon: '◇', name: "Philosopher's Stone", def: 'Perfect agent of transmutation. Goal of the Great Work.' },
    { icon: '🝔', name: 'Athanor', def: 'The alchemical furnace, symbol of the human body as crucible.' },
    { icon: '△', name: 'Fire', def: 'Active element, dry and hot. Engine of all calcination.' },
    { icon: '▽', name: 'Water', def: 'Passive element, cold and wet. Principle of dissolution.' },
    { icon: '☉', name: 'Gold', def: 'Perfect metal. Symbol of the Sun and spiritual illumination.' },
    { icon: '☽', name: 'Silver', def: 'Lunar metal. Reflection, intuition and the sacred feminine.' },
    { icon: '⊛', name: 'Quintessence', def: 'The fifth element, pure essence beyond the four.' },
  ]
};

function getSystemPrompt() {
  const idioma = lang === 'es' ? 'español' : 'English';
  return `Eres Paracelso, el gran alquimista y filósofo hermético. Hablas en ${idioma}. Tu conocimiento abarca la filosofía neoplatónica, la alquimia árabe y europea, el hermetismo de Hermes Trismegisto y la proto-ciencia medieval. Hablas con gravedad y misterio, usando términos alquímicos reales ocasionalmente (explicándolos brevemente). Máximo 5 oraciones. Termina siempre con una máxima o aforismo breve.`;
}

document.addEventListener('DOMContentLoaded', () => {
  if (!hasApiKey()) {
    const layout = document.querySelector('.alquimista-layout');
    if (layout) layout.style.display = 'none';
    renderApiKeyPanel('key-panel', () => {
      document.getElementById('key-panel').innerHTML = '';
      if (layout) layout.style.display = '';
      setup();
    }, lang);
    return;
  }
  setup();
});

function setup() {
  updateTexts();
  renderGrimoire();
  initEvents();
}

function updateTexts() {
  document.getElementById('lang-toggle').textContent = t.langToggle;
  document.getElementById('back-btn').textContent = t.back;
  document.getElementById('alquimista-title').textContent = t.title;
  document.getElementById('alquimista-input').placeholder = t.placeholder;
  document.getElementById('btn-send').textContent = t.send;
  document.getElementById('grimoire-title').textContent = t.grimoire;
  document.getElementById('grimoire-toggle').textContent = '📜 ' + t.grimoire;
}

function renderGrimoire() {
  const list = document.getElementById('grimoire-list');
  list.innerHTML = '';
  grimoire[lang].forEach(term => {
    const div = document.createElement('div');
    div.className = 'alquimista-grimoire__term';
    div.innerHTML = `
      <div class="alquimista-grimoire__term-name">
        <span class="alquimista-grimoire__term-icon">${term.icon}</span>${term.name}
      </div>
      <div class="alquimista-grimoire__term-def">${term.def}</div>
    `;
    list.appendChild(div);
  });
}

function initEvents() {
  document.getElementById('lang-toggle').addEventListener('click', () => {
    localStorage.setItem('artefactos_lang', lang === 'es' ? 'en' : 'es');
    location.reload();
  });

  document.getElementById('btn-send').addEventListener('click', handleSend);
  document.getElementById('alquimista-input').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { e.preventDefault(); handleSend(); }
  });

  document.getElementById('grimoire-toggle').addEventListener('click', () => {
    document.getElementById('grimoire-content').classList.toggle('collapsed');
  });
}

async function handleSend() {
  const input = document.getElementById('alquimista-input');
  const message = input.value.trim();
  if (!message) return;

  const btnSend = document.getElementById('btn-send');
  const loader = document.getElementById('alquimista-loader');
  const errorBox = document.getElementById('alquimista-error');

  addMessage('user', message);
  chatHistory.push({ role: 'user', content: message });
  input.value = '';

  btnSend.disabled = true;
  loader.classList.add('active');
  errorBox.classList.remove('active');

  try {
    const recentHistory = chatHistory.slice(-MAX_DISPLAY);
    const historyText = recentHistory.map(m => `${m.role}: ${m.content}`).join('\n');

    const answer = await askGroq({
      systemPrompt: getSystemPrompt(),
      userMessage: historyText,
      temperature: 0.85,
      maxTokens: 500
    });

    chatHistory.push({ role: 'assistant', content: answer });

    const randomSymbol = symbols[Math.floor(Math.random() * symbols.length)];
    const symbolText = lang === 'es' ? randomSymbol.es : randomSymbol.en;
    addMessage('ai', answer, { icon: randomSymbol.icon, text: symbolText });

    if (chatHistory.length > MAX_DISPLAY) chatHistory = chatHistory.slice(-MAX_DISPLAY);
  } catch (err) {
    errorBox.textContent = t.error + ' — ' + err.message;
    errorBox.classList.add('active');
  } finally {
    btnSend.disabled = false;
    loader.classList.remove('active');
  }
}

function addMessage(type, text, symbol) {
  const chat = document.getElementById('alquimista-chat');
  const div = document.createElement('div');
  div.className = `alquimista-message alquimista-message--${type}`;

  let html = escapeHtml(text);
  if (symbol) {
    html += `<div class="alquimista-symbol-badge">
      <span class="alquimista-symbol-badge__icon">${symbol.icon}</span>
      ${escapeHtml(symbol.text)}
    </div>`;
  }

  div.innerHTML = html;
  chat.appendChild(div);
  chat.scrollTop = chat.scrollHeight;

  const msgs = chat.querySelectorAll('.alquimista-message');
  if (msgs.length > MAX_DISPLAY * 2) msgs[0].remove();
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
