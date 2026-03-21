/**
 * Cloudflare Pages Function: /api/config
 * Alias explicito para exponer claves de IA al frontend.
 */

export const onRequest = async (context) => {
  const { env } = context;

  return new Response(
    JSON.stringify({
      groq_key: env.GROQ_API_KEY || null,
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
