-- =====================================================
-- MIGRACIÓN: Agregar rangos de calidad y limpiar tablas antiguas
-- Agregar campos de rangos de calidad a productos y eliminar tablas separadas
-- =====================================================

-- 1. Agregar campos de rangos de calidad a la tabla productos
ALTER TABLE productos 
ADD COLUMN IF NOT EXISTS calidad_rangos_config JSONB DEFAULT '[]';

-- 2. Crear índice para el nuevo campo
CREATE INDEX IF NOT EXISTS idx_productos_calidad_rangos_config ON productos USING GIN(calidad_rangos_config);

-- 3. Migrar datos existentes a la nueva estructura consolidada
-- (Esta migración asume que ya ejecutamos la migración anterior que consolidó pesos y temperaturas)

-- 4. Verificar estado actual de la migración
SELECT 
    'MIGRACIÓN CALIDAD RANGOS COMPLETADA' as status,
    COUNT(*) as total_productos,
    COUNT(CASE WHEN pesos_config != '[]' THEN 1 END) as con_pesos_config,
    COUNT(CASE WHEN temperaturas_config != '[]' THEN 1 END) as con_temperaturas_config,
    COUNT(CASE WHEN calidad_rangos_config != '[]' THEN 1 END) as con_calidad_rangos_config
FROM productos;

-- 5. Mostrar ejemplo de datos consolidados
SELECT 
    p.producto_id,
    p.nombre,
    p.pesos_config,
    p.temperaturas_config,
    p.calidad_rangos_config
FROM productos p
WHERE p.pesos_config != '[]' OR p.temperaturas_config != '[]' OR p.calidad_rangos_config != '[]'
LIMIT 3;

-- =====================================================
-- LIMPIEZA: Eliminar tablas antiguas (descomentar después de verificar)
-- =====================================================

-- 6. Backup de datos antes de eliminar (opcional pero recomendado)
-- CREATE TABLE producto_pesos_config_backup AS SELECT * FROM producto_pesos_config;
-- CREATE TABLE temperatura_envasado_salsas_backup AS SELECT * FROM temperatura_envasado_salsas;

-- 7. Eliminar tablas antiguas (¡EJECUTAR CON PRECAUCIÓN!)
-- DROP TABLE IF EXISTS producto_pesos_config CASCADE;
-- DROP TABLE IF EXISTS temperatura_envasado_salsas CASCADE;

-- 8. Verificar que las tablas han sido eliminadas
-- SELECT table_name 
-- FROM information_schema.tables 
-- WHERE table_schema = 'public' 
-- AND table_name IN ('producto_pesos_config', 'temperatura_envasado_salsas');

-- =====================================================
-- VERIFICACIÓN FINAL
-- =====================================================

-- 9. Verificar estructura final de la tabla productos
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'productos' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 10. Verificar integridad de datos
SELECT 
    COUNT(*) as total_productos,
    COUNT(CASE WHEN pesos_config IS NOT NULL AND pesos_config != '[]' THEN 1 END) as productos_con_pesos,
    COUNT(CASE WHEN temperaturas_config IS NOT NULL AND temperaturas_config != '[]' THEN 1 END) as productos_con_temperaturas,
    COUNT(CASE WHEN calidad_rangos_config IS NOT NULL AND calidad_rangos_config != '[]' THEN 1 END) as productos_con_calidad_rangos
FROM productos;
