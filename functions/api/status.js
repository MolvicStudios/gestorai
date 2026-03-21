/**
 * Cloudflare Pages Function: GET /api/status
 * Health check rápido — muestra estado de providers y entorno.
 * Nunca expone claves.
 */

export const onRequest = async (context) => {
  const { env } = context;

  const groqConf  = Boolean(env.GROQ_API_KEY);
  const mistralConf = Boolean(env.MISTRAL_API_KEY);

  // Test de conectividad con Groq (solo si hay clave)
  let groqReachable = null;
  if (groqConf) {
    try {
      const res = await fetch('https://api.groq.com/openai/v1/models', {
        headers: { Authorization: `Bearer ${env.GROQ_API_KEY}` },
        signal: AbortSignal.timeout(5000)
      });
      groqReachable = res.ok;
    } catch {
      groqReachable = false;
    }
  }

  const body = {
    ok: groqConf || mistralConf,
    timestamp: new Date().toISOString(),
    providers: {
      groq:    { configured: groqConf,    reachable: groqReachable },
      mistral: { configured: mistralConf, reachable: null }
    },
    cache_version: 'gestorai-v7'
  };

  return new Response(JSON.stringify(body, null, 2), {
    status: body.ok ? 200 : 503,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store'
    }
  });
};
