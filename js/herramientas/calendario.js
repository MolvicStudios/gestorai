/* GestorIA — Calendario Fiscal Personalizado
   Genera recordatorios de plazos según situación del usuario
*/

export function generarCalendario(perfil, anio = new Date().getFullYear()) {
  const eventos = [];

  const esAutonomo = perfil.situacion === 'autonomo';
  const esCanarias = perfil.ccaa === 'Canarias';
  const tieneClientesUE = perfil.tiene_clientes_ue;

  // Modelo 303 / 420 trimestral (últimos días de mes)
  const modeloIVA = esCanarias ? '420' : '303';
  [
    { mes: 0, dia: 20, trimestre: 'T4 año anterior' },
    { mes: 3, dia: 20, trimestre: 'T1' },
    { mes: 6, dia: 20, trimestre: 'T2' },
    { mes: 9, dia: 20, trimestre: 'T3' }
  ].forEach(({ mes, dia, trimestre }) => {
    eventos.push({
      fecha: new Date(anio, mes, dia),
      modelo: modeloIVA,
      descripcion: `Presentar ${modeloIVA} trimestral — ${trimestre}`,
      urgencia: 'alta'
    });
  });

  // Modelo 130 (IRPF pago fraccionado — solo autónomos estimación)
  if (esAutonomo && perfil.regimen_fiscal === 'estimacion_directa') {
    [
      { mes: 0, dia: 20, trimestre: 'T4 año anterior' },
      { mes: 3, dia: 20, trimestre: 'T1' },
      { mes: 6, dia: 20, trimestre: 'T2' },
      { mes: 9, dia: 20, trimestre: 'T3' }
    ].forEach(({ mes, dia, trimestre }) => {
      eventos.push({
        fecha: new Date(anio, mes, dia),
        modelo: '130',
        descripcion: `IRPF pago fraccionado — ${trimestre}`,
        urgencia: 'alta'
      });
    });
  }

  // Modelo 390 / 425 (resumen anual IVA)
  eventos.push({
    fecha: new Date(anio, 0, 30),
    modelo: esCanarias ? '425' : '390',
    descripcion: `Resumen anual ${esCanarias ? 'IGIC' : 'IVA'} año ${anio - 1}`,
    urgencia: 'alta'
  });

  // Modelo 349 (intracomunitario trimestral)
  if (tieneClientesUE) {
    [
      { mes: 0, dia: 31 },
      { mes: 3, dia: 30 },
      { mes: 6, dia: 31 },
      { mes: 9, dia: 31 }
    ].forEach(({ mes, dia }) => {
      eventos.push({
        fecha: new Date(anio, mes, dia),
        modelo: '349',
        descripcion: 'Declaración recapitulativa intracomunitaria',
        urgencia: 'media'
      });
    });
  }

  // Modelo 100 (Renta anual)
  eventos.push({
    fecha: new Date(anio, 5, 30),
    modelo: '100',
    descripcion: `Declaración de la Renta ${anio - 1}`,
    urgencia: 'alta'
  });

  // Ordenar por fecha
  return eventos.sort((a, b) => a.fecha - b.fecha);
}

export function exportarICS(eventos) {
  const lineas = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//GestorIA//Calendario Fiscal//ES',
    'CALNAME:Calendario Fiscal GestorIA',
    'CALSCALE:GREGORIAN'
  ];

  eventos.forEach(evento => {
    const fecha = evento.fecha;
    const fechaStr = fecha.toISOString().replace(/[-:]/g, '').split('T')[0];
    lineas.push(
      'BEGIN:VEVENT',
      `DTSTART;VALUE=DATE:${fechaStr}`,
      `DTEND;VALUE=DATE:${fechaStr}`,
      `SUMMARY:Modelo ${evento.modelo} — ${evento.descripcion}`,
      `DESCRIPTION:GestorIA — Recordatorio fiscal automático. Presenta en sede.agenciatributaria.gob.es`,
      `UID:gestorai-${evento.modelo}-${fechaStr}@gestorai.pro`,
      'END:VEVENT'
    );
  });

  lineas.push('END:VCALENDAR');

  const blob = new Blob([lineas.join('\r\n')], { type: 'text/calendar' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'calendario-fiscal-gestorai.ics';
  a.click();
  URL.revokeObjectURL(url);
}

export function getHTMLCalendario(eventos = null) {
  const fecha = new Date();
  const eventosFecha = eventos || generarCalendario({ situacion: 'autonomo', ccaa: null, regimen_fiscal: 'estimacion_directa', tiene_clientes_ue: false }, fecha.getFullYear());

  const filtrados = eventosFecha.filter(e => e.fecha >= fecha).slice(0, 8);

  return `
    <div style="max-width: 700px; margin: 0 auto; padding: 1.5rem;">
      <h2>📅 Calendario Fiscal Personalizado</h2>
      <p style="color: var(--text2); margin-bottom: 1.5rem;">
        Próximos plazos fiscales según tu situación. <strong>Genera una versión exportable (.ics) para tu calendario.</strong>
      </p>

      <div style="margin-bottom: 1.5rem;">
        <button id="btn-exportar-ics" style="padding: 0.75rem 1.5rem; background-color: var(--primary); color: white; border: none; border-radius: var(--radius-md); cursor: pointer; font-weight: 500;">
          📥 Exportar a Calendario (.ics)
        </button>
      </div>

      <div style="display: grid; gap: 1rem;">
        ${filtrados.map(evento => `
          <div style="padding: 1rem; border: 1px solid var(--border); border-left: 4px solid ${evento.urgencia === 'alta' ? 'var(--danger)' : 'var(--warning)'}; border-radius: var(--radius-md); background-color: var(--bg2);">
            <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 0.5rem;">
              <div>
                <strong style="color: var(--text);">Modelo ${evento.modelo}</strong>
                <div style="font-size: 0.9rem; color: var(--text2);">${evento.descripcion}</div>
              </div>
              <div style="text-align: right;">
                <div style="font-size: 1.1rem; font-weight: 600; color: var(--text);">${evento.fecha.getDate()}</div>
                <div style="font-size: 0.8rem; color: var(--text3);">${['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'][evento.fecha.getMonth()]}</div>
              </div>
            </div>
            <div style="font-size: 0.85rem;">
              <span style="display: inline-block; padding: 0.25rem 0.75rem; border-radius: var(--radius-pill); background-color: ${evento.urgencia === 'alta' ? 'rgba(226, 75, 74, 0.1)' : 'rgba(186, 117, 23, 0.1)'}; color: ${evento.urgencia === 'alta' ? 'var(--danger)' : 'var(--warning)'}; font-weight: 500;">
                ${evento.urgencia === 'alta' ? '🔴 URGENTE' : '🟡 Importante'}
              </span>
            </div>
          </div>
        `).join('')}
      </div>

      <div style="margin-top: 2rem; padding: 1rem; background-color: var(--accent-light); border-left: 3px solid var(--accent); border-radius: var(--radius-md);">
        <strong>ℹ️ Notas:</strong>
        <ul style="margin-top: 0.5rem; margin-left: 1.5rem; color: var(--text); font-size: 0.9rem;">
          <li>Estos son plazos generales — consulta en <strong>sede.agenciatributaria.gob.es</strong></li>
          <li>El calendario .ics se abre con tu app de calendario (Google Calendar, Outlook, etc.)</li>
          <li>Algunos plazos pueden variar según comunidad autónoma</li>
          <li>Complementa este calendario con asesoría profesional</li>
        </ul>
      </div>
    </div>
  `;
}

export function inicializarCalendario() {
  const btnExportar = document.getElementById('btn-exportar-ics');
  if (btnExportar) {
    btnExportar.addEventListener('click', () => {
      const eventos = generarCalendario({ situacion: 'autonomo', regimen_fiscal: 'estimacion_directa' });
      exportarICS(eventos);
      alert('Calendario descargado. Abre el archivo .ics con tu app de calendario.');
    });
  }
}
