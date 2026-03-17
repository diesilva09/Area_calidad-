-- ========================================
-- RE-CAL-017: Registro de Proceso de Esterilización en Autoclave Microbiología
-- Script para crear la tabla en PostgreSQL
-- ========================================

-- 1. Crear la tabla principal
CREATE TABLE IF NOT EXISTS esterilizacion_autoclave (
    id SERIAL PRIMARY KEY,
    fecha DATE NOT NULL, -- Fecha del proceso de esterilización
    elementos_medios_cultivo VARCHAR(500) NOT NULL, -- Elementos o medios de cultivo a esterilizar
    inicio_ciclo_hora TIME NOT NULL, -- Hora de inicio del ciclo completo
    inicio_proceso_hora TIME NOT NULL, -- Hora de inicio del proceso de esterilización
    inicio_proceso_tc DECIMAL(5,2) NOT NULL, -- Temperatura inicial (°C)
    inicio_proceso_presion DECIMAL(5,2) NOT NULL, -- Presión inicial (psi)
    fin_proceso_hora TIME NOT NULL, -- Hora de fin del proceso de esterilización
    fin_proceso_tc DECIMAL(5,2) NOT NULL, -- Temperatura final (°C)
    fin_proceso_presion DECIMAL(5,2) NOT NULL, -- Presión final (psi)
    fin_ciclo_hora TIME NOT NULL, -- Hora de fin del ciclo completo
    cinta_indicadora VARCHAR(255) NOT NULL, -- Cinta indicadora utilizada
    realizado_por VARCHAR(255) NOT NULL, -- Nombre de la persona que realizó el proceso
    observaciones TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Crear índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_esterilizacion_autoclave_fecha ON esterilizacion_autoclave(fecha);
CREATE INDEX IF NOT EXISTS idx_esterilizacion_autoclave_elementos ON esterilizacion_autoclave(elementos_medios_cultivo);
CREATE INDEX IF NOT EXISTS idx_esterilizacion_autoclave_cinta ON esterilizacion_autoclave(cinta_indicadora);
CREATE INDEX IF NOT EXISTS idx_esterilizacion_autoclave_realizado_por ON esterilizacion_autoclave(realizado_por);

-- 3. Crear función para actualizar timestamp automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 4. Crear trigger para actualizar updated_at automáticamente
DROP TRIGGER IF EXISTS update_esterilizacion_autoclave_updated_at ON esterilizacion_autoclave;
CREATE TRIGGER update_esterilizacion_autoclave_updated_at 
    BEFORE UPDATE ON esterilizacion_autoclave 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- 5. Insertar datos de ejemplo (opcional)
INSERT INTO esterilizacion_autoclave (
    fecha, 
    elementos_medios_cultivo, 
    inicio_ciclo_hora, 
    inicio_proceso_hora, 
    inicio_proceso_tc, 
    inicio_proceso_presion, 
    fin_proceso_hora, 
    fin_proceso_tc, 
    fin_proceso_presion, 
    fin_ciclo_hora, 
    cinta_indicadora, 
    realizado_por, 
    observaciones
) VALUES
    (
        '2024-01-15', 
        'Medios TSA, McConkey, SSA para control de calidad', 
        '08:00:00', 
        '08:05:00', 
        121.0, 
        15.0, 
        '09:20:00', 
        121.0, 
        15.0, 
        '09:35:00', 
        '3M Comply 121°C 15min', 
        'Juan David Castañeda Ortiz', 
        'Proceso de esterilización rutinario diario'
    ),
    (
        '2024-01-16', 
        'Material de laboratorio, pipetas, placas Petri', 
        '14:00:00', 
        '14:03:00', 
        121.0, 
        15.0, 
        '15:18:00', 
        121.0, 
        15.0, 
        '15:33:00', 
        'Sterigage 121°C 15min', 
        'Ana María García López', 
        'Esterilización de material nuevo'
    ),
    (
        '2024-01-17', 
        'Medios selectivos para microbiología', 
        '08:30:00', 
        '08:32:00', 
        121.0, 
        15.0, 
        '09:47:00', 
        121.0, 
        15.0, 
        '10:02:00', 
        '3M Comply 121°C 15min', 
        'Carlos Rodríguez Martínez', 
        'Verificación de cintas indicadoras'
    ),
    (
        '2024-01-18', 
        'Equipos pequeños, pinzas, tijeras', 
        '15:15:00', 
        '15:17:00', 
        121.0, 
        15.0, 
        '16:32:00', 
        121.0, 
        15.0, 
        '16:47:00', 
        'Sterigage 121°C 15min', 
        'María Fernanda Castro', 
        'Esterilización de instrumentos quirúrgicos'
    ),
    (
        '2024-01-19', 
        'Medios para hongos y levaduras', 
        '09:00:00', 
        '09:02:00', 
        121.0, 
        15.0, 
        '10:17:00', 
        121.0, 
        15.0, 
        '10:32:00', 
        '3M Comply 121°C 15min', 
        'Luis Alberto Torres', 
        'Control de calidad de medios específicos'
    ),
    (
        '2024-01-20', 
        'Material de vidrio, tubos de ensayo', 
        '13:45:00', 
        '13:47:00', 
        121.0, 
        15.0, 
        '15:02:00', 
        121.0, 
        15.0, 
        '15:17:00', 
        'Sterigage 121°C 15min', 
        'Patricia Morales Díaz', 
        'Esterilización de material de vidrio nuevo'
    )
ON CONFLICT DO NOTHING;

-- 6. Agregar comentarios descriptivos
COMMENT ON TABLE esterilizacion_autoclave IS 'RE-CAL-017: Registro de proceso de esterilización en autoclave microbiología';
COMMENT ON COLUMN esterilizacion_autoclave.fecha IS 'Fecha del proceso de esterilización';
COMMENT ON COLUMN esterilizacion_autoclave.elementos_medios_cultivo IS 'Descripción de los elementos o medios de cultivo a esterilizar';
COMMENT ON COLUMN esterilizacion_autoclave.inicio_ciclo_hora IS 'Hora de inicio del ciclo completo de esterilización';
COMMENT ON COLUMN esterilizacion_autoclave.inicio_proceso_hora IS 'Hora de inicio del proceso de esterilización';
COMMENT ON COLUMN esterilizacion_autoclave.inicio_proceso_tc IS 'Temperatura al inicio del proceso de esterilización en grados Celsius';
COMMENT ON COLUMN esterilizacion_autoclave.inicio_proceso_presion IS 'Presión al inicio del proceso de esterilización en libras por pulgada cuadrada (psi)';
COMMENT ON COLUMN esterilizacion_autoclave.fin_proceso_hora IS 'Hora de fin del proceso de esterilización';
COMMENT ON COLUMN esterilizacion_autoclave.fin_proceso_tc IS 'Temperatura al final del proceso de esterilización en grados Celsius';
COMMENT ON COLUMN esterilizacion_autoclave.fin_proceso_presion IS 'Presión al final del proceso de esterilización en libras por pulgada cuadrada (psi)';
COMMENT ON COLUMN esterilizacion_autoclave.fin_ciclo_hora IS 'Hora de fin del ciclo completo de esterilización';
COMMENT ON COLUMN esterilizacion_autoclave.cinta_indicadora IS 'Tipo de cinta indicadora utilizada para verificar el proceso';
COMMENT ON COLUMN esterilizacion_autoclave.realizado_por IS 'Nombre completo de la persona que realizó el proceso de esterilización';
COMMENT ON COLUMN esterilizacion_autoclave.observaciones IS 'Notas adicionales sobre el proceso de esterilización';

-- 7. Verificación
SELECT 'Tabla esterilizacion_autoclave creada exitosamente' AS status;
SELECT COUNT(*) as registros_ejemplo_creados FROM esterilizacion_autoclave;
