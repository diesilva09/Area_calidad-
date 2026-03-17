-- =====================================================
-- TABLA: REGISTROS DE EMBALAJE
-- Basado en el schema del AddEmbalajeRecordModal
-- =====================================================

-- Eliminar tabla si existe (para desarrollo)
DROP TABLE IF EXISTS embalaje_records CASCADE;

-- Crear tabla de registros de embalaje
CREATE TABLE embalaje_records (
  -- Campos principales
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_by VARCHAR(255),
  updated_by VARCHAR(255),
  is_active BOOLEAN DEFAULT true,
  
  -- Información básica del registro
  fecha DATE NOT NULL,
  mescorte VARCHAR(50) NOT NULL,
  producto VARCHAR(255) NOT NULL, -- ID del producto (referencia a productos)
  presentacion VARCHAR(100) NOT NULL,
  lote VARCHAR(100) NOT NULL,
  tamano_lote VARCHAR(50) NOT NULL,
  
  -- Información de inspección
  nivel_inspeccion VARCHAR(50) NOT NULL,
  cajas_revisadas VARCHAR(50) NOT NULL,
  total_unidades_revisadas VARCHAR(50) NOT NULL,
  total_unidades_revisadas_real VARCHAR(50) NOT NULL,
  observaciones_generales TEXT,
  
  -- Control de unidades faltantes
  unidades_faltantes VARCHAR(50) NOT NULL,
  porcentaje_faltantes VARCHAR(20) NOT NULL,
  observaciones_faltantes TEXT,
  
  -- Control de etiquetas
  etiqueta VARCHAR(50) NOT NULL,
  porcentaje_etiqueta_no_conforme VARCHAR(20) NOT NULL,
  observaciones_etiqueta TEXT,
  
  -- Control de marcación/codificación
  marcacion VARCHAR(50) NOT NULL,
  porcentaje_marcacion_no_conforme VARCHAR(20) NOT NULL,
  observaciones_marcacion TEXT,
  
  -- Control de presentación
  presentacion_no_conforme VARCHAR(50) NOT NULL,
  porcentaje_presentacion_no_conforme VARCHAR(20) NOT NULL,
  observaciones_presentacion TEXT,
  
  -- Control de cajas
  cajas VARCHAR(50) NOT NULL,
  porcentaje_cajas_no_conformes VARCHAR(20) NOT NULL,
  observaciones_cajas TEXT,
  
  -- Acciones correctivas
  correccion TEXT,
  
  -- Responsables
  responsable_identificador_cajas VARCHAR(255) NOT NULL,
  responsable_embalaje VARCHAR(255) NOT NULL,
  responsable_calidad VARCHAR(255) NOT NULL,
  
  -- Resumen de no conformidad
  unidades_no_conformes VARCHAR(50) NOT NULL,
  porcentaje_incumplimiento VARCHAR(20) NOT NULL
);

-- Crear índices para mejor rendimiento
CREATE INDEX idx_embalaje_records_producto ON embalaje_records(producto);
CREATE INDEX idx_embalaje_records_fecha ON embalaje_records(fecha);
CREATE INDEX idx_embalaje_records_lote ON embalaje_records(lote);
CREATE INDEX idx_embalaje_records_created_at ON embalaje_records(created_at);
CREATE INDEX idx_embalaje_records_is_active ON embalaje_records(is_active);

-- Crear trigger para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_embalaje_records_updated_at 
    BEFORE UPDATE ON embalaje_records 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Comentarios para documentación
COMMENT ON TABLE embalaje_records IS 'Registros de control de calidad de embalaje';
COMMENT ON COLUMN embalaje_records.id IS 'Identificador único del registro';
COMMENT ON COLUMN embalaje_records.producto IS 'ID del producto (UUID del producto)';
COMMENT ON COLUMN embalaje_records.fecha IS 'Fecha del registro de embalaje';
COMMENT ON COLUMN embalaje_records.mescorte IS 'Mes de corte de referencia';
COMMENT ON COLUMN embalaje_records.presentacion IS 'Tipo de presentación del producto';
COMMENT ON COLUMN embalaje_records.lote IS 'Número de lote del producto';
COMMENT ON COLUMN embalaje_records.tamano_lote IS 'Tamaño del lote (unidades)';
COMMENT ON COLUMN embalaje_records.nivel_inspeccion IS 'Nivel de inspección aplicado';
COMMENT ON COLUMN embalaje_records.cajas_revisadas IS 'Cantidad de cajas revisadas';
COMMENT ON COLUMN embalaje_records.total_unidades_revisadas IS 'Total de unidades que deberían revisarse';
COMMENT ON COLUMN embalaje_records.total_unidades_revisadas_real IS 'Total de unidades realmente revisadas';
COMMENT ON COLUMN embalaje_records.unidades_faltantes IS 'Cantidad de unidades faltantes';
COMMENT ON COLUMN embalaje_records.porcentaje_faltantes IS 'Porcentaje de unidades faltantes';
COMMENT ON COLUMN embalaje_records.etiqueta IS 'Estado de las etiquetas';
COMMENT ON COLUMN embalaje_records.porcentaje_etiqueta_no_conforme IS 'Porcentaje de etiquetas no conformes';
COMMENT ON COLUMN embalaje_records.marcacion IS 'Estado de marcación/codificación';
COMMENT ON COLUMN embalaje_records.porcentaje_marcacion_no_conforme IS 'Porcentaje de marcación no conforme';
COMMENT ON COLUMN embalaje_records.presentacion_no_conforme IS 'Estado de presentación no conforme';
COMMENT ON COLUMN embalaje_records.porcentaje_presentacion_no_conforme IS 'Porcentaje de presentación no conforme';
COMMENT ON COLUMN embalaje_records.cajas IS 'Estado de las cajas';
COMMENT ON COLUMN embalaje_records.porcentaje_cajas_no_conformes IS 'Porcentaje de cajas no conformes';
COMMENT ON COLUMN embalaje_records.correccion IS 'Acciones correctivas aplicadas';
COMMENT ON COLUMN embalaje_records.responsable_identificador_cajas IS 'Responsable del identificador de cajas';
COMMENT ON COLUMN embalaje_records.responsable_embalaje IS 'Responsable del proceso de embalaje';
COMMENT ON COLUMN embalaje_records.responsable_calidad IS 'Responsable de calidad';
COMMENT ON COLUMN embalaje_records.unidades_no_conformes IS 'Total de unidades no conformes';
COMMENT ON COLUMN embalaje_records.porcentaje_incumplimiento IS 'Porcentaje total de incumplimiento';

-- Insertar datos de prueba (opcional)
INSERT INTO embalaje_records (
  fecha, mescorte, producto, presentacion, lote, tamano_lote,
  nivel_inspeccion, cajas_revisadas, total_unidades_revisadas, total_unidades_revisadas_real,
  unidades_faltantes, porcentaje_faltantes, etiqueta, porcentaje_etiqueta_no_conforme,
  marcacion, porcentaje_marcacion_no_conforme, presentacion_no_conforme, porcentaje_presentacion_no_conforme,
  cajas, porcentaje_cajas_no_conformes, responsable_identificador_cajas, responsable_embalaje, responsable_calidad,
  unidades_no_conformes, porcentaje_incumplimiento
) VALUES (
  '2024-01-26', 'Enero 2024', 'producto-embalaje-001', 'Botella 500ml', 'LOT-EMB-001', '100',
  'Nivel II', '10', '240', '238',
  '2', '0.83%', 'Conforme', '0%',
  'Correcta', '0%', 'Conforme', '0%',
  'Buen estado', '0%', 'Juan Pérez', 'María García', 'Carlos López',
  '2', '0.83%'
);

-- Verificar la creación de la tabla
SELECT 
    column_name, 
    data_type, 
    character_maximum_length,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'embalaje_records' 
ORDER BY ordinal_position;
