// comparador.js — Comparador de Conceptos
import { askGroq, hasApiKey } from '../../../js/groq.js';
import { renderApiKeyPanel, renderChangeKeyButton } from '../../../js/apikey-panel.js';

const lang = localStorage.getItem('artefactos_lang') || 'es';
let generando = false;

const txt = {
  es: {
    titulo: 'Comparador de Conceptos',
    sub: 'Análisis estructurado de similitudes y diferencias entre dos conceptos.',
    badge: 'research', galeria: '← Galería',
    concepto1: 'Concepto A', c1_ph: 'Ej: capitalismo',
    concepto2: 'Concepto B', c2_ph: 'Ej: socialismo',
    generar: 'Comparar', generando: 'Analizando…',
    copiar: 'Copiar', copiado: '¡Copiado!', nueva: 'Nueva comparación',
    error: 'Error al generar. Intenta de nuevo.'
  },
  en: {
    titulo: 'Concept Comparator',
    sub: 'Structured analysis of similarities and differences between two concepts.',
    badge: 'research', galeria: '← Gallery',
    concepto1: 'Concept A', c1_ph: 'E.g.: capitalism',
    concepto2: 'Concept B', c2_ph: 'E.g.: socialism',
    generar: 'Compare', generando: 'Analyzing…',
    copiar: 'Copy', copiado: 'Copied!', nueva: 'New comparison',
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
      <h1>⚖️ ${t.titulo}</h1>
      <p class="subtitulo">${t.sub}</p>
      <div class="field-group">
        <span class="field-label">${t.concepto1}</span>
        <input type="text" id="concepto1" class="field-input" placeholder="${t.c1_ph}" maxlength="120">
      </div>
      <div class="field-group">
        <span class="field-label">${t.concepto2}</span>
        <input type="text" id="concepto2" class="field-input" placeholder="${t.c2_ph}" maxlength="120">
      </div>
      <button id="btn-generar" class="btn-primary">${t.generar}</button>
      <div id="resultado-wrap" class="resultado-wrap">
        <div class="result-box" id="resultado"></div>
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
    document.getElementById('concepto1').value = '';
    document.getElementById('concepto2').value = '';
    document.getElementById('resultado-wrap').classList.remove('visible');
  });
}

async function generar() {
  const c1 = document.getElementById('concepto1').value.trim();
  const c2 = document.getElementById('concepto2').value.trim();
  if (!c1 || !c2 || generando) return;
  const btn = document.getElementById('btn-generar');
  generando = true; btn.disabled = true; btn.textContent = t.generando;
  const idioma = lang === 'en' ? 'English' : 'Spanish';
  try {
    const resultado = await askGroq({
      systemPrompt: `You are an analytical expert. Write in ${idioma}.
Compare two concepts with a structured analysis:
1. SIMILARITIES (3-5 points)
2. DIFFERENCES (3-5 points)
3. ADVANTAGES of each
4. DISADVANTAGES of each
5. CONCLUSION (brief synthesis)
Use clear headers and bullet points.`,
      userMessage: `Compare: "${c1}" vs "${c2}"`,
      temperature: 0.6,
      maxTokens: 800
    });
    document.getElementById('resultado').textContent = resultado;
    document.getElementById('resultado-wrap').classList.add('visible');
  } catch { document.getElementById('resultado').textContent = t.error; document.getElementById('resultado-wrap').classList.add('visible'); }
  generando = false; btn.disabled = false; btn.textContent = t.generar;
}

function copiar() {
  navigator.clipboard.writeText(document.getElementById('resultado').textContent);
  const btn = document.getElementById('btn-copiar');
  btn.textContent = t.copiado; btn.classList.add('copiado');
  setTimeout(() => { btn.textContent = t.copiar; btn.classList.remove('copiado'); }, 1500);
}

document.addEventListener('DOMContentLoaded', init);
