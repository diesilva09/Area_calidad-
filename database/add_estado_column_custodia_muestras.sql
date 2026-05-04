-- Agregar columna estado a la tabla custodia_muestras
ALTER TABLE lab_microbiologia.custodia_muestras 
ADD COLUMN IF NOT EXISTS estado VARCHAR(20) DEFAULT 'pendiente';

-- Permitir nulos en campos que se completarán después (para registros pendientes)
ALTER TABLE lab_microbiologia.custodia_muestras 
ALTER COLUMN toma_muestra_hora DROP NOT NULL;

ALTER TABLE lab_microbiologia.custodia_muestras 
ALTER COLUMN recepcion_lab_hora DROP NOT NULL;

-- Crear índice para búsquedas por estado
CREATE INDEX IF NOT EXISTS idx_custodia_muestras_estado 
ON lab_microbiologia.custodia_muestras(estado);

-- Actualizar registros existentes para que tengan estado 'completado'
UPDATE lab_microbiologia.custodia_muestras 
SET estado = 'completado' 
WHERE estado IS NULL OR estado = '';

-- Verificar la columna
SELECT column_name, data_type, column_default, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'custodia_muestras' 
AND column_name IN ('estado', 'toma_muestra_hora', 'recepcion_lab_hora');