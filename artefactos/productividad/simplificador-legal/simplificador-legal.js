// simplificador-legal.js — Simplificador de Texto Legal con IA
import { askGroq, hasApiKey } from '../../../js/groq.js';
import { renderApiKeyPanel, renderChangeKeyButton } from '../../../js/apikey-panel.js';

const lang = localStorage.getItem('artefactos_lang') || 'es';
let nivelActivo = 'resumen';
let generando = false;

const txt = {
  es: {
    titulo: 'Simplificador Legal',
    sub: 'Traduce contratos y documentos legales a español claro con IA.',
    texto: 'Texto legal', texto_ph: 'Pega aquí el contrato, términos o documento legal…',
    nivel: 'Nivel de detalle',
    niveles: [
      { id: 'resumen', label: 'Resumen' },
      { id: 'explicacion', label: 'Explicación' },
      { id: 'clausula', label: 'Cláusula a cláusula' }
    ],
    generar: 'Simplificar', generando: 'Simplificando…',
    copiar: 'Copiar', copiado: '¡Copiado!', nueva: 'Nuevo análisis',
    badge: 'productividad', galeria: '← Galería',
    error: 'Error al generar. Intenta de nuevo.'
  },
  en: {
    titulo: 'Legal Simplifier',
    sub: 'Translate contracts and legal documents into plain language with AI.',
    texto: 'Legal text', texto_ph: 'Paste the contract, terms or legal document here…',
    nivel: 'Detail level',
    niveles: [
      { id: 'resumen', label: 'Summary' },
      { id: 'explicacion', label: 'Explanation' },
      { id: 'clausula', label: 'Clause by clause' }
    ],
    generar: 'Simplify', generando: 'Simplifying…',
    copiar: 'Copy', copiado: 'Copied!', nueva: 'New analysis',
    badge: 'productivity', galeria: '← Gallery',
    error: 'Error generating. Try again.'
  }
};
const t = txt[lang] || txt.es;

const instrucciones = {
  resumen: lang === 'en'
    ? 'Provide a brief summary of the key points in this legal document. Use bullet points for each key obligation, right, deadline, and cost. Keep it concise (max 8 bullet points). Flag any unusual or potentially harmful clauses with ⚠️ at the start of the bullet.'
    : 'Proporciona un resumen breve de los puntos clave de este documento legal. Usa viñetas para cada obligación, derecho, plazo y coste clave. Sé conciso (máximo 8 viñetas). Señala cláusulas inusuales o potencialmente perjudiciales con ⚠️ al inicio de la viñeta.',
  explicacion: lang === 'en'
    ? 'Rewrite this legal document in plain, everyday language that anyone can understand. Organize the explanation in clear sections with headings (use ## for headings). Highlight important terms in **bold**. After the explanation, add a section called "## ⚠️ Watch Out" listing any clauses that are unusual, one-sided, or potentially harmful, each inside a line starting with [ALERTA_ADVERTENCIA] or [ALERTA_PELIGRO] depending on severity.'
    : 'Reescribe este documento legal en lenguaje cotidiano que cualquiera pueda entender. Organiza la explicación en secciones claras con encabezados (usa ## para encabezados). Resalta términos importantes en **negrita**. Después de la explicación, añade una sección llamada "## ⚠️ Ojo con esto" listando cláusulas inusuales, abusivas o potencialmente perjudiciales, cada una en una línea que empiece con [ALERTA_ADVERTENCIA] o [ALERTA_PELIGRO] según la gravedad.',
  clausula: lang === 'en'
    ? 'Break down this legal document clause by clause. For each clause: 1) Quote the original briefly, 2) Explain in plain language what it means. Use ## for each clause heading. If a clause is unusual or potentially harmful, start its explanation with [ALERTA_ADVERTENCIA] (moderate concern) or [ALERTA_PELIGRO] (serious concern). End with a "## Summary" with the 3 most important takeaways.'
    : 'Desglosa este documento legal cláusula por cláusula. Para cada cláusula: 1) Cita brevemente el original, 2) Explica en lenguaje llano qué significa. Usa ## para el encabezado de cada cláusula. Si una cláusula es inusual o potencialmente perjudicial, empieza su explicación con [ALERTA_ADVERTENCIA] (preocupación moderada) o [ALERTA_PELIGRO] (preocupación seria). Termina con un "## Resumen" con las 3 conclusiones más importantes.'
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
        <span class="field-label">${t.texto}</span>
        <textarea id="texto-entrada" class="field-textarea" placeholder="${t.texto_ph}" maxlength="15000"></textarea>
      </div>
      <div class="field-group">
        <span class="field-label">${t.nivel}</span>
        <div class="pills" id="niveles">
          ${t.niveles.map((n, i) => `<button class="pill${i === 0 ? ' active' : ''}" data-val="${n.id}">${n.label}</button>`).join('')}
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
  document.getElementById('niveles').addEventListener('click', e => {
    const pill = e.target.closest('.pill'); if (!pill) return;
    document.querySelectorAll('#niveles .pill').forEach(p => p.classList.remove('active'));
    pill.classList.add('active'); nivelActivo = pill.dataset.val;
  });
  document.getElementById('btn-generar').addEventListener('click', generar);
  document.getElementById('btn-copiar').addEventListener('click', copiar);
  document.getElementById('btn-nueva').addEventListener('click', () => {
    document.getElementById('texto-entrada').value = '';
    document.getElementById('resultado-wrap').classList.remove('visible');
  });
}

function formatearResultado(texto) {
  let html = texto
    .replace(/\[ALERTA_PELIGRO\]\s*/g, '%%PELIGRO%%')
    .replace(/\[ALERTA_ADVERTENCIA\]\s*/g, '%%ADVERTENCIA%%');

  html = html
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/^[-•]\s+(.+)$/gm, '<li>$1</li>')
    .replace(/(<li>.*<\/li>\n?)+/g, match => `<ul>${match}</ul>`)
    .replace(/\n{2,}/g, '</p><p>')
    .replace(/\n/g, '<br>');

  html = html.replace(/%%PELIGRO%%(.+?)(?=<h2>|<\/p>|%%|$)/gs, (_, content) =>
    `<div class="alerta-clausula peligro">${content.trim()}</div>`
  );
  html = html.replace(/%%ADVERTENCIA%%(.+?)(?=<h2>|<\/p>|%%|$)/gs, (_, content) =>
    `<div class="alerta-clausula advertencia">${content.trim()}</div>`
  );

  if (!html.startsWith('<')) html = '<p>' + html;
  if (!html.endsWith('>')) html += '</p>';

  return html;
}

async function generar() {
  const texto = document.getElementById('texto-entrada').value.trim();
  if (!texto || generando) return;
  const btn = document.getElementById('btn-generar');
  generando = true; btn.disabled = true; btn.textContent = t.generando;
  const idioma = lang === 'en' ? 'English' : 'Spanish';
  try {
    const resultado = await askGroq({
      systemPrompt: `Eres un abogado experto en simplificar documentos legales para personas sin formación jurídica. Responde siempre en ${idioma}.\n${instrucciones[nivelActivo]}`,
      userMessage: texto,
      temperature: 0.3,
      maxTokens: 2000
    });
    document.getElementById('resultado-texto').innerHTML = formatearResultado(resultado);
    document.getElementById('resultado-wrap').classList.add('visible');
  } catch {
    document.getElementById('resultado-texto').textContent = t.error;
    document.getElementById('resultado-wrap').classList.add('visible');
  }
  generando = false; btn.disabled = false; btn.textContent = t.generar;
}

function copiar() {
  const texto = document.getElementById('resultado-texto').innerText;
  navigator.clipboard.writeText(texto);
  const btn = document.getElementById('btn-copiar');
  btn.textContent = t.copiado; btn.classList.add('copiado');
  setTimeout(() => { btn.textContent = t.copiar; btn.classList.remove('copiado'); }, 1500);
}

document.addEventListener('DOMContentLoaded', init);
