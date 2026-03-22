// js/auth.js — GestorAI Auth Manager
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = 'https://awotunjsfnlcgpaewpyi.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF3b3R1bmpzZm5sY2dwYWV3cHlpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQwMDAwNjcsImV4cCI6MjA4OTU3NjA2N30.zrfVpTHz9Qx0hojWVfIzbfVAzRLWx-MiUih8ZKa9Eag';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Obtener sesión actual
export async function getSession() {
  const { data: { session } } = await supabase.auth.getSession();
  return session;
}

// Obtener perfil y plan del usuario
export async function getUserProfile() {
  const session = await getSession();
  if (!session) return null;
  const { data } = await supabase
    .from('profiles')
    .select('*, subscriptions(plan, status, current_period_end)')
    .eq('id', session.user.id)
    .single();
  return data;
}

// Login con Magic Link
export async function loginMagicLink(email) {
  return await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: 'https://gestorai.pro/app/dashboard.html' }
  });
}

// Login con email y contraseña
export async function loginEmail(email, password) {
  return await supabase.auth.signInWithPassword({ email, password });
}

// Registro con email y contraseña
export async function signUpEmail(email, password) {
  return await supabase.auth.signUp({
    email,
    password,
    options: { emailRedirectTo: 'https://gestorai.pro/app/dashboard.html' }
  });
}

// Logout
export async function logout() {
  await supabase.auth.signOut();
  window.location.href = '/';
}

// Guard: redirigir si no hay sesión
export async function requireAuth() {
  const session = await getSession();
  if (!session) {
    window.location.href = '/?login=required';
    return null;
  }
  return session;
}

// Guard plan: verificar si el usuario tiene plan Pro
export async function requirePro() {
  const profile = await getUserProfile();
  if (!profile || profile.plan !== 'pro') {
    window.location.href = '/app/dashboard.html?upgrade=required';
    return false;
  }
  return true;
}

// Actualizar perfil
export async function updateProfile(data) {
  const session = await getSession();
  if (!session) return { error: 'No autenticado' };
  const { error } = await supabase
    .from('profiles')
    .update(data)
    .eq('id', session.user.id);
  return { error };
}

// Escuchar cambios de auth
export function onAuthStateChange(callback) {
  return supabase.auth.onAuthStateChange(callback);
}
