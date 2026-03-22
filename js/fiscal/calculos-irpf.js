// js/fiscal/calculos-irpf.js — Lógica cálculo IRPF / Modelo 130
// Ley 35/2006 del IRPF + Reglamento RD 439/2007

const TIPO_130 = 0.20; // 20% estimación directa

// Gastos deducibles principales para autónomos
export const CATEGORIAS_GASTOS = [
  { id: 'suministros', label: 'Suministros (30% si trabaja en casa)', ejemplo: 'Luz, agua, internet, teléfono' },
  { id: 'seguros', label: 'Seguros', ejemplo: 'RC profesional, autónomo, local' },
  { id: 'materiales', label: 'Materiales y compras', ejemplo: 'Material oficina, herramientas, stock' },
  { id: 'servicios', label: 'Servicios profesionales', ejemplo: 'Gestoría, abogado, marketing' },
  { id: 'amortizaciones', label: 'Amortizaciones', ejemplo: 'Ordenador, vehículo, mobiliario' },
  { id: 'cuotas_ss', label: 'Cuotas Seguridad Social', ejemplo: 'Cuota autónomo RETA' },
  { id: 'formacion', label: 'Formación', ejemplo: 'Cursos, libros profesionales' },
  { id: 'vehiculo', label: 'Gastos vehículo (50%)', ejemplo: 'Combustible, seguro, ITV, reparaciones' },
  { id: 'dietas', label: 'Dietas y viajes', ejemplo: 'Máx 26,67 €/día España, 48,08 €/día extranjero' },
  { id: 'otros', label: 'Otros gastos deducibles', ejemplo: 'Cuotas colegiales, suscripciones profesionales' }
];

/**
 * Calcular Modelo 130 — IRPF Estimación Directa Simplificada
 * @param {Object} params
 * @param {number} params.ingresosAcumulados - Ingresos netos acumulados en el año
 * @param {number} params.gastosAcumulados - Gastos deducibles acumulados en el año
 * @param {number} params.pagosAnteriores - Pagos fraccionados anteriores del año
 * @param {number} params.retencionesAcumuladas - Retenciones soportadas en facturas
 * @returns {Object} Resultado del cálculo con desglose
 */
export function calcularModelo130({ ingresosAcumulados, gastosAcumulados, pagosAnteriores = 0, retencionesAcumuladas = 0 }) {
  const rendimientoNeto = ingresosAcumulados - gastosAcumulados;
  const cuotaIntegra = Math.max(0, rendimientoNeto * TIPO_130);
  const deduccionesAnteriores = pagosAnteriores + retencionesAcumuladas;
  const resultado = cuotaIntegra - deduccionesAnteriores;

  return {
    ingresosAcumulados,
    gastosAcumulados,
    rendimientoNeto,
    tipoAplicable: TIPO_130 * 100,
    cuotaIntegra: redondear(cuotaIntegra),
    pagosAnteriores,
    retencionesAcumuladas,
    resultado: redondear(resultado),
    aIngresar: resultado > 0,
    aCompensar: resultado < 0,
    cero: resultado === 0
  };
}

/**
 * Tabla IRPF 2025 para retenciones de nóminas
 * Tramos estatales + autonómicos (media)
 */
export const TRAMOS_IRPF_2025 = [
  { hasta: 12450, tipo: 19 },
  { hasta: 20200, tipo: 24 },
  { hasta: 35200, tipo: 30 },
  { hasta: 60000, tipo: 37 },
  { hasta: 300000, tipo: 45 },
  { hasta: Infinity, tipo: 47 }
];

/**
 * Calcular retención IRPF sobre base liquidable
 */
export function calcularRetencionIRPF(baseLiquidable) {
  let retencion = 0;
  let baseRestante = baseLiquidable;
  let limiteAnterior = 0;

  for (const tramo of TRAMOS_IRPF_2025) {
    const baseTramo = Math.min(baseRestante, tramo.hasta - limiteAnterior);
    if (baseTramo <= 0) break;
    retencion += baseTramo * (tramo.tipo / 100);
    baseRestante -= baseTramo;
    limiteAnterior = tramo.hasta;
  }

  return redondear(retencion);
}

/**
 * Tipo efectivo de retención IRPF
 */
export function tipoEfectivoIRPF(baseLiquidable) {
  if (baseLiquidable <= 0) return 0;
  const retencion = calcularRetencionIRPF(baseLiquidable);
  return redondear((retencion / baseLiquidable) * 100);
}

function redondear(n) {
  return Math.round(n * 100) / 100;
}
