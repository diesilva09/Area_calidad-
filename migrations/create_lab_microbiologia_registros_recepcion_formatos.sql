-- Crear esquema si no existe
CREATE SCHEMA IF NOT EXISTS lab_microbiologia;

-- Tabla: registros_recepcion_formatos
CREATE TABLE IF NOT EXISTS lab_microbiologia.registros_recepcion_formatos (
    id SERIAL PRIMARY KEY,
    fecha_entrega DATE NOT NULL,
    fecha_registros DATE NOT NULL,
    codigo_version_registros VARCHAR(100) NOT NULL,
    numero_folios VARCHAR(50) NOT NULL,
    nombre_quien_entrega VARCHAR(255) NOT NULL,
    nombre_quien_recibe VARCHAR(255) NOT NULL,
    observaciones TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_rrformatos_fecha_entrega
    ON lab_microbiologia.registros_recepcion_formatos(fecha_entrega DESC);

CREATE INDEX IF NOT EXISTS idx_rrformatos_codigo_version
    ON lab_microbiologia.registros_recepcion_formatos(codigo_version_registros);

CREATE INDEX IF NOT EXISTS idx_rrformatos_created_at
    ON lab_microbiologia.registros_recepcion_formatos(created_at DESC);

