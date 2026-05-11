-- Actualizar cronograma_codigo en registros de custodia_muestras existentes
-- Este script asigna el código de cronograma correcto según la tabla de origen

-- Actualizar registros desde cronograma_pt_externo (PL-CAL-009)
UPDATE lab_microbiologia.custodia_muestras cm
SET cronograma_codigo = 'PL-CAL-009'
WHERE cm.cronograma_task_id IS NOT NULL
  AND cm.cronograma_codigo IS NULL
  AND EXISTS (
    SELECT 1 FROM lab_microbiologia.cronograma_pt_externo cpte
    WHERE cpte.id = cm.cronograma_task_id
  );

-- Actualizar registros desde cronograma_producto_terminado (PL-CAL-009)
UPDATE lab_microbiologia.custodia_muestras cm
SET cronograma_codigo = 'PL-CAL-009'
WHERE cm.cronograma_task_id IS NOT NULL
  AND cm.cronograma_codigo IS NULL
  AND EXISTS (
    SELECT 1 FROM lab_microbiologia.cronograma_producto_terminado cpt
    WHERE cpt.id = cm.cronograma_task_id
  );

-- Actualizar registros desde cronograma_materia_prima (PL-CAL-010)
UPDATE lab_microbiologia.custodia_muestras cm
SET cronograma_codigo = 'PL-CAL-010'
WHERE cm.cronograma_task_id IS NOT NULL
  AND cm.cronograma_codigo IS NULL
  AND EXISTS (
    SELECT 1 FROM lab_microbiologia.cronograma_materia_prima cmp
    WHERE cmp.id = cm.cronograma_task_id
  );

-- Actualizar registros desde cronograma_agua_potable (PL-CAL-009)
UPDATE lab_microbiologia.custodia_muestras cm
SET cronograma_codigo = 'PL-CAL-009'
WHERE cm.cronograma_task_id IS NOT NULL
  AND cm.cronograma_codigo IS NULL
  AND EXISTS (
    SELECT 1 FROM lab_microbiologia.cronograma_agua_potable cap
    WHERE cap.id = cm.cronograma_task_id
  );

-- Verificar resultados
SELECT 
  cm.cronograma_codigo,
  COUNT(*) as total_registros
FROM lab_microbiologia.custodia_muestras cm
WHERE cm.cronograma_task_id IS NOT NULL
GROUP BY cm.cronograma_codigo
ORDER BY cm.cronograma_codigo;
