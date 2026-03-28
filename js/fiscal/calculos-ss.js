// js/fiscal/calculos-ss.js — Lógica Seguridad Social
// Orden PJC/178/2025 + RD 87/2025

// SMI 2025
export const SMI_2025 = {
  mensual: 1184,
  anual14: 16576, // 14 pagas
  anual12: 19344  // 12 pagas (prorrateada)
};

// RETA (Autónomos) 2025
export const RETA_2025 = {
  baseMinima: 950.98,
  baseMaxima: 4909.50,
  tipoGeneral: 31.40,
  cuotaMinima: 298.60,
  tarifaPlana: 80, // primer año nuevos autónomos
  mei: 0.70 // incluido en tipo general
};

// Tramos cotización autónomos por rendimientos netos 2025
export const TRAMOS_RETA_2025 = [
  { desde: 0, hasta: 670, baseMinima: 653.59, baseMaxima: 718.95 },
  { desde: 670.01, hasta: 900, baseMinima: 718.95, baseMaxima: 900 },
  { desde: 900.01, hasta: 1166.70, baseMinima: 849.67, baseMaxima: 1166.70 },
  { desde: 1166.71, hasta: 1300, baseMinima: 950.98, baseMaxima: 1300 },
  { desde: 1300.01, hasta: 1500, baseMinima: 960.78, baseMaxima: 1500 },
  { desde: 1500.01, hasta: 1700, baseMinima: 960.78, baseMaxima: 1700 },
  { desde: 1700.01, hasta: 1850, baseMinima: 1143.79, baseMaxima: 1850 },
  { desde: 1850.01, hasta: 2030, baseMinima: 1209.15, baseMaxima: 2030 },
  { desde: 2030.01, hasta: 2330, baseMinima: 1274.51, baseMaxima: 2330 },
  { desde: 2330.01, hasta: 2760, baseMinima: 1356.21, baseMaxima: 2760 },
  { desde: 2760.01, hasta: 3190, baseMinima: 1437.91, baseMaxima: 3190 },
  { desde: 3190.01, hasta: 3620, baseMinima: 1519.61, baseMaxima: 3620 },
  { desde: 3620.01, hasta: 4050, baseMinima: 1601.31, baseMaxima: 4050 },
  { desde: 4050.01, hasta: 6000, baseMinima: 1732.03, baseMaxima: 4720.50 },
  { desde: 6000.01, hasta: Infinity, baseMinima: 1732.03, baseMaxima: 4909.50 }
];

// Tipos cotización Régimen General (empresa + trabajador)
export const RG_2025 = {
  empresa: {
    contingenciasComunes: 23.60,
    desempleoIndefinido: 5.50,
    desempleoTemporal: 6.70,
    fogasa: 0.20,
    formacion: 0.60,
    mei: 0.58,
    accidentesTrabajo: 1.50 // media, varía por CNAE
  },
  trabajador: {
    contingenciasComunes: 4.70,
    desempleoIndefinido: 1.55,
    desempleoTemporal: 1.60,
    formacion: 0.10,
    mei: 0.12
  }
};

/**
 * Calcular cuota autónomo por rendimientos netos
 */
export function calcularCuotaAutonomo(rendimientoNetoMensual, tarifaPlana = false) {
  if (tarifaPlana) {
    return { base: RETA_2025.baseMinima, cuota: RETA_2025.tarifaPlana, esTarifaPlana: true };
  }

  const tramo = TRAMOS_RETA_2025.find(
    t => rendimientoNetoMensual >= t.desde && rendimientoNetoMensual <= t.hasta
  );

  if (!tramo) {
    return { base: RETA_2025.baseMinima, cuota: RETA_2025.cuotaMinima, esTarifaPlana: false };
  }

  const cuota = redondear(tramo.baseMinima * RETA_2025.tipoGeneral / 100);
  return {
    base: tramo.baseMinima,
    baseMaxima: tramo.baseMaxima,
    cuota,
    esTarifaPlana: false
  };
}

/**
 * Calcular cuotas SS de una nómina (empresa + trabajador)
 * @param {number} baseCotizacion - Base de cotización mensual
 * @param {string} tipoContrato - 'indefinido' o 'temporal'
 */
export function calcularCuotasSS(baseCotizacion, tipoContrato = 'indefinido') {
  const es = RG_2025.empresa;
  const tr = RG_2025.trabajador;
  const desempleoEmp = tipoContrato === 'temporal' ? es.desempleoTemporal : es.desempleoIndefinido;
  const desempleoTrab = tipoContrato === 'temporal' ? tr.desempleoTemporal : tr.desempleoIndefinido;

  const empCC = redondear(baseCotizacion * es.contingenciasComunes / 100);
  const empDesempleo = redondear(baseCotizacion * desempleoEmp / 100);
  const empFogasa = redondear(baseCotizacion * es.fogasa / 100);
  const empFormacion = redondear(baseCotizacion * es.formacion / 100);
  const empMEI = redondear(baseCotizacion * es.mei / 100);
  const empAT = redondear(baseCotizacion * es.accidentesTrabajo / 100);
  const cuotaEmpresa = redondear(empCC + empDesempleo + empFogasa + empFormacion + empMEI + empAT);

  const trabCC = redondear(baseCotizacion * tr.contingenciasComunes / 100);
  const trabDesempleo = redondear(baseCotizacion * desempleoTrab / 100);
  const trabFormacion = redondear(baseCotizacion * tr.formacion / 100);
  const trabMEI = redondear(baseCotizacion * tr.mei / 100);
  const cuotaTrabajador = redondear(trabCC + trabDesempleo + trabFormacion + trabMEI);

  return {
    baseCotizacion,
    empresa: {
      total: cuotaEmpresa,
      porcentajeTotal: redondear(es.contingenciasComunes + desempleoEmp + es.fogasa + es.formacion + es.mei + es.accidentesTrabajo),
      contingencias_comunes: empCC,
      desempleo: empDesempleo,
      fogasa: empFogasa,
      formacion: empFormacion,
      mei: empMEI,
      at_ep: empAT
    },
    trabajador: {
      total: cuotaTrabajador,
      porcentajeTotal: redondear(tr.contingenciasComunes + desempleoTrab + tr.formacion + tr.mei),
      contingencias_comunes: trabCC,
      desempleo: trabDesempleo,
      formacion: trabFormacion,
      mei: trabMEI
    }
  };
}

/**
 * Calcular finiquito
 */
export function calcularFiniquito({
  salarioBrutoMensual,
  fechaAlta, fechaBaja,          // legacy params
  fechaInicio, fechaFin,          // new params from finiquito.html
  diasVacacionesPendientes = 0,
  diasVacacionesTotales = 30,
  diasVacacionesDisfrutados = 0,
  pagasExtras = 2,
  numPagas = 14,
  motivo = 'baja_voluntaria'
}) {
  // Normalise date params (accept both old and new names)
  const alta = new Date(fechaInicio || fechaAlta);
  const baja = new Date(fechaFin || fechaBaja);
  const salarioDiario = salarioBrutoMensual / 30;

  // Días trabajados en el mes de baja
  const diaDelMes = baja.getDate();
  const salarioDiasTrabajados = redondear(salarioDiario * diaDelMes);

  // Vacaciones no disfrutadas — calculate from totals if individual pending not given
  const diasPendientes = diasVacacionesPendientes || Math.max(0, diasVacacionesTotales - diasVacacionesDisfrutados);
  const vacacionesPendientes = redondear(salarioDiario * diasPendientes);

  // Parte proporcional pagas extra (only for 14-pay schemes)
  const efectivoPagas = numPagas === 12 ? 0 : (pagasExtras || 2);
  const diasDesdeUltimaPaga = diasDesde(ultimaPagaExtra(baja), baja);
  const pagasExtrasImporte = redondear((salarioBrutoMensual / 365) * diasDesdeUltimaPaga * efectivoPagas);

  // Indemnización según motivo
  const antiguedadDias = diasDesde(alta, baja);
  const salarioDiarioAnual = (salarioBrutoMensual * 12) / 365;
  let indemnizacion = 0;
  if (motivo === 'despido_improcedente') {
    indemnizacion = redondear(salarioDiarioAnual * 33 * antiguedadDias / 365);
  } else if (motivo === 'despido_procedente' || motivo === 'ere') {
    indemnizacion = redondear(salarioDiarioAnual * 20 * antiguedadDias / 365);
  } else if (motivo === 'fin_contrato') {
    indemnizacion = redondear(salarioDiarioAnual * 12 * antiguedadDias / 365);
  }

  const totalBruto = redondear(salarioDiasTrabajados + vacacionesPendientes + pagasExtrasImporte + indemnizacion);

  return {
    salarioDiasTrabajados,
    salarioMesBaja: salarioDiasTrabajados, // legacy alias
    vacacionesPendientes,
    vacaciones: vacacionesPendientes,       // legacy alias
    diasVacacionesPendientes: diasPendientes,
    pagasExtras: pagasExtrasImporte,
    parteProporcionalPagas: pagasExtrasImporte, // legacy alias
    indemnizacion,
    totalBruto
  };
}

function ultimaPagaExtra(fecha) {
  const mes = fecha.getMonth();
  const anio = fecha.getFullYear();
  if (mes >= 6) return new Date(anio, 5, 30); // junio
  return new Date(anio - 1, 11, 31); // diciembre anterior
}

function diasDesde(desde, hasta) {
  return Math.floor((hasta - desde) / (1000 * 60 * 60 * 24));
}

function redondear(n) {
  return Math.round(n * 100) / 100;
}
