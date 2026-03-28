// js/cookie-banner.js — RGPD/LOPDGDD banner
const LS_KEY = 'gestorai_cookies_consent';

export function initCookieBanner() {
  if (localStorage.getItem(LS_KEY)) return;

  const banner = document.createElement('div');
  banner.id = 'cookie-banner';
  banner.setAttribute('role', 'dialog');
  banner.setAttribute('aria-label', 'Aviso de cookies');
  banner.innerHTML = `
    <div style="
      position: fixed; bottom: 0; left: 0; right: 0;
      background: var(--color-surface); border-top: 1px solid var(--color-border);
      padding: 1rem 1.5rem; z-index: 10000;
      display: flex; align-items: center; justify-content: space-between;
      gap: 1rem; flex-wrap: wrap;
      box-shadow: 0 -2px 12px rgba(0,0,0,0.1);
      font-size: 0.9rem; color: var(--color-text);
    ">
      <p style="margin:0; flex:1; min-width:200px;">
        Usamos cookies técnicas esenciales y Cloudflare Analytics.
        <a href="/legal/cookies.html" style="color:var(--color-primary);">Política de cookies</a>.
      </p>
      <div style="display:flex; gap:0.5rem; flex-shrink:0;">
        <button id="cookie-reject" class="btn btn-secondary btn-sm">Solo esenciales</button>
        <button id="cookie-accept" class="btn btn-primary btn-sm">Aceptar todo</button>
      </div>
    </div>
  `;
  document.body.appendChild(banner);

  document.getElementById('cookie-accept').addEventListener('click', () => {
    localStorage.setItem(LS_KEY, 'all');
    banner.remove();
  });

  document.getElementById('cookie-reject').addEventListener('click', () => {
    localStorage.setItem(LS_KEY, 'essential');
    banner.remove();
  });
}

export function hasConsentForAds() {
  return localStorage.getItem(LS_KEY) === 'all';
}
