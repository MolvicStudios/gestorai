/**
 * Cloudflare Pages Function: /api/config
 * GET /api/config
 * 
 * Devuelve las claves públicas de IA (Groq + Mistral)
 * Las claves se definen en Cloudflare Pages → Settings → Environment variables
 * Nunca hardcodear las claves en el código fuente.
 */

export const onRequest = async (context) => {
  const { env } = context;

  return new Response(
    JSON.stringify({
      groq_key:    env.GROQ_API_KEY || null,
      mistral_key: env.MISTRAL_API_KEY || null
    }),
    {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'X-Content-Type-Options': 'nosniff'
      }
    }
  );
};
