// functions/api/ia.js — GestorAI IA Proxy (Cloudflare Pages Function)
// Variables en CF Pages → gestorai → Settings → Environment variables:
//   GROQ_API_KEY      → tu key de Groq
//   MISTRAL_API_KEY   → tu key de Mistral
//   SUPABASE_URL      → https://awotunjsfnlcgpaewpyi.supabase.co
//   SUPABASE_ANON_KEY → tu anon key de Supabase

const GROQ_URL    = 'https://api.groq.com/openai/v1/chat/completions';
const MISTRAL_URL = 'https://api.mistral.ai/v1/chat/completions';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': 'https://gestorai.pro',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function onRequest(context) {
  const { request, env } = context;

  // CORS preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: CORS_HEADERS });
  }

  if (request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  // 1. Verificar JWT de Supabase
  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return new Response('Unauthorized', { status: 401 });
  }
  const jwt = authHeader.replace('Bearer ', '');

  // Verificar usuario en Supabase
  const userRes = await fetch(`${env.SUPABASE_URL}/auth/v1/user`, {
    headers: {
      'Authorization': `Bearer ${jwt}`,
      'apikey': env.SUPABASE_ANON_KEY
    }
  });

  if (!userRes.ok) {
    return new Response('Invalid session', { status: 401 });
  }

  const userData = await userRes.json();
  const userId = userData.id;

  // 2. Verificar plan y límite diario (plan Free: máx 5/día)
  const profileRes = await fetch(
    `${env.SUPABASE_URL}/rest/v1/profiles?id=eq.${userId}&select=plan`,
    {
      headers: {
        'Authorization': `Bearer ${jwt}`,
        'apikey': env.SUPABASE_ANON_KEY
      }
    }
  );
  const profiles = await profileRes.json();
  const plan = profiles?.[0]?.plan || 'free';

  if (plan === 'free') {
    const today = new Date().toISOString().split('T')[0];
    const countRes = await fetch(
      `${env.SUPABASE_URL}/rest/v1/consultas_ia?user_id=eq.${userId}&fecha=eq.${today}&select=id`,
      {
        headers: {
          'Authorization': `Bearer ${jwt}`,
          'apikey': env.SUPABASE_ANON_KEY,
          'Prefer': 'count=exact'
        }
      }
    );
    const countHeader = countRes.headers.get('Content-Range');
    const count = parseInt(countHeader?.split('/')[1] || '0');

    if (count >= 5) {
      return new Response(
        JSON.stringify({ error: 'limite_free', message: 'Has alcanzado el límite de 5 consultas diarias del plan Free. Actualiza a Pro para consultas ilimitadas.' }),
        { status: 429, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
      );
    }
  }

  // 3. Obtener config del modelo activo desde ai_config
  const configRes = await fetch(
    `${env.SUPABASE_URL}/rest/v1/ai_config?activo=eq.true&order=prioridad.asc`,
    {
      headers: {
        'Authorization': `Bearer ${jwt}`,
        'apikey': env.SUPABASE_ANON_KEY
      }
    }
  );
  const configs = await configRes.json();
  const primaryConfig  = configs.find(c => c.prioridad === 1) || { proveedor: 'groq', modelo: 'llama-3.3-70b-versatile', max_tokens: 1500, temperature: 0.2 };
  const fallbackConfig = configs.find(c => c.prioridad === 2) || { proveedor: 'mistral', modelo: 'mistral-small-latest', max_tokens: 1500, temperature: 0.2 };

  // 4. Parsear body de la petición
  const { systemPrompt, userPrompt, modulo = 'general' } = await request.json();

  if (!systemPrompt || !userPrompt) {
    return new Response('Missing prompts', { status: 400 });
  }

  // 5. Llamar IA con fallback automático
  const payload = (config) => ({
    model: config.modelo,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user',   content: userPrompt }
    ],
    max_tokens:  config.max_tokens  || 1500,
    temperature: config.temperature || 0.2
  });

  let iaResponse = null;
  let usedProvider = null;

  // Intentar proveedor primario
  try {
    const apiUrl = primaryConfig.proveedor === 'groq' ? GROQ_URL : MISTRAL_URL;
    const apiKey = primaryConfig.proveedor === 'groq' ? env.GROQ_API_KEY : env.MISTRAL_API_KEY;

    const res = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(payload(primaryConfig))
    });

    if (res.ok) {
      iaResponse  = await res.json();
      usedProvider = primaryConfig.proveedor;
    } else {
      console.warn(`[ia-proxy] Proveedor primario falló (${res.status}), usando fallback`);
    }
  } catch (e) {
    console.warn('[ia-proxy] Error proveedor primario:', e.message);
  }

  // Fallback si el primario falló
  if (!iaResponse) {
    try {
      const apiUrl = fallbackConfig.proveedor === 'groq' ? GROQ_URL : MISTRAL_URL;
      const apiKey = fallbackConfig.proveedor === 'groq' ? env.GROQ_API_KEY : env.MISTRAL_API_KEY;

      const res = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(payload(fallbackConfig))
      });

      if (res.ok) {
        iaResponse  = await res.json();
        usedProvider = fallbackConfig.proveedor;
      }
    } catch (e) {
      console.error('[ia-proxy] Fallback también falló:', e.message);
    }
  }

  if (!iaResponse) {
    return new Response(
      JSON.stringify({ error: 'ia_unavailable', message: 'El asistente IA no está disponible temporalmente. Inténtalo de nuevo en unos minutos.' }),
      { status: 503, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
    );
  }

  // 6. Registrar uso en consultas_ia (fire and forget)
  const tokens = iaResponse.usage?.total_tokens || 0;
  context.waitUntil(
    fetch(`${env.SUPABASE_URL}/rest/v1/consultas_ia`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${jwt}`,
        'apikey': env.SUPABASE_ANON_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ user_id: userId, modulo, tokens_usados: tokens })
    })
  );

  // 7. Devolver respuesta
  const content = iaResponse.choices?.[0]?.message?.content || '';
  return new Response(
    JSON.stringify({ content, provider: usedProvider, tokens }),
    { status: 200, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
  );
}
