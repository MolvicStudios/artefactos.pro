// asistente-reuniones.js — Asistente de Reuniones con IA
import { askGroq, hasApiKey } from '../../../js/groq.js';
import { renderApiKeyPanel, renderChangeKeyButton } from '../../../js/apikey-panel.js';

const lang = localStorage.getItem('artefactos_lang') || 'es';
let formatoActivo = 'acta';
let generando = false;

const txt = {
  es: {
    titulo: 'Asistente de Reuniones',
    sub: 'Actas, resúmenes y próximos pasos al instante con IA.',
    titulo_reunion: 'Título de la reunión (opcional)',
    titulo_ph: 'Ej: Reunión de sprint #12',
    notas: 'Notas o transcripción',
    notas_ph: 'Pega aquí las notas o la transcripción de la reunión…',
    formato: 'Formato de salida',
    formatos: [
      { id: 'acta', label: 'Acta' },
      { id: 'resumen', label: 'Resumen Ejecutivo' },
      { id: 'pasos', label: 'Próximos Pasos' }
    ],
    generar: 'Generar', generando: 'Generando…',
    copiar: 'Copiar', copiado: '¡Copiado!', nueva: 'Nueva consulta',
    badge: 'productividad', galeria: '← Galería',
    error: 'Error al generar. Intenta de nuevo.'
  },
  en: {
    titulo: 'Meeting Assistant',
    sub: 'Minutes, summaries and next steps instantly with AI.',
    titulo_reunion: 'Meeting title (optional)',
    titulo_ph: 'E.g.: Sprint #12 meeting',
    notas: 'Notes or transcript',
    notas_ph: 'Paste the meeting notes or transcript here…',
    formato: 'Output format',
    formatos: [
      { id: 'acta', label: 'Minutes' },
      { id: 'resumen', label: 'Executive Summary' },
      { id: 'pasos', label: 'Next Steps' }
    ],
    generar: 'Generate', generando: 'Generating…',
    copiar: 'Copy', copiado: 'Copied!', nueva: 'New query',
    badge: 'productivity', galeria: '← Gallery',
    error: 'Error generating. Try again.'
  }
};
const t = txt[lang] || txt.es;

const prompts = {
  acta: lang === 'en'
    ? 'You are an expert meeting secretary. Generate formal meeting minutes from the provided notes. Structure the output with clear sections: Date/Title, Attendees (if mentioned), Agenda, Discussion Points, Agreements/Decisions, and Action Items. Use a professional and precise tone.'
    : 'Eres un secretario de reuniones experto. Genera un acta formal a partir de las notas proporcionadas. Estructura la salida con secciones claras: Fecha/Título, Asistentes (si se mencionan), Orden del día, Puntos tratados, Acuerdos/Decisiones y Tareas asignadas. Usa un tono profesional y preciso.',
  resumen: lang === 'en'
    ? 'You are an expert at synthesizing meetings. Generate a concise executive summary from the provided notes. Include: main objective, key decisions, critical points and general conclusion. Maximum 2 short paragraphs.'
    : 'Eres un experto en sintetizar reuniones. Genera un resumen ejecutivo conciso a partir de las notas proporcionadas. Incluye: objetivo principal, decisiones clave, puntos críticos y conclusión general. Máximo 2 párrafos cortos.',
  pasos: lang === 'en'
    ? 'You are a project management expert. From the provided meeting notes, extract ONLY the next steps and action items. For each item include: responsible person (if mentioned), task description and deadline (if mentioned). Use a numbered list. Do not include summaries or context, only actionable items.'
    : 'Eres un experto en gestión de proyectos. A partir de las notas de reunión proporcionadas, extrae SOLO los próximos pasos y tareas pendientes. Para cada elemento incluye: responsable (si se menciona), descripción de la tarea y plazo (si se menciona). Usa una lista numerada. No incluyas resúmenes ni contexto, solo elementos accionables.'
};

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
        <span class="field-label">${t.titulo_reunion}</span>
        <input id="titulo-entrada" class="field-input" type="text" placeholder="${t.titulo_ph}" maxlength="120">
      </div>
      <div class="field-group">
        <span class="field-label">${t.notas}</span>
        <textarea id="notas-entrada" class="field-textarea" placeholder="${t.notas_ph}" maxlength="12000"></textarea>
      </div>
      <div class="field-group">
        <span class="field-label">${t.formato}</span>
        <div class="pills" id="formatos">
          ${t.formatos.map((f, i) => `<button class="pill${i === 0 ? ' active' : ''}" data-val="${f.id}">${f.label}</button>`).join('')}
        </div>
      </div>
      <button id="btn-generar" class="btn-primary">${t.generar}</button>
      <div id="resultado-wrap" class="resultado-wrap">
        <div class="resultado-box" id="resultado-texto"></div>
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
  document.getElementById('formatos').addEventListener('click', e => {
    const pill = e.target.closest('.pill'); if (!pill) return;
    document.querySelectorAll('#formatos .pill').forEach(p => p.classList.remove('active'));
    pill.classList.add('active'); formatoActivo = pill.dataset.val;
  });
  document.getElementById('btn-generar').addEventListener('click', generar);
  document.getElementById('btn-copiar').addEventListener('click', copiar);
  document.getElementById('btn-nueva').addEventListener('click', () => {
    document.getElementById('titulo-entrada').value = '';
    document.getElementById('notas-entrada').value = '';
    document.getElementById('resultado-wrap').classList.remove('visible');
  });
}

async function generar() {
  const notas = document.getElementById('notas-entrada').value.trim();
  if (!notas || generando) return;
  const titulo = document.getElementById('titulo-entrada').value.trim();
  const btn = document.getElementById('btn-generar');
  generando = true; btn.disabled = true; btn.textContent = t.generando;
  const idioma = lang === 'en' ? 'English' : 'Spanish';
  const contextoTitulo = titulo
    ? (lang === 'en' ? `Meeting title: ${titulo}\n\n` : `Título de la reunión: ${titulo}\n\n`)
    : '';
  try {
    const resultado = await askGroq({
      systemPrompt: `${prompts[formatoActivo]}\nResponde siempre en ${idioma}. Devuelve solo el resultado, sin explicaciones adicionales.`,
      userMessage: `${contextoTitulo}${notas}`,
      temperature: 0.3,
      maxTokens: 1200
    });
    document.getElementById('resultado-texto').textContent = resultado;
    document.getElementById('resultado-wrap').classList.add('visible');
  } catch {
    document.getElementById('resultado-texto').textContent = t.error;
    document.getElementById('resultado-wrap').classList.add('visible');
  }
  generando = false; btn.disabled = false; btn.textContent = t.generar;
}

function copiar() {
  const texto = document.getElementById('resultado-texto').textContent;
  navigator.clipboard.writeText(texto);
  const btn = document.getElementById('btn-copiar');
  btn.textContent = t.copiado; btn.classList.add('copiado');
  setTimeout(() => { btn.textContent = t.copiar; btn.classList.remove('copiado'); }, 1500);
}

document.addEventListener('DOMContentLoaded', init);
