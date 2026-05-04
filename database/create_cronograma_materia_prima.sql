-- Tabla para el Cronograma de Materia Prima
-- Esquema: lab_microbiologia
-- Versión: 1

-- Crear esquema si no existe
CREATE SCHEMA IF NOT EXISTS lab_microbiologia;

CREATE TABLE IF NOT EXISTS lab_microbiologia.cronograma_materia_prima (
    id SERIAL PRIMARY KEY,
    
    -- Campos principales
    producto_id VARCHAR(50) NOT NULL,
    producto_nombre VARCHAR(255),
    tipo_materia VARCHAR(50) NOT NULL CHECK (tipo_materia IN ('Materia fresca', 'Insumo proveedores', 'Insumo proveedores Importados')),
    fecha_programada DATE NOT NULL,
    responsable VARCHAR(200),
    
    -- Estado de la muestra
    estado VARCHAR(20) DEFAULT 'pending' CHECK (estado IN ('pending', 'completed', 'cancelled')),
    
    -- Campos adicionales
    descripcion TEXT,
    
    -- Fechas de auditoría
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    creado_por VARCHAR(100),
    actualizado_por VARCHAR(100)
);

-- Índices para búsquedas comunes
CREATE INDEX IF NOT EXISTS idx_cronograma_mp_fecha ON lab_microbiologia.cronograma_materia_prima(fecha_programada);
CREATE INDEX IF NOT EXISTS idx_cronograma_mp_estado ON lab_microbiologia.cronograma_materia_prima(estado);
CREATE INDEX IF NOT EXISTS idx_cronograma_mp_producto ON lab_microbiologia.cronograma_materia_prima(producto_id);
CREATE INDEX IF NOT EXISTS idx_cronograma_mp_tipo ON lab_microbiologia.cronograma_materia_prima(tipo_materia);

-- Índice único para evitar duplicados del mismo producto en la misma fecha
CREATE UNIQUE INDEX IF NOT EXISTS idx_cronograma_mp_unique 
ON lab_microbiologia.cronograma_materia_prima(producto_id, fecha_programada) 
WHERE estado != 'cancelled';

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION lab_microbiologia.update_cronograma_mp_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar updated_at automáticamente
DROP TRIGGER IF EXISTS trg_update_cronograma_mp_timestamp ON lab_microbiologia.cronograma_materia_prima;

CREATE TRIGGER trg_update_cronograma_mp_timestamp
    BEFORE UPDATE ON lab_microbiologia.cronograma_materia_prima
    FOR EACH ROW
    EXECUTE FUNCTION lab_microbiologia.update_cronograma_mp_timestamp();

-- Comentarios de documentación
COMMENT ON TABLE lab_microbiologia.cronograma_materia_prima IS 'Cronograma de muestreo de materia prima - Versión 1';
COMMENT ON COLUMN lab_microbiologia.cronograma_materia_prima.tipo_materia IS 'Tipo de materia: Materia fresca, Insumo proveedores, Insumo proveedores Importados';
