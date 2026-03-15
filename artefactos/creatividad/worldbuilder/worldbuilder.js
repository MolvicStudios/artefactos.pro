// worldbuilder.js — Constructor de Mundos
// Genera mundos ficticios completos con 7 secciones y generador de personajes

import { askGroq, hasApiKey } from '../../../js/groq.js';
import { renderApiKeyPanel, renderChangeKeyButton } from '../../../js/apikey-panel.js';

const lang = localStorage.getItem('artefactos_lang') || 'es';
let generoActivo = 'Fantasía';
let generando = false;
let mundoActual = null;

const SECCIONES = [
  { key: 'geografia', icon: '🌍' },
  { key: 'cultura', icon: '🏛️' },
  { key: 'politica', icon: '⚔️' },
  { key: 'magia_tecnologia', icon: '✨' },
  { key: 'historia', icon: '📜' },
  { key: 'economia', icon: '💰' },
  { key: 'conflicto', icon: '🔥' }
];

const txt = {
  es: {
    titulo: 'Worldbuilder', sub: 'Describe una premisa y genera un mundo completo.',
    premisa_ph: 'Ej: un archipiélago donde la magia proviene del canto de las ballenas',
    nombre_ph: 'Nombre del mundo (opcional)',
    genero: 'Género',
    generos: ['Fantasía', 'Ciencia ficción', 'Steampunk', 'Post-apocalíptico', 'Mitológico', 'Cyberpunk'],
    generar: 'Construir mundo', generando: 'Construyendo...',
    regenerarSec: '↻', personaje: 'Generar personaje',
    exportar: '↓ Exportar .txt',
    secciones: ['Geografía y entorno', 'Cultura y sociedad', 'Política y poder', 'Magia / Tecnología', 'Historia y mitos', 'Economía y recursos', 'Conflicto central'],
    badge: 'creatividad', galeria: '← Galería',
    error: 'Error al generar. Intenta de nuevo.',
    errorSec: 'Error al regenerar sección.'
  },
  en: {
    titulo: 'Worldbuilder', sub: 'Describe a premise and generate a complete world.',
    premisa_ph: 'Ex: an archipelago where magic comes from whale songs',
    nombre_ph: 'World name (optional)',
    genero: 'Genre',
    generos: ['Fantasy', 'Science Fiction', 'Steampunk', 'Post-apocalyptic', 'Mythological', 'Cyberpunk'],
    generar: 'Build world', generando: 'Building...',
    regenerarSec: '↻', personaje: 'Generate character',
    exportar: '↓ Export .txt',
    secciones: ['Geography & Environment', 'Culture & Society', 'Politics & Power', 'Magic / Technology', 'History & Myths', 'Economy & Resources', 'Central Conflict'],
    badge: 'creativity', galeria: '← Gallery',
    error: 'Error generating. Try again.',
    errorSec: 'Error regenerating section.'
  }
};
const t = txt[lang] || txt.es;

function init() {
  if (!hasApiKey()) { renderApiKeyPanel('app', () => renderArtefacto(), lang); return; }
  renderArtefacto();
}

function renderArtefacto() {
  const app = document.getElementById('app');
  mundoActual = null;
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
      <div class="form-row">
        <input type="text" id="premisa-input" class="campo" placeholder="${t.premisa_ph}" maxlength="300" />
        <input type="text" id="nombre-input" class="campo" placeholder="${t.nombre_ph}" maxlength="60" style="max-width:200px;" />
      </div>
      <div class="selector-grupo">
        <span class="selector-label">${t.genero}</span>
        <div class="pills" id="genero-pills">
          ${t.generos.map((g, i) => `<button class="pill${txt.es.generos[i] === generoActivo ? ' active' : ''}" data-val="${txt.es.generos[i]}">${g}</button>`).join('')}
        </div>
      </div>
      <button id="btn-generar" class="btn-principal">${t.generar}</button>
      <div id="mundo-resultado"></div>
      <div id="personaje-zona"></div>
      <div id="acciones-post" class="acciones-post" style="display:none">
        <button id="btn-personaje" class="btn-sec">${t.personaje}</button>
        <button id="btn-exportar" class="btn-sec">${t.exportar}</button>
      </div>
    </div>
  `;
  renderChangeKeyButton('key-btn-wrap', lang);

  document.getElementById('genero-pills').addEventListener('click', e => {
    const p = e.target.closest('.pill'); if (!p) return;
    document.querySelectorAll('#genero-pills .pill').forEach(x => x.classList.remove('active'));
    p.classList.add('active'); generoActivo = p.dataset.val;
  });
  document.getElementById('btn-generar').addEventListener('click', generarMundo);
  document.getElementById('btn-personaje').addEventListener('click', generarPersonaje);
  document.getElementById('btn-exportar').addEventListener('click', exportarTxt);
}

async function generarMundo() {
  const premisa = document.getElementById('premisa-input').value.trim();
  const nombre = document.getElementById('nombre-input').value.trim();
  if (!premisa || generando) return;

  const btn = document.getElementById('btn-generar');
  const zona = document.getElementById('mundo-resultado');
  generando = true; btn.disabled = true; btn.textContent = t.generando;
  zona.innerHTML = '<p class="loading">...</p>';

  const idioma = lang === 'en' ? 'English' : 'Spanish';
  const systemPrompt = `Eres un escritor de worldbuilding experto, con el detalle de Tolkien y la imaginación de Ursula K. Le Guin. Responde en ${idioma}.
Premisa: ${premisa}
${nombre ? `Nombre del mundo: ${nombre}` : 'Inventa un nombre evocador para el mundo.'}
Género: ${generoActivo}

Genera un mundo completo. Responde SOLO en JSON (sin markdown):
{
  "nombre_mundo": "...",
  "geografia": "Descripción detallada de la geografía, clima, ecosistemas (80-120 palabras)",
  "cultura": "Sociedad, tradiciones, lenguas, religión (80-120 palabras)",
  "politica": "Sistema de gobierno, facciones, conflictos de poder (80-120 palabras)",
  "magia_tecnologia": "Sistema de magia o nivel tecnológico, reglas, limitaciones (80-120 palabras)",
  "historia": "Eventos históricos clave, mitos fundacionales (80-120 palabras)",
  "economia": "Recursos, comercio, moneda, riqueza y pobreza (60-100 palabras)",
  "conflicto": "El conflicto central del mundo, tensiones latentes (60-100 palabras)"
}`;

  try {
    const raw = await llamarGroq({ systemPrompt, userMessage: premisa, temperature: 0.9, maxTokens: 1500 });
    if (!raw) return;
    const mundo = parseJSON(raw);
    if (!mundo || !mundo.geografia) throw new Error('parse');
    mundoActual = { ...mundo, premisa, genero: generoActivo };
    renderMundo();
    document.getElementById('acciones-post').style.display = 'flex';
  } catch { zona.innerHTML = `<p class="loading">${t.error}</p>`; }
  finally { generando = false; btn.disabled = false; btn.textContent = t.generar; }
}

function renderMundo() {
  const zona = document.getElementById('mundo-resultado');
  zona.innerHTML = `<div class="world-secciones">
    ${SECCIONES.map((sec, i) => `
      <div class="world-panel${i === 0 ? ' open' : ''}" data-key="${sec.key}" style="animation-delay:${i * 0.08}s">
        <div class="world-panel-header">
          <div>
            <span class="panel-icon">${sec.icon}</span>
            <span class="panel-titulo">${t.secciones[i]}</span>
          </div>
          <div class="panel-acciones">
            <button class="btn-mini btn-regen" data-key="${sec.key}" title="${t.regenerarSec}">${t.regenerarSec}</button>
            <span class="panel-flecha">▸</span>
          </div>
        </div>
        <div class="panel-body"><p>${mundoActual[sec.key] || ''}</p></div>
      </div>
    `).join('')}
  </div>`;

  // Toggle panels
  zona.querySelectorAll('.world-panel-header').forEach(header => {
    header.addEventListener('click', e => {
      if (e.target.closest('.btn-regen')) return;
      header.closest('.world-panel').classList.toggle('open');
    });
  });

  // Regenerar sección individual
  zona.querySelectorAll('.btn-regen').forEach(btn => {
    btn.addEventListener('click', () => regenerarSeccion(btn.dataset.key));
  });
}

async function regenerarSeccion(key) {
  if (generando || !mundoActual) return;
  generando = true;

  const panel = document.querySelector(`.world-panel[data-key="${key}"]`);
  const body = panel.querySelector('.panel-body p');
  const original = body.textContent;
  body.textContent = '...';
  panel.classList.add('open');

  const secIdx = SECCIONES.findIndex(s => s.key === key);
  const secNombre = t.secciones[secIdx];
  const idioma = lang === 'en' ? 'English' : 'Spanish';

  const systemPrompt = `Eres un worldbuilder experto. Regenera SOLO la sección "${secNombre}" para este mundo. Responde en ${idioma}.
Mundo: ${mundoActual.nombre_mundo}
Premisa: ${mundoActual.premisa}
Género: ${mundoActual.genero}

Contexto del mundo existente (otras secciones):
${SECCIONES.filter(s => s.key !== key).map(s => `${s.key}: ${mundoActual[s.key]}`).join('\n')}

Genera una versión NUEVA y DIFERENTE de la sección "${secNombre}". 80-120 palabras. Responde SOLO con el texto, sin JSON ni formato.`;

  try {
    const raw = await llamarGroq({ systemPrompt, userMessage: `Regenera: ${secNombre}`, temperature: 0.95, maxTokens: 300 });
    if (!raw) { body.textContent = original; return; }
    mundoActual[key] = raw.trim();
    body.textContent = mundoActual[key];
  } catch { body.textContent = original; }
  finally { generando = false; }
}

async function generarPersonaje() {
  if (generando || !mundoActual) return;
  generando = true;

  const zona = document.getElementById('personaje-zona');
  zona.innerHTML = '<p class="loading">...</p>';

  const idioma = lang === 'en' ? 'English' : 'Spanish';
  const systemPrompt = `Eres un escritor experto en creación de personajes. Responde en ${idioma}.
Crea un personaje memorable que habite este mundo:
Mundo: ${mundoActual.nombre_mundo}
Geografía: ${mundoActual.geografia}
Cultura: ${mundoActual.cultura}
Magia/Tech: ${mundoActual.magia_tecnologia}
Conflicto: ${mundoActual.conflicto}

Responde SOLO en JSON:
{
  "nombre": "nombre del personaje",
  "rol": "su rol en el mundo (1 línea)",
  "descripcion": "apariencia y personalidad (2-3 oraciones)",
  "motivacion": "qué lo mueve (1-2 oraciones)",
  "secreto": "un secreto oscuro o interesante (1 oración)"
}`;

  try {
    const raw = await llamarGroq({ systemPrompt, userMessage: 'Genera personaje', temperature: 0.9, maxTokens: 400 });
    if (!raw) return;
    const p = parseJSON(raw);
    if (!p || !p.nombre) throw new Error('parse');
    zona.innerHTML = `
      <div class="personaje-card">
        <div class="personaje-nombre">${p.nombre} — ${p.rol}</div>
        <p>${p.descripcion}</p>
        <p style="margin-top:0.4rem;"><strong style="color:var(--acento);">⚡</strong> ${p.motivacion}</p>
        <p style="margin-top:0.3rem;opacity:0.7;font-style:italic;">🤫 ${p.secreto}</p>
      </div>`;
  } catch { zona.innerHTML = `<p class="loading">${t.error}</p>`; }
  finally { generando = false; }
}

function exportarTxt() {
  if (!mundoActual) return;
  let texto = `=== ${mundoActual.nombre_mundo} ===\n\n`;
  SECCIONES.forEach((sec, i) => {
    texto += `--- ${t.secciones[i]} ---\n${mundoActual[sec.key]}\n\n`;
  });
  const blob = new Blob([texto], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = `${mundoActual.nombre_mundo || 'mundo'}.txt`;
  document.body.appendChild(a); a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function parseJSON(raw) {
  try {
    let limpio = raw.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
    const inicio = limpio.indexOf('{');
    const fin = limpio.lastIndexOf('}');
    if (inicio >= 0 && fin > inicio) limpio = limpio.substring(inicio, fin + 1);
    return JSON.parse(limpio);
  } catch { return null; }
}

async function llamarGroq(params) {
  try { return await askGroq(params); }
  catch (err) {
    if (err.message === 'NO_KEY' || err.message === 'INVALID_KEY') {
      renderApiKeyPanel('app', () => renderArtefacto(), lang); return null;
    }
    throw err;
  }
}

document.addEventListener('DOMContentLoaded', init);
