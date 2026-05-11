-- Script para diagnosticar los datos en microbiologia_cronograma
-- Verificar las tareas que están causando el problema

SELECT 
  id,
  tipo,
  tipo_personalizado,
  area,
  cronograma_codigo,
  cronograma_tipo,
  start_date
FROM lab_microbiologia.microbiologia_cronograma
WHERE tipo ILIKE '%producto%'
  OR tipo ILIKE '%terminado%'
ORDER BY start_date DESC
LIMIT 20;
