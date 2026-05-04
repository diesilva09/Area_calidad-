-- Crear esquema si no existe
CREATE SCHEMA IF NOT EXISTS lab_microbiologia;

-- Crear tabla para cronograma de muestreo microbiológico
CREATE TABLE IF NOT EXISTS lab_microbiologia.microbiologia_cronograma (
  id SERIAL PRIMARY KEY,
  title VARCHAR(500) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  tipo VARCHAR(50) NOT NULL CHECK (tipo IN ('manipuladores', 'superficies', 'ambientes', 'otro')),
  tipo_personalizado VARCHAR(255),
  area VARCHAR(255) NOT NULL,
  area_personalizada VARCHAR(255),
  frecuencia VARCHAR(50) DEFAULT 'Diaria' CHECK (frecuencia IN ('Diaria', 'Semanal', 'Quincenal', 'Mensual')),
  responsable VARCHAR(255),
  descripcion TEXT,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'completed')),
  all_day BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by VARCHAR(255)
);

-- Crear índices para consultas comunes
CREATE INDEX IF NOT EXISTS idx_microbiologia_cronograma_fecha ON lab_microbiologia.microbiologia_cronograma(start_date);
CREATE INDEX IF NOT EXISTS idx_microbiologia_cronograma_status ON lab_microbiologia.microbiologia_cronograma(status);
CREATE INDEX IF NOT EXISTS idx_microbiologia_cronograma_tipo ON lab_microbiologia.microbiologia_cronograma(tipo);
CREATE INDEX IF NOT EXISTS idx_microbiologia_cronograma_area ON lab_microbiologia.microbiologia_cronograma(area);

-- Crear función de trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION lab_microbiologia.update_microbiologia_cronograma_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Eliminar trigger si existe
DROP TRIGGER IF EXISTS update_microbiologia_cronograma_updated_at ON lab_microbiologia.microbiologia_cronograma;

-- Crear trigger
CREATE TRIGGER update_microbiologia_cronograma_updated_at 
    BEFORE UPDATE ON lab_microbiologia.microbiologia_cronograma 
    FOR EACH ROW 
    EXECUTE FUNCTION lab_microbiologia.update_microbiologia_cronograma_updated_at();

-- Insertar algunas tareas de ejemplo para pruebas
INSERT INTO lab_microbiologia.microbiologia_cronograma (
  title, start_date, end_date, tipo, area, frecuencia, 
  responsable, descripcion, status, all_day, created_by
) VALUES
('Frotis de Manos - Operarios Línea 1', CURRENT_DATE, CURRENT_DATE, 'manipuladores', 'Preparación Salsas', 
 'Semanal', 'Ana María López', 'Toma de muestras de frotis de manos a operarios de la línea 1', 
 'pending', TRUE, 'demo@calidadcoruna.com'),

('Swab de Superficies - Mesas', CURRENT_DATE + INTERVAL '2 days', CURRENT_DATE + INTERVAL '2 days', 
 'superficies', 'Preparación Conservas', 'Diaria', 'Carlos Rodríguez', 
 'Muestreo de superficies en mesas de trabajo', 'pending', TRUE, 'demo@calidadcoruna.com'),

('Aire Ambiental - Área de Envasado', CURRENT_DATE + INTERVAL '5 days', CURRENT_DATE + INTERVAL '5 days', 
 'ambientes', 'Embalaje', 'Quincenal', 'Laura Martínez', 
 'Muestreo de calidad del aire en área de envasado', 'pending', TRUE, 'demo@calidadcoruna.com'),

('Frotis de Manos - Personal de Aseo', CURRENT_DATE - INTERVAL '3 days', CURRENT_DATE - INTERVAL '3 days', 
 'manipuladores', 'Personal de Aseo', 'Mensual', 'Ana María López', 
 'Control microbiológico mensual del personal de aseo', 'completed', TRUE, 'demo@calidadcoruna.com'),

('Swab de Dispensadores - Vestier', CURRENT_DATE + INTERVAL '1 week', CURRENT_DATE + INTERVAL '1 week', 
 'superficies', 'Dispensadores', 'Semanal', 'Carlos Rodríguez', 
 'Control de higiene en dispensadores de vestier', 'pending', TRUE, 'demo@calidadcoruna.com');
