// casos-practicos.js — Casos Prácticos
// Caso tipo Harvard, 7 secciones, actor cards, resolución opcional

import { askGroq, hasApiKey } from '../../../js/groq.js';
import { renderApiKeyPanel, renderChangeKeyButton } from '../../../js/apikey-panel.js';

const lang = localStorage.getItem('artefactos_lang') || 'es';
let campoActivo = 'Negocios';
let complejidad = 'media';
let generando = false;
let casoActual = null;

const txt = {
  es: {
    titulo: 'Casos Prácticos',
    sub: 'Genera casos de estudio tipo Harvard para aprendizaje basado en problemas.',
    temaPlaceholder: 'Tema: fusión de empresas, crisis ambiental, dilema ético…',
    contextoPlaceholder: 'Contexto adicional (opcional)…',
    campo: 'Área',
    campos: ['Negocios', 'Medicina', 'Derecho', 'Tecnología', 'Política', 'Educación'],
    complejidad: 'Complejidad',
    complejidades: { baja: 'Baja', media: 'Media', alta: 'Alta' },
    generar: 'Generar caso', generando: 'Generando…',
    secLabels: ['Contexto', 'Situación', 'Actores involucrados', 'Datos clave', 'Dilema central', 'Preguntas de discusión', 'Restricciones'],
    verResolucion: '🔓 Ver resolución sugerida',
    resolTitulo: 'Resolución sugerida',
    nuevoCaso: 'Nuevo caso',
    badge: 'educación', galeria: '← Galería',
    error: 'Error al generar. Intenta de nuevo.'
  },
  en: {
    titulo: 'Case Studies',
    sub: 'Generate Harvard-style case studies for problem-based learning.',
    temaPlaceholder: 'Topic: company merger, environmental crisis, ethical dilemma…',
    contextoPlaceholder: 'Additional context (optional)…',
    campo: 'Area',
    campos: ['Business', 'Medicine', 'Law', 'Technology', 'Politics', 'Education'],
    complejidad: 'Complexity',
    complejidades: { baja: 'Low', media: 'Medium', alta: 'High' },
    generar: 'Generate case', generando: 'Generating…',
    secLabels: ['Context', 'Situation', 'Stakeholders', 'Key data', 'Central dilemma', 'Discussion questions', 'Constraints'],
    verResolucion: '🔓 See suggested resolution',
    resolTitulo: 'Suggested resolution',
    nuevoCaso: 'New case',
    badge: 'education', galeria: '← Gallery',
    error: 'Error generating. Try again.'
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
      <input type="text" id="tema-input" class="campo" placeholder="${t.temaPlaceholder}" maxlength="150" />
      <textarea id="contexto-input" class="campo" placeholder="${t.contextoPlaceholder}" maxlength="500"></textarea>
      <div class="selector-row">
        <div class="selector-grupo">
          <span class="selector-label">${t.campo}</span>
          <div class="pills" id="campo-pills">
            ${t.campos.map((c, i) => `<button class="pill${txt.es.campos[i] === campoActivo ? ' active' : ''}" data-val="${txt.es.campos[i]}">${c}</button>`).join('')}
          </div>
        </div>
        <div class="selector-grupo">
          <span class="selector-label">${t.complejidad}</span>
          <div class="pills" id="comp-pills">
            ${Object.entries(t.complejidades).map(([k, v]) => `<button class="pill${k === complejidad ? ' active' : ''}" data-val="${k}">${v}</button>`).join('')}
          </div>
        </div>
      </div>
      <button id="btn-generar" class="btn-principal">${t.generar}</button>
      <div id="resultado"></div>
    </div>
  `;
  renderChangeKeyButton('key-btn-wrap', lang);
  bindControles();
}

function bindControles() {
  bindPills('campo-pills', v => campoActivo = v);
  bindPills('comp-pills', v => complejidad = v);
  document.getElementById('btn-generar').addEventListener('click', generar);
}

async function generar() {
  const tema = document.getElementById('tema-input').value.trim();
  if (!tema || generando) return;
  const contexto = document.getElementById('contexto-input').value.trim();
  generando = true;
  const btn = document.getElementById('btn-generar');
  btn.disabled = true; btn.textContent = t.generando;
  const resultado = document.getElementById('resultado');
  resultado.innerHTML = '<p class="loading">…</p>';

  const compDesc = complejidad === 'baja' ? 'baja (introductorio)' : complejidad === 'media' ? 'media' : 'alta (múltiples variables)';
  const sys = `Genera un caso de estudio tipo Harvard sobre "${tema}" en el área de ${campoActivo}.
Complejidad: ${compDesc}. ${contexto ? `Contexto adicional: ${contexto}` : ''}

Responde SOLO con JSON válido:
{
  "titulo": "título del caso",
  "subtitulo": "subtítulo descriptivo breve",
  "secciones": [
    {"titulo": "${t.secLabels[0]}", "contenido": "contexto histórico y geográfico"},
    {"titulo": "${t.secLabels[1]}", "contenido": "descripción detallada de la situación actual"},
    {"titulo": "${t.secLabels[2]}", "contenido": "descripción de actores. Incluir JSON anidado: actores:[{nombre,rol}]"},
    {"titulo": "${t.secLabels[3]}", "contenido": "datos numéricos, estadísticas, hechos clave"},
    {"titulo": "${t.secLabels[4]}", "contenido": "el dilema o problema central a resolver"},
    {"titulo": "${t.secLabels[5]}", "contenido": "3-5 preguntas para discusión en clase"},
    {"titulo": "${t.secLabels[6]}", "contenido": "limitaciones de tiempo, recursos, regulaciones"}
  ],
  "actores": [{"nombre": "...", "rol": "..."}, {"nombre": "...", "rol": "..."}]
}`;

  try {
    const resp = await askGroq({ systemPrompt: sys, userMessage: tema, temperature: 0.85, maxTokens: 1500 });
    const data = parsearJSON(resp);
    if (!data || !data.secciones) { resultado.innerHTML = `<p class="loading">${t.error}</p>`; resetBtn(); return; }
    casoActual = data;
    renderCaso(data);
  } catch {
    resultado.innerHTML = `<p class="loading">${t.error}</p>`;
  }
  resetBtn();
}

function resetBtn() {
  generando = false;
  const btn = document.getElementById('btn-generar');
  if (btn) { btn.disabled = false; btn.textContent = t.generar; }
}

function renderCaso(data) {
  const resultado = document.getElementById('resultado');
  const secciones = (data.secciones || []).map(s =>
    `<div class="caso-seccion"><h3>${escaparHTML(s.titulo)}</h3><p>${escaparHTML(s.contenido)}</p></div>`
  ).join('');

  const actores = (data.actores || []).map(a =>
    `<div class="actor-card"><div class="actor-nombre">${escaparHTML(a.nombre)}</div><div class="actor-rol">${escaparHTML(a.rol)}</div></div>`
  ).join('');

  resultado.innerHTML = `
    <div class="caso-documento">
      <div class="caso-header">
        <div class="caso-titulo">${escaparHTML(data.titulo || '')}</div>
        <div class="caso-subtitulo">${escaparHTML(data.subtitulo || '')}</div>
      </div>
      ${secciones}
      ${actores ? `<div class="caso-seccion"><h3>${t.secLabels[2]}</h3><div class="actores-grid">${actores}</div></div>` : ''}
    </div>
    <button class="btn-resolucion" id="btn-resolucion">${t.verResolucion}</button>
    <div id="resolucion-zona"></div>
    <button class="btn-principal" id="btn-nuevo" style="margin-top:1rem">${t.nuevoCaso}</button>
  `;

  document.getElementById('btn-resolucion').addEventListener('click', generarResolucion);
  document.getElementById('btn-nuevo').addEventListener('click', () => renderArtefacto());
}

async function generarResolucion() {
  if (!casoActual || generando) return;
  generando = true;
  const zona = document.getElementById('resolucion-zona');
  zona.innerHTML = '<p class="loading">…</p>';

  const sys = `Eres un experto en análisis de casos. Basándote en el caso "${casoActual.titulo}", proporciona una resolución sugerida en 3-4 párrafos. Incluye: decisión recomendada, justificación, riesgos y plan de implementación.`;

  try {
    const resp = await askGroq({ systemPrompt: sys, userMessage: JSON.stringify(casoActual.secciones?.map(s => s.contenido).join(' ')), temperature: 0.8, maxTokens: 600 });
    zona.innerHTML = `<div class="resolucion-panel"><h3>${t.resolTitulo}</h3><p>${escaparHTML(resp)}</p></div>`;
  } catch {
    zona.innerHTML = '';
  }
  generando = false;
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
