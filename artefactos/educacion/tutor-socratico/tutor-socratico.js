// tutor-socratico.js — Tutor Socrático
// Conversación guiada por preguntas con síntesis final

import { askGroq, hasApiKey } from '../../../js/groq.js';
import { renderApiKeyPanel, renderChangeKeyButton } from '../../../js/apikey-panel.js';

const lang = localStorage.getItem('artefactos_lang') || 'es';
const MAX_PREGUNTAS = 8;

let tema = '';
let nivelActivo = 'basico';
let preguntaActual = 0;
let historial = []; // {pregunta, respuesta}
let mensajes = []; // historial para Groq
let generando = false;
let preguntaTexto = '';

const txt = {
  es: {
    titulo: 'Tutor Socrático',
    sub: 'La IA te guía con preguntas para que descubras el conocimiento por ti mismo.',
    placeholder: 'Mitosis celular, ley de oferta y demanda, ética kantiana…',
    nivel: 'Nivel de conocimiento previo',
    niveles: { ninguno: 'Ninguno', basico: 'Básico', intermedio: 'Intermedio' },
    comenzar: 'Iniciar diálogo', comenzando: 'Preparando…',
    respPlaceholder: 'Escribe tu respuesta…',
    enviar: 'Responder',
    pista: 'No sé / Pista',
    counter: 'Pregunta {n} de ~{max}',
    sinDir: 'Síntesis',
    sinTitulo: '🏛️ Síntesis socrática',
    nuevaTema: 'Nuevo tema',
    badge: 'educación', galeria: '← Galería',
    error: 'Error de comunicación. Intenta de nuevo.'
  },
  en: {
    titulo: 'Socratic Tutor',
    sub: 'AI guides you with questions so you discover knowledge by yourself.',
    placeholder: 'Cell mitosis, supply and demand, Kantian ethics…',
    nivel: 'Prior knowledge level',
    niveles: { ninguno: 'None', basico: 'Basic', intermedio: 'Intermediate' },
    comenzar: 'Start dialogue', comenzando: 'Preparing…',
    respPlaceholder: 'Type your answer…',
    enviar: 'Answer',
    pista: "I don't know / Hint",
    counter: 'Question {n} of ~{max}',
    sinDir: 'Synthesis',
    sinTitulo: '🏛️ Socratic synthesis',
    nuevaTema: 'New topic',
    badge: 'education', galeria: '← Gallery',
    error: 'Communication error. Try again.'
  }
};
const t = txt[lang] || txt.es;

// Prompts del sistema
function promptInicial(tema, nivel) {
  const nEs = nivel === 'ninguno' ? 'ninguno' : nivel === 'basico' ? 'básico' : 'intermedio';
  return `Eres un tutor socrático experto. Tu objetivo es guiar al estudiante para que descubra por sí mismo los conceptos clave sobre "${tema}".
El estudiante dice tener nivel de conocimiento previo: ${nEs}.

REGLAS:
- Haz UNA sola pregunta abierta y precisa por turno.
- NUNCA des la respuesta directamente.
- Si el estudiante no sabe, dale una pista sutil, NO la respuesta.
- Usa lenguaje claro y accesible.
- Adapta la profundidad al nivel del estudiante.

Comienza con tu primera pregunta socrática sobre el tema.
Responde SOLO con la pregunta, sin introducción ni explicación.`;
}

function promptSeguimiento() {
  return `Continúa como tutor socrático. Analiza la respuesta del estudiante:
- Si es correcta o parcial, reconócelo brevemente y profundiza con la siguiente pregunta.
- Si es incorrecta, reformula la pregunta con una pista sutil.
- Si dice "no sé" o pide pista, da una pista orientadora sin revelar la respuesta.

Responde SOLO con tu siguiente pregunta (o pista + pregunta). Sin explicaciones largas.`;
}

function promptSintesis(tema) {
  return `Eres un tutor socrático. Basándote en todo el diálogo anterior sobre "${tema}", genera una síntesis final que:

1. Resuma los conceptos clave que el estudiante descubrió
2. Señale las conexiones entre ideas
3. Sugiera 2-3 temas relacionados para seguir explorando

Escribe la síntesis en prosa clara, en 3-4 párrafos. Usa un tono cálido y motivador.`;
}

// Llamada a Groq con manejo de errores
async function llamarGroq(systemPrompt, userMessage) {
  try {
    const resp = await askGroq({ systemPrompt, userMessage, temperature: 0.8, maxTokens: 400 });
    if (resp === 'NO_KEY' || resp === 'INVALID_KEY') {
      return { ok: false, error: t.error };
    }
    return { ok: true, data: resp };
  } catch {
    return { ok: false, error: t.error };
  }
}

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
      <input type="text" id="tema-input" class="campo" placeholder="${t.placeholder}" maxlength="120" />
      <div class="selector-grupo">
        <span class="selector-label">${t.nivel}</span>
        <div class="pills" id="nivel-pills">
          ${Object.entries(t.niveles).map(([k, v]) => `<button class="pill${k === nivelActivo ? ' active' : ''}" data-val="${k}">${v}</button>`).join('')}
        </div>
      </div>
      <button id="btn-comenzar" class="btn-principal">${t.comenzar}</button>
      <div id="chat-zona" class="chat-zona"></div>
    </div>
  `;
  renderChangeKeyButton('key-btn-wrap', lang);
  bindInicio();
}

function bindInicio() {
  // Nivel pills
  document.querySelectorAll('#nivel-pills .pill').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#nivel-pills .pill').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      nivelActivo = btn.dataset.val;
    });
  });

  const btnComenzar = document.getElementById('btn-comenzar');
  const input = document.getElementById('tema-input');
  input.addEventListener('keydown', e => { if (e.key === 'Enter') btnComenzar.click(); });

  btnComenzar.addEventListener('click', async () => {
    const val = input.value.trim();
    if (!val || generando) return;
    tema = val;
    preguntaActual = 0;
    historial = [];
    mensajes = [];
    generando = true;
    btnComenzar.disabled = true;
    btnComenzar.textContent = t.comenzando;

    // Ocultar controles de inicio
    input.style.display = 'none';
    document.querySelector('.selector-grupo').style.display = 'none';
    btnComenzar.style.display = 'none';

    const zona = document.getElementById('chat-zona');
    zona.innerHTML = '<p class="loading">…</p>';

    const sys = promptInicial(tema, nivelActivo);
    mensajes.push({ role: 'system', content: sys });
    mensajes.push({ role: 'user', content: `Quiero aprender sobre: ${tema}` });

    const res = await llamarGroq(sys, `Quiero aprender sobre: ${tema}`);
    generando = false;
    if (!res.ok) { zona.innerHTML = `<p class="loading">${res.error}</p>`; return; }

    preguntaActual = 1;
    preguntaTexto = res.data;
    mensajes.push({ role: 'assistant', content: preguntaTexto });
    renderPregunta();
  });
}

function renderPregunta() {
  const zona = document.getElementById('chat-zona');
  zona.innerHTML = `
    ${renderHistorial()}
    <div class="pregunta-counter">${t.counter.replace('{n}', preguntaActual).replace('{max}', MAX_PREGUNTAS)}</div>
    <div class="pregunta-tutor">${escaparHTML(preguntaTexto)}</div>
    <div class="respuesta-zona">
      <input type="text" id="resp-input" class="input-respuesta" placeholder="${t.respPlaceholder}" maxlength="500" />
      <div class="btns-respuesta">
        <button class="btn-sec" id="btn-pista">${t.pista}</button>
        <button class="btn-enviar" id="btn-enviar">${t.enviar}</button>
      </div>
    </div>
  `;
  bindRespuesta();
  document.getElementById('resp-input').focus();
}

function renderHistorial() {
  if (!historial.length) return '';
  return historial.map(h => `
    <div class="historial-item">
      <div class="hist-pregunta">${escaparHTML(h.pregunta)}</div>
      <div class="hist-respuesta">${escaparHTML(h.respuesta)}</div>
    </div>
  `).join('');
}

function bindRespuesta() {
  const input = document.getElementById('resp-input');
  const btnEnviar = document.getElementById('btn-enviar');
  const btnPista = document.getElementById('btn-pista');

  input.addEventListener('keydown', e => { if (e.key === 'Enter') btnEnviar.click(); });

  btnEnviar.addEventListener('click', () => enviar(input.value.trim()));
  btnPista.addEventListener('click', () => enviar(lang === 'en' ? "I don't know, give me a hint" : 'No sé, dame una pista'));
}

async function enviar(respuesta) {
  if (!respuesta || generando) return;
  generando = true;

  const zona = document.getElementById('chat-zona');
  historial.push({ pregunta: preguntaTexto, respuesta });

  // Agregar respuesta del usuario a mensajes
  mensajes.push({ role: 'user', content: respuesta });

  // ¿Última pregunta? → síntesis
  if (preguntaActual >= MAX_PREGUNTAS) {
    zona.innerHTML = `${renderHistorial()}<p class="loading">…</p>`;
    await generarSintesis();
    return;
  }

  zona.innerHTML = `${renderHistorial()}<p class="loading">…</p>`;

  // Construir historial completo para Groq
  const sysSeguimiento = promptSeguimiento();
  const historialTexto = mensajes.filter(m => m.role !== 'system').map(m => `${m.role === 'user' ? 'Estudiante' : 'Tutor'}: ${m.content}`).join('\n');
  const userMsg = `Historial del diálogo:\n${historialTexto}\n\nGenera la siguiente pregunta socrática.`;

  const res = await llamarGroq(sysSeguimiento, userMsg);
  generando = false;
  if (!res.ok) { zona.innerHTML += `<p class="loading">${res.error}</p>`; return; }

  preguntaActual++;
  preguntaTexto = res.data;
  mensajes.push({ role: 'assistant', content: preguntaTexto });
  renderPregunta();
}

async function generarSintesis() {
  const zona = document.getElementById('chat-zona');
  const sys = promptSintesis(tema);
  const historialTexto = historial.map((h, i) => `P${i + 1}: ${h.pregunta}\nR${i + 1}: ${h.respuesta}`).join('\n\n');

  const res = await llamarGroq(sys, `Diálogo completo:\n${historialTexto}`);
  generando = false;

  let sintesisHTML = '';
  if (res.ok) {
    sintesisHTML = `<div class="sintesis-panel">
      <h3>${t.sinTitulo}</h3>
      <p>${escaparHTML(res.data)}</p>
    </div>`;
  }

  zona.innerHTML = `
    ${renderHistorial()}
    ${sintesisHTML}
    <button class="btn-principal" id="btn-nuevo" style="margin-top:1.5rem">${t.nuevaTema}</button>
  `;
  document.getElementById('btn-nuevo').addEventListener('click', () => {
    tema = '';
    preguntaActual = 0;
    historial = [];
    mensajes = [];
    renderArtefacto();
  });
}

function escaparHTML(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

init();
