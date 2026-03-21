/* GestorIA — Prellenado Orientativo Modelo 303
   IVA Trimestral - Casillas principales
*/

export function calcularModelo303({
  baseImponible21 = 0,
  baseImponible10 = 0,
  baseImponible4 = 0,
  ivaDeducible = 0,
  compensaciones = 0
}) {
  const cuota21 = Math.round(baseImponible21 * 0.21 * 100) / 100;
  const cuota10 = Math.round(baseImponible10 * 0.10 * 100) / 100;
  const cuota4 = Math.round(baseImponible4 * 0.04 * 100) / 100;
  const totalDevengado = cuota21 + cuota10 + cuota4;
  const resultado = totalDevengado - ivaDeducible - compensaciones;

  return {
    casilla_01: Math.round(baseImponible21 * 100) / 100,
    casilla_02: cuota21,
    casilla_06: Math.round(baseImponible10 * 100) / 100,
    casilla_07: cuota10,
    casilla_10: Math.round(baseImponible4 * 100) / 100,
    casilla_11: cuota4,
    casilla_46: Math.round(totalDevengado * 100) / 100,
    casilla_48: Math.round(ivaDeducible * 100) / 100,
    casilla_64: Math.round(compensaciones * 100) / 100,
    casilla_66: Math.round(resultado * 100) / 100,
    a_ingresar: resultado > 0,
    a_compensar: resultado < 0
  };
}

export function getHTML303() {
  return `
    <div style="max-width: 700px; margin: 0 auto; padding: 1.5rem;">
      <h2>📋 Prellenado Orientativo Modelo 303</h2>
      <p style="color: var(--text2); margin-bottom: 1.5rem;">
        Calcula las casillas principales de tu declaración trimestral de IVA.
      </p>

      <div style="display: grid; gap: 1rem;">
        <h4 style="margin-top: 1rem; margin-bottom: 0.5rem;">📤 Cuotas Devengadas (Ventas)</h4>
        
        <div>
          <label for="m303-base21">Base imponible 21% (€)</label>
          <input type="number" id="m303-base21" min="0" step="100" value="5000"
                 style="width: 100%; padding: 0.75rem; border: 1px solid var(--border); border-radius: var(--radius-md);">
          <small style="color: var(--text3);">Cuota resultante: 21%</small>
        </div>

        <div>
          <label for="m303-base10">Base imponible 10% (€)</label>
          <input type="number" id="m303-base10" min="0" step="100" value="2000"
                 style="width: 100%; padding: 0.75rem; border: 1px solid var(--border); border-radius: var(--radius-md);">
          <small style="color: var(--text3);">Hostelería, libros, etc.</small>
        </div>

        <div>
          <label for="m303-base4">Base imponible 4% (€)</label>
          <input type="number" id="m303-base4" min="0" step="100" value="500"
                 style="width: 100%; padding: 0.75rem; border: 1px solid var(--border); border-radius: var(--radius-md);">
          <small style="color: var(--text3);">Alimentos básicos, etc.</small>
        </div>

        <h4 style="margin-top: 1rem; margin-bottom: 0.5rem;">📥 Cuotas Soportadas (Compras)</h4>

        <div>
          <label for="m303-deducible">IVA soportado deducible (€)</label>
          <input type="number" id="m303-deducible" min="0" step="100" value="1500"
                 style="width: 100%; padding: 0.75rem; border: 1px solid var(--border); border-radius: var(--radius-md);">
          <small style="color: var(--text3);">IVA de facturas recibidas</small>
        </div>

        <div>
          <label for="m303-comp">Compensaciones de trimestres anteriores (€)</label>
          <input type="number" id="m303-comp" min="0" step="100" value="0"
                 style="width: 100%; padding: 0.75rem; border: 1px solid var(--border); border-radius: var(--radius-md);">
        </div>
      </div>

      <div id="m303-resultado" style="margin-top: 1.5rem; background-color: var(--bg2); padding: 1.5rem; border-radius: var(--radius-md); border: 1px solid var(--border);">
        <h3 style="margin-bottom: 1rem; color: var(--text);">Casillas Modelo 303</h3>
        <div style="font-family: var(--font-mono); font-size: 0.9rem; display: grid; gap: 0.5rem;">
          <div style="display: grid; grid-template-columns: 60px 200px 1fr; gap: 0.75rem; padding: 0.5rem; border-bottom: 1px solid var(--border);">
            <strong>Cas.</strong> <strong>Descripción</strong> <strong>Importe</strong>
          </div>
          <div style="display: grid; grid-template-columns: 60px 200px 1fr; gap: 0.75rem; padding: 0.5rem;">
            <code>01</code> <span>Base 21%</span> <strong>€<span id="m303-c01">5.000</span></strong>
          </div>
          <div style="display: grid; grid-template-columns: 60px 200px 1fr; gap: 0.75rem; padding: 0.5rem;">
            <code>02</code> <span>Cuota 21%</span> <strong>€<span id="m303-c02">1.050</span></strong>
          </div>
          <div style="display: grid; grid-template-columns: 60px 200px 1fr; gap: 0.75rem; padding: 0.5rem;">
            <code>06</code> <span>Base 10%</span> <strong>€<span id="m303-c06">2.000</span></strong>
          </div>
          <div style="display: grid; grid-template-columns: 60px 200px 1fr; gap: 0.75rem; padding: 0.5rem;">
            <code>07</code> <span>Cuota 10%</span> <strong>€<span id="m303-c07">200</span></strong>
          </div>
          <div style="display: grid; grid-template-columns: 60px 200px 1fr; gap: 0.75rem; padding: 0.5rem;">
            <code>10</code> <span>Base 4%</span> <strong>€<span id="m303-c10">500</span></strong>
          </div>
          <div style="display: grid; grid-template-columns: 60px 200px 1fr; gap: 0.75rem; padding: 0.5rem; border-bottom: 2px solid var(--border);">
            <code>11</code> <span>Cuota 4%</span> <strong>€<span id="m303-c11">20</span></strong>
          </div>
          <div style="display: grid; grid-template-columns: 60px 200px 1fr; gap: 0.75rem; padding: 0.5rem; background: var(--primary-light); border-radius: var(--radius-sm);">
            <code>46</code> <span><strong>Total Devengado</strong></span> <strong>€<span id="m303-c46">1.270</span></strong>
          </div>
          <div style="display: grid; grid-template-columns: 60px 200px 1fr; gap: 0.75rem; padding: 0.5rem;">
            <code>48</code> <span>IVA Deducible</span> <strong>€<span id="m303-c48">1.500</span></strong>
          </div>
          <div style="display: grid; grid-template-columns: 60px 200px 1fr; gap: 0.75rem; padding: 0.5rem;">
            <code>64</code> <span>Compensaciones</span> <strong>€<span id="m303-c64">0</span></strong>
          </div>
          <div style="display: grid; grid-template-columns: 60px 200px 1fr; gap: 0.75rem; padding: 0.75rem; background: var(--primary); color: white; border-radius: var(--radius-sm); font-weight: 600;">
            <code>66</code> <span><strong>Resultado</strong></span> <strong>€<span id="m303-c66">-230</span></strong>
          </div>
        </div>
      </div>

      <div style="margin-top: 1.5rem; padding: 1rem; background-color: var(--accent-light); border-left: 3px solid var(--accent); border-radius: var(--radius-md);">
        <strong>ℹ️ Información importante:</strong>
        <ul style="margin-top: 0.5rem; margin-left: 1.5rem; color: var(--text); font-size: 0.9rem;">
          <li>Valores orientativos — revisa antes de presentar</li>
          <li>Presentación obligatoria en <strong>sede.agenciatributaria.gob.es</strong></li>
          <li>Plazo: día 20 del mes siguiente al trimestre</li>
          <li>Modelo 303 si resultado negativo se puede compensar trimestres posteriores</li>
        </ul>
      </div>
    </div>
  `;
}

export function inicializar303() {
  const inputs = {
    base21: document.getElementById('m303-base21'),
    base10: document.getElementById('m303-base10'),
    base4: document.getElementById('m303-base4'),
    deducible: document.getElementById('m303-deducible'),
    comp: document.getElementById('m303-comp')
  };

  function actualizar() {
    const resultado = calcularModelo303({
      baseImponible21: Number(inputs.base21?.value || 0),
      baseImponible10: Number(inputs.base10?.value || 0),
      baseImponible4: Number(inputs.base4?.value || 0),
      ivaDeducible: Number(inputs.deducible?.value || 0),
      compensaciones: Number(inputs.comp?.value || 0)
    });

    if (document.getElementById('m303-c01')) {
      document.getElementById('m303-c01').textContent = resultado.casilla_01.toLocaleString('es-ES');
      document.getElementById('m303-c02').textContent = resultado.casilla_02.toLocaleString('es-ES');
      document.getElementById('m303-c06').textContent = resultado.casilla_06.toLocaleString('es-ES');
      document.getElementById('m303-c07').textContent = resultado.casilla_07.toLocaleString('es-ES');
      document.getElementById('m303-c10').textContent = resultado.casilla_10.toLocaleString('es-ES');
      document.getElementById('m303-c11').textContent = resultado.casilla_11.toLocaleString('es-ES');
      document.getElementById('m303-c46').textContent = resultado.casilla_46.toLocaleString('es-ES');
      document.getElementById('m303-c48').textContent = resultado.casilla_48.toLocaleString('es-ES');
      document.getElementById('m303-c64').textContent = resultado.casilla_64.toLocaleString('es-ES');
      document.getElementById('m303-c66').textContent = resultado.casilla_66.toLocaleString('es-ES');
    }
  }

  Object.values(inputs).forEach(input => {
    if (input) input.addEventListener('input', actualizar);
  });

  actualizar();
}
