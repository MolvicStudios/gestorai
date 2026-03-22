// js/plan-gate.js — Gestión acceso Free vs Pro
import { getUserProfile } from './auth.js';

// Límites plan Free
const FREE_LIMITS = {
  facturas_mes: 3,
  contratos_mes: 1,
  consultas_ia_dia: 5,
  modelos_fiscales: false,
  nominas: false,
  pdf_marca_agua: true,
  historial: false,
  exportar_excel: false
};

// Todo disponible en Pro
const PRO_LIMITS = {
  facturas_mes: Infinity,
  contratos_mes: Infinity,
  consultas_ia_dia: Infinity,
  modelos_fiscales: true,
  nominas: true,
  pdf_marca_agua: false,
  historial: true,
  exportar_excel: true
};

export async function getPlanLimits() {
  const profile = await getUserProfile();
  return profile?.plan === 'pro' ? PRO_LIMITS : FREE_LIMITS;
}

export function getLimitsForPlan(plan) {
  return plan === 'pro' ? PRO_LIMITS : FREE_LIMITS;
}

// Muestra modal de upgrade si la función no está disponible
export function showUpgradeModal(feature) {
  const messages = {
    facturas_mes: 'Has llegado al límite de 3 facturas mensuales del plan Free.',
    modelos_fiscales: 'Los modelos fiscales (130, 303, 111) están disponibles solo en el plan Pro.',
    nominas: 'La calculadora de nóminas está disponible solo en el plan Pro.',
    consultas_ia_dia: 'Has usado tus 5 consultas IA de hoy. El plan Pro incluye consultas ilimitadas.',
    contratos_mes: 'Has llegado al límite de 1 contrato mensual del plan Free.'
  };

  const msg = messages[feature] || 'Esta función está disponible solo en el plan Pro.';
  document.dispatchEvent(new CustomEvent('gestorai:upgrade-required', {
    detail: { feature, message: msg, precio: '19,90 €/mes' }
  }));
}

// Wrapper para acciones que requieren Pro
export async function withProAccess(feature, action) {
  const limits = await getPlanLimits();
  if (limits[feature] === false || limits[feature] === 0) {
    showUpgradeModal(feature);
    return false;
  }
  return await action();
}
