// js/stripe.js — Checkout + detección plan
import { supabase, getSession } from './auth.js';

const STRIPE_PUBLISHABLE_KEY = 'TU_STRIPE_PUBLISHABLE_KEY';
const PRO_PRICE_ID = 'TU_STRIPE_PRICE_ID'; // precio 19,90 €/mes

let stripeInstance = null;

async function getStripe() {
  if (stripeInstance) return stripeInstance;
  // Cargar Stripe.js dinámicamente
  if (!window.Stripe) {
    await new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://js.stripe.com/v3/';
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }
  stripeInstance = window.Stripe(STRIPE_PUBLISHABLE_KEY);
  return stripeInstance;
}

// Iniciar checkout de Stripe para plan Pro
export async function iniciarCheckout() {
  const session = await getSession();
  if (!session) {
    window.location.href = '/?login=required';
    return;
  }

  try {
    // Crear sesión de checkout via Supabase Edge Function o CF Worker
    const { data, error } = await supabase.functions.invoke('create-checkout', {
      body: {
        priceId: PRO_PRICE_ID,
        successUrl: `${window.location.origin}/app/dashboard.html?upgrade=success`,
        cancelUrl: `${window.location.origin}/app/dashboard.html?upgrade=canceled`
      }
    });

    if (error) throw error;

    const stripe = await getStripe();
    await stripe.redirectToCheckout({ sessionId: data.sessionId });
  } catch (e) {
    console.error('Error al iniciar checkout:', e);
    document.dispatchEvent(new CustomEvent('gestorai:toast', {
      detail: { type: 'error', message: 'Error al iniciar el pago. Inténtalo de nuevo.' }
    }));
  }
}

// Portal de gestión de suscripción
export async function abrirPortalCliente() {
  try {
    const { data, error } = await supabase.functions.invoke('customer-portal', {
      body: { returnUrl: `${window.location.origin}/app/dashboard.html` }
    });
    if (error) throw error;
    window.location.href = data.url;
  } catch (e) {
    console.error('Error al abrir portal:', e);
  }
}
