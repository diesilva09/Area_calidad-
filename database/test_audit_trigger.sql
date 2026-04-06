-- =====================================================
-- PRUEBA: Verificar si el trigger funciona correctamente
-- =====================================================

-- 1. Verificar si la tabla field_audit_log existe y tiene datos
SELECT COUNT(*) as total_registros FROM field_audit_log;

-- 2. Verificar los últimos cambios registrados
SELECT 
    field_name,
    old_value,
    new_value,
    changed_by,
    created_at,
    change_type
FROM field_audit_log 
ORDER BY created_at DESC 
LIMIT 10;

-- 3. Verificar si hay cambios en updated_by específicamente
SELECT 
    record_id,
    old_value,
    new_value,
    changed_by,
    created_at
FROM field_audit_log 
WHERE field_name = 'updated_by'
ORDER BY created_at DESC;

-- 4. Verificar si el trigger está activo
SELECT 
    tgname as trigger_name,
    tgrelid::regclass as table_name,
    tgenabled as is_enabled
FROM pg_trigger 
WHERE tgname = 'trigger_production_records_audit';

-- 5. Prueba manual: Actualizar un registro para ver si se registra
-- (Descomenta y ajusta el ID para probar)
-- UPDATE production_records 
-- SET updated_by = 'Test User', observaciones = 'Prueba de auditoría'
-- WHERE id = 'TU_ID_AQUI';

-- 6. Verificar resultado de la prueba
-- SELECT * FROM field_audit_log 
-- WHERE changed_by = 'Test User' 
-- ORDER BY created_at DESC 
-- LIMIT 5;
