// js/main.js — Lógica principal de la galería del Gabinete de Curiosidades
import { translations, getLang, setLang, t } from './i18n.js';

// === INICIALIZACIÓN ===
document.addEventListener('DOMContentLoaded', () => {
  initLangToggle();
  renderGallery();
  updateTexts();
});

// === SELECTOR DE IDIOMA ===
function initLangToggle() {
  const btn = document.getElementById('lang-toggle');
  if (!btn) return;

  btn.addEventListener('click', () => {
    const current = getLang();
    const next = current === 'es' ? 'en' : 'es';
    setLang(next);
    updateTexts();
    renderGallery();
  });
}

// === ACTUALIZAR TEXTOS SEGÚN IDIOMA ===
function updateTexts() {
  const lang = getLang();

  // Botón de idioma muestra el idioma OPUESTO
  const langBtn = document.getElementById('lang-toggle');
  if (langBtn) langBtn.textContent = t('selectLang');

  // Título y subtítulo
  const title = document.getElementById('gallery-title');
  if (title) title.textContent = t('title');

  const subtitle = document.getElementById('gallery-subtitle');
  if (subtitle) subtitle.textContent = t('subtitle');

  // Footer
  const footer = document.getElementById('gallery-footer');
  if (footer) footer.textContent = t('footer');
}

// === DATOS DE LOS ARTEFACTOS ===
const artefactos = [
  {
    id: 'oraculo',
    nameKey: 'oraculo_name',
    descKey: 'oraculo_desc',
    url: 'artefactos/oraculo/oraculo.html',
    color: '#c9a84c',
    gradient: 'linear-gradient(135deg, #0a0008 0%, #1a1028 100%)',
    icon: `<svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="40" cy="40" r="30" stroke="#c9a84c" stroke-width="1.5" opacity="0.4"/>
      <circle cx="40" cy="40" r="20" stroke="#c9a84c" stroke-width="1"/>
      <path d="M40 18 L42 35 L40 38 L38 35Z" fill="#c9a84c" opacity="0.7"/>
      <circle cx="40" cy="42" r="4" fill="#c9a84c" opacity="0.9"/>
      <path d="M28 55 Q40 48 52 55" stroke="#8ca3bc" stroke-width="1" fill="none" opacity="0.5"/>
      <circle cx="40" cy="40" r="36" stroke="#c9a84c" stroke-width="0.5" stroke-dasharray="4 6" opacity="0.3"/>
    </svg>`
  },
  {
    id: 'musicsage',
    nameKey: 'musicsage_name',
    descKey: 'musicsage_desc',
    url: 'artefactos/musicsage/musicsage.html',
    color: '#c0392b',
    gradient: 'linear-gradient(135deg, #0d0d0d 0%, #1a0a0a 100%)',
    icon: `<svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M50 15 V52" stroke="#f5f0e8" stroke-width="2"/>
      <ellipse cx="42" cy="55" rx="10" ry="7" stroke="#f5f0e8" stroke-width="1.5" fill="none"/>
      <path d="M50 15 L58 12 V24 L50 27Z" fill="#c0392b" opacity="0.7"/>
      <path d="M20 35 Q25 30 30 35" stroke="#d4ac0d" stroke-width="1" fill="none" opacity="0.5"/>
      <path d="M18 42 Q25 37 32 42" stroke="#d4ac0d" stroke-width="1" fill="none" opacity="0.4"/>
      <path d="M16 49 Q25 44 34 49" stroke="#d4ac0d" stroke-width="1" fill="none" opacity="0.3"/>
    </svg>`
  },
  {
    id: 'alquimista',
    nameKey: 'alquimista_name',
    descKey: 'alquimista_desc',
    url: 'artefactos/alquimista/alquimista.html',
    color: '#d4a017',
    gradient: 'linear-gradient(135deg, #1a1408 0%, #0d1a10 100%)',
    icon: `<svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M32 20 L32 40 L20 62 L60 62 L48 40 L48 20Z" stroke="#d4a017" stroke-width="1.5" fill="none"/>
      <line x1="30" y1="20" x2="50" y2="20" stroke="#d4a017" stroke-width="1.5"/>
      <circle cx="40" cy="50" r="6" fill="#1a4a2e" stroke="#d4a017" stroke-width="1"/>
      <path d="M37 48 L40 44 L43 48" stroke="#d4a017" stroke-width="0.8" fill="none"/>
      <circle cx="40" cy="52" r="1.5" fill="#d4a017"/>
      <circle cx="26" cy="30" r="2" fill="#7c4a1e" opacity="0.5"/>
      <circle cx="54" cy="32" r="1.5" fill="#7c4a1e" opacity="0.4"/>
    </svg>`
  },
  {
    id: 'duelo',
    nameKey: 'duelo_name',
    descKey: 'duelo_desc',
    url: 'artefactos/duelo/duelo.html',
    color: '#8b0000',
    gradient: 'linear-gradient(135deg, #111111 0%, #1a1a1a 100%)',
    icon: `<svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="28" cy="32" r="10" stroke="#f8f6f0" stroke-width="1.5" fill="none"/>
      <circle cx="52" cy="32" r="10" stroke="#f8f6f0" stroke-width="1.5" fill="none"/>
      <line x1="28" y1="44" x2="28" y2="60" stroke="#f8f6f0" stroke-width="1.5"/>
      <line x1="52" y1="44" x2="52" y2="60" stroke="#f8f6f0" stroke-width="1.5"/>
      <path d="M34 50 L46 50" stroke="#8b0000" stroke-width="2"/>
      <path d="M38 46 L42 54" stroke="#8b0000" stroke-width="1.5"/>
      <path d="M42 46 L38 54" stroke="#8b0000" stroke-width="1.5"/>
    </svg>`
  },
  {
    id: 'scriptorium',
    nameKey: 'scriptorium_name',
    descKey: 'scriptorium_desc',
    url: 'artefactos/scriptorium/scriptorium.html',
    color: '#1a2f4a',
    gradient: 'linear-gradient(135deg, #0f0f0f 0%, #0f1520 100%)',
    icon: `<svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="20" y="16" width="40" height="52" rx="2" stroke="#f4edd8" stroke-width="1.5" fill="none"/>
      <line x1="28" y1="28" x2="52" y2="28" stroke="#f4edd8" stroke-width="0.8" opacity="0.5"/>
      <line x1="28" y1="34" x2="48" y2="34" stroke="#f4edd8" stroke-width="0.8" opacity="0.4"/>
      <line x1="28" y1="40" x2="50" y2="40" stroke="#f4edd8" stroke-width="0.8" opacity="0.5"/>
      <line x1="28" y1="46" x2="44" y2="46" stroke="#f4edd8" stroke-width="0.8" opacity="0.3"/>
      <line x1="28" y1="52" x2="52" y2="52" stroke="#f4edd8" stroke-width="0.8" opacity="0.4"/>
      <circle cx="54" cy="58" r="6" fill="#8b1a1a" opacity="0.6"/>
    </svg>`
  },

  // --- TANDA 2 ---
  {
    id: 'maquina-tiempo',
    nameKey: 'maquina_name',
    descKey: 'maquina_desc',
    url: 'artefactos/maquina-tiempo/maquina-tiempo.html',
    color: '#39ff14',
    gradient: 'linear-gradient(135deg, #080810 0%, #0a1205 100%)',
    badge: 'NUEVO',
    icon: `<svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="40" cy="40" r="28" stroke="#b87333" stroke-width="1.5" fill="none"/>
      <circle cx="40" cy="40" r="22" stroke="#b87333" stroke-width="0.8" stroke-dasharray="3 3" fill="none"/>
      <line x1="40" y1="22" x2="40" y2="38" stroke="#39ff14" stroke-width="2"/>
      <line x1="40" y1="40" x2="52" y2="46" stroke="#b87333" stroke-width="1.5"/>
      <circle cx="40" cy="40" r="3" fill="#39ff14"/>
      <path d="M28 18 L32 22 M52 18 L48 22 M28 62 L32 58 M52 62 L48 58" stroke="#b87333" stroke-width="1" opacity="0.6"/>
      <circle cx="40" cy="12" r="2" fill="#b87333" opacity="0.5"/>
      <rect x="38" y="8" width="4" height="6" rx="1" stroke="#b87333" stroke-width="0.8" fill="none"/>
    </svg>`
  },
  {
    id: 'gabinete-objetos',
    nameKey: 'gabinete_obj_name',
    descKey: 'gabinete_obj_desc',
    url: 'artefactos/gabinete-objetos/gabinete-objetos.html',
    color: '#c8a951',
    gradient: 'linear-gradient(135deg, #1a0f07 0%, #0d1a0a 100%)',
    badge: 'NUEVO',
    icon: `<svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="16" y="20" width="48" height="44" rx="2" stroke="#c8a951" stroke-width="1.5" fill="none"/>
      <line x1="16" y1="32" x2="64" y2="32" stroke="#c8a951" stroke-width="0.8"/>
      <rect x="28" y="36" width="24" height="20" rx="1" stroke="#f0e6c8" stroke-width="1" fill="none"/>
      <circle cx="40" cy="46" r="6" stroke="#c8a951" stroke-width="1" fill="none"/>
      <circle cx="40" cy="46" r="2" fill="#c8a951" opacity="0.7"/>
      <rect x="34" y="16" width="12" height="8" rx="1" stroke="#c8a951" stroke-width="1" fill="none"/>
      <line x1="40" y1="16" x2="40" y2="20" stroke="#c8a951" stroke-width="0.8"/>
    </svg>`
  },
  {
    id: 'bestiario',
    nameKey: 'bestiario_name',
    descKey: 'bestiario_desc',
    url: 'artefactos/bestiario/bestiario.html',
    color: '#6b0f0f',
    gradient: 'linear-gradient(135deg, #0d0d0a 0%, #1a0808 100%)',
    badge: 'NUEVO',
    icon: `<svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M40 16 C28 16 18 28 18 42 C18 56 28 64 40 64 C52 64 62 56 62 42 C62 28 52 16 40 16Z" stroke="#d4a017" stroke-width="1.5" fill="none"/>
      <circle cx="33" cy="36" r="3" fill="#6b0f0f"/>
      <circle cx="47" cy="36" r="3" fill="#6b0f0f"/>
      <path d="M18 30 L10 22 M62 30 L70 22" stroke="#d4a017" stroke-width="1.2"/>
      <path d="M34 48 Q40 54 46 48" stroke="#d4a017" stroke-width="1" fill="none"/>
      <path d="M30 52 L26 62 M50 52 L54 62" stroke="#d4a017" stroke-width="0.8" opacity="0.5"/>
      <path d="M36 16 L34 8 M44 16 L46 8" stroke="#6b0f0f" stroke-width="1.5"/>
    </svg>`
  },
  {
    id: 'mapa-ideas',
    nameKey: 'mapa_name',
    descKey: 'mapa_desc',
    url: 'artefactos/mapa-ideas/mapa-ideas.html',
    color: '#003153',
    gradient: 'linear-gradient(135deg, #fafaf5 0%, #e8e8e0 100%)',
    badge: 'NUEVO',
    icon: `<svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="40" cy="40" r="6" fill="#003153"/>
      <circle cx="22" cy="24" r="4" fill="#cc2200"/>
      <circle cx="58" cy="24" r="4" fill="#003153"/>
      <circle cx="20" cy="56" r="4" fill="#2d5016"/>
      <circle cx="60" cy="56" r="4" fill="#cc2200"/>
      <circle cx="40" cy="16" r="3" fill="#003153" opacity="0.6"/>
      <line x1="40" y1="34" x2="24" y2="26" stroke="#0f0f0f" stroke-width="0.8" opacity="0.4"/>
      <line x1="40" y1="34" x2="56" y2="26" stroke="#0f0f0f" stroke-width="0.8" opacity="0.4"/>
      <line x1="40" y1="46" x2="22" y2="54" stroke="#0f0f0f" stroke-width="0.8" opacity="0.4"/>
      <line x1="40" y1="46" x2="58" y2="54" stroke="#0f0f0f" stroke-width="0.8" opacity="0.4"/>
      <line x1="40" y1="34" x2="40" y2="19" stroke="#0f0f0f" stroke-width="0.8" opacity="0.3"/>
    </svg>`
  },
  {
    id: 'sinfonia',
    nameKey: 'sinfonia_name',
    descKey: 'sinfonia_desc',
    url: 'artefactos/sinfonia/sinfonia.html',
    color: '#7b2fff',
    gradient: 'linear-gradient(135deg, #050508 0%, #0d0520 100%)',
    badge: 'NUEVO',
    icon: `<svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M16 50 Q24 20 32 45 Q40 70 48 35 Q56 10 64 50" stroke="#7b2fff" stroke-width="2" fill="none"/>
      <circle cx="20" cy="46" r="2" fill="#00e5ff"/>
      <circle cx="36" cy="52" r="2" fill="#00e5ff"/>
      <circle cx="48" cy="32" r="2" fill="#7b2fff"/>
      <circle cx="60" cy="48" r="2" fill="#00e5ff"/>
      <path d="M24 60 L24 68 M32 58 L32 68 M40 62 L40 68 M48 56 L48 68 M56 60 L56 68" stroke="#7b2fff" stroke-width="1.5" opacity="0.5"/>
      <line x1="20" y1="68" x2="60" y2="68" stroke="white" stroke-width="0.5" opacity="0.2"/>
    </svg>`
  }
];

// === RENDERIZAR GALERÍA ===
function renderGallery() {
  const grid = document.getElementById('artefactos-grid');
  if (!grid) return;

  grid.innerHTML = '';

  artefactos.forEach((art, index) => {
    const card = document.createElement('a');
    card.href = art.url;
    card.className = 'artefacto-card stagger-in';
    card.style.animationDelay = `${index * 0.1}s`;
    card.style.setProperty('--card-color', art.color);
    card.style.background = art.gradient;

    card.innerHTML = `
      ${art.badge ? `<span class="artefacto-card__badge">${art.badge}</span>` : ''}
      <div class="artefacto-card__icon">${art.icon}</div>
      <h2 class="artefacto-card__name">${t(art.nameKey)}</h2>
      <p class="artefacto-card__desc">${t(art.descKey)}</p>
      <span class="artefacto-card__enter">${t('enterBtn')}</span>
    `;

    grid.appendChild(card);
  });
}
