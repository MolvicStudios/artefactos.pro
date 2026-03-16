// artefactos/sinfonia/sinfonia.js
import { askGroq, hasApiKey } from '../../../js/groq.js';
import { renderApiKeyPanel, renderChangeKeyButton } from '../../../js/apikey-panel.js';

const lang = () => localStorage.getItem('artefactos_lang') || 'es';
function setLang(l) { localStorage.setItem('artefactos_lang', l); }

const TXT = {
  es: {
    back: '← Volver', title: 'Sinfonía Generativa',
    desc: 'Composiciones únicas generadas por IA',
    loading: 'Componiendo...', selectMood: '— Estado de ánimo —',
    compose: 'Componer', play: '▶ Reproducir', pause: '⏸ Pausar',
    newComp: '✦ Nueva', meditation: 'Meditación', volume: 'Vol',
    composerNote: 'Nota del compositor',
    mood_melancholy: 'Melancolía', mood_euphoria: 'Euforia',
    mood_mystery: 'Misterio', mood_chaos: 'Caos',
    mood_serenity: 'Serenidad', mood_nostalgia: 'Nostalgia',
    mood_terror: 'Terror', mood_ecstasy: 'Éxtasis'
  },
  en: {
    back: '← Back', title: 'Generative Symphony',
    desc: 'Unique AI-generated compositions',
    loading: 'Composing...', selectMood: '— Mood —',
    compose: 'Compose', play: '▶ Play', pause: '⏸ Pause',
    newComp: '✦ New', meditation: 'Meditation', volume: 'Vol',
    composerNote: 'Composer note',
    mood_melancholy: 'Melancholy', mood_euphoria: 'Euphoria',
    mood_mystery: 'Mystery', mood_chaos: 'Chaos',
    mood_serenity: 'Serenity', mood_nostalgia: 'Nostalgia',
    mood_terror: 'Terror', mood_ecstasy: 'Ecstasy'
  }
};
function T(key) { return (TXT[lang()] || TXT.es)[key] || key; }

const SCALES = {
  mayor:       [0,2,4,5,7,9,11],
  menor:       [0,2,3,5,7,8,10],
  frigio:      [0,1,3,5,7,8,10],
  lidio:       [0,2,4,6,7,9,11],
  dorico:      [0,2,3,5,7,9,10],
  cromatico:   [0,1,2,3,4,5,6,7,8,9,10,11],
  pentatonico: [0,2,4,7,9]
};

const MOODS = [
  { key: 'mood_melancholy', val: 'Melancolía' },
  { key: 'mood_euphoria',   val: 'Euforia' },
  { key: 'mood_mystery',    val: 'Misterio' },
  { key: 'mood_chaos',      val: 'Caos' },
  { key: 'mood_serenity',   val: 'Serenidad' },
  { key: 'mood_nostalgia',  val: 'Nostalgia' },
  { key: 'mood_terror',     val: 'Terror' },
  { key: 'mood_ecstasy',    val: 'Éxtasis' }
];

let audioCtx = null;
let masterGain = null;
let composition = null;
let isPlaying = false;
let isMeditation = false;
let noteTimer = null;
let animFrameId = null;
let particles = [];
let activeOscillators = [];
let currentNoteIdx = 0;
let canvas, ctx;

function init() {
  if (!hasApiKey()) {
    renderApiKeyPanel('app-container', () => renderArtefacto(), lang());
  } else {
    renderArtefacto();
  }
}

function renderArtefacto() {
  const app = document.getElementById('app-container');
  document.body.className = 'sinfonia-page';

  app.innerHTML = `
    <header class="sinfonia-header">
      <a href="../../../index.html" class="sinfonia-back">${T('back')}</a>
      <button class="sinfonia-lang" id="lang-toggle">${lang() === 'es' ? 'EN' : 'ES'}</button>
    </header>
    <div class="sinfonia-canvas-wrap">
      <canvas id="sinfonia-canvas"></canvas>
      <div class="sinfonia-title-overlay" id="title-overlay">
        <div class="sinfonia-piece-title" id="piece-title">${T('title')}</div>
        <div class="sinfonia-piece-subtitle" id="piece-subtitle">${T('desc')}</div>
        <div class="sinfonia-composer-note" id="composer-note"></div>
      </div>
      <div class="sinfonia-loading" id="loading" style="display:none">${T('loading')}</div>
    </div>
    <div class="sinfonia-controls">
      <div class="sinfonia-controls__row">
        <select class="sinfonia-mood-select" id="mood-select">
          <option value="" disabled selected>${T('selectMood')}</option>
          ${MOODS.map(m => `<option value="${m.val}">${T(m.key)}</option>`).join('')}
        </select>
        <button class="sinfonia-btn sinfonia-btn--primary" id="btn-compose">${T('compose')}</button>
        <button class="sinfonia-btn" id="btn-play" disabled>${T('play')}</button>
        <button class="sinfonia-btn sinfonia-btn--cyan" id="btn-new" disabled>${T('newComp')}</button>
        <button class="sinfonia-btn" id="btn-meditation" disabled>${T('meditation')}</button>
        <div class="sinfonia-volume">
          <span class="sinfonia-volume__label">${T('volume')}</span>
          <input type="range" class="sinfonia-volume__slider" id="volume-slider" min="0" max="100" value="60">
        </div>
      </div>
    </div>
  `;

  renderChangeKeyButton('apikey-change-container', lang());
  setupCanvas();
  bindEvents();
  startVisualization();
}

function setupCanvas() {
  canvas = document.getElementById('sinfonia-canvas');
  ctx = canvas.getContext('2d');
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);
}

function resizeCanvas() {
  const wrap = canvas.parentElement;
  const dpr = window.devicePixelRatio || 1;
  const w = wrap.clientWidth;
  const h = wrap.clientHeight;
  canvas.width = w * dpr;
  canvas.height = h * dpr;
  canvas.style.width = w + 'px';
  canvas.style.height = h + 'px';
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

function bindEvents() {
  document.getElementById('lang-toggle').addEventListener('click', () => {
    setLang(lang() === 'es' ? 'en' : 'es');
    stopAudio();
    renderArtefacto();
  });
  document.getElementById('btn-compose').addEventListener('click', compose);
  document.getElementById('btn-play').addEventListener('click', togglePlay);
  document.getElementById('btn-new').addEventListener('click', newComposition);
  document.getElementById('btn-meditation').addEventListener('click', toggleMeditation);
  document.getElementById('volume-slider').addEventListener('input', e => {
    if (masterGain) masterGain.gain.value = e.target.value / 100;
  });
}

async function compose() {
  const mood = document.getElementById('mood-select').value;
  if (!mood) return;

  const loading = document.getElementById('loading');
  const btn = document.getElementById('btn-compose');
  loading.style.display = 'block';
  btn.disabled = true;

  try {
    const data = await callGroq(mood);
    if (data) {
      composition = data;
      displayComposition();
      document.getElementById('btn-play').disabled = false;
      document.getElementById('btn-new').disabled = false;
      document.getElementById('btn-meditation').disabled = false;
    }
  } finally {
    loading.style.display = 'none';
    btn.disabled = false;
  }
}

async function callGroq(mood) {
  const systemPrompt = `Eres un compositor algorítmico. Genera parámetros de composición musical generativa para el estado de ánimo: "${mood}".
Responde SOLO con JSON válido (sin markdown, sin texto antes ni después):
{
  "titulo": "nombre poético de la pieza",
  "subtitulo": "descripción breve evocadora",
  "nota_compositor": "nota del compositor en primera persona (1-2 frases poéticas)",
  "tempo_bpm": (número 40-180),
  "escala": "(mayor|menor|frigio|lidio|dorico|cromatico|pentatonico)",
  "frecuencia_base_hz": (número 110-880),
  "oscilador_tipo": "(sine|triangle|sawtooth|square)",
  "reverb_nivel": (0.0-1.0),
  "distorsion_nivel": (0.0-0.5),
  "densidad_particulas": (10-200),
  "color_primario_hex": "#rrggbb",
  "color_secundario_hex": "#rrggbb",
  "capas": (1-5),
  "instrumentos_evocados": ["inst1","inst2"],
  "evoca": "descripción"
}`;

  try {
    const raw = await askGroq({
      systemPrompt,
      userMessage: `Estado de ánimo: ${mood}. Genera una composición única y sorprendente.`,
      temperature: 0.9,
      maxTokens: 500
    });
    return parseJSON(raw);
  } catch (err) {
    if (err.message === 'NO_KEY' || err.message === 'INVALID_KEY') {
      renderApiKeyPanel('app-container', () => renderArtefacto(), lang());
      return null;
    }
    console.error('Groq error:', err);
    return null;
  }
}

function parseJSON(raw) {
  try { return JSON.parse(raw); } catch { /* fallback */ }
  const s = raw.indexOf('{');
  const e = raw.lastIndexOf('}');
  if (s !== -1 && e > s) {
    try { return JSON.parse(raw.slice(s, e + 1)); } catch { /* ignore */ }
  }
  return null;
}

function displayComposition() {
  document.getElementById('title-overlay').classList.remove('faded');
  document.getElementById('piece-title').textContent = composition.titulo || 'Untitled';
  document.getElementById('piece-subtitle').textContent = composition.subtitulo || '';
  document.getElementById('composer-note').textContent =
    `${T('composerNote')}: "${composition.nota_compositor || ''}"`;
}

/* ─────────── Audio Engine ─────────── */
function ensureAudioCtx() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    masterGain = audioCtx.createGain();
    masterGain.gain.value = (document.getElementById('volume-slider')?.value || 60) / 100;
    masterGain.connect(audioCtx.destination);
  }
  if (audioCtx.state === 'suspended') audioCtx.resume();
}

function togglePlay() {
  if (!composition) return;
  const btn = document.getElementById('btn-play');
  if (isPlaying) {
    stopAudio();
    btn.textContent = T('play');
    document.getElementById('title-overlay').classList.remove('faded');
  } else {
    startAudio();
    btn.textContent = T('pause');
    document.getElementById('title-overlay').classList.add('faded');
  }
}

function startAudio() {
  ensureAudioCtx();
  isPlaying = true;
  currentNoteIdx = 0;
  scheduleNote();
}

function stopAudio() {
  isPlaying = false;
  if (noteTimer) { clearTimeout(noteTimer); noteTimer = null; }
  activeOscillators.forEach(o => { try { o.stop(); } catch { /* already stopped */ } });
  activeOscillators = [];
}

function scheduleNote() {
  if (!isPlaying || !composition) return;

  const scale = SCALES[composition.escala] || SCALES.menor;
  const baseFreq = composition.frecuencia_base_hz || 220;
  const tempo = Math.max(40, Math.min(180, composition.tempo_bpm || 80));
  const noteDur = 60 / tempo;
  const layers = Math.min(composition.capas || 2, 5);
  const oscType = composition.oscilador_tipo || 'sine';

  for (let i = 0; i < layers; i++) {
    const octOff = i - Math.floor(layers / 2);
    const semitone = scale[currentNoteIdx % scale.length];
    const octave = Math.floor(currentNoteIdx / scale.length) + octOff;
    const freq = baseFreq * Math.pow(2, (semitone + octave * 12) / 12);
    if (freq > 20 && freq < 4000) playNote(freq, oscType, noteDur, layers);
  }

  currentNoteIdx++;
  if (isMeditation) currentNoteIdx = currentNoteIdx % scale.length;

  const jitter = isMeditation
    ? Math.random() * noteDur * 500
    : Math.random() * noteDur * 150;
  noteTimer = setTimeout(scheduleNote, noteDur * 1000 + jitter);
}

function playNote(freq, type, dur, layers) {
  const now = audioCtx.currentTime;
  const osc = audioCtx.createOscillator();
  const noteGain = audioCtx.createGain();

  osc.type = type;
  osc.frequency.setValueAtTime(freq, now);
  osc.detune.setValueAtTime((Math.random() - 0.5) * 12, now);

  const vol = 0.15 / layers;
  noteGain.gain.setValueAtTime(0, now);
  noteGain.gain.linearRampToValueAtTime(vol, now + dur * 0.1);
  noteGain.gain.setValueAtTime(vol, now + dur * 0.3);
  noteGain.gain.exponentialRampToValueAtTime(0.001, now + dur * 0.95);

  osc.connect(noteGain);

  if ((composition.reverb_nivel || 0) > 0.15) {
    const delay = audioCtx.createDelay();
    delay.delayTime.value = 0.12 + composition.reverb_nivel * 0.25;
    const dGain = audioCtx.createGain();
    dGain.gain.value = composition.reverb_nivel * 0.35;
    noteGain.connect(delay);
    delay.connect(dGain);
    dGain.connect(masterGain);
  }

  noteGain.connect(masterGain);
  osc.start(now);
  osc.stop(now + dur);
  activeOscillators.push(osc);
  osc.onended = () => {
    const idx = activeOscillators.indexOf(osc);
    if (idx > -1) activeOscillators.splice(idx, 1);
  };

  emitNoteParticles(freq);
}

/* ─────────── Visualization ─────────── */
function emitNoteParticles(freq) {
  const w = canvas.width / (window.devicePixelRatio || 1);
  const h = canvas.height / (window.devicePixelRatio || 1);
  const count = Math.ceil(Math.min(composition?.densidad_particulas || 30, 200) / 10);
  for (let i = 0; i < count; i++) {
    particles.push({
      x: w / 2 + (Math.random() - 0.5) * w * 0.3,
      y: h / 2 + (Math.random() - 0.5) * h * 0.3,
      vx: (Math.random() - 0.5) * 3,
      vy: (Math.random() - 0.5) * 3,
      life: 1.0,
      decay: 0.005 + Math.random() * 0.015,
      radius: 1 + Math.random() * 3,
      freq,
      isPrimary: Math.random() > 0.5
    });
  }
}

function startVisualization() {
  if (animFrameId) cancelAnimationFrame(animFrameId);
  animLoop();
}

function animLoop() {
  const dpr = window.devicePixelRatio || 1;
  const w = canvas.width / dpr;
  const h = canvas.height / dpr;

  ctx.fillStyle = 'rgba(5, 5, 8, 0.12)';
  ctx.fillRect(0, 0, w, h);

  drawLissajous(w, h);
  drawParticles(w, h);

  animFrameId = requestAnimationFrame(animLoop);
}

function drawLissajous(w, h) {
  if (!composition || !isPlaying) return;

  const primary = composition.color_primario_hex || '#7b2fff';
  const time = performance.now() / 1000;
  const ratio = ((composition.frecuencia_base_hz || 220) % 7) + 1;
  const phase = time * 0.5;

  ctx.beginPath();
  ctx.strokeStyle = primary;
  ctx.lineWidth = 1;
  ctx.globalAlpha = 0.3;
  for (let i = 0; i <= 360; i++) {
    const a = (i * Math.PI) / 180;
    const x = w / 2 + Math.sin(a * ratio + phase) * w * 0.3;
    const y = h / 2 + Math.cos(a + phase * 0.7) * h * 0.3;
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  }
  ctx.stroke();
  ctx.globalAlpha = 1;
}

function drawParticles(w, h) {
  const primary = composition?.color_primario_hex || '#7b2fff';
  const secondary = composition?.color_secundario_hex || '#00e5ff';

  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.x += p.vx;
    p.y += p.vy;
    p.vx *= 0.99;
    p.vy *= 0.99;
    p.life -= p.decay;

    if (p.life <= 0) { particles.splice(i, 1); continue; }

    const col = p.isPrimary ? primary : secondary;

    ctx.beginPath();
    ctx.globalAlpha = p.life * 0.12;
    ctx.fillStyle = col;
    ctx.arc(p.x, p.y, p.radius * 3, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.globalAlpha = p.life * 0.7;
    ctx.fillStyle = col;
    ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

function newComposition() {
  stopAudio();
  const playBtn = document.getElementById('btn-play');
  playBtn.textContent = T('play');
  playBtn.disabled = true;
  document.getElementById('btn-new').disabled = true;
  document.getElementById('btn-meditation').disabled = true;

  composition = null;
  isMeditation = false;
  currentNoteIdx = 0;
  particles = [];

  document.getElementById('title-overlay').classList.remove('faded');
  document.getElementById('piece-title').textContent = T('title');
  document.getElementById('piece-subtitle').textContent = T('desc');
  document.getElementById('composer-note').textContent = '';

  compose();
}

function toggleMeditation() {
  isMeditation = !isMeditation;
  const btn = document.getElementById('btn-meditation');
  btn.style.borderColor = isMeditation ? '#00e5ff' : '';
  btn.style.color = isMeditation ? '#00e5ff' : '';
}

document.addEventListener('DOMContentLoaded', init);
