-- =====================================================
-- TABLA: AUDITORÍA DETALLADA DE CAMPOS EDITADOS
-- Registra qué campos específicos editó cada usuario
-- =====================================================

CREATE TABLE IF NOT EXISTS audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Información básica
    table_name VARCHAR(100) NOT NULL,           -- 'production_records' o 'embalaje_records'
    record_id UUID NOT NULL,                -- ID del registro afectado
    field_name VARCHAR(100) NOT NULL,          -- Nombre del campo editado
    field_display_name VARCHAR(200),            -- Nombre para mostrar (ej: "Temperatura AM 1")
    
    -- Valores antes y después
    old_value TEXT,                             -- Valor anterior del campo
    new_value TEXT,                             -- Nuevo valor del campo
    
    -- Información de usuario y tiempo
    user_name VARCHAR(255) NOT NULL,           -- Nombre del usuario que hizo el cambio
    user_email VARCHAR(255),                     -- Email del usuario
    action_type VARCHAR(50) NOT NULL,           -- 'CREATE' o 'UPDATE'
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Índices para rendimiento
    INDEX idx_audit_log_table_record (table_name, record_id),
    INDEX idx_audit_log_user (user_name, created_at),
    INDEX idx_audit_log_created_at (created_at)
);

-- Comentarios para documentación
COMMENT ON TABLE audit_log IS 'Registro detallado de cambios por campo y usuario';
COMMENT ON COLUMN audit_log.table_name IS 'Nombre de la tabla afectada (production_records, embalaje_records, etc.)';
COMMENT ON COLUMN audit_log.record_id IS 'ID del registro que fue modificado';
COMMENT ON COLUMN audit_log.field_name IS 'Nombre del campo en la base de datos (snake_case)';
COMMENT ON COLUMN audit_log.field_display_name IS 'Nombre amigable del campo para mostrar en UI';
COMMENT ON COLUMN audit_log.old_value IS 'Valor anterior del campo antes del cambio';
COMMENT ON COLUMN audit_log.new_value IS 'Nuevo valor del campo después del cambio';
COMMENT ON COLUMN audit_log.user_name IS 'Nombre del usuario que realizó la acción';
COMMENT ON COLUMN audit_log.user_email IS 'Email del usuario que realizó la acción';
COMMENT ON COLUMN audit_log.action_type IS 'Tipo de acción: CREATE, UPDATE, DELETE';
COMMENT ON COLUMN audit_log.created_at IS 'Fecha y hora del cambio';
