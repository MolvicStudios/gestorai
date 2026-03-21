/* GestorIA — Calculadora IRPF / Modelo 130
   Pagos fraccionados para autónomos en estimación directa
*/

export function calcularPagoFraccionado({
  ingresosTrimestrales = 0,
  gastosDeduciblesTrimestrales = 0,
  retencionesSoportadasTrimestrales = 0,
  pagosAnterioresEsteAnio = 0
}) {
  const rendimientoNeto = ingresosTrimestrales - gastosDeduciblesTrimestrales;
  const base = Math.max(0, rendimientoNeto);
  const pago20pct = base * 0.20;
  const pagoNeto = Math.max(0, pago20pct - retencionesSoportadasTrimestrales - pagosAnterioresEsteAnio);

  return {
    ingresos:             Math.round(ingresosTrimestrales),
    gastos:               Math.round(gastosDeduciblesTrimestrales),
    rendimiento_neto:     Math.round(rendimientoNeto),
    base_calculo:         Math.round(base),
    pago_bruto_20pct:     Math.round(pago20pct),
    retenciones:          Math.round(retencionesSoportadasTrimestrales),
    pagos_anteriores:     Math.round(pagosAnterioresEsteAnio),
    resultado_casilla16:  Math.round(pagoNeto),
    a_ingresar:           pagoNeto > 0,
    importe_final:        Math.abs(pagoNeto)
  };
}

export function getHTML130() {
  return `
    <div style="max-width: 700px; margin: 0 auto; padding: 1.5rem;">
      <h2>📊 Calculadora IRPF — Modelo 130</h2>
      <p style="color: var(--text2); margin-bottom: 1.5rem;">
        Calcula tu pago fraccionado trimestral (20% base estimada).
      </p>

      <div style="display: grid; gap: 1.5rem;">
        <div>
          <label for="m130-ingresos">Ingresos trimestral (€)</label>
          <input type="number" id="m130-ingresos" min="0" step="100" value="5000"
                 style="width: 100%; padding: 0.75rem; border: 1px solid var(--border); border-radius: var(--radius-md);">
        </div>

        <div>
          <label for="m130-gastos">Gastos deducibles trimestral (€)</label>
          <input type="number" id="m130-gastos" min="0" step="100" value="1500"
                 style="width: 100%; padding: 0.75rem; border: 1px solid var(--border); border-radius: var(--radius-md);">
        </div>

        <div>
          <label for="m130-retenciones">Retenciones soportadas trimestral (€)</label>
          <input type="number" id="m130-retenciones" min="0" step="100" value="0"
                 style="width: 100%; padding: 0.75rem; border: 1px solid var(--border); border-radius: var(--radius-md);">
        </div>

        <div>
          <label for="m130-pagos-anteriores">Pagos realizados este año (€)</label>
          <input type="number" id="m130-pagos-anteriores" min="0" step="100" value="0"
                 style="width: 100%; padding: 0.75rem; border: 1px solid var(--border); border-radius: var(--radius-md);">
        </div>
      </div>

      <div id="m130-resultado" style="margin-top: 1.5rem; background-color: var(--bg2); padding: 1.5rem; border-radius: var(--radius-md); border: 1px solid var(--border);">
        <h3 style="margin-bottom: 1rem; color: var(--text);">Desglose</h3>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; font-size: 0.95rem; margin-bottom: 1.5rem;">
          <div><span style="color: var(--text3);">Rendim. neto:</span> <strong style="color: var(--text);">€<span id="m130-rend-neto">3.500</span></strong></div>
          <div><span style="color: var(--text3);">Pago 20%:</span> <strong style="color: var(--text);">€<span id="m130-pago-20">700</span></strong></div>
          <div><span style="color: var(--text3);">Retenciones:</span> <strong style="color: var(--text);">€<span id="m130-ret">0</span></strong></div>
          <div><span style="color: var(--text3);">Pagos ant.:</span> <strong style="color: var(--text);">€<span id="m130-ant">0</span></strong></div>
        </div>
        <div style="padding-top: 1rem; border-top: 1px solid var(--border);">
          <div style="font-size: 1.2rem; color: var(--primary);">
            <strong>Casilla 16 (a ingresar): €<span id="m130-casilla16">700</span></strong>
          </div>
        </div>
      </div>

      <div style="margin-top: 1.5rem; padding: 1rem; background-color: var(--accent-light); border-left: 3px solid var(--accent); border-radius: var(--radius-md);">
        <strong>📌 Información:</strong>
        <ul style="margin-top: 0.5rem; margin-left: 1.5rem; color: var(--text); font-size: 0.9rem;">
          <li>Solo para autónomos en estimación directa</li>
          <li>Pago del 20% de la base estimada</li>
          <li>Presentación: 20 de cada mes (trimestral)</li>
          <li>Revisa en <strong>sede.agenciatributaria.gob.es</strong></li>
        </ul>
      </div>
    </div>
  `;
}

export function inicializar130() {
  const inputs = {
    ingresos: document.getElementById('m130-ingresos'),
    gastos: document.getElementById('m130-gastos'),
    retenciones: document.getElementById('m130-retenciones'),
    pagosAnteriores: document.getElementById('m130-pagos-anteriores')
  };

  function actualizar() {
    const resultado = calcularPagoFraccionado({
      ingresosTrimestrales: Number(inputs.ingresos?.value || 0),
      gastosDeduciblesTrimestrales: Number(inputs.gastos?.value || 0),
      retencionesSoportadasTrimestrales: Number(inputs.retenciones?.value || 0),
      pagosAnterioresEsteAnio: Number(inputs.pagosAnteriores?.value || 0)
    });

    if (document.getElementById('m130-rend-neto')) {
      document.getElementById('m130-rend-neto').textContent = resultado.rendimiento_neto.toLocaleString('es-ES');
      document.getElementById('m130-pago-20').textContent = resultado.pago_bruto_20pct.toLocaleString('es-ES');
      document.getElementById('m130-ret').textContent = resultado.retenciones.toLocaleString('es-ES');
      document.getElementById('m130-ant').textContent = resultado.pagos_anteriores.toLocaleString('es-ES');
      document.getElementById('m130-casilla16').textContent = resultado.resultado_casilla16.toLocaleString('es-ES');
    }
  }

  Object.values(inputs).forEach(input => {
    if (input) input.addEventListener('input', actualizar);
  });

  actualizar();
}
