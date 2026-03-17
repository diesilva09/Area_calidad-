-- =====================================================
-- MIGRACIÓN: Actualizar campo producto a producto_id
-- =====================================================

-- Paso 1: Agregar nueva columna producto_id
ALTER TABLE production_records 
ADD COLUMN producto_id VARCHAR(255);

-- Paso 2: Copiar datos de producto a producto_id (si los datos actuales son IDs)
-- NOTA: Si los datos actuales son nombres de productos, necesitarás mapearlos manualmente
UPDATE production_records 
SET producto_id = producto;

-- Paso 3: Hacer producto_id NOT NULL después de verificar que todos los datos se copiaron correctamente
-- ALTER TABLE production_records 
-- ALTER COLUMN producto_id SET NOT NULL;

-- Paso 4: Opcional: Eliminar la columna antigua después de verificar que todo funciona
-- ALTER TABLE production_records 
-- DROP COLUMN producto;

-- Paso 5: Renombrar producto_id a producto para mantener consistencia
-- ALTER TABLE production_records 
-- RENAME COLUMN producto_id TO producto;

-- Comentarios para documentación
COMMENT ON COLUMN production_records.producto IS 'ID del producto (inmutable)';
COMMENT ON COLUMN production_records.producto_id IS 'ID del producto (inmutable)';

-- Verificar los cambios
SELECT producto, producto_id FROM production_records LIMIT 5;
