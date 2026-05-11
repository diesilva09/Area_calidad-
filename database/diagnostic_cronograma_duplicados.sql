-- Script de diagnóstico para detectar tareas duplicadas en el cronograma de microbiología

-- 1. Verificar si hay tareas con el mismo ID (no debería haber)
SELECT 
    id,
    COUNT(*) as cantidad
FROM lab_microbiologia.microbiologia_cronograma
GROUP BY id
HAVING COUNT(*) > 1;

-- 2. Verificar tareas duplicadas por título, fecha y tipo (diferentes IDs pero mismos datos)
SELECT 
    title,
    start_date,
    end_date,
    tipo,
    area,
    COUNT(*) as cantidad,
    array_agg(id ORDER BY id) as ids_duplicados
FROM lab_microbiologia.microbiologia_cronograma
GROUP BY title, start_date, end_date, tipo, area
HAVING COUNT(*) > 1
ORDER BY start_date DESC;

-- 3. Verificar total de tareas en el cronograma
SELECT 
    COUNT(*) as total_tareas,
    COUNT(DISTINCT id) as ids_unicos,
    COUNT(DISTINCT (title, start_date, tipo, area)) as combinaciones_unicas
FROM lab_microbiologia.microbiologia_cronograma;

-- 4. Mostrar todas las tareas ordenadas por fecha para revisión manual
SELECT 
    id,
    title,
    start_date,
    end_date,
    tipo,
    area,
    status,
    created_at
FROM lab_microbiologia.microbiologia_cronograma
ORDER BY start_date DESC, created_at DESC
LIMIT 50;

-- Si se encuentran duplicados, se pueden eliminar con:
-- DELETE FROM lab_microbiologia.microbiologia_cronograma
-- WHERE id IN (
--   SELECT id FROM (
--     SELECT id,
--       ROW_NUMBER() OVER (
--         PARTITION BY title, start_date, end_date, tipo, area 
--         ORDER BY id
--       ) as row_num
--     FROM lab_microbiologia.microbiologia_cronograma
--   ) t
--   WHERE row_num > 1
-- );
