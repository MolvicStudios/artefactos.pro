// sintetizador.js — Sintetizador de Debates
import { askGroq, hasApiKey } from '../../../js/groq.js';
import { renderApiKeyPanel, renderChangeKeyButton } from '../../../js/apikey-panel.js';

const lang = localStorage.getItem('artefactos_lang') || 'es';
let generando = false;

const txt = {
  es: {
    titulo: 'Sintetizador de Debates',
    sub: 'Extrae posiciones clave de temas controvertidos y encuentra puntos de consenso.',
    badge: 'research', galeria: '← Galería',
    tema: 'Tema controvertido',
    tema_ph: 'Ej: energía nuclear, renta básica universal, IA en educación…',
    generar: 'Sintetizar debate', generando: 'Analizando…',
    copiar: 'Copiar', copiado: '¡Copiado!', nueva: 'Nuevo tema',
    error: 'Error al generar. Intenta de nuevo.'
  },
  en: {
    titulo: 'Debate Synthesizer',
    sub: 'Extract key positions from controversial topics and find consensus points.',
    badge: 'research', galeria: '← Gallery',
    tema: 'Controversial topic',
    tema_ph: 'E.g.: nuclear energy, universal basic income, AI in education…',
    generar: 'Synthesize debate', generando: 'Analyzing…',
    copiar: 'Copy', copiado: 'Copied!', nueva: 'New topic',
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
      <h1>🧬 ${t.titulo}</h1>
      <p class="subtitulo">${t.sub}</p>
      <div class="field-group">
        <span class="field-label">${t.tema}</span>
        <input type="text" id="tema" class="field-input" placeholder="${t.tema_ph}" maxlength="200">
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
    document.getElementById('tema').value = '';
    document.getElementById('resultado-wrap').classList.remove('visible');
  });
}

async function generar() {
  const tema = document.getElementById('tema').value.trim();
  if (!tema || generando) return;
  const btn = document.getElementById('btn-generar');
  generando = true; btn.disabled = true; btn.textContent = t.generando;
  const idioma = lang === 'en' ? 'English' : 'Spanish';
  try {
    const resultado = await askGroq({
      systemPrompt: `You are a debate analyst and mediator. Write in ${idioma}.
Synthesize the major debate around the given topic:
1. POSITION A (In Favor) — main arguments (3-4 points)
2. POSITION B (Against) — main arguments (3-4 points)
3. NUANCED POSITIONS — 2-3 intermediate stances
4. CONSENSUS POINTS — what both sides generally agree on
5. KEY DISAGREEMENTS — the core irreconcilable differences
6. EVIDENCE OVERVIEW — what data/studies say

Be balanced and objective. Use clear headers and bullet points.`,
      userMessage: `Synthesize the debate about: "${tema}"`,
      temperature: 0.6,
      maxTokens: 1000
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
