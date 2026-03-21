/**
 * Cloudflare Pages Function: /api/chat
 * Proxy server-side para Groq (principal) + Mistral (fallback)
 * Las claves nunca se exponen al navegador.
 */

const MENSAJES_ERROR = {
  400: 'Solicitud de chat no válida.',
  401: 'Error de autenticación con el servicio de IA.',
  429: 'Demasiadas consultas simultáneas. Espera unos segundos e inténtalo de nuevo.',
  500: 'El servicio de IA no está disponible en este momento. Inténtalo en unos minutos.',
  503: 'Servidor de IA en mantenimiento. Inténtalo más tarde.'
};

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store, no-cache, must-revalidate',
      'X-Content-Type-Options': 'nosniff'
    }
  });
}

async function llamarGroq(env, payload) {
  if (!env.GROQ_API_KEY) {
    const error = new Error('Clave de Groq no disponible.');
    error.status = 503;
    throw error;
  }

  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${env.GROQ_API_KEY}`,
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
  return data?.choices?.[0]?.message?.content?.trim() || '';
}

async function llamarMistral(env, payload) {
  if (!env.MISTRAL_API_KEY) {
    const error = new Error('Clave de Mistral no disponible.');
    error.status = 503;
    throw error;
  }

  const res = await fetch('https://api.mistral.ai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${env.MISTRAL_API_KEY}`,
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
  return data?.choices?.[0]?.message?.content?.trim() || '';
}

export const onRequestPost = async (context) => {
  const { request, env } = context;

  try {
    const body = await request.json();
    const systemPrompt = String(body.systemPrompt || '').trim();
    const userMessage = String(body.userMessage || '').trim();
    const historial = Array.isArray(body.historial) ? body.historial : [];

    if (!systemPrompt || !userMessage) {
      return jsonResponse({ error: MENSAJES_ERROR[400] }, 400);
    }

    const historialNormalizado = historial
      .slice(-10)
      .filter((item) => item && typeof item.role === 'string' && typeof item.content === 'string')
      .map((item) => ({
        role: item.role,
        content: item.content.slice(0, 4000)
      }));

    const groqPayload = {
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: systemPrompt.slice(0, 12000) },
        ...historialNormalizado,
        { role: 'user', content: userMessage.slice(0, 4000) }
      ],
      temperature: 0.4,
      max_tokens: 1500,
      top_p: 0.95
    };

    try {
      const content = await llamarGroq(env, groqPayload);
      return jsonResponse({ content, provider: 'groq' });
    } catch (error) {
      if (error.status === 429 || (error.status >= 500 && error.status < 600)) {
        const mistralPayload = {
          model: 'mistral-large-latest',
          messages: groqPayload.messages,
          temperature: 0.4,
          max_tokens: 1500,
          top_p: 0.95
        };

        const content = await llamarMistral(env, mistralPayload);
        return jsonResponse({ content, provider: 'mistral' });
      }

      return jsonResponse({ error: MENSAJES_ERROR[error.status] || error.message || MENSAJES_ERROR[500] }, error.status || 500);
    }
  } catch (error) {
    return jsonResponse({ error: error.message || MENSAJES_ERROR[500] }, 500);
  }
};
