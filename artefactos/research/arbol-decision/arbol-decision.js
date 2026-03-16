// arbol-decision.js — Árbol de Decisión
import { askGroq, hasApiKey } from '../../../js/groq.js';
import { renderApiKeyPanel, renderChangeKeyButton } from '../../../js/apikey-panel.js';

const lang = localStorage.getItem('artefactos_lang') || 'es';
let generando = false;

const txt = {
  es: {
    titulo: 'Árbol de Decisión',
    sub: 'Visualiza las ramificaciones de una decisión con sus consecuencias.',
    badge: 'research', galeria: '← Galería',
    dilema: 'Decisión o dilema',
    dilema_ph: 'Ej: ¿acepto la oferta de trabajo en otra ciudad o me quedo?',
    generar: 'Generar árbol', generando: 'Analizando…',
    copiar: 'Copiar', copiado: '¡Copiado!', nueva: 'Nueva decisión',
    error: 'Error al generar. Intenta de nuevo.'
  },
  en: {
    titulo: 'Decision Tree',
    sub: 'Visualize the branches of a decision with their consequences.',
    badge: 'research', galeria: '← Gallery',
    dilema: 'Decision or dilemma',
    dilema_ph: 'E.g.: should I accept the job offer in another city or stay?',
    generar: 'Generate tree', generando: 'Analyzing…',
    copiar: 'Copy', copiado: 'Copied!', nueva: 'New decision',
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
      <h1>🌳 ${t.titulo}</h1>
      <p class="subtitulo">${t.sub}</p>
      <div class="field-group">
        <span class="field-label">${t.dilema}</span>
        <textarea id="dilema" class="field-textarea" placeholder="${t.dilema_ph}" maxlength="500" style="min-height:80px;"></textarea>
      </div>
      <button id="btn-generar" class="btn-primary">${t.generar}</button>
      <div id="resultado-wrap" class="resultado-wrap">
        <div id="tree" class="result-box"></div>
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
    document.getElementById('dilema').value = '';
    document.getElementById('resultado-wrap').classList.remove('visible');
  });
}

async function generar() {
  const dilema = document.getElementById('dilema').value.trim();
  if (!dilema || generando) return;
  const btn = document.getElementById('btn-generar');
  generando = true; btn.disabled = true; btn.textContent = t.generando;
  const idioma = lang === 'en' ? 'English' : 'Spanish';
  try {
    const raw = await askGroq({
      systemPrompt: `You are a strategic decision analyst. Write in ${idioma}.
Generate a decision tree as JSON for the given dilemma.
Format:
{"question":"root decision","options":[{"label":"Option A","pros":["..."],"cons":["..."],"subnodes":[{"label":"sub-outcome","description":"..."}]}]}
Include 2-3 main options, each with 2-3 pros, 2-3 cons, and 1-2 sub-outcomes.
Only return JSON, nothing else.`,
      userMessage: `Decision tree for: "${dilema}"`,
      temperature: 0.65,
      maxTokens: 1000
    });
    const data = JSON.parse(raw.replace(/```json?\s*/g, '').replace(/```/g, '').trim());
    renderTree(data);
  } catch {
    document.getElementById('tree').textContent = t.error;
    document.getElementById('resultado-wrap').classList.add('visible');
  }
  generando = false; btn.disabled = false; btn.textContent = t.generar;
}

function renderTree(data) {
  const el = document.getElementById('tree');
  let html = `<h3 style="margin-bottom:1rem;">${data.question}</h3>`;
  (data.options || []).forEach(opt => {
    html += `<div style="border:1px solid var(--borde);border-radius:8px;padding:1rem;margin-bottom:1rem;">`;
    html += `<strong style="color:var(--acento);font-size:1rem;">${opt.label}</strong>`;
    if (opt.pros?.length) {
      html += `<div style="margin-top:0.5rem;"><span style="color:#34d399;font-size:0.8rem;">✓ PROS</span><ul style="padding-left:1.2rem;margin:0.3rem 0;">`;
      opt.pros.forEach(p => { html += `<li style="font-size:0.88rem;">${p}</li>`; });
      html += `</ul></div>`;
    }
    if (opt.cons?.length) {
      html += `<div style="margin-top:0.3rem;"><span style="color:#f87171;font-size:0.8rem;">✗ CONS</span><ul style="padding-left:1.2rem;margin:0.3rem 0;">`;
      opt.cons.forEach(c => { html += `<li style="font-size:0.88rem;">${c}</li>`; });
      html += `</ul></div>`;
    }
    if (opt.subnodes?.length) {
      html += `<div style="margin-top:0.5rem;border-top:1px solid var(--borde);padding-top:0.5rem;">`;
      opt.subnodes.forEach(s => {
        html += `<p style="font-size:0.85rem;"><strong>→ ${s.label}</strong>: <span style="color:var(--texto-sec);">${s.description}</span></p>`;
      });
      html += `</div>`;
    }
    html += `</div>`;
  });
  el.innerHTML = html;
  document.getElementById('resultado-wrap').classList.add('visible');
}

function copiar() {
  navigator.clipboard.writeText(document.getElementById('tree').textContent);
  const btn = document.getElementById('btn-copiar');
  btn.textContent = t.copiado; btn.classList.add('copiado');
  setTimeout(() => { btn.textContent = t.copiar; btn.classList.remove('copiado'); }, 1500);
}

document.addEventListener('DOMContentLoaded', init);
