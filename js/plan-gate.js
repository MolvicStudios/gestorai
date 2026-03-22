// js/plan-gate.js — Control Free / Pro + modal Gumroad
import { isPro, supabase as sb } from './auth.js';

const GUMROAD_URL = 'https://josemole5.gumroad.com/l/gestorai-pro';

/* ----------  Verificación facturas (RPC server-side)  ---------- */
export async function verificarLimiteFactura() {
  const pro = await isPro();
  if (pro) return true;
  const { data, error } = await sb.rpc('contar_facturas_mes');
  if (error) { console.error(error); return false; }
  if (data >= 3) { mostrarUpgradeModal('facturas'); return false; }
  return true;
}

/* ----------  Wrapper genérico  ---------- */
export async function conAccesoPro(feature, fn) {
  const pro = await isPro();
  if (pro) return fn();

  const limites = {
    modelos: false, nominas: false, historial: false,
    exportar: false, contratos_extra: false
  };
  if (limites[feature] === false) { mostrarUpgradeModal(feature); return null; }
  return fn();
}

/* ----------  Modal upgrade  ---------- */
export function mostrarUpgradeModal(feature) {
  const msgs = {
    facturas:  'Has alcanzado el límite de 3 facturas/mes del plan Free.',
    modelos:   'Los modelos fiscales están disponibles en el plan Pro.',
    nominas:   'La calculadora de nóminas es exclusiva del plan Pro.',
    ia:        'Has agotado tus 5 consultas IA de hoy.',
    historial: 'El historial completo está en el plan Pro.',
    exportar:  'La exportación a Excel es exclusiva del plan Pro.',
    default:   'Esta función requiere el plan Pro.'
  };
  const msg = msgs[feature] || msgs.default;

  // Reusar modal existente o crear
  let modal = document.getElementById('modal-upgrade');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'modal-upgrade';
    modal.className = 'modal-overlay';
    document.body.appendChild(modal);
  }
  modal.innerHTML = `
    <div class="modal-card">
      <h3>⚡ Pasa a Pro</h3>
      <p>${msg}</p>
      <ul style="text-align:left;margin:1rem 0;line-height:1.8">
        <li>✅ Facturas y contratos ilimitados</li>
        <li>✅ Modelos fiscales + nóminas</li>
        <li>✅ IA ilimitada · PDF sin marca de agua</li>
        <li>✅ 7 días de prueba GRATIS</li>
      </ul>
      <p style="font-size:1.5rem;font-weight:700;color:var(--primary)">19,90 €/mes</p>
      <a href="${GUMROAD_URL}" target="_blank" rel="noopener" class="btn btn-primary" style="width:100%;margin:.5rem 0">
        Empezar prueba gratuita
      </a>
      <button onclick="this.closest('.modal-overlay').remove()" class="btn btn-secondary" style="width:100%">Ahora no</button>
    </div>`;
  modal.style.display = 'flex';
}
