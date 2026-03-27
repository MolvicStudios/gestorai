// functions/api/validate-license.js — Cloudflare Pages Function
// Validates Lemon Squeezy license keys for GestorAI.pro

export async function onRequestPost({ request }) {
  const corsHeaders = {
    'Access-Control-Allow-Origin':  '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type':                 'application/json',
  };

  let licenseKey;
  try {
    const body = await request.json();
    licenseKey = body.licenseKey?.trim();
  } catch {
    return new Response(
      JSON.stringify({ valid: false, error: 'Solicitud inválida' }),
      { status: 400, headers: corsHeaders }
    );
  }

  if (!licenseKey) {
    return new Response(
      JSON.stringify({ valid: false, error: 'No se proporcionó clave de licencia' }),
      { status: 400, headers: corsHeaders }
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
    }), { headers: corsHeaders });

  } catch (err) {
    return new Response(
      JSON.stringify({ valid: false, error: err.message }),
      { status: 500, headers: corsHeaders }
    );
  }
}

export async function onRequestOptions() {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin':  '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    }
  });
}
