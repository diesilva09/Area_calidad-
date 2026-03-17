-- Tabla para almacenar equipos de producción
CREATE TABLE IF NOT EXISTS equipos (
    id SERIAL PRIMARY KEY,
    area VARCHAR(50) NOT NULL CHECK (area IN ('Salsas', 'Conservas')),
    codigo VARCHAR(50) NOT NULL UNIQUE,
    nombre VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla para almacenar partes de los equipos
CREATE TABLE IF NOT EXISTS equipo_partes (
    id SERIAL PRIMARY KEY,
    equipo_id INTEGER NOT NULL REFERENCES equipos(id) ON DELETE CASCADE,
    nombre VARCHAR(255) NOT NULL,
    observaciones TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_equipos_area ON equipos(area);
CREATE INDEX IF NOT EXISTS idx_equipos_codigo ON equipos(codigo);
CREATE INDEX IF NOT EXISTS idx_equipo_partes_equipo_id ON equipo_partes(equipo_id);

-- Trigger para actualizar el campo updated_at en equipos
CREATE OR REPLACE FUNCTION update_equipos_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER trigger_update_equipos_updated_at
    BEFORE UPDATE ON equipos
    FOR EACH ROW
    EXECUTE FUNCTION update_equipos_updated_at();

-- Trigger para actualizar el campo updated_at en equipo_partes
CREATE OR REPLACE FUNCTION update_equipo_partes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER trigger_update_equipo_partes_updated_at
    BEFORE UPDATE ON equipo_partes
    FOR EACH ROW
    EXECUTE FUNCTION update_equipo_partes_updated_at();
