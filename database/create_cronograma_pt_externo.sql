-- Tabla para el Cronograma de Muestreo de Producto Terminado Externo (PL-CAL-009)
-- Esquema: lab_microbiologia
-- Código: PL-CAL-009
-- Versión: 4
-- Fecha de Aprobación: 16 de diciembre 2022

-- Crear esquema si no existe
CREATE SCHEMA IF NOT EXISTS lab_microbiologia;

CREATE TABLE IF NOT EXISTS lab_microbiologia.cronograma_pt_externo (
    id SERIAL PRIMARY KEY,
    
    -- Campos principales (obligatorios)
    producto_id VARCHAR(50) NOT NULL,        -- ID del producto
    producto_nombre VARCHAR(255),             -- Nombre del producto para mostrar en UI
    fecha_programada DATE NOT NULL,          -- Fecha del muestreo
    area VARCHAR(100),                        -- Área de muestreo
    responsable VARCHAR(200),                 -- Responsable de la muestra
    
    -- Estado de la muestra
    estado VARCHAR(20) DEFAULT 'pending' CHECK (estado IN ('pending', 'completed', 'cancelled')),
    
    -- Campos adicionales
    descripcion TEXT,                         -- Observaciones adicionales
    
    -- Fechas de auditoría
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    creado_por VARCHAR(100),
    actualizado_por VARCHAR(100)
);

-- Índices para búsquedas comunes
CREATE INDEX IF NOT EXISTS idx_cronograma_pt_ext_fecha ON lab_microbiologia.cronograma_pt_externo(fecha_programada);
CREATE INDEX IF NOT EXISTS idx_cronograma_pt_ext_estado ON lab_microbiologia.cronograma_pt_externo(estado);
CREATE INDEX IF NOT EXISTS idx_cronograma_pt_ext_producto ON lab_microbiologia.cronograma_pt_externo(producto_id);

-- Índice único para evitar duplicados del mismo producto en la misma fecha
CREATE UNIQUE INDEX IF NOT EXISTS idx_cronograma_pt_ext_unique 
ON lab_microbiologia.cronograma_pt_externo(producto_id, fecha_programada) 
WHERE estado != 'cancelled';

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION lab_microbiologia.update_cronograma_pt_ext_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar updated_at automáticamente
DROP TRIGGER IF EXISTS trg_update_cronograma_pt_ext_timestamp ON lab_microbiologia.cronograma_pt_externo;

CREATE TRIGGER trg_update_cronograma_pt_ext_timestamp
    BEFORE UPDATE ON lab_microbiologia.cronograma_pt_externo
    FOR EACH ROW
    EXECUTE FUNCTION lab_microbiologia.update_cronograma_pt_ext_timestamp();

-- Comentarios de documentación
COMMENT ON TABLE lab_microbiologia.cronograma_pt_externo IS 'Cronograma de muestreo de producto terminado externo PL-CAL-009 v4 - 16/12/2022';
COMMENT ON COLUMN lab_microbiologia.cronograma_pt_externo.producto_id IS 'ID del producto a muestrear (referencia a tabla products)';
COMMENT ON COLUMN lab_microbiologia.cronograma_pt_externo.fecha_programada IS 'Fecha en que se debe tomar la muestra';
COMMENT ON COLUMN lab_microbiologia.cronograma_pt_externo.responsable IS 'Persona responsable de tomar la muestra';
COMMENT ON COLUMN lab_microbiologia.cronograma_pt_externo.estado IS 'Estado de la muestra: pending, completed, cancelled';
