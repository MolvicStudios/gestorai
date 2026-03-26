// worker/index.js — GestorAI Cloudflare Worker
// Endpoints: POST /api/verify-license (Lemon Squeezy)

const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://gestorai.pro',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json'
};

async function verifyLicense(license_key, env) {
  const response = await fetch(
    'https://api.lemonsqueezy.com/v1/licenses/validate',
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.LEMONSQUEEZY_API_KEY}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({ license_key })
    }
  );

  const data = await response.json();

  const variantId = data?.meta?.variant_id?.toString();
  const validVariants = ['1451042', '1451025'];

  if (!data.valid || !validVariants.includes(variantId)) {
    return { valid: false, plan: null };
  }

  const plan = variantId === '1451025' ? 'annual' : 'monthly';

  const status = data?.license_key?.status;
  if (status !== 'active' && status !== 'on_trial') {
    return { valid: false, plan: null, reason: 'inactive' };
  }

  return {
    valid: true,
    plan,
    status,
    expires: data?.license_key?.expires_at || null
  };
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    // POST /api/verify-license
    if (request.method === 'POST' && url.pathname === '/api/verify-license') {
      try {
        const body = await request.json();
        const license_key = body?.license_key;

        if (!license_key || typeof license_key !== 'string') {
          return new Response(
            JSON.stringify({ valid: false, reason: 'missing_key' }),
            { status: 400, headers: corsHeaders }
          );
        }

        const result = await verifyLicense(license_key.trim(), env);
        return new Response(JSON.stringify(result), {
          status: 200,
          headers: corsHeaders
        });
      } catch (err) {
        return new Response(
          JSON.stringify({ valid: false, reason: 'server_error' }),
          { status: 500, headers: corsHeaders }
        );
      }
    }

    return new Response(
      JSON.stringify({ error: 'Not found' }),
      { status: 404, headers: corsHeaders }
    );
  }
};
