// ads.js — Inicialización AdSense + detección de adblocker
// Publisher ID: ca-pub-1513893788851225
//
// Slots:
// - #ad-header : banner responsive debajo del header
// - #ad-mid    : banner entre la fila 2 y 3 del grid (inyectado dinámicamente por main.js)
// - #ad-footer : banner responsive sobre el footer
//
// ⚠️ IMPORTANTE: Reemplazar SLOT_HEADER, SLOT_MID y SLOT_FOOTER
// con los IDs reales de tus unidades de anuncio en tu cuenta AdSense.

/**
 * Inicializa los slots de AdSense presentes en la página
 * Solo se ejecuta en producción (no en localhost)
 */
export function initAds() {
  // No inicializar en desarrollo local
  if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') {
    ocultarTodosLosSlots();
    return;
  }

  // Inicializar cada slot que exista en el DOM
  const slots = document.querySelectorAll('.adsbygoogle');
  slots.forEach(() => {
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (e) {
      // AdSense bloqueado o no disponible
    }
  });

  // Comprobar si los anuncios se cargan correctamente
  hideIfBlocked('ad-header');
  hideIfBlocked('ad-footer');
}

/**
 * Comprueba si un slot tiene contenido y lo oculta si está vacío (adblocker)
 * @param {string} slotId - ID del elemento ins de AdSense
 */
export function hideIfBlocked(slotId) {
  setTimeout(() => {
    const slot = document.getElementById(slotId);
    if (slot && slot.offsetHeight < 10) {
      const contenedor = slot.closest('.ad-container');
      if (contenedor) {
        contenedor.classList.add('ad-hidden');
      }
    }
  }, 2000);
}

/**
 * Oculta todos los contenedores de anuncios (para desarrollo local)
 */
function ocultarTodosLosSlots() {
  document.querySelectorAll('.ad-container').forEach(el => {
    el.classList.add('ad-hidden');
  });
}

// Auto-inicializar al cargar
document.addEventListener('DOMContentLoaded', initAds);
