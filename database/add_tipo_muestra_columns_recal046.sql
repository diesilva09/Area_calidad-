-- Agregar columnas tipo_muestra y valor_muestra a la tabla resultados_microbiologicos (RE-CAL-046)
ALTER TABLE lab_microbiologia.resultados_microbiologicos
ADD COLUMN IF NOT EXISTS tipo_muestra VARCHAR(50),
ADD COLUMN IF NOT EXISTS valor_muestra VARCHAR(100);

-- Verificar que las columnas se agregaron correctamente
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'lab_microbiologia.resultados_microbiologicos'
ORDER BY ordinal_position;
