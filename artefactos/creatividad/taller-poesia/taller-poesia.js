// taller-poesia.js — Taller de Poesía
// Modo crear + analizar poemas con IA

import { askGroq, hasApiKey } from '../../../js/groq.js';
import { renderApiKeyPanel, renderChangeKeyButton } from '../../../js/apikey-panel.js';

const lang = localStorage.getItem('artefactos_lang') || 'es';

let modo = 'crear'; // 'crear' | 'analizar'
let formaActiva = 'Verso libre';
let vozActiva = 'Primera persona';
let historial = [];
let generando = false;

const txt = {
  es: {
    titulo: 'Taller de Poesía', sub: 'Crea poemas nuevos o analiza poemas existentes.',
    crear: 'Crear', analizar: 'Analizar',
    tema_placeholder: 'Tema o emoción para el poema...',
    poema_placeholder: 'Pega aquí el poema a analizar...',
    forma: 'Forma', voz: 'Voz', componer: 'Componer', analizarBtn: 'Analizar',
    componiendo: 'Componiendo...', analizando: 'Analizando...',
    entrada: 'Entrada', resultado: 'Resultado',
    copiar: 'Copiar', copiado: '¡Copiado!',
    formas: ['Soneto', 'Haiku', 'Verso libre', 'Oda', 'Elegía', 'Limerick'],
    voces: ['Primera persona', 'Segunda persona', 'Observador externo'],
    badge: 'creatividad', galeria: '← Galería',
    error: 'Error al generar. Intenta de nuevo.',
    historial: 'Recientes'
  },
  en: {
    titulo: 'Poetry Workshop', sub: 'Create new poems or analyze existing ones.',
    crear: 'Create', analizar: 'Analyze',
    tema_placeholder: 'Theme or emotion for the poem...',
    poema_placeholder: 'Paste the poem to analyze here...',
    forma: 'Form', voz: 'Voice', componer: 'Compose', analizarBtn: 'Analyze',
    componiendo: 'Composing...', analizando: 'Analyzing...',
    entrada: 'Input', resultado: 'Result',
    copiar: 'Copy', copiado: 'Copied!',
    formas: ['Sonnet', 'Haiku', 'Free verse', 'Ode', 'Elegy', 'Limerick'],
    voces: ['First person', 'Second person', 'External observer'],
    badge: 'creativity', galeria: '← Gallery',
    error: 'Error generating. Try again.',
    historial: 'Recent'
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
    </header>
    <div class="main-wrap">
      <h1>${t.titulo}</h1>
      <p class="subtitulo">${t.sub}</p>

      <div class="modo-tabs">
        <button class="modo-tab active" data-modo="crear">${t.crear}</button>
        <button class="modo-tab" data-modo="analizar">${t.analizar}</button>
      </div>

      <div class="dual-layout">
        <div class="panel" id="panel-entrada">
          <div class="panel-label">${t.entrada}</div>
          <div id="entrada-contenido"></div>
        </div>
        <div class="panel" id="panel-resultado">
          <div class="panel-label">${t.resultado}</div>
          <div id="resultado-contenido"></div>
        </div>
      </div>

      <div class="historial-tabs" id="historial-tabs"></div>
    </div>
  `;

  renderChangeKeyButton('key-btn-wrap', lang);
  renderEntrada();
  initEventos();
}

function initEventos() {
  document.querySelectorAll('.modo-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      modo = tab.dataset.modo;
      document.querySelectorAll('.modo-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      renderEntrada();
      document.getElementById('resultado-contenido').innerHTML = '';
    });
  });
}

function renderEntrada() {
  const cont = document.getElementById('entrada-contenido');
  if (modo === 'crear') {
    cont.innerHTML = `
      <input type="text" id="tema-input" class="campo-texto" placeholder="${t.tema_placeholder}" />
      <div class="selector-grupo" style="margin-top:0.75rem">
        <span class="selector-label">${t.forma}</span>
        <div class="pills" id="formas">
          ${t.formas.map((f, i) => `<button class="pill${txt.es.formas[i] === formaActiva ? ' active' : ''}" data-val="${txt.es.formas[i]}">${f}</button>`).join('')}
        </div>
      </div>
      <div class="selector-grupo">
        <span class="selector-label">${t.voz}</span>
        <div class="pills" id="voces">
          ${t.voces.map((v, i) => `<button class="pill${txt.es.voces[i] === vozActiva ? ' active' : ''}" data-val="${txt.es.voces[i]}">${v}</button>`).join('')}
        </div>
      </div>
      <button id="btn-accion" class="btn-principal">${t.componer}</button>
    `;
    cont.querySelector('#formas').addEventListener('click', e => {
      const p = e.target.closest('.pill'); if (!p) return;
      cont.querySelectorAll('#formas .pill').forEach(x => x.classList.remove('active'));
      p.classList.add('active'); formaActiva = p.dataset.val;
    });
    cont.querySelector('#voces').addEventListener('click', e => {
      const p = e.target.closest('.pill'); if (!p) return;
      cont.querySelectorAll('#voces .pill').forEach(x => x.classList.remove('active'));
      p.classList.add('active'); vozActiva = p.dataset.val;
    });
    cont.querySelector('#btn-accion').addEventListener('click', crearPoema);
  } else {
    cont.innerHTML = `
      <textarea id="poema-input" class="campo-texto" placeholder="${t.poema_placeholder}"></textarea>
      <button id="btn-accion" class="btn-principal">${t.analizarBtn}</button>
    `;
    cont.querySelector('#btn-accion').addEventListener('click', analizarPoema);
  }
}

async function crearPoema() {
  const tema = document.getElementById('tema-input').value.trim();
  if (!tema || generando) return;
  const btn = document.getElementById('btn-accion');
  const res = document.getElementById('resultado-contenido');
  generando = true; btn.disabled = true; btn.textContent = t.componiendo;
  res.innerHTML = '<p class="loading">...</p>';

  const idioma = lang === 'en' ? 'English' : 'Spanish';
  const systemPrompt = `Eres un poeta erudito. Escribes en ${idioma}.
Compón un poema sobre: ${tema}
Forma: ${formaActiva}
Voz narrativa: ${vozActiva}
Reglas:
- Sigue fielmente las convenciones de la forma elegida.
- Haiku: 5-7-5 sílabas estrictas. Soneto: 14 versos, dos cuartetos y dos tercetos.
- Limerick: AABBA. Oda: estrofas de alabanza. Elegía: tono de lamento o pérdida.
- Verso libre: sin restricciones formales pero con ritmo interno.
- Solo el poema. Sin título (a menos que sea un soneto). Sin explicaciones.`;

  try {
    const resultado = await llamarGroq({ systemPrompt, userMessage: tema, temperature: 0.9, maxTokens: 500 });
    if (!resultado) return;
    const versos = resultado.split('\n').map(v => `<span class="verso">${v}</span>`).join('\n');
    res.innerHTML = `<div class="resultado-poema">${versos}</div>
      <button class="btn-sec" id="btn-copiar-res">${t.copiar}</button>`;
    res.querySelector('#btn-copiar-res').addEventListener('click', () => copiarTexto(resultado, res.querySelector('#btn-copiar-res')));
    agregarHistorial(tema, resultado);
  } catch (err) { res.innerHTML = `<p class="loading">${t.error}</p>`; }
  finally { generando = false; btn.disabled = false; btn.textContent = t.componer; }
}

async function analizarPoema() {
  const poema = document.getElementById('poema-input').value.trim();
  if (!poema || generando) return;
  const btn = document.getElementById('btn-accion');
  const res = document.getElementById('resultado-contenido');
  generando = true; btn.disabled = true; btn.textContent = t.analizando;
  res.innerHTML = '<p class="loading">...</p>';

  const idioma = lang === 'en' ? 'English' : 'Spanish';
  const systemPrompt = `Eres un crítico literario especializado en poesía. Analizas en ${idioma}.
Analiza el siguiente poema:
${poema}
Proporciona un análisis estructurado con estas secciones exactas:
FORMA: [identificación de la forma y estructura]
MÉTRICA: [patrón rítmico aproximado]
RECURSOS: [3-5 recursos retóricos con ejemplo del poema]
TEMA: [tema central en 1-2 oraciones]
TONO: [tono emocional dominante]
VERSO CLAVE: "[verso más poderoso]" — [por qué es el más poderoso]
Sé preciso, técnico y apasionado a la vez.`;

  try {
    const resultado = await llamarGroq({ systemPrompt, userMessage: poema, temperature: 0.7, maxTokens: 800 });
    if (!resultado) return;
    // Parsear secciones
    const secciones = resultado.split('\n').filter(l => l.trim());
    res.innerHTML = secciones.map(s => {
      const match = s.match(/^([A-ZÁÉÍÓÚÑ\s]+):\s*(.*)/);
      if (match) {
        return `<div class="analisis-seccion">
          <div class="analisis-titulo">${match[1]}</div>
          <div class="analisis-texto">${match[2]}</div>
        </div>`;
      }
      return `<div class="analisis-texto">${s}</div>`;
    }).join('') + `<button class="btn-sec" id="btn-copiar-res">${t.copiar}</button>`;
    res.querySelector('#btn-copiar-res').addEventListener('click', () => copiarTexto(resultado, res.querySelector('#btn-copiar-res')));
    agregarHistorial(poema.substring(0, 30) + '...', resultado);
  } catch (err) { res.innerHTML = `<p class="loading">${t.error}</p>`; }
  finally { generando = false; btn.disabled = false; btn.textContent = t.analizarBtn; }
}

function agregarHistorial(label, texto) {
  historial.unshift({ label, texto, modo });
  if (historial.length > 3) historial.pop();
  renderHistorial();
}

function renderHistorial() {
  const cont = document.getElementById('historial-tabs');
  cont.innerHTML = historial.length ? `<span style="font-size:0.7rem;color:var(--texto-muted);margin-right:0.3rem">${t.historial}:</span>` : '';
  cont.innerHTML += historial.map((h, i) =>
    `<button class="hist-tab" data-idx="${i}">${h.label.substring(0, 20)}</button>`
  ).join('');
  cont.querySelectorAll('.hist-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      const h = historial[parseInt(tab.dataset.idx)];
      const res = document.getElementById('resultado-contenido');
      if (h.modo === 'crear') {
        const versos = h.texto.split('\n').map(v => `<span class="verso">${v}</span>`).join('\n');
        res.innerHTML = `<div class="resultado-poema">${versos}</div>`;
      } else {
        res.innerHTML = `<div class="analisis-texto">${h.texto}</div>`;
      }
    });
  });
}

function copiarTexto(texto, btn) {
  navigator.clipboard.writeText(texto);
  const orig = btn.textContent;
  btn.textContent = t.copiado;
  setTimeout(() => { btn.textContent = orig; }, 1500);
}

async function llamarGroq(params) {
  try { return await askGroq(params); }
  catch (err) {
    if (err.message === 'NO_KEY' || err.message === 'INVALID_KEY') {
      renderApiKeyPanel('app', () => renderArtefacto(), lang);
      return null;
    }
    throw err;
  }
}

document.addEventListener('DOMContentLoaded', init);
