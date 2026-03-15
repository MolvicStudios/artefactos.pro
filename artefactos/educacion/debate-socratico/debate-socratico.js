// debate-socratico.js — Debate Socrático
// Dos tesis enfrentadas, argumentos con peso, falacias, preguntas de examen

import { askGroq, hasApiKey } from '../../../js/groq.js';
import { renderApiKeyPanel, renderChangeKeyButton } from '../../../js/apikey-panel.js';

const lang = localStorage.getItem('artefactos_lang') || 'es';
let rigorActivo = 5;
let generando = false;

const txt = {
  es: {
    titulo: 'Debate Socrático',
    sub: 'Genera un debate estructurado con dos tesis enfrentadas y análisis de falacias.',
    placeholder: '¿Es ético el uso de IA en la educación?, pena de muerte, energía nuclear…',
    rigor: 'Argumentos por tesis',
    rigores: [3, 5, 7],
    generar: 'Generar debate', generando: 'Generando…',
    tesisA: 'Tesis A — A favor', tesisB: 'Tesis B — En contra',
    pesos: { fuerte: 'Fuerte', medio: 'Medio', debil: 'Débil' },
    falacia: '⚠ Falacia: ',
    examTitulo: '📝 Preguntas de examen',
    nuevoDebate: 'Nuevo debate',
    badge: 'educación', galeria: '← Galería',
    error: 'Error al generar. Intenta de nuevo.'
  },
  en: {
    titulo: 'Socratic Debate',
    sub: 'Generate a structured debate with two opposing theses and fallacy analysis.',
    placeholder: 'Is AI in education ethical?, death penalty, nuclear energy…',
    rigor: 'Arguments per thesis',
    rigores: [3, 5, 7],
    generar: 'Generate debate', generando: 'Generating…',
    tesisA: 'Thesis A — For', tesisB: 'Thesis B — Against',
    pesos: { fuerte: 'Strong', medio: 'Medium', debil: 'Weak' },
    falacia: '⚠ Fallacy: ',
    examTitulo: '📝 Exam questions',
    nuevoDebate: 'New debate',
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
      <input type="text" id="tema-input" class="campo" placeholder="${t.placeholder}" maxlength="150" />
      <div class="selector-row">
        <div class="selector-grupo">
          <span class="selector-label">${t.rigor}</span>
          <div class="pills" id="rigor-pills">
            ${t.rigores.map(r => `<button class="pill${r === rigorActivo ? ' active' : ''}" data-val="${r}">${r}</button>`).join('')}
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
  document.querySelectorAll('#rigor-pills .pill').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#rigor-pills .pill').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      rigorActivo = parseInt(btn.dataset.val);
    });
  });
  document.getElementById('btn-generar').addEventListener('click', generar);
}

async function generar() {
  const tema = document.getElementById('tema-input').value.trim();
  if (!tema || generando) return;
  generando = true;
  const btn = document.getElementById('btn-generar');
  btn.disabled = true; btn.textContent = t.generando;
  const resultado = document.getElementById('resultado');
  resultado.innerHTML = '<p class="loading">…</p>';

  const sys = `Genera un debate socrático estructurado sobre "${tema}".

Responde SOLO con JSON válido:
{
  "tesisA": "enunciado de la tesis a favor",
  "tesisB": "enunciado de la tesis en contra",
  "argumentosA": [
    {"texto": "argumento", "peso": "fuerte|medio|debil", "falacia": "nombre de falacia si la hay, o vacío"}
  ],
  "argumentosB": [
    {"texto": "argumento", "peso": "fuerte|medio|debil", "falacia": "nombre de falacia si la hay, o vacío"}
  ],
  "preguntas_examen": ["pregunta 1", "pregunta 2", "pregunta 3"]
}

REGLAS:
- Exactamente ${rigorActivo} argumentos por cada tesis.
- Cada argumento tiene peso: fuerte, medio o debil.
- Al menos 1-2 argumentos deben incluir una falacia identificada (ad hominem, pendiente resbaladiza, etc.).
- 3-5 preguntas de examen sobre el debate.
- Los argumentos deben ser variados y sustanciales.`;

  try {
    const resp = await askGroq({ systemPrompt: sys, userMessage: tema, temperature: 0.85, maxTokens: 1500 });
    if (resp === 'NO_KEY' || resp === 'INVALID_KEY') { resultado.innerHTML = `<p class="loading">${t.error}</p>`; resetBtn(); return; }
    const data = parsearJSON(resp);
    if (!data || !data.argumentosA) { resultado.innerHTML = `<p class="loading">${t.error}</p>`; resetBtn(); return; }
    renderDebate(data);
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

function renderDebate(data) {
  const resultado = document.getElementById('resultado');
  const pesoLabel = peso => t.pesos[peso] || peso;
  const pesoClass = peso => peso === 'fuerte' ? 'arg-fuerte' : peso === 'medio' ? 'arg-medio' : 'arg-debil';

  const renderArgs = (args) => args.map(a => `
    <div class="argumento">
      <span class="arg-peso ${pesoClass(a.peso)}">${pesoLabel(a.peso)}</span>
      <div class="arg-texto">${escaparHTML(a.texto)}</div>
      ${a.falacia ? `<div class="arg-falacia">${t.falacia}${escaparHTML(a.falacia)}</div>` : ''}
    </div>
  `).join('');

  const preguntas = (data.preguntas_examen || []).map(p =>
    `<div class="exam-pregunta">${escaparHTML(p)}</div>`
  ).join('');

  resultado.innerHTML = `
    <div class="tesis-banner">
      <div class="tesis-card tesis-a">
        <div class="tesis-label">${t.tesisA}</div>
        <div class="tesis-texto">${escaparHTML(data.tesisA || '')}</div>
      </div>
      <div class="tesis-card tesis-b">
        <div class="tesis-label">${t.tesisB}</div>
        <div class="tesis-texto">${escaparHTML(data.tesisB || '')}</div>
      </div>
    </div>
    <div class="debate-columnas">
      <div class="col-a">
        <div class="col-titulo">${t.tesisA}</div>
        ${renderArgs(data.argumentosA || [])}
      </div>
      <div class="col-b">
        <div class="col-titulo">${t.tesisB}</div>
        ${renderArgs(data.argumentosB || [])}
      </div>
    </div>
    ${preguntas ? `
      <div class="exam-zona">
        <div class="exam-titulo">${t.examTitulo}</div>
        ${preguntas}
      </div>` : ''}
    <button class="btn-principal" id="btn-nuevo" style="margin-top:1.5rem">${t.nuevoDebate}</button>
  `;

  document.getElementById('btn-nuevo').addEventListener('click', () => renderArtefacto());
}

function parsearJSON(raw) {
  let limpio = raw.trim();
  limpio = limpio.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/g, '');
  try { return JSON.parse(limpio); } catch { return null; }
}
function escaparHTML(str) { const d = document.createElement('div'); d.textContent = str; return d.innerHTML; }

init();
