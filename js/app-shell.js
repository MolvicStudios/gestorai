// js/app-shell.js — Shared app shell: sidebar, bottom-nav, mobile menu
import { initTema, ciclarTema } from '/js/color-mode.js';

const SIDEBAR_LINKS = [
  { href: '/app/dashboard.html', icon: '📊', label: 'Dashboard' },
  { section: 'Gestión' },
  { href: '/app/facturas/index.html', icon: '🧾', label: 'Facturas', prefix: '/app/facturas/' },
  { href: '/app/fiscal/index.html', icon: '📋', label: 'Fiscal', prefix: '/app/fiscal/' },
  { href: '/app/contratos/index.html', icon: '📝', label: 'Contratos', prefix: '/app/contratos/' },
  { href: '/app/laboral/index.html', icon: '👥', label: 'Laboral', prefix: '/app/laboral/' },
  { href: '/app/clientes/index.html', icon: '🏢', label: 'Clientes', prefix: '/app/clientes/' },
  { section: 'Cuenta' },
  { href: '/app/perfil.html', icon: '⚙️', label: 'Configuración' },
];

const BOTTOM_NAV = [
  { href: '/app/dashboard.html', icon: '📊', label: 'Inicio' },
  { href: '/app/facturas/index.html', icon: '🧾', label: 'Facturas', prefix: '/app/facturas/' },
  { href: '/app/fiscal/index.html', icon: '📋', label: 'Fiscal', prefix: '/app/fiscal/' },
  { href: '/app/contratos/index.html', icon: '📝', label: 'Contratos', prefix: '/app/contratos/' },
  { href: '/app/laboral/index.html', icon: '👥', label: 'Laboral', prefix: '/app/laboral/' },
];

function isActive(item) {
  const p = location.pathname;
  if (item.prefix) return p.startsWith(item.prefix);
  return p === item.href;
}

export function initAppShell() {
  buildSidebar();
  buildBottomNav();
  initMobileMenu();
  initTema(); // after DOM is built so [data-tema-icon] gets updated
  registerSW();
}

function buildSidebar() {
  const el = document.getElementById('sidebar');
  if (!el) return;

  const links = SIDEBAR_LINKS.map(item => {
    if (item.section) return `<div class="nav-section">${item.section}</div>`;
    const cls = isActive(item) ? ' class="active"' : '';
    return `<a href="${item.href}"${cls}>${item.icon} ${item.label}</a>`;
  }).join('\n        ');

  el.innerHTML = `
      <div class="sidebar-header">
        <img src="/assets/logo.svg" alt="GestorAI" class="sidebar-logo" width="32" height="32">
        <span class="sidebar-brand">GestorAI</span>
        <span style="display:block;font-size:11px;font-weight:400;opacity:0.6;letter-spacing:0.03em;line-height:1;">by <a href="https://molvicstudios.pro" target="_blank" rel="noopener" style="color:inherit;text-decoration:none;">MolvicStudios.pro</a></span>
      </div>
      <nav class="sidebar-nav">
        ${links}
        <a href="#" id="nav-logout">🚪 Cerrar sesión</a>
      </nav>
      <div class="sidebar-footer">
        <span id="plan-badge" class="badge badge-free">Free</span>
        <button id="btn-tema-sidebar" style="background:none;border:none;cursor:pointer;font-size:1.1rem;margin-left:0.5rem;" aria-label="Cambiar tema">
          <span data-tema-icon>☀️</span>
        </button>
      </div>`;

  el.querySelector('#btn-tema-sidebar').addEventListener('click', ciclarTema);
  el.querySelector('#nav-logout').addEventListener('click', async (e) => {
    e.preventDefault();
    const { logout } = await import('/js/auth.js');
    await logout();
  });
}

function buildBottomNav() {
  if (document.getElementById('bottom-nav')) return;

  const nav = document.createElement('nav');
  nav.className = 'bottom-nav';
  nav.id = 'bottom-nav';
  nav.setAttribute('aria-label', 'Navegación móvil');

  const items = BOTTOM_NAV.map(item => {
    const cls = isActive(item) ? ' active' : '';
    return `<a href="${item.href}" class="bottom-nav-item${cls}"><span class="nav-icon">${item.icon}</span> ${item.label}</a>`;
  }).join('');

  nav.innerHTML = `<div class="bottom-nav-items">${items}</div>`;
  document.body.appendChild(nav);
}

function initMobileMenu() {
  const sidebar = document.getElementById('sidebar');
  if (!sidebar) return;

  let topbar = document.querySelector('.app-topbar');
  if (!topbar) {
    topbar = document.createElement('div');
    topbar.className = 'app-topbar';
    const main = document.querySelector('.app-main');
    if (main) main.prepend(topbar);
  }

  const btn = document.createElement('button');
  btn.id = 'btn-menu';
  btn.className = 'btn-hamburger';
  btn.setAttribute('aria-label', 'Menú');
  btn.innerHTML = '☰';
  topbar.prepend(btn);

  btn.addEventListener('click', () => sidebar.classList.toggle('open'));
  document.addEventListener('click', (e) => {
    if (sidebar.classList.contains('open') &&
        !sidebar.contains(e.target) &&
        e.target !== btn) {
      sidebar.classList.remove('open');
    }
  });
}

export function updatePlanBadge(isPro) {
  const badge = document.getElementById('plan-badge');
  if (!badge) return;
  badge.textContent = isPro ? 'Pro' : 'Free';
  badge.className = `badge badge-${isPro ? 'pro' : 'free'}`;
}

function registerSW() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/service-worker.js').catch(() => {});
  }
}
