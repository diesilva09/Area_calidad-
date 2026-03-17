-- ========================================
-- RE-CAL-111: Control Lavado e Inactivación de Material - Laboratorio Microbiología
-- Script para crear la tabla en PostgreSQL
-- ========================================

-- 1. Crear la tabla principal
CREATE TABLE IF NOT EXISTS control_lavado_inactivacion (
    id SERIAL PRIMARY KEY,
    fecha DATE NOT NULL, -- Fecha del proceso de lavado e inactivación
    actividad_realizada VARCHAR(255) NOT NULL, -- Descripción de la actividad realizada
    sustancia_limpieza_nombre VARCHAR(255) NOT NULL, -- Nombre de la sustancia de limpieza
    sustancia_limpieza_cantidad_preparada VARCHAR(50) NOT NULL, -- Cantidad preparada de la sustancia de limpieza (ml)
    sustancia_limpieza_cantidad_sustancia VARCHAR(50) NOT NULL, -- Cantidad de sustancia utilizada (ml)
    sustancia_desinfeccion_1_nombre VARCHAR(255) NOT NULL, -- Nombre de la primera sustancia de desinfección
    sustancia_desinfeccion_1_cantidad_preparada VARCHAR(50) NOT NULL, -- Cantidad preparada de la primera sustancia de desinfección (ml)
    sustancia_desinfeccion_1_cantidad_sustancia VARCHAR(50) NOT NULL, -- Cantidad de la primera sustancia de desinfección (ml)
    sustancia_desinfeccion_2_nombre VARCHAR(255) NOT NULL, -- Nombre de la segunda sustancia de desinfección
    sustancia_desinfeccion_2_cantidad_preparada VARCHAR(50) NOT NULL, -- Cantidad preparada de la segunda sustancia de desinfección (ml)
    sustancia_desinfeccion_2_cantidad_sustancia VARCHAR(50) NOT NULL, -- Cantidad de la segunda sustancia de desinfección (ml)
    realizado_por VARCHAR(255) NOT NULL, -- Nombre completo del responsable
    observaciones TEXT, -- Observaciones adicionales sobre el proceso
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Crear índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_control_lavado_inactivacion_fecha ON control_lavado_inactivacion(fecha);
CREATE INDEX IF NOT EXISTS idx_control_lavado_inactivacion_actividad ON control_lavado_inactivacion(actividad_realizada);
CREATE INDEX IF NOT EXISTS idx_control_lavado_inactivacion_sustancia_limpieza ON control_lavado_inactivacion(sustancia_limpieza_nombre);
CREATE INDEX IF NOT EXISTS idx_control_lavado_inactivacion_sustancia_desinfeccion_1 ON control_lavado_inactivacion(sustancia_desinfeccion_1_nombre);
CREATE INDEX IF NOT EXISTS idx_control_lavado_inactivacion_sustancia_desinfeccion_2 ON control_lavado_inactivacion(sustancia_desinfeccion_2_nombre);
CREATE INDEX IF NOT EXISTS idx_control_lavado_inactivacion_realizado_por ON control_lavado_inactivacion(realizado_por);
CREATE INDEX IF NOT EXISTS idx_control_lavado_inactivacion_created_at ON control_lavado_inactivacion(created_at);

-- 3. Crear función para actualizar timestamp automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 4. Crear trigger para actualizar updated_at automáticamente
DROP TRIGGER IF EXISTS update_control_lavado_inactivacion_updated_at ON control_lavado_inactivacion;
CREATE TRIGGER update_control_lavado_inactivacion_updated_at 
    BEFORE UPDATE ON control_lavado_inactivacion 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- 5. Insertar datos de ejemplo (opcional)
INSERT INTO control_lavado_inactivacion (
    fecha, 
    actividad_realizada, 
    sustancia_limpieza_nombre, 
    sustancia_limpieza_cantidad_preparada, 
    sustancia_limpieza_cantidad_sustancia, 
    sustancia_desinfeccion_1_nombre, 
    sustancia_desinfeccion_1_cantidad_preparada, 
    sustancia_desinfeccion_1_cantidad_sustancia, 
    sustancia_desinfeccion_2_nombre, 
    sustancia_desinfeccion_2_cantidad_preparada, 
    sustancia_desinfeccion_2_cantidad_sustancia, 
    realizado_por, 
    observaciones
) VALUES
    (
        '2024-01-15', 
        'Limpieza de material de vidrio del laboratorio', 
        'Detergente enzimático', 
        '1000', 
        '100', 
        'Alcohol al 70%', 
        '500', 
        '50', 
        'Hipoclorito de sodio al 5%', 
        '250', 
        '25', 
        'Juan David Castañeda Ortiz', 
        'Proceso de limpieza y desinfección completado satisfactoriamente'
    ),
    (
        '2024-01-16', 
        'Desinfección de superficies de trabajo', 
        'Jabón líquido antibacterial', 
        '800', 
        '80', 
        'Peróxido de hidrógeno al 3%', 
        '400', 
        '40', 
        'Glutaraldehído al 2%', 
        '300', 
        '30', 
        'Ana María García López', 
        'Superficies desinfectadas según protocolo'
    ),
    (
        '2024-01-17', 
        'Limpieza de equipos de laboratorio', 
        'Detergente neutro', 
        '1200', 
        '120', 
        'Alcohol isopropílico al 70%', 
        '600', 
        '60', 
        'Clorhexidina al 2%', 
        '350', 
        '35', 
        'Carlos Rodríguez Martínez', 
        'Equipos listos para uso posterior'
    ),
    (
        '2024-01-18', 
        'Inactivación de material contaminado', 
        'Detergente alcalino', 
        '1500', 
        '150', 
        'Alcohol etílico al 70%', 
        '750', 
        '75', 
        'Formaldehído al 4%', 
        '400', 
        '40', 
        'María Fernanda Castro', 
        'Material completamente inactivado'
    ),
    (
        '2024-01-19', 
        'Limpieza de material plástico', 
        'Detergente suave', 
        '900', 
        '90', 
        'Alcohol al 70%', 
        '450', 
        '45', 
        'Hipoclorito de sodio al 2%', 
        '200', 
        '20', 
        'Patricia Morales Díaz', 
        'Material plástico limpio y desinfectado'
    ),
    (
        '2024-01-20', 
        'Desinfección de instrumental metálico', 
        'Detergente industrial', 
        '1100', 
        '110', 
        'Peróxido de hidrógeno al 6%', 
        '550', 
        '55', 
        'Glutaraldehído al 2.5%', 
        '500', 
        '50', 
        'Luis Alberto Torres', 
        'Instrumental metálico procesado correctamente'
    )
ON CONFLICT DO NOTHING;

-- 6. Agregar comentarios descriptivos
COMMENT ON TABLE control_lavado_inactivacion IS 'RE-CAL-111: Control de lavado e inactivación de material - Laboratorio Microbiología';
COMMENT ON COLUMN control_lavado_inactivacion.fecha IS 'Fecha del proceso de lavado e inactivación';
COMMENT ON COLUMN control_lavado_inactivacion.actividad_realizada IS 'Descripción de la actividad realizada';
COMMENT ON COLUMN control_lavado_inactivacion.sustancia_limpieza_nombre IS 'Nombre de la sustancia de limpieza utilizada';
COMMENT ON COLUMN control_lavado_inactivacion.sustancia_limpieza_cantidad_preparada IS 'Cantidad preparada de la sustancia de limpieza en mililitros';
COMMENT ON COLUMN control_lavado_inactivacion.sustancia_limpieza_cantidad_sustancia IS 'Cantidad de sustancia de limpieza utilizada en mililitros';
COMMENT ON COLUMN control_lavado_inactivacion.sustancia_desinfeccion_1_nombre IS 'Nombre de la primera sustancia de desinfección';
COMMENT ON COLUMN control_lavado_inactivacion.sustancia_desinfeccion_1_cantidad_preparada IS 'Cantidad preparada de la primera sustancia de desinfección en mililitros';
COMMENT ON COLUMN control_lavado_inactivacion.sustancia_desinfeccion_1_cantidad_sustancia IS 'Cantidad de la primera sustancia de desinfección utilizada en mililitros';
COMMENT ON COLUMN control_lavado_inactivacion.sustancia_desinfeccion_2_nombre IS 'Nombre de la segunda sustancia de desinfección';
COMMENT ON COLUMN control_lavado_inactivacion.sustancia_desinfeccion_2_cantidad_preparada IS 'Cantidad preparada de la segunda sustancia de desinfección en mililitros';
COMMENT ON COLUMN control_lavado_inactivacion.sustancia_desinfeccion_2_cantidad_sustancia IS 'Cantidad de la segunda sustancia de desinfección utilizada en mililitros';
COMMENT ON COLUMN control_lavado_inactivacion.realizado_por IS 'Nombre completo del responsable del proceso';
COMMENT ON COLUMN control_lavado_inactivacion.observaciones IS 'Observaciones adicionales sobre el proceso de lavado e inactivación';

-- 7. Verificación
SELECT 'Tabla control_lavado_inactivacion creada exitosamente' AS status;
SELECT COUNT(*) as registros_ejemplo_creados FROM control_lavado_inactivacion;
