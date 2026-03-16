// contraargumentador.js — Contraargumentador (Devil's Advocate)
import { askGroq, hasApiKey } from '../../../js/groq.js';
import { renderApiKeyPanel, renderChangeKeyButton } from '../../../js/apikey-panel.js';

const lang = localStorage.getItem('artefactos_lang') || 'es';
let generando = false;

const txt = {
  es: {
    titulo: 'Contraargumentador',
    sub: 'Introduce una tesis y obtén contraargumentos estructurados.',
    badge: 'research', galeria: '← Galería',
    tesis: 'Tu tesis o argumento',
    tesis_ph: 'Ej: el teletrabajo es más productivo que el trabajo presencial…',
    intensidad: 'Intensidad',
    intensidades: ['Suave', 'Moderada', 'Agresiva'],
    generar: 'Contraargumentar', generando: 'Pensando…',
    copiar: 'Copiar', copiado: '¡Copiado!', nueva: 'Nuevo argumento',
    error: 'Error al generar. Intenta de nuevo.'
  },
  en: {
    titulo: 'Counterarguer',
    sub: 'Enter a thesis and get structured counterarguments.',
    badge: 'research', galeria: '← Gallery',
    tesis: 'Your thesis or argument',
    tesis_ph: 'E.g.: remote work is more productive than office work…',
    intensidad: 'Intensity',
    intensidades: ['Soft', 'Moderate', 'Aggressive'],
    generar: 'Counter-argue', generando: 'Thinking…',
    copiar: 'Copy', copiado: 'Copied!', nueva: 'New argument',
    error: 'Error generating. Try again.'
  }
};
const t = txt[lang] || txt.es;
const intensidades_es = ['Suave', 'Moderada', 'Agresiva'];
let intensidadActiva = 'Moderada';

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
      <h1>🗣️ ${t.titulo}</h1>
      <p class="subtitulo">${t.sub}</p>
      <div class="field-group">
        <span class="field-label">${t.tesis}</span>
        <textarea id="tesis" class="field-textarea" placeholder="${t.tesis_ph}" maxlength="1000" style="min-height:100px;"></textarea>
      </div>
      <div class="field-group">
        <span class="field-label">${t.intensidad}</span>
        <div class="pills" id="intensidades">
          ${t.intensidades.map((v, i) => `<button class="pill${i === 1 ? ' active' : ''}" data-val="${intensidades_es[i]}">${v}</button>`).join('')}
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
  document.getElementById('intensidades').addEventListener('click', e => {
    const pill = e.target.closest('.pill'); if (!pill) return;
    document.querySelectorAll('#intensidades .pill').forEach(p => p.classList.remove('active'));
    pill.classList.add('active'); intensidadActiva = pill.dataset.val;
  });
  document.getElementById('btn-generar').addEventListener('click', generar);
  document.getElementById('btn-copiar').addEventListener('click', copiar);
  document.getElementById('btn-nueva').addEventListener('click', () => {
    document.getElementById('tesis').value = '';
    document.getElementById('resultado-wrap').classList.remove('visible');
  });
}

async function generar() {
  const tesis = document.getElementById('tesis').value.trim();
  if (!tesis || generando) return;
  const btn = document.getElementById('btn-generar');
  generando = true; btn.disabled = true; btn.textContent = t.generando;
  const idioma = lang === 'en' ? 'English' : 'Spanish';
  try {
    const resultado = await askGroq({
      systemPrompt: `You are a master debater and devil's advocate. Write in ${idioma}.
Intensity level: ${intensidadActiva}
Generate structured counterarguments to the given thesis:
1. MAIN COUNTERARGUMENT — the strongest rebuttal
2. WEAK POINTS — identify 3 logical weaknesses in the thesis
3. EVIDENCE AGAINST — cite types of data/studies that contradict it
4. ALTERNATIVE PERSPECTIVE — present the opposite viewpoint convincingly
5. CONCESSION — acknowledge what's valid in the original thesis

Be intellectually rigorous. Use clear headers and bullet points.`,
      userMessage: `Counter-argue this thesis: "${tesis}"`,
      temperature: 0.7,
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
