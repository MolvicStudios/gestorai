// js/license.js — GestorAI License System (Lemon Squeezy)

// ── Constantes ────────────────────────────────────────────────────────────────
const LS_PLAN_KEY    = 'gestorai_plan';
const LS_LICENSE_KEY = 'gestorai_license_key';
const LS_BILLING_KEY = 'gestorai_billing_period';
const LS_LAST_CHECK  = 'gestorai_last_check';
const VALIDATE_URL   = '/api/validate-license';

// URLs de checkout
const CHECKOUT_MONTHLY = 'https://molvicstudios.lemonsqueezy.com/checkout/buy/1451042?checkout[custom][product]=gestorai';
const CHECKOUT_YEARLY  = 'https://molvicstudios.lemonsqueezy.com/checkout/buy/1451025?checkout[custom][product]=gestorai';

const FREE_LIMITS = {
  facturas:  { max: 3,  period: 'monthly' },
  contratos: { max: 1,  period: 'monthly' },
  ia:        { max: 5,  period: 'daily'   }
};

function getCounterKey(action) {
  const now = new Date();
  const limit = FREE_LIMITS[action];
  if (!limit) return null;
  if (limit.period === 'daily') {
    const day = now.toISOString().slice(0, 10);
    return `gestorai_daily_${action}_${day}`;
  }
  const month = now.toISOString().slice(0, 7);
  return `gestorai_monthly_${action}_${month}`;
}

// ── Migrar claves antiguas si existen ─────────────────────────────────────────
(function migrateOldKeys() {
  const oldKey = localStorage.getItem('gestorai_pro_license_key');
  if (oldKey && !localStorage.getItem(LS_LICENSE_KEY)) {
    localStorage.setItem(LS_LICENSE_KEY, oldKey);
    localStorage.setItem(LS_PLAN_KEY, 'pro');
    localStorage.setItem(LS_BILLING_KEY, 'mensual');
    // Clean up old keys
    ['gestorai_pro_license_key', 'gestorai_pro_plan', 'gestorai_pro_status',
     'gestorai_pro_verified_at', 'gestorai_pro_expires'].forEach(k => localStorage.removeItem(k));
  }
})();

// ── LicenseSystem ─────────────────────────────────────────────────────────────
const LicenseSystem = {
  isPro() {
    return localStorage.getItem(LS_PLAN_KEY) === 'pro';
  },

  getPlan() {
    return localStorage.getItem(LS_PLAN_KEY) || 'free';
  },

  getBillingPeriod() {
    return localStorage.getItem(LS_BILLING_KEY) || null;
  },

  getStatus() {
    return this.isPro() ? 'active' : null;
  },

  async activate(licenseKey) {
    if (!licenseKey || typeof licenseKey !== 'string') {
      return { success: false, error: 'Introduce una clave de licencia válida.' };
    }

    try {
      const res = await fetch(VALIDATE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ licenseKey: licenseKey.trim() })
      });

      const data = await res.json();

      if (data.valid) {
        localStorage.setItem(LS_PLAN_KEY,    'pro');
        localStorage.setItem(LS_LICENSE_KEY, licenseKey.trim());
        localStorage.setItem(LS_BILLING_KEY, data.billingPeriod || 'mensual');
        localStorage.setItem(LS_LAST_CHECK,  String(Date.now()));
        return { success: true, plan: 'pro', billingPeriod: data.billingPeriod };
      }

      return { success: false, error: data.error || 'Clave de licencia inválida o expirada.' };
    } catch {
      return { success: false, error: 'Error de conexión. Comprueba tu internet.' };
    }
  },

  deactivate() {
    localStorage.removeItem(LS_PLAN_KEY);
    localStorage.removeItem(LS_LICENSE_KEY);
    localStorage.removeItem(LS_BILLING_KEY);
    localStorage.removeItem(LS_LAST_CHECK);
  },

  openCheckout(period = 'mensual') {
    const url = period === 'anual' ? CHECKOUT_YEARLY : CHECKOUT_MONTHLY;
    window.open(url, '_blank');
  },

  // Revalidar cada 7 días en segundo plano
  async validateOnLoad() {
    const key         = localStorage.getItem(LS_LICENSE_KEY);
    const lastChecked = parseInt(localStorage.getItem(LS_LAST_CHECK) || '0');
    const now         = Date.now();
    const sevenDays   = 7 * 24 * 60 * 60 * 1000;

    if (!key) return; // Free user

    if (now - lastChecked < sevenDays) return; // Aún válido

    const result = await this.activate(key);
    if (!result.success) {
      this.deactivate();
      console.warn('[GestorAI] Licencia inválida — plan degradado a Free.');
    }
  },

  // Alias para compatibilidad
  async refresh() {
    return this.validateOnLoad();
  },

  canDo(action) {
    if (this.isPro()) return true;
    const limit = FREE_LIMITS[action];
    if (!limit) return false;
    const counterKey = getCounterKey(action);
    if (!counterKey) return false;
    const used = parseInt(localStorage.getItem(counterKey) || '0', 10);
    return used < limit.max;
  },

  consume(action) {
    if (this.isPro()) return;
    const counterKey = getCounterKey(action);
    if (!counterKey) return;
    const used = parseInt(localStorage.getItem(counterKey) || '0', 10);
    localStorage.setItem(counterKey, (used + 1).toString());
  },

  remaining(action) {
    if (this.isPro()) return Infinity;
    const limit = FREE_LIMITS[action];
    if (!limit) return 0;
    const counterKey = getCounterKey(action);
    if (!counterKey) return 0;
    const used = parseInt(localStorage.getItem(counterKey) || '0', 10);
    return Math.max(0, limit.max - used);
  }
};

// ── Named exports ─────────────────────────────────────────────────────────────
export function getCurrentPlan() { return LicenseSystem.getPlan(); }
export function isPro() { return LicenseSystem.isPro(); }
export function getBillingPeriod() { return LicenseSystem.getBillingPeriod(); }
export async function activateLicense(key) { return LicenseSystem.activate(key); }
export function deactivateLicense() { return LicenseSystem.deactivate(); }
export function openCheckout(period) { return LicenseSystem.openCheckout(period); }
export async function validateOnLoad() { return LicenseSystem.validateOnLoad(); }

export default LicenseSystem;
