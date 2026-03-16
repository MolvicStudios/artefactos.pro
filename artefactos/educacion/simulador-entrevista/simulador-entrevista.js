// simulador-entrevista.js — Simulador de Entrevista
// 8 preguntas con feedback individual + reporte final + exportar

import { askGroq, hasApiKey } from '../../../js/groq.js';
import { renderApiKeyPanel, renderChangeKeyButton } from '../../../js/apikey-panel.js';

const lang = localStorage.getItem('artefactos_lang') || 'es';
const NUM_PREGUNTAS = 8;

let tipoActivo = 'tecnica';
let rolTexto = '';
let difActiva = 'media';
let idiomaEnt = 'es';
let preguntaIdx = 0;
let resultados = []; // {pregunta, respuesta, score, bien, mejorar, modelo}
let generando = false;

const txt = {
  es: {
    titulo: 'Simulador de Entrevista',
    sub: 'Practica entrevistas laborales con preguntas y feedback de IA.',
    rolPlaceholder: 'Puesto: Desarrollador Frontend, Data Scientist…',
    tipo: 'Tipo de entrevista',
    tipos: { tecnica: 'Técnica', conductual: 'Conductual', mixta: 'Mixta' },
    dif: 'Dificultad',
    difs: { facil: 'Junior', media: 'Mid', dificil: 'Senior' },
    idioma: 'Idioma entrevista',
    idiomas: { es: 'Español', en: 'English' },
    comenzar: 'Iniciar entrevista', comenzando: 'Preparando…',
    respPlaceholder: 'Escribe tu respuesta a la pregunta…',
    responder: 'Enviar respuesta', respondiendo: 'Evaluando…',
    siguiente: 'Siguiente pregunta →',
    verResultados: 'Ver reporte final',
    reporteTitulo: 'Reporte de entrevista',
    promedio: 'Puntuación promedio',
    exportar: '↓ Exportar .txt',
    nuevaEntrevista: 'Nueva entrevista',
    avatarNombre: 'Entrevistador IA',
    bien: '✓ Bien: ', mejorar: '✗ Mejorar: ', modelo: 'Respuesta modelo: ',
    badge: 'educación', galeria: '← Galería',
    error: 'Error de comunicación. Intenta de nuevo.'
  },
  en: {
    titulo: 'Interview Simulator',
    sub: 'Practice job interviews with AI questions and feedback.',
    rolPlaceholder: 'Role: Frontend Developer, Data Scientist…',
    tipo: 'Interview type',
    tipos: { tecnica: 'Technical', conductual: 'Behavioral', mixta: 'Mixed' },
    dif: 'Difficulty',
    difs: { facil: 'Junior', media: 'Mid', dificil: 'Senior' },
    idioma: 'Interview language',
    idiomas: { es: 'Español', en: 'English' },
    comenzar: 'Start interview', comenzando: 'Preparing…',
    respPlaceholder: 'Type your answer…',
    responder: 'Submit answer', respondiendo: 'Evaluating…',
    siguiente: 'Next question →',
    verResultados: 'See final report',
    reporteTitulo: 'Interview report',
    promedio: 'Average score',
    exportar: '↓ Export .txt',
    nuevaEntrevista: 'New interview',
    avatarNombre: 'AI Interviewer',
    bien: '✓ Good: ', mejorar: '✗ Improve: ', modelo: 'Model answer: ',
    badge: 'education', galeria: '← Gallery',
    error: 'Communication error. Try again.'
  }
};
const t = txt[lang] || txt.es;

// SVG avatar geométrico
const avatarSVG = `<svg class="avatar-svg" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
  <circle cx="24" cy="24" r="23" stroke="#3b82f6" stroke-width="1"/>
  <circle cx="24" cy="18" r="8" fill="#1e3a5f"/>
  <path d="M8 42c0-8.837 7.163-16 16-16s16 7.163 16 16" fill="#1e3a5f"/>
  <circle cx="20" cy="17" r="1.5" fill="#3b82f6"/>
  <circle cx="28" cy="17" r="1.5" fill="#3b82f6"/>
</svg>`;

function init() {
  if (!hasApiKey()) { renderApiKeyPanel('app', () => renderArtefacto(), lang); return; }
  renderArtefacto();
}

function renderArtefacto() {
  const app = document.getElementById('app');
  app.innerHTML = `
    <header class="art-header">
      <div class="art-header-left">
        <a href="../../../index.html" class="back-link">${t.galeria}</a>
        <span class="cat-badge">${t.badge}</span>
      </div>
      <div id="key-btn-wrap"></div>
    </header>
    <div class="main-wrap">
      <h1>${t.titulo}</h1>
      <p class="subtitulo">${t.sub}</p>
      <input type="text" id="rol-input" class="campo" placeholder="${t.rolPlaceholder}" maxlength="100" />
      <div class="selector-row">
        <div class="selector-grupo">
          <span class="selector-label">${t.tipo}</span>
          <div class="pills" id="tipo-pills">
            ${Object.entries(t.tipos).map(([k, v]) => `<button class="pill${k === tipoActivo ? ' active' : ''}" data-val="${k}">${v}</button>`).join('')}
          </div>
        </div>
        <div class="selector-grupo">
          <span class="selector-label">${t.dif}</span>
          <div class="pills" id="dif-pills">
            ${Object.entries(t.difs).map(([k, v]) => `<button class="pill${k === difActiva ? ' active' : ''}" data-val="${k}">${v}</button>`).join('')}
          </div>
        </div>
      </div>
      <div class="selector-row">
        <div class="selector-grupo">
          <span class="selector-label">${t.idioma}</span>
          <div class="pills" id="idioma-pills">
            ${Object.entries(t.idiomas).map(([k, v]) => `<button class="pill${k === idiomaEnt ? ' active' : ''}" data-val="${k}">${v}</button>`).join('')}
          </div>
        </div>
      </div>
      <button id="btn-comenzar" class="btn-principal">${t.comenzar}</button>
      <div id="entrevista-zona"></div>
    </div>
  `;
  renderChangeKeyButton('key-btn-wrap', lang);
  bindInicio();
}

function bindInicio() {
  bindPills('tipo-pills', v => tipoActivo = v);
  bindPills('dif-pills', v => difActiva = v);
  bindPills('idioma-pills', v => idiomaEnt = v);

  const btn = document.getElementById('btn-comenzar');
  const input = document.getElementById('rol-input');
  input.addEventListener('keydown', e => { if (e.key === 'Enter') btn.click(); });

  btn.addEventListener('click', async () => {
    rolTexto = input.value.trim();
    if (!rolTexto || generando) return;
    preguntaIdx = 0;
    resultados = [];
    input.style.display = 'none';
    document.querySelectorAll('.selector-row').forEach(el => el.style.display = 'none');
    btn.style.display = 'none';
    await generarPreguntaEntrevista();
  });
}

function bindPills(id, setter) {
  document.querySelectorAll(`#${id} .pill`).forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll(`#${id} .pill`).forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      setter(btn.dataset.val);
    });
  });
}

async function generarPreguntaEntrevista() {
  generando = true;
  const zona = document.getElementById('entrevista-zona');
  zona.innerHTML = '<p class="loading">…</p>';

  const tipoDesc = tipoActivo === 'tecnica' ? 'técnica (habilidades duras)' :
    tipoActivo === 'conductual' ? 'conductual (situaciones pasadas, STAR method)' : 'mixta (técnica y conductual)';
  const difDesc = difActiva === 'facil' ? 'junior/entry-level' : difActiva === 'media' ? 'mid-level' : 'senior/lead';
  const langEntrevista = idiomaEnt === 'en' ? 'English' : 'español';

  const prevPreguntas = resultados.map(r => r.pregunta).join(' | ');

  const sys = `Eres un entrevistador profesional para el puesto de "${rolTexto}".
Tipo de entrevista: ${tipoDesc}. Nivel: ${difDesc}. Idioma: ${langEntrevista}.
${prevPreguntas ? `Preguntas ya hechas (NO repetir): ${prevPreguntas}` : ''}
Genera UNA nueva pregunta de entrevista. Responde SOLO con la pregunta, nada más.`;

  try {
    const resp = await askGroq({ systemPrompt: sys, userMessage: `Pregunta ${preguntaIdx + 1} de ${NUM_PREGUNTAS}`, temperature: 0.9, maxTokens: 200 });
    generando = false;
    renderPreguntaEntrevista(resp.trim());
  } catch {
    zona.innerHTML = `<p class="loading">${t.error}</p>`; generando = false;
  }
}

function renderPreguntaEntrevista(pregunta) {
  const zona = document.getElementById('entrevista-zona');
  const pct = (preguntaIdx / NUM_PREGUNTAS) * 100;

  zona.innerHTML = `
    <div class="entrevista-progress">
      <div class="progress-bar"><div class="progress-fill" style="width:${pct}%"></div></div>
      <span class="progress-label">${preguntaIdx + 1}/${NUM_PREGUNTAS}</span>
    </div>
    <div class="avatar-zona">
      ${avatarSVG}
      <div class="avatar-nombre">${t.avatarNombre}</div>
    </div>
    <div class="pregunta-entrevista">${escaparHTML(pregunta)}</div>
    <textarea class="resp-area" id="resp-area" placeholder="${t.respPlaceholder}" maxlength="2000"></textarea>
    <button class="btn-responder" id="btn-responder">${t.responder}</button>
    <div id="feedback-zona"></div>
  `;

  document.getElementById('btn-responder').addEventListener('click', () => evaluarRespuesta(pregunta));
}

async function evaluarRespuesta(pregunta) {
  const respuesta = document.getElementById('resp-area').value.trim();
  if (!respuesta || generando) return;
  generando = true;
  const btn = document.getElementById('btn-responder');
  btn.disabled = true; btn.textContent = t.respondiendo;

  const sys = `Eres un evaluador de entrevistas profesional. Evalúa la respuesta del candidato.
Puesto: "${rolTexto}". Pregunta: "${pregunta}".

Responde SOLO con JSON válido:
{"score":7,"bien":"lo que hizo bien","mejorar":"lo que puede mejorar","modelo":"respuesta modelo ideal breve"}
score: 1-10.`;

  try {
    const resp = await askGroq({ systemPrompt: sys, userMessage: respuesta, temperature: 0.7, maxTokens: 500 });
    const data = parsearJSON(resp);
    if (!data) { generando = false; btn.disabled = false; btn.textContent = t.responder; return; }

    const resultado = { pregunta, respuesta, score: data.score || 5, bien: data.bien || '', mejorar: data.mejorar || '', modelo: data.modelo || '' };
    resultados.push(resultado);
    preguntaIdx++;
    generando = false;
    renderFeedback(resultado);
  } catch {
    generando = false; btn.disabled = false; btn.textContent = t.responder;
  }
}

function renderFeedback(res) {
  const fb = document.getElementById('feedback-zona');
  const esUltima = preguntaIdx >= NUM_PREGUNTAS;
  fb.innerHTML = `
    <div class="feedback-pregunta">
      <div class="fb-score"><span class="num">${res.score}</span>/10</div>
      <div class="fb-bien">${t.bien}${escaparHTML(res.bien)}</div>
      <div class="fb-mejorar">${t.mejorar}${escaparHTML(res.mejorar)}</div>
      <div class="fb-modelo"><strong>${t.modelo}</strong>${escaparHTML(res.modelo)}</div>
    </div>
    <button class="btn-siguiente" id="btn-sig">${esUltima ? t.verResultados : t.siguiente}</button>
  `;
  // Ocultar textarea y botón responder
  document.getElementById('resp-area').style.display = 'none';
  document.getElementById('btn-responder').style.display = 'none';

  document.getElementById('btn-sig').addEventListener('click', () => {
    if (esUltima) renderReporte();
    else generarPreguntaEntrevista();
  });
}

function renderReporte() {
  const zona = document.getElementById('entrevista-zona');
  const promedio = (resultados.reduce((s, r) => s + r.score, 0) / resultados.length).toFixed(1);

  const detalles = resultados.map((r, i) => `
    <div class="feedback-pregunta" style="margin-bottom:0.75rem">
      <div style="font-size:0.75rem;color:var(--texto-muted);margin-bottom:0.25rem">P${i + 1}</div>
      <div style="font-size:0.85rem;margin-bottom:0.35rem">${escaparHTML(r.pregunta)}</div>
      <div class="fb-score"><span class="num">${r.score}</span>/10</div>
      <div class="fb-bien">${t.bien}${escaparHTML(r.bien)}</div>
      <div class="fb-mejorar">${t.mejorar}${escaparHTML(r.mejorar)}</div>
    </div>
  `).join('');

  zona.innerHTML = `
    <div class="reporte">
      <h2>${t.reporteTitulo}</h2>
      <div class="reporte-score">${promedio}/10</div>
      <div class="reporte-detalle">${t.promedio} · ${rolTexto}</div>
      ${detalles}
      <button class="btn-exportar" id="btn-exportar">${t.exportar}</button>
      <button class="btn-principal" id="btn-nueva" style="margin-top:1rem">${t.nuevaEntrevista}</button>
    </div>
  `;
  document.getElementById('btn-exportar').addEventListener('click', exportarTxt);
  document.getElementById('btn-nueva').addEventListener('click', () => renderArtefacto());
}

function exportarTxt() {
  const promedio = (resultados.reduce((s, r) => s + r.score, 0) / resultados.length).toFixed(1);
  let contenido = `${t.reporteTitulo}\n${rolTexto}\n${t.promedio}: ${promedio}/10\n${'='.repeat(40)}\n\n`;
  resultados.forEach((r, i) => {
    contenido += `P${i + 1}: ${r.pregunta}\nRespuesta: ${r.respuesta}\nScore: ${r.score}/10\n${t.bien}${r.bien}\n${t.mejorar}${r.mejorar}\n${t.modelo}${r.modelo}\n\n`;
  });
  const blob = new Blob([contenido], { type: 'text/plain;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `entrevista-${rolTexto.replace(/\s+/g, '-').substring(0, 30)}.txt`;
  a.click();
  URL.revokeObjectURL(a.href);
}

function parsearJSON(raw) {
  let limpio = raw.trim();
  limpio = limpio.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/g, '');
  try { return JSON.parse(limpio); } catch { return null; }
}
function escaparHTML(str) { const d = document.createElement('div'); d.textContent = str; return d.innerHTML; }

init();
