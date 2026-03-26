// js/auth.js — GestorAI Auth Manager v2
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = 'https://awotunjsfnlcgpaewpyi.supabase.co';

// Obtener anon key via Pages Function /api/config
let _supabase = null;
async function initSupabase() {
  if (_supabase) return _supabase;
  try {
    const cfg = await fetch('/api/config').then(r => r.json());
    _supabase = createClient(cfg.supabaseUrl || SUPABASE_URL, cfg.supabaseAnonKey);
  } catch {
    // Fallback para desarrollo local
    _supabase = createClient(SUPABASE_URL, '');
  }
  return _supabase;
}

// Proxy que inicializa lazy
export const supabase = new Proxy({}, {
  get(_, prop) {
    if (!_supabase) throw new Error('Supabase no inicializado. Usa await initAuth() primero.');
    return _supabase[prop];
  }
});

export async function initAuth() {
  await initSupabase();
  return _supabase;
}

export async function getSession() {
  const sb = await initSupabase();
  const { data: { session } } = await sb.auth.getSession();
  return session;
}

export async function getUser() {
  const session = await getSession();
  return session?.user || null;
}

export async function getUserProfile() {
  const user = await getUser();
  if (!user) return null;
  const sb = await initSupabase();
  const { data } = await sb
    .from('profiles')
    .select('*, onboarding(*)')
    .eq('id', user.id)
    .single();
  return data;
}

export async function loginMagicLink(email) {
  const sb = await initSupabase();
  return await sb.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: 'https://gestorai.pro/app/dashboard.html' }
  });
}

export async function loginPassword(email, password) {
  const sb = await initSupabase();
  return await sb.auth.signInWithPassword({ email, password });
}

export async function registerPassword(email, password) {
  const sb = await initSupabase();
  return await sb.auth.signUp({
    email, password,
    options: { emailRedirectTo: 'https://gestorai.pro/app/dashboard.html' }
  });
}

export async function logout() {
  const sb = await initSupabase();
  await sb.auth.signOut();
  window.location.href = '/';
}

export async function requireAuth() {
  const session = await getSession();
  if (!session) {
    window.location.href = `/?login=required&redirect=${encodeURIComponent(location.pathname)}`;
    return null;
  }
  return session;
}

export async function requireOnboarding() {
  const profile = await getUserProfile();
  if (!profile?.onboarding?.[0]?.paso_3_listo) {
    window.location.href = '/app/onboarding.html';
    return false;
  }
  return true;
}

export async function initAppPage() {
  const session = await requireAuth();
  if (!session) return null;
  const profile = await getUserProfile();
  if (!profile) return null;
  const elNombre = document.getElementById('user-nombre');
  const elPlan   = document.getElementById('user-plan');
  const elEmail  = document.getElementById('user-email');
  if (elNombre) elNombre.textContent = profile.nombre || profile.empresa || session.user.email.split('@')[0];
  if (elEmail)  elEmail.textContent  = session.user.email;
  if (elPlan) {
    const { default: LS } = await import('./license.js');
    const isPro = LS.isPro();
    elPlan.textContent = isPro ? 'Pro' : 'Free';
    elPlan.className   = `badge badge-${isPro ? 'pro' : 'free'}`;
  }
  return { session, profile };
}

export async function updateProfile(data) {
  const sb = await initSupabase();
  const user = await getUser();
  if (!user) return { error: 'No autenticado' };
  const { error } = await sb.from('profiles').update(data).eq('id', user.id);
  return { error };
}

export function onAuthStateChange(cb) {
  if (!_supabase) return { data: { subscription: { unsubscribe() {} } } };
  return _supabase.auth.onAuthStateChange(cb);
}
