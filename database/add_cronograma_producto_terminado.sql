-- Tabla para el Cronograma de Muestreo de Producto Terminado (PL-CAL-009)
-- Esquema: lab_microbiologia
-- Versión simplificada: solo producto, fecha y responsable por ahora

-- Crear esquema si no existe
CREATE SCHEMA IF NOT EXISTS lab_microbiologia;

-- Agregar columnas si la tabla ya existe y no tiene las columnas
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables 
               WHERE table_schema = 'lab_microbiologia' 
               AND table_name = 'cronograma_producto_terminado') THEN
        -- Agregar producto_nombre si no existe
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                       WHERE table_schema = 'lab_microbiologia' 
                       AND table_name = 'cronograma_producto_terminado' 
                       AND column_name = 'producto_nombre') THEN
            ALTER TABLE lab_microbiologia.cronograma_producto_terminado 
            ADD COLUMN producto_nombre VARCHAR(255);
        END IF;
        -- Agregar area si no existe
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                       WHERE table_schema = 'lab_microbiologia' 
                       AND table_name = 'cronograma_producto_terminado' 
                       AND column_name = 'area') THEN
            ALTER TABLE lab_microbiologia.cronograma_producto_terminado 
            ADD COLUMN area VARCHAR(100);
        END IF;
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS lab_microbiologia.cronograma_producto_terminado (
    id SERIAL PRIMARY KEY,
    
    -- Campos principales (obligatorios)
    -- NOTA: producto_id referencia a products(id) pero sin FK constraint por compatibilidad
    producto_id VARCHAR(50) NOT NULL,
    producto_nombre VARCHAR(255), -- Nombre del producto para mostrar en UI
    fecha_programada DATE NOT NULL,
    area VARCHAR(100), -- Área de muestreo
    responsable VARCHAR(200),
    
    -- Estado de la muestra
    estado VARCHAR(20) DEFAULT 'pending' CHECK (estado IN ('pending', 'completed', 'cancelled')),
    
    -- Fechas de auditoría
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    creado_por VARCHAR(100),
    actualizado_por VARCHAR(100)
    
    -- NOTA: Campos adicionales se agregarán en el futuro cuando se necesiten:
    -- tipo_muestreo, frecuencia, descripcion, marca_manual, etc.
);

-- Índices para búsquedas comunes
CREATE INDEX IF NOT EXISTS idx_cronograma_pt_fecha ON lab_microbiologia.cronograma_producto_terminado(fecha_programada);
CREATE INDEX IF NOT EXISTS idx_cronograma_pt_estado ON lab_microbiologia.cronograma_producto_terminado(estado);
CREATE INDEX IF NOT EXISTS idx_cronograma_pt_producto ON lab_microbiologia.cronograma_producto_terminado(producto_id);

-- Índice único para evitar duplicados del mismo producto en la misma fecha
CREATE UNIQUE INDEX IF NOT EXISTS idx_cronograma_pt_unique 
ON lab_microbiologia.cronograma_producto_terminado(producto_id, fecha_programada) 
WHERE estado != 'cancelled';

-- Trigger para actualizar fecha_actualizacion automáticamente
CREATE OR REPLACE FUNCTION lab_microbiologia.update_cronograma_pt_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.fecha_actualizacion = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_cronograma_pt_timestamp ON lab_microbiologia.cronograma_producto_terminado;

CREATE TRIGGER trg_update_cronograma_pt_timestamp
    BEFORE UPDATE ON lab_microbiologia.cronograma_producto_terminado
    FOR EACH ROW
    EXECUTE FUNCTION lab_microbiologia.update_cronograma_pt_timestamp();

-- Comentarios de documentación
COMMENT ON TABLE lab_microbiologia.cronograma_producto_terminado IS 'Cronograma de muestreo de producto terminado PL-CAL-009 - Versión simplificada';
COMMENT ON COLUMN lab_microbiologia.cronograma_producto_terminado.producto_id IS 'ID del producto a muestrear (referencia a tabla products)';
COMMENT ON COLUMN lab_microbiologia.cronograma_producto_terminado.fecha_programada IS 'Fecha en que se debe tomar la muestra';
COMMENT ON COLUMN lab_microbiologia.cronograma_producto_terminado.responsable IS 'Persona responsable de tomar la muestra';
COMMENT ON COLUMN lab_microbiologia.cronograma_producto_terminado.estado IS 'Estado de la muestra: pending, completed, cancelled';
