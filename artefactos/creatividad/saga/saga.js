// saga.js — Generador de Sagas
// Trilogías con portadas, sinopsis y link al Continuador vía localStorage

import { askGroq, hasApiKey } from '../../../js/groq.js';
import { renderApiKeyPanel, renderChangeKeyButton } from '../../../js/apikey-panel.js';

const lang = localStorage.getItem('artefactos_lang') || 'es';
let generoActivo = 'Fantasía';
let generando = false;
let sagaActual = null;

const txt = {
  es: {
    titulo: 'Generador de Sagas',
    sub: 'Describe una idea y genera una trilogía completa con sinopsis.',
    premisa_ph: 'Ej: una bibliotecaria descubre que los libros abren portales a otros mundos',
    protagonista_ph: 'Protagonista (ej: Alma, 28 años, bibliotecaria)',
    genero: 'Género',
    generos: ['Fantasía', 'Ciencia ficción', 'Thriller', 'Romance épico', 'Histórica', 'Terror'],
    generar: 'Generar trilogía', generando: 'Generando...',
    expandir: 'Expandir', continuarEn: '→ Continuador',
    exportar: '↓ Exportar',
    libro: 'Libro', temas: 'Temas',
    badge: 'creatividad', galeria: '← Galería',
    error: 'Error al generar. Intenta de nuevo.'
  },
  en: {
    titulo: 'Saga Generator',
    sub: 'Describe an idea and generate a complete trilogy with synopses.',
    premisa_ph: 'E.g., a librarian discovers books open portals to other worlds',
    protagonista_ph: 'Protagonist (e.g., Alma, 28, librarian)',
    genero: 'Genre',
    generos: ['Fantasy', 'Science Fiction', 'Thriller', 'Epic Romance', 'Historical', 'Horror'],
    generar: 'Generate trilogy', generando: 'Generating...',
    expandir: 'Expand', continuarEn: '→ Continuator',
    exportar: '↓ Export',
    libro: 'Book', temas: 'Themes',
    badge: 'creativity', galeria: '← Gallery',
    error: 'Error generating. Try again.'
  }
};
const t = txt[lang] || txt.es;

function init() {
  if (!hasApiKey()) { renderApiKeyPanel('app', () => renderArtefacto(), lang); return; }
  renderArtefacto();
}

function renderArtefacto() {
  const app = document.getElementById('app');
  sagaActual = null;
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
      <div class="form-stack">
        <input type="text" id="premisa-input" class="campo" placeholder="${t.premisa_ph}" maxlength="300" />
        <input type="text" id="protagonista-input" class="campo" placeholder="${t.protagonista_ph}" maxlength="120" />
      </div>
      <div class="selector-grupo">
        <span class="selector-label">${t.genero}</span>
        <div class="pills" id="genero-pills">
          ${t.generos.map((g, i) => `<button class="pill${txt.es.generos[i] === generoActivo ? ' active' : ''}" data-val="${txt.es.generos[i]}">${g}</button>`).join('')}
        </div>
      </div>
      <button id="btn-generar" class="btn-principal">${t.generar}</button>
      <div id="libros-zona"></div>
      <div id="expandido-zona"></div>
      <div id="acciones-post" class="acciones-post" style="display:none">
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
  document.getElementById('btn-generar').addEventListener('click', generarSaga);
  document.getElementById('btn-exportar').addEventListener('click', exportarTxt);
}

async function generarSaga() {
  const premisa = document.getElementById('premisa-input').value.trim();
  const protagonista = document.getElementById('protagonista-input').value.trim();
  if (!premisa || generando) return;

  const btn = document.getElementById('btn-generar');
  const zona = document.getElementById('libros-zona');
  generando = true; btn.disabled = true; btn.textContent = t.generando;
  zona.innerHTML = '<p class="loading">...</p>';
  document.getElementById('expandido-zona').innerHTML = '';

  const idioma = lang === 'en' ? 'English' : 'Spanish';
  const systemPrompt = `Eres un editor literario experto en sagas y trilogías. Responde en ${idioma}.
Premisa: ${premisa}
Protagonista: ${protagonista || 'A determinar'}
Género: ${generoActivo}

Genera una trilogía de 3 libros. Responde SOLO en JSON:
{
  "nombre_saga": "Nombre de la saga",
  "libros": [
    {
      "numero": 1,
      "titulo": "Título del libro 1",
      "subtitulo": "Subtítulo corto",
      "sinopsis": "Sinopsis del libro (60-80 palabras)",
      "temas": ["tema1", "tema2", "tema3"],
      "primer_parrafo": "El primer párrafo del libro (40-60 palabras, narrativo, que enganche al lector)"
    },
    { "numero": 2, ... },
    { "numero": 3, ... }
  ]
}
Reglas:
- Cada libro debe avanzar la historia con un arco propio.
- Los temas deben evolucionar a lo largo de la trilogía.
- El primer_parrafo debe ser literario, inmersivo, de calidad publicable.
- Títulos evocadores y memorables.
- El libro 3 debe cerrar la saga de forma satisfactoria.`;

  try {
    const raw = await llamarGroq({ systemPrompt, userMessage: premisa, temperature: 0.9, maxTokens: 1500 });
    if (!raw) return;
    const saga = parseJSON(raw);
    if (!saga || !saga.libros || saga.libros.length < 3) throw new Error('parse');
    sagaActual = saga;
    renderLibros(saga);
    document.getElementById('acciones-post').style.display = 'flex';
  } catch { zona.innerHTML = `<p class="loading">${t.error}</p>`; }
  finally { generando = false; btn.disabled = false; btn.textContent = t.generar; }
}

function renderLibros(saga) {
  const zona = document.getElementById('libros-zona');
  zona.innerHTML = `<div class="libros-grid">
    ${saga.libros.map((libro, i) => `
      <div class="libro-card" style="animation-delay:${i * 0.15}s">
        <div class="libro-portada">
          <span class="libro-numero">${libro.numero}</span>
          <div>
            <div class="libro-titulo-portada">${libro.titulo}</div>
            <div class="libro-subtitulo-portada">${libro.subtitulo || ''}</div>
          </div>
        </div>
        <div class="libro-body">
          <div class="libro-sinopsis">${libro.sinopsis}</div>
          <div class="libro-meta">
            ${(libro.temas || []).map(t => `<span class="libro-tag">${t}</span>`).join('')}
          </div>
          <div class="libro-acciones">
            <button class="btn-mini btn-expandir" data-idx="${i}">${t.expandir}</button>
            <button class="btn-mini btn-continuar" data-idx="${i}">${t.continuarEn}</button>
          </div>
        </div>
      </div>
    `).join('')}
  </div>`;

  zona.querySelectorAll('.btn-expandir').forEach(btn => {
    btn.addEventListener('click', () => expandirLibro(parseInt(btn.dataset.idx)));
  });
  zona.querySelectorAll('.btn-continuar').forEach(btn => {
    btn.addEventListener('click', () => enviarAContinuador(parseInt(btn.dataset.idx)));
  });
}

async function expandirLibro(idx) {
  if (generando || !sagaActual) return;
  const libro = sagaActual.libros[idx];
  const expandZona = document.getElementById('expandido-zona');

  // Si ya tiene primer_parrafo, mostrarlo directamente
  if (libro.primer_parrafo) {
    expandZona.innerHTML = `
      <div class="libro-expandido visible">
        <h3>${t.libro} ${libro.numero}: ${libro.titulo}</h3>
        <p>${libro.primer_parrafo}</p>
      </div>`;
    return;
  }

  // Generar si no existe
  generando = true;
  expandZona.innerHTML = '<p class="loading">...</p>';

  const idioma = lang === 'en' ? 'English' : 'Spanish';
  const systemPrompt = `Escribe el primer párrafo del libro "${libro.titulo}" de la saga "${sagaActual.nombre_saga}". 
Sinopsis: ${libro.sinopsis}
Género: ${generoActivo}
Responde en ${idioma}. Solo el párrafo, 60-100 palabras, narrativo y literario.`;

  try {
    const raw = await llamarGroq({ systemPrompt, userMessage: 'Primer párrafo', temperature: 0.85, maxTokens: 200 });
    if (!raw) return;
    libro.primer_parrafo = raw.trim();
    expandZona.innerHTML = `
      <div class="libro-expandido visible">
        <h3>${t.libro} ${libro.numero}: ${libro.titulo}</h3>
        <p>${libro.primer_parrafo}</p>
      </div>`;
  } catch { expandZona.innerHTML = `<p class="loading">${t.error}</p>`; }
  finally { generando = false; }
}

function enviarAContinuador(idx) {
  if (!sagaActual) return;
  const libro = sagaActual.libros[idx];
  const texto = libro.primer_parrafo || libro.sinopsis;
  // Guardar en localStorage para que el Continuador lo recoja
  localStorage.setItem('artefactos_continuador_texto', texto);
  window.location.href = '../continuador/index.html';
}

function exportarTxt() {
  if (!sagaActual) return;
  let texto = `=== ${sagaActual.nombre_saga} ===\n\n`;
  sagaActual.libros.forEach(libro => {
    texto += `--- ${t.libro} ${libro.numero}: ${libro.titulo} ---\n`;
    if (libro.subtitulo) texto += `${libro.subtitulo}\n`;
    texto += `\n${libro.sinopsis}\n`;
    if (libro.primer_parrafo) texto += `\n${libro.primer_parrafo}\n`;
    texto += `\nTemas: ${(libro.temas || []).join(', ')}\n\n`;
  });
  const blob = new Blob([texto], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = `${sagaActual.nombre_saga || 'saga'}.txt`;
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
