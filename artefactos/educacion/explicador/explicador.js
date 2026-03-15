// explicador.js — Explicador de Conceptos
// 3 niveles simultáneos + analogía visual

import { askGroq, hasApiKey } from '../../../js/groq.js';
import { renderApiKeyPanel, renderChangeKeyButton } from '../../../js/apikey-panel.js';

const lang = localStorage.getItem('artefactos_lang') || 'es';
let campoActivo = 'Otro';
let generando = false;
let historial = []; // últimos 8 conceptos
let contadorSesion = 0;
let ultimoResultado = null;

const txt = {
  es: {
    titulo: 'Explicador de Conceptos',
    sub: 'Introduce cualquier concepto y recibe 3 explicaciones a distinto nivel.',
    placeholder: 'Entropía, teorema de Bayes, guerra fría, fotosíntesis…',
    campo: 'Campo de conocimiento',
    campos: ['Ciencia', 'Historia', 'Filosofía', 'Tecnología', 'Arte', 'Economía', 'Matemáticas', 'Otro'],
    generar: 'Explicar en 3 niveles', generando: 'Explicando…',
    niveles: ['Niño de 10 años', 'Universitario', 'Experto'],
    iconos: ['⭐', '📖', '🔬'],
    copiar: 'Copiar', copiado: '✓',
    analogia: '💡 Ver analogía', analogiaLabel: 'Analogía memorable',
    contador: 'conceptos explicados',
    badge: 'educación', galeria: '← Galería',
    error: 'Error al explicar. Intenta de nuevo.'
  },
  en: {
    titulo: 'Concept Explainer',
    sub: 'Enter any concept and get 3 explanations at different levels.',
    placeholder: 'Entropy, Bayes theorem, cold war, photosynthesis…',
    campo: 'Knowledge field',
    campos: ['Science', 'History', 'Philosophy', 'Technology', 'Art', 'Economics', 'Mathematics', 'Other'],
    generar: 'Explain in 3 levels', generando: 'Explaining…',
    niveles: ['10-year-old', 'University', 'Expert'],
    iconos: ['⭐', '📖', '🔬'],
    copiar: 'Copy', copiado: '✓',
    analogia: '💡 See analogy', analogiaLabel: 'Memorable analogy',
    contador: 'concepts explained',
    badge: 'education', galeria: '← Gallery',
    error: 'Error explaining. Try again.'
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
      <div class="busqueda">
        <input type="text" id="concepto-input" class="campo" placeholder="${t.placeholder}" maxlength="120" />
      </div>
      <div class="selector-grupo">
        <span class="selector-label">${t.campo}</span>
        <div class="pills" id="campo-pills">
          ${t.campos.map((c, i) => `<button class="pill${txt.es.campos[i] === campoActivo ? ' active' : ''}" data-val="${txt.es.campos[i]}">${c}</button>`).join('')}
        </div>
      </div>
      <button id="btn-generar" class="btn-principal">${t.generar}</button>
      <div id="historial-zona" class="historial-chips"></div>
      <div class="sesion-counter" id="contador">${contadorSesion} ${t.contador}</div>
      <div id="resultado"></div>
    </div>
  `;
  renderChangeKeyButton('key-btn-wrap', lang);

  document.getElementById('campo-pills').addEventListener('click', e => {
    const p = e.target.closest('.pill'); if (!p) return;
    document.querySelectorAll('#campo-pills .pill').forEach(x => x.classList.remove('active'));
    p.classList.add('active'); campoActivo = p.dataset.val;
  });
  document.getElementById('btn-generar').addEventListener('click', explicar);
  document.getElementById('concepto-input').addEventListener('keydown', e => {
    if (e.key === 'Enter') explicar();
  });
  renderHistorial();
}

async function explicar(conceptoOverride) {
  const input = document.getElementById('concepto-input');
  const concepto = conceptoOverride || input.value.trim();
  if (!concepto || generando) return;
  if (conceptoOverride) input.value = concepto;

  const btn = document.getElementById('btn-generar');
  const resultado = document.getElementById('resultado');
  generando = true; btn.disabled = true; btn.textContent = t.generando;
  resultado.innerHTML = '<p class="loading">...</p>';

  const idioma = lang === 'en' ? 'English' : 'Spanish';
  const systemPrompt = `Eres un educador extraordinario capaz de explicar cualquier concepto a cualquier nivel. Explicas en ${idioma}.
Concepto: ${concepto}
Campo: ${campoActivo}

Genera tres explicaciones del mismo concepto. Responde SOLO en este formato JSON (sin markdown):
{
  "nivel_nino": "Explicación para un niño de 10 años. Sin tecnicismos. Con una analogía cotidiana. Máximo 80 palabras. Que genere asombro.",
  "nivel_universitario": "Explicación para un estudiante universitario. Con terminología correcta pero sin asumir conocimiento avanzado. Contexto histórico o científico si es relevante. Máximo 120 palabras.",
  "nivel_experto": "Explicación técnica precisa para un experto en el campo. Con matices, excepciones y referencias a debates actuales si los hay. Máximo 150 palabras.",
  "analogia": "Una metáfora o analogía que hace que el concepto sea imposible de olvidar. 2-3 oraciones. Debe ser original, no el primer ejemplo que se le ocurriría a cualquiera."
}`;

  try {
    const raw = await llamarGroq({ systemPrompt, userMessage: concepto, temperature: 0.8, maxTokens: 900 });
    if (!raw) return;
    const data = parseJSON(raw);
    if (!data || !data.nivel_nino) throw new Error('parse');
    ultimoResultado = data;
    contadorSesion++;
    document.getElementById('contador').textContent = `${contadorSesion} ${t.contador}`;
    agregarHistorial(concepto);
    renderNiveles(data);
  } catch { resultado.innerHTML = `<p class="loading">${t.error}</p>`; }
  finally { generando = false; btn.disabled = false; btn.textContent = t.generar; }
}

function renderNiveles(data) {
  const resultado = document.getElementById('resultado');
  const niveles = [
    { key: 'nino', texto: data.nivel_nino },
    { key: 'uni', texto: data.nivel_universitario },
    { key: 'experto', texto: data.nivel_experto }
  ];

  resultado.innerHTML = `
    <div class="niveles-grid">
      ${niveles.map((n, i) => `
        <div class="nivel-col" data-nivel="${n.key}" style="animation-delay:${i * 0.1}s">
          <div class="nivel-header">
            <span class="icono">${t.iconos[i]}</span>
            <span class="titulo">${t.niveles[i]}</span>
          </div>
          <div class="nivel-body">${n.texto}</div>
          <div class="nivel-acciones">
            <button class="btn-mini btn-copiar" data-texto="${n.texto.replace(/"/g, '&quot;')}">${t.copiar}</button>
          </div>
        </div>
      `).join('')}
    </div>
    <div class="acciones-post">
      <button id="btn-analogia" class="btn-sec">${t.analogia}</button>
    </div>
    <div id="analogia-zona"></div>
  `;

  resultado.querySelectorAll('.btn-copiar').forEach(btn => {
    btn.addEventListener('click', () => {
      navigator.clipboard.writeText(btn.dataset.texto).then(() => {
        btn.textContent = t.copiado;
        setTimeout(() => btn.textContent = t.copiar, 1200);
      });
    });
  });

  document.getElementById('btn-analogia').addEventListener('click', () => {
    const zona = document.getElementById('analogia-zona');
    if (data.analogia) {
      zona.innerHTML = `<div class="analogia-panel"><span class="analogia-label">${t.analogiaLabel}</span>${data.analogia}</div>`;
    }
  });
}

function agregarHistorial(concepto) {
  historial = historial.filter(c => c !== concepto);
  historial.unshift(concepto);
  if (historial.length > 8) historial.pop();
  renderHistorial();
}

function renderHistorial() {
  const zona = document.getElementById('historial-zona');
  if (!zona) return;
  zona.innerHTML = historial.map(c =>
    `<button class="chip" data-concepto="${c.replace(/"/g, '&quot;')}">${c}</button>`
  ).join('');
  zona.querySelectorAll('.chip').forEach(chip => {
    chip.addEventListener('click', () => explicar(chip.dataset.concepto));
  });
}

function parseJSON(raw) {
  try {
    let limpio = raw.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
    const inicio = limpio.indexOf('{');
    const fin = limpio.lastIndexOf('}');
    if (inicio >= 0 && fin > inicio) limpio = limpio.substring(inicio, fin + 1);
    return JSON.parse(limpio);
  } catch { return null; }
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
