-- Agregar columna cronograma_task_id a tabla existente en lab_microbiologia
ALTER TABLE lab_microbiologia.custodia_muestras 
ADD COLUMN IF NOT EXISTS cronograma_task_id INTEGER;

CREATE INDEX IF NOT EXISTS idx_custodia_muestras_cronograma_task_id 
ON lab_microbiologia.custodia_muestras(cronograma_task_id);
