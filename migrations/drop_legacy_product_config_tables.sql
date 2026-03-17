-- =====================================================
-- CLEANUP: Eliminar tablas legacy de configuración de productos
-- Ejecutar SOLO después de desplegar el código que ya usa JSONB en products
-- (products.pesos_config y products.temperaturas_config)
-- =====================================================

-- Opcional (recomendado): backups antes de eliminar
-- CREATE TABLE IF NOT EXISTS producto_pesos_config_backup AS SELECT * FROM producto_pesos_config;
-- CREATE TABLE IF NOT EXISTS temperatura_envasado_salsas_backup AS SELECT * FROM temperatura_envasado_salsas;

DROP TABLE IF EXISTS producto_pesos_config CASCADE;
DROP TABLE IF EXISTS temperatura_envasado_salsas CASCADE;
