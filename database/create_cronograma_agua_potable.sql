-- Crear tabla para cronograma de agua potable (PL-CAL-009 Externo)
-- Este cronograma maneja muestreos de agua potable realizados por laboratorios externos

CREATE TABLE IF NOT EXISTS lab_microbiologia.cronograma_agua_potable (
    id SERIAL PRIMARY KEY,
    area VARCHAR(100) NOT NULL,              -- Punto de agua (19 opciones)
    ubicacion VARCHAR(50) NOT NULL,          -- Ubicación (4 opciones)
    fecha_programada DATE NOT NULL,          -- Fecha del muestreo
    responsable VARCHAR(100),                -- Responsable de la muestra
    estado VARCHAR(20) DEFAULT 'pending',  -- pending, completed, cancelled
    marca_manual VARCHAR(20) DEFAULT NULL,  -- externo, alergenos, NULL
    descripcion TEXT,                        -- Observaciones adicionales
    creado_por VARCHAR(100),
    actualizado_por VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Comentarios de la tabla
COMMENT ON TABLE lab_microbiologia.cronograma_agua_potable IS 'Cronograma de muestreo de agua potable (PL-CAL-009 Externo)';
COMMENT ON COLUMN lab_microbiologia.cronograma_agua_potable.area IS 'Punto de agua: preparación Salsas, marmitas Conservas, etc.';
COMMENT ON COLUMN lab_microbiologia.cronograma_agua_potable.ubicacion IS 'Planta dos producción, Planta uno producción, Bodega PT, Mantenimiento';
COMMENT ON COLUMN lab_microbiologia.cronograma_agua_potable.marca_manual IS 'Marca manual: externo (Realizado Externo), alergenos (Alérgenos)';

-- Índices útiles
CREATE INDEX IF NOT EXISTS idx_cronograma_agua_fecha ON lab_microbiologia.cronograma_agua_potable(fecha_programada);
CREATE INDEX IF NOT EXISTS idx_cronograma_agua_estado ON lab_microbiologia.cronograma_agua_potable(estado);
CREATE INDEX IF NOT EXISTS idx_cronograma_agua_marca ON lab_microbiologia.cronograma_agua_potable(marca_manual) WHERE marca_manual IS NOT NULL;

-- Función para actualizar timestamp
CREATE OR REPLACE FUNCTION lab_microbiologia.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para actualizar updated_at automáticamente
DROP TRIGGER IF EXISTS update_cronograma_agua_updated_at ON lab_microbiologia.cronograma_agua_potable;
CREATE TRIGGER update_cronograma_agua_updated_at
    BEFORE UPDATE ON lab_microbiologia.cronograma_agua_potable
    FOR EACH ROW
    EXECUTE FUNCTION lab_microbiologia.update_updated_at_column();
