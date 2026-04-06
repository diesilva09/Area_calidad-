-- =====================================================
-- SOLUCIÓN: Recrear trigger completamente
-- =====================================================

-- 1. Eliminar todo para empezar de cero
DROP TRIGGER IF EXISTS trigger_production_records_audit ON production_records;
DROP FUNCTION IF EXISTS log_field_change();

-- 2. Crear función simplificada que funcione
CREATE OR REPLACE FUNCTION log_field_change()
RETURNS TRIGGER AS $$
BEGIN
    -- Para INSERT: registrar creación
    IF TG_OP = 'INSERT' THEN
        INSERT INTO field_audit_log (
            table_name, record_id, field_name, old_value, new_value, 
            changed_by, change_type, user_email
        ) VALUES (
            TG_TABLE_NAME, NEW.id::TEXT, 'CREATED_RECORD', NULL, 'Registro creado',
            COALESCE(NEW.created_by, NEW.updated_by, 'Sistema'), 
            'INSERT', 
            COALESCE(NEW.created_by, NEW.updated_by, 'sistema@ejemplo.com')
        );
        
        -- Registrar created_by si existe
        IF NEW.created_by IS NOT NULL THEN
            INSERT INTO field_audit_log (
                table_name, record_id, field_name, old_value, new_value, 
                changed_by, change_type, user_email
            ) VALUES (
                TG_TABLE_NAME, NEW.id::TEXT, 'created_by', NULL, NEW.created_by,
                NEW.created_by, 'INSERT', NEW.created_by
            );
        END IF;
        
        -- Registrar updated_by si existe
        IF NEW.updated_by IS NOT NULL THEN
            INSERT INTO field_audit_log (
                table_name, record_id, field_name, old_value, new_value, 
                changed_by, change_type, user_email
            ) VALUES (
                TG_TABLE_NAME, NEW.id::TEXT, 'updated_by', NULL, NEW.updated_by,
                COALESCE(NEW.created_by, NEW.updated_by, 'Sistema'), 
                'INSERT', 
                COALESCE(NEW.created_by, NEW.updated_by, 'sistema@ejemplo.com')
            );
        END IF;
    
    -- Para UPDATE: registrar cambios específicos
    ELSIF TG_OP = 'UPDATE' THEN
        -- Registrar cambio en updated_by (el más importante)
        IF OLD.updated_by IS DISTINCT FROM NEW.updated_by THEN
            INSERT INTO field_audit_log (
                table_name, record_id, field_name, old_value, new_value, 
                changed_by, change_type, user_email
            ) VALUES (
                TG_TABLE_NAME, NEW.id::TEXT, 'updated_by', OLD.updated_by, NEW.updated_by,
                COALESCE(NEW.updated_by, NEW.created_by, 'Sistema'), 
                'UPDATE', 
                COALESCE(NEW.updated_by, NEW.created_by, 'sistema@ejemplo.com')
            );
        END IF;
        
        -- Registrar otros cambios importantes
        IF OLD.lote IS DISTINCT FROM NEW.lote THEN
            INSERT INTO field_audit_log (
                table_name, record_id, field_name, old_value, new_value, 
                changed_by, change_type, user_email
            ) VALUES (
                TG_TABLE_NAME, NEW.id::TEXT, 'lote', OLD.lote, NEW.lote,
                COALESCE(NEW.updated_by, NEW.created_by, 'Sistema'), 
                'UPDATE', 
                COALESCE(NEW.updated_by, NEW.created_by, 'sistema@ejemplo.com')
            );
        END IF;
        
        IF OLD.observaciones IS DISTINCT FROM NEW.observaciones THEN
            INSERT INTO field_audit_log (
                table_name, record_id, field_name, old_value, new_value, 
                changed_by, change_type, user_email
            ) VALUES (
                TG_TABLE_NAME, NEW.id::TEXT, 'observaciones', OLD.observaciones, NEW.observaciones,
                COALESCE(NEW.updated_by, NEW.created_by, 'Sistema'), 
                'UPDATE', 
                COALESCE(NEW.updated_by, NEW.created_by, 'sistema@ejemplo.com')
            );
        END IF;
    
    -- Para DELETE: registrar eliminación
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO field_audit_log (
            table_name, record_id, field_name, old_value, new_value, 
            changed_by, change_type, user_email
        ) VALUES (
            TG_TABLE_NAME, OLD.id::TEXT, 'DELETED_RECORD', 'Registro eliminado', NULL,
            COALESCE(OLD.updated_by, OLD.created_by, 'Sistema'), 
            'DELETE', 
            COALESCE(OLD.updated_by, OLD.created_by, 'sistema@ejemplo.com')
        );
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- 3. Crear trigger
CREATE TRIGGER trigger_production_records_audit
    AFTER INSERT OR UPDATE OR DELETE ON production_records
    FOR EACH ROW
    EXECUTE FUNCTION log_field_change();

-- 4. Verificar que se creó correctamente
SELECT 
    'Trigger recreado exitosamente' as resultado,
    tgname as trigger_name,
    tgrelid::regclass as table_name,
    tgenabled as is_enabled
FROM pg_trigger 
WHERE tgname = 'trigger_production_records_audit';

-- 5. Prueba inmediata con un ID real (reemplaza con el ID que viste antes)
-- UPDATE production_records 
-- SET updated_by = 'Diego Silva', observaciones = 'Prueba del nuevo trigger'
-- WHERE id = 'REEMPLAZAR_CON_ID_REAL';

-- 6. Verificar resultado
-- SELECT * FROM field_audit_log ORDER BY created_at DESC LIMIT 5;
