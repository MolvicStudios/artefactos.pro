// redactor-emails.js — Redactor de Emails profesionales
import { askGroq, hasApiKey } from '../../../js/groq.js';
import { renderApiKeyPanel, renderChangeKeyButton } from '../../../js/apikey-panel.js';

const lang = localStorage.getItem('artefactos_lang') || 'es';
let tonoActivo = 'Formal';
let generando = false;

const txt = {
  es: {
    titulo: 'Redactor de Emails',
    sub: 'Emails profesionales en segundos. Elige tono, contexto y destinatario.',
    destinatario: 'Destinatario', dest_ph: 'Ej: jefe, cliente, RRHH, proveedor…',
    contexto: 'Contexto / qué quieres decir', ctx_ph: 'Ej: pedir una reunión para revisar el presupuesto del Q2',
    tono: 'Tono',
    tonos: ['Formal', 'Cercano', 'Persuasivo', 'Directo', 'Cordial'],
    generar: 'Generar email', generando: 'Redactando…',
    copiar: 'Copiar', copiado: '¡Copiado!', nueva: 'Nuevo email',
    badge: 'productividad', galeria: '← Galería',
    error: 'Error al generar. Intenta de nuevo.'
  },
  en: {
    titulo: 'Email Writer',
    sub: 'Professional emails in seconds. Choose tone, context and recipient.',
    destinatario: 'Recipient', dest_ph: 'E.g.: boss, client, HR, vendor…',
    contexto: 'Context / what you want to say', ctx_ph: 'E.g.: request a meeting to review the Q2 budget',
    tono: 'Tone',
    tonos: ['Formal', 'Friendly', 'Persuasive', 'Direct', 'Cordial'],
    generar: 'Generate email', generando: 'Drafting…',
    copiar: 'Copy', copiado: 'Copied!', nueva: 'New email',
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
        <span class="field-label">${t.destinatario}</span>
        <input type="text" id="destinatario" class="field-input" placeholder="${t.dest_ph}" maxlength="120">
      </div>
      <div class="field-group">
        <span class="field-label">${t.contexto}</span>
        <textarea id="contexto" class="field-textarea" placeholder="${t.ctx_ph}" maxlength="500"></textarea>
      </div>
      <div class="field-group">
        <span class="field-label">${t.tono}</span>
        <div class="pills" id="tonos">
          ${t.tonos.map((tn, i) => `<button class="pill${i === 0 ? ' active' : ''}" data-val="${txt.es.tonos[i]}">${tn}</button>`).join('')}
        </div>
      </div>
      <button id="btn-generar" class="btn-primary">${t.generar}</button>
      <div id="resultado-wrap" class="resultado-wrap">
        <div class="email-box" id="email-texto"></div>
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
    document.getElementById('destinatario').value = '';
    document.getElementById('contexto').value = '';
    document.getElementById('resultado-wrap').classList.remove('visible');
  });
}

async function generar() {
  const dest = document.getElementById('destinatario').value.trim();
  const ctx = document.getElementById('contexto').value.trim();
  if (!ctx || generando) return;
  const btn = document.getElementById('btn-generar');
  generando = true; btn.disabled = true; btn.textContent = t.generando;
  const idioma = lang === 'en' ? 'English' : 'Spanish';
  try {
    const resultado = await askGroq({
      systemPrompt: `Eres un redactor de emails profesional. Escribes en ${idioma}.
Contexto del email: ${ctx}
Destinatario: ${dest || 'general'}
Tono: ${tonoActivo}
Genera un email completo con Asunto, Saludo, Cuerpo y Despedida.
Solo devuelve el email, sin explicaciones ni comentarios.`,
      userMessage: `Escribe el email en tono ${tonoActivo} para ${dest || 'el destinatario'}. Contexto: ${ctx}`,
      temperature: 0.7,
      maxTokens: 600
    });
    document.getElementById('email-texto').textContent = resultado;
    document.getElementById('resultado-wrap').classList.add('visible');
  } catch { document.getElementById('email-texto').textContent = t.error; document.getElementById('resultado-wrap').classList.add('visible'); }
  generando = false; btn.disabled = false; btn.textContent = t.generar;
}

function copiar() {
  const texto = document.getElementById('email-texto').textContent;
  navigator.clipboard.writeText(texto);
  const btn = document.getElementById('btn-copiar');
  btn.textContent = t.copiado; btn.classList.add('copiado');
  setTimeout(() => { btn.textContent = t.copiar; btn.classList.remove('copiado'); }, 1500);
}

document.addEventListener('DOMContentLoaded', init);
