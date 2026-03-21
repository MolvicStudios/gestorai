/* GestorIA — Calculadora Indemnización por Despido
   Según Estatuto de los Trabajadores
*/

const TIPOS_DESPIDO = {
  improcedente: {
    dias_por_anio: 33,
    maximo_mensualidades: 24,
    descripcion: 'Despido improcedente'
  },
  objetivo: {
    dias_por_anio: 20,
    maximo_mensualidades: 12,
    descripcion: 'Despido objetivo / colectivo'
  },
  erte_fin: {
    dias_por_anio: 20,
    maximo_mensualidades: 12,
    descripcion: 'Fin de ERTE con extinción'
  },
  fin_temporal: {
    dias_por_anio: 12,
    maximo_mensualidades: null,
    descripcion: 'Fin de contrato temporal'
  }
};

export function calcularIndemnizacion({
  salarioBrutoAnual = 0,
  antiguedadAnios = 0,
  tipoDespido = 'improcedente'
}) {
  const tipo = TIPOS_DESPIDO[tipoDespido];
  if (!tipo) throw new Error('Tipo de despido no válido.');

  const salarioDiario = salarioBrutoAnual / 365;
  const salarioMensual = salarioBrutoAnual / 12;

  // Indemnización bruta
  let indemnizacionBruta = salarioDiario * tipo.dias_por_anio * antiguedadAnios;

  // Aplicar tope máximo si aplica
  if (tipo.maximo_mensualidades) {
    const tope = salarioMensual * tipo.maximo_mensualidades;
    indemnizacionBruta = Math.min(indemnizacionBruta, tope);
  }

  return {
    tipo_despido:         tipo.descripcion,
    antiguedad_anios:     antiguedadAnios,
    salario_diario:       Math.round(salarioDiario * 100) / 100,
    dias_indemnizacion:   tipo.dias_por_anio,
    indemnizacion_bruta:  Math.round(indemnizacionBruta * 100) / 100,
    tope_aplicado:        tipo.maximo_mensualidades
      ? `${tipo.maximo_mensualidades} mensalidades`
      : 'Sin tope legal'
  };
}

export function getHTMLIndemnizacion() {
  return `
    <div style="max-width: 700px; margin: 0 auto; padding: 1.5rem;">
      <h2>⚖️ Calculadora Indemnización por Despido</h2>
      <p style="color: var(--text2); margin-bottom: 1.5rem;">
        Cálculo orientativo según Estatuto de los Trabajadores (ET).
      </p>

      <div style="display: grid; gap: 1.5rem;">
        <div>
          <label for="indemn-tipo">Tipo de despido</label>
          <select id="indemn-tipo" style="width: 100%; padding: 0.75rem; border: 1px solid var(--border); border-radius: var(--radius-md);">
            <option value="improcedente">Despido improcedente (33 días/año)</option>
            <option value="objetivo">Despido objetivo (20 días/año)</option>
            <option value="erte_fin">Fin de ERTE con extinción (20 días/año)</option>
            <option value="fin_temporal">Fin contrato temporal (12 días/año)</option>
          </select>
        </div>

        <div>
          <label for="indemn-salario">Salario bruto anual (€)</label>
          <input type="number" id="indemn-salario" min="0" step="1000" value="30000"
                 style="width: 100%; padding: 0.75rem; border: 1px solid var(--border); border-radius: var(--radius-md);">
        </div>

        <div>
          <label for="indemn-antiguedad">Años trabajados en la empresa</label>
          <input type="number" id="indemn-antiguedad" min="0" max="60" step="0.5" value="5"
                 style="width: 100%; padding: 0.75rem; border: 1px solid var(--border); border-radius: var(--radius-md);">
        </div>
      </div>

      <div id="indemn-resultado" style="margin-top: 1.5rem; background-color: var(--bg2); padding: 1.5rem; border-radius: var(--radius-md); border: 1px solid var(--border);">
        <h3 style="margin-bottom: 1rem; color: var(--text);">Cálculo</h3>
        <div style="display: grid; gap: 0.75rem; font-size: 0.95rem; margin-bottom: 1.5rem;">
          <div><span style="color: var(--text3);">Salario diario:</span> <strong>€<span id="indemn-sal-diario">82.19</span></strong></div>
          <div><span style="color: var(--text3);">Días de indemnización:</span> <strong><span id="indemn-dias">33</span> días/año</strong></div>
          <div><span style="color: var(--text3);">Total años:</span> <strong><span id="indemn-anos">5</span> años</strong></div>
          <div style="padding: 0.75rem; background: var(--primary-light); border-radius: var(--radius-md); margin-top: 0.5rem;">
            <div style="color: var(--text3); font-size: 0.85rem; margin-bottom: 0.25rem;">Cálculo: (€<span id="indemn-sal-diario2">82.19</span> × <span id="indemn-dias2">33</span> × <span id="indemn-anos2">5</span>)</div>
          </div>
        </div>

        <div style="padding-top: 1rem; border-top: 2px solid var(--primary);">
          <div style="text-align: center;">
            <div style="color: var(--text3); font-size: 0.9rem; margin-bottom: 0.5rem;">INDEMNIZACIÓN BRUTA</div>
            <div style="font-size: 2rem; font-weight: 600; color: var(--primary);">€<span id="indemn-total">13.563</span></div>
          </div>
        </div>

        <div style="margin-top: 1rem; padding: 0.75rem; background: var(--accent-light); border-radius: var(--radius-md); font-size: 0.85rem; color: var(--text);">
          <strong>Tope legal:</strong> <span id="indemn-tope">Máximo 24 mensalidades</span>
        </div>
      </div>

      <div style="margin-top: 1.5rem; padding: 1rem; background-color: var(--danger-light); border-left: 3px solid var(--danger); border-radius: var(--radius-md); display: none;">
        <strong style="color: var(--danger);">⚠️ Advertencia importante:</strong>
        <p style="margin-top: 0.5rem; color: var(--text); font-size: 0.9rem; line-height: 1.6;">
          Este es solo un cálculo orientativo. Los despidos son temas muy sensibles.
          <strong>Consulta obligatoriamente con un abogado laboralista colegiado antes de tomar cualquier decisión.</strong>
          Pueden aplicarse bonificaciones y las cuantías varían según el convenio colectivo.
        </p>
      </div>

      <div style="margin-top: 1.5rem; padding: 1rem; background-color: var(--accent-light); border-left: 3px solid var(--accent); border-radius: var(--radius-md);">
        <strong>ℹ️ Información legal:</strong>
        <ul style="margin-top: 0.5rem; margin-left: 1.5rem; color: var(--text); font-size: 0.9rem;">
          <li>Despido improcedente: 33 días/año, máx. 24 mensalidades (art. 56 ET)</li>
          <li>Despido objetivo: 20 días/año, máx. 12 mensalidades (art. 53 ET)</li>
          <li>Fin de temporal: 12 días/año (art. 49.1.c ET)</li>
          <li>El convenio colectivo puede establecer mejoras</li>
          <li><strong>Consulta con un abogado laboralista para tu situación</strong></li>
        </ul>
      </div>
    </div>
  `;
}

export function inicializarIndemnizacion() {
  const selectTipo = document.getElementById('indemn-tipo');
  const inputSalario = document.getElementById('indemn-salario');
  const inputAntiguedad = document.getElementById('indemn-antiguedad');

  function actualizar() {
    const resultado = calcularIndemnizacion({
      salarioBrutoAnual: Number(inputSalario?.value || 0),
      antiguedadAnios: Number(inputAntiguedad?.value || 0),
      tipoDespido: selectTipo?.value || 'improcedente'
    });

    if (document.getElementById('indemn-sal-diario')) {
      document.getElementById('indemn-sal-diario').textContent = resultado.salario_diario.toLocaleString('es-ES');
      document.getElementById('indemn-sal-diario2').textContent = resultado.salario_diario.toLocaleString('es-ES');
      document.getElementById('indemn-dias').textContent = resultado.dias_indemnizacion;
      document.getElementById('indemn-dias2').textContent = resultado.dias_indemnizacion;
      document.getElementById('indemn-anos').textContent = resultado.antiguedad_anios;
      document.getElementById('indemn-anos2').textContent = resultado.antiguedad_anios;
      document.getElementById('indemn-total').textContent = resultado.indemnizacion_bruta.toLocaleString('es-ES');
      document.getElementById('indemn-tope').textContent = resultado.tope_aplicado;
    }
  }

  if (selectTipo) selectTipo.addEventListener('change', actualizar);
  if (inputSalario) inputSalario.addEventListener('input', actualizar);
  if (inputAntiguedad) inputAntiguedad.addEventListener('input', actualizar);

  actualizar();
}
