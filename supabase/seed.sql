-- ============================================================
-- GESTORAI.PRO — Datos iniciales (seed)
-- Ejecutar después de schema.sql
-- ============================================================

-- Tipos de contrato disponibles (referencia)
-- Los tipos están definidos como CHECK en la tabla contratos:
-- 'servicios', 'confidencialidad', 'laboral_indefinido',
-- 'laboral_temporal', 'laboral_practicas', 'arrendamiento',
-- 'compraventa', 'colaboracion', 'burofax', 'rgpd'

-- Nota: No se insertan datos de usuario aquí.
-- Los perfiles y suscripciones se crean automáticamente
-- mediante el trigger on_auth_user_created al registrarse.
