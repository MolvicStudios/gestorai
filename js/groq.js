/* GestorIA — groq.js
   Cliente IA con Groq (principal) + Mistral (fallback)
*/

let GROQ_KEY = null;
let MISTRAL_KEY = null;

// ========================================================================
// 1. INICIALIZACIÓN
// ========================================================================

/**
 * Cargar las claves de IA desde /api/config
 */
export async function inicializarIA() {
  try {
    const res = await fetch('/api/config');
    if (!res.ok) throw new Error('Error al cargar configuración');
    
    const config = await res.json();
    GROQ_KEY = config.groq_key;
    MISTRAL_KEY = config.mistral_key;
    
    if (!GROQ_KEY && !MISTRAL_KEY) {
      console.error('❌ No hay claves IA disponibles. Configura GROQ_API_KEY y MISTRAL_API_KEY en Cloudflare.');
    } else {
      console.log('✅ Claves IA cargadas correctamente');
    }
  } catch (e) {
    console.error('❌ Error al inicializar IA:', e);
  }
}

// ========================================================================
// 2. LLAMADA UNIFICADA CON FALLBACK AUTOMÁTICO
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
    // Intentar Groq primero
    return await llamarGroq(systemPrompt, userMessage, historial);
  } catch (error) {
    // Si Groq falla (429 rate limit o 5xx), intentar Mistral
    if (error.status === 429 || (error.status >= 500 && error.status < 600)) {
      console.warn('⚠️ Groq no disponible (status ' + error.status + '). Activando Mistral fallback...');
      try {
        return await llamarMistral(systemPrompt, userMessage, historial);
      } catch (mistralError) {
        throw new Error('Ambos servicios de IA no están disponibles en este momento. Inténtalo de nuevo en unos minutos.');
      }
    }
    throw error;
  }
}

// ========================================================================
// 3. GROQ API (PRINCIPAL)
// ========================================================================

/**
 * Llamar a Groq API
 * Modelo: llama-3.3-70b-versatile
 */
async function llamarGroq(systemPrompt, userMessage, historial = []) {
  if (!GROQ_KEY) {
    throw new Error('Clave de Groq no disponible.');
  }

  const payload = {
    model: 'llama-3.3-70b-versatile',
    messages: [
      { role: 'system', content: systemPrompt },
      ...historial,
      { role: 'user', content: userMessage }
    ],
    temperature: 0.4,  // Respuestas precisas pero naturales
    max_tokens: 1500,
    top_p: 0.95
  };

  try {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const error = new Error('Error en Groq API');
      error.status = res.status;
      throw error;
    }

    const data = await res.json();
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      throw new Error('Respuesta inválida de Groq');
    }

    return data.choices[0].message.content.trim();
  } catch (error) {
    if (error.status) {
      throw error; // Re-throw con status para fallback
    }
    throw new Error('Error de conexión con Groq: ' + error.message);
  }
}

// ========================================================================
// 4. MISTRAL API (FALLBACK)
// ========================================================================

/**
 * Llamar a Mistral API
 * Modelo: mistral-large-latest
 */
async function llamarMistral(systemPrompt, userMessage, historial = []) {
  if (!MISTRAL_KEY) {
    throw new Error('Clave de Mistral no disponible.');
  }

  const payload = {
    model: 'mistral-large-latest',
    messages: [
      { role: 'system', content: systemPrompt },
      ...historial,
      { role: 'user', content: userMessage }
    ],
    temperature: 0.4,
    max_tokens: 1500,
    top_p: 0.95
  };

  try {
    const res = await fetch('https://api.mistral.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${MISTRAL_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const error = new Error('Error en Mistral API');
      error.status = res.status;
      throw error;
    }

    const data = await res.json();
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      throw new Error('Respuesta inválida de Mistral');
    }

    return data.choices[0].message.content.trim();
  } catch (error) {
    if (error.status) {
      throw error;
    }
    throw new Error('Error de conexión con Mistral: ' + error.message);
  }
}

// ========================================================================
// 5. MENSAJES DE ERROR LOCALIZADOS
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

// ========================================================================
// INICIALIZAR AL CARGAR EL MÓDULO
// ========================================================================

inicializarIA();
