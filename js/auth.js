/* GestorIA — auth.js
   Autenticación local: Registro, Login, Logout, Session Guard
   Hash: SHA-256 + salt (sin backend)
*/

// ========================================================================
// 1. HASHING DE PASSWORD (Web Crypto API)
// ========================================================================

/**
 * Hashear password con SHA-256
 * @param {string} password - Contraseña en texto claro
 * @returns {Promise<string>} Hash hexadecimal
 */
export async function hashPassword(password) {
  const encoder = new TextEncoder();
  const salt = 'gestorai_salt_2026';
  const data = encoder.encode(password + salt);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// ========================================================================
// 2. REGISTRO DE NUEVO USUARIO
// ========================================================================

/**
 * Registrar un nuevo usuario
 * @param {string} email - Email del usuario (único)
 * @param {string} password - Contraseña (mínimo 8 caracteres)
 * @returns {Promise<Object>} Usuario registrado
 * @throws {Error} Si email ya existe o formato inválido
 */
export async function registrar(email, password) {
  const emailLimpio = email.toLowerCase().trim();

  // Validar email
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailLimpio)) {
    throw new Error('El email no tiene un formato válido.');
  }

  // Validar contraseña
  if (password.length < 8) {
    throw new Error('La contraseña debe tener al menos 8 caracteres.');
  }

  // Cargar lista de usuarios
  const usuarios = JSON.parse(localStorage.getItem('gestorai_usuarios') || '[]');

  // Verificar que el email no existe ya
  if (usuarios.find(u => u.email === emailLimpio)) {
    throw new Error('Este email ya está registrado.');
  }

  // Hashear password
  const hash = await hashPassword(password);

  // Crear usuario
  const nuevoUsuario = {
    email: emailLimpio,
    hash,
    created_at: new Date().toISOString()
  };

  // Guardar en localStorage
  usuarios.push(nuevoUsuario);
  localStorage.setItem('gestorai_usuarios', JSON.stringify(usuarios));

  // Iniciar sesión automáticamente
  localStorage.setItem('gestorai_sesion_activa', emailLimpio);

  console.log('✅ Usuario registrado:', emailLimpio);
  return nuevoUsuario;
}

// ========================================================================
// 3. LOGIN
// ========================================================================

/**
 * Iniciar sesión
 * @param {string} email - Email del usuario
 * @param {string} password - Contraseña
 * @returns {Promise<Object>} Usuario autenticado
 * @throws {Error} Si credenciales incorrectas
 */
export async function login(email, password) {
  const emailLimpio = email.toLowerCase().trim();

  // Cargar lista de usuarios
  const usuarios = JSON.parse(localStorage.getItem('gestorai_usuarios') || '[]');
  const usuario = usuarios.find(u => u.email === emailLimpio);

  // Verificar que el usuario existe
  if (!usuario) {
    throw new Error('Email o contraseña incorrectos.');
  }

  // Verificar password
  const hash = await hashPassword(password);
  if (hash !== usuario.hash) {
    throw new Error('Email o contraseña incorrectos.');
  }

  // Iniciar sesión
  localStorage.setItem('gestorai_sesion_activa', emailLimpio);

  console.log('✅ Sesión iniciada:', emailLimpio);
  return usuario;
}

function obtenerSesionValida() {
  const email = localStorage.getItem('gestorai_sesion_activa');
  if (!email) return null;

  const usuarios = JSON.parse(localStorage.getItem('gestorai_usuarios') || '[]');
  const usuario = usuarios.find(u => u.email === email);

  if (!usuario) {
    localStorage.removeItem('gestorai_sesion_activa');
    return null;
  }

  return email;
}

// ========================================================================
// 4. LOGOUT
// ========================================================================

/**
 * Cerrar sesión y redirigir
 */
export function logout() {
  const email = localStorage.getItem('gestorai_sesion_activa');
  if (email) {
    console.log('👋 Sesión cerrada:', email);
  }
  localStorage.removeItem('gestorai_sesion_activa');
  window.location.href = '/login.html';
}

// ========================================================================
// 5. SESSION GUARD
// ========================================================================

/**
 * Verificar que hay sesión activa
 * Si no hay sesión, redirige a /login.html
 * @returns {string|null} Email del usuario actual o null si no hay sesión
 */
export function requireSesion() {
  const sesion = obtenerSesionValida();
  if (!sesion) {
    console.warn('⚠️ No hay sesión activa. Redirigiendo a login...');
    window.location.replace('/login.html');
    return null;
  }
  return sesion;
}

// ========================================================================
// 6. OBTENER USUARIO ACTUAL
// ========================================================================

/**
 * Obtener datos del usuario actual
 * @returns {Object|null} Usuario actual o null si no hay sesión
 */
export function getUsuarioActual() {
  const email = obtenerSesionValida();
  if (!email) return null;

  const usuarios = JSON.parse(localStorage.getItem('gestorai_usuarios') || '[]');
  return usuarios.find(u => u.email === email) || null;
}

// ========================================================================
// 7. VERIFICAR SESIÓN (SIN REDIRIGIR)
// ========================================================================

/**
 * Comprobar si hay sesión activa sin redirigir
 * @returns {boolean}
 */
export function tieneSesion() {
  return !!obtenerSesionValida();
}

// ========================================================================
// 8. ELIMINAR CUENTA (BORRAR DATOS)
// ========================================================================

/**
 * Eliminar la cuenta del usuario y todos sus datos
 * @param {string} email - Email del usuario
 * @param {string} password - Verificar contraseña antes de eliminar
 * @throws {Error} Si credenciales incorrectas
 */
export async function eliminarCuenta(email, password) {
  // Verificar contraseña primero
  await login(email, password); // Esta verificará la contraseña

  const emailLimpio = email.toLowerCase().trim();
  const keyPerfil = 'gestorai_perfil_' + emailLimpio.replace(/[^a-z0-9]/g, '_');
  const keyHistorial = 'gestorai_historial_' + emailLimpio.replace(/[^a-z0-9]/g, '_');

  // Eliminar usuario de lista
  const usuarios = JSON.parse(localStorage.getItem('gestorai_usuarios') || '[]');
  const usuariosActualizado = usuarios.filter(u => u.email !== emailLimpio);
  localStorage.setItem('gestorai_usuarios', JSON.stringify(usuariosActualizado));

  // Eliminar perfil
  localStorage.removeItem(keyPerfil);

  // Eliminar historial
  localStorage.removeItem(keyHistorial);

  // Cerrar sesión
  logout();

  console.log('🗑️ Cuenta eliminada:', emailLimpio);
}
