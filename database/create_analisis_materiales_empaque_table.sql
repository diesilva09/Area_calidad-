-- ========================================
-- RE-CAL-062: Análisis de Materiales de Empaque (Envases, Tapas y Embalaje)
-- Script para crear la tabla en PostgreSQL
-- ========================================

-- 0. Crear el esquema si no existe
CREATE SCHEMA IF NOT EXISTS materia_prima;

-- 1. Crear la tabla principal
CREATE TABLE IF NOT EXISTS materia_prima.analisis_materiales_empaque (
    id SERIAL PRIMARY KEY,
    fecha_ingreso DATE NOT NULL,
    fecha_analisis DATE NOT NULL,
    proveedor VARCHAR(255) NOT NULL,
    producto VARCHAR(255) NOT NULL,
    lote_interno VARCHAR(100),
    lote_proveedor VARCHAR(100),
    unidades_analizar VARCHAR(50),
    peso VARCHAR(50),
    hermeticidad VARCHAR(50),
    punto_llenado VARCHAR(50),
    choque_termico VARCHAR(50),
    ajuste_etiqueta VARCHAR(50),
    verificacion_visual VARCHAR(50),
    diametro VARCHAR(50),
    largo VARCHAR(50),
    ancho VARCHAR(50),
    alto VARCHAR(50),
    observaciones TEXT,
    realizado_por VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Crear índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_analisis_materiales_empaque_fecha_ingreso ON materia_prima.analisis_materiales_empaque(fecha_ingreso);
CREATE INDEX IF NOT EXISTS idx_analisis_materiales_empaque_fecha_analisis ON materia_prima.analisis_materiales_empaque(fecha_analisis);
CREATE INDEX IF NOT EXISTS idx_analisis_materiales_empaque_proveedor ON materia_prima.analisis_materiales_empaque(proveedor);
CREATE INDEX IF NOT EXISTS idx_analisis_materiales_empaque_producto ON materia_prima.analisis_materiales_empaque(producto);
CREATE INDEX IF NOT EXISTS idx_analisis_materiales_empaque_lote_interno ON materia_prima.analisis_materiales_empaque(lote_interno);
CREATE INDEX IF NOT EXISTS idx_analisis_materiales_empaque_lote_proveedor ON materia_prima.analisis_materiales_empaque(lote_proveedor);
CREATE INDEX IF NOT EXISTS idx_analisis_materiales_empaque_realizado_por ON materia_prima.analisis_materiales_empaque(realizado_por);
CREATE INDEX IF NOT EXISTS idx_analisis_materiales_empaque_created_at ON materia_prima.analisis_materiales_empaque(created_at);

-- 3. Crear función para actualizar timestamp automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 4. Crear trigger para actualizar updated_at automáticamente
DROP TRIGGER IF EXISTS update_analisis_materiales_empaque_updated_at ON materia_prima.analisis_materiales_empaque;
CREATE TRIGGER update_analisis_materiales_empaque_updated_at 
    BEFORE UPDATE ON materia_prima.analisis_materiales_empaque 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- 5. Insertar datos de ejemplo (opcional)
INSERT INTO materia_prima.analisis_materiales_empaque (
    fecha_ingreso,
    fecha_analisis,
    proveedor,
    producto,
    lote_interno,
    lote_proveedor,
    unidades_analizar,
    peso,
    hermeticidad,
    punto_llenado,
    choque_termico,
    ajuste_etiqueta,
    verificacion_visual,
    diametro,
    largo,
    ancho,
    alto,
    observaciones,
    realizado_por
) VALUES
    (
        '2025-03-10',
        '2025-03-10',
        'Envases Plásticos S.A.',
        'Botella PET 500ml',
        'LOT-INT-001',
        'LOT-PROV-001',
        '10',
        'Conforme',
        'Conforme',
        'Conforme',
        'Conforme',
        'Conforme',
        'Conforme',
        '6.5',
        '22.0',
        '6.5',
        '22.0',
        'Todas las unidades cumplen con especificaciones',
        'Juan Pérez'
    ),
    (
        '2025-03-11',
        '2025-03-11',
        'Tapas Industriales Ltda.',
        'Tapa Rosca 28mm',
        'LOT-INT-002',
        'LOT-PROV-002',
        '15',
        'Conforme',
        'Conforme',
        'Conforme',
        'Conforme',
        'Conforme',
        'Conforme',
        '2.8',
        '1.5',
        '1.5',
        '2.5',
        'Muestra dentro de parámetros normales',
        'María García'
    ),
    (
        '2025-03-12',
        '2025-03-12',
        'Embalajes del Norte',
        'Caja Cartón 30x20x15',
        'LOT-INT-003',
        'LOT-PROV-003',
        '5',
        'Conforme',
        'N/A',
        'N/A',
        'N/A',
        'Conforme',
        'Conforme',
        'N/A',
        '30.0',
        '20.0',
        '15.0',
        'N/A',
        'Cajas en buen estado, sin daños',
        'Carlos López'
    )
ON CONFLICT DO NOTHING;

-- 6. Agregar comentarios descriptivos
COMMENT ON TABLE materia_prima.analisis_materiales_empaque IS 'RE-CAL-062: Análisis de materiales de empaque (envases, tapas y embalaje)';
COMMENT ON COLUMN materia_prima.analisis_materiales_empaque.fecha_ingreso IS 'Fecha de ingreso de los materiales de empaque';
COMMENT ON COLUMN materia_prima.analisis_materiales_empaque.fecha_analisis IS 'Fecha del análisis de materiales de empaque';
COMMENT ON COLUMN materia_prima.analisis_materiales_empaque.proveedor IS 'Proveedor de los materiales de empaque';
COMMENT ON COLUMN materia_prima.analisis_materiales_empaque.producto IS 'Producto analizado (envase, tapa, embalaje)';
COMMENT ON COLUMN materia_prima.analisis_materiales_empaque.lote_interno IS 'Lote interno de la empresa';
COMMENT ON COLUMN materia_prima.analisis_materiales_empaque.lote_proveedor IS 'Lote del proveedor';
COMMENT ON COLUMN materia_prima.analisis_materiales_empaque.unidades_analizar IS 'Cantidad de unidades a analizar';
COMMENT ON COLUMN materia_prima.analisis_materiales_empaque.peso IS 'Prueba de peso';
COMMENT ON COLUMN materia_prima.analisis_materiales_empaque.hermeticidad IS 'Prueba de hermeticidad';
COMMENT ON COLUMN materia_prima.analisis_materiales_empaque.punto_llenado IS 'Prueba de punto de llenado';
COMMENT ON COLUMN materia_prima.analisis_materiales_empaque.choque_termico IS 'Prueba de choque térmico';
COMMENT ON COLUMN materia_prima.analisis_materiales_empaque.ajuste_etiqueta IS 'Ajuste de etiqueta';
COMMENT ON COLUMN materia_prima.analisis_materiales_empaque.verificacion_visual IS 'Verificación visual';
COMMENT ON COLUMN materia_prima.analisis_materiales_empaque.diametro IS 'Diámetro del envase (en cm)';
COMMENT ON COLUMN materia_prima.analisis_materiales_empaque.largo IS 'Largo del envase (en cm)';
COMMENT ON COLUMN materia_prima.analisis_materiales_empaque.ancho IS 'Ancho del envase (en cm)';
COMMENT ON COLUMN materia_prima.analisis_materiales_empaque.alto IS 'Alto del envase (en cm)';
COMMENT ON COLUMN materia_prima.analisis_materiales_empaque.observaciones IS 'Observaciones adicionales';
COMMENT ON COLUMN materia_prima.analisis_materiales_empaque.realizado_por IS 'Persona que realizó el análisis';

-- 7. Verificación
SELECT 'Tabla materia_prima.analisis_materiales_empaque creada exitosamente' AS status;
SELECT COUNT(*) as registros_ejemplo_creados FROM materia_prima.analisis_materiales_empaque;
