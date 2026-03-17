-- =====================================================
-- TABLA: VALIDACIONES DE PRODUCCIÓN
-- Para validar el número de muestras según la letra del tamaño de muestra
-- =====================================================

-- Eliminar tabla si existe
DROP TABLE IF EXISTS production_validations;

-- Crear tabla de validaciones de producción
CREATE TABLE production_validations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  letra VARCHAR(10) NOT NULL UNIQUE,
  muestras_requeridas INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  is_active BOOLEAN DEFAULT true
);

-- Insertar datos según la tabla
INSERT INTO production_validations (letra, muestras_requeridas) VALUES
('A', 2),
('B', 3),
('C', 5),
('D', 8),
('E', 13),
('F', 20),
('G', 32),
('H', 50),
('J', 80),
('K', 125),
('L', 200);

-- Verificar los datos insertados
SELECT * FROM production_validations ORDER BY letra;
