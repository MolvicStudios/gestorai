// js/ccaa-selector.js — Selector CCAA + regímenes especiales
import { supabase as sb } from './auth.js';

let ccaaCache = null;

export async function loadCCAAData() {
  if (ccaaCache) return ccaaCache;
  const { data, error } = await sb.from('ccaa_legislacion').select('*').order('nombre');
  if (error) { console.error('Error cargando CCAA:', error); return []; }
  ccaaCache = data;
  return data;
}

const EMOJI_FLAGS = {
  andalucia: '🟢', aragon: '🟠', asturias: '🔵', baleares: '🟡',
  canarias: '🟣', cantabria: '🔴', castilla_leon: '🟤', castilla_mancha: '🟠',
  cataluna: '🔴', ceuta: '⚫', extremadura: '🟢', galicia: '🔵',
  madrid: '🔴', melilla: '⚫', murcia: '🟣', navarra: '🔴',
  pais_vasco: '🟢', rioja: '🔴', valencia: '🟠'
};

export function renderCCAAGrid(containerId, onSelect) {
  const container = document.getElementById(containerId);
  if (!container) return;

  loadCCAAData().then(ccaas => {
    container.innerHTML = '';
    container.className = 'ccaa-grid';

    for (const ccaa of ccaas) {
      const btn = document.createElement('button');
      btn.className = 'ccaa-btn';
      btn.dataset.ccaa = ccaa.codigo;
      const flag = EMOJI_FLAGS[ccaa.codigo] || '🏳️';
      btn.innerHTML = `<span class="ccaa-flag">${flag}</span><span class="ccaa-name">${ccaa.nombre}</span>`;

      if (ccaa.igic) btn.innerHTML += '<span class="ccaa-badge igic">IGIC</span>';
      if (ccaa.tbai) btn.innerHTML += '<span class="ccaa-badge tbai">TBAI</span>';
      if (ccaa.ipsi) btn.innerHTML += '<span class="ccaa-badge ipsi">IPSI</span>';

      btn.addEventListener('click', () => {
        container.querySelectorAll('.ccaa-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        if (onSelect) onSelect(ccaa);
      });
      container.appendChild(btn);
    }
  });
}

export function getRegimenInfo(ccaa) {
  const info = [];
  if (ccaa.igic) info.push({ tipo: 'IGIC', desc: 'Impuesto General Indirecto Canario (7%)', aplica_iva: false });
  if (ccaa.ipsi) info.push({ tipo: 'IPSI', desc: 'Impuesto sobre Producción, Servicios e Importación', aplica_iva: false });
  if (ccaa.tbai) info.push({ tipo: 'TicketBAI', desc: 'Sistema de facturación obligatorio País Vasco / Navarra' });
  if (ccaa.recargo_equiv !== null && ccaa.recargo_equiv > 0) {
    info.push({ tipo: 'Recargo equiv.', desc: `Recargo de equivalencia: ${ccaa.recargo_equiv}%` });
  }
  return info;
}

export async function saveCCAAToProfile(userId, codigoCcaa) {
  const { error } = await sb.from('profiles').update({ ccaa: codigoCcaa }).eq('id', userId);
  if (error) console.error('Error guardando CCAA:', error);
  return !error;
}

export function renderRegimenPanel(containerId, ccaa) {
  const container = document.getElementById(containerId);
  if (!container || !ccaa) return;

  const regimenes = getRegimenInfo(ccaa);
  if (regimenes.length === 0) {
    container.innerHTML = '<p class="text-muted">Régimen general — IVA estándar</p>';
    return;
  }
  container.innerHTML = `
    <div class="ccaa-regimen-panel">
      <h4>Regímenes especiales — ${ccaa.nombre}</h4>
      <ul class="ccaa-list-info">
        ${regimenes.map(r => `<li><strong>${r.tipo}</strong>: ${r.desc}</li>`).join('')}
      </ul>
    </div>`;
}
