-- =====================================================
-- DIAGNÓSTICO: Verificar por qué falla el trigger
-- =====================================================

-- 1. Primero, ver si existen registros en production_records
SELECT 
    id, 
    producto, 
    lote, 
    created_by, 
    updated_by,
    created_at
FROM production_records 
ORDER BY created_at DESC 
LIMIT 5;

-- 2. Verificar si la tabla field_audit_log existe y está vacía
SELECT 
    COUNT(*) as total_registros,
    MIN(created_at) as primer_registro,
    MAX(created_at) as ultimo_registro
FROM field_audit_log;

-- 3. Verificar si el trigger está activo
SELECT 
    tgname as trigger_name,
    tgrelid::regclass as table_name,
    tgenabled as is_enabled,
    tgisinternal as is_internal
FROM pg_trigger 
WHERE tgname = 'trigger_production_records_audit';

-- 4. Verificar la estructura de la tabla production_records
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'production_records' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- 5. Prueba con un registro que sí exista (usando el último de la consulta 1)
-- (Descomenta después de ver el resultado de la consulta 1)
-- UPDATE production_records 
-- SET updated_by = 'Diego Silva', observaciones = 'Prueba de auditoría'
-- WHERE id = 'REEMPLAZAR_CON_ID_REAL';

-- 6. Verificar si hay errores en la función del trigger
SELECT 
    proname as function_name,
    prosrc as source_code
FROM pg_proc 
WHERE proname = 'log_field_change';
