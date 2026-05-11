-- Script para actualizar cronograma_codigo y cronograma_tipo en microbiologia_cronograma

-- Actualizar basado en el tipo de tarea
UPDATE lab_microbiologia.microbiologia_cronograma 
SET cronograma_codigo = 'PL-CAL-009',
    cronograma_tipo = 'externo'
WHERE tipo ILIKE '%agua%' OR tipo ILIKE '%potable%';

UPDATE lab_microbiologia.microbiologia_cronograma 
SET cronograma_codigo = 'PL-CAL-009',
    cronograma_tipo = 'externo'
WHERE tipo ILIKE '%producto%' OR tipo ILIKE '%terminado%';

UPDATE lab_microbiologia.microbiologia_cronograma 
SET cronograma_codigo = 'PL-CAL-009',
    cronograma_tipo = 'externo'
WHERE tipo ILIKE '%materia%' OR tipo ILIKE '%prima%';

-- Para otros tipos, establecer como interno
UPDATE lab_microbiologia.microbiologia_cronograma 
SET cronograma_codigo = 'PL-CAL-008',
    cronograma_tipo = 'interno'
WHERE cronograma_codigo IS NULL OR cronograma_tipo IS NULL;

-- Verificar actualizaciones
SELECT tipo, cronograma_codigo, cronograma_tipo, COUNT(*) as total
FROM lab_microbiologia.microbiologia_cronograma
GROUP BY tipo, cronograma_codigo, cronograma_tipo
ORDER BY tipo;
