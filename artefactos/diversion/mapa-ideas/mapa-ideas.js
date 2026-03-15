// artefactos/mapa-ideas/mapa-ideas.js
import { askGroq, hasGroqKey } from '../../../js/groq.js';
import { renderApiKeyPanel, renderChangeKeyButton } from '../../../js/apikey-panel.js';
import { t, getLang, setLang } from '../../../js/i18n.js';

const lang = () => getLang();

// === INITIAL DATA ===
const NODOS_INICIALES = [
  { id: 'logos', label: 'Logos', categoria: 'filosofia' },
  { id: 'dialectica', label: 'Dialéctica', categoria: 'filosofia' },
  { id: 'etica', label: 'Ética', categoria: 'filosofia' },
  { id: 'metafisica', label: 'Metafísica', categoria: 'filosofia' },
  { id: 'epistemologia', label: 'Epistemología', categoria: 'filosofia' },
  { id: 'entropia', label: 'Entropía', categoria: 'ciencia' },
  { id: 'relatividad', label: 'Relatividad', categoria: 'ciencia' },
  { id: 'evolucion', label: 'Evolución', categoria: 'ciencia' },
  { id: 'caos', label: 'Caos', categoria: 'ciencia' },
  { id: 'emergencia', label: 'Emergencia', categoria: 'ciencia' },
  { id: 'sublime', label: 'Sublime', categoria: 'arte' },
  { id: 'catarsis', label: 'Catarsis', categoria: 'arte' },
  { id: 'mimesis', label: 'Mímesis', categoria: 'arte' },
  { id: 'abstraccion', label: 'Abstracción', categoria: 'arte' },
  { id: 'simbolo', label: 'Símbolo', categoria: 'arte' },
  { id: 'tiempo', label: 'Tiempo', categoria: 'transversal' },
  { id: 'infinito', label: 'Infinito', categoria: 'transversal' },
  { id: 'conciencia', label: 'Conciencia', categoria: 'transversal' },
  { id: 'lenguaje', label: 'Lenguaje', categoria: 'transversal' },
  { id: 'belleza', label: 'Belleza', categoria: 'transversal' }
];

const ENLACES_INICIALES = [
  { source: 'logos', target: 'lenguaje', strength: 0.9 },
  { source: 'logos', target: 'dialectica', strength: 0.8 },
  { source: 'dialectica', target: 'etica', strength: 0.7 },
  { source: 'metafisica', target: 'tiempo', strength: 0.8 },
  { source: 'metafisica', target: 'infinito', strength: 0.9 },
  { source: 'epistemologia', target: 'logos', strength: 0.7 },
  { source: 'entropia', target: 'tiempo', strength: 0.9 },
  { source: 'caos', target: 'emergencia', strength: 0.95 },
  { source: 'relatividad', target: 'tiempo', strength: 0.95 },
  { source: 'evolucion', target: 'emergencia', strength: 0.8 },
  { source: 'sublime', target: 'belleza', strength: 0.9 },
  { source: 'catarsis', target: 'etica', strength: 0.6 },
  { source: 'mimesis', target: 'abstraccion', strength: 0.7 },
  { source: 'simbolo', target: 'lenguaje', strength: 0.85 },
  { source: 'conciencia', target: 'epistemologia', strength: 0.8 },
  { source: 'conciencia', target: 'tiempo', strength: 0.7 },
  { source: 'belleza', target: 'abstraccion', strength: 0.75 },
  { source: 'infinito', target: 'caos', strength: 0.65 },
  { source: 'lenguaje', target: 'simbolo', strength: 0.9 },
  { source: 'etica', target: 'belleza', strength: 0.5 }
];

const CATEGORY_COLORS = {
  filosofia: '#003153',
  ciencia: '#cc2200',
  arte: '#2d5016',
  matematicas: '#c87000',
  misticismo: '#6a0dad',
  transversal: '#555'
};

let nodes = [];
let links = [];
let simulation = null;
let svg = null;
let linkGroup = null;
let nodeGroup = null;

function init() {
  if (!hasGroqKey()) {
    renderApiKeyPanel('app-container', () => renderArtefacto(), lang());
    return;
  }
  renderArtefacto();
}

function renderArtefacto() {
  const app = document.getElementById('app-container');
  document.body.className = 'mapa-page';

  app.innerHTML = `
    <div class="mapa-header">
      <a href="../../index.html" class="mapa-back">${t('backBtn')}</a>
      <div class="mapa-header__right">
        <button class="mapa-lang" id="lang-toggle">${t('selectLang')}</button>
      </div>
    </div>
    <div class="mapa-title-bar">
      <h1 class="mapa-title">${t('mapa_name')}</h1>
    </div>
    <div class="mapa-controls">
      <div class="mapa-search-bar">
        <input class="mapa-search-input" id="search-input" type="text" placeholder="${t('mapa_search_placeholder')}">
        <button class="mapa-btn" id="search-btn">${t('mapa_search')}</button>
      </div>
      <button class="mapa-btn mapa-btn--outline" id="random-btn">${t('mapa_random')}</button>
      <button class="mapa-btn mapa-btn--red" id="reset-btn">${t('mapa_reset')}</button>
    </div>
    <div class="mapa-graph" id="graph-container"></div>
    <div class="mapa-tooltip" id="tooltip"></div>
    <div class="mapa-panel" id="side-panel">
      <div class="mapa-panel__content" id="panel-content"></div>
    </div>
  `;

  initLangToggle();
  bindControls();
  renderChangeKeyButton('apikey-change-container', lang());
  resetGraph();
}

function initLangToggle() {
  document.getElementById('lang-toggle').addEventListener('click', () => {
    setLang(getLang() === 'es' ? 'en' : 'es');
    renderArtefacto();
  });
}

function bindControls() {
  const input = document.getElementById('search-input');
  const searchBtn = document.getElementById('search-btn');
  const randomBtn = document.getElementById('random-btn');
  const resetBtn = document.getElementById('reset-btn');

  searchBtn.addEventListener('click', () => {
    if (input.value.trim()) addConcept(input.value.trim());
  });

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && input.value.trim()) addConcept(input.value.trim());
  });

  randomBtn.addEventListener('click', () => {
    const randomNode = nodes[Math.floor(Math.random() * nodes.length)];
    if (randomNode) expandNode(randomNode);
  });

  resetBtn.addEventListener('click', resetGraph);
}

// === GRAPH ===
function resetGraph() {
  nodes = NODOS_INICIALES.map(n => ({ ...n }));
  links = ENLACES_INICIALES.map(l => ({ ...l }));
  buildGraph();
}

function buildGraph() {
  const container = document.getElementById('graph-container');
  container.innerHTML = '';

  const width = container.clientWidth;
  const height = container.clientHeight;

  svg = d3.select(container)
    .append('svg')
    .attr('width', width)
    .attr('height', height);

  // Glow filter
  const defs = svg.append('defs');
  const filter = defs.append('filter').attr('id', 'glow');
  filter.append('feGaussianBlur').attr('stdDeviation', '3').attr('result', 'blur');
  const merge = filter.append('feMerge');
  merge.append('feMergeNode').attr('in', 'blur');
  merge.append('feMergeNode').attr('in', 'SourceGraphic');

  linkGroup = svg.append('g').attr('class', 'links');
  nodeGroup = svg.append('g').attr('class', 'nodes');

  simulation = d3.forceSimulation(nodes)
    .force('charge', d3.forceManyBody().strength(-200))
    .force('center', d3.forceCenter(width / 2, height / 2))
    .force('link', d3.forceLink(links).id(d => d.id).distance(100).strength(d => d.strength || 0.5))
    .force('collision', d3.forceCollide().radius(30))
    .on('tick', ticked);

  updateGraph();
}

function updateGraph() {
  // Links
  const link = linkGroup.selectAll('line')
    .data(links, d => `${d.source.id || d.source}-${d.target.id || d.target}`);

  link.exit().remove();

  link.enter()
    .append('line')
    .attr('class', 'mapa-link')
    .attr('stroke-width', d => (d.strength || 0.5) * 3);

  // Nodes
  const node = nodeGroup.selectAll('.mapa-node')
    .data(nodes, d => d.id);

  node.exit().transition().duration(300).attr('opacity', 0).remove();

  const nodeEnter = node.enter()
    .append('g')
    .attr('class', 'mapa-node')
    .call(d3.drag()
      .on('start', dragStarted)
      .on('drag', dragged)
      .on('end', dragEnded));

  nodeEnter.append('circle')
    .attr('r', 10)
    .attr('fill', d => CATEGORY_COLORS[d.categoria] || '#555')
    .attr('stroke', '#fafaf5')
    .attr('stroke-width', 2)
    .attr('filter', 'url(#glow)')
    .on('mouseover', handleMouseOver)
    .on('mouseout', handleMouseOut)
    .on('click', (event, d) => expandNode(d));

  nodeEnter.append('text')
    .attr('dy', -16)
    .attr('text-anchor', 'middle')
    .text(d => d.label);

  // Restart simulation
  simulation.nodes(nodes);
  simulation.force('link').links(links);
  simulation.alpha(0.3).restart();
}

function ticked() {
  linkGroup.selectAll('line')
    .attr('x1', d => d.source.x)
    .attr('y1', d => d.source.y)
    .attr('x2', d => d.target.x)
    .attr('y2', d => d.target.y);

  nodeGroup.selectAll('.mapa-node')
    .attr('transform', d => `translate(${d.x},${d.y})`);
}

function dragStarted(event, d) {
  if (!event.active) simulation.alphaTarget(0.3).restart();
  d.fx = d.x;
  d.fy = d.y;
}

function dragged(event, d) {
  d.fx = event.x;
  d.fy = event.y;
}

function dragEnded(event, d) {
  if (!event.active) simulation.alphaTarget(0);
  d.fx = null;
  d.fy = null;
}

function handleMouseOver(event, d) {
  const tooltip = document.getElementById('tooltip');
  tooltip.style.display = 'block';
  tooltip.style.left = event.clientX + 12 + 'px';
  tooltip.style.top = event.clientY - 10 + 'px';
  tooltip.textContent = `${d.label} (${d.categoria})`;
}

function handleMouseOut() {
  document.getElementById('tooltip').style.display = 'none';
}

// === EXPAND NODE (AI) ===
async function expandNode(nodeData) {
  const panel = document.getElementById('side-panel');
  const panelContent = document.getElementById('panel-content');

  panel.classList.add('open');
  panelContent.innerHTML = `<div class="mapa-loading-overlay" style="position:static;box-shadow:none;border:none">${t('mapa_loading')}</div>`;

  const idioma = lang() === 'es' ? 'español' : 'inglés';

  const systemPrompt = `Eres un enciclopedista erudito. Hablas en ${idioma}.
Proporciona información sobre el concepto: ${nodeData.label}
Responde SOLO en este formato JSON (sin markdown):
{
  "concepto": "${nodeData.label}",
  "definicion": "Definición profunda y precisa (3-4 oraciones)",
  "pensador_principal": "Nombre del filósofo, científico o artista más asociado",
  "cita": "Una cita real y verificable relacionada con este concepto",
  "cita_autor": "Autor de la cita",
  "conceptos_relacionados": ["concepto1", "concepto2", "concepto3"],
  "categoria": "Una de: filosofia / ciencia / arte / matematicas / misticismo / transversal"
}`;

  try {
    const response = await callGroq(systemPrompt, `Información sobre: ${nodeData.label}`);
    if (!response) return;

    const data = parseJSON(response);
    if (!data) {
      panelContent.innerHTML = '<p style="color:#cc2200">Error parsing response.</p>';
      return;
    }

    renderPanel(data, nodeData);

    // Add related concepts as new nodes
    if (data.conceptos_relacionados) {
      data.conceptos_relacionados.forEach(concept => {
        const id = concept.toLowerCase().replace(/\s+/g, '_').normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        if (!nodes.find(n => n.id === id)) {
          const cat = data.categoria || nodeData.categoria || 'transversal';
          nodes.push({ id, label: concept, categoria: cat });
          links.push({ source: nodeData.id, target: id, strength: 0.6 });
        } else if (!links.find(l =>
          (l.source.id || l.source) === nodeData.id && (l.target.id || l.target) === id ||
          (l.source.id || l.source) === id && (l.target.id || l.target) === nodeData.id
        )) {
          links.push({ source: nodeData.id, target: id, strength: 0.5 });
        }
      });
      updateGraph();
    }
  } catch (err) {
    panelContent.innerHTML = `<p style="color:#cc2200">${err.message}</p>`;
  }
}

function renderPanel(data, nodeData) {
  const panelContent = document.getElementById('panel-content');
  const cat = data.categoria || nodeData.categoria || 'transversal';
  const relatedBtns = (data.conceptos_relacionados || []).map(c =>
    `<button class="mapa-panel__related-btn" data-concept="${c}">${c}</button>`
  ).join('');

  panelContent.innerHTML = `
    <button class="mapa-panel__close" id="panel-close">✕</button>
    <h2 class="mapa-panel__title">${data.concepto || nodeData.label}</h2>
    <span class="mapa-panel__category cat-bg-${cat}">${cat}</span>
    <p class="mapa-panel__definition">${data.definicion || ''}</p>

    <div class="mapa-panel__field">
      <div class="mapa-panel__field-label">${t('mapa_thinker')}</div>
      <div class="mapa-panel__field-value">${data.pensador_principal || ''}</div>
    </div>

    <div class="mapa-panel__field">
      <div class="mapa-panel__field-label">${t('mapa_quote')}</div>
      <div class="mapa-panel__quote">"${data.cita || ''}"</div>
      <div class="mapa-panel__quote-author">— ${data.cita_autor || ''}</div>
    </div>

    <div class="mapa-panel__field">
      <div class="mapa-panel__field-label">${t('mapa_related')}</div>
      <div class="mapa-panel__related">${relatedBtns}</div>
    </div>
  `;

  document.getElementById('panel-close').addEventListener('click', () => {
    document.getElementById('side-panel').classList.remove('open');
  });

  panelContent.querySelectorAll('.mapa-panel__related-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const conceptLabel = btn.dataset.concept;
      const id = conceptLabel.toLowerCase().replace(/\s+/g, '_').normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      const existing = nodes.find(n => n.id === id);
      if (existing) {
        expandNode(existing);
      } else {
        addConcept(conceptLabel);
      }
    });
  });
}

// === ADD CONCEPT VIA SEARCH ===
async function addConcept(conceptLabel) {
  const overlay = document.createElement('div');
  overlay.className = 'mapa-loading-overlay';
  overlay.textContent = t('mapa_loading');
  document.body.appendChild(overlay);

  const idioma = lang() === 'es' ? 'español' : 'inglés';

  const systemPrompt = `Eres un enciclopedista erudito. Hablas en ${idioma}.
Proporciona información sobre el concepto: ${conceptLabel}
Responde SOLO en este formato JSON (sin markdown):
{
  "concepto": "${conceptLabel}",
  "definicion": "Definición profunda y precisa (3-4 oraciones)",
  "pensador_principal": "Nombre del filósofo, científico o artista más asociado",
  "cita": "Una cita real y verificable relacionada con este concepto",
  "cita_autor": "Autor de la cita",
  "conceptos_relacionados": ["concepto1", "concepto2", "concepto3"],
  "categoria": "Una de: filosofia / ciencia / arte / matematicas / misticismo / transversal"
}`;

  try {
    const response = await callGroq(systemPrompt, `Información sobre: ${conceptLabel}`);
    overlay.remove();
    if (!response) return;

    const data = parseJSON(response);
    if (!data) return;

    const cat = data.categoria || 'transversal';
    const mainId = conceptLabel.toLowerCase().replace(/\s+/g, '_').normalize('NFD').replace(/[\u0300-\u036f]/g, '');

    if (!nodes.find(n => n.id === mainId)) {
      nodes.push({ id: mainId, label: data.concepto || conceptLabel, categoria: cat });
    }

    // Connect to a random existing node
    if (nodes.length > 1) {
      const existingNodes = nodes.filter(n => n.id !== mainId);
      const randomTarget = existingNodes[Math.floor(Math.random() * existingNodes.length)];
      if (!links.find(l => (l.source.id || l.source) === mainId && (l.target.id || l.target) === randomTarget.id)) {
        links.push({ source: mainId, target: randomTarget.id, strength: 0.4 });
      }
    }

    // Add related
    if (data.conceptos_relacionados) {
      data.conceptos_relacionados.forEach(c => {
        const id = c.toLowerCase().replace(/\s+/g, '_').normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        if (!nodes.find(n => n.id === id)) {
          nodes.push({ id, label: c, categoria: cat });
        }
        if (!links.find(l =>
          (l.source.id || l.source) === mainId && (l.target.id || l.target) === id
        )) {
          links.push({ source: mainId, target: id, strength: 0.6 });
        }
      });
    }

    updateGraph();

    // Open panel for new concept
    const nodeData = nodes.find(n => n.id === mainId);
    if (nodeData) renderPanel(data, nodeData);
    document.getElementById('side-panel').classList.add('open');
    document.getElementById('search-input').value = '';
  } catch (err) {
    overlay.remove();
  }
}

function parseJSON(text) {
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start === -1 || end === -1) return null;
  try {
    return JSON.parse(text.substring(start, end + 1));
  } catch {
    return null;
  }
}

// === GROQ CALL ===
async function callGroq(systemPrompt, userMessage) {
  try {
    return await askGroq({ systemPrompt, userMessage, temperature: 0.85, maxTokens: 600 });
  } catch (err) {
    if (err.message === 'API_KEY_MISSING' || err.message === 'NO_KEY' || err.message === 'INVALID_KEY') {
      renderApiKeyPanel('app-container', () => renderArtefacto(), lang());
      return null;
    }
    throw err;
  }
}

document.addEventListener('DOMContentLoaded', init);
