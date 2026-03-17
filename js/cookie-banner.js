// cookie-banner.js — MolvicStudios
// RGPD/LOPDGDD compliant — Bilingüe ES/EN
// Sin dependencias externas

(function () {
  'use strict';

  var CONSENT_KEY = 'molvic_cookie_consent';

  if (localStorage.getItem(CONSENT_KEY)) return;

  var lang = (navigator.language || '').startsWith('es') ? 'es' : 'en';

  var i18n = {
    es: {
      message: 'Usamos cookies esenciales para el funcionamiento del sitio. No utilizamos cookies de seguimiento ni publicidad.',
      accept: 'Aceptar',
      reject: 'Rechazar',
      policy: 'Política de privacidad'
    },
    en: {
      message: 'We use essential cookies for site functionality. We do not use tracking or advertising cookies.',
      accept: 'Accept',
      reject: 'Decline',
      policy: 'Privacy policy'
    }
  };

  var t = i18n[lang];
  var policyURL = 'https://molvicstudios.pro/privacidad';

  // Inyectar estilos
  var style = document.createElement('style');
  style.textContent =
    '#molvic-cookie-banner{position:fixed;bottom:0;left:0;right:0;z-index:99999;' +
    'background:#1a1a1a;border-top:1px solid #333;box-shadow:0 -2px 12px rgba(0,0,0,.4);' +
    'padding:1rem 1.5rem;display:flex;align-items:center;justify-content:space-between;gap:1rem;' +
    'font-family:"DM Sans",sans-serif;font-size:.9rem;color:#e5e5e5;opacity:0;transition:opacity .3s}' +
    '#molvic-cookie-banner.visible{opacity:1}' +
    '#molvic-cookie-banner .cb-text{flex:1;line-height:1.5}' +
    '#molvic-cookie-banner .cb-text a{color:#f59e0b;text-decoration:underline}' +
    '#molvic-cookie-banner .cb-buttons{display:flex;gap:.5rem;flex-shrink:0}' +
    '#molvic-cookie-banner .cb-accept{background:#f59e0b;color:#000;border:none;padding:.5rem 1.2rem;' +
    'border-radius:6px;font-size:.85rem;font-weight:500;cursor:pointer;font-family:inherit}' +
    '#molvic-cookie-banner .cb-reject{background:transparent;color:#aaa;border:1px solid #555;' +
    'padding:.5rem 1.2rem;border-radius:6px;font-size:.85rem;cursor:pointer;font-family:inherit}' +
    '@media(max-width:600px){#molvic-cookie-banner{flex-direction:column;text-align:center}' +
    '#molvic-cookie-banner .cb-buttons{width:100%;justify-content:center}}';
  document.head.appendChild(style);

  // Crear banner
  var banner = document.createElement('div');
  banner.id = 'molvic-cookie-banner';
  banner.setAttribute('role', 'dialog');
  banner.setAttribute('aria-label', lang === 'es' ? 'Aviso de cookies' : 'Cookie notice');
  banner.innerHTML =
    '<div class="cb-text">' + t.message + ' <a href="' + policyURL + '" target="_blank" rel="noopener">' + t.policy + '</a></div>' +
    '<div class="cb-buttons">' +
    '<button class="cb-accept">' + t.accept + '</button>' +
    '<button class="cb-reject">' + t.reject + '</button>' +
    '</div>';

  document.body.appendChild(banner);

  // Fade in
  requestAnimationFrame(function () {
    requestAnimationFrame(function () {
      banner.classList.add('visible');
    });
  });

  function closeBanner(value) {
    try { localStorage.setItem(CONSENT_KEY, value); } catch (e) { /* private browsing */ }
    banner.classList.remove('visible');
    setTimeout(function () { banner.remove(); }, 300);
  }

  banner.querySelector('.cb-accept').addEventListener('click', function () { closeBanner('accepted'); });
  banner.querySelector('.cb-reject').addEventListener('click', function () { closeBanner('rejected'); });
})();
