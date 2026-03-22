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

  const cuotaEmpresa = redondear(baseCotizacion * (es.contingenciasComunes + desempleoEmp + es.fogasa + es.formacion + es.mei + es.accidentesTrabajo) / 100);
  const cuotaTrabajador = redondear(baseCotizacion * (tr.contingenciasComunes + desempleoTrab + tr.formacion + tr.mei) / 100);

  return {
    baseCotizacion,
    empresa: {
      total: cuotaEmpresa,
      porcentajeTotal: redondear(es.contingenciasComunes + desempleoEmp + es.fogasa + es.formacion + es.mei + es.accidentesTrabajo)
    },
    trabajador: {
      total: cuotaTrabajador,
      porcentajeTotal: redondear(tr.contingenciasComunes + desempleoTrab + tr.formacion + tr.mei)
    }
  };
}

/**
 * Calcular finiquito
 */
export function calcularFiniquito({ salarioBrutoMensual, fechaAlta, fechaBaja, diasVacacionesPendientes = 0, pagasExtras = 2 }) {
  const alta = new Date(fechaAlta);
  const baja = new Date(fechaBaja);
  const salarioDiario = salarioBrutoMensual / 30;

  // Días del mes de baja
  const diaDelMes = baja.getDate();
  const salarioMesBaja = redondear(salarioDiario * diaDelMes);

  // Vacaciones no disfrutadas
  const vacaciones = redondear(salarioDiario * diasVacacionesPendientes);

  // Parte proporcional pagas extra
  const diasDesdeUltimaPaga = diasDesde(ultimaPagaExtra(baja), baja);
  const parteProporcionalPagas = redondear((salarioBrutoMensual / 365) * diasDesdeUltimaPaga * pagasExtras);

  const totalBruto = redondear(salarioMesBaja + vacaciones + parteProporcionalPagas);

  return {
    salarioMesBaja,
    vacaciones,
    diasVacacionesPendientes,
    parteProporcionalPagas,
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
