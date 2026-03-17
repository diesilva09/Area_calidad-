-- Tabla para relacionar productos con envases y sus tiempos de vencimiento específicos
-- Cada producto tiene sus propios meses de vencimiento según el tipo de envase

CREATE TABLE producto_envase_vencimiento (
    id SERIAL PRIMARY KEY,
    producto_id VARCHAR(100) NOT NULL,     -- ID del producto (relacionado con tabla products)
    envase_tipo VARCHAR(50) NOT NULL,      -- Tipo de envase (Vidrio, Lata, Bolsa, etc.)
    meses_vencimiento INTEGER NOT NULL,    -- Meses específicos para esa combinación producto-envase
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraint único para evitar duplicados de producto-envase
    UNIQUE(producto_id, envase_tipo)
);

-- Crear índice para búsquedas rápidas por producto
CREATE INDEX idx_producto_envase_producto_id ON producto_envase_vencimiento(producto_id);

-- Crear índice para búsquedas por tipo de envase
CREATE INDEX idx_producto_envase_tipo ON producto_envase_vencimiento(envase_tipo);

-- Trigger para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_producto_envase_vencimiento_updated_at 
    BEFORE UPDATE ON producto_envase_vencimiento 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Ejemplos de datos para probar (puedes ajustar según tus productos)
INSERT INTO producto_envase_vencimiento (producto_id, envase_tipo, meses_vencimiento) VALUES
-- Ejemplo: Brevas
('000001', 'Vidrio', 24),
('000001', 'Lata', 36),
('000001', 'Bolsa', 6),

-- Ejemplo: Ciruelas  
('000002', 'Vidrio', 12),
('000002', 'Lata', 18),
('000002', 'Bolsa', 4),

-- Ejemplo: Aceitunas
('000003', 'Vidrio', 30),
('000003', 'Lata', 48),
('000003', 'Bolsa', 8),

-- Ejemplo: Mermelada
('000004', 'Vidrio', 24),
('000004', 'Lata', 36),
('000004', 'Bolsa', 12);

-- Verificar la estructura de la tabla
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'producto_envase_vencimiento' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Verificar los datos insertados
SELECT * FROM producto_envase_vencimiento ORDER BY producto_id, envase_tipo;
