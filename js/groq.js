/* GestorIA — groq.js
   Cliente frontend para proxy backend /api/chat
*/

// ========================================================================
// 1. LLAMADA UNIFICADA VIA BACKEND
// ========================================================================

/**
 * Llamar a la IA con fallback automático
 * @param {string} systemPrompt - Instrucciones del sistema
 * @param {string} userMessage - Mensaje del usuario
 * @param {Array} historial - Array de mensajes anteriores [{role, content}, ...]
 * @returns {Promise<string>} Respuesta de la IA
 */
export async function llamarIA(systemPrompt, userMessage, historial = []) {
  try {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        systemPrompt,
        userMessage,
        historial
      })
    });

    const contentType = res.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      const error = new Error('Respuesta no válida del servidor de IA.');
      error.status = 500;
      throw error;
    }

    const data = await res.json();
    if (!res.ok) {
      const error = new Error(data.error || 'Error en el servidor de IA.');
      error.status = res.status;
      throw error;
    }

    if (!data.content) {
      const error = new Error('Respuesta vacía del servidor de IA.');
      error.status = 500;
      throw error;
    }

    return data.content;
  } catch (error) {
    throw error;
  }
}

// ========================================================================
// 2. MENSAJES DE ERROR LOCALIZADOS
// ========================================================================

export const MENSAJES_ERROR = {
  401: '❌ Error de autenticación con la IA. Las claves no son válidas. Contacta con soporte.',
  429: '⏱️ Demasiadas consultas simultáneas. Espera unos segundos e inténtalo de nuevo.',
  500: '❌ El servicio de IA no está disponible en este momento. Inténtalo en unos minutos.',
  503: '🔧 Servidor de IA en mantenimiento. Inténtalo más tarde.',
  default: '❌ No se pudo conectar con la IA. Comprueba tu conexión e inténtalo de nuevo.'
};

/**
 * Obtener mensaje de error amigable
 */
export function obtenerMensajeError(error) {
  if (error.status && MENSAJES_ERROR[error.status]) {
    return MENSAJES_ERROR[error.status];
  }
  return error.message || MENSAJES_ERROR.default;
}
