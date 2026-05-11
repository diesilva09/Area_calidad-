-- ========================================
-- Add cronograma_codigo field to custodia_muestras and resultados_microbiologicos
-- This allows tracking which cronograma a record was generated from
-- ========================================

-- Add cronograma_codigo to custodia_muestras (RE-CAL-107)
ALTER TABLE lab_microbiologia.custodia_muestras
ADD COLUMN IF NOT EXISTS cronograma_codigo VARCHAR(50);

-- Add cronograma_codigo to resultados_microbiologicos (RE-CAL-046)
ALTER TABLE lab_microbiologia.resultados_microbiologicos
ADD COLUMN IF NOT EXISTS cronograma_codigo VARCHAR(50);

-- Create indexes for better querying
CREATE INDEX IF NOT EXISTS idx_custodia_muestras_cronograma_codigo 
ON lab_microbiologia.custodia_muestras(cronograma_codigo);

CREATE INDEX IF NOT EXISTS idx_resultados_microbiologicos_cronograma_codigo 
ON lab_microbiologia.resultados_microbiologicos(cronograma_codigo);

-- Update existing records that were generated from PL-CAL-008
UPDATE lab_microbiologia.custodia_muestras
SET cronograma_codigo = 'PL-CAL-008'
WHERE cronograma_task_id IS NOT NULL 
AND observaciones LIKE '%PL-CAL-008%'
AND cronograma_codigo IS NULL;

UPDATE lab_microbiologia.resultados_microbiologicos
SET cronograma_codigo = 'PL-CAL-008'
WHERE cronograma_task_id IS NOT NULL 
AND observaciones LIKE '%PL-CAL-008%'
AND cronograma_codigo IS NULL;
