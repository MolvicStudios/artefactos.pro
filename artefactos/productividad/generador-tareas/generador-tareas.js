// generador-tareas.js — Generador de Tareas con IA
import { askGroq, hasApiKey } from '../../../js/groq.js';
import { renderApiKeyPanel, renderChangeKeyButton } from '../../../js/apikey-panel.js';

const lang = localStorage.getItem('artefactos_lang') || 'es';
let granularidad = 'simple';
let generando = false;
let tareasData = [];

const txt = {
  es: {
    titulo: 'Generador de Tareas',
    sub: 'De objetivo vago a lista de acción concreta con IA.',
    objetivo: 'Objetivo', objetivo_ph: 'Ej: Lanzar mi tienda online, Aprender guitarra, Organizar mudanza…',
    granularidad: 'Granularidad',
    niveles: [
      { id: 'simple', label: 'Simple', desc: '5 tareas' },
      { id: 'detallado', label: 'Detallado', desc: '10 tareas + subtareas' },
      { id: 'epico', label: 'Épico', desc: '15 tareas + dependencias' }
    ],
    generar: 'Generar tareas', generando: 'Generando…',
    copiar: 'Copiar como texto', copiado: '¡Copiado!', nueva: 'Nuevo objetivo',
    badge: 'productividad', galeria: '← Galería',
    error: 'Error al generar. Intenta de nuevo.',
    depPrefix: 'después de'
  },
  en: {
    titulo: 'Task Generator',
    sub: 'From vague objective to concrete action list with AI.',
    objetivo: 'Objective', objetivo_ph: 'E.g.: Launch my online store, Learn guitar, Organize a move…',
    granularidad: 'Granularity',
    niveles: [
      { id: 'simple', label: 'Simple', desc: '5 tasks' },
      { id: 'detallado', label: 'Detailed', desc: '10 tasks + subtasks' },
      { id: 'epico', label: 'Epic', desc: '15 tasks + dependencies' }
    ],
    generar: 'Generate tasks', generando: 'Generating…',
    copiar: 'Copy as text', copiado: 'Copied!', nueva: 'New objective',
    badge: 'productivity', galeria: '← Gallery',
    error: 'Error generating. Try again.',
    depPrefix: 'after'
  }
};
const t = txt[lang] || txt.es;

const systemPrompts = {
  simple: lang === 'en'
    ? `You are a productivity expert. Given a vague objective, return EXACTLY 5 concrete, actionable tasks as a JSON array. Each element: {"task":"string"}. No extra text, only valid JSON.`
    : `Eres un experto en productividad. Dado un objetivo vago, devuelve EXACTAMENTE 5 tareas concretas y accionables como un array JSON. Cada elemento: {"task":"string"}. Sin texto extra, solo JSON válido.`,
  detallado: lang === 'en'
    ? `You are a productivity expert. Given a vague objective, return EXACTLY 10 concrete tasks with subtasks as a JSON array. Each element: {"task":"string","subtasks":["string"]}. Each task should have 2-3 subtasks. No extra text, only valid JSON.`
    : `Eres un experto en productividad. Dado un objetivo vago, devuelve EXACTAMENTE 10 tareas concretas con subtareas como un array JSON. Cada elemento: {"task":"string","subtasks":["string"]}. Cada tarea debe tener 2-3 subtareas. Sin texto extra, solo JSON válido.`,
  epico: lang === 'en'
    ? `You are a productivity expert. Given a vague objective, return EXACTLY 15 concrete tasks with dependencies as a JSON array. Each element: {"task":"string","subtasks":["string"],"dependsOn":number|null} where dependsOn is the 0-based index of the task that must be completed first, or null if independent. Include 2-3 subtasks per task. No extra text, only valid JSON.`
    : `Eres un experto en productividad. Dado un objetivo vago, devuelve EXACTAMENTE 15 tareas concretas con dependencias como un array JSON. Cada elemento: {"task":"string","subtasks":["string"],"dependsOn":number|null} donde dependsOn es el índice base-0 de la tarea que debe completarse primero, o null si es independiente. Incluye 2-3 subtareas por tarea. Sin texto extra, solo JSON válido.`
};

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
      <h1>${t.titulo}</h1>
      <p class="subtitulo">${t.sub}</p>
      <div class="field-group">
        <span class="field-label">${t.objetivo}</span>
        <input type="text" id="objetivo" class="field-input" placeholder="${t.objetivo_ph}" maxlength="300">
      </div>
      <div class="field-group">
        <span class="field-label">${t.granularidad}</span>
        <div class="pills" id="niveles">
          ${t.niveles.map((n, i) => `<button class="pill${i === 0 ? ' active' : ''}" data-val="${n.id}" title="${n.desc}">${n.label}</button>`).join('')}
        </div>
      </div>
      <button id="btn-generar" class="btn-primary">${t.generar}</button>
      <div id="resultado-wrap" class="resultado-wrap">
        <ul class="task-list" id="task-list"></ul>
        <div class="acciones">
          <button id="btn-copiar" class="btn-sec">${t.copiar}</button>
          <button id="btn-nueva" class="btn-sec">${t.nueva}</button>
        </div>
      </div>
    </div>`;
  renderChangeKeyButton('key-btn-wrap', lang);
  initEventos();
}

function initEventos() {
  document.getElementById('niveles').addEventListener('click', e => {
    const pill = e.target.closest('.pill'); if (!pill) return;
    document.querySelectorAll('#niveles .pill').forEach(p => p.classList.remove('active'));
    pill.classList.add('active'); granularidad = pill.dataset.val;
  });
  document.getElementById('btn-generar').addEventListener('click', generar);
  document.getElementById('btn-copiar').addEventListener('click', copiar);
  document.getElementById('btn-nueva').addEventListener('click', () => {
    document.getElementById('objetivo').value = '';
    document.getElementById('resultado-wrap').classList.remove('visible');
    tareasData = [];
  });
  document.getElementById('objetivo').addEventListener('keydown', e => {
    if (e.key === 'Enter') generar();
  });
}

function parseJSON(raw) {
  let cleaned = raw.trim();
  const start = cleaned.indexOf('[');
  const end = cleaned.lastIndexOf(']');
  if (start !== -1 && end !== -1) cleaned = cleaned.slice(start, end + 1);
  return JSON.parse(cleaned);
}

async function generar() {
  const objetivo = document.getElementById('objetivo').value.trim();
  if (!objetivo || generando) return;
  const btn = document.getElementById('btn-generar');
  generando = true; btn.disabled = true; btn.textContent = t.generando;
  try {
    const resultado = await askGroq({
      systemPrompt: systemPrompts[granularidad],
      userMessage: objetivo,
      temperature: 0.7,
      maxTokens: 1500
    });
    tareasData = parseJSON(resultado);
    renderTareas();
    document.getElementById('resultado-wrap').classList.add('visible');
  } catch {
    document.getElementById('task-list').innerHTML = `<li class="task-item"><span class="task-text">${t.error}</span></li>`;
    document.getElementById('resultado-wrap').classList.add('visible');
  }
  generando = false; btn.disabled = false; btn.textContent = t.generar;
}

function renderTareas() {
  const list = document.getElementById('task-list');
  list.innerHTML = tareasData.map((item, i) => {
    const depHTML = (granularidad === 'epico' && item.dependsOn != null && tareasData[item.dependsOn])
      ? `<span class="dep-tag">${t.depPrefix} #${item.dependsOn + 1}</span>` : '';
    const subtasksHTML = (item.subtasks && item.subtasks.length)
      ? `<ul class="subtask-list">${item.subtasks.map((st, si) => `
          <li class="subtask-item" data-task="${i}" data-sub="${si}">
            <input type="checkbox" class="subtask-check">
            <span class="subtask-text">${escapeHTML(st)}</span>
          </li>`).join('')}</ul>` : '';
    return `<li class="task-item" data-idx="${i}">
      <input type="checkbox" class="task-check" data-idx="${i}">
      <div class="task-content">
        <span class="task-text">${escapeHTML(item.task)}${depHTML}</span>
        ${subtasksHTML}
      </div>
    </li>`;
  }).join('');

  list.addEventListener('change', e => {
    if (e.target.classList.contains('task-check')) {
      e.target.closest('.task-item').classList.toggle('done', e.target.checked);
    }
    if (e.target.classList.contains('subtask-check')) {
      e.target.closest('.subtask-item').classList.toggle('done', e.target.checked);
    }
  });
}

function escapeHTML(str) {
  const d = document.createElement('div');
  d.textContent = str;
  return d.innerHTML;
}

function copiar() {
  const lines = tareasData.map((item, i) => {
    let line = `${i + 1}. ${item.task}`;
    if (item.subtasks && item.subtasks.length) {
      line += '\n' + item.subtasks.map(st => `   - ${st}`).join('\n');
    }
    if (item.dependsOn != null) {
      line += `\n   [${t.depPrefix} #${item.dependsOn + 1}]`;
    }
    return line;
  });
  navigator.clipboard.writeText(lines.join('\n'));
  const btn = document.getElementById('btn-copiar');
  btn.textContent = t.copiado; btn.classList.add('copiado');
  setTimeout(() => { btn.textContent = t.copiar; btn.classList.remove('copiado'); }, 1500);
}

document.addEventListener('DOMContentLoaded', init);
