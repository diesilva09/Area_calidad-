-- ========================================
-- RE-CAL-038: Análisis Fisicoquímicos de Materias Primas
-- Script para crear la tabla en PostgreSQL
-- ========================================

-- 0. Crear el esquema si no existe
CREATE SCHEMA IF NOT EXISTS materia_prima;

-- 1. Crear la tabla principal
CREATE TABLE IF NOT EXISTS materia_prima.analisis_fisicoquimico_materia_prima (
    id SERIAL PRIMARY KEY,
    materia_prima VARCHAR(255) NOT NULL,
    fecha_ingreso DATE NOT NULL,
    fecha_analisis DATE NOT NULL,
    proveedor VARCHAR(255) NOT NULL,
    producto VARCHAR(255) NOT NULL,
    fecha_vencimiento DATE,
    lote_interno VARCHAR(100),
    lote_proveedor VARCHAR(100),
    unds_analizar VARCHAR(50),
    l VARCHAR(50),
    brix VARCHAR(50),
    indice_refraccion VARCHAR(50),
    ph VARCHAR(50),
    densidad VARCHAR(50),
    acidez VARCHAR(50),
    neto VARCHAR(50),
    drenado VARCHAR(50),
    sulfitos_soppm VARCHAR(50),
    color VARCHAR(50),
    olor VARCHAR(50),
    sabor VARCHAR(50),
    textura VARCHAR(50),
    oxidacion VARCHAR(50),
    abolladura VARCHAR(50),
    filtracion VARCHAR(50),
    etiqueta VARCHAR(50),
    corrugado VARCHAR(50),
    identificacion_lote VARCHAR(50),
    und_analizar_visual VARCHAR(50),
    und_recibidas VARCHAR(50),
    realizado_por VARCHAR(255) NOT NULL,
    observaciones TEXT,
    verificado_por VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Crear índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_analisis_fisicoquimico_materia_prima_fecha_ingreso ON materia_prima.analisis_fisicoquimico_materia_prima(fecha_ingreso);
CREATE INDEX IF NOT EXISTS idx_analisis_fisicoquimico_materia_prima_fecha_analisis ON materia_prima.analisis_fisicoquimico_materia_prima(fecha_analisis);
CREATE INDEX IF NOT EXISTS idx_analisis_fisicoquimico_materia_prima_proveedor ON materia_prima.analisis_fisicoquimico_materia_prima(proveedor);
CREATE INDEX IF NOT EXISTS idx_analisis_fisicoquimico_materia_prima_producto ON materia_prima.analisis_fisicoquimico_materia_prima(producto);
CREATE INDEX IF NOT EXISTS idx_analisis_fisicoquimico_materia_prima_materia_prima ON materia_prima.analisis_fisicoquimico_materia_prima(materia_prima);
CREATE INDEX IF NOT EXISTS idx_analisis_fisicoquimico_materia_prima_realizado_por ON materia_prima.analisis_fisicoquimico_materia_prima(realizado_por);
CREATE INDEX IF NOT EXISTS idx_analisis_fisicoquimico_materia_prima_created_at ON materia_prima.analisis_fisicoquimico_materia_prima(created_at);

-- 3. Crear función para actualizar timestamp automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 4. Crear trigger para actualizar updated_at automáticamente
DROP TRIGGER IF EXISTS update_analisis_fisicoquimico_materia_prima_updated_at ON materia_prima.analisis_fisicoquimico_materia_prima;
CREATE TRIGGER update_analisis_fisicoquimico_materia_prima_updated_at 
    BEFORE UPDATE ON materia_prima.analisis_fisicoquimico_materia_prima 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- 5. Insertar datos de ejemplo (opcional)
INSERT INTO materia_prima.analisis_fisicoquimico_materia_prima (
    materia_prima,
    fecha_ingreso,
    fecha_analisis,
    proveedor,
    producto,
    ph,
    densidad,
    acidez,
    neto,
    drenado,
    sulfitos_soppm,
    color,
    olor,
    sabor,
    textura,
    oxidacion,
    abolladura,
    filtracion,
    etiqueta,
    corrugado,
    identificacion_lote,
    und_analizar_visual,
    und_recibidas,
    realizado_por,
    observaciones,
    verificado_por
) VALUES
    (
        'Leche entera',
        '2025-03-10',
        '2025-03-10',
        'Lácteos del Valle',
        'Leche pasteurizada 1L',
        '6.7',
        '1.032',
        '0.16',
        '1000',
        'Conforme',
        '10',
        'Blanco',
        'Normal',
        'Normal',
        'Normal',
        'No presente',
        'No presente',
        'Conforme',
        'Conforme',
        'Conforme',
        'Lote-001',
        '5',
        '100',
        'Juan Pérez',
        'Muestra dentro de los parámetros establecidos',
        'María García'
    ),
    (
        'Azúcar blanca',
        '2025-03-11',
        '2025-03-11',
        'Azucarera Central',
        'Azúcar refinada 50kg',
        '7.0',
        '1.59',
        '0.02',
        '50000',
        'Conforme',
        '0',
        'Blanco',
        'Normal',
        'Normal',
        'Normal',
        'No presente',
        'No presente',
        'Conforme',
        'Conforme',
        'Conforme',
        'Lote-002',
        '3',
        '50',
        'Carlos López',
        'Cumple con especificaciones',
        'Ana Martínez'
    )
ON CONFLICT DO NOTHING;

-- 6. Agregar comentarios descriptivos
COMMENT ON TABLE materia_prima.analisis_fisicoquimico_materia_prima IS 'RE-CAL-038: Análisis fisicoquímicos de materias primas';
COMMENT ON COLUMN materia_prima.analisis_fisicoquimico_materia_prima.materia_prima IS 'Tipo de materia prima analizada';
COMMENT ON COLUMN materia_prima.analisis_fisicoquimico_materia_prima.fecha_ingreso IS 'Fecha de ingreso de la materia prima';
COMMENT ON COLUMN materia_prima.analisis_fisicoquimico_materia_prima.fecha_analisis IS 'Fecha del análisis fisicoquímico';
COMMENT ON COLUMN materia_prima.analisis_fisicoquimico_materia_prima.proveedor IS 'Proveedor de la materia prima';
COMMENT ON COLUMN materia_prima.analisis_fisicoquimico_materia_prima.producto IS 'Producto analizado';
COMMENT ON COLUMN materia_prima.analisis_fisicoquimico_materia_prima.ph IS 'Valor de pH';
COMMENT ON COLUMN materia_prima.analisis_fisicoquimico_materia_prima.densidad IS 'Densidad relativa';
COMMENT ON COLUMN materia_prima.analisis_fisicoquimico_materia_prima.acidez IS 'Acidez titulatable';
COMMENT ON COLUMN materia_prima.analisis_fisicoquimico_materia_prima.neto IS 'Peso neto';
COMMENT ON COLUMN materia_prima.analisis_fisicoquimico_materia_prima.drenado IS 'Prueba de drenado';
COMMENT ON COLUMN materia_prima.analisis_fisicoquimico_materia_prima.sulfitos_soppm IS 'Contenido de sulfitos (SO2 ppm)';
COMMENT ON COLUMN materia_prima.analisis_fisicoquimico_materia_prima.color IS 'Evaluación del color';
COMMENT ON COLUMN materia_prima.analisis_fisicoquimico_materia_prima.olor IS 'Evaluación del olor';
COMMENT ON COLUMN materia_prima.analisis_fisicoquimico_materia_prima.sabor IS 'Evaluación del sabor';
COMMENT ON COLUMN materia_prima.analisis_fisicoquimico_materia_prima.textura IS 'Evaluación de la textura';
COMMENT ON COLUMN materia_prima.analisis_fisicoquimico_materia_prima.oxidacion IS 'Prueba de oxidación';
COMMENT ON COLUMN materia_prima.analisis_fisicoquimico_materia_prima.abolladura IS 'Prueba de abolladura (para envases)';
COMMENT ON COLUMN materia_prima.analisis_fisicoquimico_materia_prima.filtracion IS 'Prueba de filtración';
COMMENT ON COLUMN materia_prima.analisis_fisicoquimico_materia_prima.etiqueta IS 'Verificación de etiqueta';
COMMENT ON COLUMN materia_prima.analisis_fisicoquimico_materia_prima.corrugado IS 'Estado del corrugado';
COMMENT ON COLUMN materia_prima.analisis_fisicoquimico_materia_prima.identificacion_lote IS 'Identificación del lote';
COMMENT ON COLUMN materia_prima.analisis_fisicoquimico_materia_prima.und_analizar_visual IS 'Unidades analizadas visualmente';
COMMENT ON COLUMN materia_prima.analisis_fisicoquimico_materia_prima.und_recibidas IS 'Unidades recibidas';
COMMENT ON COLUMN materia_prima.analisis_fisicoquimico_materia_prima.realizado_por IS 'Persona que realizó el análisis';
COMMENT ON COLUMN materia_prima.analisis_fisicoquimico_materia_prima.observaciones IS 'Observaciones adicionales';
COMMENT ON COLUMN materia_prima.analisis_fisicoquimico_materia_prima.verificado_por IS 'Persona que verificó el análisis';

-- 7. Verificación
SELECT 'Tabla materia_prima.analisis_fisicoquimico_materia_prima creada exitosamente' AS status;
SELECT COUNT(*) as registros_ejemplo_creados FROM materia_prima.analisis_fisicoquimico_materia_prima;
