// carta-presentacion.js — Generador de Cartas de Presentación
import { askGroq, hasApiKey } from '../../../js/groq.js';
import { renderApiKeyPanel, renderChangeKeyButton } from '../../../js/apikey-panel.js';

const lang = localStorage.getItem('artefactos_lang') || 'es';
let tonoActivo = 'Profesional';
let generando = false;

const txt = {
  es: {
    titulo: 'Carta de Presentación',
    sub: 'Cartas personalizadas, sin clichés, listas para enviar.',
    puesto: 'Puesto objetivo', puesto_ph: 'Ej: Desarrollador Frontend Senior',
    empresa: 'Empresa', empresa_ph: 'Ej: Google, Banco Santander…',
    experiencia: 'Años de experiencia', experiencia_ph: 'Ej: 5',
    habilidades: 'Habilidades y logros clave',
    habilidades_ph: 'Ej: React, liderazgo de equipo, migración a microservicios…',
    tono: 'Tono',
    tonos: ['Profesional', 'Cercano', 'Audaz'],
    generar: 'Generar carta', generando: 'Redactando…',
    copiar: 'Copiar', copiado: '¡Copiado!', nueva: 'Nueva carta',
    badge: 'productividad', galeria: '← Galería',
    error: 'Error al generar. Intenta de nuevo.'
  },
  en: {
    titulo: 'Cover Letter',
    sub: 'Personalized letters, no clichés, ready to send.',
    puesto: 'Target position', puesto_ph: 'E.g.: Senior Frontend Developer',
    empresa: 'Company', empresa_ph: 'E.g.: Google, HSBC…',
    experiencia: 'Years of experience', experiencia_ph: 'E.g.: 5',
    habilidades: 'Key skills & achievements',
    habilidades_ph: 'E.g.: React, team leadership, microservices migration…',
    tono: 'Tone',
    tonos: ['Professional', 'Friendly', 'Bold'],
    generar: 'Generate letter', generando: 'Drafting…',
    copiar: 'Copy', copiado: 'Copied!', nueva: 'New letter',
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
      <div class="field-row">
        <div class="field-group">
          <span class="field-label">${t.puesto}</span>
          <input type="text" id="puesto" class="field-input" placeholder="${t.puesto_ph}" maxlength="120">
        </div>
        <div class="field-group">
          <span class="field-label">${t.empresa}</span>
          <input type="text" id="empresa" class="field-input" placeholder="${t.empresa_ph}" maxlength="120">
        </div>
      </div>
      <div class="field-group">
        <span class="field-label">${t.experiencia}</span>
        <input type="text" id="experiencia" class="field-input" placeholder="${t.experiencia_ph}" maxlength="20">
      </div>
      <div class="field-group">
        <span class="field-label">${t.habilidades}</span>
        <textarea id="habilidades" class="field-textarea" placeholder="${t.habilidades_ph}" maxlength="500"></textarea>
      </div>
      <div class="field-group">
        <span class="field-label">${t.tono}</span>
        <div class="pills" id="tonos">
          ${t.tonos.map((tn, i) => `<button class="pill${i === 0 ? ' active' : ''}" data-val="${txt.es.tonos[i]}">${tn}</button>`).join('')}
        </div>
      </div>
      <button id="btn-generar" class="btn-primary">${t.generar}</button>
      <div id="resultado-wrap" class="resultado-wrap">
        <div class="letter-box" id="carta-texto"></div>
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
    document.getElementById('puesto').value = '';
    document.getElementById('empresa').value = '';
    document.getElementById('experiencia').value = '';
    document.getElementById('habilidades').value = '';
    document.getElementById('resultado-wrap').classList.remove('visible');
  });
}

async function generar() {
  const puesto = document.getElementById('puesto').value.trim();
  const empresa = document.getElementById('empresa').value.trim();
  const experiencia = document.getElementById('experiencia').value.trim();
  const habilidades = document.getElementById('habilidades').value.trim();
  if (!puesto || generando) return;
  const btn = document.getElementById('btn-generar');
  generando = true; btn.disabled = true; btn.textContent = t.generando;
  const idioma = lang === 'en' ? 'English' : 'Spanish';
  try {
    const resultado = await askGroq({
      systemPrompt: `Eres un redactor experto de cartas de presentación. Escribes en ${idioma}.
Puesto objetivo: ${puesto}
Empresa: ${empresa || 'no especificada'}
Años de experiencia: ${experiencia || 'no especificados'}
Habilidades clave: ${habilidades || 'no especificadas'}
Tono: ${tonoActivo}
Genera una carta de presentación completa, persuasiva y sin clichés genéricos.
Incluye saludo, introducción, cuerpo con logros relevantes y cierre.
Solo devuelve la carta, sin explicaciones ni comentarios.`,
      userMessage: `Escribe una carta de presentación en tono ${tonoActivo} para el puesto de ${puesto}${empresa ? ' en ' + empresa : ''}.`,
      temperature: 0.7,
      maxTokens: 800
    });
    document.getElementById('carta-texto').textContent = resultado;
    document.getElementById('resultado-wrap').classList.add('visible');
  } catch {
    document.getElementById('carta-texto').textContent = t.error;
    document.getElementById('resultado-wrap').classList.add('visible');
  }
  generando = false; btn.disabled = false; btn.textContent = t.generar;
}

function copiar() {
  const texto = document.getElementById('carta-texto').textContent;
  navigator.clipboard.writeText(texto);
  const btn = document.getElementById('btn-copiar');
  btn.textContent = t.copiado; btn.classList.add('copiado');
  setTimeout(() => { btn.textContent = t.copiar; btn.classList.remove('copiado'); }, 1500);
}

document.addEventListener('DOMContentLoaded', init);
