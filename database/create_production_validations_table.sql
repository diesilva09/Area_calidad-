-- =====================================================
-- TABLA: VALIDACIONES DE PRODUCCIÓN
-- Para validar el número de muestras según la letra del tamaño de muestra
-- =====================================================

-- Eliminar tabla si existe (para desarrollo)
DROP TABLE IF EXISTS production_validations CASCADE;

-- Crear tabla de validaciones de producción
CREATE TABLE production_validations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  letra VARCHAR(10) NOT NULL UNIQUE,           -- Letra del tamaño de muestra (A, B, C, etc.)
  muestras_requeridas INTEGER NOT NULL,        -- Número de muestras requeridas
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  is_active BOOLEAN DEFAULT true
);

-- Crear índices para mejor rendimiento
CREATE INDEX idx_production_validations_letra ON production_validations(letra);
CREATE INDEX idx_production_validations_is_active ON production_validations(is_active);

-- Insertar datos según la tabla de la imagen
INSERT INTO production_validations (letra, muestras_requeridas) VALUES
('A', 2),   -- Lote 2-8 -> 2 muestras
('B', 3),   -- Lote 9-15 -> 3 muestras
('C', 5),   -- Lote 16-25 -> 5 muestras
('D', 8),   -- Lote 26-50 -> 8 muestras
('E', 13),  -- Lote 51-90 -> 13 muestras
('F', 20),  -- Lote 91-150 -> 20 muestras
('G', 32),  -- Lote 151-280 -> 32 muestras
('H', 50),  -- Lote 281-500 -> 50 muestras
('J', 80),  -- Lote 501-1200 -> 80 muestras
('K', 125), -- Lote 1201-3200 -> 125 muestras
('L', 200), -- Lote 3201-10000 -> 200 muestras;

-- Crear trigger para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_production_validations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Crear el trigger
CREATE TRIGGER update_production_validations_updated_at 
    BEFORE UPDATE ON production_validations 
    FOR EACH ROW 
    EXECUTE FUNCTION update_production_validations_updated_at();

-- Comentarios para documentación
COMMENT ON TABLE production_validations IS 'Tabla de validaciones para el número de muestras requeridas según la letra del tamaño de muestra';
COMMENT ON COLUMN production_validations.letra IS 'Letra del tamaño de muestra (A, B, C, D, E, F, G, H, J, K, L)';
COMMENT ON COLUMN production_validations.muestras_requeridas IS 'Número de muestras requeridas según la letra';

-- Verificar la creación de la tabla y los datos
SELECT 
    letra, 
    muestras_requeridas,
    created_at
FROM production_validations 
ORDER BY letra;

-- Mostrar resumen
SELECT 
    COUNT(*) as total_registros,
    MIN(muestras_requeridas) as min_muestras,
    MAX(muestras_requeridas) as max_muestras
FROM production_validations 
WHERE is_active = true;
