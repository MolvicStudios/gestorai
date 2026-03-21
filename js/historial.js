/* GestorIA — historial.js
   Gestión del historial de conversaciones en localStorage
*/

// ========================================================================
// 1. UTILIDADES
// ========================================================================

/**
 * Generar clave localStorage para el historial del usuario
 * @param {string} email - Email del usuario
 * @returns {string} Clave sanitizada
 */
function getKeyHistorial(email) {
  const sanitized = email.toLowerCase().replace(/[^a-z0-9]/g, '_');
  return 'gestorai_historial_' + sanitized;
}

/**
 * Generar ID único para conversación
 * @returns {string} ID único
 */
function generarIDConversacion() {
  return 'conv_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

// ========================================================================
// 2. ESTRUCTURA DE CONVERSACIÓN
// ========================================================================

/**
 * Crear conversación vacía
 * @returns {Object} Conversación nueva
 */
export function crearConversacion() {
  return {
    id:       generarIDConversacion(),
    titulo:   'Nueva consulta',
    fecha:    new Date().toISOString(),
    mensajes: []
  };
}

// ========================================================================
// 3. OBTENER HISTORIAL
// ========================================================================

/**
 * Obtener todas las conversaciones del usuario
 * @param {string} email - Email del usuario
 * @returns {Array} Array de conversaciones
 */
export function getHistorial(email) {
  const key = getKeyHistorial(email);
  const stored = localStorage.getItem(key);

  if (!stored) {
    return [];
  }

  try {
    return JSON.parse(stored);
  } catch (e) {
    console.error('Error al parsear historial:', e);
    return [];
  }
}

/**
 * Obtener una conversación específica
 * @param {string} email - Email del usuario
 * @param {string} convId - ID de la conversación
 * @returns {Object|null} Conversación o null si no existe
 */
export function getConversacion(email, convId) {
  const historial = getHistorial(email);
  return historial.find(c => c.id === convId) || null;
}

// ========================================================================
// 4. GUARDAR CONVERSACIÓN
// ========================================================================

/**
 * Guardar o actualizar una conversación
 * @param {string} email - Email del usuario
 * @param {Object} conversacion - Conversation object
 */
export function guardarConversacion(email, conversacion) {
  const key = getKeyHistorial(email);
  let historial = getHistorial(email);

  // Buscar y reemplazar si existe
  const index = historial.findIndex(c => c.id === conversacion.id);
  if (index >= 0) {
    historial[index] = conversacion;
  } else {
    historial.push(conversacion);
  }

  // Guardar, manteniendo solo las últimas 50 conversaciones
  historial = historial.slice(-50);

  try {
    localStorage.setItem(key, JSON.stringify(historial));
    console.log('✅ Conversación guardada:', conversacion.id);
  } catch (e) {
    if (e && e.name === 'QuotaExceededError') {
      // Intento de recuperación automática: conservar las conversaciones más recientes
      const historialReducido = historial.slice(-25);
      try {
        localStorage.setItem(key, JSON.stringify(historialReducido));
        console.warn('⚠️ localStorage lleno. Historial reducido a 25 conversaciones.');
        return;
      } catch (e2) {
        console.error('Error al recuperar espacio en historial:', e2);
      }
    }
    console.error('Error al guardar conversación:', e);
    throw new Error('No hay espacio en el navegador. Elimina conversaciones antiguas o limpia datos locales.');
  }
}

// ========================================================================
// 5. AGREGAR MENSAJE A CONVERSACIÓN
// ========================================================================

/**
 * Agregar un mensaje a la conversación actual
 * @param {Object} conversacion - Conversation object
 * @param {string} role - "user" o "assistant"
 * @param {string} content - Contenido del mensaje
 */
export function agregarMensaje(conversacion, role, content) {
  conversacion.mensajes.push({
    role,
    content,
    ts: new Date().toISOString()
  });
}

// ========================================================================
// 6. ACTUALIZAR TÍTULO DE CONVERSACIÓN
// ========================================================================

/**
 * Actualizar el título de una conversación
 * @param {Object} conversacion - Conversation object
 * @param {string} nuevoTitulo - Nuevo título (máx 60 caracteres)
 */
export function actualizarTituloConversacion(conversacion, nuevoTitulo) {
  conversacion.titulo = nuevoTitulo.trim().slice(0, 60);
}

// ========================================================================
// 7. ELIMINAR CONVERSACIÓN
// ========================================================================

/**
 * Eliminar una conversación
 * @param {string} email - Email del usuario
 * @param {string} convId - ID de la conversación
 * @returns {boolean} True si se eliminó, false si no existía
 */
export function eliminarConversacion(email, convId) {
  const key = getKeyHistorial(email);
  let historial = getHistorial(email);

  const nuevoHistorial = historial.filter(c => c.id !== convId);

  if (nuevoHistorial.length === historial.length) {
    console.warn('⚠️ Conversación no encontrada:', convId);
    return false;
  }

  try {
    localStorage.setItem(key, JSON.stringify(nuevoHistorial));
    console.log('🗑️ Conversación eliminada:', convId);
    return true;
  } catch (e) {
    console.error('Error al eliminar conversación:', e);
    throw e;
  }
}

// ========================================================================
// 8. LIMPIAR TODO EL HISTORIAL
// ========================================================================

/**
 * Eliminar todas las conversaciones del usuario
 * @param {string} email - Email del usuario
 * @returns {boolean} True si se limpió
 */
export function limpiarHistorial(email) {
  const key = getKeyHistorial(email);
  try {
    localStorage.removeItem(key);
    console.log('🗑️ Historial completo eliminado:', email);
    return true;
  } catch (e) {
    console.error('Error al limpiar historial:', e);
    throw e;
  }
}

// ========================================================================
// 9. EXPORTAR HISTORIAL
// ========================================================================

/**
 * Exportar historial como JSON
 * @param {string} email - Email del usuario
 */
export function exportarHistorialJSON(email) {
  const historial = getHistorial(email);
  const dataStr = JSON.stringify(historial, null, 2);
  const blob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `gestorai-historial-${email.split('@')[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);
  console.log('📥 Historial exportado:', email);
}

// ========================================================================
// 10. ESTADÍSTICAS
// ========================================================================

/**
 * Obtener estadísticas del historial
 * @param {string} email - Email del usuario
 * @returns {Object} Estadísticas
 */
export function getEstadisticas(email) {
  const historial = getHistorial(email);
  const totalMensajes = historial.reduce((acc, c) => acc + c.mensajes.length, 0);
  const totalConversaciones = historial.length;
  const conversacionMasReciente = historial[historial.length - 1]?.fecha || null;

  return {
    total_conversaciones: totalConversaciones,
    total_mensajes: totalMensajes,
    ultima_conversacion: conversacionMasReciente,
    promedio_mensajes_por_conv: totalConversaciones > 0
      ? (totalMensajes / totalConversaciones).toFixed(1)
      : 0
  };
}
