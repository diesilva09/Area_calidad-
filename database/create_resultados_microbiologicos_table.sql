-- ========================================
-- RE-CAL-046: Resultados Microbiológicos Análisis Internos y Externos
-- Script para crear la tabla en PostgreSQL
-- ========================================

-- 1. Crear la tabla principal
CREATE TABLE IF NOT EXISTS resultados_microbiologicos (
    id SERIAL PRIMARY KEY,
    fecha DATE NOT NULL, -- Fecha del análisis
    mes_muestreo VARCHAR(50) NOT NULL, -- Mes en que se realizó el muestreo
    hora_muestreo TIME NOT NULL, -- Hora de realización del muestreo
    interno_externo VARCHAR(20) NOT NULL, -- Tipo de análisis: INTERNO o EXTERNO
    tipo VARCHAR(100) NOT NULL, -- Tipo de muestra (Agua, Alimento, Superficie, etc.)
    area VARCHAR(100) NOT NULL, -- Área de donde proviene la muestra
    muestra VARCHAR(100) NOT NULL, -- Identificador de la muestra
    lote VARCHAR(100) NOT NULL, -- Número de lote
    fecha_produccion DATE NOT NULL, -- Fecha de producción del lote
    fecha_vencimiento DATE NOT NULL, -- Fecha de vencimiento del producto
    mesofilos VARCHAR(50), -- Recuento de mesófilos (UFC)
    coliformes_totales VARCHAR(50), -- Recuento de coliformes totales (UFC)
    coliformes_fecales VARCHAR(50), -- Recuento de coliformes fecales (UFC)
    e_coli VARCHAR(50), -- Recuento de E. coli (UFC)
    mohos VARCHAR(50), -- Recuento de mohos (UFC)
    levaduras VARCHAR(50), -- Recuento de levaduras (UFC)
    staphylococcus_aureus VARCHAR(50), -- Recuento de Staphylococcus aureus (UFC)
    bacillus_cereus VARCHAR(50), -- Recuento de Bacillus cereus (UFC)
    listeria VARCHAR(20), -- Detección de Listeria (AUSENTE/PRESENTE)
    salmonella VARCHAR(20), -- Detección de Salmonella (AUSENTE/PRESENTE)
    enterobacterias VARCHAR(50), -- Recuento de enterobacterias (UFC)
    clostridium VARCHAR(50), -- Recuento de Clostridium sulfito reductor - esporas (UFC)
    esterilidad_comercial VARCHAR(20), -- Evaluación de esterilidad comercial (CUMPLE/NO CUMPLE)
    anaerobias VARCHAR(50), -- Recuento de anaerobias sulfito reductoras (UFC)
    observaciones TEXT, -- Observaciones adicionales
    parametros_referencia TEXT, -- Parámetros de referencia utilizados
    cumple BOOLEAN DEFAULT FALSE, -- Indicador de cumplimiento
    no_cumple BOOLEAN DEFAULT FALSE, -- Indicador de no cumplimiento
    codigo VARCHAR(50) NOT NULL, -- Código único del resultado
    medio_diluyente VARCHAR(100), -- Medio diluyente utilizado
    factor_dilucion VARCHAR(50), -- Factor de dilución
    responsable VARCHAR(255) NOT NULL, -- Nombre del responsable
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Crear índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_resultados_microbiologicos_fecha ON resultados_microbiologicos(fecha);
CREATE INDEX IF NOT EXISTS idx_resultados_microbiologicos_mes_muestreo ON resultados_microbiologicos(mes_muestreo);
CREATE INDEX IF NOT EXISTS idx_resultados_microbiologicos_interno_externo ON resultados_microbiologicos(interno_externo);
CREATE INDEX IF NOT EXISTS idx_resultados_microbiologicos_tipo ON resultados_microbiologicos(tipo);
CREATE INDEX IF NOT EXISTS idx_resultados_microbiologicos_area ON resultados_microbiologicos(area);
CREATE INDEX IF NOT EXISTS idx_resultados_microbiologicos_muestra ON resultados_microbiologicos(muestra);
CREATE INDEX IF NOT EXISTS idx_resultados_microbiologicos_lote ON resultados_microbiologicos(lote);
CREATE INDEX IF NOT EXISTS idx_resultados_microbiologicos_codigo ON resultados_microbiologicos(codigo);
CREATE INDEX IF NOT EXISTS idx_resultados_microbiologicos_responsable ON resultados_microbiologicos(responsable);
CREATE INDEX IF NOT EXISTS idx_resultados_microbiologicos_cumple ON resultados_microbiologicos(cumple);
CREATE INDEX IF NOT EXISTS idx_resultados_microbiologicos_created_at ON resultados_microbiologicos(created_at);

-- 3. Crear función para actualizar timestamp automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 4. Crear trigger para actualizar updated_at automáticamente
DROP TRIGGER IF EXISTS update_resultados_microbiologicos_updated_at ON resultados_microbiologicos;
CREATE TRIGGER update_resultados_microbiologicos_updated_at 
    BEFORE UPDATE ON resultados_microbiologicos 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- 5. Insertar datos de ejemplo (opcional)
INSERT INTO resultados_microbiologicos (
    fecha, 
    mes_muestreo, 
    hora_muestreo, 
    interno_externo, 
    tipo, 
    area, 
    muestra, 
    lote, 
    fecha_produccion, 
    fecha_vencimiento, 
    mesofilos, 
    coliformes_totales, 
    coliformes_fecales, 
    e_coli, 
    mohos, 
    levaduras, 
    staphylococcus_aureus, 
    bacillus_cereus, 
    listeria, 
    salmonella, 
    enterobacterias, 
    clostridium, 
    esterilidad_comercial, 
    anaerobias, 
    observaciones, 
    parametros_referencia, 
    cumple, 
    no_cumple, 
    codigo, 
    medio_diluyente, 
    factor_dilucion, 
    responsable
) VALUES
    (
        '2024-01-15', 
        'Enero', 
        '08:30:00', 
        'INTERNO', 
        'Agua', 
        'Producción', 
        'AGUA-001', 
        'L-202401', 
        '2024-01-10', 
        '2024-12-31', 
        '25 UFC/ml', 
        '<3 UFC/ml', 
        '<3 UFC/ml', 
        '0 UFC/ml', 
        '<10 UFC/ml', 
        '<50 UFC/ml', 
        '<10 UFC/ml', 
        '<100 UFC/ml', 
        'AUSENTE', 
        'AUSENTE', 
        '<100 UFC/ml', 
        '<10 UFC/ml', 
        'CUMPLE', 
        '<10 UFC/ml', 
        'Agua de proceso cumple con estándares microbiológicos', 
        'NTC 4099 Agua Potable', 
        true, 
        false, 
        'RM-001', 
        'Agua peptonada', 
        '1:10', 
        'Juan David Castañeda Ortiz'
    ),
    (
        '2024-01-16', 
        'Enero', 
        '09:15:00', 
        'EXTERNO', 
        'Alimento', 
        'Empaque', 
        'ALIM-002', 
        'L-202402', 
        '2024-01-12', 
        '2024-06-30', 
        '1500 UFC/g', 
        '50 UFC/g', 
        '10 UFC/g', 
        '5 UFC/g', 
        '100 UFC/g', 
        '80 UFC/g', 
        '20 UFC/g', 
        '500 UFC/g', 
        'PRESENTE', 
        'AUSENTE', 
        '1000 UFC/g', 
        '<10 UFC/g', 
        'NO CUMPLE', 
        'Producto excede límites de coliformes', 
        'NTC 4347 Alimentos', 
        false, 
        true, 
        'RM-002', 
        'PBS', 
        '1:100', 
        'Ana María García López'
    ),
    (
        '2024-01-17', 
        'Enero', 
        '10:45:00', 
        'INTERNO', 
        'Superficie', 
        'Bodega', 
        'SUP-003', 
        'L-202403', 
        '2024-01-15', 
        '2024-12-15', 
        '500 UFC/cm2', 
        '100 UFC/cm2', 
        '20 UFC/cm2', 
        '10 UFC/cm2', 
        '200 UFC/cm2', 
        '150 UFC/cm2', 
        '15 UFC/cm2', 
        '800 UFC/cm2', 
        'AUSENTE', 
        'AUSENTE', 
        '2000 UFC/cm2', 
        '50 UFC/cm2', 
        'CUMPLE', 
        'Superficie cumple con estándares de higiene', 
        'NTC 4347 Superficies', 
        true, 
        false, 
        'RM-003', 
        'Solución salina', 
        '1:100', 
        'Carlos Rodríguez Martínez'
    ),
    (
        '2024-01-18', 
        'Enero', 
        '14:20:00', 
        'EXTERNO', 
        'Alimento', 
        'Producción', 
        'ALIM-004', 
        'L-202404', 
        '2024-01-16', 
        '2024-04-30', 
        '2000 UFC/g', 
        '300 UFC/g', 
        '150 UFC/g', 
        '80 UFC/g', 
        '500 UFC/g', 
        '400 UFC/g', 
        '100 UFC/g', 
        '1500 UFC/g', 
        'PRESENTE', 
        'PRESENTE', 
        '5000 UFC/g', 
        '100 UFC/g', 
        'NO CUMPLE', 
        'Producto con presencia de Salmonella y Listeria', 
        'NTC 4347 Alimentos', 
        false, 
        true, 
        'RM-004', 
        'Agua peptonada', 
        '1:1000', 
        'María Fernanda Castro'
    ),
    (
        '2024-01-19', 
        'Enero', 
        '11:30:00', 
        'INTERNO', 
        'Agua', 
        'Laboratorio', 
        'AGUA-005', 
        'L-202405', 
        '2024-01-18', 
        '2025-01-18', 
        '10 UFC/ml', 
        '<3 UFC/ml', 
        '<3 UFC/ml', 
        '0 UFC/ml', 
        '<10 UFC/ml', 
        '<50 UFC/ml', 
        '<10 UFC/ml', 
        '<100 UFC/ml', 
        'AUSENTE', 
        'AUSENTE', 
        '<100 UFC/ml', 
        '<10 UFC/ml', 
        'CUMPLE', 
        'Agua purificada cumple estándares', 
        'NTC 4099 Agua Potable', 
        true, 
        false, 
        'RM-005', 
        'Agua destilada', 
        '1:1', 
        'Luis Alberto Torres'
    ),
    (
        '2024-01-20', 
        'Enero', 
        '16:00:00', 
        'EXTERNO', 
        'Alimento', 
        'Producción', 
        'ALIM-006', 
        'L-202406', 
        '2024-01-19', 
        '2024-03-31', 
        '800 UFC/g', 
        '150 UFC/g', 
        '20 UFC/g', 
        '5 UFC/g', 
        '200 UFC/g', 
        '180 UFC/g', 
        '50 UFC/g', 
        '1200 UFC/g', 
        'AUSENTE', 
        'AUSENTE', 
        '3000 UFC/g', 
        '80 UFC/g', 
        'CUMPLE', 
        'Producto cumple con estándares de calidad', 
        'NTC 4347 Alimentos', 
        true, 
        false, 
        'RM-006', 
        'Buffer fosfato', 
        '1:100', 
        'Patricia Morales Díaz'
    )
ON CONFLICT DO NOTHING;

-- 6. Agregar comentarios descriptivos
COMMENT ON TABLE resultados_microbiologicos IS 'RE-CAL-046: Resultados microbiológicos análisis internos y externos';
COMMENT ON COLUMN resultados_microbiologicos.fecha IS 'Fecha del análisis microbiológico';
COMMENT ON COLUMN resultados_microbiologicos.mes_muestreo IS 'Mes en que se realizó el muestreo';
COMMENT ON COLUMN resultados_microbiologicos.hora_muestreo IS 'Hora exacta de realización del muestreo';
COMMENT ON COLUMN resultados_microbiologicos.interno_externo IS 'Tipo de análisis: INTERNO o EXTERNO';
COMMENT ON COLUMN resultados_microbiologicos.tipo IS 'Tipo de muestra analizada';
COMMENT ON COLUMN resultados_microbiologicos.area IS 'Área de donde proviene la muestra';
COMMENT ON COLUMN resultados_microbiologicos.muestra IS 'Identificador único de la muestra';
COMMENT ON COLUMN resultados_microbiologicos.lote IS 'Número de lote del producto';
COMMENT ON COLUMN resultados_microbiologicos.fecha_produccion IS 'Fecha de producción del lote';
COMMENT ON COLUMN resultados_microbiologicos.fecha_vencimiento IS 'Fecha de vencimiento del producto';
COMMENT ON COLUMN resultados_microbiologicos.mesofilos IS 'Recuento de mesófilos en UFC';
COMMENT ON COLUMN resultados_microbiologicos.coliformes_totales IS 'Recuento de coliformes totales en UFC';
COMMENT ON COLUMN resultados_microbiologicos.coliformes_fecales IS 'Recuento de coliformes fecales en UFC';
COMMENT ON COLUMN resultados_microbiologicos.e_coli IS 'Recuento de E. coli en UFC';
COMMENT ON COLUMN resultados_microbiologicos.mohos IS 'Recuento de mohos en UFC';
COMMENT ON COLUMN resultados_microbiologicos.levaduras IS 'Recuento de levaduras en UFC';
COMMENT ON COLUMN resultados_microbiologicos.staphylococcus_aureus IS 'Recuento de Staphylococcus aureus en UFC';
COMMENT ON COLUMN resultados_microbiologicos.bacillus_cereus IS 'Recuento de Bacillus cereus en UFC';
COMMENT ON COLUMN resultados_microbiologicos.listeria IS 'Detección de Listeria (AUSENTE/PRESENTE)';
COMMENT ON COLUMN resultados_microbiologicos.salmonella IS 'Detección de Salmonella (AUSENTE/PRESENTE)';
COMMENT ON COLUMN resultados_microbiologicos.enterobacterias IS 'Recuento de enterobacterias en UFC';
COMMENT ON COLUMN resultados_microbiologicos.clostridium IS 'Recuento de Clostridium sulfito reductor - esporas en UFC';
COMMENT ON COLUMN resultados_microbiologicos.esterilidad_comercial IS 'Evaluación de esterilidad comercial (CUMPLE/NO CUMPLE)';
COMMENT ON COLUMN resultados_microbiologicos.anaerobias IS 'Recuento de anaerobias sulfito reductoras en UFC';
COMMENT ON COLUMN resultados_microbiologicos.observaciones IS 'Observaciones adicionales sobre los resultados';
COMMENT ON COLUMN resultados_microbiologicos.parametros_referencia IS 'Parámetros de referencia utilizados en el análisis';
COMMENT ON COLUMN resultados_microbiologicos.cumple IS 'Indicador de cumplimiento con estándares';
COMMENT ON COLUMN resultados_microbiologicos.no_cumple IS 'Indicador de no cumplimiento con estándares';
COMMENT ON COLUMN resultados_microbiologicos.codigo IS 'Código único del resultado microbiológico';
COMMENT ON COLUMN resultados_microbiologicos.medio_diluyente IS 'Medio diluyente utilizado en el análisis';
COMMENT ON COLUMN resultados_microbiologicos.factor_dilucion IS 'Factor de dilución utilizado';
COMMENT ON COLUMN resultados_microbiologicos.responsable IS 'Nombre completo del responsable del análisis';

-- 7. Verificación
SELECT 'Tabla resultados_microbiologicos creada exitosamente' AS status;
SELECT COUNT(*) as registros_ejemplo_creados FROM resultados_microbiologicos;
