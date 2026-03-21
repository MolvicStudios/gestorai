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

    const estilos = getComputedStyle(document.documentElement);
    const bg = estilos.getPropertyValue('--bg').trim() || '#ffffff';
    const bg2 = estilos.getPropertyValue('--bg2').trim() || '#f8f9fa';
    const text = estilos.getPropertyValue('--text').trim() || '#1a1a1a';
    const text2 = estilos.getPropertyValue('--text2').trim() || '#6b6b6b';
    const border = estilos.getPropertyValue('--border').trim() || '#e5e7eb';
    const primary = estilos.getPropertyValue('--primary').trim() || '#1D9E75';
    const danger = estilos.getPropertyValue('--danger').trim() || '#E24B4A';

    const banner = document.createElement('div');
    banner.id = this.BANNER_ID;
    banner.style.cssText = `
      position: fixed;
      inset: 0;
      display: flex;
      align-items: flex-end;
      justify-content: center;
      padding: 1rem;
      background: rgba(0, 0, 0, 0.38);
      z-index: 2147483647;
      opacity: 1;
    `;

    banner.innerHTML = `
      <div style="display: grid; gap: 0.9rem; width: min(960px, 100%); background: ${bg}; color: ${text}; border: 1px solid ${border}; border-top: 4px solid ${primary}; border-radius: 16px; padding: 1rem; box-shadow: 0 12px 32px rgba(0, 0, 0, 0.28); opacity: 1;">
        <div style="display: grid; gap: 0.45rem;">
          <strong style="font-size: 1rem; color: ${text};">Cookies y privacidad</strong>
          <p style="margin: 0; line-height: 1.55; color: ${text2};">
            GestorIA usa localStorage para guardar sesion, perfil, historial y preferencia visual en este navegador.
            No usamos cookies de rastreo. Puedes revisar la
            <a href="/cookies.html" style="color: ${primary}; text-decoration: underline;">politica de cookies</a>
            y la
            <a href="/privacidad.html" style="color: ${primary}; text-decoration: underline;">politica de privacidad</a>.
          </p>
        </div>
        <div style="display: flex; gap: 0.65rem; flex-wrap: wrap; justify-content: flex-end;">
          <button id="gdpr-reject" class="btn btn-secondary" type="button" style="min-width: 130px; background: ${bg2}; border: 1px solid ${danger}; color: ${danger};">
            Rechazar
          </button>
          <button id="gdpr-accept" class="btn" type="button" style="min-width: 130px; background: ${primary}; color: white; border: 1px solid ${primary};">
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
      banner.style.transform = 'translateY(0)';
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
