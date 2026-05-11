-- Script para corregir cronograma_tipo basado en el tipo de muestra

-- 1. Actualizar custodia_muestras - Producto Terminado Externo debería ser externo
UPDATE lab_microbiologia.custodia_muestras 
SET cronograma_tipo = 'externo'
WHERE cronograma_codigo = 'PL-CAL-009' 
  AND (tipo LIKE '%Externo%' OR tipo = 'Producto Terminado Externo');

-- 2. Actualizar resultados_microbiologicos - Producto Terminado Externo debería ser externo
UPDATE lab_microbiologia.resultados_microbiologicos 
SET cronograma_tipo = 'externo'
WHERE cronograma_codigo = 'PL-CAL-009' 
  AND (tipo LIKE '%Externo%' OR tipo = 'Producto Terminado Externo');

-- 3. También verificar si hay otros tipos que deberían ser externos
-- Agua Potable ya debería ser externo (verificar)
UPDATE lab_microbiologia.custodia_muestras 
SET cronograma_tipo = 'externo'
WHERE cronograma_codigo = 'PL-CAL-009' AND tipo = 'Agua Potable' AND cronograma_tipo = 'interno';

UPDATE lab_microbiologia.resultados_microbiologicos 
SET cronograma_tipo = 'externo'
WHERE cronograma_codigo = 'PL-CAL-009' AND tipo = 'Agua Potable' AND cronograma_tipo = 'interno';

-- Materia Prima también debe ser externo
UPDATE lab_microbiologia.custodia_muestras 
SET cronograma_tipo = 'externo'
WHERE cronograma_codigo = 'PL-CAL-009' AND tipo LIKE '%Materia Prima%' AND cronograma_tipo = 'interno';

UPDATE lab_microbiologia.resultados_microbiologicos 
SET cronograma_tipo = 'externo'
WHERE cronograma_codigo = 'PL-CAL-009' AND tipo LIKE '%Materia Prima%' AND cronograma_tipo = 'interno';

-- 4. Verificar cambios
SELECT 'custodia_muestras - Producto Terminado' as info,
       id, tipo, cronograma_codigo, cronograma_tipo
FROM lab_microbiologia.custodia_muestras 
WHERE cronograma_codigo = 'PL-CAL-009' AND tipo LIKE '%Producto Terminado%'
LIMIT 10;

SELECT 'resultados_microbiologicos - Producto Terminado' as info,
       id, tipo, cronograma_codigo, cronograma_tipo
FROM lab_microbiologia.resultados_microbiologicos 
WHERE cronograma_codigo = 'PL-CAL-009' AND tipo LIKE '%Producto Terminado%'
LIMIT 10;

-- 5. Resumen de estado actual
SELECT 'custodia_muestras resumen' as tabla, 
       COUNT(*) as total,
       SUM(CASE WHEN cronograma_tipo = 'externo' THEN 1 ELSE 0 END) as externos,
       SUM(CASE WHEN cronograma_tipo = 'interno' THEN 1 ELSE 0 END) as internos
FROM lab_microbiologia.custodia_muestras 
WHERE cronograma_codigo = 'PL-CAL-009';

SELECT 'resultados_microbiologicos resumen' as tabla,
       COUNT(*) as total,
       SUM(CASE WHEN cronograma_tipo = 'externo' THEN 1 ELSE 0 END) as externos,
       SUM(CASE WHEN cronograma_tipo = 'interno' THEN 1 ELSE 0 END) as internos
FROM lab_microbiologia.resultados_microbiologicos 
WHERE cronograma_codigo = 'PL-CAL-009';
