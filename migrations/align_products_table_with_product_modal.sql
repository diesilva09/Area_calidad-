-- =====================================================
-- MIGRACIÓN: Alinear tabla products con el modal/API actual
-- Asegura columnas JSONB para configuraciones y defaults consistentes
-- =====================================================

-- 1. Asegurar columnas de configuración en products
ALTER TABLE products
ADD COLUMN IF NOT EXISTS pesos_config JSONB DEFAULT '[]';

ALTER TABLE products
ADD COLUMN IF NOT EXISTS temperaturas_config JSONB DEFAULT '[]';

ALTER TABLE products
ADD COLUMN IF NOT EXISTS calidad_rangos_config JSONB DEFAULT '[]';

-- 2. Asegurar índices GIN para búsquedas/consultas en JSONB
CREATE INDEX IF NOT EXISTS idx_products_pesos_config ON products USING GIN(pesos_config);
CREATE INDEX IF NOT EXISTS idx_products_temperaturas_config ON products USING GIN(temperaturas_config);
CREATE INDEX IF NOT EXISTS idx_products_calidad_rangos_config ON products USING GIN(calidad_rangos_config);

-- 3. Normalizar defaults antiguos (por si existían '{}' en vez de '[]')
UPDATE products SET pesos_config = '[]'::jsonb WHERE pesos_config = '{}'::jsonb;
UPDATE products SET temperaturas_config = '[]'::jsonb WHERE temperaturas_config = '{}'::jsonb;

-- 4. Verificación rápida de estructura
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'products'
AND table_schema = 'public'
ORDER BY ordinal_position;
