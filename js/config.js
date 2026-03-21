/* GestorIA — Config.js
   Carga de configuración desde Cloudflare + constantes globales
*/

let GROQ_KEY = null;
let MISTRAL_KEY = null;

// ========================================================================
// 1. CARGAR CLAVES DESDE CLOUDFLARE
// ========================================================================

async function inicializarIA() {
  const rutas = ['/api/config', '/config'];

  for (const ruta of rutas) {
    try {
      const res = await fetch(ruta, {
        headers: {
          'Accept': 'application/json'
        }
      });

      const contentType = res.headers.get('content-type') || '';
      if (!res.ok || !contentType.includes('application/json')) {
        throw new Error(`Respuesta no valida en ${ruta}`);
      }

      const config = await res.json();
      GROQ_KEY = config?.providers?.groq ? 'configured' : null;
      MISTRAL_KEY = config?.providers?.mistral ? 'configured' : null;
      console.log('✅ Estado de IA cargado desde:', ruta, config.providers || {});
      return;
    } catch (e) {
      console.warn(`⚠️ Fallo al cargar configuración desde ${ruta}:`, e);
    }
  }

  console.error('❌ No se pudo verificar el estado de los proveedores de IA.');
}

// ========================================================================
// 2. NAMESPACE localStorage
// ========================================================================

const LS_KEYS = {
  usuarios:             'gestorai_usuarios',           // JSON[] de usuarios registrados
  sesion_activa:        'gestorai_sesion_activa',      // email del usuario logueado
  onboarding_done:      'gestorai_onboarding_done',    // bool
  tema:                 'gestorai_tema',               // "light"|"dark"|"warm"|"contrast"
  cookies_consent:      'gestorai_cookies_consent',    // "accepted"|"rejected"|null
  // Dinámicas (por email):
  // gestorai_historial_{email}
  // gestorai_perfil_{email}
};

// ========================================================================
// 3. CONSTANTES DE IDENTIDAD Y BRANDING
// ========================================================================

const GESTORIA_IDENTITY = {
  name:         'GestorIA',
  domain:       'gestorai.pro',
  tagline:      'Tu asesor fiscal y laboral con IA — gratis',
  parent_brand: 'MolvicStudios',
  parent_url:   'molvicstudios.pro',
  location:     'Mazarrón, Murcia, España',
  email:        'molvicstudios@outlook.com',
  whatsapp:     '+34600055882',
  telegram:     '@molvicstudios',
  language:     'es',
  model_ia:     'llama-3.3-70b-versatile (Groq)',
  fallback_ia:  'mistral-large-latest (Mistral)',
};

// ========================================================================
// 4. CONFIGURACIÓN DE TEMAS
// ========================================================================

const TEMAS = ['light', 'dark', 'warm', 'contrast'];
const TEMA_DEFECTO = 'light';

const TEMA_LABELS = {
  light:     '☀ Claro',
  dark:      '◉ Oscuro',
  warm:      '☕ Cálido',
  contrast:  '◑ Contraste'
};

// ========================================================================
// 5. UTILIDADES
// ========================================================================

/**
 * Sanear email para usarlo como clave localStorage
 * Ej: "usuario@mail.com" → "usuario_mail_com"
 */
function sanitizarEmailParaKey(email) {
  return email.toLowerCase().replace(/[^a-z0-9]/g, '_');
}

/**
 * Cargar tema guardado o aplicar defecto
 */
function cargarTemaAlInicio() {
  const tema = localStorage.getItem(LS_KEYS.tema) || TEMA_DEFECTO;
  document.documentElement.setAttribute('data-theme', tema);
  return tema;
}

/**
 * Cambiar tema dinámicamente
 */
function cambiarTema(nuevoTema) {
  if (!TEMAS.includes(nuevoTema)) return;
  document.documentElement.setAttribute('data-theme', nuevoTema);
  localStorage.setItem(LS_KEYS.tema, nuevoTema);
}

/**
 * Obtener tema actual
 */
function obtenerTemaActual() {
  return document.documentElement.getAttribute('data-theme') || TEMA_DEFECTO;
}

// ========================================================================
// 6. CALENDARIO FISCAL ESPAÑA 2026
// ========================================================================

const CALENDARIO_FISCAL = {
  modelo_303: [
    { trimestre: 'T4_anterior', mes: 0, dia: 20, ccaa: null },  // enero (de 2025)
    { trimestre: 'T1', mes: 3, dia: 20, ccaa: null },           // abril
    { trimestre: 'T2', mes: 6, dia: 20, ccaa: null },           // julio
    { trimestre: 'T3', mes: 9, dia: 20, ccaa: null }            // octubre
  ],
  modelo_130: [
    { trimestre: 'T4_anterior', mes: 0, dia: 20 },
    { trimestre: 'T1', mes: 3, dia: 20 },
    { trimestre: 'T2', mes: 6, dia: 20 },
    { trimestre: 'T3', mes: 9, dia: 20 }
  ],
  modelo_100: [
    { descripcion: 'Declaración de la Renta', mes: 5, dia: 30 }  // junio
  ],
  modelo_390: [
    { descripcion: 'Resumen anual IVA', mes: 0, dia: 30 }  // enero (año anterior)
  ],
  modelo_349: [
    { descripcion: 'Intracomunitario', mes: 0, dia: 31 },
    { descripcion: 'Intracomunitario', mes: 3, dia: 30 },
    { descripcion: 'Intracomunitario', mes: 6, dia: 31 },
    { descripcion: 'Intracomunitario', mes: 9, dia: 31 }
  ]
};

// ========================================================================
// 7. COMUNIDADES AUTÓNOMAS + CONFIG REGIONAL
// ========================================================================

const CCAAS = [
  'Andalucía',
  'Aragón',
  'Asturias',
  'Balears (Illes)',
  'Canarias',
  'Cantabria',
  'Castilla y León',
  'Castilla-La Mancha',
  'Cataluña',
  'Ceuta',
  'Comunidad de Madrid',
  'Comunidad Foral de Navarra',
  'Comunidad Valenciana',
  'Extremadura',
  'Galicia',
  'La Rioja',
  'Melilla',
  'País Vasco',
  'Región de Murcia'
];

// Configuración específica por CCAA
const CONFIG_REGIONAL = {
  'Canarias': {
    tiene_igic: true,
    iva_tipos: [0, 3, 7, 9],
    modelo_iva: '420',
    modelo_resumen: '425',
    observacion: 'En Canarias aplica IGIC en lugar de IVA. Tipos: 0%, 3%, 7%, 9%.'
  },
  'País Vasco': {
    tiene_ticketbai: true,
    observacion: 'TicketBAI obligatorio desde enero 2026. GestorIA no genera ficheros TicketBAI. Recomienda asesor local.'
  },
  'Comunidad Foral de Navarra': {
    regimen_foral: true,
    observacion: 'Régimen foral propio. Consulta asesor local para particularidades.'
  },
  'Ceuta': {
    tiene_ipsi: true,
    observacion: 'IPSI en lugar de IVA. Tipos especiales reducidos.'
  },
  'Melilla': {
    tiene_ipsi: true,
    observacion: 'IPSI en lugar de IVA. Tipos especiales reducidos.'
  }
};

// ========================================================================
// 8. VALIDACIÓN DE EMAIL
// ========================================================================

function validarEmail(email) {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

// ========================================================================
// 9. INICIALIZACIÓN
// ========================================================================

// Al cargar la página principal
document.addEventListener('DOMContentLoaded', () => {
  cargarTemaAlInicio();
  inicializarIA();
});

export {
  GROQ_KEY,
  MISTRAL_KEY,
  LS_KEYS,
  GESTORIA_IDENTITY,
  TEMAS,
  TEMA_DEFECTO,
  TEMA_LABELS,
  CALENDARIO_FISCAL,
  CCAAS,
  CONFIG_REGIONAL,
  sanitizarEmailParaKey,
  cargarTemaAlInicio,
  cambiarTema,
  obtenerTemaActual,
  validarEmail,
  inicializarIA
};
