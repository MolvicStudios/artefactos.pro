// traductor-tono.js — Traductor de Tono con IA
import { askGroq, hasApiKey } from '../../../js/groq.js';
import { renderApiKeyPanel, renderChangeKeyButton } from '../../../js/apikey-panel.js';

const lang = localStorage.getItem('artefactos_lang') || 'es';
let tonoActivo = 'formal';
let generando = false;

const txt = {
  es: {
    titulo: 'Traductor de Tono',
    sub: 'Pega cualquier texto y reescríbelo en el tono que necesites.',
    texto: 'Texto original', texto_ph: 'Pega aquí el texto que quieres reescribir…',
    tono: 'Tono deseado',
    tonos: [
      { id: 'formal', label: 'Formal' },
      { id: 'casual', label: 'Casual' },
      { id: 'persuasivo', label: 'Persuasivo' },
      { id: 'empatico', label: 'Empático' },
      { id: 'profesional', label: 'Profesional' },
      { id: 'divertido', label: 'Divertido' }
    ],
    generar: 'Reescribir', generando: 'Reescribiendo…',
    copiar: 'Copiar', copiado: '¡Copiado!', nueva: 'Nuevo texto',
    badge: 'productividad', galeria: '← Galería',
    error: 'Error al generar. Intenta de nuevo.'
  },
  en: {
    titulo: 'Tone Translator',
    sub: 'Paste any text and rewrite it in the tone you need.',
    texto: 'Original text', texto_ph: 'Paste the text you want to rewrite here…',
    tono: 'Desired tone',
    tonos: [
      { id: 'formal', label: 'Formal' },
      { id: 'casual', label: 'Casual' },
      { id: 'persuasivo', label: 'Persuasive' },
      { id: 'empatico', label: 'Empathetic' },
      { id: 'profesional', label: 'Professional' },
      { id: 'divertido', label: 'Fun' }
    ],
    generar: 'Rewrite', generando: 'Rewriting…',
    copiar: 'Copy', copiado: 'Copied!', nueva: 'New text',
    badge: 'productivity', galeria: '← Gallery',
    error: 'Error generating. Try again.'
  }
};
const t = txt[lang] || txt.es;

const toneInstructions = {
  formal: lang === 'en'
    ? 'Rewrite in a formal, polished, and professional tone. Use precise vocabulary and complete sentences.'
    : 'Reescribe en un tono formal, pulido y profesional. Usa vocabulario preciso y oraciones completas.',
  casual: lang === 'en'
    ? 'Rewrite in a casual, relaxed, and conversational tone. Use everyday language.'
    : 'Reescribe en un tono casual, relajado y conversacional. Usa lenguaje cotidiano.',
  persuasivo: lang === 'en'
    ? 'Rewrite in a persuasive and compelling tone. Use rhetorical techniques to convince the reader.'
    : 'Reescribe en un tono persuasivo y convincente. Usa técnicas retóricas para convencer al lector.',
  empatico: lang === 'en'
    ? 'Rewrite in an empathetic, warm, and understanding tone. Show care and sensitivity.'
    : 'Reescribe en un tono empático, cálido y comprensivo. Muestra cuidado y sensibilidad.',
  profesional: lang === 'en'
    ? 'Rewrite in a professional and business-appropriate tone. Be clear, direct, and courteous.'
    : 'Reescribe en un tono profesional y apropiado para negocios. Sé claro, directo y cortés.',
  divertido: lang === 'en'
    ? 'Rewrite in a fun, humorous, and entertaining tone. Use wit and lighthearted language.'
    : 'Reescribe en un tono divertido, humorístico y entretenido. Usa ingenio y lenguaje desenfadado.'
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
        <span class="field-label">${t.tono}</span>
        <div class="pills" id="tonos">
          ${t.tonos.map((tn, i) => `<button class="pill${i === 0 ? ' active' : ''}" data-val="${tn.id}">${tn.label}</button>`).join('')}
        </div>
      </div>
      <button id="btn-generar" class="btn-primary">${t.generar}</button>
      <div id="resultado-wrap" class="resultado-wrap">
        <div class="output-box" id="output-texto"></div>
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
  document.getElementById('tonos').addEventListener('click', e => {
    const pill = e.target.closest('.pill'); if (!pill) return;
    document.querySelectorAll('#tonos .pill').forEach(p => p.classList.remove('active'));
    pill.classList.add('active'); tonoActivo = pill.dataset.val;
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
      systemPrompt: `Eres un experto en comunicación y redacción. Responde siempre en ${idioma}.\n${toneInstructions[tonoActivo]}\nDevuelve solo el texto reescrito, sin explicaciones ni comentarios adicionales. Mantén el significado original.`,
      userMessage: texto,
      temperature: 0.6,
      maxTokens: 1200
    });
    document.getElementById('output-texto').textContent = resultado;
    document.getElementById('resultado-wrap').classList.add('visible');
  } catch {
    document.getElementById('output-texto').textContent = t.error;
    document.getElementById('resultado-wrap').classList.add('visible');
  }
  generando = false; btn.disabled = false; btn.textContent = t.generar;
}

function copiar() {
  const texto = document.getElementById('output-texto').textContent;
  navigator.clipboard.writeText(texto);
  const btn = document.getElementById('btn-copiar');
  btn.textContent = t.copiado; btn.classList.add('copiado');
  setTimeout(() => { btn.textContent = t.copiar; btn.classList.remove('copiado'); }, 1500);
}

document.addEventListener('DOMContentLoaded', init);
