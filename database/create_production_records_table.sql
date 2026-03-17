-- Tabla para almacenar registros de producción
CREATE TABLE IF NOT EXISTS production_records (
    -- Campos principales
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    fecha_produccion DATE NOT NULL,
    fecha_vencimiento DATE NOT NULL,
    mes_corte VARCHAR(50) NOT NULL,
    producto VARCHAR(255) NOT NULL,
    lote VARCHAR(100) NOT NULL,
    tamano_lote VARCHAR(50) NOT NULL,
    letra_tamano_muestra VARCHAR(10) NOT NULL,
    area VARCHAR(100) NOT NULL,
    equipo VARCHAR(100) NOT NULL,
    
    -- Control de calidad
    liberacion_inicial VARCHAR(50) NOT NULL,
    verificacion_aleatoria VARCHAR(50) NOT NULL,
    observaciones TEXT,
    
    -- Temperaturas
    temp_am1 VARCHAR(20) NOT NULL,
    temp_am2 VARCHAR(20) NOT NULL,
    temp_pm1 VARCHAR(20) NOT NULL,
    temp_pm2 VARCHAR(20) NOT NULL,
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
    pesos_drenados TEXT NOT NULL,
    promedio_peso_drenado VARCHAR(50) NOT NULL,
    encima_peso_drenado VARCHAR(50) NOT NULL,
    debajo_peso_drenado VARCHAR(50) NOT NULL,
    und_incumplen_rango_drenado VARCHAR(50) NOT NULL,
    porcentaje_incumplen_rango_drenado VARCHAR(50) NOT NULL,
    
    -- Control de peso neto
    total_unidades_revisar_neto VARCHAR(50) NOT NULL,
    peso_neto_declarado VARCHAR(50) NOT NULL,
    pesos_netos TEXT NOT NULL,
    promedio_peso_neto VARCHAR(50) NOT NULL,
    encima_peso_neto VARCHAR(50) NOT NULL,
    debajo_peso_neto VARCHAR(50) NOT NULL,
    und_incumplen_rango_neto VARCHAR(50) NOT NULL,
    porcentaje_incumplen_rango_neto VARCHAR(50) NOT NULL,
    
    -- Pruebas de vacío
    pruebas_vacio VARCHAR(50) NOT NULL,
    
    -- Novedades y acciones correctivas
    novedades_proceso TEXT,
    observaciones_acciones_correctivas TEXT,
    
    -- Supervisor
    supervisor_calidad VARCHAR(255) NOT NULL,
    
    -- Análisis PT (Producto Terminado)
    fecha_analisis_pt DATE NOT NULL,
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
    
    -- Campos de auditoría
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(255),
    updated_by VARCHAR(255),
    
    -- Estado del registro
    is_active BOOLEAN DEFAULT true
);

-- Crear índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_production_records_fecha_produccion ON production_records(fecha_produccion);
CREATE INDEX IF NOT EXISTS idx_production_records_producto ON production_records(producto);
CREATE INDEX IF NOT EXISTS idx_production_records_lote ON production_records(lote);
CREATE INDEX IF NOT EXISTS idx_production_records_fecha_vencimiento ON production_records(fecha_vencimiento);
CREATE INDEX IF NOT EXISTS idx_production_records_is_active ON production_records(is_active);

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
COMMENT ON TABLE production_records IS 'Tabla para almacenar todos los registros de producción del sistema';
COMMENT ON COLUMN production_records.id IS 'Identificador único del registro de producción';
COMMENT ON COLUMN production_records.fecha_produccion IS 'Fecha en que se realizó la producción';
COMMENT ON COLUMN production_records.fecha_vencimiento IS 'Fecha de vencimiento del producto';
COMMENT ON COLUMN production_records.mes_corte IS 'Mes de corte correspondiente';
COMMENT ON COLUMN production_records.producto IS 'Nombre del producto fabricado';
COMMENT ON COLUMN production_records.lote IS 'Número de lote de producción';
COMMENT ON COLUMN production_records.tamano_lote IS 'Tamaño del lote producido';
COMMENT ON COLUMN production_records.letra_tamano_muestra IS 'Letra identificadora del tamaño de muestra';
COMMENT ON COLUMN production_records.area IS 'Área de producción';
COMMENT ON COLUMN production_records.equipo IS 'Equipo utilizado en la producción';
COMMENT ON COLUMN production_records.liberacion_inicial IS 'Resultado de liberación inicial';
COMMENT ON COLUMN production_records.verificacion_aleatoria IS 'Resultado de verificación aleatoria';
COMMENT ON COLUMN production_records.observaciones IS 'Observaciones generales del proceso';
COMMENT ON COLUMN production_records.temp_am1 IS 'Temperatura AM primera medición';
COMMENT ON COLUMN production_records.temp_am2 IS 'Temperatura AM segunda medición';
COMMENT ON COLUMN production_records.temp_pm1 IS 'Temperatura PM primera medición';
COMMENT ON COLUMN production_records.temp_pm2 IS 'Temperatura PM segunda medición';
COMMENT ON COLUMN production_records.analisis_sensorial IS 'Resultado del análisis sensorial';
COMMENT ON COLUMN production_records.prueba_hermeticidad IS 'Resultado de prueba de hermeticidad';
COMMENT ON COLUMN production_records.inspeccion_micropesaje_mezcla IS 'Inspección de micropesaje - mezcla';
COMMENT ON COLUMN production_records.inspeccion_micropesaje_resultado IS 'Resultado de inspección de micropesaje';
COMMENT ON COLUMN production_records.supervisor_calidad IS 'Nombre del supervisor de calidad';
COMMENT ON COLUMN production_records.fecha_analisis_pt IS 'Fecha de análisis de producto terminado';
COMMENT ON COLUMN production_records.responsable_analisis_pt IS 'Responsable del análisis de producto terminado';
