/* GestorIA — Cuota de Autónomos 2026
   Calculadora interactiva
*/

const TRAMOS_2026 = [
  { min: 0,      max: 670,     cuota: 225.90 },
  { min: 670,    max: 900,     cuota: 250.00 },
  { min: 900,    max: 1166,    cuota: 267.00 },
  { min: 1166,   max: 1300,    cuota: 291.00 },
  { min: 1300,   max: 1500,    cuota: 294.00 },
  { min: 1500,   max: 1700,    cuota: 300.00 },
  { min: 1700,   max: 1850,    cuota: 310.00 },
  { min: 1850,   max: 2030,    cuota: 320.00 },
  { min: 2030,   max: 2330,    cuota: 340.00 },
  { min: 2330,   max: 2760,    cuota: 370.00 },
  { min: 2760,   max: 3190,    cuota: 420.00 },
  { min: 3190,   max: 3620,    cuota: 461.00 },
  { min: 3620,   max: 4050,    cuota: 505.00 },
  { min: 4050,   max: Infinity, cuota: 530.98 }
];

/**
 * Calcular cuota de autónomo según ingresos anuales
 * @param {number} ingresosNetosAnuales - Ingresos netos anuales en euros
 * @returns {Object} Desglose de cuota
 */
export function calcularCuotaAutonomos(ingresosNetosAnuales) {
  const ingresosNetos = Number(ingresosNetosAnuales) || 0;
  const ingresosMensuales = ingresosNetos / 12;

  const tramo = TRAMOS_2026.find(t =>
    ingresosMensuales >= t.min && ingresosMensuales < t.max
  ) || TRAMOS_2026[TRAMOS_2026.length - 1];

  const cuotaMensual = tramo.cuota;
  const cuotaAnual = cuotaMensual * 12;

  return {
    ingresos_anuales:       Math.round(ingresosNetos),
    ingresos_mensuales:     Math.round(ingresosMensuales),
    cuota_mensual:          cuotaMensual.toFixed(2),
    cuota_anual:            Math.round(cuotaAnual),
    tramo_min:              tramo.min,
    tramo_max:              tramo.max === Infinity ? '6.000+' : tramo.max,
    porcentaje_sobre_ingresos: ingresosMensuales > 0
      ? ((cuotaMensual / ingresosMensuales) * 100).toFixed(1) + '%'
      : '0%',
    observaciones: [
      'Cuota 2026 según RETA',
      'Incluye contingencias comunes: jubilación, incapacidad temporal, maternidad',
      'Posible bonificación si eres menor de 30 años (25% de descuento los primeros 12 meses)',
      'VeriFactu obligatorio desde julio 2027'
    ]
  };
}

/**
 * Obtener HTML de la herramienta
 */
export function getHTMLCuota() {
  return `
    <div style="max-width: 600px; margin: 0 auto; padding: 1.5rem;">
      <h2>💰 Calculadora Cuota de Autónomos 2026</h2>
      <p style="color: var(--text2); margin-bottom: 1.5rem;">
        Calcula tu cuota mensual de autónomo según tus ingresos estimados.
      </p>

      <div style="margin-bottom: 1.5rem;">
        <label for="cuota-ingresos" style="display: block; margin-bottom: 0.5rem; font-weight: 500;">
          Ingresos netos anuales estimados (€)
        </label>
        <input type="number" id="cuota-ingresos" min="0" max="500000" step="100"
               value="30000" style="width: 100%; padding: 0.75rem; border: 1px solid var(--border); border-radius: var(--radius-md);">
        <input type="range" id="cuota-slider" min="0" max="100000" step="1000"
               value="30000" style="width: 100%; margin-top: 0.75rem; cursor: pointer;">
      </div>

      <div id="cuota-resultado" style="background-color: var(--bg2); padding: 1.5rem; border-radius: var(--radius-md); border: 1px solid var(--border);">
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
          <div>
            <div style="color: var(--text3); font-size: 0.85rem; margin-bottom: 0.25rem;">Ingresos mensuales</div>
            <div style="font-size: 1.25rem; font-weight: 600; color: var(--text);">€<span id="cuota-ing-mes">2.500</span></div>
          </div>
          <div>
            <div style="color: var(--text3); font-size: 0.85rem; margin-bottom: 0.25rem;">Cuota mensual</div>
            <div style="font-size: 1.5rem; font-weight: 600; color: var(--primary);">€<span id="cuota-cuota-mes">290.00</span></div>
          </div>
          <div>
            <div style="color: var(--text3); font-size: 0.85rem; margin-bottom: 0.25rem;">Cuota anual (×12)</div>
            <div style="font-size: 1.25rem; font-weight: 600; color: var(--text);">€<span id="cuota-cuota-anio">3.480</span></div>
          </div>
          <div>
            <div style="color: var(--text3); font-size: 0.85rem; margin-bottom: 0.25rem;">% sobre ingresos</div>
            <div style="font-size: 1.25rem; font-weight: 600; color: var(--text);"><span id="cuota-porcentaje">11.6%</span></div>
          </div>
        </div>
        <div style="margin-top: 1rem; padding-top: 1rem; border-top: 1px solid var(--border); font-size: 0.9rem; color: var(--text2);">
          <strong>Tramo:</strong> Ingresos mensuales entre €<span id="cuota-tramo-min">1.166</span> y €<span id="cuota-tramo-max">1.300</span>
        </div>
      </div>

      <div style="margin-top: 1.5rem; padding: 1rem; background-color: var(--accent-light); border-left: 3px solid var(--accent); border-radius: var(--radius-md);">
        <strong>📌 Notas importantes:</strong>
        <ul style="margin-top: 0.5rem; margin-left: 1.5rem; color: var(--text); font-size: 0.9rem;">
          <li>Cuota de 2026 según RETA</li>
          <li>Descuentos posibles para menores de 30 años</li>
          <li>No incluye otros impuestos (IRPF, IVA)</li>
          <li>Consulta con tu asesor para tu situación específica</li>
        </ul>
      </div>
    </div>
  `;
}

/**
 * Inicializar interactividad
 */
export function inicializarCuota() {
  const inputIngresos = document.getElementById('cuota-ingresos');
  const inputSlider = document.getElementById('cuota-slider');

  function actualizar(valor) {
    const resultado = calcularCuotaAutonomos(valor);

    document.getElementById('cuota-ing-mes').textContent = Math.round(resultado.ingresos_mensuales).toLocaleString('es-ES');
    document.getElementById('cuota-cuota-mes').textContent = resultado.cuota_mensual;
    document.getElementById('cuota-cuota-anio').textContent = resultado.cuota_anual.toLocaleString('es-ES');
    document.getElementById('cuota-porcentaje').textContent = resultado.porcentaje_sobre_ingresos;
    document.getElementById('cuota-tramo-min').textContent = resultado.tramo_min.toLocaleString('es-ES');
    document.getElementById('cuota-tramo-max').textContent = resultado.tramo_max.toLocaleString('es-ES');
  }

  if (inputIngresos) {
    inputIngresos.addEventListener('input', (e) => {
      inputSlider.value = e.target.value;
      actualizar(e.target.value);
    });
  }

  if (inputSlider) {
    inputSlider.addEventListener('input', (e) => {
      inputIngresos.value = e.target.value;
      actualizar(e.target.value);
    });
  }

  actualizar(30000);
}
