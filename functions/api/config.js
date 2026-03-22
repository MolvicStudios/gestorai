// functions/api/config.js — Cloudflare Pages Function
// Expone configuración pública al frontend (Supabase URL + anon key)
export async function onRequest(context) {
  return new Response(
    JSON.stringify({
      supabaseUrl: 'https://awotunjsfnlcgpaewpyi.supabase.co',
      supabaseAnonKey: context.env.SUPABASE_ANON_KEY
    }),
    {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=3600'
      }
    }
  );
}
