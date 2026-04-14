-- ========================================
-- RE-CAL-040: Inspección de Vehículos para Recepción de Materia Prima
-- Script para crear la tabla en PostgreSQL
-- ========================================

-- 0. Crear el esquema si no existe
CREATE SCHEMA IF NOT EXISTS materia_prima;

-- 1. Crear la tabla principal
CREATE TABLE IF NOT EXISTS materia_prima.inspeccion_vehiculo (
    id SERIAL PRIMARY KEY,
    fecha DATE NOT NULL,
    proveedor VARCHAR(255) NOT NULL,
    producto VARCHAR(255) NOT NULL,
    nombre_conductor VARCHAR(255) NOT NULL,
    placa_vehiculo VARCHAR(50) NOT NULL,
    lote_proveedor VARCHAR(100),
    responsable_calidad VARCHAR(255) NOT NULL,
    observaciones TEXT,
    cumplimiento VARCHAR(50),
    tipo_material VARCHAR(255),
    checks BOOLEAN[],
    c BOOLEAN[],
    nc BOOLEAN[],
    na BOOLEAN[],
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Crear índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_inspeccion_vehiculo_fecha ON materia_prima.inspeccion_vehiculo(fecha);
CREATE INDEX IF NOT EXISTS idx_inspeccion_vehiculo_proveedor ON materia_prima.inspeccion_vehiculo(proveedor);
CREATE INDEX IF NOT EXISTS idx_inspeccion_vehiculo_producto ON materia_prima.inspeccion_vehiculo(producto);
CREATE INDEX IF NOT EXISTS idx_inspeccion_vehiculo_placa ON materia_prima.inspeccion_vehiculo(placa_vehiculo);
CREATE INDEX IF NOT EXISTS idx_inspeccion_vehiculo_responsable ON materia_prima.inspeccion_vehiculo(responsable_calidad);
CREATE INDEX IF NOT EXISTS idx_inspeccion_vehiculo_created_at ON materia_prima.inspeccion_vehiculo(created_at);

-- 3. Crear función para actualizar timestamp automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 4. Crear trigger para actualizar updated_at automáticamente
DROP TRIGGER IF EXISTS update_inspeccion_vehiculo_updated_at ON materia_prima.inspeccion_vehiculo;
CREATE TRIGGER update_inspeccion_vehiculo_updated_at 
    BEFORE UPDATE ON materia_prima.inspeccion_vehiculo 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- 5. Insertar datos de ejemplo (opcional)
INSERT INTO materia_prima.inspeccion_vehiculo (
    fecha,
    proveedor,
    producto,
    nombre_conductor,
    placa_vehiculo,
    lote_proveedor,
    responsable_calidad,
    observaciones,
    cumplimiento,
    tipo_material,
    checks,
    c,
    nc,
    na
) VALUES
    (
        '2025-03-10',
        'Transportes Rápidos S.A.',
        'Leche pasteurizada',
        'Juan Pérez',
        'ABC-123',
        'LOT-001',
        'María García',
        'Vehículo en buen estado, sin observaciones',
        'CUMPLE',
        'Lácteos',
        ARRAY[true, true, true, true, true, true, true, true, true, true, true, true, true, true],
        ARRAY[true, true, true, true, true, true, true, true, true, true, true, true, true, true],
        ARRAY[false, false, false, false, false, false, false, false, false, false, false, false, false, false],
        ARRAY[false, false, false, false, false, false, false, false, false, false, false, false, false, false]
    ),
    (
        '2025-03-11',
        'Logística Nacional',
        'Azúcar refinada',
        'Carlos López',
        'XYZ-456',
        'LOT-002',
        'Ana Martínez',
        'Limpieza adecuada del compartimento',
        'CUMPLE',
        'Azucares',
        ARRAY[true, true, true, true, true, true, true, true, true, true, true, true, true, true],
        ARRAY[true, true, true, true, true, true, true, true, true, true, true, true, true, true],
        ARRAY[false, false, false, false, false, false, false, false, false, false, false, false, false, false],
        ARRAY[false, false, false, false, false, false, false, false, false, false, false, false, false, false]
    )
ON CONFLICT DO NOTHING;

-- 6. Agregar comentarios descriptivos
COMMENT ON TABLE materia_prima.inspeccion_vehiculo IS 'RE-CAL-040: Inspección de vehículos para recepción de materia prima';
COMMENT ON COLUMN materia_prima.inspeccion_vehiculo.fecha IS 'Fecha de la inspección del vehículo';
COMMENT ON COLUMN materia_prima.inspeccion_vehiculo.proveedor IS 'Proveedor de la materia prima';
COMMENT ON COLUMN materia_prima.inspeccion_vehiculo.producto IS 'Producto transportado';
COMMENT ON COLUMN materia_prima.inspeccion_vehiculo.nombre_conductor IS 'Nombre del conductor del vehículo';
COMMENT ON COLUMN materia_prima.inspeccion_vehiculo.placa_vehiculo IS 'Placa del vehículo';
COMMENT ON COLUMN materia_prima.inspeccion_vehiculo.lote_proveedor IS 'Número de lote del proveedor';
COMMENT ON COLUMN materia_prima.inspeccion_vehiculo.responsable_calidad IS 'Responsable del área de calidad';
COMMENT ON COLUMN materia_prima.inspeccion_vehiculo.observaciones IS 'Observaciones adicionales';
COMMENT ON COLUMN materia_prima.inspeccion_vehiculo.cumplimiento IS 'Estado de cumplimiento (CUMPLE/NO CUMPLE)';
COMMENT ON COLUMN materia_prima.inspeccion_vehiculo.tipo_material IS 'Tipo de material transportado';
COMMENT ON COLUMN materia_prima.inspeccion_vehiculo.checks IS 'Array de verificaciones (14 items)';
COMMENT ON COLUMN materia_prima.inspeccion_vehiculo.c IS 'Array de conformes (14 items)';
COMMENT ON COLUMN materia_prima.inspeccion_vehiculo.nc IS 'Array de no conformes (14 items)';
COMMENT ON COLUMN materia_prima.inspeccion_vehiculo.na IS 'Array de no aplica (14 items)';

-- 7. Verificación
SELECT 'Tabla materia_prima.inspeccion_vehiculo creada exitosamente' AS status;
SELECT COUNT(*) as registros_ejemplo_creados FROM materia_prima.inspeccion_vehiculo;
