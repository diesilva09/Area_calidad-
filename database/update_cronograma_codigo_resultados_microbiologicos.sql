-- Actualizar cronograma_codigo en registros de resultados_microbiologicos existentes
-- Este script asigna el código de cronograma correcto según la tabla de origen

-- Nota: Verificar primero si la tabla resultados_microbiologicos tiene el campo cronograma_codigo
-- Si no lo tiene, es necesario agregarlo primero:

-- ALTER TABLE lab_microbiologia.resultados_microbiologicos
-- ADD COLUMN IF NOT EXISTS cronograma_codigo VARCHAR(20) DEFAULT NULL;

-- Actualizar registros desde cronograma_pt_externo (PL-CAL-009)
UPDATE lab_microbiologia.resultados_microbiologicos rm
SET cronograma_codigo = 'PL-CAL-009'
WHERE rm.cronograma_task_id IS NOT NULL
  AND rm.cronograma_codigo IS NULL
  AND EXISTS (
    SELECT 1 FROM lab_microbiologia.cronograma_pt_externo cpte
    WHERE cpte.id = rm.cronograma_task_id
  );

-- Actualizar registros desde cronograma_producto_terminado (PL-CAL-009)
UPDATE lab_microbiologia.resultados_microbiologicos rm
SET cronograma_codigo = 'PL-CAL-009'
WHERE rm.cronograma_task_id IS NOT NULL
  AND rm.cronograma_codigo IS NULL
  AND EXISTS (
    SELECT 1 FROM lab_microbiologia.cronograma_producto_terminado cpt
    WHERE cpt.id = rm.cronograma_task_id
  );

-- Actualizar registros desde cronograma_materia_prima (PL-CAL-010)
UPDATE lab_microbiologia.resultados_microbiologicos rm
SET cronograma_codigo = 'PL-CAL-010'
WHERE rm.cronograma_task_id IS NOT NULL
  AND rm.cronograma_codigo IS NULL
  AND EXISTS (
    SELECT 1 FROM lab_microbiologia.cronograma_materia_prima cmp
    WHERE cmp.id = rm.cronograma_task_id
  );

-- Actualizar registros desde cronograma_agua_potable (PL-CAL-009)
UPDATE lab_microbiologia.resultados_microbiologicos rm
SET cronograma_codigo = 'PL-CAL-009'
WHERE rm.cronograma_task_id IS NOT NULL
  AND rm.cronograma_codigo IS NULL
  AND EXISTS (
    SELECT 1 FROM lab_microbiologia.cronograma_agua_potable cap
    WHERE cap.id = rm.cronograma_task_id
  );

-- Verificar resultados
SELECT 
  rm.cronograma_codigo,
  COUNT(*) as total_registros
FROM lab_microbiologia.resultados_microbiologicos rm
WHERE rm.cronograma_task_id IS NOT NULL
GROUP BY rm.cronograma_codigo
ORDER BY rm.cronograma_codigo;
