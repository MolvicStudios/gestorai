-- ============================================================
-- GESTORAI.PRO — Schema Supabase PostgreSQL
-- Ejecutar en: Supabase Dashboard > SQL Editor
-- ============================================================

-- Extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- TABLA: profiles
-- Extiende auth.users con datos del negocio
-- ============================================================
CREATE TABLE public.profiles (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  plan          TEXT NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'pro')),
  nombre        TEXT,
  empresa       TEXT,
  nif           TEXT,
  direccion     TEXT,
  codigo_postal TEXT,
  ciudad        TEXT,
  telefono      TEXT,
  regimen_iva   TEXT DEFAULT 'general' CHECK (regimen_iva IN ('general', 'simplificado', 'recargo', 'exento')),
  regimen_irpf  TEXT DEFAULT 'estimacion_directa' CHECK (regimen_irpf IN ('estimacion_directa', 'modulos')),
  tipo_actividad TEXT,  -- epígrafe IAE
  groq_key_hint TEXT,  -- primeros 8 chars de la key (seguridad UX)
  stripe_customer_id TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- RLS profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Usuario ve solo su perfil"
  ON public.profiles FOR ALL
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- ============================================================
-- TABLA: facturas
-- ============================================================
CREATE TABLE public.facturas (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  numero        TEXT NOT NULL,        -- Ej: F-2025-001
  serie         TEXT DEFAULT 'F',
  fecha         DATE NOT NULL DEFAULT CURRENT_DATE,
  fecha_vencimiento DATE,
  -- Datos cliente
  cliente_nombre TEXT NOT NULL,
  cliente_nif    TEXT,
  cliente_email  TEXT,
  cliente_direccion TEXT,
  -- Líneas de factura (JSON array)
  lineas         JSONB NOT NULL DEFAULT '[]',
  -- Totales calculados
  base_imponible NUMERIC(10,2) NOT NULL DEFAULT 0,
  tipo_iva       NUMERIC(5,2) DEFAULT 21,
  cuota_iva      NUMERIC(10,2) DEFAULT 0,
  tipo_irpf      NUMERIC(5,2) DEFAULT 0,
  cuota_irpf     NUMERIC(10,2) DEFAULT 0,
  total          NUMERIC(10,2) NOT NULL DEFAULT 0,
  -- Estado y metadata
  estado         TEXT DEFAULT 'emitida' CHECK (estado IN ('borrador', 'emitida', 'pagada', 'anulada')),
  notas          TEXT,
  pdf_url        TEXT,
  es_rectificativa BOOLEAN DEFAULT FALSE,
  factura_origen_id UUID REFERENCES public.facturas(id),
  verifactu_hash TEXT,  -- Preparado para VERIFACTU (obligatorio julio 2027)
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  updated_at     TIMESTAMPTZ DEFAULT NOW()
);

-- RLS facturas
ALTER TABLE public.facturas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Usuario gestiona sus facturas"
  ON public.facturas FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Índices facturas
CREATE INDEX idx_facturas_user_id ON public.facturas(user_id);
CREATE INDEX idx_facturas_fecha ON public.facturas(fecha);
CREATE INDEX idx_facturas_estado ON public.facturas(estado);

-- ============================================================
-- TABLA: modelos_fiscales
-- Almacena las declaraciones trimestrales
-- ============================================================
CREATE TABLE public.modelos_fiscales (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  modelo        TEXT NOT NULL CHECK (modelo IN ('130', '303', '111', '115', '390', '190', '347')),
  ejercicio     INTEGER NOT NULL,   -- Año: 2025
  periodo       TEXT NOT NULL,      -- '1T', '2T', '3T', '4T' o '01'..'12' (mensual)
  -- Datos del modelo (JSON flexible por tipo)
  datos         JSONB NOT NULL DEFAULT '{}',
  -- Resultado
  resultado     NUMERIC(10,2),      -- positivo=a pagar, negativo=a devolver/compensar
  estado        TEXT DEFAULT 'borrador' CHECK (estado IN ('borrador', 'calculado', 'presentado')),
  fecha_presentacion DATE,
  pdf_url       TEXT,
  notas         TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, modelo, ejercicio, periodo)
);

-- RLS modelos_fiscales
ALTER TABLE public.modelos_fiscales ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Usuario gestiona sus modelos fiscales"
  ON public.modelos_fiscales FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- TABLA: contratos
-- ============================================================
CREATE TABLE public.contratos (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tipo          TEXT NOT NULL CHECK (tipo IN (
    'servicios', 'confidencialidad', 'laboral_indefinido',
    'laboral_temporal', 'laboral_practicas', 'arrendamiento',
    'compraventa', 'colaboracion', 'burofax', 'rgpd'
  )),
  titulo        TEXT NOT NULL,
  partes        JSONB NOT NULL DEFAULT '{}',  -- {parte_a: {...}, parte_b: {...}}
  contenido     TEXT,                          -- HTML generado por IA
  estado        TEXT DEFAULT 'borrador' CHECK (estado IN ('borrador', 'finalizado', 'firmado')),
  pdf_url       TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- RLS contratos
ALTER TABLE public.contratos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Usuario gestiona sus contratos"
  ON public.contratos FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- TABLA: empleados
-- ============================================================
CREATE TABLE public.empleados (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id        UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nombre         TEXT NOT NULL,
  nif            TEXT,
  num_afiliacion TEXT,              -- Número SS
  categoria      TEXT,
  grupo_cotizacion INTEGER,         -- 1-11 según tabla SS
  tipo_contrato  TEXT,
  fecha_alta     DATE,
  fecha_baja     DATE,
  salario_bruto  NUMERIC(10,2),
  activo         BOOLEAN DEFAULT TRUE,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

-- RLS empleados
ALTER TABLE public.empleados ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Usuario gestiona sus empleados"
  ON public.empleados FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- TABLA: nominas
-- ============================================================
CREATE TABLE public.nominas (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id          UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  empleado_id      UUID NOT NULL REFERENCES public.empleados(id) ON DELETE CASCADE,
  mes              INTEGER NOT NULL CHECK (mes BETWEEN 1 AND 14),  -- 13=extra jun, 14=extra dic
  ejercicio        INTEGER NOT NULL,
  -- Devengos
  salario_base     NUMERIC(10,2) DEFAULT 0,
  complementos     NUMERIC(10,2) DEFAULT 0,
  horas_extra      NUMERIC(10,2) DEFAULT 0,
  bruto_total      NUMERIC(10,2) DEFAULT 0,
  -- Deducciones
  cotizacion_ss    NUMERIC(10,2) DEFAULT 0,   -- cuota obrero
  retencion_irpf   NUMERIC(10,2) DEFAULT 0,
  otras_deducciones NUMERIC(10,2) DEFAULT 0,
  -- Resultado
  neto             NUMERIC(10,2) DEFAULT 0,
  -- Cuotas empresa
  ss_empresa       NUMERIC(10,2) DEFAULT 0,
  coste_total_empresa NUMERIC(10,2) DEFAULT 0,
  -- Meta
  pdf_url          TEXT,
  estado           TEXT DEFAULT 'borrador' CHECK (estado IN ('borrador', 'confirmada', 'pagada')),
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- RLS nominas
ALTER TABLE public.nominas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Usuario gestiona sus nominas"
  ON public.nominas FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- TABLA: subscriptions
-- Sincronizada con Stripe Webhooks
-- ============================================================
CREATE TABLE public.subscriptions (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id             UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_subscription_id TEXT UNIQUE,
  stripe_price_id     TEXT,
  plan                TEXT NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'pro')),
  status              TEXT DEFAULT 'active' CHECK (status IN ('active', 'canceled', 'past_due', 'trialing')),
  current_period_start TIMESTAMPTZ,
  current_period_end  TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

-- RLS subscriptions
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Usuario ve solo su suscripción"
  ON public.subscriptions FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- TABLA: consultas_ia
-- Contador de uso IA para control Free (5/día)
-- ============================================================
CREATE TABLE public.consultas_ia (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  modulo     TEXT,           -- 'fiscal', 'laboral', 'contratos', 'general'
  tokens_usados INTEGER DEFAULT 0,
  fecha      DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS consultas_ia
ALTER TABLE public.consultas_ia ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Usuario ve sus consultas"
  ON public.consultas_ia FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Índice para control diario
CREATE INDEX idx_consultas_ia_user_fecha ON public.consultas_ia(user_id, fecha);

-- ============================================================
-- FUNCIÓN: auto-crear profile al registrarse
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, plan)
  VALUES (NEW.id, 'free');

  INSERT INTO public.subscriptions (user_id, plan, status)
  VALUES (NEW.id, 'free', 'active');

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- FUNCIÓN: actualizar updated_at automáticamente
-- ============================================================
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_facturas_updated_at
  BEFORE UPDATE ON public.facturas
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_contratos_updated_at
  BEFORE UPDATE ON public.contratos
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ============================================================
-- VISTA: resumen_usuario
-- Datos combinados del dashboard (sin exponer datos de otros)
-- ============================================================
CREATE OR REPLACE VIEW public.resumen_usuario AS
SELECT
  p.id,
  p.plan,
  p.nombre,
  p.empresa,
  p.nif,
  s.status AS subscription_status,
  s.current_period_end,
  (SELECT COUNT(*) FROM public.facturas f WHERE f.user_id = p.id AND f.estado != 'anulada') AS total_facturas,
  (SELECT COALESCE(SUM(total), 0) FROM public.facturas f WHERE f.user_id = p.id AND f.estado = 'pagada' AND EXTRACT(YEAR FROM fecha) = EXTRACT(YEAR FROM NOW())) AS facturado_anio,
  (SELECT COUNT(*) FROM public.consultas_ia c WHERE c.user_id = p.id AND c.fecha = CURRENT_DATE) AS consultas_ia_hoy
FROM public.profiles p
LEFT JOIN public.subscriptions s ON s.user_id = p.id;

-- Política de seguridad para la vista
ALTER VIEW public.resumen_usuario OWNER TO postgres;
