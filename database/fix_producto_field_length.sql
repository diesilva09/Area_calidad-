-- =====================================================
-- CORRECCIÓN: Aumentar tamaño del campo producto
-- =====================================================

-- El error indica que el valor es demasiado largo para VARCHAR(50)
-- Los IDs de productos (UUIDs) tienen 36 caracteres, pero necesitamos más espacio

-- Aumentar el tamaño del campo producto a VARCHAR(255)
ALTER TABLE production_records 
ALTER COLUMN producto TYPE VARCHAR(255);

-- Verificar el cambio
SELECT 
    column_name, 
    data_type, 
    character_maximum_length 
FROM information_schema.columns 
WHERE table_name = 'production_records' 
AND column_name = 'producto';

-- Mostrar algunos ejemplos para verificar
SELECT producto, LENGTH(producto) as length FROM production_records LIMIT 5;
