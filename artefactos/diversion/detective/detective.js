// detective.js — El Detective: juego narrativo noir
import { askGroq, hasApiKey } from '../../../js/groq.js';
import { renderApiKeyPanel, renderChangeKeyButton } from '../../../js/apikey-panel.js';

const lang = localStorage.getItem('artefactos_lang') || 'es';
let generando = false;
let turno = 0;
let historial = [];

const txt = {
  es: {
    titulo: 'El Detective',
    sub: 'Resuelve crímenes generados por IA. Interroga, investiga y acusa.',
    badge: 'diversión', galeria: '← Galería',
    nuevo: 'Nuevo caso', turnoLabel: 'Turno',
    cargando: 'Investigando…',
    inicio: 'Generar caso',
    error: 'Error al generar. Intenta de nuevo.',
    copiar: 'Copiar caso', copiado: '¡Copiado!'
  },
  en: {
    titulo: 'The Detective',
    sub: 'Solve AI-generated crimes. Interrogate, investigate and accuse.',
    badge: 'fun', galeria: '← Gallery',
    nuevo: 'New case', turnoLabel: 'Turn',
    cargando: 'Investigating…',
    inicio: 'Generate case',
    error: 'Error generating. Try again.',
    copiar: 'Copy case', copiado: 'Copied!'
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
      <h1>🔍 ${t.titulo}</h1>
      <p class="subtitulo">${t.sub}</p>
      <button id="btn-inicio" class="btn-primary">${t.inicio}</button>
      <div id="scene-area"></div>
    </div>`;
  renderChangeKeyButton('key-btn-wrap', lang);
  document.getElementById('btn-inicio').addEventListener('click', nuevoCaso);
}

async function nuevoCaso() {
  turno = 0;
  historial = [];
  const area = document.getElementById('scene-area');
  area.innerHTML = `<p class="loading">${t.cargando}</p>`;
  document.getElementById('btn-inicio').style.display = 'none';

  const idioma = lang === 'en' ? 'English' : 'Spanish';
  try {
    const caso = await askGroq({
      systemPrompt: `You are a noir crime fiction narrator. Write in ${idioma}.
Create a short crime case intro (max 200 words) with:
- A crime scene description
- 3 suspects with names and brief motives
- 3 possible actions the detective can take next

Format:
SCENE: [description]
SUSPECTS:
1. [Name] — [motive]
2. [Name] — [motive]
3. [Name] — [motive]
ACTIONS:
1. [action]
2. [action]
3. [action]`,
      userMessage: 'Generate a new crime case.',
      temperature: 0.9,
      maxTokens: 600
    });
    turno = 1;
    historial.push(caso);
    renderScene(caso);
  } catch {
    area.innerHTML = `<p class="loading">${t.error}</p>`;
    document.getElementById('btn-inicio').style.display = '';
  }
}

function renderScene(texto) {
  const area = document.getElementById('scene-area');
  const acciones = extraerAcciones(texto);
  const narrativa = texto.replace(/ACTIONS:[\s\S]*$/, '').trim();

  area.innerHTML = `
    <div class="turn-indicator">${t.turnoLabel} ${turno}</div>
    <div class="scene-box">${narrativa}</div>
    ${acciones.length ? acciones.map(a => `<button class="choice-btn" data-action="${a}">${a}</button>`).join('') : ''}
    <div class="acciones" style="margin-top:1rem;">
      <button id="btn-copiar" class="btn-sec">${t.copiar}</button>
      <button id="btn-nuevo" class="btn-sec">${t.nuevo}</button>
    </div>`;

  area.querySelectorAll('.choice-btn').forEach(btn => {
    btn.addEventListener('click', () => elegirAccion(btn.dataset.action));
  });
  document.getElementById('btn-copiar').addEventListener('click', copiar);
  document.getElementById('btn-nuevo').addEventListener('click', () => {
    document.getElementById('btn-inicio').style.display = '';
    area.innerHTML = '';
    nuevoCaso();
  });
}

function extraerAcciones(texto) {
  const match = texto.match(/ACTIONS:\s*([\s\S]*)/i);
  if (!match) return [];
  return match[1].split('\n').map(l => l.replace(/^\d+[\.\)]\s*/, '').trim()).filter(Boolean).slice(0, 3);
}

async function elegirAccion(accion) {
  if (generando) return;
  generando = true;
  const area = document.getElementById('scene-area');
  area.innerHTML = `<p class="loading">${t.cargando}</p>`;
  turno++;

  const idioma = lang === 'en' ? 'English' : 'Spanish';
  const esFinale = turno >= 5;

  try {
    const resultado = await askGroq({
      systemPrompt: `You are a noir crime fiction narrator. Write in ${idioma}.
Continue the detective story based on previous events.
Previous events: ${historial.join('\n---\n')}
The detective chose: ${accion}
${esFinale ? 'This is the FINAL turn. Reveal the culprit and resolve the case. Do NOT include ACTIONS.' : 'Narrate what happens (max 150 words) and provide 3 new ACTIONS.'}
Format: SCENE: [narration]${esFinale ? '\nVERDICT: [who did it and why]' : '\nACTIONS:\n1. [action]\n2. [action]\n3. [action]'}`,
      userMessage: `Detective action: ${accion}`,
      temperature: 0.85,
      maxTokens: 500
    });
    historial.push(`Action: ${accion}\n${resultado}`);

    if (esFinale) {
      renderVerdict(resultado);
    } else {
      renderScene(resultado);
    }
  } catch {
    area.innerHTML = `<p class="loading">${t.error}</p>`;
  }
  generando = false;
}

function renderVerdict(texto) {
  const area = document.getElementById('scene-area');
  area.innerHTML = `
    <div class="turn-indicator">${t.turnoLabel} ${turno} — FINAL</div>
    <div class="scene-box">${texto}</div>
    <div class="acciones" style="margin-top:1rem;">
      <button id="btn-copiar" class="btn-sec">${t.copiar}</button>
      <button id="btn-nuevo" class="btn-sec">${t.nuevo}</button>
    </div>`;
  document.getElementById('btn-copiar').addEventListener('click', copiar);
  document.getElementById('btn-nuevo').addEventListener('click', () => {
    document.getElementById('btn-inicio').style.display = '';
    area.innerHTML = '';
    nuevoCaso();
  });
}

function copiar() {
  navigator.clipboard.writeText(historial.join('\n---\n'));
  const btn = document.getElementById('btn-copiar');
  btn.textContent = t.copiado; btn.classList.add('copiado');
  setTimeout(() => { btn.textContent = t.copiar; btn.classList.remove('copiado'); }, 1500);
}

document.addEventListener('DOMContentLoaded', init);
