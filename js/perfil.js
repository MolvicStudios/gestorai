/* GestorIA — perfil.js
   CRUD del perfil del usuario en localStorage
   Personaliza las respuestas de la IA según la situación fiscal/laboral
*/

// ========================================================================
// 1. ESTRUCTURA DEL PERFIL
// ========================================================================

export const PERFIL_DEFECTO = {
  situacion:           null,  // "autonomo" | "asalariado" | "desempleado" | "empresario" | "otro"
  sector:              null,  // descripción libre (ej: "diseño gráfico")
  ccaa:                null,  // comunidad autónoma
  regimen_fiscal:      null,  // "estimacion_directa" | "modulos" | "no_aplica"
  tipo_contrato:       null,  // "indefinido" | "temporal" | "autonomo" | "otro" | "no_aplica"
  antiguedad_anos:     null,  // número
  salario_bruto_anual: null,  // número en euros
  tiene_empleados:     false, // bool
  tiene_clientes_ue:   false, // bool (para modelo 349)
  updated_at:          null
};

// ========================================================================
// 2. UTILIDADES
// ========================================================================

/**
 * Generar clave localStorage para el perfil del usuario
 * @param {string} email - Email del usuario
 * @returns {string} Clave sanitizada
 */
function getKeyPerfil(email) {
  const sanitized = email.toLowerCase().replace(/[^a-z0-9]/g, '_');
  return 'gestorai_perfil_' + sanitized;
}

// ========================================================================
// 3. OBTENER PERFIL
// ========================================================================

/**
 * Obtener perfil del usuario
 * @param {string} email - Email del usuario
 * @returns {Object} Perfil completo (con defectos si falta algo)
 */
export function getPerfil(email) {
  const key = getKeyPerfil(email);
  const stored = localStorage.getItem(key);
  
  if (!stored) {
    return { ...PERFIL_DEFECTO };
  }

  try {
    return JSON.parse(stored);
  } catch (e) {
    console.error('Error al parsear perfil:', e);
    return { ...PERFIL_DEFECTO };
  }
}

// ========================================================================
// 4. GUARDAR PERFIL
// ========================================================================

/**
 * Guardar o actualizar perfil
 * @param {string} email - Email del usuario
 * @param {Object} datos - Datos a actualizar (merge con existentes)
 * @returns {Object} Perfil actualizado
 */
export function guardarPerfil(email, datos) {
  const key = getKeyPerfil(email);
  const perfil = {
    ...getPerfil(email),
    ...datos,
    updated_at: new Date().toISOString()
  };

  try {
    localStorage.setItem(key, JSON.stringify(perfil));
    console.log('✅ Perfil guardado:', email);
    return perfil;
  } catch (e) {
    console.error('Error al guardar perfil:', e);
    throw new Error('No se pudo guardar el perfil. localStorage lleno?');
  }
}

// ========================================================================
// 5. CONSTRUIR CONTEXTO PARA SYSTEM PROMPT
// ========================================================================

/**
 * Generar contexto del perfil para pasar a la IA
 * @param {Object} perfil - Perfil del usuario
 * @returns {string} Texto descriptivo del perfil
 */
export function buildContextoPerfil(perfil) {
  if (!perfil || !perfil.situacion) {
    return 'El usuario no ha completado su perfil aún.';
  }

  const lineas = [];

  // Mapear situación a etiqueta legible
  const mapSituacion = {
    autonomo:     'Autónomo',
    asalariado:   'Trabajador por cuenta ajena',
    desempleado:  'Desempleado',
    empresario:   'Empresario / administrador de empresa',
    otro:         'Otra situación'
  };

  lineas.push(`📌 Situación: ${mapSituacion[perfil.situacion] || perfil.situacion}`);

  if (perfil.sector) {
    lineas.push(`🏢 Sector/actividad: ${perfil.sector}`);
  }

  if (perfil.ccaa) {
    lineas.push(`📍 Comunidad autónoma: ${perfil.ccaa}`);
  }

  if (perfil.regimen_fiscal && perfil.regimen_fiscal !== 'no_aplica') {
    const mapRegimen = {
      estimacion_directa: 'Estimación directa',
      modulos:            'Módulos de bases imponibles'
    };
    lineas.push(`📊 Régimen fiscal: ${mapRegimen[perfil.regimen_fiscal] || perfil.regimen_fiscal}`);
  }

  if (perfil.tipo_contrato && perfil.tipo_contrato !== 'no_aplica') {
    const mapContrato = {
      indefinido: 'Contrato indefinido',
      temporal:   'Contrato temporal/fijo-discontinuo',
      autonomo:   'Autónomo',
      otro:       'Otro tipo de relación laboral'
    };
    lineas.push(`📋 Tipo de contrato: ${mapContrato[perfil.tipo_contrato] || perfil.tipo_contrato}`);
  }

  if (perfil.antiguedad_anos !== null && perfil.antiguedad_anos !== '') {
    lineas.push(`⏱️ Antigüedad en la empresa: ${perfil.antiguedad_anos} años`);
  }

  if (perfil.salario_bruto_anual) {
    const salarioFormato = perfil.salario_bruto_anual.toLocaleString('es-ES');
    lineas.push(`💰 Salario bruto anual: ${salarioFormato}€`);
  }

  if (perfil.tiene_empleados) {
    lineas.push(`👥 Tiene empleados a cargo`);
  }

  if (perfil.tiene_clientes_ue) {
    lineas.push(`🌍 Tiene clientes en la UE (sujeto a intracomunitario)`);
  }

  return lineas.join('\n');
}

// ========================================================================
// 6. VALIDACIÓN DEL PERFIL
// ========================================================================

/**
 * Verificar que el perfil está completado
 * @param {Object} perfil - Perfil del usuario
 * @returns {boolean} True si está minimamente completo
 */
export function perfilCompleto(perfil) {
  return perfil && perfil.situacion !== null;
}

/**
 * Obtener lista de campos vacíos en el perfil
 * @param {Object} perfil - Perfil del usuario
 * @returns {Array<string>} Lista de claves vacías
 */
export function camposVacios(perfil) {
  const campos = [];
  if (!perfil.situacion) campos.push('situacion');
  if (!perfil.sector) campos.push('sector');
  if (!perfil.ccaa) campos.push('ccaa');
  if (perfil.situacion === 'autonomo' && !perfil.regimen_fiscal) campos.push('regimen_fiscal');
  if (perfil.situacion === 'asalariado' && !perfil.tipo_contrato) campos.push('tipo_contrato');
  return campos;
}

// ========================================================================
// 7. EXPORTAR PERFIL (PARA DESCARGA)
// ========================================================================

/**
 * Exportar perfil del usuario como JSON
 * @param {string} email - Email del usuario
 */
export function exportarPerfilJSON(email) {
  const perfil = getPerfil(email);
  const dataStr = JSON.stringify(perfil, null, 2);
  const blob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `gestorai-perfil-${email.split('@')[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);
  console.log('📥 Perfil exportado:', email);
}

// ========================================================================
// 8. RESET DEL PERFIL
// ========================================================================

/**
 * Limpiar el perfil (volver a valores defecto)
 * @param {string} email - Email del usuario
 */
export function resetPerfil(email) {
  const key = getKeyPerfil(email);
  localStorage.removeItem(key);
  console.log('🔄 Perfil reseteado:', email);
}
