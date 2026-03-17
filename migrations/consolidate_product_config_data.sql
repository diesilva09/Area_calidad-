-- =====================================================
-- MIGRACIÓN: Consolidar datos de configuración en tabla productos
-- Mover campos de producto_pesos_config y temperatura_envasado_salsas
-- directamente a la tabla productos
-- =====================================================

-- 1. Añadir campos de configuración de pesos a la tabla productos
ALTER TABLE productos 
ADD COLUMN IF NOT EXISTS pesos_config JSONB DEFAULT '{}';

-- 2. Añadir campos de configuración de temperaturas a la tabla productos  
ALTER TABLE productos 
ADD COLUMN IF NOT EXISTS temperaturas_config JSONB DEFAULT '{}';

-- 3. Crear índices para los nuevos campos
CREATE INDEX IF NOT EXISTS idx_productos_pesos_config ON productos USING GIN(pesos_config);
CREATE INDEX IF NOT EXISTS idx_productos_temperaturas_config ON productos USING GIN(temperaturas_config);

-- 4. Migrar datos de producto_pesos_config a productos
UPDATE productos p 
SET pesos_config = COALESCE(
    (
        SELECT jsonb_agg(
            jsonb_build_object(
                'envase_tipo', pp.envase_tipo,
                'peso_drenado_declarado', pp.peso_drenado_declarado,
                'peso_drenado_min', pp.peso_drenado_min,
                'peso_drenado_max', pp.peso_drenado_max,
                'peso_neto_declarado', pp.peso_neto_declarado,
                'categoria_id', pp.categoria_id
            )
        )
        FROM producto_pesos_config pp 
        WHERE pp.producto_id = p.producto_id
    ),
    '{}'::jsonb
)
WHERE EXISTS (
    SELECT 1 FROM producto_pesos_config pp 
    WHERE pp.producto_id = p.producto_id
);

-- 5. Migrar datos de temperatura_envasado_salsas a productos
UPDATE productos p 
SET temperaturas_config = COALESCE(
    (
        SELECT jsonb_agg(
            jsonb_build_object(
                'envase_tipo', te.envase_tipo,
                'temperatura_min', te.temperatura_min,
                'temperatura_max', te.temperatura_max
            )
        )
        FROM temperatura_envasado_salsas te 
        WHERE te.producto_id = p.producto_id
    ),
    '{}'::jsonb
)
WHERE EXISTS (
    SELECT 1 FROM temperatura_envasado_salsas te 
    WHERE te.producto_id = p.producto_id
);

-- 6. Verificar migración
SELECT 
    'MIGRACIÓN COMPLETADA' as status,
    COUNT(*) as total_productos,
    COUNT(CASE WHEN pesos_config != '{}' THEN 1 END) as con_pesos_config,
    COUNT(CASE WHEN temperaturas_config != '{}' THEN 1 END) as con_temperaturas_config
FROM productos;

-- 7. Mostrar ejemplos de datos migrados
SELECT 
    p.producto_id,
    p.nombre,
    p.pesos_config,
    p.temperaturas_config
FROM productos p 
WHERE p.pesos_config != '{}' OR p.temperaturas_config != '{}'
ORDER BY p.producto_id
LIMIT 5;

-- =====================================================
-- NOTA: Después de verificar que la migración funciona correctamente,
-- puedes eliminar las tablas originales si ya no son necesarias:
-- 
-- DROP TABLE IF EXISTS producto_pesos_config;
-- DROP TABLE IF EXISTS temperatura_envasado_salsas;
-- =====================================================
