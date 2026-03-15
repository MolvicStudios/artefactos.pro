// apikey-panel.js — Componente UI para ingreso de clave Groq
// Diseño adaptado a la estética dark/futurista de artefactos.pro

import { saveApiKey, getApiKey, clearApiKey } from './groq.js';

/**
 * Renderiza el panel de ingreso de clave API
 * @param {string} containerId - ID del contenedor donde renderizar
 * @param {Function} onActivated - Callback al activar la clave correctamente
 * @param {string} lang - Idioma actual ('es' | 'en')
 */
export function renderApiKeyPanel(containerId, onActivated, lang = 'es') {
  const container = document.getElementById(containerId);
  if (!container) return;

  const t = textos[lang] || textos.es;

  container.innerHTML = `
    <div class="apikey-panel">
      <h2 class="apikey-title">${t.title}</h2>
      <p class="apikey-desc">${t.desc}</p>
      <a class="apikey-link" href="https://console.groq.com/keys" target="_blank" rel="noopener noreferrer">${t.link}</a>
      <div class="apikey-input-wrap">
        <input type="password" id="apikey-input" class="apikey-input"
               placeholder="${t.placeholder}" autocomplete="off" spellcheck="false" />
        <button id="apikey-btn" class="apikey-btn">${t.btn}</button>
      </div>
      <p id="apikey-msg" class="apikey-msg" aria-live="polite"></p>
    </div>
  `;

  // Inyectar estilos del panel
  inyectarEstilos();

  const input = document.getElementById('apikey-input');
  const btn = document.getElementById('apikey-btn');
  const msg = document.getElementById('apikey-msg');

  btn.addEventListener('click', () => activar(input, msg, t, onActivated));
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') activar(input, msg, t, onActivated);
  });
}

/**
 * Renderiza un botón para cambiar la clave existente
 * @param {string} containerId - ID del contenedor
 * @param {string} lang - Idioma actual ('es' | 'en')
 */
export function renderChangeKeyButton(containerId, lang = 'es') {
  const container = document.getElementById(containerId);
  if (!container) return;

  const t = textos[lang] || textos.es;

  const btn = document.createElement('button');
  btn.className = 'apikey-change-btn';
  btn.textContent = t.change;
  btn.addEventListener('click', () => {
    clearApiKey();
    location.reload();
  });

  container.appendChild(btn);
}

// — Lógica interna —

function activar(input, msg, t, onActivated) {
  const valor = input.value.trim();

  if (!valor) {
    mostrarMsg(msg, t.error_empty, 'error');
    return;
  }

  if (!valor.startsWith('gsk_')) {
    mostrarMsg(msg, t.error_format, 'error');
    return;
  }

  saveApiKey(valor);
  mostrarMsg(msg, t.success, 'success');

  setTimeout(() => {
    if (typeof onActivated === 'function') onActivated();
  }, 600);
}

function mostrarMsg(el, texto, tipo) {
  el.textContent = texto;
  el.className = `apikey-msg apikey-msg--${tipo}`;
}

// Textos bilingües del panel
const textos = {
  es: {
    title: 'Activa los artefactos',
    desc: 'Necesitas una clave de API de Groq gratuita para usar cualquier artefacto.',
    link: '→ Obtener clave gratis en console.groq.com',
    placeholder: 'Pega tu clave aquí (gsk_...)',
    btn: 'Activar',
    success: '¡Activado!',
    error_empty: 'Pega una clave válida antes de continuar.',
    error_format: 'La clave debe comenzar por gsk_',
    change: 'Cambiar clave API'
  },
  en: {
    title: 'Activate the artifacts',
    desc: 'You need a free Groq API key to use any artifact.',
    link: '→ Get a free key at console.groq.com',
    placeholder: 'Paste your key here (gsk_...)',
    btn: 'Activate',
    success: 'Activated!',
    error_empty: 'Paste a valid key before continuing.',
    error_format: 'Key must start with gsk_',
    change: 'Change API key'
  }
};

// Estilos inline del panel (se inyectan una sola vez)
let estilosInyectados = false;
function inyectarEstilos() {
  if (estilosInyectados) return;
  estilosInyectados = true;

  const style = document.createElement('style');
  style.textContent = `
    .apikey-panel {
      max-width: 480px;
      margin: 2rem auto;
      padding: 2rem;
      background: rgba(255,255,255,0.03);
      border: 1px solid rgba(255,255,255,0.07);
      border-radius: 12px;
      text-align: center;
      font-family: 'DM Sans', sans-serif;
    }
    .apikey-title {
      font-family: 'Syne', sans-serif;
      font-weight: 700;
      font-size: 1.4rem;
      color: #f4f4f5;
      margin: 0 0 0.5rem;
    }
    .apikey-desc {
      color: #a1a1aa;
      font-size: 0.95rem;
      margin: 0 0 0.75rem;
      line-height: 1.5;
    }
    .apikey-link {
      display: inline-block;
      color: #e8c96a;
      font-size: 0.9rem;
      text-decoration: none;
      margin-bottom: 1.25rem;
      transition: opacity 0.2s;
    }
    .apikey-link:hover { opacity: 0.8; }
    .apikey-input-wrap {
      display: flex;
      gap: 0.5rem;
    }
    .apikey-input {
      flex: 1;
      padding: 0.65rem 0.9rem;
      border: 1px solid rgba(232,201,106,0.2);
      border-radius: 8px;
      background: rgba(255,255,255,0.04);
      color: #f4f4f5;
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.85rem;
      outline: none;
      transition: border-color 0.2s;
    }
    .apikey-input:focus {
      border-color: #e8c96a;
    }
    .apikey-input::placeholder {
      color: #52525b;
    }
    .apikey-btn {
      padding: 0.65rem 1.4rem;
      background: #e8c96a;
      color: #09090b;
      font-family: 'DM Sans', sans-serif;
      font-weight: 500;
      font-size: 0.9rem;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      transition: opacity 0.2s;
    }
    .apikey-btn:hover { opacity: 0.85; }
    .apikey-msg {
      margin-top: 0.75rem;
      font-size: 0.85rem;
      min-height: 1.2em;
    }
    .apikey-msg--success { color: #34d399; }
    .apikey-msg--error { color: #f87171; }
    .apikey-change-btn {
      display: inline-block;
      padding: 0.4rem 1rem;
      background: transparent;
      color: #a1a1aa;
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 6px;
      font-family: 'DM Sans', sans-serif;
      font-size: 0.8rem;
      cursor: pointer;
      transition: color 0.2s, border-color 0.2s;
    }
    .apikey-change-btn:hover {
      color: #e8c96a;
      border-color: rgba(232,201,106,0.3);
    }
  `;
  document.head.appendChild(style);
}
