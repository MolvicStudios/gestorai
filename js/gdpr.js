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
      bottom: 0;
      left: 0;
      right: 0;
      background: var(--color-surface);
      border-top: 2px solid var(--color-primary);
      padding: 1rem;
      box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.1);
      z-index: 9999;
      font-size: 0.9rem;
      animation: slideUp 0.3s ease-out;
    `;

    banner.innerHTML = `
      <div class="container" style="display: flex; justify-content: space-between; align-items: center; gap: 1rem; flex-wrap: wrap;">
        <div>
          <p style="margin: 0; line-height: 1.5;">
            <strong>🍪 Política de Cookies:</strong> Usamos localStorage (no cookies de rastreo) para guardar tu sesión, perfil e historial en tu navegador.
            Al aceptar, consenties el almacenamiento según nuestra <a href="/cookies.html" style="color: var(--color-primary); text-decoration: underline;">política de cookies</a> y <a href="/privacidad.html" style="color: var(--color-primary); text-decoration: underline;">privacidad</a>.
          </p>
        </div>
        <div style="display: flex; gap: 0.5rem; flex-shrink: 0;">
          <button id="gdpr-reject" class="btn" style="background: var(--color-danger); color: white; padding: 0.5rem 1rem; cursor: pointer;">
            Rechazar
          </button>
          <button id="gdpr-accept" class="btn" style="background: var(--color-primary); color: white; padding: 0.5rem 1rem; cursor: pointer;">
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
      banner.style.animation = 'slideDown 0.3s ease-out forwards';
      setTimeout(() => banner.remove(), 300);
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
