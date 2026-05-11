-- Script para verificar todos los datos en microbiologia_cronograma

SELECT COUNT(*) as total_registros
FROM lab_microbiologia.microbiologia_cronograma;

-- Verificar todos los registros
SELECT 
  id,
  tipo,
  tipo_personalizado,
  area,
  cronograma_codigo,
  cronograma_tipo,
  start_date
FROM lab_microbiologia.microbiologia_cronograma
ORDER BY start_date DESC
LIMIT 20;
