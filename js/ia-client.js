// js/ia-client.js — Llama a la Pages Function /api/ia, nunca a Groq directamente
import { getSession } from './auth.js';

const IA_PROXY_URL = '/api/ia';

// System prompts por módulo
export const PROMPTS = {
  base: `Eres un asistente fiscal y contable experto en legislación española vigente (marzo 2026). Respondes siempre en español. Eres preciso, claro y directo. Si no estás seguro de algo, lo indicas explícitamente. No inventas datos ni artículos legales.`,

  fiscal: `Eres un asesor fiscal experto en el sistema tributario español para autónomos y pymes. Conoces en profundidad: IRPF (Ley 35/2006), IVA (Ley 37/1992), IS (Ley 27/2014), modelos tributarios (130, 303, 111, 115, 390, 190, 347), plazos de presentación, deducciones estatales y autonómicas, regímenes especiales (estimación directa simplificada, módulos, recargo de equivalencia). Legislación verificada a marzo 2026.`,

  facturacion: `Eres un experto en facturación electrónica y normativa de facturación española. Conoces: Reglamento de facturación (RD 1619/2012), requisitos legales de facturas, numeración correlativa, factura simplificada vs completa, retenciones IRPF en facturas, tipos de IVA aplicables, VERIFACTU (obligatorio desde julio 2027 para autónomos). Ayudas a redactar conceptos profesionales y revisar facturas.`,

  laboral: `Eres un asesor laboral experto en derecho del trabajo español. Conoces: Estatuto de los Trabajadores (RDL 2/2015), cotizaciones a la Seguridad Social 2025-2026, cuota de autónomos (RETA) por tramos de rendimientos, Régimen General (bases, tipos), nóminas, finiquitos, contratos laborales, convenios colectivos, SMI 2025 (1.184 €/mes en 14 pagas). Legislación verificada a marzo 2026.`,

  contratos: `Eres un abogado mercantil y laboral experto en derecho español. Redactas contratos profesionales, claros y legalmente válidos. Tipos que dominas: prestación de servicios, confidencialidad (NDA), laboral indefinido/temporal, arrendamiento, compraventa, acuerdo de socios, burofax. Incluyes cláusulas de protección de datos (RGPD/LOPDGDD) cuando corresponde. Legislación verificada a marzo 2026.`
};

// Contexto CCAA para inyectar en system prompts
export function buildCCAAContext(ccaa) {
  if (!ccaa) return '';
  let ctx = `\n[CONTEXT: El usuario es autónomo/pyme en ${ccaa.nombre}.`;
  if (ccaa.codigo === 'CAN') {
    ctx += ` Aplica el IGIC en lugar del IVA. Tipo general 7%, reducido 3%, cero 0%. Los modelos 303/390 no aplican — se sustituyen por los modelos del IGIC canario.`;
  } else if (ccaa.codigo === 'PVA') {
    ctx += ` Hacienda Foral. TicketBAI obligatorio. IS foral 24%. Diputaciones de Álava, Bizkaia o Gipuzkoa.`;
  } else if (ccaa.codigo === 'NAV') {
    ctx += ` Hacienda foral de Navarra. IS 23%. IPSI en lugar de IVA para ciertas operaciones.`;
  }
  ctx += ` Ten en cuenta las deducciones autonómicas IRPF específicas de ${ccaa.nombre} al calcular el resultado de la declaración de la renta.]`;
  return ctx;
}

export async function askIA({ systemPrompt, userPrompt, modulo = 'general' }) {
  const session = await getSession();
  if (!session) return { success: false, error: 'no_session' };

  try {
    const res = await fetch(IA_PROXY_URL, {
      method: 'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${session.access_token}`
      },
      body: JSON.stringify({ systemPrompt, userPrompt, modulo })
    });

    if (res.status === 429) {
      const data = await res.json();
      return { success: false, error: 'limite_free', message: data.message };
    }

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      return { success: false, error: data.error || 'api_error', message: data.message };
    }

    const data = await res.json();
    return { success: true, content: data.content, provider: data.provider, tokens: data.tokens };

  } catch (e) {
    return { success: false, error: 'network_error', message: 'Sin conexión. Comprueba tu internet.' };
  }
}
