// mentor-idiomas.js — Mentor de Idiomas
// Chat con correcciones, vocabulario acumulado, historial completo

import { askGroq, hasApiKey } from '../../../js/groq.js';
import { renderApiKeyPanel, renderChangeKeyButton } from '../../../js/apikey-panel.js';

const lang = localStorage.getItem('artefactos_lang') || 'es';

let idiomaObj = 'en';
let nivelCEFR = 'A2';
let mensajes = []; // historial para Groq
let chatMsgs = []; // para renderizar {tipo, texto, correcciones?}
let vocabulario = []; // palabras nuevas aprendidas
let generando = false;

const txt = {
  es: {
    titulo: 'Mentor de Idiomas',
    sub: 'Practica conversación en otro idioma con correcciones en tiempo real.',
    idioma: 'Idioma objetivo',
    idiomas: { en: 'Inglés', fr: 'Francés', de: 'Alemán', it: 'Italiano', pt: 'Portugués', ja: 'Japonés', zh: 'Chino', ko: 'Coreano', ru: 'Ruso' },
    nivel: 'Nivel CEFR',
    niveles: ['A1', 'A2', 'B1', 'B2', 'C1'],
    comenzar: 'Iniciar conversación', comenzando: 'Preparando…',
    inputPlaceholder: 'Escribe en el idioma objetivo…',
    enviar: 'Enviar',
    correcciones: '📝 Ver correcciones',
    vocabTitulo: '📚 Vocabulario aprendido',
    nuevoChat: 'Nueva conversación',
    badge: 'educación', galeria: '← Galería',
    error: 'Error de comunicación. Intenta de nuevo.'
  },
  en: {
    titulo: 'Language Mentor',
    sub: 'Practice conversation in another language with real-time corrections.',
    idioma: 'Target language',
    idiomas: { en: 'English', fr: 'French', de: 'German', it: 'Italian', pt: 'Portuguese', ja: 'Japanese', zh: 'Chinese', ko: 'Korean', ru: 'Russian' },
    nivel: 'CEFR Level',
    niveles: ['A1', 'A2', 'B1', 'B2', 'C1'],
    comenzar: 'Start conversation', comenzando: 'Preparing…',
    inputPlaceholder: 'Write in the target language…',
    enviar: 'Send',
    correcciones: '📝 See corrections',
    vocabTitulo: '📚 Learned vocabulary',
    nuevoChat: 'New conversation',
    badge: 'education', galeria: '← Gallery',
    error: 'Communication error. Try again.'
  }
};
const t = txt[lang] || txt.es;

function init() {
  if (!hasApiKey()) { renderApiKeyPanel('app', () => renderArtefacto(), lang); return; }
  renderArtefacto();
}

function renderArtefacto() {
  const app = document.getElementById('app');
  app.innerHTML = `
    <header class="art-header">
      <div class="art-header-left">
        <a href="../../../index.html" class="back-link">${t.galeria}</a>
        <span class="cat-badge">${t.badge}</span>
      </div>
      <div id="key-btn-wrap"></div>
    </header>
    <div class="main-wrap">
      <h1>${t.titulo}</h1>
      <p class="subtitulo">${t.sub}</p>
      <div class="selector-row">
        <div class="selector-grupo">
          <span class="selector-label">${t.idioma}</span>
          <div class="pills" id="idioma-pills">
            ${Object.entries(t.idiomas).map(([k, v]) => `<button class="pill${k === idiomaObj ? ' active' : ''}" data-val="${k}">${v}</button>`).join('')}
          </div>
        </div>
      </div>
      <div class="selector-row">
        <div class="selector-grupo">
          <span class="selector-label">${t.nivel}</span>
          <div class="pills" id="nivel-pills">
            ${t.niveles.map(n => `<button class="pill${n === nivelCEFR ? ' active' : ''}" data-val="${n}">${n}</button>`).join('')}
          </div>
        </div>
      </div>
      <button id="btn-comenzar" class="btn-principal">${t.comenzar}</button>
      <div id="chat-zona" class="chat-contenedor"></div>
    </div>
  `;
  renderChangeKeyButton('key-btn-wrap', lang);
  bindInicio();
}

function bindInicio() {
  bindPills('idioma-pills', v => idiomaObj = v);
  bindPills('nivel-pills', v => nivelCEFR = v);

  document.getElementById('btn-comenzar').addEventListener('click', async () => {
    if (generando) return;
    mensajes = [];
    chatMsgs = [];
    vocabulario = [];

    // Ocultar controles
    document.querySelectorAll('.selector-row').forEach(el => el.style.display = 'none');
    document.getElementById('btn-comenzar').style.display = 'none';

    const idiomaName = t.idiomas[idiomaObj] || idiomaObj;
    const sys = buildSystemPrompt(idiomaName);
    mensajes.push({ role: 'system', content: sys });

    generando = true;
    const zona = document.getElementById('chat-zona');
    zona.innerHTML = '<p class="loading">…</p>';

    try {
      const resp = await askGroq({ systemPrompt: sys, userMessage: 'Comienza la conversación.', temperature: 0.85, maxTokens: 300 });
      if (resp === 'NO_KEY' || resp === 'INVALID_KEY') { zona.innerHTML = `<p class="loading">${t.error}</p>`; generando = false; return; }
      const data = parsearJSON(resp);
      if (data && data.mensaje) {
        mensajes.push({ role: 'assistant', content: resp });
        chatMsgs.push({ tipo: 'mentor', texto: data.mensaje, correcciones: '' });
        if (data.vocabulario) data.vocabulario.forEach(v => addVocab(v));
      } else {
        mensajes.push({ role: 'assistant', content: resp });
        chatMsgs.push({ tipo: 'mentor', texto: resp });
      }
      generando = false;
      renderChat();
    } catch {
      zona.innerHTML = `<p class="loading">${t.error}</p>`; generando = false;
    }
  });
}

function buildSystemPrompt(idiomaName) {
  return `Eres un mentor de idiomas amigable para practicar ${idiomaName} a nivel ${nivelCEFR}.

REGLAS:
- Habla principalmente en ${idiomaName}, adaptado al nivel ${nivelCEFR}.
- Cuando el estudiante escriba, corrige sus errores gramaticales o de vocabulario.
- Mantén la conversación natural y motivadora.
- Introduce vocabulario nuevo gradualmente.

Responde SIEMPRE con JSON válido:
{
  "mensaje": "tu respuesta en ${idiomaName}",
  "correcciones": "errores encontrados y correcciones (o vacío si no hay)",
  "vocabulario": ["palabra nueva 1", "palabra nueva 2"]
}

Si no hay correcciones, deja "correcciones" como cadena vacía.
"vocabulario" son palabras nuevas que introduces (máximo 3 por turno).`;
}

function renderChat() {
  const zona = document.getElementById('chat-zona');
  let html = chatMsgs.map((msg, i) => {
    if (msg.tipo === 'mentor') {
      const corrId = `corr-${i}`;
      const tieneCorr = msg.correcciones && msg.correcciones.trim();
      return `
        <div class="mensaje msg-mentor">
          <div class="msg-mentor-texto">${escaparHTML(msg.texto)}</div>
          ${tieneCorr ? `
            <div class="correcciones">
              <button class="correcciones-toggle" data-target="${corrId}">${t.correcciones}</button>
              <div class="correcciones-contenido" id="${corrId}">${escaparHTML(msg.correcciones)}</div>
            </div>` : ''}
        </div>`;
    }
    return `<div class="mensaje msg-user"><div class="msg-user-texto">${escaparHTML(msg.texto)}</div></div>`;
  }).join('');

  // Vocabulario acumulado
  if (vocabulario.length) {
    html += `<div class="vocab-zona">
      <div class="vocab-titulo">${t.vocabTitulo} (${vocabulario.length})</div>
      <div class="vocab-chips">${vocabulario.map(v => `<span class="vocab-chip">${escaparHTML(v)}</span>`).join('')}</div>
    </div>`;
  }

  // Input
  html += `
    <div class="chat-input-zona">
      <input type="text" id="chat-input" class="chat-input" placeholder="${t.inputPlaceholder}" maxlength="500" />
      <button id="btn-enviar" class="btn-enviar">${t.enviar}</button>
    </div>
  `;

  zona.innerHTML = html;
  bindChatControles();
  document.getElementById('chat-input').focus();
}

function bindChatControles() {
  // Toggle correcciones
  document.querySelectorAll('.correcciones-toggle').forEach(btn => {
    btn.addEventListener('click', () => {
      const el = document.getElementById(btn.dataset.target);
      if (el) el.classList.toggle('visible');
    });
  });

  const input = document.getElementById('chat-input');
  const btnEnviar = document.getElementById('btn-enviar');
  input.addEventListener('keydown', e => { if (e.key === 'Enter') btnEnviar.click(); });
  btnEnviar.addEventListener('click', () => enviarMensaje());
}

async function enviarMensaje() {
  const input = document.getElementById('chat-input');
  const texto = input.value.trim();
  if (!texto || generando) return;

  chatMsgs.push({ tipo: 'user', texto });
  mensajes.push({ role: 'user', content: texto });
  generando = true;
  renderChat();

  // Agregar loading temporal
  const zona = document.getElementById('chat-zona');
  const loadingEl = document.createElement('p');
  loadingEl.className = 'loading';
  loadingEl.textContent = '…';
  zona.insertBefore(loadingEl, zona.querySelector('.chat-input-zona'));

  const sysContent = mensajes.find(m => m.role === 'system')?.content || '';
  const historialTexto = mensajes.filter(m => m.role !== 'system').map(m => `${m.role === 'user' ? 'Student' : 'Mentor'}: ${m.content}`).join('\n');

  try {
    const resp = await askGroq({ systemPrompt: sysContent, userMessage: `Historial:\n${historialTexto}\n\nResponde al último mensaje del estudiante.`, temperature: 0.85, maxTokens: 400 });
    if (resp === 'NO_KEY' || resp === 'INVALID_KEY') { generando = false; renderChat(); return; }

    mensajes.push({ role: 'assistant', content: resp });
    const data = parsearJSON(resp);
    if (data && data.mensaje) {
      chatMsgs.push({ tipo: 'mentor', texto: data.mensaje, correcciones: data.correcciones || '' });
      if (data.vocabulario) data.vocabulario.forEach(v => addVocab(v));
    } else {
      chatMsgs.push({ tipo: 'mentor', texto: resp });
    }
  } catch {
    chatMsgs.push({ tipo: 'mentor', texto: t.error });
  }
  generando = false;
  renderChat();
}

function addVocab(palabra) {
  const lower = palabra.toLowerCase().trim();
  if (lower && !vocabulario.some(v => v.toLowerCase() === lower)) {
    vocabulario.push(palabra.trim());
  }
}

function bindPills(id, setter) {
  document.querySelectorAll(`#${id} .pill`).forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll(`#${id} .pill`).forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      setter(btn.dataset.val);
    });
  });
}

function parsearJSON(raw) {
  let limpio = raw.trim();
  limpio = limpio.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/g, '');
  try { return JSON.parse(limpio); } catch { return null; }
}
function escaparHTML(str) { const d = document.createElement('div'); d.textContent = str; return d.innerHTML; }

init();
