// mejorador-prompts.js — Mejorador de Prompts con IA
import { askGroq, hasApiKey } from '../../../js/groq.js';
import { renderApiKeyPanel, renderChangeKeyButton } from '../../../js/apikey-panel.js';

const lang = localStorage.getItem('artefactos_lang') || 'es';
let modeloActivo = 'general';
let generando = false;

const txt = {
  es: {
    titulo: 'Mejorador de Prompts',
    sub: 'Tu prompt, pero 10 veces más preciso. Pégalo y deja que la IA lo transforme.',
    prompt: 'Tu prompt original', prompt_ph: 'Pega aquí el prompt que quieres mejorar…',
    modelo: 'Modelo objetivo',
    modelos: [
      { id: 'general', label: 'General' },
      { id: 'gpt', label: 'GPT' },
      { id: 'claude', label: 'Claude' },
      { id: 'llama', label: 'Llama' }
    ],
    generar: 'Mejorar prompt', generando: 'Mejorando…',
    original: 'Original', mejorado: 'Mejorado',
    analisis: 'Qué se mejoró',
    copiar: 'Copiar mejorado', copiado: '¡Copiado!', nueva: 'Nuevo prompt',
    badge: 'productividad', galeria: '← Galería',
    error: 'Error al generar. Intenta de nuevo.'
  },
  en: {
    titulo: 'Prompt Improver',
    sub: 'Your prompt, but 10x more precise. Paste it and let AI transform it.',
    prompt: 'Your original prompt', prompt_ph: 'Paste the prompt you want to improve here…',
    modelo: 'Target model',
    modelos: [
      { id: 'general', label: 'General' },
      { id: 'gpt', label: 'GPT' },
      { id: 'claude', label: 'Claude' },
      { id: 'llama', label: 'Llama' }
    ],
    generar: 'Improve prompt', generando: 'Improving…',
    original: 'Original', mejorado: 'Improved',
    analisis: 'What was improved',
    copiar: 'Copy improved', copiado: 'Copied!', nueva: 'New prompt',
    badge: 'productivity', galeria: '← Gallery',
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
      <h1>${t.titulo}</h1>
      <p class="subtitulo">${t.sub}</p>
      <div class="field-group">
        <span class="field-label">${t.prompt}</span>
        <textarea id="prompt-entrada" class="field-textarea" placeholder="${t.prompt_ph}" maxlength="6000"></textarea>
      </div>
      <div class="field-group">
        <span class="field-label">${t.modelo}</span>
        <div class="pills" id="modelos">
          ${t.modelos.map((m, i) => `<button class="pill${i === 0 ? ' active' : ''}" data-val="${m.id}">${m.label}</button>`).join('')}
        </div>
      </div>
      <button id="btn-generar" class="btn-primary">${t.generar}</button>
      <div id="resultado-wrap" class="resultado-wrap">
        <div class="comparison">
          <div class="comparison-col">
            <span class="comparison-label">${t.original}</span>
            <div class="comparison-box" id="original-texto"></div>
          </div>
          <div class="comparison-col">
            <span class="comparison-label improved">${t.mejorado}</span>
            <div class="comparison-box improved" id="mejorado-texto"></div>
          </div>
        </div>
        <div class="analysis-box">
          <div class="analysis-title">${t.analisis}</div>
          <div id="analisis-texto"></div>
        </div>
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
  document.getElementById('modelos').addEventListener('click', e => {
    const pill = e.target.closest('.pill'); if (!pill) return;
    document.querySelectorAll('#modelos .pill').forEach(p => p.classList.remove('active'));
    pill.classList.add('active'); modeloActivo = pill.dataset.val;
  });
  document.getElementById('btn-generar').addEventListener('click', generar);
  document.getElementById('btn-copiar').addEventListener('click', copiar);
  document.getElementById('btn-nueva').addEventListener('click', () => {
    document.getElementById('prompt-entrada').value = '';
    document.getElementById('resultado-wrap').classList.remove('visible');
  });
}

async function generar() {
  const prompt = document.getElementById('prompt-entrada').value.trim();
  if (!prompt || generando) return;
  const btn = document.getElementById('btn-generar');
  generando = true; btn.disabled = true; btn.textContent = t.generando;
  const idioma = lang === 'en' ? 'English' : 'Spanish';
  const modelHint = {
    general: lang === 'en' ? 'any LLM' : 'cualquier LLM',
    gpt: 'OpenAI GPT',
    claude: 'Anthropic Claude',
    llama: 'Meta Llama'
  }[modeloActivo];
  try {
    const resultado = await askGroq({
      systemPrompt: `You are a world-class prompt engineer. The user will give you a prompt they wrote. Your job:
1. Rewrite the prompt to be 10x more precise, clear, and effective, optimized for ${modelHint}.
2. After the improved prompt, add a brief analysis of what you changed and why.

Respond in ${idioma}. Use this EXACT format:

===IMPROVED===
(the improved prompt here)
===ANALYSIS===
(brief bullet-point analysis of changes)`,
      userMessage: prompt,
      temperature: 0.5,
      maxTokens: 1500
    });
    const parts = parseResult(resultado);
    document.getElementById('original-texto').textContent = prompt;
    document.getElementById('mejorado-texto').textContent = parts.improved;
    document.getElementById('analisis-texto').textContent = parts.analysis;
    document.getElementById('resultado-wrap').classList.add('visible');
  } catch {
    document.getElementById('original-texto').textContent = prompt;
    document.getElementById('mejorado-texto').textContent = t.error;
    document.getElementById('analisis-texto').textContent = '';
    document.getElementById('resultado-wrap').classList.add('visible');
  }
  generando = false; btn.disabled = false; btn.textContent = t.generar;
}

function parseResult(text) {
  const improvedMatch = text.split('===IMPROVED===')[1];
  if (!improvedMatch) return { improved: text.trim(), analysis: '' };
  const parts = improvedMatch.split('===ANALYSIS===');
  return {
    improved: (parts[0] || '').trim(),
    analysis: (parts[1] || '').trim()
  };
}

function copiar() {
  const texto = document.getElementById('mejorado-texto').textContent;
  navigator.clipboard.writeText(texto);
  const btn = document.getElementById('btn-copiar');
  btn.textContent = t.copiado; btn.classList.add('copiado');
  setTimeout(() => { btn.textContent = t.copiar; btn.classList.remove('copiado'); }, 1500);
}

document.addEventListener('DOMContentLoaded', init);
