// duelo.js — Lógica del Duelo de Filósofos
import { askGroq, hasApiKey } from '../../../js/groq.js';
import { renderApiKeyPanel } from '../../../js/apikey-panel.js';

const lang = localStorage.getItem('artefactos_lang') || 'es';

const txt = {
  es: {
    langToggle: 'EN', back: '← Volver',
    title: 'Duelo de Filósofos', subtitle: 'Elige dos mentes. Elige un tema. Observa cómo chocan.',
    selectA: 'Filósofo A', selectB: 'Filósofo B',
    topic: 'Tema del debate', topicPlaceholder: 'Ej: ¿Existe el libre albedrío?',
    start: '¡Que comience el duelo!', nextRound: 'Siguiente ronda',
    verdict: 'Veredicto del árbitro', newDuel: 'Nuevo duelo',
    round: 'Ronda', of: 'de',
    loading: '⚡ Preparando argumentos...',
    diffAlert: 'Elige dos filósofos diferentes.',
    error: 'Error al consultar'
  },
  en: {
    langToggle: 'ES', back: '← Back',
    title: 'Philosopher Duel', subtitle: 'Choose two minds. Choose a topic. Watch them clash.',
    selectA: 'Philosopher A', selectB: 'Philosopher B',
    topic: 'Debate topic', topicPlaceholder: 'E.g.: Does free will exist?',
    start: 'Let the duel begin!', nextRound: 'Next round',
    verdict: 'Arbiter verdict', newDuel: 'New duel',
    round: 'Round', of: 'of',
    loading: '⚡ Preparing arguments...',
    diffAlert: 'Choose two different philosophers.',
    error: 'Error consulting'
  }
};
const t = txt[lang] || txt.es;

const MAX_ROUNDS = 3;
const PHILOSOPHERS = [
  'Sócrates', 'Platón', 'Aristóteles', 'Nietzsche', 'Kant',
  'Descartes', 'Hume', 'Sartre', 'Simone de Beauvoir', 'Confucio'
];

const PORTRAITS = {
  'Sócrates': `<svg viewBox="0 0 60 60" fill="none"><circle cx="30" cy="22" r="14" stroke="#f8f6f0" stroke-width="1.5"/><path d="M20 22 Q30 32 40 22" stroke="#f8f6f0" stroke-width="1" fill="none"/><line x1="30" y1="36" x2="30" y2="50" stroke="#f8f6f0" stroke-width="1.5"/><circle cx="26" cy="20" r="1.5" fill="#f8f6f0"/><circle cx="34" cy="20" r="1.5" fill="#f8f6f0"/></svg>`,
  'Platón': `<svg viewBox="0 0 60 60" fill="none"><rect x="18" y="12" width="24" height="28" rx="12" stroke="#f8f6f0" stroke-width="1.5"/><path d="M18 18 Q30 8 42 18" stroke="#f8f6f0" stroke-width="1" fill="none"/><circle cx="26" cy="24" r="1.5" fill="#f8f6f0"/><circle cx="34" cy="24" r="1.5" fill="#f8f6f0"/><line x1="30" y1="42" x2="30" y2="54" stroke="#f8f6f0" stroke-width="1.5"/></svg>`,
  'Aristóteles': `<svg viewBox="0 0 60 60" fill="none"><circle cx="30" cy="24" r="13" stroke="#f8f6f0" stroke-width="1.5"/><path d="M22 28 L30 34 L38 28" stroke="#f8f6f0" stroke-width="1" fill="none"/><circle cx="26" cy="22" r="1.5" fill="#f8f6f0"/><circle cx="34" cy="22" r="1.5" fill="#f8f6f0"/><line x1="30" y1="37" x2="30" y2="52" stroke="#f8f6f0" stroke-width="1.5"/><line x1="22" y1="14" x2="38" y2="14" stroke="#f8f6f0" stroke-width="1"/></svg>`,
  'Nietzsche': `<svg viewBox="0 0 60 60" fill="none"><circle cx="30" cy="22" r="13" stroke="#f8f6f0" stroke-width="1.5"/><path d="M22 30 Q30 35 38 30" stroke="#f8f6f0" stroke-width="1.5" fill="none"/><circle cx="26" cy="20" r="1.5" fill="#f8f6f0"/><circle cx="34" cy="20" r="1.5" fill="#f8f6f0"/><path d="M22 28 L20 32" stroke="#f8f6f0" stroke-width="1.5"/><path d="M38 28 L40 32" stroke="#f8f6f0" stroke-width="1.5"/><line x1="30" y1="36" x2="30" y2="52" stroke="#f8f6f0" stroke-width="1.5"/></svg>`,
  'Kant': `<svg viewBox="0 0 60 60" fill="none"><rect x="20" y="14" width="20" height="24" rx="10" stroke="#f8f6f0" stroke-width="1.5"/><line x1="20" y1="20" x2="40" y2="20" stroke="#f8f6f0" stroke-width="1"/><circle cx="27" cy="24" r="1.5" fill="#f8f6f0"/><circle cx="33" cy="24" r="1.5" fill="#f8f6f0"/><line x1="27" y1="32" x2="33" y2="32" stroke="#f8f6f0" stroke-width="1"/><line x1="30" y1="38" x2="30" y2="52" stroke="#f8f6f0" stroke-width="1.5"/></svg>`,
  'Descartes': `<svg viewBox="0 0 60 60" fill="none"><circle cx="30" cy="24" r="13" stroke="#f8f6f0" stroke-width="1.5"/><path d="M18 16 Q30 10 42 16" stroke="#f8f6f0" stroke-width="1.2" fill="none"/><circle cx="26" cy="22" r="1.5" fill="#f8f6f0"/><circle cx="34" cy="22" r="1.5" fill="#f8f6f0"/><path d="M26 30 L30 32 L34 30" stroke="#f8f6f0" stroke-width="1"/><line x1="30" y1="37" x2="30" y2="52" stroke="#f8f6f0" stroke-width="1.5"/></svg>`,
  'Hume': `<svg viewBox="0 0 60 60" fill="none"><ellipse cx="30" cy="24" rx="14" ry="13" stroke="#f8f6f0" stroke-width="1.5"/><path d="M16 18 Q22 10 30 14 Q38 10 44 18" stroke="#f8f6f0" stroke-width="1" fill="none"/><circle cx="26" cy="22" r="1.5" fill="#f8f6f0"/><circle cx="34" cy="22" r="1.5" fill="#f8f6f0"/><path d="M26 30 Q30 33 34 30" stroke="#f8f6f0" stroke-width="1" fill="none"/><line x1="30" y1="37" x2="30" y2="52" stroke="#f8f6f0" stroke-width="1.5"/></svg>`,
  'Sartre': `<svg viewBox="0 0 60 60" fill="none"><circle cx="30" cy="24" r="12" stroke="#f8f6f0" stroke-width="1.5"/><circle cx="25" cy="22" r="4" stroke="#f8f6f0" stroke-width="1" fill="none"/><circle cx="35" cy="22" r="4" stroke="#f8f6f0" stroke-width="1" fill="none"/><circle cx="25" cy="22" r="1.5" fill="#f8f6f0"/><circle cx="35" cy="22" r="1.5" fill="#f8f6f0"/><line x1="26" y1="30" x2="34" y2="30" stroke="#f8f6f0" stroke-width="1"/><line x1="30" y1="36" x2="30" y2="52" stroke="#f8f6f0" stroke-width="1.5"/></svg>`,
  'Simone de Beauvoir': `<svg viewBox="0 0 60 60" fill="none"><circle cx="30" cy="22" r="12" stroke="#f8f6f0" stroke-width="1.5"/><path d="M18 22 Q18 8 30 10 Q42 8 42 22" stroke="#f8f6f0" stroke-width="1" fill="none"/><circle cx="26" cy="21" r="1.5" fill="#f8f6f0"/><circle cx="34" cy="21" r="1.5" fill="#f8f6f0"/><path d="M26 28 Q30 31 34 28" stroke="#f8f6f0" stroke-width="1" fill="none"/><line x1="30" y1="34" x2="30" y2="52" stroke="#f8f6f0" stroke-width="1.5"/></svg>`,
  'Confucio': `<svg viewBox="0 0 60 60" fill="none"><circle cx="30" cy="24" r="13" stroke="#f8f6f0" stroke-width="1.5"/><path d="M18 20 Q24 12 30 16 Q36 12 42 20" stroke="#f8f6f0" stroke-width="1" fill="none"/><circle cx="26" cy="22" r="1.5" fill="#f8f6f0"/><circle cx="34" cy="22" r="1.5" fill="#f8f6f0"/><path d="M24 30 Q30 34 36 30" stroke="#f8f6f0" stroke-width="1" fill="none"/><path d="M20 36 Q30 42 40 36" stroke="#f8f6f0" stroke-width="1" fill="none"/><line x1="30" y1="37" x2="30" y2="52" stroke="#f8f6f0" stroke-width="1.5"/></svg>`
};

let currentRound = 0;
let debateHistory = [];
let philosopherA = '';
let philosopherB = '';
let topic = '';

function getDebatePrompt(philA, philB, tema, prevSpeeches) {
  const idioma = lang === 'es' ? 'español' : 'English';
  let context = '';
  if (prevSpeeches.length > 0) {
    context = lang === 'es'
      ? `\nIntervenciones anteriores:\n${prevSpeeches.join('\n')}\nContinúa el debate con nuevos argumentos.`
      : `\nPrevious exchanges:\n${prevSpeeches.join('\n')}\nContinue the debate with new arguments.`;
  }
  return `Eres el narrador de un debate filosófico. Hablas en ${idioma}.
El debate es entre ${philA} y ${philB} sobre el tema: ${tema}.
Genera exactamente dos intervenciones: primero ${philA} habla (2-3 oraciones, fiel a su pensamiento real),
luego ${philB} responde directamente (2-3 oraciones, fiel a su pensamiento real).
Formato de respuesta:
${philA}: "..."
${philB}: "..."
Usa el pensamiento histórico real de cada filósofo. No inventes posturas.${context}`;
}

function getVerdictPrompt(philA, philB, tema, allSpeeches) {
  const idioma = lang === 'es' ? 'español' : 'English';
  return `Eres un árbitro neutral filosófico. Hablas en ${idioma}.
Has presenciado un debate entre ${philA} y ${philB} sobre: ${tema}.
Las intervenciones han sido:
${allSpeeches.join('\n')}
Resume en máximo 4 oraciones los puntos clave de cada postura y quién tuvo argumentos más sólidos. Sé justo y ecuánime.`;
}

document.addEventListener('DOMContentLoaded', () => {
  if (!hasApiKey()) {
    document.querySelector('main').style.display = 'none';
    renderApiKeyPanel('key-panel', () => {
      document.getElementById('key-panel').innerHTML = '';
      document.querySelector('main').style.display = '';
      setup();
    }, lang);
    return;
  }
  setup();
});

function setup() {
  updateTexts();
  populateSelects();
  initEvents();
}

function updateTexts() {
  document.getElementById('lang-toggle').textContent = t.langToggle;
  document.getElementById('back-btn').textContent = t.back;
  document.getElementById('duelo-title').textContent = t.title;
  document.getElementById('label-a').textContent = t.selectA;
  document.getElementById('label-b').textContent = t.selectB;
  document.getElementById('label-topic').textContent = t.topic;
  document.getElementById('topic-input').placeholder = t.topicPlaceholder;
  document.getElementById('btn-start').textContent = t.start;
  document.getElementById('btn-next').textContent = t.nextRound;
  document.getElementById('btn-verdict').textContent = t.verdict;
  document.getElementById('btn-new').textContent = t.newDuel;
}

function populateSelects() {
  const selectA = document.getElementById('select-a');
  const selectB = document.getElementById('select-b');

  [selectA, selectB].forEach(select => {
    select.innerHTML = '';
    PHILOSOPHERS.forEach(name => {
      const opt = document.createElement('option');
      opt.value = name;
      opt.textContent = name;
      select.appendChild(opt);
    });
  });

  selectA.value = PHILOSOPHERS[0];
  selectB.value = PHILOSOPHERS[3];
}

function initEvents() {
  document.getElementById('lang-toggle').addEventListener('click', () => {
    localStorage.setItem('artefactos_lang', lang === 'es' ? 'en' : 'es');
    location.reload();
  });

  document.getElementById('btn-start').addEventListener('click', startDuel);
  document.getElementById('btn-next').addEventListener('click', nextRound);
  document.getElementById('btn-verdict').addEventListener('click', requestVerdict);
  document.getElementById('btn-new').addEventListener('click', resetDuel);
}

async function startDuel() {
  philosopherA = document.getElementById('select-a').value;
  philosopherB = document.getElementById('select-b').value;
  topic = document.getElementById('topic-input').value.trim();

  if (!topic) return;
  if (philosopherA === philosopherB) { alert(t.diffAlert); return; }

  currentRound = 0;
  debateHistory = [];

  document.getElementById('duelo-setup').style.display = 'none';
  document.getElementById('duelo-arena').classList.add('active');

  document.getElementById('name-a').textContent = philosopherA;
  document.getElementById('name-b').textContent = philosopherB;
  document.getElementById('portrait-a').innerHTML = PORTRAITS[philosopherA] || '';
  document.getElementById('portrait-b').innerHTML = PORTRAITS[philosopherB] || '';
  document.getElementById('arena-topic').textContent = topic;
  document.getElementById('debate-rounds').innerHTML = '';
  document.getElementById('duelo-verdict').classList.remove('active');

  await nextRound();
}

async function nextRound() {
  if (currentRound >= MAX_ROUNDS) return;
  currentRound++;

  const loader = document.getElementById('duelo-loader');
  const errorBox = document.getElementById('duelo-error');
  const btnNext = document.getElementById('btn-next');
  const btnVerdict = document.getElementById('btn-verdict');

  btnNext.disabled = true;
  btnVerdict.disabled = true;
  errorBox.classList.remove('active');
  loader.classList.add('active');

  document.getElementById('round-label').textContent = `${t.round} ${currentRound} ${t.of} ${MAX_ROUNDS}`;

  try {
    const answer = await askGroq({
      systemPrompt: getDebatePrompt(philosopherA, philosopherB, topic, debateHistory),
      userMessage: lang === 'es'
        ? `Ronda ${currentRound}. Genera las intervenciones.`
        : `Round ${currentRound}. Generate the speeches.`,
      temperature: 0.85,
      maxTokens: 600
    });

    debateHistory.push(answer);

    const { speechA, speechB } = parseSpeeches(answer, philosopherA, philosopherB);
    addRoundToDOM(currentRound, speechA, speechB);
    showSpeaking('a', speechA);
    setTimeout(() => showSpeaking('b', speechB), 800);
  } catch (err) {
    errorBox.textContent = t.error + ' — ' + err.message;
    errorBox.classList.add('active');
  } finally {
    loader.classList.remove('active');
    btnNext.disabled = currentRound >= MAX_ROUNDS;
    btnVerdict.disabled = false;
  }
}

function parseSpeeches(text, philA, philB) {
  const lines = text.split('\n').filter(l => l.trim());
  let speechA = '';
  let speechB = '';
  let currentSpeaker = null;

  for (const line of lines) {
    if (line.includes(philA + ':') || line.startsWith(philA)) {
      currentSpeaker = 'a';
      speechA += line.replace(new RegExp(`^${escapeRegex(philA)}:\\s*[""]?`), '').replace(/[""]$/, '') + ' ';
    } else if (line.includes(philB + ':') || line.startsWith(philB)) {
      currentSpeaker = 'b';
      speechB += line.replace(new RegExp(`^${escapeRegex(philB)}:\\s*[""]?`), '').replace(/[""]$/, '') + ' ';
    } else if (currentSpeaker === 'a') {
      speechA += line.replace(/^[""]|[""]$/g, '') + ' ';
    } else if (currentSpeaker === 'b') {
      speechB += line.replace(/^[""]|[""]$/g, '') + ' ';
    }
  }

  if (!speechA && !speechB) {
    const half = Math.floor(text.length / 2);
    speechA = text.substring(0, half);
    speechB = text.substring(half);
  }

  return { speechA: speechA.trim(), speechB: speechB.trim() };
}

function showSpeaking(side, text) {
  const colA = document.getElementById('column-a');
  const colB = document.getElementById('column-b');

  if (side === 'a') {
    colA.classList.add('speaking');
    colA.classList.remove('silent');
    colB.classList.add('silent');
    colB.classList.remove('speaking');
    document.getElementById('speech-a').textContent = text;
  } else {
    colB.classList.add('speaking');
    colB.classList.remove('silent');
    colA.classList.remove('speaking');
    colA.classList.remove('silent');
    document.getElementById('speech-b').textContent = text;
  }
}

function addRoundToDOM(roundNum, speechA, speechB) {
  const container = document.getElementById('debate-rounds');
  const block = document.createElement('div');
  block.className = 'duelo-round-block';
  block.innerHTML = `
    <div class="duelo-round-label">${t.round} ${roundNum}</div>
    <div class="duelo-columns">
      <div class="duelo-column duelo-column--a">
        <div class="duelo-column__name">${escapeHtml(philosopherA)}</div>
        <div class="duelo-column__speech">${escapeHtml(speechA)}</div>
      </div>
      <div class="duelo-column duelo-column--b">
        <div class="duelo-column__name">${escapeHtml(philosopherB)}</div>
        <div class="duelo-column__speech">${escapeHtml(speechB)}</div>
      </div>
    </div>
  `;
  container.appendChild(block);
}

async function requestVerdict() {
  if (debateHistory.length === 0) return;

  const loader = document.getElementById('duelo-loader');
  const errorBox = document.getElementById('duelo-error');
  const btnVerdict = document.getElementById('btn-verdict');
  const btnNext = document.getElementById('btn-next');

  btnVerdict.disabled = true;
  btnNext.disabled = true;
  errorBox.classList.remove('active');
  loader.classList.add('active');

  try {
    const verdict = await askGroq({
      systemPrompt: getVerdictPrompt(philosopherA, philosopherB, topic, debateHistory),
      userMessage: lang === 'es' ? 'Emite tu veredicto.' : 'Give your verdict.',
      temperature: 0.7,
      maxTokens: 400
    });

    const verdictBox = document.getElementById('duelo-verdict');
    document.getElementById('verdict-text').textContent = verdict;
    verdictBox.classList.add('active');
  } catch (err) {
    errorBox.textContent = t.error + ' — ' + err.message;
    errorBox.classList.add('active');
  } finally {
    loader.classList.remove('active');
    btnVerdict.disabled = true;
  }
}

function resetDuel() {
  currentRound = 0;
  debateHistory = [];
  philosopherA = '';
  philosopherB = '';
  topic = '';

  document.getElementById('duelo-arena').classList.remove('active');
  document.getElementById('duelo-setup').style.display = 'block';
  document.getElementById('topic-input').value = '';
  document.getElementById('duelo-verdict').classList.remove('active');
  document.getElementById('debate-rounds').innerHTML = '';
  document.getElementById('speech-a').textContent = '';
  document.getElementById('speech-b').textContent = '';
  document.getElementById('duelo-error').classList.remove('active');
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
