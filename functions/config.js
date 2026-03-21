/**
 * Cloudflare Pages Function: /config
 * Devuelve solo estado de configuracion, nunca secretos.
 */

export const onRequest = async (context) => {
  const { env } = context;

  return new Response(
    JSON.stringify({
      providers: {
        groq: Boolean(env.GROQ_API_KEY),
        mistral: Boolean(env.MISTRAL_API_KEY)
      }
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
