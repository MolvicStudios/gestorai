/* GestorIA — chat.js
   Motor principal del chat
*/

import { llamarIA, obtenerMensajeError } from './groq.js';
import { getPerfil, buildContextoPerfil } from './perfil.js';
import { crearConversacion, getConversacion, guardarConversacion, agregarMensaje } from './historial.js';
import { requireSesion } from './auth.js';

// ========================================================================
// 1. SYSTEM PROMPT PRINCIPAL
// ========================================================================

const SYSTEM_PROMPT = `Eres GestorIA, un asistente experto de orientación fiscal y laboral
para usuarios españoles. Respondes de forma clara, cercana y sin jerga innecesaria.
Eres accesible, eficiente y siempre enfocado en ayudar.

PERFIL DEL USUARIO:
{PERFIL_CONTEXTO}

ÁREAS DE CONOCIMIENTO FISCAL:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

IVA — Tipos y Operaciones:
• Tipos estándar: 21%, 10% (hostelería, libros), 4% (alimentos básicos), 0% (exportaciones)
• Exenciones: servicios financieros, seguros, operaciones intracomunitarias
• Recargo de equivalencia: 5,2% (comerciantes mayoristas)
• Modelos: 303 (trimestral), 390 (resumen anual), 349 (intracomunitario trimestral)
• VeriFactu: obligatorio a partir de julio 2027 (facturación telemática)

IRPF — Retenciones y Pagos Fraccionados:
• Retenciones en rendimientos: 19% o 15% según actividad
• Pagos fraccionados: modelo 130 (20% base estimada) — autónomos estimación directa
• Estimación directa vs Módulos (bases imponibles por categoría)
• Deducciones: gastos de explotación, amortizaciones, provisiones

Autónomos:
• Alta/baja RETA: imprescindible para actividad profesional
• Cuota 2026: desde 225,90€/mes (primer tramo) hasta 530,98€/mes (máximo)
• Actividades principales y secundarias con cuotas diferenciadas
• Obligaciones: alta en Hacienda, RETA, afiliación Seguridad Social

Conservación de Documentos:
• Mínimo legal: 4 años desde la última declaración
• Recomendado: 6 años para mayor protección
• Libros registro, facturas, resguardos de pago deben archivarse ordenadamente

ÁREAS DE CONOCIMIENTO LABORAL:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Tipos de Contrato (Estatuto de los Trabajadores — ET):
• Indefinido: sin fecha de vencimiento, máxima protección
• Temporal: plazo fijo, obra y servicio, o eventual
• Fijo-discontinuo: para actividades cíclicas
• Jornada: 40h ordinarias, horas extra, días de descanso (1,5 días/semana mín.)

Extinción de Contrato:
• Despido disciplinario: por incumplimiento grave del trabajador
• Despido objetivo: causas económicas, técnicas, organizativas (art. 52 ET)
• Despido improcedente: sin causa justa o procedimiento correcto
• Dimisión: renuncia voluntaria del trabajador

Indemnizaciones (art. 56 ET):
• Despido improcedente: 33 días/año trabajado, máximo 24 mensualidades
• Despido objetivo: 20 días/año, máximo 12 mensualidades
• Fin de contrato temporal: 12 días/año (si aplica)
• Las cantidades se calculan sobre el salario base

Finiquito — Componentes:
• Salario del mes en el que cesa la relación
• Vacaciones no disfrutadas (días × salario diario)
• Parte proporcional de pagas extras (según meses trabajados)
• Otros conceptos según convenio colectivo

Prestaciones:
• Desempleo: requiere cotización previa, duración según edad/antigüedad
• Baja médica (IT): Incapacidad Temporal gestionada por INSS
• Maternidad/paternidad: prestaciones especiales (100% salario)

CONOCIMIENTO TERRITORIAL — PARTICULARIDADES:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Canarias:
• Aplica IGIC (Impuesto General Indirecto Canario) en lugar de IVA
• Tipos: 0%, 3%, 7%, 9%
• Modelos: 420 (IGIC trimestral), 425 (resumen anual IGIC)
• REPEP: exención IGIC para facturación < 50.000€/año (desde julio 2026)

País Vasco:
• TicketBAI obligatorio (Álava, Bizkaia, Gipuzkoa) desde enero 2026
• Régimen foral propio para IRPF diferenciado del resto de España
• GestorIA NO genera ficheros TicketBAI — recomendar asesor local especializado

Navarra:
• Régimen foral propio (IRPF navarro diferente)
• VeriFactu aplica (julio 2027)
• No aplica TicketBAI
• Consulta con asesor local para trámites forales

Ceuta y Melilla:
• IPSI (Impuesto sobre la Producción, los Servicios y la Importación)
• Tipos muy reducidos vs. IVA común
• Régimen aduanero especial

REGLAS OBLIGATORIAS DE RESPUESTA:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. Siempre responde en ESPAÑOL. Tono cercano, sin jerga innecesaria.
2. Personaliza la respuesta con el perfil del usuario cuando sea relevante.
3. Fundamenta tus respuestas en legislación española vigente.
4. Para situaciones complejas, inspecciones, recursos o procedimientos sancionadores:
   SIEMPRE recomienda consultar con un profesional colegiado (asesor, abogado).
5. NUNCA inventes cifras, plazos o normativas. Si no sabes, dilo claramente.
6. Indica el modelo de Hacienda o artículo del Estatuto cuando sea relevante.
7. Termina respuestas delicadas con:
   "ℹ️ Esta es una orientación general. Para tu caso concreto consulta con
   un profesional colegiado."
8. Disclaimer permanente para temas de alto impacto (despidos, sanciones,
   procedimientos judiciales):
   "⚠️ GestorIA ofrece orientación general, no asesoría profesional certificada.
   MolvicStudios no asume responsabilidad por decisiones tomadas a partir de
   estas respuestas."

FORMATO DE RESPUESTAS:
• Usa markdown básico: **negrita**, *cursiva*, \`código\`
• Estructura con encabezados: # Título, ## Subtítulo, ### Detalle
• Listas: - punto, o números 1., 2., 3.
• Separa secciones con líneas en blanco

TONO Y ESTILO:
• Cercano y empático
• Claro sin ser condescendiente
• Eficiente: al grano pero completo
• Respetuoso con la situación del usuario
`;

// ========================================================================
// 2. SUGERENCIAS INICIALES
// ========================================================================

export const SUGERENCIAS = [
  '¿Cuánto pago de autónomo con 2.000€/mes?',
  '¿Qué gastos me puedo deducir trabajando desde casa?',
  '¿Cuánto cobro si me despiden con 5 años en la empresa?',
  '¿Cuándo tengo que presentar el modelo 303?'
];

// ========================================================================
// 3. FUNCIÓN: ENVIAR MENSAJE
// ========================================================================

/**
 * Enviar un mensaje del usuario a la IA
 * @param {string} textoUsuario - Mensaje del usuario
 * @param {Object} conversacion - Conversation object (mutable)
 * @returns {Promise<string>} Respuesta de la IA
 */
export async function enviarMensaje(textoUsuario, conversacion) {
  const email = requireSesion();
  if (!email) throw new Error('No hay sesión activa');

  // Validar input
  if (!textoUsuario || textoUsuario.trim().length === 0) {
    throw new Error('El mensaje no puede estar vacío.');
  }

  if (textoUsuario.length > 2000) {
    throw new Error('El mensaje es demasiado largo (máximo 2000 caracteres).');
  }

  // Obtener perfil del usuario
  const perfil = getPerfil(email);

  // Construir array de mensajes para la IA (últimos 10 para contexto)
  const mensajesContext = conversacion.mensajes.slice(-10).map(m => ({
    role: m.role,
    content: m.content
  }));

  // Preparar system prompt con contexto del perfil
  const systemPromptFinal = SYSTEM_PROMPT.replace(
    '{PERFIL_CONTEXTO}',
    buildContextoPerfil(perfil)
  );

  try {
    // Llamar a la IA
    const respuesta = await llamarIA(systemPromptFinal, textoUsuario, mensajesContext);

    // Agregar mensajes a la conversación
    agregarMensaje(conversacion, 'user', textoUsuario);
    agregarMensaje(conversacion, 'assistant', respuesta);

    // Guardar conversación
    guardarConversacion(email, conversacion);

    // Si es el primer mensaje de la conversación, generar título
    if (conversacion.mensajes.length === 2) {
      generarTituloConversacion(textoUsuario, conversacion, email);
    }

    return respuesta;
  } catch (error) {
    console.error('Error al llamar IA:', error);
    throw new Error(obtenerMensajeError(error));
  }
}

// ========================================================================
// 4. FUNCIÓN: GENERAR TÍTULO AUTOMÁTICO
// ========================================================================

/**
 * Generar título para la conversación basado en el primer mensaje
 * @param {string} primerMensaje - Primer mensaje del usuario
 * @param {Object} conversacion - Conversation object
 * @param {string} email - Email del usuario
 */
async function generarTituloConversacion(primerMensaje, conversacion, email) {
  try {
    const systemPrompt = 'Genera un título corto (máximo 6 palabras) que resuma esta consulta fiscal/laboral. Solo el título, sin comillas ni puntuación al final.';
    
    const titulo = await llamarIA(systemPrompt, primerMensaje, []);
    
    conversacion.titulo = titulo.trim().slice(0, 60);
    guardarConversacion(email, conversacion);
    
    console.log('✅ Título generado:', conversacion.titulo);
  } catch (error) {
    console.error('Error al generar título:', error);
    // No es crítico, continuar sin título
  }
}

// ========================================================================
// 5. FUNCIÓN: PARSEAR MARKDOWN
// ========================================================================

/**
 * Parsear markdown básico a HTML
 * Sin librerías externas — solo transformaciones simples
 * @param {string} texto - Texto con markdown
 * @returns {string} HTML
 */
export function parsearMarkdown(texto) {
  if (!texto) return '';

  return texto
    // Escapar HTML para XSS protection
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    // Negrita **texto**
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    // Cursiva *texto*
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    // Código `texto`
    .replace(/`(.+?)`/g, '<code>$1</code>')
    // Encabezados
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    // Listas
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    .replace(/(<li>.*<\/li>\n?)+/g, '<ul>$&</ul>')
    .replace(/^(\d+)\. (.+)$/gm, '<li>$2</li>')
    // Párrafos (doble salto de línea)
    .replace(/\n\n/g, '</p><p>')
    .replace(/^(?!<[hul]|<li|<\/)(.*)/gm, '$1')
    // Saltos de línea
    .replace(/\n/g, '<br>');
}

// ========================================================================
// 6. RENDERIZADO EN EL DOM
// ========================================================================

/**
 * Renderizar un mensaje en el DOM
 * @param {Object} mensaje - {role, content}
 * @param {HTMLElement} container - Contenedor donde renderizar
 */
export function renderMensaje(mensaje, container) {
  const div = document.createElement('div');
  div.className = `mensaje mensaje-${mensaje.role}`;
  
  if (mensaje.role === 'user') {
    div.innerHTML = `<p>${mensaje.content}</p>`;
  } else {
    // Parsear markdown para asistente
    const html = parsearMarkdown(mensaje.content);
    div.innerHTML = html;
  }
  
  container.appendChild(div);
  // Scroll al último mensaje
  container.scrollTop = container.scrollHeight;
}

/**
 * Mostrar indicador "escribiendo..."
 * @param {HTMLElement} container - Contenedor
 * @returns {HTMLElement} Elemento del indicador (para poder eliminarlo después)
 */
export function mostrarTypingIndicator(container) {
  const div = document.createElement('div');
  div.className = 'mensaje mensaje-assistant typing-indicator';
  div.innerHTML = '<span></span><span></span><span></span>';
  container.appendChild(div);
  container.scrollTop = container.scrollHeight;
  return div;
}

/**
 * Eliminar indicador de escritura
 * @param {HTMLElement} indicator - Elemento devuelto por mostrarTypingIndicator
 */
export function quitarTypingIndicator(indicator) {
  indicator.remove();
}

/**
 * Renderizar error en el chat
 * @param {string} mensaje - Mensaje de error
 * @param {HTMLElement} container - Contenedor
 */
export function renderError(mensaje, container) {
  const div = document.createElement('div');
  div.className = 'alert alert-danger';
  div.textContent = mensaje;
  container.appendChild(div);
  container.scrollTop = container.scrollHeight;
}
