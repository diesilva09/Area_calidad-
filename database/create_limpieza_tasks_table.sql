-- Crear tabla para labores de limpieza
CREATE TABLE IF NOT EXISTS limpieza_tasks (
  id SERIAL PRIMARY KEY,
  area VARCHAR(255) NOT NULL,
  tipo_muestra VARCHAR(255) NOT NULL,
  detalles TEXT,
  fecha DATE NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'completed')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by VARCHAR(255)
);

-- Crear índices
CREATE INDEX IF NOT EXISTS idx_limpieza_fecha ON limpieza_tasks(fecha);
CREATE INDEX IF NOT EXISTS idx_limpieza_status ON limpieza_tasks(status);
CREATE INDEX IF NOT EXISTS idx_limpieza_area ON limpieza_tasks(area);

-- Crear trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_limpieza_tasks_updated_at 
    BEFORE UPDATE ON limpieza_tasks 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();
    
-- Insertar algunas labores de ejemplo para pruebas
INSERT INTO limpieza_tasks (area, tipo_muestra, detalles, fecha, status, created_by) VALUES
('PREPARACIÓN DE SALSAS', 'Superficie', 'Limpieza de mesas de trabajo y equipos', CURRENT_DATE - INTERVAL '2 days', 'completed', 'demo@calidadcoruna.com'),
('MICROPESAJE', 'Equipo', 'Desinfección de balanzas y microscopios', CURRENT_DATE - INTERVAL '2 days', 'pending', 'demo@calidadcoruna.com'),
('PLANTA', 'Superficie', 'Limpieza general del área de producción', CURRENT_DATE + INTERVAL '1 day', 'pending', 'demo@calidadcoruna.com'),
('ENVASADO DE CONSERVAS (TECNOPACK)', 'Equipo', 'Limpieza de la línea de envasado', CURRENT_DATE, 'pending', 'demo@calidadcoruna.com'),
('MANTENIMIENTO', 'Herramientas', 'Limpieza y organización de herramientas', CURRENT_DATE, 'completed', 'demo@calidadcoruna.com');
