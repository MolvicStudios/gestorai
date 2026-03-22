// js/onboarding.js — Wizard 3 pasos: datos empresa → régimen fiscal + CCAA → confirmación
import { supabase as sb, getUser } from './auth.js';
import { renderCCAAGrid, getRegimenInfo } from './ccaa-selector.js';

const STEPS = ['datos-empresa', 'regimen-ccaa', 'confirmacion'];
let currentStep = 0;
let formData = {};

export function initOnboarding() {
  renderStep(0);
  setupNavigation();
}

function renderStep(idx) {
  currentStep = idx;
  STEPS.forEach((id, i) => {
    const el = document.getElementById(`step-${id}`);
    if (el) el.style.display = i === idx ? 'block' : 'none';
  });

  // Update step indicators
  document.querySelectorAll('.step-indicator').forEach((el, i) => {
    el.classList.toggle('active', i === idx);
    el.classList.toggle('completed', i < idx);
  });

  if (idx === 1) {
    renderCCAAGrid('ccaa-container', (ccaa) => {
      formData.ccaa = ccaa.codigo;
      formData.ccaaData = ccaa;
      const panel = document.getElementById('regimen-info');
      if (panel) {
        const info = getRegimenInfo(ccaa);
        if (info.length > 0) {
          panel.innerHTML = info.map(r => `<div class="alert alert-info"><strong>${r.tipo}</strong>: ${r.desc}</div>`).join('');
        } else {
          panel.innerHTML = '<p class="text-muted">Régimen general — IVA estándar (21%)</p>';
        }
        panel.style.display = 'block';
      }
    });
  }

  if (idx === 2) renderConfirmation();
}

function setupNavigation() {
  document.querySelectorAll('[data-next]').forEach(btn => {
    btn.addEventListener('click', () => {
      if (validateCurrentStep()) {
        collectStepData();
        renderStep(currentStep + 1);
      }
    });
  });
  document.querySelectorAll('[data-prev]').forEach(btn => {
    btn.addEventListener('click', () => renderStep(currentStep - 1));
  });
  const finishBtn = document.getElementById('btn-finish');
  if (finishBtn) finishBtn.addEventListener('click', finishOnboarding);
}

function validateCurrentStep() {
  if (currentStep === 0) {
    const nombre = document.getElementById('ob-nombre')?.value?.trim();
    const nif = document.getElementById('ob-nif')?.value?.trim();
    if (!nombre || !nif) {
      showError('Completa al menos nombre/empresa y NIF.');
      return false;
    }
  }
  if (currentStep === 1 && !formData.ccaa) {
    showError('Selecciona tu Comunidad Autónoma.');
    return false;
  }
  return true;
}

function collectStepData() {
  if (currentStep === 0) {
    formData.nombre = document.getElementById('ob-nombre')?.value?.trim();
    formData.nif = document.getElementById('ob-nif')?.value?.trim();
    formData.empresa = document.getElementById('ob-empresa')?.value?.trim() || '';
    formData.direccion = document.getElementById('ob-direccion')?.value?.trim() || '';
    formData.codigo_postal = document.getElementById('ob-cp')?.value?.trim() || '';
    formData.ciudad = document.getElementById('ob-ciudad')?.value?.trim() || '';
    formData.tipo_actividad = document.getElementById('ob-actividad')?.value || 'autonomo';
  }
}

function renderConfirmation() {
  const el = document.getElementById('confirm-summary');
  if (!el) return;
  el.innerHTML = `
    <div class="card">
      <h4>${formData.empresa || formData.nombre}</h4>
      <p><strong>NIF:</strong> ${formData.nif}</p>
      <p><strong>Dirección:</strong> ${formData.direccion} ${formData.codigo_postal} ${formData.ciudad}</p>
      <p><strong>Actividad:</strong> ${formData.tipo_actividad}</p>
      <p><strong>CCAA:</strong> ${formData.ccaa}</p>
      ${formData.ccaaData?.igic ? '<span class="badge">IGIC</span>' : ''}
      ${formData.ccaaData?.tbai ? '<span class="badge">TicketBAI</span>' : ''}
      ${formData.ccaaData?.ipsi ? '<span class="badge">IPSI</span>' : ''}
    </div>`;
}

async function finishOnboarding() {
  const user = await getUser();
  if (!user) return;

  const { error } = await sb.from('profiles').update({
    nombre: formData.nombre,
    nif: formData.nif,
    empresa: formData.empresa,
    direccion: formData.direccion,
    codigo_postal: formData.codigo_postal,
    ciudad: formData.ciudad,
    tipo_actividad: formData.tipo_actividad,
    ccaa: formData.ccaa,
    onboarding_done: true
  }).eq('id', user.id);

  if (error) {
    showError('Error guardando datos. Inténtalo de nuevo.');
    console.error(error);
    return;
  }
  window.location.href = '/app/dashboard.html';
}

function showError(msg) {
  let toast = document.getElementById('onboarding-error');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'onboarding-error';
    toast.className = 'toast toast-error';
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 3000);
}
