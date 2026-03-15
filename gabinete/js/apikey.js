// js/apikey.js — Módulo compartido para el panel de API Key de Groq
// Inyecta un drawer en la cabecera para que el usuario pegue su clave

import { getGroqKey, setGroqKey, hasGroqKey } from './groq.js';
import { getLang, t } from './i18n.js';

const GROQ_CONSOLE_URL = 'https://console.groq.com';

/**
 * Inicializa el panel de API Key: inyecta HTML, eventos y estado
 * Llamar en el DOMContentLoaded de cada página
 */
export function initApiKeyUI() {
  injectHTML();
  bindEvents();
  updateStatus();
}

/**
 * Actualiza los textos del panel según el idioma actual
 */
export function updateApiKeyTexts() {
  const btn = document.getElementById('apikey-toggle');
  const title = document.getElementById('apikey-title');
  const desc = document.getElementById('apikey-desc');
  const input = document.getElementById('apikey-input');
  const saveBtn = document.getElementById('apikey-save');
  const getLink = document.getElementById('apikey-get-link');
  const removeBtn = document.getElementById('apikey-remove');
  const status = document.getElementById('apikey-status');

  if (btn) btn.textContent = t('apikey_btn');
  if (title) title.textContent = t('apikey_title');
  if (desc) desc.textContent = t('apikey_desc');
  if (input) input.placeholder = t('apikey_placeholder');
  if (saveBtn) saveBtn.textContent = t('apikey_save');
  if (getLink) getLink.textContent = t('apikey_get');
  if (removeBtn) removeBtn.textContent = t('apikey_remove');
  if (status) {
    status.textContent = hasGroqKey() ? t('apikey_status_ok') : t('apikey_status_missing');
    status.className = 'apikey-status ' + (hasGroqKey() ? 'apikey-status--ok' : 'apikey-status--missing');
  }
}

// === INYECTAR HTML DEL DRAWER ===
function injectHTML() {
  const header = document.querySelector('.gabinete-header');
  if (!header) return;

  // Botón de API Key en el header (antes del lang-toggle)
  const langBtn = document.getElementById('lang-toggle');
  const keyBtn = document.createElement('button');
  keyBtn.id = 'apikey-toggle';
  keyBtn.className = 'apikey-toggle';
  keyBtn.textContent = t('apikey_btn');
  keyBtn.setAttribute('aria-label', 'API Key');
  if (langBtn) {
    // Crear wrapper si no existe
    let wrapper = header.querySelector('.gabinete-header__actions');
    if (!wrapper) {
      wrapper = document.createElement('div');
      wrapper.className = 'gabinete-header__actions';
      langBtn.parentNode.insertBefore(wrapper, langBtn);
      wrapper.appendChild(keyBtn);
      wrapper.appendChild(langBtn);
    } else {
      wrapper.insertBefore(keyBtn, langBtn);
    }
  } else {
    header.appendChild(keyBtn);
  }

  // Drawer / panel
  const drawer = document.createElement('div');
  drawer.id = 'apikey-drawer';
  drawer.className = 'apikey-drawer';
  drawer.innerHTML = `
    <div class="apikey-drawer__content">
      <h3 id="apikey-title" class="apikey-drawer__title">${t('apikey_title')}</h3>
      <p id="apikey-desc" class="apikey-drawer__desc">${t('apikey_desc')}</p>

      <div class="apikey-drawer__field">
        <input id="apikey-input" class="apikey-drawer__input" type="password" 
               placeholder="${t('apikey_placeholder')}" autocomplete="off" spellcheck="false">
        <button id="apikey-save" class="apikey-drawer__save">${t('apikey_save')}</button>
      </div>

      <div class="apikey-drawer__footer">
        <a id="apikey-get-link" class="apikey-drawer__link" href="${GROQ_CONSOLE_URL}" 
           target="_blank" rel="noopener noreferrer">${t('apikey_get')}</a>
        <span id="apikey-status" class="apikey-status ${hasGroqKey() ? 'apikey-status--ok' : 'apikey-status--missing'}">
          ${hasGroqKey() ? t('apikey_status_ok') : t('apikey_status_missing')}
        </span>
      </div>

      <button id="apikey-remove" class="apikey-drawer__remove" ${!hasGroqKey() ? 'style="display:none"' : ''}>
        ${t('apikey_remove')}
      </button>
    </div>
  `;

  document.body.appendChild(drawer);

  // Overlay para cerrar al hacer click fuera
  const overlay = document.createElement('div');
  overlay.id = 'apikey-overlay';
  overlay.className = 'apikey-overlay';
  document.body.appendChild(overlay);
}

// === EVENTOS ===
function bindEvents() {
  const toggle = document.getElementById('apikey-toggle');
  const drawer = document.getElementById('apikey-drawer');
  const overlay = document.getElementById('apikey-overlay');
  const saveBtn = document.getElementById('apikey-save');
  const removeBtn = document.getElementById('apikey-remove');
  const input = document.getElementById('apikey-input');

  if (toggle) {
    toggle.addEventListener('click', () => {
      const isOpen = drawer.classList.contains('open');
      if (isOpen) {
        closeDrawer();
      } else {
        openDrawer();
      }
    });
  }

  if (overlay) {
    overlay.addEventListener('click', closeDrawer);
  }

  if (saveBtn) {
    saveBtn.addEventListener('click', handleSave);
  }

  if (input) {
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') handleSave();
    });
  }

  if (removeBtn) {
    removeBtn.addEventListener('click', handleRemove);
  }
}

function openDrawer() {
  const drawer = document.getElementById('apikey-drawer');
  const overlay = document.getElementById('apikey-overlay');
  const input = document.getElementById('apikey-input');

  drawer.classList.add('open');
  overlay.classList.add('open');

  // Mostrar clave parcialmente enmascarada si existe
  const key = getGroqKey();
  if (key) {
    input.value = key.substring(0, 8) + '••••••••';
    input.type = 'password';
  } else {
    input.value = '';
    input.type = 'text';
  }

  setTimeout(() => input.focus(), 200);
}

function closeDrawer() {
  const drawer = document.getElementById('apikey-drawer');
  const overlay = document.getElementById('apikey-overlay');
  drawer.classList.remove('open');
  overlay.classList.remove('open');
}

function handleSave() {
  const input = document.getElementById('apikey-input');
  const saveBtn = document.getElementById('apikey-save');
  const value = input.value.trim();

  // No guardar el placeholder enmascarado
  if (!value || value.includes('••••')) return;

  setGroqKey(value);

  // Feedback visual
  saveBtn.textContent = t('apikey_saved');
  saveBtn.classList.add('saved');
  setTimeout(() => {
    saveBtn.textContent = t('apikey_save');
    saveBtn.classList.remove('saved');
    closeDrawer();
  }, 1200);

  updateStatus();
}

function handleRemove() {
  localStorage.removeItem('gabinete-groq-key');
  document.getElementById('apikey-input').value = '';
  document.getElementById('apikey-remove').style.display = 'none';
  updateStatus();
}

function updateStatus() {
  const status = document.getElementById('apikey-status');
  const removeBtn = document.getElementById('apikey-remove');
  const toggle = document.getElementById('apikey-toggle');
  const ok = hasGroqKey();

  if (status) {
    status.textContent = ok ? t('apikey_status_ok') : t('apikey_status_missing');
    status.className = 'apikey-status ' + (ok ? 'apikey-status--ok' : 'apikey-status--missing');
  }

  if (removeBtn) {
    removeBtn.style.display = ok ? '' : 'none';
  }

  // Indicador visual en el botón del header
  if (toggle) {
    toggle.classList.toggle('has-key', ok);
  }
}
