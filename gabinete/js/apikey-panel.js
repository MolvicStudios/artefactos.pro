// js/apikey-panel.js — Panel fullscreen de ingreso de API Key para artefactos
// Patrón: si no hay key, muestra este panel en lugar del artefacto

import { getGroqKey, setGroqKey, hasGroqKey } from './groq.js';
import { t } from './i18n.js';

const GROQ_CONSOLE_URL = 'https://console.groq.com';

/**
 * Renderiza un panel de ingreso de API Key dentro del contenedor dado.
 * Reemplaza el contenido del contenedor.
 * @param {string} containerId - ID del elemento contenedor
 * @param {Function} onSuccess - Callback cuando la clave se guarda con éxito
 * @param {string} lang - Idioma actual ('es' o 'en')
 */
export function renderApiKeyPanel(containerId, onSuccess, lang) {
  const container = document.getElementById(containerId);
  if (!container) return;

  container.innerHTML = `
    <div class="apikey-panel">
      <div class="apikey-panel__card">
        <h2 class="apikey-panel__title">${t('apikey_panel_title', lang)}</h2>
        <p class="apikey-panel__desc">${t('apikey_panel_desc', lang)}</p>
        <div class="apikey-panel__field">
          <input id="apikey-panel-input" class="apikey-panel__input" type="text"
                 placeholder="${t('apikey_panel_placeholder', lang)}" autocomplete="off" spellcheck="false">
          <button id="apikey-panel-save" class="apikey-panel__save">${t('apikey_panel_save', lang)}</button>
        </div>
        <a class="apikey-panel__link" href="${GROQ_CONSOLE_URL}" target="_blank" rel="noopener noreferrer">
          ${t('apikey_panel_get', lang)}
        </a>
      </div>
    </div>
  `;

  const input = document.getElementById('apikey-panel-input');
  const saveBtn = document.getElementById('apikey-panel-save');

  function handleSave() {
    const value = input.value.trim();
    if (!value) return;
    setGroqKey(value);
    if (onSuccess) onSuccess();
  }

  saveBtn.addEventListener('click', handleSave);
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') handleSave();
  });

  setTimeout(() => input.focus(), 100);
}

/**
 * Renderiza un botón discreto para cambiar la clave API.
 * @param {string} containerId - ID del elemento contenedor
 * @param {string} lang - Idioma actual
 */
export function renderChangeKeyButton(containerId, lang) {
  const container = document.getElementById(containerId);
  if (!container) return;

  container.innerHTML = `
    <button class="apikey-change-btn" title="${t('apikey_panel_change', lang)}">
      🔑
    </button>
  `;

  container.querySelector('.apikey-change-btn').addEventListener('click', () => {
    const newKey = prompt(t('apikey_panel_placeholder', lang));
    if (newKey && newKey.trim()) {
      setGroqKey(newKey.trim());
      location.reload();
    }
  });
}

/**
 * Comprueba si hay API Key configurada (alias de hasGroqKey)
 * @returns {boolean}
 */
export function hasApiKey() {
  return hasGroqKey();
}
