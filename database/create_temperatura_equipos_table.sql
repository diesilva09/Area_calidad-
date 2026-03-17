-- ========================================
-- RE-CAL-016: Registro de Temperatura Equipos de Microbiología
-- Script para crear la tabla en PostgreSQL
-- ========================================

-- 1. Crear la tabla principal
CREATE TABLE IF NOT EXISTS temperatura_equipos (
    id SERIAL PRIMARY KEY,
    fecha INTEGER NOT NULL, -- Formato serial de Excel (ej: 46027, 46030, 46031)
    horario VARCHAR(50) NOT NULL,
    incubadora_037 DECIMAL(5,2) NOT NULL, -- Temperatura incubadora EMD-037 (ej: 31, 30, 32, 34)
    incubadora_038 DECIMAL(5,2) NOT NULL, -- Temperatura incubadora EMD-038 (ej: 24, 22, 23, 25)
    nevera DECIMAL(5,2) NOT NULL, -- Temperatura nevera/refrigerador (ej: 3, 5, 4)
    realizado_por VARCHAR(255) NOT NULL,
    observaciones TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Crear índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_temperatura_equipos_fecha ON temperatura_equipos(fecha);
CREATE INDEX IF NOT EXISTS idx_temperatura_equipos_fecha_horario ON temperatura_equipos(fecha, horario);
CREATE INDEX IF NOT EXISTS idx_temperatura_equipos_realizado_por ON temperatura_equipos(realizado_por);

-- 3. Crear función para actualizar timestamp automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 4. Crear trigger para actualizar updated_at automáticamente
DROP TRIGGER IF EXISTS update_temperatura_equipos_updated_at ON temperatura_equipos;
CREATE TRIGGER update_temperatura_equipos_updated_at 
    BEFORE UPDATE ON temperatura_equipos 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- 5. Insertar datos de ejemplo (opcional)
INSERT INTO temperatura_equipos (fecha, horario, incubadora_037, incubadora_038, nevera, realizado_por, observaciones) VALUES
    (46027, 'MAÑANA (7-9 AM)', 31.0, 24.0, 3.0, 'Juan David Castañeda Ortiz', ''),
    (46027, 'TARDE (3-5 PM)', 32.0, 23.0, 4.0, 'Juan David Castañeda Ortiz', ''),
    (46030, 'MAÑANA (7-9 AM)', 30.0, 25.0, 5.0, 'Juan David Castañeda Ortiz', ''),
    (46030, 'TARDE (3-5 PM)', 34.0, 22.0, 3.0, 'Juan David Castañeda Ortiz', ''),
    (46031, 'MAÑANA (7-9 AM)', 31.5, 24.5, 4.5, 'Juan David Castañeda Ortiz', ''),
    (46031, 'TARDE (3-5 PM)', 33.0, 23.5, 3.5, 'Juan David Castañeda Ortiz', '')
ON CONFLICT DO NOTHING;

-- 6. Agregar comentarios descriptivos
COMMENT ON TABLE temperatura_equipos IS 'RE-CAL-016: Registro de temperatura equipos de microbiología';
COMMENT ON COLUMN temperatura_equipos.fecha IS 'Fecha del registro (formato serial de Excel, ej: 46027, 46030, 46031)';
COMMENT ON COLUMN temperatura_equipos.horario IS 'Período del día (MAÑANA (7-9 AM), TARDE (3-5 PM))';
COMMENT ON COLUMN temperatura_equipos.incubadora_037 IS 'Temperatura registrada en la incubadora EMD-037 (ej: 31, 30, 32, 34)';
COMMENT ON COLUMN temperatura_equipos.incubadora_038 IS 'Temperatura registrada en la incubadora EMD-038 (ej: 24, 22, 23, 25)';
COMMENT ON COLUMN temperatura_equipos.nevera IS 'Temperatura registrada en la nevera/refrigerador (ej: 3, 5, 4)';
COMMENT ON COLUMN temperatura_equipos.realizado_por IS 'Nombre completo de la persona que realiza el registro';
COMMENT ON COLUMN temperatura_equipos.observaciones IS 'Espacio para notas adicionales';

-- 7. Verificación
SELECT 'Tabla temperatura_equipos creada exitosamente' AS status;
SELECT COUNT(*) as registros_ejemplo_creados FROM temperatura_equipos;
