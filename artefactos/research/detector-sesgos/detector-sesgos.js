// detector-sesgos.js — Detector de Sesgos Cognitivos
import { askGroq, hasApiKey } from '../../../js/groq.js';
import { renderApiKeyPanel, renderChangeKeyButton } from '../../../js/apikey-panel.js';

const lang = localStorage.getItem('artefactos_lang') || 'es';
let generando = false;

const txt = {
  es: {
    titulo: 'Detector de Sesgos',
    sub: 'Identifica sesgos cognitivos en textos y argumentos.',
    badge: 'research', galeria: '← Galería',
    texto: 'Texto o argumento a analizar',
    texto_ph: 'Pega aquí el texto, argumento o afirmación que quieras analizar…',
    generar: 'Detectar sesgos', generando: 'Analizando…',
    copiar: 'Copiar', copiado: '¡Copiado!', nueva: 'Nuevo análisis',
    error: 'Error al generar. Intenta de nuevo.'
  },
  en: {
    titulo: 'Bias Detector',
    sub: 'Identify cognitive biases in text and arguments.',
    badge: 'research', galeria: '← Gallery',
    texto: 'Text or argument to analyze',
    texto_ph: 'Paste the text, argument or claim you want to analyze here…',
    generar: 'Detect biases', generando: 'Analyzing…',
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
      <h1>🔬 ${t.titulo}</h1>
      <p class="subtitulo">${t.sub}</p>
      <div class="field-group">
        <span class="field-label">${t.texto}</span>
        <textarea id="texto" class="field-textarea" placeholder="${t.texto_ph}" maxlength="2000" style="min-height:120px;"></textarea>
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
    document.getElementById('texto').value = '';
    document.getElementById('resultado-wrap').classList.remove('visible');
  });
}

async function generar() {
  const texto = document.getElementById('texto').value.trim();
  if (!texto || generando) return;
  const btn = document.getElementById('btn-generar');
  generando = true; btn.disabled = true; btn.textContent = t.generando;
  const idioma = lang === 'en' ? 'English' : 'Spanish';
  try {
    const resultado = await askGroq({
      systemPrompt: `You are a cognitive bias expert and critical thinking analyst. Write in ${idioma}.
Analyze the given text for cognitive biases. For each bias found:
1. Name the bias
2. Quote the specific part of the text that exhibits it
3. Explain why it's a bias and how it distorts reasoning
4. Suggest a more objective alternative

End with a summary of the overall bias level (low/medium/high) and a recommendation.
If no biases are found, explain why the text appears balanced.`,
      userMessage: `Analyze this text for cognitive biases:\n\n"${texto}"`,
      temperature: 0.5,
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
