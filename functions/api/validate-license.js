// functions/api/validate-license.js — Cloudflare Pages Function
// Validates Lemon Squeezy license keys for GestorAI.pro

const ALLOWED_ORIGIN = 'https://gestorai.pro';

function corsHeaders(request) {
  const origin = request?.headers?.get('Origin') || '';
  const allow = origin === ALLOWED_ORIGIN ? ALLOWED_ORIGIN : ALLOWED_ORIGIN;
  return {
    'Access-Control-Allow-Origin':  allow,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type':                 'application/json',
  };
}

export async function onRequestPost({ request }) {
  const headers = corsHeaders(request);

  let licenseKey;
  try {
    const body = await request.json();
    licenseKey = body.licenseKey?.trim();
  } catch {
    return new Response(
      JSON.stringify({ valid: false, error: 'Solicitud inválida' }),
      { status: 400, headers }
    );
  }

  if (!licenseKey) {
    return new Response(
      JSON.stringify({ valid: false, error: 'No se proporcionó clave de licencia' }),
      { status: 400, headers }
    );
  }

  try {
    const res = await fetch('https://api.lemonsqueezy.com/v1/licenses/validate', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ license_key: licenseKey }),
    });

    const data  = await res.json();
    const valid = data?.valid === true;

    // Determinar período de facturación por variant ID
    const variantId     = String(data?.license_key?.variant_id || '');
    const billingPeriod = variantId === '1451025' ? 'anual' : 'mensual';

    return new Response(JSON.stringify({
      valid,
      plan:          valid ? 'pro' : 'free',
      billingPeriod: valid ? billingPeriod : null,
      email:         data?.license_key?.user_email || null,
    }), { headers });

  } catch (err) {
    return new Response(
      JSON.stringify({ valid: false, error: err.message }),
      { status: 500, headers }
    );
  }
}

export async function onRequestOptions({ request }) {
  return new Response(null, {
    headers: corsHeaders(request)
  });
}
