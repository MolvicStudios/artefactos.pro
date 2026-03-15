// continuador.js — Continuador de Historias
// Extiende o tuerce narraciones con IA, hasta 5 continuaciones acumuladas

import { askGroq, hasApiKey } from '../../../js/groq.js';
import { renderApiKeyPanel, renderChangeKeyButton } from '../../../js/apikey-panel.js';

const lang = localStorage.getItem('artefactos_lang') || 'es';
const MAX_CONT = 5;

let modoActivo = 'extension'; // extension | giro
let generando = false;
let continuaciones = []; // historial de continuaciones

const txt = {
  es: {
    titulo: 'Continuador de Historias',
    sub: 'Pega tu texto y la IA lo continúa. Hasta 5 extensiones acumuladas.',
    placeholder: 'Pega aquí el inicio de tu historia o texto narrativo…',
    modo: 'Modo de continuación',
    modos: [['extension', 'Extensión natural'], ['giro', 'Giro inesperado']],
    generar: 'Continuar historia', generando: 'Continuando...',
    seguir: 'Continuar más', exportar: '↓ Exportar .txt', limpiar: 'Nueva historia',
    contLabel: 'Continuación IA',
    contPrev: 'continuación anterior',
    badge: 'creatividad', galeria: '← Galería',
    error: 'Error al continuar. Intenta de nuevo.',
    maxAlcanzado: 'Máximo de continuaciones alcanzado (5).'
  },
  en: {
    titulo: 'Story Continuator',
    sub: 'Paste your text and AI continues it. Up to 5 accumulated extensions.',
    placeholder: 'Paste the beginning of your story or narrative text here…',
    modo: 'Continuation mode',
    modos: [['extension', 'Natural extension'], ['giro', 'Unexpected twist']],
    generar: 'Continue story', generando: 'Continuing...',
    seguir: 'Continue more', exportar: '↓ Export .txt', limpiar: 'New story',
    contLabel: 'AI Continuation',
    contPrev: 'previous continuation',
    badge: 'creativity', galeria: '← Gallery',
    error: 'Error continuing. Try again.',
    maxAlcanzado: 'Maximum continuations reached (5).'
  }
};
const t = txt[lang] || txt.es;

function init() {
  if (!hasApiKey()) { renderApiKeyPanel('app', () => renderArtefacto(), lang); return; }
  renderArtefacto();
}

function renderArtefacto() {
  const app = document.getElementById('app');
  continuaciones = [];
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
      <div class="zona-usuario">
        <textarea id="texto-user" class="textarea-user" placeholder="${t.placeholder}" maxlength="3000"></textarea>
        <div class="char-count"><span id="char-num">0</span> / 3000</div>
      </div>
      <div class="selector-grupo">
        <span class="selector-label">${t.modo}</span>
        <div class="pills" id="modo-pills">
          ${t.modos.map(([val, label]) => `<button class="pill${val === modoActivo ? ' active' : ''}" data-val="${val}">${label}</button>`).join('')}
        </div>
      </div>
      <button id="btn-generar" class="btn-principal">${t.generar}</button>
      <div id="zona-resultado"></div>
      <div id="acciones-post" class="acciones-post" style="display:none">
        <button id="btn-seguir" class="btn-sec">${t.seguir}</button>
        <button id="btn-exportar" class="btn-sec">${t.exportar}</button>
        <button id="btn-limpiar" class="btn-sec">${t.limpiar}</button>
      </div>
    </div>
  `;
  renderChangeKeyButton('key-btn-wrap', lang);

  // Recoger texto enviado desde Saga u otro artefacto
  const textarea = document.getElementById('texto-user');
  const textoExterno = localStorage.getItem('artefactos_continuador_texto');
  if (textoExterno) {
    textarea.value = textoExterno;
    document.getElementById('char-num').textContent = textoExterno.length;
    localStorage.removeItem('artefactos_continuador_texto');
  }

  // Eventos
  textarea.addEventListener('input', () => {
    document.getElementById('char-num').textContent = textarea.value.length;
  });

  document.getElementById('modo-pills').addEventListener('click', e => {
    const p = e.target.closest('.pill'); if (!p) return;
    document.querySelectorAll('#modo-pills .pill').forEach(x => x.classList.remove('active'));
    p.classList.add('active'); modoActivo = p.dataset.val;
  });

  document.getElementById('btn-generar').addEventListener('click', continuar);
  document.getElementById('btn-seguir').addEventListener('click', continuar);
  document.getElementById('btn-exportar').addEventListener('click', exportarTxt);
  document.getElementById('btn-limpiar').addEventListener('click', () => renderArtefacto());
}

async function continuar() {
  if (generando) return;
  if (continuaciones.length >= MAX_CONT) {
    document.getElementById('zona-resultado').innerHTML += `<p class="loading">${t.maxAlcanzado}</p>`;
    return;
  }

  const textoOriginal = document.getElementById('texto-user').value.trim();
  if (!textoOriginal) return;

  // Texto completo = original + continuaciones previas
  const textoCompleto = textoOriginal + continuaciones.map(c => '\n\n' + c).join('');

  const btn = document.getElementById('btn-generar');
  generando = true; btn.disabled = true; btn.textContent = t.generando;

  const modoDesc = modoActivo === 'giro'
    ? 'un GIRO INESPERADO que sorprenda al lector, cambia la dirección de la trama de forma creativa'
    : 'una EXTENSIÓN NATURAL que fluya con el tono, ritmo y estilo del texto original';

  const idioma = lang === 'en' ? 'English' : 'Spanish';
  const systemPrompt = `Eres un escritor narrativo experto. Continúa el texto proporcionado con ${modoDesc}.
Reglas:
- Escribe en ${idioma}.
- Genera aproximadamente 150-250 palabras de continuación.
- Mantén el estilo, tono y voz del texto original.
- No repitas frases del original.
- No añadas títulos, encabezados ni metadatos.
- Solo escribe el texto de la continuación, nada más.
${modoActivo === 'giro' ? '- El giro debe ser sorprendente pero coherente con el mundo de la historia.' : ''}
${continuaciones.length > 0 ? `- Esta es la continuación #${continuaciones.length + 1}, mantén coherencia con las anteriores.` : ''}`;

  try {
    const raw = await llamarGroq({ systemPrompt, userMessage: textoCompleto, temperature: 0.85, maxTokens: 500 });
    if (!raw) return;
    const limpio = raw.trim();
    continuaciones.push(limpio);
    renderContinuaciones();
    document.getElementById('acciones-post').style.display = 'flex';
    // Deshabilitar si alcanzamos el máximo
    if (continuaciones.length >= MAX_CONT) {
      document.getElementById('btn-seguir').disabled = true;
      document.getElementById('btn-seguir').style.opacity = '0.4';
    }
  } catch { document.getElementById('zona-resultado').innerHTML = `<p class="loading">${t.error}</p>`; }
  finally { generando = false; btn.disabled = false; btn.textContent = t.generar; }
}

function renderContinuaciones() {
  const zona = document.getElementById('zona-resultado');
  zona.innerHTML = continuaciones.map((c, i) => `
    <div class="zona-continuacion fade-in" style="animation-delay:${i * 0.1}s;${i < continuaciones.length - 1 ? 'opacity:0.5;margin-bottom:0.5rem;' : ''}">
      <span class="cont-label">${t.contLabel} #${i + 1}</span>
      <p>${c}</p>
    </div>
  `).join('');
}

function exportarTxt() {
  const textoOriginal = document.getElementById('texto-user').value.trim();
  const completo = textoOriginal + continuaciones.map(c => '\n\n' + c).join('');
  const blob = new Blob([completo], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'historia-continuada.txt';
  document.body.appendChild(a); a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

async function llamarGroq(params) {
  try { return await askGroq(params); }
  catch (err) {
    if (err.message === 'NO_KEY' || err.message === 'INVALID_KEY') {
      renderApiKeyPanel('app', () => renderArtefacto(), lang); return null;
    }
    throw err;
  }
}

document.addEventListener('DOMContentLoaded', init);
