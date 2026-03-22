// js/fiscal/calculos-iva.js — Lógica cálculo IVA / Modelo 303
// Ley 37/1992 del IVA + Reglamento RD 1624/1992

export const TIPOS_IVA = {
  general: { tipo: 21, label: 'General (21%)', ejemplos: 'Servicios profesionales, consultoría, etc.' },
  reducido: { tipo: 10, label: 'Reducido (10%)', ejemplos: 'Hostelería, transporte, renovación vivienda' },
  superreducido: { tipo: 4, label: 'Superreducido (4%)', ejemplos: 'Libros, medicamentos, alimentos básicos' },
  cero: { tipo: 0, label: 'Tipo cero (0%)', ejemplos: 'Productos primera necesidad (prorrogado 2025)' },
  exento: { tipo: 0, label: 'Exento', ejemplos: 'Servicios sanitarios, educación, financieros' }
};

/**
 * Calcular Modelo 303 — IVA Trimestral
 * @param {Object} params
 * @param {Array} params.ventasPorTipo - [{tipo: 21, base: 10000}, {tipo: 10, base: 2000}]
 * @param {Array} params.comprasPorTipo - [{tipo: 21, base: 3000}, {tipo: 10, base: 500}]
 * @param {number} params.compensacionAnterior - Saldo negativo del trimestre anterior
 * @returns {Object} Resultado del cálculo con desglose
 */
export function calcularModelo303({ ventasPorTipo = [], comprasPorTipo = [], compensacionAnterior = 0 }) {
  // IVA Devengado (repercutido en ventas)
  const devengado = ventasPorTipo.map(v => ({
    tipo: v.tipo,
    base: v.base,
    cuota: redondear(v.base * v.tipo / 100)
  }));
  const totalDevengado = devengado.reduce((sum, d) => sum + d.cuota, 0);
  const totalBaseVentas = devengado.reduce((sum, d) => sum + d.base, 0);

  // IVA Deducible (soportado en compras)
  const deducible = comprasPorTipo.map(c => ({
    tipo: c.tipo,
    base: c.base,
    cuota: redondear(c.base * c.tipo / 100)
  }));
  const totalDeducible = deducible.reduce((sum, d) => sum + d.cuota, 0);
  const totalBaseCompras = deducible.reduce((sum, d) => sum + d.base, 0);

  const diferencia = totalDevengado - totalDeducible;
  const resultado = diferencia - compensacionAnterior;

  return {
    devengado,
    deducible,
    totalBaseVentas: redondear(totalBaseVentas),
    totalBaseCompras: redondear(totalBaseCompras),
    totalDevengado: redondear(totalDevengado),
    totalDeducible: redondear(totalDeducible),
    diferencia: redondear(diferencia),
    compensacionAnterior,
    resultado: redondear(resultado),
    aIngresar: resultado > 0,
    aCompensar: resultado < 0
  };
}

/**
 * Calcular IVA de una factura
 */
export function calcularIVAFactura(baseImponible, tipoIVA = 21) {
  const cuota = redondear(baseImponible * tipoIVA / 100);
  return {
    baseImponible: redondear(baseImponible),
    tipoIVA,
    cuota,
    total: redondear(baseImponible + cuota)
  };
}

/**
 * Plazos de presentación del 303
 */
export const PLAZOS_303 = {
  '1T': { inicio: '01-01', fin: '04-20', label: 'Primer trimestre (enero–marzo)' },
  '2T': { inicio: '04-01', fin: '07-22', label: 'Segundo trimestre (abril–junio)' },
  '3T': { inicio: '07-01', fin: '10-20', label: 'Tercer trimestre (julio–septiembre)' },
  '4T': { inicio: '10-01', fin: '01-30', label: 'Cuarto trimestre (octubre–diciembre)' }
};

/**
 * Determinar trimestre actual
 */
export function trimestreActual() {
  const mes = new Date().getMonth() + 1;
  if (mes <= 3) return '1T';
  if (mes <= 6) return '2T';
  if (mes <= 9) return '3T';
  return '4T';
}

function redondear(n) {
  return Math.round(n * 100) / 100;
}
