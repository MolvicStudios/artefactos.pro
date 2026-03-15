// resumidor.js — Resumidor de Texto con IA
import { askGroq, hasApiKey } from '../../../js/groq.js';
import { renderApiKeyPanel, renderChangeKeyButton } from '../../../js/apikey-panel.js';

const lang = localStorage.getItem('artefactos_lang') || 'es';
let longitudActiva = 'breve';
let generando = false;

const txt = {
  es: {
    titulo: 'Resumidor de Texto',
    sub: 'Pega cualquier texto y obtén un resumen conciso con IA.',
    texto: 'Texto a resumir', texto_ph: 'Pega aquí el texto que quieres resumir…',
    longitud: 'Extensión del resumen',
    longitudes: [
      { id: 'breve', label: 'Breve' },
      { id: 'medio', label: 'Medio' },
      { id: 'detallado', label: 'Detallado' }
    ],
    generar: 'Resumir', generando: 'Resumiendo…',
    copiar: 'Copiar', copiado: '¡Copiado!', nueva: 'Nuevo resumen',
    badge: 'productividad', galeria: '← Galería',
    error: 'Error al generar. Intenta de nuevo.'
  },
  en: {
    titulo: 'Text Summarizer',
    sub: 'Paste any text and get a concise AI-powered summary.',
    texto: 'Text to summarize', texto_ph: 'Paste the text you want to summarize here…',
    longitud: 'Summary length',
    longitudes: [
      { id: 'breve', label: 'Brief' },
      { id: 'medio', label: 'Medium' },
      { id: 'detallado', label: 'Detailed' }
    ],
    generar: 'Summarize', generando: 'Summarizing…',
    copiar: 'Copy', copiado: 'Copied!', nueva: 'New summary',
    badge: 'productivity', galeria: '← Gallery',
    error: 'Error generating. Try again.'
  }
};
const t = txt[lang] || txt.es;

const instrucciones = {
  breve: lang === 'en'
    ? 'Summarize in a maximum of 3 short sentences. Be extremely concise.'
    : 'Resume en máximo 3 oraciones cortas. Sé extremadamente conciso.',
  medio: lang === 'en'
    ? 'Summarize in a single well-structured paragraph.'
    : 'Resume en un único párrafo bien estructurado.',
  detallado: lang === 'en'
    ? 'Summarize in 3 paragraphs. Include bullet points for the key ideas in each paragraph.'
    : 'Resume en 3 párrafos. Incluye viñetas con las ideas clave en cada párrafo.'
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
        <span class="field-label">${t.texto}</span>
        <textarea id="texto-entrada" class="field-textarea" placeholder="${t.texto_ph}" maxlength="12000"></textarea>
      </div>
      <div class="field-group">
        <span class="field-label">${t.longitud}</span>
        <div class="pills" id="longitudes">
          ${t.longitudes.map((l, i) => `<button class="pill${i === 0 ? ' active' : ''}" data-val="${l.id}">${l.label}</button>`).join('')}
        </div>
      </div>
      <button id="btn-generar" class="btn-primary">${t.generar}</button>
      <div id="resultado-wrap" class="resultado-wrap">
        <div class="resumen-box" id="resumen-texto"></div>
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
  document.getElementById('longitudes').addEventListener('click', e => {
    const pill = e.target.closest('.pill'); if (!pill) return;
    document.querySelectorAll('#longitudes .pill').forEach(p => p.classList.remove('active'));
    pill.classList.add('active'); longitudActiva = pill.dataset.val;
  });
  document.getElementById('btn-generar').addEventListener('click', generar);
  document.getElementById('btn-copiar').addEventListener('click', copiar);
  document.getElementById('btn-nueva').addEventListener('click', () => {
    document.getElementById('texto-entrada').value = '';
    document.getElementById('resultado-wrap').classList.remove('visible');
  });
}

async function generar() {
  const texto = document.getElementById('texto-entrada').value.trim();
  if (!texto || generando) return;
  const btn = document.getElementById('btn-generar');
  generando = true; btn.disabled = true; btn.textContent = t.generando;
  const idioma = lang === 'en' ? 'English' : 'Spanish';
  try {
    const resultado = await askGroq({
      systemPrompt: `Eres un asistente experto en resumir textos. Responde siempre en ${idioma}.\n${instrucciones[longitudActiva]}\nDevuelve solo el resumen, sin explicaciones ni comentarios adicionales.`,
      userMessage: texto,
      temperature: 0.4,
      maxTokens: 800
    });
    document.getElementById('resumen-texto').textContent = resultado;
    document.getElementById('resultado-wrap').classList.add('visible');
  } catch {
    document.getElementById('resumen-texto').textContent = t.error;
    document.getElementById('resultado-wrap').classList.add('visible');
  }
  generando = false; btn.disabled = false; btn.textContent = t.generar;
}

function copiar() {
  const texto = document.getElementById('resumen-texto').textContent;
  navigator.clipboard.writeText(texto);
  const btn = document.getElementById('btn-copiar');
  btn.textContent = t.copiado; btn.classList.add('copiado');
  setTimeout(() => { btn.textContent = t.copiar; btn.classList.remove('copiado'); }, 1500);
}

document.addEventListener('DOMContentLoaded', init);
