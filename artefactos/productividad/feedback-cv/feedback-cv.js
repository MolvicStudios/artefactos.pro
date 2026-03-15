// feedback-cv.js — Feedback de CV con IA
import { askGroq, hasApiKey } from '../../../js/groq.js';
import { renderApiKeyPanel, renderChangeKeyButton } from '../../../js/apikey-panel.js';

const lang = localStorage.getItem('artefactos_lang') || 'es';
let profundidadActiva = 'completo';
let generando = false;
let ultimoFeedback = '';

const txt = {
  es: {
    titulo: 'Feedback de CV',
    sub: 'Pega tu currículum y recibe un análisis directo con IA. Mejora tu CV al instante.',
    cv: 'Tu CV (texto)', cv_ph: 'Pega aquí el contenido de tu currículum…',
    puesto: 'Puesto objetivo (opcional)', puesto_ph: 'Ej: Desarrollador Front-end Senior',
    profundidad: 'Profundidad del análisis',
    profundidades: [
      { id: 'rapido', label: 'Rápido' },
      { id: 'completo', label: 'Completo' },
      { id: 'experto', label: 'Experto' }
    ],
    generar: 'Analizar CV', generando: 'Analizando…',
    copiar: 'Copiar feedback', copiado: '¡Copiado!', nueva: 'Nuevo análisis',
    scoreLabel: 'Puntuación general',
    secFortalezas: 'Fortalezas',
    secDebilidades: 'Áreas de mejora',
    secSugerencias: 'Sugerencias específicas',
    badge: 'productividad', galeria: '← Galería',
    error: 'Error al analizar. Intenta de nuevo.'
  },
  en: {
    titulo: 'CV Feedback',
    sub: 'Paste your resume and get direct AI-powered analysis. Improve your CV instantly.',
    cv: 'Your CV (text)', cv_ph: 'Paste your resume content here…',
    puesto: 'Target position (optional)', puesto_ph: 'E.g.: Senior Front-end Developer',
    profundidad: 'Analysis depth',
    profundidades: [
      { id: 'rapido', label: 'Quick' },
      { id: 'completo', label: 'Detailed' },
      { id: 'experto', label: 'Expert' }
    ],
    generar: 'Analyze CV', generando: 'Analyzing…',
    copiar: 'Copy feedback', copiado: 'Copied!', nueva: 'New analysis',
    scoreLabel: 'Overall score',
    secFortalezas: 'Strengths',
    secDebilidades: 'Areas for improvement',
    secSugerencias: 'Specific suggestions',
    badge: 'productivity', galeria: '← Gallery',
    error: 'Error analyzing. Try again.'
  }
};
const t = txt[lang] || txt.es;

const instrucciones = {
  rapido: lang === 'en'
    ? 'Give a quick overview: score, 2-3 strengths, 2-3 weaknesses, and 2-3 brief suggestions.'
    : 'Da una visión rápida: puntuación, 2-3 fortalezas, 2-3 debilidades y 2-3 sugerencias breves.',
  completo: lang === 'en'
    ? 'Provide a detailed analysis: score, 4-5 strengths, 4-5 weaknesses, and 4-5 specific improvement suggestions with examples.'
    : 'Proporciona un análisis detallado: puntuación, 4-5 fortalezas, 4-5 debilidades y 4-5 sugerencias de mejora específicas con ejemplos.',
  experto: lang === 'en'
    ? 'Provide an expert-level analysis: score, thorough strengths, thorough weaknesses, detailed improvement suggestions, and concrete rewrite examples for the weakest sections.'
    : 'Proporciona un análisis nivel experto: puntuación, fortalezas exhaustivas, debilidades exhaustivas, sugerencias detalladas de mejora y ejemplos concretos de reescritura para las secciones más débiles.'
};

function init() {
  if (!hasApiKey()) { renderApiKeyPanel('app', () => render(), lang); return; }
  render();
}

function render() {
  const depthPills = t.profundidades.map(p =>
    `<button class="pill${p.id === 'completo' ? ' active' : ''}" data-val="${p.id}">${p.label}</button>`
  ).join('');

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
        <span class="field-label">${t.cv}</span>
        <textarea id="cv-entrada" class="field-textarea" placeholder="${t.cv_ph}" maxlength="15000"></textarea>
      </div>
      <div class="field-group">
        <span class="field-label">${t.puesto}</span>
        <input id="puesto-entrada" class="field-input" placeholder="${t.puesto_ph}" maxlength="120">
      </div>
      <div class="field-group">
        <span class="field-label">${t.profundidad}</span>
        <div class="pills" id="profundidades">${depthPills}</div>
      </div>
      <button id="btn-generar" class="btn-primary">${t.generar}</button>
      <div id="resultado-wrap" class="resultado-wrap">
        <div id="score-container"></div>
        <div id="feedback-sections"></div>
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
  document.getElementById('profundidades').addEventListener('click', e => {
    const pill = e.target.closest('.pill'); if (!pill) return;
    document.querySelectorAll('#profundidades .pill').forEach(p => p.classList.remove('active'));
    pill.classList.add('active'); profundidadActiva = pill.dataset.val;
  });
  document.getElementById('btn-generar').addEventListener('click', analizar);
  document.getElementById('btn-copiar').addEventListener('click', copiar);
  document.getElementById('btn-nueva').addEventListener('click', () => {
    document.getElementById('cv-entrada').value = '';
    document.getElementById('puesto-entrada').value = '';
    document.getElementById('resultado-wrap').classList.remove('visible');
    ultimoFeedback = '';
  });
}

function scoreClass(score) {
  if (score >= 7) return 'high';
  if (score >= 4) return 'mid';
  return 'low';
}

function renderResultado(data) {
  const cls = scoreClass(data.score);

  document.getElementById('score-container').innerHTML = `
    <div class="score-wrap">
      <div class="score-number score-${cls}">${data.score}<span style="font-size:1.2rem;opacity:0.5">/10</span></div>
      <div class="score-meta">
        <div class="score-label">${t.scoreLabel}</div>
        <div class="score-bar-track">
          <div class="score-bar-fill bar-${cls}" style="width:${data.score * 10}%"></div>
        </div>
      </div>
    </div>`;

  const sections = [
    { title: t.secFortalezas, content: data.fortalezas, indicator: 'indicator-green' },
    { title: t.secDebilidades, content: data.debilidades, indicator: 'indicator-yellow' },
    { title: t.secSugerencias, content: data.sugerencias, indicator: 'indicator-red' }
  ];

  document.getElementById('feedback-sections').innerHTML = sections.map(s => `
    <div class="feedback-section">
      <div class="feedback-section-header">
        <span class="feedback-indicator ${s.indicator}"></span>
        <span class="feedback-section-title">${s.title}</span>
      </div>
      <div class="feedback-section-body">${s.content}</div>
    </div>`).join('');

  document.getElementById('resultado-wrap').classList.add('visible');
}

async function analizar() {
  const cv = document.getElementById('cv-entrada').value.trim();
  if (!cv || generando) return;
  const puesto = document.getElementById('puesto-entrada').value.trim();
  const btn = document.getElementById('btn-generar');
  generando = true; btn.disabled = true; btn.textContent = t.generando;

  const idioma = lang === 'en' ? 'English' : 'Spanish';
  const puestoCtx = puesto
    ? (lang === 'en' ? `The target position is: ${puesto}.` : `El puesto objetivo es: ${puesto}.`)
    : '';

  const systemPrompt = lang === 'en'
    ? `You are an expert CV/resume reviewer. Respond ONLY in English.
${instrucciones[profundidadActiva]}
${puestoCtx}
You MUST respond in this exact JSON format (no markdown, no extra text):
{"score":NUMBER_1_TO_10,"fortalezas":"STRENGTHS_TEXT","debilidades":"WEAKNESSES_TEXT","sugerencias":"SUGGESTIONS_TEXT"}
Use line breaks within text values for readability.`
    : `Eres un experto revisor de currículums. Responde SOLO en español.
${instrucciones[profundidadActiva]}
${puestoCtx}
DEBES responder en este formato JSON exacto (sin markdown, sin texto extra):
{"score":NUMERO_1_A_10,"fortalezas":"TEXTO_FORTALEZAS","debilidades":"TEXTO_DEBILIDADES","sugerencias":"TEXTO_SUGERENCIAS"}
Usa saltos de línea dentro de los valores de texto para legibilidad.`;

  const maxTokensMap = { rapido: 600, completo: 1200, experto: 2000 };

  try {
    const raw = await askGroq({
      systemPrompt,
      userMessage: cv,
      temperature: 0.4,
      maxTokens: maxTokensMap[profundidadActiva]
    });

    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('Invalid JSON');
    const data = JSON.parse(jsonMatch[0]);
    data.score = Math.max(1, Math.min(10, Math.round(Number(data.score)) || 5));

    ultimoFeedback = `${t.scoreLabel}: ${data.score}/10\n\n${t.secFortalezas}:\n${data.fortalezas}\n\n${t.secDebilidades}:\n${data.debilidades}\n\n${t.secSugerencias}:\n${data.sugerencias}`;
    renderResultado(data);
  } catch {
    document.getElementById('score-container').innerHTML = '';
    document.getElementById('feedback-sections').innerHTML =
      `<div class="feedback-section"><div class="feedback-section-body">${t.error}</div></div>`;
    document.getElementById('resultado-wrap').classList.add('visible');
    ultimoFeedback = '';
  }
  generando = false; btn.disabled = false; btn.textContent = t.generar;
}

function copiar() {
  if (!ultimoFeedback) return;
  navigator.clipboard.writeText(ultimoFeedback);
  const btn = document.getElementById('btn-copiar');
  btn.textContent = t.copiado; btn.classList.add('copiado');
  setTimeout(() => { btn.textContent = t.copiar; btn.classList.remove('copiado'); }, 1500);
}

document.addEventListener('DOMContentLoaded', init);
