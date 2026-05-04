-- Agregar columnas tipo_muestra y valor_muestra a la tabla custodia_muestras
ALTER TABLE custodia_muestras
ADD COLUMN IF NOT EXISTS tipo_muestra VARCHAR(50),
ADD COLUMN IF NOT EXISTS valor_muestra VARCHAR(100);

-- Verificar que las columnas se agregaron correctamente
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'custodia_muestras' 
ORDER BY ordinal_position;
