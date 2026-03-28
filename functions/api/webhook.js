// functions/api/webhook.js — Cloudflare Pages Function
// Lemon Squeezy webhook endpoint for GestorAI.pro

export async function onRequestPost({ request, env }) {
  const body      = await request.text();
  const signature = request.headers.get('x-signature') || '';

  const secret = env.LS_WEBHOOK_SECRET;
  if (!secret) return new Response('Server config error', { status: 500 });

  const valid = await verifySignature(body, signature, secret);
  if (!valid) return new Response('Unauthorized', { status: 401 });

  let event;
  try { event = JSON.parse(body); }
  catch { return new Response('Invalid JSON', { status: 400 }); }

  const eventType = event.meta?.event_name;
  const data      = event.data?.attributes;

  console.log(`[GestorAI Webhook] Event: ${eventType}`);

  switch (eventType) {
    case 'order_created':
    case 'subscription_created':
      console.log(`[GestorAI] Nueva suscripción: ${data?.user_email}`);
      break;

    case 'subscription_updated':
      console.log(`[GestorAI] Suscripción actualizada: ${data?.user_email} → ${data?.status}`);
      break;

    case 'subscription_cancelled':
    case 'subscription_expired':
      console.log(`[GestorAI] Suscripción cancelada: ${data?.user_email}`);
      break;
  }

  return new Response('OK', { status: 200 });
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

async function verifySignature(body, signature, secret) {
  try {
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );
    const sigBytes = hexToBytes(signature);
    return await crypto.subtle.verify('HMAC', key, sigBytes, encoder.encode(body));
  } catch {
    return false;
  }
}

function hexToBytes(hex) {
  if (!hex || hex.length % 2 !== 0) return new Uint8Array(0);
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return bytes;
}
