-- ========================================
-- RE-CAL-021: Condiciones Ambientales Laboratorio de Microbiología
-- Script para crear la tabla en PostgreSQL
-- ========================================

-- 1. Crear la tabla principal
CREATE TABLE IF NOT EXISTS condiciones_ambientales (
    id SERIAL PRIMARY KEY,
    fecha DATE NOT NULL,
    hora VARCHAR(50) NOT NULL,
    temperatura DECIMAL(5,2) NOT NULL,
    humedad_relativa DECIMAL(5,2) NOT NULL,
    responsable VARCHAR(255) NOT NULL,
    observaciones TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Crear índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_condiciones_ambientales_fecha ON condiciones_ambientales(fecha);
CREATE INDEX IF NOT EXISTS idx_condiciones_ambientales_fecha_hora ON condiciones_ambientales(fecha, hora);

-- 3. Crear función para actualizar timestamp automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 4. Crear trigger para actualizar updated_at automáticamente
DROP TRIGGER IF EXISTS update_condiciones_ambientales_updated_at ON condiciones_ambientales;
CREATE TRIGGER update_condiciones_ambientales_updated_at 
    BEFORE UPDATE ON condiciones_ambientales 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- 5. Insertar datos de ejemplo (opcional)
INSERT INTO condiciones_ambientales (fecha, hora, temperatura, humedad_relativa, responsable, observaciones) VALUES
    ('2026-01-12', 'MAÑANA (7-9 AM)', 21.0, 81.0, 'Juan David Castañeda Ortiz', ''),
    ('2026-01-12', 'TARDE (3-5 PM)', 24.0, 69.0, 'Juan David Castañeda Ortiz', ''),
    ('2026-01-13', 'MAÑANA (7-9 AM)', 18.0, 79.0, 'Juan David Castañeda Ortiz', ''),
    ('2026-01-13', 'TARDE (3-5 PM)', 22.0, 75.0, 'Juan David Castañeda Ortiz', '')
ON CONFLICT DO NOTHING;

-- 6. Agregar comentarios descriptivos
COMMENT ON TABLE condiciones_ambientales IS 'RE-CAL-021: Registro de condiciones ambientales del laboratorio de microbiología';
COMMENT ON COLUMN condiciones_ambientales.fecha IS 'Fecha del registro (formato: YYYY-MM-DD)';
COMMENT ON COLUMN condiciones_ambientales.hora IS 'Período del día (MAÑANA (7-9 AM), TARDE (3-5 PM))';
COMMENT ON COLUMN condiciones_ambientales.temperatura IS 'Temperatura en grados Celsius';
COMMENT ON COLUMN condiciones_ambientales.humedad_relativa IS 'Porcentaje de humedad relativa (0-100)';
COMMENT ON COLUMN condiciones_ambientales.responsable IS 'Nombre de la persona responsable del registro';
COMMENT ON COLUMN condiciones_ambientales.observaciones IS 'Notas adicionales sobre el registro';

-- 7. Verificación
SELECT 'Tabla condiciones_ambientales creada exitosamente' AS status;
SELECT COUNT(*) as registros_ejemplo_creados FROM condiciones_ambientales;
