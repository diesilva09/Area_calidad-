-- =====================================================
-- TABLA DE AUDITORÍA DE CAMPOS (FIELD AUDIT LOG)
-- Registra cada cambio individual en los campos de registros
-- =====================================================

-- Eliminar tabla existente si existe
DROP TABLE IF EXISTS field_audit_log CASCADE;

-- Crear tabla de auditoría de campos
CREATE TABLE field_audit_log (
    -- Campos ID y timestamps
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Referencia al registro modificado
    table_name VARCHAR(100) NOT NULL,           -- 'production_records', 'embalaje_records', etc.
    record_id VARCHAR(100) NOT NULL,            -- ID del registro modificado
    field_name VARCHAR(100) NOT NULL,           -- Nombre del campo modificado
    
    -- Valores del cambio
    old_value TEXT,                              -- Valor antes del cambio (puede ser NULL)
    new_value TEXT,                              -- Valor después del cambio (puede ser NULL)
    
    -- Información del cambio
    changed_by VARCHAR(255) NOT NULL,           -- Usuario que realizó el cambio
    change_reason TEXT,                           -- Motivo del cambio (opcional)
    change_type VARCHAR(50) DEFAULT 'UPDATE',     -- Tipo de cambio: INSERT, UPDATE, DELETE
    
    -- Metadatos
    user_role VARCHAR(50),                       -- Rol del usuario que hizo el cambio
    user_email VARCHAR(255),                     -- Email del usuario que hizo el cambio
    session_id VARCHAR(255),                    -- ID de sesión (para tracking)
    ip_address INET,                            -- IP desde donde se hizo el cambio
    
    -- Restricciones
    -- Nota: Se elimina la llave foránea a users(email) porque los usuarios se guardan por nombre, no por email
    -- CONSTRAINT fk_audit_user FOREIGN KEY (changed_by) REFERENCES users(email) ON DELETE SET NULL
);

-- Crear índices para mejor rendimiento
CREATE INDEX idx_field_audit_log_table_record ON field_audit_log(table_name, record_id);
CREATE INDEX idx_field_audit_log_field ON field_audit_log(field_name);
CREATE INDEX idx_field_audit_log_changed_by ON field_audit_log(changed_by);
CREATE INDEX idx_field_audit_log_created_at ON field_audit_log(created_at);
CREATE INDEX idx_field_audit_log_composite ON field_audit_log(table_name, record_id, field_name, created_at);

-- Crear función para registrar cambios automáticamente
CREATE OR REPLACE FUNCTION log_field_change()
RETURNS TRIGGER AS $$
BEGIN
    -- Solo registrar si realmente hay cambios en los campos
    IF TG_OP = 'UPDATE' THEN
        -- Comparar cada campo y registrar cambios individuales
        IF OLD.lote IS DISTINCT FROM NEW.lote THEN
            INSERT INTO field_audit_log (
                table_name, record_id, field_name, old_value, new_value, 
                changed_by, change_type, user_email
            ) VALUES (
                TG_TABLE_NAME, NEW.id::TEXT, 'lote', OLD.lote, NEW.lote,
                NEW.updated_by, 'UPDATE', NEW.updated_by
            );
        END IF;
        
        IF OLD.fechaproduccion IS DISTINCT FROM NEW.fechaproduccion THEN
            INSERT INTO field_audit_log (
                table_name, record_id, field_name, old_value, new_value, 
                changed_by, change_type, user_email
            ) VALUES (
                TG_TABLE_NAME, NEW.id::TEXT, 'fechaproduccion', OLD.fechaproduccion::TEXT, NEW.fechaproduccion::TEXT,
                NEW.updated_by, 'UPDATE', NEW.updated_by
            );
        END IF;
        
        IF OLD.fechavencimiento IS DISTINCT FROM NEW.fechavencimiento THEN
            INSERT INTO field_audit_log (
                table_name, record_id, field_name, old_value, new_value, 
                changed_by, change_type, user_email
            ) VALUES (
                TG_TABLE_NAME, NEW.id::TEXT, 'fechavencimiento', OLD.fechavencimiento::TEXT, NEW.fechavencimiento::TEXT,
                NEW.updated_by, 'UPDATE', NEW.updated_by
            );
        END IF;
        
        IF OLD.producto IS DISTINCT FROM NEW.producto THEN
            INSERT INTO field_audit_log (
                table_name, record_id, field_name, old_value, new_value, 
                changed_by, change_type, user_email
            ) VALUES (
                TG_TABLE_NAME, NEW.id::TEXT, 'producto', OLD.producto, NEW.producto,
                NEW.updated_by, 'UPDATE', NEW.updated_by
            );
        END IF;
        
        IF OLD.status IS DISTINCT FROM NEW.status THEN
            INSERT INTO field_audit_log (
                table_name, record_id, field_name, old_value, new_value, 
                changed_by, change_type, user_email
            ) VALUES (
                TG_TABLE_NAME, NEW.id::TEXT, 'status', OLD.status, NEW.status,
                NEW.updated_by, 'UPDATE', NEW.updated_by
            );
        END IF;
        
        IF OLD.responsable_produccion IS DISTINCT FROM NEW.responsable_produccion THEN
            INSERT INTO field_audit_log (
                table_name, record_id, field_name, old_value, new_value, 
                changed_by, change_type, user_email
            ) VALUES (
                TG_TABLE_NAME, NEW.id::TEXT, 'responsable_produccion', OLD.responsable_produccion, NEW.responsable_produccion,
                NEW.updated_by, 'UPDATE', NEW.updated_by
            );
        END IF;
        
        IF OLD.supervisor_calidad IS DISTINCT FROM NEW.supervisor_calidad THEN
            INSERT INTO field_audit_log (
                table_name, record_id, field_name, old_value, new_value, 
                changed_by, change_type, user_email
            ) VALUES (
                TG_TABLE_NAME, NEW.id::TEXT, 'supervisor_calidad', OLD.supervisor_calidad, NEW.supervisor_calidad,
                NEW.updated_by, 'UPDATE', NEW.updated_by
            );
        END IF;
        
        -- Puedes añadir más campos según necesites
        
    ELSIF TG_OP = 'INSERT' THEN
        -- Registrar creación del registro
        INSERT INTO field_audit_log (
            table_name, record_id, field_name, old_value, new_value, 
            changed_by, change_type, user_email
        ) VALUES (
            TG_TABLE_NAME, NEW.id::TEXT, 'CREATED_RECORD', NULL, 'Registro creado',
            NEW.created_by, 'INSERT', NEW.created_by
        );
        
    ELSIF TG_OP = 'DELETE' THEN
        -- Registro eliminado
        INSERT INTO field_audit_log (
            table_name, record_id, field_name, old_value, new_value, 
            changed_by, change_type, user_email
        ) VALUES (
            TG_TABLE_NAME, OLD.id::TEXT, 'DELETED_RECORD', 'Registro eliminado', NULL,
            OLD.updated_by, 'DELETE', OLD.updated_by
        );
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Crear trigger para production_records
CREATE TRIGGER trigger_production_records_audit
    AFTER INSERT OR UPDATE OR DELETE ON production_records
    FOR EACH ROW
    EXECUTE FUNCTION log_field_change();

-- Comentarios para documentación
COMMENT ON TABLE field_audit_log IS 'Tabla de auditoría que registra cada cambio individual en los campos de los registros';
COMMENT ON COLUMN field_audit_log.id IS 'Identificador único del registro de auditoría';
COMMENT ON COLUMN field_audit_log.table_name IS 'Nombre de la tabla donde se hizo el cambio';
COMMENT ON COLUMN field_audit_log.record_id IS 'ID del registro que fue modificado';
COMMENT ON COLUMN field_audit_log.field_name IS 'Nombre del campo específico que cambió';
COMMENT ON COLUMN field_audit_log.old_value IS 'Valor del campo antes del cambio';
COMMENT ON COLUMN field_audit_log.new_value IS 'Valor del campo después del cambio';
COMMENT ON COLUMN field_audit_log.changed_by IS 'Usuario que realizó el cambio';
COMMENT ON COLUMN field_audit_log.change_reason IS 'Motivo del cambio (opcional)';
COMMENT ON COLUMN field_audit_log.change_type IS 'Tipo de cambio: INSERT, UPDATE, DELETE';
COMMENT ON COLUMN field_audit_log.user_role IS 'Rol del usuario que hizo el cambio';
COMMENT ON COLUMN field_audit_log.user_email IS 'Email del usuario que hizo el cambio';
COMMENT ON COLUMN field_audit_log.session_id IS 'ID de sesión para tracking de cambios';
COMMENT ON COLUMN field_audit_log.ip_address IS 'Dirección IP desde donde se hizo el cambio';

-- Mostrar resultado
SELECT 'Tabla field_audit_log creada exitosamente con trigger automático' AS resultado;
