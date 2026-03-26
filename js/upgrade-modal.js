// js/upgrade-modal.js — GestorAI Pro Upgrade Modal (Lemon Squeezy)
import LicenseSystem from './license.js';

const LS_CHECKOUT_MONTHLY = 'https://molvicstudios.lemonsqueezy.com/checkout/buy/1451042?test=true';
const LS_CHECKOUT_ANNUAL  = 'https://molvicstudios.lemonsqueezy.com/checkout/buy/1451025?test=true';

const FEATURE_COPY = {
  facturas: {
    icon: '🧾',
    title: 'Límite de facturas alcanzado',
    desc: 'Has emitido las 3 facturas gratuitas de este mes'
  },
  contratos: {
    icon: '📝',
    title: 'Límite de contratos alcanzado',
    desc: 'Has usado el contrato gratuito de este mes'
  },
  ia: {
    icon: '🤖',
    title: 'Límite de consultas IA alcanzado',
    desc: 'Has usado las 5 consultas gratuitas de hoy'
  },
  modelos: {
    icon: '📊',
    title: 'Modelos fiscales — Plan Pro',
    desc: 'Los modelos 130, 303 y 111 son exclusivos del plan Pro'
  },
  nominas: {
    icon: '💰',
    title: 'Calculadora de nóminas — Plan Pro',
    desc: 'La calculadora de nóminas es exclusiva del plan Pro'
  },
  clientes: {
    icon: '👥',
    title: 'Gestión de clientes — Plan Pro',
    desc: 'La gestión de clientes es exclusiva del plan Pro'
  },
  pdf: {
    icon: '📄',
    title: 'PDF sin marca de agua — Plan Pro',
    desc: 'Elimina la marca de agua con el plan Pro'
  }
};

const DEFAULT_COPY = {
  icon: '🔒',
  title: 'Función exclusiva del Plan Pro',
  desc: 'Desbloquea todas las funcionalidades de GestorAI'
};

function isDark() {
  return document.documentElement.classList.contains('tema-oscuro') ||
         document.documentElement.classList.contains('tema-contraste');
}

function getStyles() {
  const dark = isDark();
  return {
    overlay: `position:fixed;inset:0;z-index:99999;background:rgba(0,0,0,0.6);display:flex;align-items:center;justify-content:center;padding:1rem;animation:ugFadeIn .25s ease;`,
    card: `background:${dark ? '#1e2030' : '#fff'};color:${dark ? '#e2e8f0' : '#1e293b'};border-radius:16px;max-width:500px;width:100%;padding:2rem;box-shadow:0 20px 60px rgba(0,0,0,0.3);animation:ugSlideUp .3s ease;position:relative;max-height:90vh;overflow-y:auto;`,
    title: `font-size:1.3rem;font-weight:700;margin:0 0 0.25rem;`,
    desc: `color:${dark ? '#94a3b8' : '#64748b'};margin:0 0 1.25rem;font-size:0.95rem;`,
    features: `list-style:none;padding:0;margin:0 0 1.5rem;`,
    featureItem: `padding:6px 0;font-size:0.93rem;display:flex;align-items:center;gap:8px;`,
    priceRow: `display:grid;grid-template-columns:1fr 1fr;gap:0.75rem;margin-bottom:1rem;`,
    btnPrimary: `display:block;width:100%;padding:14px;border:none;border-radius:10px;background:#0D7966;color:#fff;font-size:1rem;font-weight:600;cursor:pointer;text-align:center;text-decoration:none;margin-bottom:0.5rem;`,
    btnSecondary: `display:block;width:100%;padding:12px;border:2px solid ${dark ? '#334155' : '#e2e8f0'};border-radius:10px;background:transparent;color:${dark ? '#e2e8f0' : '#1e293b'};font-size:0.95rem;font-weight:600;cursor:pointer;text-align:center;text-decoration:none;margin-bottom:1rem;`,
    divider: `border:none;border-top:1px solid ${dark ? '#334155' : '#e2e8f0'};margin:1.25rem 0;`,
    input: `width:100%;padding:10px 12px;border:1px solid ${dark ? '#475569' : '#cbd5e1'};border-radius:8px;background:${dark ? '#0f172a' : '#f8fafc'};color:${dark ? '#e2e8f0' : '#1e293b'};font-size:0.9rem;box-sizing:border-box;`,
    btnActivate: `padding:10px 20px;border:none;border-radius:8px;background:#0D7966;color:#fff;font-size:0.9rem;font-weight:600;cursor:pointer;`,
    btnClose: `background:none;border:none;color:${dark ? '#94a3b8' : '#64748b'};font-size:0.9rem;cursor:pointer;padding:8px 0;width:100%;text-align:center;`,
    errorMsg: `color:#ef4444;font-size:0.85rem;margin-top:0.5rem;`,
    successMsg: `color:#10b981;font-size:0.85rem;margin-top:0.5rem;`,
    badge: `display:inline-block;background:#10b981;color:#fff;font-size:0.7rem;font-weight:700;padding:2px 8px;border-radius:99px;margin-left:6px;`
  };
}

export function showUpgradeModal(feature) {
  // Remove existing
  const existing = document.getElementById('gestorai-upgrade-modal');
  if (existing) existing.remove();

  const copy = FEATURE_COPY[feature] || DEFAULT_COPY;
  const s = getStyles();

  const overlay = document.createElement('div');
  overlay.id = 'gestorai-upgrade-modal';
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.setAttribute('aria-label', 'Mejorar a Pro');

  // Inject keyframes
  if (!document.getElementById('ug-keyframes')) {
    const style = document.createElement('style');
    style.id = 'ug-keyframes';
    style.textContent = `
      @keyframes ugFadeIn { from { opacity:0 } to { opacity:1 } }
      @keyframes ugSlideUp { from { transform:translateY(20px);opacity:0 } to { transform:translateY(0);opacity:1 } }
    `;
    document.head.appendChild(style);
  }

  overlay.style.cssText = s.overlay;
  overlay.innerHTML = `
    <div style="${s.card}">
      <div style="text-align:center;font-size:2.5rem;margin-bottom:0.5rem;">${copy.icon}</div>
      <h2 style="${s.title}text-align:center;">${copy.title}</h2>
      <p style="${s.desc}text-align:center;">${copy.desc}</p>

      <ul style="${s.features}">
        <li style="${s.featureItem}">✅ Facturas ilimitadas sin marca de agua</li>
        <li style="${s.featureItem}">✅ Contratos ilimitados</li>
        <li style="${s.featureItem}">✅ Consultas IA ilimitadas</li>
        <li style="${s.featureItem}">✅ Modelos fiscales 130/303/111</li>
        <li style="${s.featureItem}">✅ Calculadora de nóminas</li>
        <li style="${s.featureItem}">✅ Gestión de clientes</li>
      </ul>

      <a href="${LS_CHECKOUT_MONTHLY}" target="_blank" rel="noopener" style="${s.btnPrimary}">
        🚀 Empezar 7 días gratis — 14,99€/mes
      </a>
      <a href="${LS_CHECKOUT_ANNUAL}" target="_blank" rel="noopener" style="${s.btnSecondary}">
        📅 Plan Anual — 149€/año <span style="${s.badge}">Ahorra 31%</span>
      </a>

      <hr style="${s.divider}">

      <p style="font-size:0.9rem;margin:0 0 0.75rem;font-weight:600;">¿Ya tienes licencia?</p>
      <div style="display:flex;gap:0.5rem;align-items:start;">
        <input type="text" id="ug-license-input" placeholder="Clave de licencia" style="${s.input}flex:1;">
        <button id="ug-btn-activate" style="${s.btnActivate}">Activar</button>
      </div>
      <div id="ug-license-msg"></div>

      <button id="ug-btn-close" style="${s.btnClose}">Ahora no</button>
    </div>
  `;

  document.body.appendChild(overlay);

  // Close on overlay click
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeModal();
  });

  // Close button
  overlay.querySelector('#ug-btn-close').addEventListener('click', closeModal);

  // Escape key
  const onEscape = (e) => {
    if (e.key === 'Escape') { closeModal(); document.removeEventListener('keydown', onEscape); }
  };
  document.addEventListener('keydown', onEscape);

  // Activate license
  overlay.querySelector('#ug-btn-activate').addEventListener('click', async () => {
    const input = overlay.querySelector('#ug-license-input');
    const msgEl = overlay.querySelector('#ug-license-msg');
    const btn = overlay.querySelector('#ug-btn-activate');
    const key = input.value.trim();

    if (!key) {
      msgEl.innerHTML = `<p style="${s.errorMsg}">Introduce tu clave de licencia.</p>`;
      return;
    }

    btn.disabled = true;
    btn.textContent = '...';
    msgEl.innerHTML = '';

    const result = await LicenseSystem.activate(key);

    if (result.success) {
      msgEl.innerHTML = `<p style="${s.successMsg}">✅ Licencia activada — Plan ${result.plan}</p>`;
      setTimeout(() => {
        closeModal();
        updateProUI();
      }, 1200);
    } else {
      btn.disabled = false;
      btn.textContent = 'Activar';
      msgEl.innerHTML = `<p style="${s.errorMsg}">❌ ${result.error}</p>`;
    }
  });

  // Focus input
  setTimeout(() => overlay.querySelector('#ug-license-input')?.focus(), 100);
}

function closeModal() {
  const modal = document.getElementById('gestorai-upgrade-modal');
  if (modal) modal.remove();
}

function updateProUI() {
  // Dispatch event for pages that listen
  document.dispatchEvent(new CustomEvent('gestorai:license-changed', {
    detail: { isPro: LicenseSystem.isPro(), plan: LicenseSystem.getPlan() }
  }));
  // Reload to reflect new state
  window.location.reload();
}

export { LicenseSystem };
