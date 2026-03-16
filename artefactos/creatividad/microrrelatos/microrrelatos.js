// microrrelatos.js — Generador de Microrrelatos
// Historias completas en menos de 100 palabras

import { askGroq, hasApiKey } from '../../../js/groq.js';
import { renderApiKeyPanel, renderChangeKeyButton } from '../../../js/apikey-panel.js';

const lang = localStorage.getItem('artefactos_lang') || 'es';
const STORAGE_KEY = 'artefactos_microrrelatos_guardados';

// Estado
let tonoActivo = 'Terror';
let finalActivo = 'Twist';
let historialSesion = []; // últimas 3
let generando = false;

// Textos bilingües
const txt = {
  es: {
    titulo: 'Generador de Microrrelatos',
    sub: 'Una semilla. Una historia. Menos de 100 palabras.',
    placeholder: 'Una palabra, una imagen, una emoción...',
    generar: 'Generar historia',
    generando: 'Escribiendo...',
    copiar: 'Copiar', copiado: '¡Copiado!',
    guardar: 'Guardar', nueva: 'Nueva semilla',
    historial: 'Historial de sesión',
    mis: 'Mis historias guardadas',
    tono: 'Tono', final: 'Final',
    palabras: 'palabras',
    badge: 'creatividad',
    galeria: '← Galería',
    error: 'Error al generar. Intenta de nuevo.',
    tonos: ['Terror', 'Humor', 'Lírico', 'Absurdo', 'Romántico', 'Melancólico'],
    finales: ['Abierto', 'Cerrado', 'Twist']
  },
  en: {
    titulo: 'Flash Fiction Generator',
    sub: 'A seed. A story. Under 100 words.',
    placeholder: 'A word, an image, an emotion...',
    generar: 'Generate story',
    generando: 'Writing...',
    copiar: 'Copy', copiado: 'Copied!',
    guardar: 'Save', nueva: 'New seed',
    historial: 'Session history',
    mis: 'My saved stories',
    tono: 'Tone', final: 'Ending',
    palabras: 'words',
    badge: 'creativity',
    galeria: '← Gallery',
    error: 'Error generating. Try again.',
    tonos: ['Horror', 'Humor', 'Lyrical', 'Absurd', 'Romantic', 'Melancholic'],
    finales: ['Open', 'Closed', 'Twist']
  }
};
const t = txt[lang] || txt.es;

function init() {
  if (!hasApiKey()) {
    renderApiKeyPanel('app', () => renderArtefacto(), lang);
    return;
  }
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

      <div class="semilla-wrap">
        <input type="text" id="semilla" class="semilla-input" placeholder="${t.placeholder}" maxlength="200" />
      </div>

      <div class="selector-grupo">
        <span class="selector-label">${t.tono}</span>
        <div class="pills" id="tonos">
          ${t.tonos.map((tn, i) => `<button class="pill${i === 0 ? ' active' : ''}" data-val="${txt.es.tonos[i]}">${tn}</button>`).join('')}
        </div>
      </div>

      <div class="selector-grupo">
        <span class="selector-label">${t.final}</span>
        <div class="pills" id="finales">
          ${t.finales.map((fn, i) => `<button class="pill${i === 2 ? ' active' : ''}" data-val="${txt.es.finales[i]}">${fn}</button>`).join('')}
        </div>
      </div>

      <button id="btn-generar" class="btn-generar">${t.generar}</button>

      <div id="resultado-wrap" class="resultado-wrap">
        <div class="papel">
          <div id="texto-historia"></div>
          <span id="word-count" class="palabra-count"></span>
        </div>
        <div class="acciones">
          <button id="btn-copiar" class="btn-sec">${t.copiar}</button>
          <button id="btn-guardar" class="btn-sec">${t.guardar}</button>
          <button id="btn-nueva" class="btn-sec">${t.nueva}</button>
        </div>
      </div>

      <div id="historial-sesion" class="historial-sesion" style="display:none">
        <h3>${t.historial}</h3>
        <div id="historial-list"></div>
      </div>

      <details class="mis-historias" id="mis-historias">
        <summary>${t.mis} (<span id="guardadas-count">0</span>)</summary>
        <div id="guardadas-list"></div>
      </details>
    </div>
  `;

  renderChangeKeyButton('key-btn-wrap', lang);
  initEventos();
  renderGuardadas();
}

function initEventos() {
  // Tonos
  document.getElementById('tonos').addEventListener('click', e => {
    const pill = e.target.closest('.pill');
    if (!pill) return;
    document.querySelectorAll('#tonos .pill').forEach(p => p.classList.remove('active'));
    pill.classList.add('active');
    tonoActivo = pill.dataset.val;
  });

  // Finales
  document.getElementById('finales').addEventListener('click', e => {
    const pill = e.target.closest('.pill');
    if (!pill) return;
    document.querySelectorAll('#finales .pill').forEach(p => p.classList.remove('active'));
    pill.classList.add('active');
    finalActivo = pill.dataset.val;
  });

  document.getElementById('btn-generar').addEventListener('click', generar);
  document.getElementById('semilla').addEventListener('keydown', e => {
    if (e.key === 'Enter') generar();
  });
  document.getElementById('btn-copiar').addEventListener('click', copiar);
  document.getElementById('btn-guardar').addEventListener('click', guardarHistoria);
  document.getElementById('btn-nueva').addEventListener('click', nuevaSemilla);
}

async function generar() {
  const semilla = document.getElementById('semilla').value.trim();
  if (!semilla || generando) return;

  const btn = document.getElementById('btn-generar');
  const wrap = document.getElementById('resultado-wrap');
  const textoEl = document.getElementById('texto-historia');
  const countEl = document.getElementById('word-count');

  generando = true;
  btn.disabled = true;
  btn.textContent = t.generando;
  wrap.classList.add('visible');
  textoEl.textContent = '';
  countEl.textContent = '';

  const idioma = lang === 'en' ? 'English' : 'Spanish';
  const systemPrompt = `Eres un maestro del microrrelato. Escribes en ${idioma}.
Escribe una historia completa en exactamente entre 60 y 100 palabras.
Semilla creativa: ${semilla}
Tono: ${tonoActivo}
Final: ${finalActivo} (Abierto = sin resolución clara / Cerrado = conclusión definida / Twist = giro inesperado en la última oración)
Reglas absolutas:
- Entre 60 y 100 palabras. Ni una más, ni una menos.
- Sin título. Solo el texto de la historia.
- La última oración debe ser la más poderosa.
- No uses la semilla literalmente; transfórmala.
- Escribe solo la historia, sin explicaciones ni comentarios.`;

  try {
    const resultado = await llamarGroq({
      systemPrompt,
      userMessage: `Semilla: "${semilla}" | Tono: ${tonoActivo} | Final: ${finalActivo}`,
      temperature: 0.9,
      maxTokens: 300
    });
    if (!resultado) return;

    // Efecto typewriter
    await typewriter(textoEl, countEl, resultado);

    // Añadir al historial de sesión
    historialSesion.unshift({ semilla, texto: resultado, tono: tonoActivo });
    if (historialSesion.length > 3) historialSesion.pop();
    renderHistorialSesion();
  } catch (err) {
    textoEl.textContent = t.error;
  } finally {
    generando = false;
    btn.disabled = false;
    btn.textContent = t.generar;
  }
}

async function typewriter(el, countEl, texto) {
  el.textContent = '';
  for (let i = 0; i < texto.length; i++) {
    el.textContent += texto[i];
    // Contar palabras parciales
    const palabras = el.textContent.trim().split(/\s+/).filter(w => w).length;
    countEl.textContent = `${palabras} ${t.palabras}`;
    await new Promise(r => setTimeout(r, 16));
  }
}

function copiar() {
  const texto = document.getElementById('texto-historia').textContent;
  if (!texto) return;
  navigator.clipboard.writeText(texto);
  const btn = document.getElementById('btn-copiar');
  btn.textContent = t.copiado;
  btn.classList.add('copiado');
  setTimeout(() => { btn.textContent = t.copiar; btn.classList.remove('copiado'); }, 1500);
}

function guardarHistoria() {
  const texto = document.getElementById('texto-historia').textContent;
  const semilla = document.getElementById('semilla').value.trim();
  if (!texto) return;

  const guardadas = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  guardadas.unshift({ semilla, texto, fecha: new Date().toLocaleDateString(), tono: tonoActivo });
  if (guardadas.length > 10) guardadas.pop();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(guardadas));
  renderGuardadas();
}

function renderGuardadas() {
  const guardadas = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  const countEl = document.getElementById('guardadas-count');
  const listEl = document.getElementById('guardadas-list');
  if (!countEl || !listEl) return;
  countEl.textContent = guardadas.length;
  listEl.innerHTML = guardadas.map(g => `
    <div class="guardada-item">
      <div class="guardada-semilla">${g.semilla}</div>
      <div class="guardada-fecha">${g.fecha} · ${g.tono}</div>
      <div class="guardada-texto">${g.texto.substring(0, 100)}...</div>
    </div>
  `).join('');
}

function renderHistorialSesion() {
  const wrap = document.getElementById('historial-sesion');
  const list = document.getElementById('historial-list');
  if (historialSesion.length === 0) { wrap.style.display = 'none'; return; }
  wrap.style.display = 'block';
  list.innerHTML = historialSesion.map((h, i) => `
    <div class="historial-item" data-idx="${i}">"${h.semilla}" · ${h.tono}</div>
  `).join('');
  list.querySelectorAll('.historial-item').forEach(item => {
    item.addEventListener('click', () => {
      const idx = parseInt(item.dataset.idx);
      const h = historialSesion[idx];
      document.getElementById('texto-historia').textContent = h.texto;
      const palabras = h.texto.trim().split(/\s+/).filter(w => w).length;
      document.getElementById('word-count').textContent = `${palabras} ${t.palabras}`;
      document.getElementById('resultado-wrap').classList.add('visible');
    });
  });
}

function nuevaSemilla() {
  document.getElementById('semilla').value = '';
  document.getElementById('resultado-wrap').classList.remove('visible');
  document.getElementById('semilla').focus();
}

async function llamarGroq(params) {
  try {
    return await askGroq(params);
  } catch (err) {
    if (err.message === 'NO_KEY' || err.message === 'INVALID_KEY') {
      renderApiKeyPanel('app', () => renderArtefacto(), lang);
      return null;
    }
    throw err;
  }
}

document.addEventListener('DOMContentLoaded', init);
