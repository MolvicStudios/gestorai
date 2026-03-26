// js/license.js — GestorAI License System (Lemon Squeezy)
// Replaces all Supabase plan/subscription logic

const KEYS = {
  license_key:  'gestorai_pro_license_key',
  plan:         'gestorai_pro_plan',
  status:       'gestorai_pro_status',
  verified_at:  'gestorai_pro_verified_at',
  expires:      'gestorai_pro_expires'
};

const VERIFY_ENDPOINT = '/api/verify-license';

const FREE_LIMITS = {
  facturas:  { max: 3,  period: 'monthly' },
  contratos: { max: 1,  period: 'monthly' },
  ia:        { max: 5,  period: 'daily'   }
};

// Cache TTL: monthly → 24h, annual → 7 days
function getCacheTTL(plan) {
  if (plan === 'annual') return 7 * 24 * 60 * 60 * 1000;
  return 24 * 60 * 60 * 1000;
}

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

function isCacheValid() {
  const verifiedAt = localStorage.getItem(KEYS.verified_at);
  const plan = localStorage.getItem(KEYS.plan);
  if (!verifiedAt || !plan) return false;
  const ttl = getCacheTTL(plan);
  return (Date.now() - parseInt(verifiedAt, 10)) < ttl;
}

const LicenseSystem = {
  isPro() {
    const key = localStorage.getItem(KEYS.license_key);
    const plan = localStorage.getItem(KEYS.plan);
    const status = localStorage.getItem(KEYS.status);
    if (!key || !plan) return false;
    if (status !== 'active' && status !== 'on_trial') return false;
    // Check expiry
    const expires = localStorage.getItem(KEYS.expires);
    if (expires && new Date(expires) < new Date()) return false;
    return true;
  },

  getPlan() {
    if (!this.isPro()) return null;
    return localStorage.getItem(KEYS.plan);
  },

  getStatus() {
    if (!this.isPro()) return null;
    return localStorage.getItem(KEYS.status);
  },

  async activate(licenseKey) {
    if (!licenseKey || typeof licenseKey !== 'string') {
      return { success: false, error: 'Introduce una clave de licencia válida.' };
    }

    try {
      const res = await fetch(VERIFY_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ license_key: licenseKey.trim() })
      });

      const data = await res.json();

      if (!data.valid) {
        const messages = {
          missing_key: 'Clave no proporcionada.',
          inactive: 'La licencia está inactiva o cancelada.',
          server_error: 'Error del servidor. Inténtalo de nuevo.'
        };
        return {
          success: false,
          error: messages[data.reason] || 'Clave de licencia no válida.'
        };
      }

      localStorage.setItem(KEYS.license_key, licenseKey.trim());
      localStorage.setItem(KEYS.plan, data.plan);
      localStorage.setItem(KEYS.status, data.status);
      localStorage.setItem(KEYS.verified_at, Date.now().toString());
      if (data.expires) localStorage.setItem(KEYS.expires, data.expires);

      return { success: true, plan: data.plan };
    } catch {
      return { success: false, error: 'Error de conexión. Comprueba tu internet.' };
    }
  },

  deactivate() {
    Object.values(KEYS).forEach(k => localStorage.removeItem(k));
  },

  async refresh() {
    const key = localStorage.getItem(KEYS.license_key);
    if (!key) return false;
    if (isCacheValid()) return this.isPro();
    const result = await this.activate(key);
    return result.success;
  },

  canDo(action) {
    if (this.isPro()) return true;
    const limit = FREE_LIMITS[action];
    if (!limit) return false; // Unknown action → Pro-only
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

export default LicenseSystem;
