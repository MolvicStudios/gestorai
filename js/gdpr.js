/**
 * gdpr.js - Cookie Banner RGPD (Reutilizable MolvicStudios)
 * Módulo para mostrar y gestionar el consentimiento de cookies según LSSI-CE y RGPD
 */

const GDPR = {
  LS_KEY: 'gestorai_cookies_consent',
  BANNER_ID: 'gdpr-banner',

  /**
   * Inicializa el banner de consentimiento
   * Se ejecuta en DOMContentLoaded
   */
  init() {
    if (!this.hasConsent()) {
      this.show();
    }
  },

  /**
   * Comprueba si el usuario ya ha dado consentimiento
   * @returns {boolean}
   */
  hasConsent() {
    const consent = localStorage.getItem(this.LS_KEY);
    return consent === 'accepted' || consent === 'rejected';
  },

  /**
   * Obtiene el estado del consentimiento
   * @returns {string|null} 'accepted', 'rejected', o null
   */
  getConsent() {
    return localStorage.getItem(this.LS_KEY);
  },

  /**
   * Muestra el banner de consentimiento
   */
  show() {
    if (document.getElementById(this.BANNER_ID)) {
      return; // Ya existe
    }

    const banner = document.createElement('div');
    banner.id = this.BANNER_ID;
    banner.style.cssText = `
      position: fixed;
      bottom: 1rem;
      left: 1rem;
      right: 1rem;
      max-width: 960px;
      margin: 0 auto;
      background: var(--bg);
      color: var(--text);
      border: 1px solid var(--border);
      border-top: 4px solid var(--primary);
      border-radius: 16px;
      padding: 1rem;
      box-shadow: 0 12px 32px rgba(0, 0, 0, 0.18);
      z-index: 9999;
      font-size: 0.95rem;
      animation: slideUp 0.3s ease-out;
    `;

    banner.innerHTML = `
      <div style="display: grid; gap: 0.9rem;">
        <div style="display: grid; gap: 0.45rem;">
          <strong style="font-size: 1rem; color: var(--text);">Cookies y privacidad</strong>
          <p style="margin: 0; line-height: 1.55; color: var(--text2);">
            GestorIA usa localStorage para guardar sesion, perfil, historial y preferencia visual en este navegador.
            No usamos cookies de rastreo. Puedes revisar la
            <a href="/cookies.html" style="color: var(--primary); text-decoration: underline;">politica de cookies</a>
            y la
            <a href="/privacidad.html" style="color: var(--primary); text-decoration: underline;">politica de privacidad</a>.
          </p>
        </div>
        <div style="display: flex; gap: 0.65rem; flex-wrap: wrap; justify-content: flex-end;">
          <button id="gdpr-reject" class="btn btn-secondary" type="button" style="min-width: 130px; border-color: var(--danger); color: var(--danger);">
            Rechazar
          </button>
          <button id="gdpr-accept" class="btn" type="button" style="min-width: 130px; background: var(--primary); color: white; border: 1px solid var(--primary);">
            Aceptar
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(banner);

    // Event listeners
    document.getElementById('gdpr-accept').addEventListener('click', () => this.accept());
    document.getElementById('gdpr-reject').addEventListener('click', () => this.reject());
  },

  /**
   * Acepta el consentimiento
   */
  accept() {
    localStorage.setItem(this.LS_KEY, 'accepted');
    this.hide();
    // Opcionalmente: inicializar analytics u otros servicios
    console.log('✅ Consentimiento de cookies aceptado');
  },

  /**
   * Rechaza el consentimiento
   */
  reject() {
    localStorage.setItem(this.LS_KEY, 'rejected');
    this.hide();
    console.log('❌ Consentimiento de cookies rechazado');
  },

  /**
   * Oculta el banner
   */
  hide() {
    const banner = document.getElementById(this.BANNER_ID);
    if (banner) {
      banner.style.transition = 'opacity 0.2s ease, transform 0.2s ease';
      banner.style.opacity = '0';
      banner.style.transform = 'translateY(12px)';
      setTimeout(() => banner.remove(), 220);
    }
  },

  /**
   * Resetea el consentimiento (para debugging o cambio de política)
   */
  reset() {
    localStorage.removeItem(this.LS_KEY);
    this.show();
  },
};

// Auto-inicializar en DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {
  GDPR.init();
});

export default GDPR;
