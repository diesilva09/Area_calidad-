-- ========================================
-- RE-CAL-107: Registro y Cadena de Custodia de Muestras Análisis Interno
-- Script para crear la tabla en PostgreSQL
-- ========================================

-- 1. Crear la tabla principal
CREATE TABLE IF NOT EXISTS custodia_muestras (
    id SERIAL PRIMARY KEY,
    codigo VARCHAR(50) NOT NULL, -- Código único de la muestra
    tipo VARCHAR(100) NOT NULL, -- Tipo de muestra (Agua, Alimento, Superficie, etc.)
    muestra_id VARCHAR(100) NOT NULL, -- ID único de la muestra
    area VARCHAR(100) NOT NULL, -- Área de donde se tomó la muestra
    temperatura VARCHAR(50) NOT NULL, -- Temperatura de la muestra al tomarla
    cantidad VARCHAR(100) NOT NULL, -- Cantidad de la muestra (100 ml, 500 g, etc.)
    motivo TEXT NOT NULL, -- Motivo del análisis
    tipo_analisis_sl VARCHAR(10), -- Tipo de análisis: Salmonella
    tipo_analisis_bc VARCHAR(10), -- Tipo de análisis: Bacillus cereus
    tipo_analisis_ym VARCHAR(10), -- Tipo de análisis: Mohos y Levaduras
    tipo_analisis_tc VARCHAR(10), -- Tipo de análisis: Coliformes Totales
    tipo_analisis_ec VARCHAR(10), -- Tipo de análisis: E. coli
    tipo_analisis_ls VARCHAR(10), -- Tipo de análisis: Listeria
    tipo_analisis_etb VARCHAR(10), -- Tipo de análisis: E. coli O157:H7
    tipo_analisis_xsa VARCHAR(10), -- Tipo de análisis: Staphylococcus aureus
    toma_muestra_fecha DATE NOT NULL, -- Fecha de toma de muestra
    toma_muestra_hora TIME NOT NULL, -- Hora de toma de muestra
    recepcion_lab_fecha DATE NOT NULL, -- Fecha de recepción en laboratorio
    recepcion_lab_hora TIME NOT NULL, -- Hora de recepción en laboratorio
    medio_transporte VARCHAR(255) NOT NULL, -- Medio de transporte utilizado
    responsable VARCHAR(255) NOT NULL, -- Nombre del responsable
    observaciones TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Crear índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_custodia_muestras_codigo ON custodia_muestras(codigo);
CREATE INDEX IF NOT EXISTS idx_custodia_muestras_muestra_id ON custodia_muestras(muestra_id);
CREATE INDEX IF NOT EXISTS idx_custodia_muestras_area ON custodia_muestras(area);
CREATE INDEX IF NOT EXISTS idx_custodia_muestras_tipo ON custodia_muestras(tipo);
CREATE INDEX IF NOT EXISTS idx_custodia_muestras_toma_fecha ON custodia_muestras(toma_muestra_fecha);
CREATE INDEX IF NOT EXISTS idx_custodia_muestras_recepcion_fecha ON custodia_muestras(recepcion_lab_fecha);
CREATE INDEX IF NOT EXISTS idx_custodia_muestras_responsable ON custodia_muestras(responsable);

-- Índices para tipos de análisis
CREATE INDEX IF NOT EXISTS idx_custodia_muestras_sl ON custodia_muestras(tipo_analisis_sl);
CREATE INDEX IF NOT EXISTS idx_custodia_muestras_bc ON custodia_muestras(tipo_analisis_bc);
CREATE INDEX IF NOT EXISTS idx_custodia_muestras_ym ON custodia_muestras(tipo_analisis_ym);
CREATE INDEX IF NOT EXISTS idx_custodia_muestras_tc ON custodia_muestras(tipo_analisis_tc);
CREATE INDEX IF NOT EXISTS idx_custodia_muestras_ec ON custodia_muestras(tipo_analisis_ec);
CREATE INDEX IF NOT EXISTS idx_custodia_muestras_ls ON custodia_muestras(tipo_analisis_ls);
CREATE INDEX IF NOT EXISTS idx_custodia_muestras_etb ON custodia_muestras(tipo_analisis_etb);
CREATE INDEX IF NOT EXISTS idx_custodia_muestras_xsa ON custodia_muestras(tipo_analisis_xsa);

-- 3. Crear función para actualizar timestamp automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 4. Crear trigger para actualizar updated_at automáticamente
DROP TRIGGER IF EXISTS update_custodia_muestras_updated_at ON custodia_muestras;
CREATE TRIGGER update_custodia_muestras_updated_at 
    BEFORE UPDATE ON custodia_muestras 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- 5. Insertar datos de ejemplo (opcional)
INSERT INTO custodia_muestras (
    codigo, 
    tipo, 
    muestra_id, 
    area, 
    temperatura, 
    cantidad, 
    motivo, 
    tipo_analisis_sl, 
    tipo_analisis_bc, 
    tipo_analisis_ym, 
    tipo_analisis_tc, 
    tipo_analisis_ec, 
    tipo_analisis_ls, 
    tipo_analisis_etb, 
    tipo_analisis_xsa,
    toma_muestra_fecha, 
    toma_muestra_hora, 
    recepcion_lab_fecha, 
    recepcion_lab_hora, 
    medio_transporte, 
    responsable, 
    observaciones
) VALUES
    (
        'M-001', 
        'Agua', 
        'AGUA-001-2024', 
        'Producción', 
        '4°C', 
        '500 ml', 
        'Control de calidad de agua de proceso', 
        'SL', 
        NULL, 
        NULL, 
        'TC', 
        'EC', 
        NULL, 
        NULL, 
        NULL,
        '2024-01-15', 
        '08:30:00', 
        '2024-01-15', 
        '09:15:00', 
        'Bolsa térmica con hielo', 
        'Juan David Castañeda Ortiz', 
        'Muestra tomada de punto de control de agua'
    ),
    (
        'M-002', 
        'Alimento', 
        'ALIM-002-2024', 
        'Empaque', 
        '25°C', 
        '250 g', 
        'Análisis de rutina de producto terminado', 
        NULL, 
        'BC', 
        'YM', 
        NULL, 
        NULL, 
        'LS', 
        'XSA',
        '2024-01-16', 
        '10:45:00', 
        '2024-01-16', 
        '11:30:00', 
        'Nevera portátil', 
        'Ana María García López', 
        'Producto de línea de empaque listo para análisis'
    ),
    (
        'M-003', 
        'Superficie', 
        'SUP-003-2024', 
        'Bodega', 
        '22°C', 
        '1 unidad', 
        'Verificación de limpieza de superficies', 
        'SL', 
        NULL, 
        NULL, 
        'TC', 
        'EC', 
        NULL, 
        'ETB', 
        NULL,
        '2024-01-17', 
        '14:20:00', 
        '2024-01-17', 
        '15:00:00', 
        'Hisopado en medio de transporte', 
        'Carlos Rodríguez Martínez', 
        'Superficie de mesa de trabajo en área de producción'
    ),
    (
        'M-004', 
        'Agua', 
        'AGUA-004-2024', 
        'Producción', 
        '4°C', 
        '1000 ml', 
        'Validación de sistema de tratamiento de agua', 
        NULL, 
        NULL, 
        'YM', 
        NULL, 
        NULL, 
        NULL, 
        NULL,
        '2024-01-18', 
        '06:00:00', 
        '2024-01-18', 
        '06:45:00', 
        'Contenedor estéril', 
        'María Fernanda Castro', 
        'Agua de tanque de almacenamiento principal'
    ),
    (
        'M-005', 
        'Alimento', 
        'ALIM-005-2024', 
        'Producción', 
        '35°C', 
        '100 g', 
        'Análisis de lote sospechoso', 
        'SL', 
        'BC', 
        NULL, 
        'TC', 
        'EC', 
        'LS', 
        NULL,
        '2024-01-19', 
        '16:30:00', 
        '2024-01-19', 
        '17:15:00', 
        'Bolsa térmica', 
        'Luis Alberto Torres', 
        'Lote #12345 con posible contaminación'
    ),
    (
        'M-006', 
        'Superficie', 
        'SUP-006-2024', 
        'Laboratorio', 
        '20°C', 
        '1 unidad', 
        'Control de ambiente de laboratorio', 
        NULL, 
        NULL, 
        'YM', 
        NULL, 
        NULL, 
        NULL, 
        'XSA',
        '2024-01-20', 
        '12:00:00', 
        '2024-01-20', 
        '12:30:00', 
        'Hisopado directo', 
        'Patricia Morales Díaz', 
        'Superficie de campana de flujo laminar'
    )
ON CONFLICT DO NOTHING;

-- 6. Agregar comentarios descriptivos
COMMENT ON TABLE custodia_muestras IS 'RE-CAL-107: Registro y cadena de custodia de muestras análisis interno';
COMMENT ON COLUMN custodia_muestras.codigo IS 'Código único identificador de la muestra';
COMMENT ON COLUMN custodia_muestras.tipo IS 'Tipo de muestra (Agua, Alimento, Superficie, etc.)';
COMMENT ON COLUMN custodia_muestras.muestra_id IS 'ID único de la muestra para seguimiento';
COMMENT ON COLUMN custodia_muestras.area IS 'Área de donde se tomó la muestra';
COMMENT ON COLUMN custodia_muestras.temperatura IS 'Temperatura de la muestra al momento de tomarla';
COMMENT ON COLUMN custodia_muestras.cantidad IS 'Cantidad de la muestra con unidades (ml, g, unidades)';
COMMENT ON COLUMN custodia_muestras.motivo IS 'Motivo o propósito del análisis solicitado';
COMMENT ON COLUMN custodia_muestras.tipo_analisis_sl IS 'Tipo de análisis: Salmonella';
COMMENT ON COLUMN custodia_muestras.tipo_analisis_bc IS 'Tipo de análisis: Bacillus cereus';
COMMENT ON COLUMN custodia_muestras.tipo_analisis_ym IS 'Tipo de análisis: Mohos y Levaduras';
COMMENT ON COLUMN custodia_muestras.tipo_analisis_tc IS 'Tipo de análisis: Coliformes Totales';
COMMENT ON COLUMN custodia_muestras.tipo_analisis_ec IS 'Tipo de análisis: E. coli';
COMMENT ON COLUMN custodia_muestras.tipo_analisis_ls IS 'Tipo de análisis: Listeria';
COMMENT ON COLUMN custodia_muestras.tipo_analisis_etb IS 'Tipo de análisis: E. coli O157:H7';
COMMENT ON COLUMN custodia_muestras.tipo_analisis_xsa IS 'Tipo de análisis: Staphylococcus aureus';
COMMENT ON COLUMN custodia_muestras.toma_muestra_fecha IS 'Fecha en que se tomó la muestra';
COMMENT ON COLUMN custodia_muestras.toma_muestra_hora IS 'Hora en que se tomó la muestra';
COMMENT ON COLUMN custodia_muestras.recepcion_lab_fecha IS 'Fecha de recepción en el laboratorio';
COMMENT ON COLUMN custodia_muestras.recepcion_lab_hora IS 'Hora de recepción en el laboratorio';
COMMENT ON COLUMN custodia_muestras.medio_transporte IS 'Medio utilizado para transportar la muestra';
COMMENT ON COLUMN custodia_muestras.responsable IS 'Nombre completo de la persona responsable';
COMMENT ON COLUMN custodia_muestras.observaciones IS 'Notas adicionales sobre la muestra y su custodia';

-- 7. Verificación
SELECT 'Tabla custodia_muestras creada exitosamente' AS status;
SELECT COUNT(*) as registros_ejemplo_creados FROM custodia_muestras;
