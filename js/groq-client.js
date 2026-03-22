// js/groq-client.js — Motor IA con fallback offline
const GROQ_MODEL = 'llama-3.3-70b-versatile';
const GROQ_API = 'https://api.groq.com/openai/v1/chat/completions';
const LS_KEY = 'gestorai_groq_key';

export function getGroqKey() {
  return localStorage.getItem(LS_KEY);
}

export function setGroqKey(key) {
  localStorage.setItem(LS_KEY, key);
}

// Llamada principal con manejo de errores y fallback
export async function askGroq({ systemPrompt, userPrompt, maxTokens = 1500, temperature = 0.2 }) {
  const apiKey = getGroqKey();

  if (!apiKey) {
    return { success: false, error: 'no_key', fallback: true };
  }

  try {
    const res = await fetch(GROQ_API, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        max_tokens: maxTokens,
        temperature
      })
    });

    // Detectar deprecación de modelo
    if (res.status === 404 || res.status === 400) {
      console.warn('GestorAI: modelo deprecado, activando fallback');
      return { success: false, error: 'model_deprecated', fallback: true };
    }

    if (!res.ok) {
      const err = await res.json();
      return { success: false, error: err.error?.message || 'api_error', fallback: true };
    }

    const data = await res.json();
    return {
      success: true,
      content: data.choices[0]?.message?.content || '',
      tokens: data.usage?.total_tokens || 0
    };

  } catch (e) {
    return { success: false, error: 'network_error', fallback: true };
  }
}

// Contador de consultas diarias (plan Free: máx 5)
export async function checkDailyLimit(supabase, plan) {
  if (plan === 'pro') return { allowed: true, remaining: Infinity };

  const hoy = new Date().toISOString().split('T')[0];
  const { count } = await supabase
    .from('consultas_ia')
    .select('*', { count: 'exact', head: true })
    .eq('fecha', hoy);

  const MAX_FREE = 5;
  return {
    allowed: count < MAX_FREE,
    remaining: MAX_FREE - count,
    total: count
  };
}

export async function registrarConsulta(supabase, modulo, tokens) {
  await supabase.from('consultas_ia').insert({ modulo, tokens_usados: tokens });
}

// System prompts
export const PROMPTS = {
  base: `Eres el asistente legal y fiscal de GestorAI.pro, especializado en la normativa española vigente para autónomos y pymes.

REGLAS ABSOLUTAS:
1. Responde SIEMPRE en español formal pero accesible, sin tecnicismos innecesarios.
2. Cita la normativa específica cuando sea relevante (ley, artículo, fecha).
3. NUNCA des consejos que puedan considerarse evasión fiscal o incumplimiento legal.
4. Siempre recuerda al usuario que tus respuestas son orientativas y no sustituyen al asesor profesional.
5. Si la pregunta está fuera de tu ámbito (fiscal, laboral, contratos mercantiles españoles), indícalo claramente.
6. Cuando menciones plazos, verifica mentalmente que sean los vigentes en 2025-2026.
7. Sé conciso: respuestas de máximo 300 palabras salvo que se solicite un documento completo.

AVISO LEGAL QUE DEBES INCLUIR AL FINAL DE CADA RESPUESTA SOBRE OBLIGACIONES FISCALES O LABORALES:
"⚠️ Esta información es orientativa. Consulta con un gestor colegiado antes de presentar declaraciones oficiales."`,

  fiscal: `Eres el asesor fiscal de GestorAI.pro. Tu especialidad es la fiscalidad española para autónomos y pymes.

NORMATIVA VIGENTE:
- IRPF Modelo 130: Ley 35/2006 + RD 439/2007. Trimestral. 20% sobre rendimiento neto acumulado menos pagos anteriores.
- IVA Modelo 303: Ley 37/1992 + RD 1624/1992. Tipos: 21%, 10%, 4%, 0%. IVA repercutido − IVA soportado.
- Retenciones Modelo 111: profesionales 15% (7% inicio actividad).
- SMI 2025: 1.184 €/mes brutos (14 pagas) — RD 87/2025.
- RETA mínima: 298,60 €/mes. Tarifa plana: 80 €/mes primer año.
- VERIFACTU: autónomos hasta 1 julio 2027.

Cuando calcules, muestra desglose paso a paso con números concretos.

⚠️ Esta información es orientativa. Consulta con un gestor colegiado antes de presentar declaraciones oficiales.`,

  facturacion: `Eres el asistente de facturación de GestorAI.pro. Ayudas a emitir facturas legalmente correctas según la normativa española.

NORMATIVA: RD 1619/2012, Ley 18/2022 (Crea y Crece), VERIFACTU (RD-ley 15/2025).
Campos obligatorios: número/serie correlativa, fecha, datos emisor (nombre, NIF, dirección), datos destinatario, descripción, base imponible, tipo IVA, cuota IVA, retención IRPF si aplica, total.
Tipos IVA 2025: 21% general, 10% reducido, 4% superreducido, 0%, exento.
Retención IRPF: 15% profesionales (7% primeros 3 años). Solo B2B.

Devuelve JSON con estructura de tabla facturas de Supabase cuando generes factura.`,

  laboral: `Eres el asesor laboral de GestorAI.pro. Especialidad: derecho laboral español y nóminas.

NORMATIVA: ET RD Legislativo 2/2015, RD-ley 32/2021 (reforma laboral), SMI 2025: 1.184 €/mes (RD 87/2025).
Contratos: indefinido (regla general), fijo-discontinuo, temporal (solo circunstancias producción o sustitución), formativos.
SS empresa ~30%, SS trabajador ~6,35%. MEI 0,58%+0,12%.

Cálculo nómina: bruto − SS obrero − IRPF = neto. Coste empresa = bruto + SS empresa.

⚠️ Esta información es orientativa. Consulta con un gestor colegiado.`,

  contratos: `Eres el redactor legal de GestorAI.pro. Redactas contratos conformes a la legislación española.

Estructura obligatoria: partes, objeto, duración, precio/pago (máx 60 días B2B Ley 3/2004), obligaciones, confidencialidad, PI, RGPD, resolución, jurisdicción, firmas.

Incluye cláusula RGPD obligatoria si hay tratamiento de datos.
Resalta en [CORCHETES] campos a personalizar.
Nota pie: "Documento generado por GestorAI.pro. Revisar con asesor jurídico antes de firmar."

📝 Este contrato es orientativo. Revísalo con un abogado o gestor colegiado.`
};
