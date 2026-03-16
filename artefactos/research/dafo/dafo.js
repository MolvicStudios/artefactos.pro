// dafo.js — Análisis DAFO (SWOT)
import { askGroq, hasApiKey } from '../../../js/groq.js';
import { renderApiKeyPanel, renderChangeKeyButton } from '../../../js/apikey-panel.js';

const lang = localStorage.getItem('artefactos_lang') || 'es';
let generando = false;

const txt = {
  es: {
    titulo: 'Análisis DAFO',
    sub: 'Genera una matriz DAFO completa para tu proyecto, idea o decisión.',
    badge: 'research', galeria: '← Galería',
    proyecto: 'Proyecto / idea / decisión',
    proyecto_ph: 'Ej: abrir una cafetería specialty en mi barrio',
    contexto: 'Contexto adicional (opcional)',
    contexto_ph: 'Ej: presupuesto limitado, zona con mucha competencia…',
    generar: 'Generar DAFO', generando: 'Analizando…',
    copiar: 'Copiar', copiado: '¡Copiado!', nueva: 'Nuevo análisis',
    error: 'Error al generar. Intenta de nuevo.'
  },
  en: {
    titulo: 'SWOT Analysis',
    sub: 'Generate a complete SWOT matrix for your project, idea or decision.',
    badge: 'research', galeria: '← Gallery',
    proyecto: 'Project / idea / decision',
    proyecto_ph: 'E.g.: open a specialty coffee shop in my neighborhood',
    contexto: 'Additional context (optional)',
    contexto_ph: 'E.g.: limited budget, high-competition area…',
    generar: 'Generate SWOT', generando: 'Analyzing…',
    copiar: 'Copy', copiado: 'Copied!', nueva: 'New analysis',
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
      <h1>📊 ${t.titulo}</h1>
      <p class="subtitulo">${t.sub}</p>
      <div class="field-group">
        <span class="field-label">${t.proyecto}</span>
        <input type="text" id="proyecto" class="field-input" placeholder="${t.proyecto_ph}" maxlength="200">
      </div>
      <div class="field-group">
        <span class="field-label">${t.contexto}</span>
        <textarea id="contexto" class="field-textarea" placeholder="${t.contexto_ph}" maxlength="500"></textarea>
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
    document.getElementById('proyecto').value = '';
    document.getElementById('contexto').value = '';
    document.getElementById('resultado-wrap').classList.remove('visible');
  });
}

async function generar() {
  const proyecto = document.getElementById('proyecto').value.trim();
  if (!proyecto || generando) return;
  const ctx = document.getElementById('contexto').value.trim();
  const btn = document.getElementById('btn-generar');
  generando = true; btn.disabled = true; btn.textContent = t.generando;
  const idioma = lang === 'en' ? 'English' : 'Spanish';
  const swot = lang === 'en'
    ? 'Strengths, Weaknesses, Opportunities, Threats'
    : 'Debilidades, Amenazas, Fortalezas, Oportunidades';
  try {
    const resultado = await askGroq({
      systemPrompt: `You are a strategic analyst. Write in ${idioma}.
Generate a complete SWOT/DAFO analysis with these 4 sections: ${swot}.
Each section should have 4-6 bullet points.
End with a brief strategic recommendation.
Use clear headers and bullet points. No markdown code blocks.`,
      userMessage: `SWOT analysis for: "${proyecto}"${ctx ? `\nContext: ${ctx}` : ''}`,
      temperature: 0.6,
      maxTokens: 900
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
