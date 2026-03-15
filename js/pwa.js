// pwa.js — PWA registration and install banner

export function initPWA() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  }

  let deferredPrompt;
  const banner = document.getElementById('pwa-banner');
  const installBtn = document.getElementById('pwa-install');
  const dismissBtn = document.getElementById('pwa-dismiss');

  window.addEventListener('beforeinstallprompt', e => {
    e.preventDefault();
    deferredPrompt = e;
    if (banner) banner.hidden = false;
  });

  if (installBtn) {
    installBtn.addEventListener('click', async () => {
      if (!deferredPrompt) return;
      deferredPrompt.prompt();
      await deferredPrompt.userChoice;
      deferredPrompt = null;
      if (banner) banner.hidden = true;
    });
  }

  if (dismissBtn) {
    dismissBtn.addEventListener('click', () => {
      if (banner) banner.hidden = true;
    });
  }
}
