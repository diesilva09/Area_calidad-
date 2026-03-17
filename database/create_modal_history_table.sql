-- Crear tabla para historial de versiones de modales
CREATE TABLE IF NOT EXISTS modal_history (
    id VARCHAR(36) PRIMARY KEY,
    modal_type VARCHAR(20) NOT NULL,
    version INTEGER NOT NULL,
    format VARCHAR(50) NOT NULL,
    type VARCHAR(100) NOT NULL,
    approval_date VARCHAR(100) NOT NULL,
    changes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(100)
);

-- Insertar versión inicial para cada tipo de modal
INSERT INTO modal_history (id, modal_type, version, format, type, approval_date, changes, created_by) VALUES
    ('initial-production', 'production', 1, 'RE-CAL-084', 'CONSOLIDADO VERIFICACIÓN PROCESO DE PRODUCCIÓN', '01 DE JUNIO DE 2025', '[]', CURRENT_TIMESTAMP, 'system'),
    ('initial-embalaje', 'embalaje', 1, 'RE-CAL-093', 'CONSOLIDADO CALIDAD DE PRODUCTO TERMINADO-EMBALAJE', '21 DE MARZO DE 2023', '[]', CURRENT_TIMESTAMP, 'system'),
    ('initial-limpieza', 'limpieza', 1, 'RE-CAL-037', 'CONSOLIDADO VERIFICACIÓN ORDEN, LIMPIEZA Y DESINFECCIÓN 2026', '21 DE MARZO DE 2023', '[]', CURRENT_TIMESTAMP, 'system'),
    ('initial-cronograma', 'cronograma', 1, 'PL-CAL-013', 'CRONOGRAMA ATP 2026', '21 DE MARZO DE 2023', '[]', CURRENT_TIMESTAMP, 'system')
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- AGREGAR CAMPOS DE RANGOS DE CALIDAD A TABLA PRODUCTS
-- Agregar calidad_rangos_config como JSONB directamente en products
-- =====================================================

-- 1. Eliminar tabla separada si existe (por si acaso)
DROP TABLE IF EXISTS calidad_rangos_config CASCADE;

-- 2. Agregar campo calidad_rangos_config a la tabla products
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS calidad_rangos_config JSONB DEFAULT '[]';

-- 3. Crear índice para el nuevo campo
CREATE INDEX IF NOT EXISTS idx_products_calidad_rangos_config ON products USING GIN(calidad_rangos_config);

-- 4. Verificar estructura final de la tabla products
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'products' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 5. Verificar datos de ejemplo
SELECT 
    p.id,
    p.name,
    p.pesos_config,
    p.temperaturas_config,
    p.calidad_rangos_config
FROM products p
WHERE p.pesos_config != '[]' OR p.temperaturas_config != '[]' OR p.calidad_rangos_config != '[]'
LIMIT 3;



-- 6. Conteo de productos con configuración
SELECT 
    'ESTADO FINAL' as status,
    COUNT(*) as total_productos,
    COUNT(CASE WHEN pesos_config != '[]' THEN 1 END) as con_pesos_config,
    COUNT(CASE WHEN temperaturas_config != '[]' THEN 1 END) as con_temperaturas_config,
    COUNT(CASE WHEN calidad_rangos_config != '[]' THEN 1 END) as con_calidad_rangos_config
FROM products;
