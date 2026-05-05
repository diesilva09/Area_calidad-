-- ============================================================================
-- Tabla: materia_prima_productos
-- Descripción: Catálogo de productos de materia prima para el cronograma
-- PL-CAL-010 - Plan de Muestreo Materia Prima
-- ============================================================================

CREATE TABLE IF NOT EXISTS lab_microbiologia.materia_prima_productos (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Índice para búsquedas por nombre
CREATE INDEX IF NOT EXISTS idx_materia_prima_productos_nombre 
    ON lab_microbiologia.materia_prima_productos(nombre);

-- Trigger para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION lab_microbiologia.update_materia_prima_productos_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_materia_prima_productos_timestamp 
    ON lab_microbiologia.materia_prima_productos;

CREATE TRIGGER trg_update_materia_prima_productos_timestamp
    BEFORE UPDATE ON lab_microbiologia.materia_prima_productos
    FOR EACH ROW
    EXECUTE FUNCTION lab_microbiologia.update_materia_prima_productos_timestamp();

-- Comentarios de documentación
COMMENT ON TABLE lab_microbiologia.materia_prima_productos IS 
    'Catálogo de productos de materia prima para el cronograma PL-CAL-010';

COMMENT ON COLUMN lab_microbiologia.materia_prima_productos.id IS 
    'ID único del producto (autoincremental)';

COMMENT ON COLUMN lab_microbiologia.materia_prima_productos.nombre IS 
    'Nombre del producto de materia prima';

COMMENT ON COLUMN lab_microbiologia.materia_prima_productos.created_at IS 
    'Fecha y hora de creación del registro';

COMMENT ON COLUMN lab_microbiologia.materia_prima_productos.updated_at IS 
    'Fecha y hora de última actualización del registro';

-- ============================================================================
-- Datos de ejemplo (opcional - eliminar si no se necesitan)
-- ============================================================================

-- Ejemplos de materia prima fresca:
-- INSERT INTO lab_microbiologia.materia_prima_productos (nombre) VALUES
--     ('Tomate fresco'),
--     ('Cebolla'),
--     ('Pimiento'),
--     ('Ajo'),
--     ('Cilantro');

-- Ejemplos de insumos de proveedores:
-- INSERT INTO lab_microbiologia.materia_prima_productos (nombre) VALUES
--     ('Sal refinada'),
--     ('Azúcar'),
--     ('Vinagre'),
--     ('Aceite vegetal'),
--     ('Especias mixtas');

-- Ejemplos de insumos importados:
-- INSERT INTO lab_microbiologia.materia_prima_productos (nombre) VALUES
--     ('Aceite de oliva extra virgen'),
--     ('Especies importadas'),
--     ('Conservantes alimentarios'),
--     ('Colorantes naturales');
