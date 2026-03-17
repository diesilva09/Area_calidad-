-- =====================================================
-- TABLA DE REGISTROS DE PRODUCCIÓN V2
-- Basado exactamente en el schema del modal add-production-record-modal.tsx
-- =====================================================

-- Eliminar tabla existente si existe
DROP TABLE IF EXISTS production_records CASCADE;

-- Crear tabla de registros de producción
CREATE TABLE production_records (
    -- Campos ID y timestamps
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(255),
    updated_by VARCHAR(255),
    is_active BOOLEAN DEFAULT true,
    
    -- Información general del producto
    fechaproduccion DATE NOT NULL,
    fechavencimiento DATE NOT NULL,
    mescorte VARCHAR(50) NOT NULL,
    producto VARCHAR(255) NOT NULL,
    producto_nombre VARCHAR(255),
    envase VARCHAR(100),
    lote VARCHAR(100) NOT NULL,
    tamano_lote VARCHAR(50) NOT NULL,
    letratamano_muestra VARCHAR(10) NOT NULL,
    area VARCHAR(100) NOT NULL,
    equipo VARCHAR(100) NOT NULL,
    
    -- Control de calidad
    liberacion_inicial VARCHAR(50) NOT NULL,
    verificacion_aleatoria VARCHAR(50) NOT NULL,
    observaciones TEXT,
    
    -- Temperaturas
    tempam1 VARCHAR(20) NOT NULL,
    tempam2 VARCHAR(20) NOT NULL,
    temppm1 VARCHAR(20) NOT NULL,
    temppm2 VARCHAR(20) NOT NULL,
    analisis_sensorial VARCHAR(50) NOT NULL,
    
    -- Pruebas de hermeticidad
    prueba_hermeticidad VARCHAR(50) NOT NULL,
    
    -- Inspección de micropesaje
    inspeccion_micropesaje_mezcla VARCHAR(50) NOT NULL,
    inspeccion_micropesaje_resultado VARCHAR(50) NOT NULL,
    
    -- Control de peso drenado
    total_unidades_revisar_drenado VARCHAR(50) NOT NULL,
    peso_drenado_declarado VARCHAR(50) NOT NULL,
    rango_peso_drenado_min VARCHAR(50) NOT NULL,
    rango_peso_drenado_max VARCHAR(50) NOT NULL,
    pesos_drenados VARCHAR(500) NOT NULL,
    promedio_peso_drenado VARCHAR(50) NOT NULL,
    encima_peso_drenado VARCHAR(50) NOT NULL,
    debajo_peso_drenado VARCHAR(50) NOT NULL,
    und_incumplen_rango_drenado VARCHAR(50) NOT NULL,
    porcentaje_incumplen_rango_drenado VARCHAR(50) NOT NULL,
    
    -- Control de peso neto
    total_unidades_revisar_neto VARCHAR(50) NOT NULL,
    peso_neto_declarado VARCHAR(50) NOT NULL,
    pesos_netos VARCHAR(500) NOT NULL,
    promedio_peso_neto VARCHAR(50) NOT NULL,
    encima_peso_neto VARCHAR(50) NOT NULL,
    debajo_peso_neto VARCHAR(50) NOT NULL,
    und_incumplen_rango_neto VARCHAR(50) NOT NULL,
    porcentaje_incumplen_rango_neto VARCHAR(50) NOT NULL,
    
    -- Pruebas de vacío
    pruebas_vacio VARCHAR(50) NOT NULL,
    novedades_proceso TEXT,
    observaciones_acciones_correctivas TEXT,
    supervisor_calidad VARCHAR(255) NOT NULL,
    
    -- Análisis PT (Producto Terminado)
    fechaanalisispt DATE NOT NULL,
    no_mezcla_pt VARCHAR(50) NOT NULL,
    vacio_pt VARCHAR(50) NOT NULL,
    peso_neto_real_pt VARCHAR(50) NOT NULL,
    peso_drenado_real_pt VARCHAR(50) NOT NULL,
    brix_pt VARCHAR(50) NOT NULL,
    ph_pt VARCHAR(50) NOT NULL,
    acidez_pt VARCHAR(50) NOT NULL,
    ppm_so2_pt VARCHAR(50) NOT NULL,
    consistencia_pt VARCHAR(50) NOT NULL,
    sensorial_pt VARCHAR(50) NOT NULL,
    tapado_cierre_pt VARCHAR(50) NOT NULL,
    etiqueta_pt VARCHAR(50) NOT NULL,
    presentacion_final_pt VARCHAR(50) NOT NULL,
    ubicacion_muestra_pt VARCHAR(100) NOT NULL,
    estado_pt VARCHAR(50) NOT NULL,
    observaciones_pt TEXT,
    responsable_analisis_pt VARCHAR(255) NOT NULL,
    status VARCHAR(20) DEFAULT 'completed'
);

-- Crear índices para mejor rendimiento
CREATE INDEX idx_production_records_producto ON production_records(producto);
CREATE INDEX idx_production_records_lote ON production_records(lote);
CREATE INDEX idx_production_records_fecha ON production_records(fechaproduccion);
CREATE INDEX idx_production_records_is_active ON production_records(is_active);
CREATE INDEX idx_production_records_supervisor ON production_records(supervisor_calidad);

-- Crear trigger para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_production_records_updated_at 
    BEFORE UPDATE ON production_records 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Comentarios para documentación
COMMENT ON TABLE production_records IS 'Tabla de registros de producción del sistema de calidad';
COMMENT ON COLUMN production_records.id IS 'Identificador único del registro';
COMMENT ON COLUMN production_records.fechaproduccion IS 'Fecha de producción del lote';
COMMENT ON COLUMN production_records.fechavencimiento IS 'Fecha de vencimiento del producto';
COMMENT ON COLUMN production_records.mescorte IS 'Mes de corte de la materia prima';
COMMENT ON COLUMN production_records.producto IS 'Nombre del producto';
COMMENT ON COLUMN production_records.lote IS 'Número de lote';
COMMENT ON COLUMN production_records.tamano_lote IS 'Tamaño del lote';
COMMENT ON COLUMN production_records.letratamano_muestra IS 'Letra correspondiente al tamaño de muestra';
COMMENT ON COLUMN production_records.area IS 'Área de producción';
COMMENT ON COLUMN production_records.equipo IS 'Equipo utilizado';
COMMENT ON COLUMN production_records.liberacion_inicial IS 'Resultado de liberación inicial';
COMMENT ON COLUMN production_records.verificacion_aleatoria IS 'Resultado de verificación aleatoria';
COMMENT ON COLUMN production_records.observaciones IS 'Observaciones generales del proceso';
COMMENT ON COLUMN production_records.tempam1 IS 'Temperatura AM 1';
COMMENT ON COLUMN production_records.tempam2 IS 'Temperatura AM 2';
COMMENT ON COLUMN production_records.temppm1 IS 'Temperatura PM 1';
COMMENT ON COLUMN production_records.temppm2 IS 'Temperatura PM 2';
COMMENT ON COLUMN production_records.analisis_sensorial IS 'Resultado del análisis sensorial';
COMMENT ON COLUMN production_records.prueba_hermeticidad IS 'Resultado de prueba de hermeticidad';
COMMENT ON COLUMN production_records.inspeccion_micropesaje_mezcla IS 'Inspección de micropesaje - mezcla';
COMMENT ON COLUMN production_records.inspeccion_micropesaje_resultado IS 'Inspección de micropesaje - resultado';
COMMENT ON COLUMN production_records.total_unidades_revisar_drenado IS 'Total de unidades revisadas para drenado';
COMMENT ON COLUMN production_records.peso_drenado_declarado IS 'Peso drenado declarado';
COMMENT ON COLUMN production_records.rango_peso_drenado_min IS 'Rango mínimo de peso drenado';
COMMENT ON COLUMN production_records.rango_peso_drenado_max IS 'Rango máximo de peso drenado';
COMMENT ON COLUMN production_records.pesos_drenados IS 'Pesos drenados registrados';
COMMENT ON COLUMN production_records.promedio_peso_drenado IS 'Promedio de peso drenado';
COMMENT ON COLUMN production_records.encima_peso_drenado IS 'Unidades encima del peso drenado';
COMMENT ON COLUMN production_records.debajo_peso_drenado IS 'Unidades debajo del peso drenado';
COMMENT ON COLUMN production_records.und_incumplen_rango_drenado IS 'Unidades que incumplen rango de drenado';
COMMENT ON COLUMN production_records.porcentaje_incumplen_rango_drenado IS 'Porcentaje que incumple rango de drenado';
COMMENT ON COLUMN production_records.total_unidades_revisar_neto IS 'Total de unidades revisadas para peso neto';
COMMENT ON COLUMN production_records.peso_neto_declarado IS 'Peso neto declarado';
COMMENT ON COLUMN production_records.pesos_netos IS 'Pesos netos registrados';
COMMENT ON COLUMN production_records.promedio_peso_neto IS 'Promedio de peso neto';
COMMENT ON COLUMN production_records.encima_peso_neto IS 'Unidades encima del peso neto';
COMMENT ON COLUMN production_records.debajo_peso_neto IS 'Unidades debajo del peso neto';
COMMENT ON COLUMN production_records.und_incumplen_rango_neto IS 'Unidades que incumplen rango de peso neto';
COMMENT ON COLUMN production_records.porcentaje_incumplen_rango_neto IS 'Porcentaje que incumple rango de peso neto';
COMMENT ON COLUMN production_records.pruebas_vacio IS 'Resultado de pruebas de vacío';
COMMENT ON COLUMN production_records.novedades_proceso IS 'Novedades del proceso';
COMMENT ON COLUMN production_records.observaciones_acciones_correctivas IS 'Observaciones y acciones correctivas';
COMMENT ON COLUMN production_records.supervisor_calidad IS 'Supervisor de calidad';
COMMENT ON COLUMN production_records.fechaanalisispt IS 'Fecha de análisis de producto terminado';
COMMENT ON COLUMN production_records.no_mezcla_pt IS 'Resultado de prueba de no mezcla PT';
COMMENT ON COLUMN production_records.vacio_pt IS 'Resultado de prueba de vacío PT';
COMMENT ON COLUMN production_records.peso_neto_real_pt IS 'Peso neto real PT';
COMMENT ON COLUMN production_records.peso_drenado_real_pt IS 'Peso drenado real PT';
COMMENT ON COLUMN production_records.brix_pt IS 'Medición de Brix PT';
COMMENT ON COLUMN production_records.ph_pt IS 'Medición de pH PT';
COMMENT ON COLUMN production_records.acidez_pt IS 'Medición de acidez PT';
COMMENT ON COLUMN production_records.ppm_so2_pt IS 'PPM de SO2 PT';
COMMENT ON COLUMN production_records.consistencia_pt IS 'Consistencia PT';
COMMENT ON COLUMN production_records.sensorial_pt IS 'Análisis sensorial PT';
COMMENT ON COLUMN production_records.tapado_cierre_pt IS 'Tapado y cierre PT';
COMMENT ON COLUMN production_records.etiqueta_pt IS 'Revisión de etiqueta PT';
COMMENT ON COLUMN production_records.presentacion_final_pt IS 'Presentación final PT';
COMMENT ON COLUMN production_records.ubicacion_muestra_pt IS 'Ubicación de la muestra PT';
COMMENT ON COLUMN production_records.estado_pt IS 'Estado del análisis PT';
COMMENT ON COLUMN production_records.observaciones_pt IS 'Observaciones del análisis PT';
COMMENT ON COLUMN production_records.responsable_analisis_pt IS 'Responsable del análisis PT';
COMMENT ON COLUMN production_records.status IS 'Status of the production record: pending or completed';

-- Insertar datos de prueba (opcional)
INSERT INTO production_records (
    fechaproduccion, fechavencimiento, mescorte, producto, lote, tamano_lote,
    letratamano_muestra, area, equipo, liberacion_inicial, verificacion_aleatoria,
    tempam1, tempam2, temppm1, temppm2, analisis_sensorial,
    prueba_hermeticidad, inspeccion_micropesaje_mezcla, inspeccion_micropesaje_resultado,
    total_unidades_revisar_drenado, peso_drenado_declarado, rango_peso_drenado_min,
    rango_peso_drenado_max, pesos_drenados, promedio_peso_drenado, encima_peso_drenado,
    debajo_peso_drenado, und_incumplen_rango_drenado, porcentaje_incumplen_rango_drenado,
    total_unidades_revisar_neto, peso_neto_declarado, pesos_netos, promedio_peso_neto,
    encima_peso_neto, debajo_peso_neto, und_incumplen_rango_neto, porcentaje_incumplen_rango_neto,
    pruebas_vacio, supervisor_calidad, fechaanalisispt, no_mezcla_pt, vacio_pt,
    peso_neto_real_pt, peso_drenado_real_pt, brix_pt, ph_pt, acidez_pt, ppm_so2_pt,
    consistencia_pt, sensorial_pt, tapado_cierre_pt, etiqueta_pt, presentacion_final_pt,
    ubicacion_muestra_pt, estado_pt, responsable_analisis_pt, created_by, updated_by
) VALUES (
    '2024-01-15', '2024-06-15', 'ENERO', 'Producto Test', 'LOTE001', '1000',
    'A', 'PRODUCCION', 'EQUIPO01', 'Aprobado', 'OK',
    '25', '26', '24', '25', 'OK',
    'OK', 'OK', 'OK', '100', '500', '450', '550',
    '480,490,510', '493', '10', '5', '15', '15',
    '100', '450', '430,440,460', '443', '8', '7', '15', '15',
    'OK', 'Juan Pérez', '2024-01-16', 'OK', 'OK', '443', '493',
    '12', '3.5', '0.5', '200', 'OK', 'OK', 'OK', 'OK',
    'OK', 'Laboratorio', 'Aprobado', 'Ana García', 'system', 'system'
);

-- Mostrar resultado
SELECT 'Tabla production_records creada exitosamente' AS resultado;
SELECT COUNT(*) AS total_registros FROM production_records;
