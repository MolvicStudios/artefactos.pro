// linea-tiempo.js — Línea de Tiempo Histórica
import { askGroq, hasApiKey } from '../../../js/groq.js';
import { renderApiKeyPanel, renderChangeKeyButton } from '../../../js/apikey-panel.js';

const lang = localStorage.getItem('artefactos_lang') || 'es';
let generando = false;

const txt = {
  es: {
    titulo: 'Línea de Tiempo',
    sub: 'Genera líneas de tiempo interactivas sobre cualquier tema o período.',
    badge: 'research', galeria: '← Galería',
    tema: 'Tema o período histórico',
    tema_ph: 'Ej: la carrera espacial 1957-1975',
    eventos: 'Número de eventos',
    generar: 'Generar línea de tiempo', generando: 'Investigando…',
    copiar: 'Copiar', copiado: '¡Copiado!', nueva: 'Nueva línea',
    error: 'Error al generar. Intenta de nuevo.'
  },
  en: {
    titulo: 'Historical Timeline',
    sub: 'Generate interactive timelines about any topic or period.',
    badge: 'research', galeria: '← Gallery',
    tema: 'Topic or historical period',
    tema_ph: 'E.g.: the space race 1957-1975',
    eventos: 'Number of events',
    generar: 'Generate timeline', generando: 'Researching…',
    copiar: 'Copy', copiado: 'Copied!', nueva: 'New timeline',
    error: 'Error generating. Try again.'
  }
};
const t = txt[lang] || txt.es;

function init() {
  if (!hasApiKey()) { renderApiKeyPanel('app', () => render(), lang); return; }
  render();
}

function render() {
  document.getElementById('app').innerHTML = `
    <header class="art-header">
      <div class="art-header-left">
        <a href="../../../index.html" class="back-link">${t.galeria}</a>
        <span class="cat-badge">${t.badge}</span>
      </div>
    </header>
    <div class="main-wrap">
      <h1>📏 ${t.titulo}</h1>
      <p class="subtitulo">${t.sub}</p>
      <div class="field-group">
        <span class="field-label">${t.tema}</span>
        <input type="text" id="tema" class="field-input" placeholder="${t.tema_ph}" maxlength="200">
      </div>
      <div class="field-group">
        <span class="field-label">${t.eventos}</span>
        <input type="number" id="num-eventos" class="field-input" value="8" min="3" max="20" style="max-width:120px;">
      </div>
      <button id="btn-generar" class="btn-primary">${t.generar}</button>
      <div id="resultado-wrap" class="resultado-wrap">
        <div id="timeline" class="result-box"></div>
        <div class="acciones">
          <button id="btn-copiar" class="btn-sec">${t.copiar}</button>
          <button id="btn-nueva" class="btn-sec">${t.nueva}</button>
        </div>
      </div>
    </div>`;
  renderChangeKeyButton('key-btn-wrap', lang);
  document.getElementById('btn-generar').addEventListener('click', generar);
  document.getElementById('btn-copiar').addEventListener('click', copiar);
  document.getElementById('btn-nueva').addEventListener('click', () => {
    document.getElementById('tema').value = '';
    document.getElementById('resultado-wrap').classList.remove('visible');
  });
}

async function generar() {
  const tema = document.getElementById('tema').value.trim();
  if (!tema || generando) return;
  const num = parseInt(document.getElementById('num-eventos').value) || 8;
  const btn = document.getElementById('btn-generar');
  generando = true; btn.disabled = true; btn.textContent = t.generando;
  const idioma = lang === 'en' ? 'English' : 'Spanish';
  try {
    const raw = await askGroq({
      systemPrompt: `You are a historian. Write in ${idioma}.
Generate a timeline with exactly ${num} events about the given topic.
Return ONLY a JSON array, no other text:
[{"date":"...","title":"...","description":"..."}]
Order events chronologically. Keep descriptions to 1-2 sentences.`,
      userMessage: `Timeline for: "${tema}"`,
      temperature: 0.6,
      maxTokens: 1200
    });
    const eventos = JSON.parse(raw.replace(/```json?\s*/g, '').replace(/```/g, '').trim());
    renderTimeline(eventos);
  } catch {
    document.getElementById('timeline').textContent = t.error;
    document.getElementById('resultado-wrap').classList.add('visible');
  }
  generando = false; btn.disabled = false; btn.textContent = t.generar;
}

function renderTimeline(eventos) {
  const el = document.getElementById('timeline');
  el.innerHTML = eventos.map(ev => `
    <div style="display:flex;gap:1rem;margin-bottom:1.2rem;align-items:flex-start;">
      <div style="min-width:90px;color:var(--acento);font-weight:700;font-size:0.85rem;padding-top:2px;">${ev.date}</div>
      <div style="border-left:2px solid var(--acento);padding-left:1rem;">
        <strong>${ev.title}</strong>
        <p style="color:var(--texto-sec);margin-top:0.2rem;font-size:0.88rem;">${ev.description}</p>
      </div>
    </div>`).join('');
  document.getElementById('resultado-wrap').classList.add('visible');
}

function copiar() {
  navigator.clipboard.writeText(document.getElementById('timeline').textContent);
  const btn = document.getElementById('btn-copiar');
  btn.textContent = t.copiado; btn.classList.add('copiado');
  setTimeout(() => { btn.textContent = t.copiar; btn.classList.remove('copiado'); }, 1500);
}

document.addEventListener('DOMContentLoaded', init);
