-- Script para actualizar registros con PL-CAL-010 a PL-CAL-009

-- 1. Actualizar custodia_muestras
UPDATE lab_microbiologia.custodia_muestras 
SET cronograma_codigo = 'PL-CAL-009',
    cronograma_tipo = 'interno'
WHERE cronograma_codigo = 'PL-CAL-010' AND tipo = 'Materia Prima';

-- 2. Actualizar resultados_microbiologicos
UPDATE lab_microbiologia.resultados_microbiologicos 
SET cronograma_codigo = 'PL-CAL-009',
    cronograma_tipo = 'interno'
WHERE cronograma_codigo = 'PL-CAL-010' AND tipo = 'Materia Prima';

-- 3. Verificar cambios
SELECT 'custodia_muestras actualizados' as info,
       id, tipo, cronograma_codigo, cronograma_tipo
FROM lab_microbiologia.custodia_muestras 
WHERE cronograma_codigo = 'PL-CAL-009' AND tipo = 'Materia Prima'
LIMIT 10;

SELECT 'resultados_microbiologicos actualizados' as info,
       id, tipo, cronograma_codigo, cronograma_tipo
FROM lab_microbiologia.resultados_microbiologicos 
WHERE cronograma_codigo = 'PL-CAL-009' AND tipo = 'Materia Prima'
LIMIT 10;

-- 4. Verificar que no queden registros con PL-CAL-010
SELECT 'Registros restantes con PL-CAL-010' as info,
       COUNT(*) as total
FROM lab_microbiologia.custodia_muestras 
WHERE cronograma_codigo = 'PL-CAL-010';

SELECT 'Registros restantes con PL-CAL-010' as info,
       COUNT(*) as total
FROM lab_microbiologia.resultados_microbiologicos 
WHERE cronograma_codigo = 'PL-CAL-010';
