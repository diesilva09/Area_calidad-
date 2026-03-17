-- ========================================
-- RE-CAL-100: Registros Recepción de Formatos Diligenciados en Proceso
-- Script para crear la tabla en PostgreSQL
-- ========================================

-- 1. Crear la tabla principal
CREATE TABLE IF NOT EXISTS registros_recepcion_formatos (
    id SERIAL PRIMARY KEY,
    fecha_entrega DATE NOT NULL, -- Fecha de entrega de los formatos
    fecha_registros DATE NOT NULL, -- Fecha de los registros recibidos
    codigo_version_registros VARCHAR(255) NOT NULL, -- Código y versión de los registros
    numero_folios VARCHAR(50) NOT NULL, -- Número de folios recibidos
    nombre_quien_entrega VARCHAR(255) NOT NULL, -- Nombre o firma de quien entrega los formatos
    nombre_quien_recibe VARCHAR(255) NOT NULL, -- Nombre o firma de quien recibe los formatos
    observaciones TEXT, -- Observaciones y/o pendientes
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Crear índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_registros_recepcion_formatos_fecha_entrega ON registros_recepcion_formatos(fecha_entrega);
CREATE INDEX IF NOT EXISTS idx_registros_recepcion_formatos_fecha_registros ON registros_recepcion_formatos(fecha_registros);
CREATE INDEX IF NOT EXISTS idx_registros_recepcion_formatos_codigo_version ON registros_recepcion_formatos(codigo_version_registros);
CREATE INDEX IF NOT EXISTS idx_registros_recepcion_formatos_numero_folios ON registros_recepcion_formatos(numero_folios);
CREATE INDEX IF NOT EXISTS idx_registros_recepcion_formatos_quien_entrega ON registros_recepcion_formatos(nombre_quien_entrega);
CREATE INDEX IF NOT EXISTS idx_registros_recepcion_formatos_quien_recibe ON registros_recepcion_formatos(nombre_quien_recibe);
CREATE INDEX IF NOT EXISTS idx_registros_recepcion_formatos_created_at ON registros_recepcion_formatos(created_at);

-- 3. Crear función para actualizar timestamp automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 4. Crear trigger para actualizar updated_at automáticamente
DROP TRIGGER IF EXISTS update_registros_recepcion_formatos_updated_at ON registros_recepcion_formatos;
CREATE TRIGGER update_registros_recepcion_formatos_updated_at 
    BEFORE UPDATE ON registros_recepcion_formatos 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- 5. Insertar datos de ejemplo (opcional)
INSERT INTO registros_recepcion_formatos (
    fecha_entrega, 
    fecha_registros, 
    codigo_version_registros, 
    numero_folios, 
    nombre_quien_entrega, 
    nombre_quien_recibe, 
    observaciones
) VALUES
    (
        '2024-01-15', 
        '2024-01-15', 
        'RE-CAL-021 V1', 
        '5', 
        'Juan David Castañeda Ortiz', 
        'Ana María García López', 
        'Formatos de condiciones ambientales recibidos completos y en buen estado'
    ),
    (
        '2024-01-16', 
        '2024-01-16', 
        'RE-CAL-016 V2', 
        '8', 
        'Carlos Rodríguez Martínez', 
        'Patricia Morales Díaz', 
        'Pendiente: Revisar firma del jefe de laboratorio'
    ),
    (
        '2024-01-17', 
        '2024-01-17', 
        'RE-CAL-022 V1', 
        '3', 
        'María Fernanda Castro', 
        'Luis Alberto Torres', 
        'Formatos de medios de cultivo con observaciones importantes sobre preparación'
    ),
    (
        '2024-01-18', 
        '2024-01-18', 
        'RE-CAL-017 V1', 
        '6', 
        'Ana María García López', 
        'Juan David Castañeda Ortiz', 
        'Todos los formatos de esterilización en autoclave debidamente diligenciados'
    ),
    (
        '2024-01-19', 
        '2024-01-19', 
        'RE-CAL-107 V1', 
        '4', 
        'Patricia Morales Díaz', 
        'Carlos Rodríguez Martínez', 
        'Formatos de custodia de muestras con datos de cadena de frío completos'
    ),
    (
        '2024-01-20', 
        '2024-01-20', 
        'RE-CAL-089 V1', 
        '7', 
        'Luis Alberto Torres', 
        'María Fernanda Castro', 
        'Registros de control de incubadora con tiempos de incubación correctos'
    ),
    (
        '2024-01-21', 
        '2024-01-21', 
        'RE-CAL-046 V4', 
        '10', 
        'María Fernanda Castro', 
        'Ana María García López', 
        'Resultados microbiológicos con análisis completos y parámetros de referencia'
    ),
    (
        '2024-01-22', 
        '2024-01-22', 
        'RE-CAL-111 V1', 
        '2', 
        'Juan David Castañeda Ortiz', 
        'Patricia Morales Díaz', 
        'Formatos de control de lavado e inactivación con cantidades precisas de sustancias'
    )
ON CONFLICT DO NOTHING;

-- 6. Agregar comentarios descriptivos
COMMENT ON TABLE registros_recepcion_formatos IS 'RE-CAL-100: Registros de recepción de formatos diligenciados en proceso';
COMMENT ON COLUMN registros_recepcion_formatos.fecha_entrega IS 'Fecha de entrega de los formatos';
COMMENT ON COLUMN registros_recepcion_formatos.fecha_registros IS 'Fecha de los registros recibidos';
COMMENT ON COLUMN registros_recepcion_formatos.codigo_version_registros IS 'Código y versión de los registros recibidos';
COMMENT ON COLUMN registros_recepcion_formatos.numero_folios IS 'Número de folios recibidos';
COMMENT ON COLUMN registros_recepcion_formatos.nombre_quien_entrega IS 'Nombre o firma de quien entrega los formatos';
COMMENT ON COLUMN registros_recepcion_formatos.nombre_quien_recibe IS 'Nombre o firma de quien recibe los formatos';
COMMENT ON COLUMN registros_recepcion_formatos.observaciones IS 'Observaciones y/o pendientes sobre la recepción';

-- 7. Verificación
SELECT 'Tabla registros_recepcion_formatos creada exitosamente' AS status;
SELECT COUNT(*) as registros_ejemplo_creados FROM registros_recepcion_formatos;
