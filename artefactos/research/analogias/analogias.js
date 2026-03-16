// analogias.js — Buscador de Analogías
import { askGroq, hasApiKey } from '../../../js/groq.js';
import { renderApiKeyPanel, renderChangeKeyButton } from '../../../js/apikey-panel.js';

const lang = localStorage.getItem('artefactos_lang') || 'es';
let generando = false;

const txt = {
  es: {
    titulo: 'Buscador de Analogías',
    sub: 'Encuentra analogías de múltiples dominios para explicar conceptos complejos.',
    badge: 'research', galeria: '← Galería',
    concepto: 'Concepto a explicar',
    concepto_ph: 'Ej: blockchain, inflación, recursividad, fotosíntesis…',
    audiencia: 'Audiencia',
    audiencias: ['General', 'Niños', 'Técnica', 'Académica'],
    generar: 'Buscar analogías', generando: 'Buscando…',
    copiar: 'Copiar', copiado: '¡Copiado!', nueva: 'Nuevo concepto',
    error: 'Error al generar. Intenta de nuevo.'
  },
  en: {
    titulo: 'Analogy Finder',
    sub: 'Find analogies from multiple domains to explain complex concepts.',
    badge: 'research', galeria: '← Gallery',
    concepto: 'Concept to explain',
    concepto_ph: 'E.g.: blockchain, inflation, recursion, photosynthesis…',
    audiencia: 'Audience',
    audiencias: ['General', 'Children', 'Technical', 'Academic'],
    generar: 'Find analogies', generando: 'Searching…',
    copiar: 'Copy', copiado: 'Copied!', nueva: 'New concept',
    error: 'Error generating. Try again.'
  }
};
const t = txt[lang] || txt.es;
const audiencias_es = ['General', 'Niños', 'Técnica', 'Académica'];
let audienciaActiva = 'General';

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
      <h1>🔗 ${t.titulo}</h1>
      <p class="subtitulo">${t.sub}</p>
      <div class="field-group">
        <span class="field-label">${t.concepto}</span>
        <input type="text" id="concepto" class="field-input" placeholder="${t.concepto_ph}" maxlength="150">
      </div>
      <div class="field-group">
        <span class="field-label">${t.audiencia}</span>
        <div class="pills" id="audiencias">
          ${t.audiencias.map((a, i) => `<button class="pill${i === 0 ? ' active' : ''}" data-val="${audiencias_es[i]}">${a}</button>`).join('')}
        </div>
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
  document.getElementById('audiencias').addEventListener('click', e => {
    const pill = e.target.closest('.pill'); if (!pill) return;
    document.querySelectorAll('#audiencias .pill').forEach(p => p.classList.remove('active'));
    pill.classList.add('active'); audienciaActiva = pill.dataset.val;
  });
  document.getElementById('btn-generar').addEventListener('click', generar);
  document.getElementById('btn-copiar').addEventListener('click', copiar);
  document.getElementById('btn-nueva').addEventListener('click', () => {
    document.getElementById('concepto').value = '';
    document.getElementById('resultado-wrap').classList.remove('visible');
  });
}

async function generar() {
  const concepto = document.getElementById('concepto').value.trim();
  if (!concepto || generando) return;
  const btn = document.getElementById('btn-generar');
  generando = true; btn.disabled = true; btn.textContent = t.generando;
  const idioma = lang === 'en' ? 'English' : 'Spanish';
  try {
    const resultado = await askGroq({
      systemPrompt: `You are a master communicator and educator. Write in ${idioma}.
Audience: ${audienciaActiva}
Generate 5 analogies from DIFFERENT domains to explain the given concept:
1. EVERYDAY LIFE analogy
2. NATURE analogy
3. TECHNOLOGY analogy
4. SPORTS/GAMES analogy
5. HUMAN BODY analogy

For each:
- State the analogy clearly
- Explain how it maps to the concept
- Rate accuracy (★ to ★★★★★)

End with which analogy works best for this audience and why.`,
      userMessage: `Find analogies for: "${concepto}"`,
      temperature: 0.8,
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
