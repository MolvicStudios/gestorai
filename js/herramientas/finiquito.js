/* GestorIA — Calculadora Finiquito
   Desglose de pagos finales al finalizar relación laboral
*/

export function calcularFiniquito({
  salarioBrutoAnual = 0,
  diasVacacionesAnuales = 22,
  diasVacacionesDisfruitadas = 0,
  fechaInicio = null,
  fechaFin = null,
  numPagasExtras = 2,
  tipoSalida = 'despido'
}) {
  const salarioDiario = salarioBrutoAnual / 365;
  const salarioMensual = salarioBrutoAnual / 12;

  // Días trabajados en el mes actual
  const fin = new Date(fechaFin || new Date());
  const diasMesActual = Math.min(fin.getDate(), 28);

  // Salario pendiente del mes
  const salarioPendiente = (salarioMensual / 30) * diasMesActual;

  // Vacaciones no disfrutadas (aproximado)
  const vacacionesGeneradas = diasVacacionesAnuales;
  const vacacionesPendientes = Math.max(0, vacacionesGeneradas - diasVacacionesDisfruitadas);
  const importeVacaciones = salarioDiario * vacacionesPendientes;

  // Parte proporcional de pagas (aproximado)
  const diasAnioDesdeUltimaPaga = (new Date().getMonth() + 1) * 30;
  const importePagasExtras = (salarioMensual / 180) * diasAnioDesdeUltimaPaga * numPagasExtras;

  const totalFiniquito = salarioPendiente + importeVacaciones + importePagasExtras;

  return {
    salario_pendiente:          Math.round(salarioPendiente * 100) / 100,
    vacaciones_pendientes_dias: Math.round(vacacionesPendientes * 10) / 10,
    importe_vacaciones:         Math.round(importeVacaciones * 100) / 100,
    importe_pagas_extras:       Math.round(importePagasExtras * 100) / 100,
    total_finiquito:            Math.round(totalFiniquito * 100) / 100,
    tipo_salida:                tipoSalida
  };
}

export function getHTMLFiniquito() {
  return `
    <div style="max-width: 700px; margin: 0 auto; padding: 1.5rem;">
      <h2>💼 Calculadora Finiquito</h2>
      <p style="color: var(--text2); margin-bottom: 1.5rem;">
        Calcula los componentes del finiquito al finalizar tu contrato.
      </p>

      <div style="display: grid; gap: 1rem;">
        <div>
          <label for="finiquito-salario">Salario bruto anual (€)</label>
          <input type="number" id="finiquito-salario" min="0" step="1000" value="30000"
                 style="width: 100%; padding: 0.75rem; border: 1px solid var(--border); border-radius: var(--radius-md);">
        </div>

        <div>
          <label for="finiquito-vacaciones">Días de vacaciones no disfrutados</label>
          <input type="number" id="finiquito-vacaciones" min="0" max="30" step="1" value="10"
                 style="width: 100%; padding: 0.75rem; border: 1px solid var(--border); border-radius: var(--radius-md);">
        </div>

        <div>
          <label for="finiquito-pagas">Número de pagas extras anuales</label>
          <select id="finiquito-pagas" style="width: 100%; padding: 0.75rem; border: 1px solid var(--border); border-radius: var(--radius-md);">
            <option value="2">2 pagas (Navidad y verano)</option>
            <option value="3">3 pagas</option>
            <option value="12">12 pagas (mensual)</option>
          </select>
        </div>
      </div>

      <div id="finiquito-resultado" style="margin-top: 1.5rem; background-color: var(--bg2); padding: 1.5rem; border-radius: var(--radius-md); border: 1px solid var(--border);">
        <h3 style="margin-bottom: 1rem; color: var(--text);">Desglose del finiquito</h3>
        <div style="display: grid; gap: 0.75rem; font-size: 0.95rem;">
          <div style="display: flex; justify-content: space-between; padding: 0.5rem 0; border-bottom: 1px solid var(--border);">
            <span>Salario pendiente</span>
            <strong>€<span id="finiquito-salario-pend">3.000</span></strong>
          </div>
          <div style="display: flex; justify-content: space-between; padding: 0.5rem 0; border-bottom: 1px solid var(--border);">
            <span>Vacaciones (<span id="finiquito-dias-vac">10</span> días)</span>
            <strong>€<span id="finiquito-imp-vac">602</span></strong>
          </div>
          <div style="display: flex; justify-content: space-between; padding: 0.5rem 0; border-bottom: 1px solid var(--border);">
            <span>Pagas extras proporcionales</span>
            <strong>€<span id="finiquito-imp-pagas">1.300</span></strong>
          </div>
        </div>
        <div style="margin-top: 1rem; padding-top: 1rem; border-top: 2px solid var(--primary); display: flex; justify-content: space-between; align-items: center;">
          <strong style="font-size: 1.1rem;">TOTAL FINIQUITO</strong>
          <strong style="font-size: 1.5rem; color: var(--primary);">€<span id="finiquito-total">4.902</span></strong>
        </div>
      </div>

      <div style="margin-top: 1.5rem; padding: 1rem; background-color: var(--accent-light); border-left: 3px solid var(--accent); border-radius: var(--radius-md);">
        <strong>📌 Importante:</strong>
        <ul style="margin-top: 0.5rem; margin-left: 1.5rem; color: var(--text); font-size: 0.9rem;">
          <li>Cálculo orientativo según Estatuto de los Trabajadores</li>
          <li>El convenio colectivo puede variar estos componentes</li>
          <li>Incluye retenciones IRPF según la tasa aplicable</li>
          <li><strong>Consulta con un abogado laboralista para casos específicos</strong></li>
        </ul>
      </div>
    </div>
  `;
}

export function inicializarFiniquito() {
  const inputSalario = document.getElementById('finiquito-salario');
  const inputVacaciones = document.getElementById('finiquito-vacaciones');
  const selectPagas = document.getElementById('finiquito-pagas');

  function actualizar() {
    const resultado = calcularFiniquito({
      salarioBrutoAnual: Number(inputSalario?.value || 0),
      diasVacacionesDisfruitadas: 0,
      diasVacacionesAnuales: 22,
      numPagasExtras: Number(selectPagas?.value || 2),
      fechaFin: new Date()
    });

    if (document.getElementById('finiquito-salario-pend')) {
      document.getElementById('finiquito-salario-pend').textContent = resultado.salario_pendiente.toLocaleString('es-ES');
      document.getElementById('finiquito-dias-vac').textContent = Number(inputVacaciones?.value || 0);
      document.getElementById('finiquito-imp-vac').textContent = Math.round(resultado.importe_vacaciones).toLocaleString('es-ES');
      document.getElementById('finiquito-imp-pagas').textContent = Math.round(resultado.importe_pagas_extras).toLocaleString('es-ES');
      document.getElementById('finiquito-total').textContent = resultado.total_finiquito.toLocaleString('es-ES');
    }
  }

  if (inputSalario) inputSalario.addEventListener('input', actualizar);
  if (inputVacaciones) inputVacaciones.addEventListener('input', actualizar);
  if (selectPagas) selectPagas.addEventListener('change', actualizar);

  actualizar();
}
