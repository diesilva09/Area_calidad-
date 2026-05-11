-- Script para actualizar cronograma_tipo en los registros individuales
-- Basado en cronograma_codigo y el campo interno_externo existente

-- 1. Actualizar resultados_microbiologicos basado en interno_externo
UPDATE lab_microbiologia.resultados_microbiologicos 
SET cronograma_tipo = LOWER(interno_externo)
WHERE cronograma_tipo IS NULL AND interno_externo IS NOT NULL;

-- 2. Para resultados_microbiologicos sin interno_externo, usar cronograma_codigo
UPDATE lab_microbiologia.resultados_microbiologicos 
SET cronograma_tipo = 
  CASE 
    WHEN cronograma_codigo IN ('PL-CAL-009-AP', 'PL-CAL-009-PE', 'PL-CAL-009-MP') THEN 'externo'
    WHEN cronograma_codigo = 'PL-CAL-009' AND tipo = 'Agua Potable' THEN 'externo'
    WHEN cronograma_codigo = 'PL-CAL-009' AND tipo IN ('Producto Terminado', 'Materia Prima') THEN 'interno'
    ELSE 'interno'
  END
WHERE cronograma_tipo IS NULL AND cronograma_codigo IS NOT NULL;

-- 3. Actualizar custodia_muestras basado en cronograma_codigo
UPDATE lab_microbiologia.custodia_muestras 
SET cronograma_tipo = 
  CASE 
    WHEN cronograma_codigo IN ('PL-CAL-009-AP', 'PL-CAL-009-PE', 'PL-CAL-009-MP') THEN 'externo'
    WHEN cronograma_codigo = 'PL-CAL-009' AND tipo = 'Agua Potable' THEN 'externo'
    WHEN cronograma_codigo = 'PL-CAL-009' AND tipo IN ('Producto Terminado', 'Materia Prima') THEN 'interno'
    ELSE 'interno'
  END
WHERE cronograma_tipo IS NULL AND cronograma_codigo IS NOT NULL;

-- 4. Verificar resultados
SELECT 'resultados_microbiologicos' as tabla, COUNT(*) as total, 
       SUM(CASE WHEN cronograma_tipo = 'externo' THEN 1 ELSE 0 END) as externos,
       SUM(CASE WHEN cronograma_tipo = 'interno' THEN 1 ELSE 0 END) as internos
FROM lab_microbiologia.resultados_microbiologicos;

SELECT 'custodia_muestras' as tabla, COUNT(*) as total,
       SUM(CASE WHEN cronograma_tipo = 'externo' THEN 1 ELSE 0 END) as externos,
       SUM(CASE WHEN cronograma_tipo = 'interno' THEN 1 ELSE 0 END) as internos
FROM lab_microbiologia.custodia_muestras;

-- 5. Mostrar ejemplos de registros actualizados
SELECT 'resultados_microbiologicos ejemplos' as info, 
       id, tipo, cronograma_codigo, interno_externo, cronograma_tipo
FROM lab_microbiologia.resultados_microbiologicos 
WHERE cronograma_codigo IS NOT NULL
LIMIT 10;

SELECT 'custodia_muestras ejemplos' as info,
       id, tipo, cronograma_codigo, cronograma_tipo
FROM lab_microbiologia.custodia_muestras 
WHERE cronograma_codigo IS NOT NULL
LIMIT 10;
