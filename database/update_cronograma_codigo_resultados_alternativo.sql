-- Actualización alternativa de cronograma_codigo en resultados_microbiologicos
-- Este script usa el campo 'tipo' y observaciones para identificar los registros
-- Usamos códigos diferentes para distinguir entre Producto Terminado y Agua Potable

-- Primero verificar si la tabla tiene el campo cronograma_codigo
-- ALTER TABLE lab_microbiologia.resultados_microbiologicos
-- ADD COLUMN IF NOT EXISTS cronograma_codigo VARCHAR(20) DEFAULT NULL;

-- Actualizar registros de Agua Potable basado en observaciones
UPDATE lab_microbiologia.resultados_microbiologicos
SET cronograma_codigo = 'PL-CAL-009-AP'
WHERE cronograma_codigo IS NULL
  AND observaciones ILIKE '%agua potable%';

-- Actualizar registros de Producto Terminado (Interno) basado en observaciones
UPDATE lab_microbiologia.resultados_microbiologicos
SET cronograma_codigo = 'PL-CAL-009'
WHERE cronograma_codigo IS NULL
  AND observaciones ILIKE '%producto terminado%'
  AND observaciones NOT ILIKE '%agua potable%'
  AND observaciones NOT ILIKE '%externo%';

-- Actualizar registros de Producto Terminado Externo basado en observaciones
UPDATE lab_microbiologia.resultados_microbiologicos
SET cronograma_codigo = 'PL-CAL-009-PE'
WHERE cronograma_codigo IS NULL
  AND (
    observaciones ILIKE '%pt externo%'
    OR observaciones ILIKE '%pt-externo%'
    OR (observaciones ILIKE '%producto terminado%' AND observaciones ILIKE '%externo%')
  );

-- Actualizar registros de Materia Prima (Interno) basado en observaciones
UPDATE lab_microbiologia.resultados_microbiologicos
SET cronograma_codigo = 'PL-CAL-010'
WHERE cronograma_codigo IS NULL
  AND observaciones ILIKE '%materia prima%'
  AND observaciones NOT ILIKE '%externo%';

-- Actualizar registros de Materia Prima Externo basado en observaciones
UPDATE lab_microbiologia.resultados_microbiologicos
SET cronograma_codigo = 'PL-CAL-009-MP'
WHERE cronograma_codigo IS NULL
  AND observaciones ILIKE '%materia prima%'
  AND observaciones ILIKE '%externo%';

-- Verificar resultados después de la actualización
SELECT 
    cronograma_codigo,
    COUNT(*) as total_registros
FROM lab_microbiologia.resultados_microbiologicos
GROUP BY cronograma_codigo
ORDER BY cronograma_codigo NULLS LAST;

-- Mostrar registros que aún no tienen cronograma_codigo
SELECT 
    id,
    codigo,
    tipo,
    observaciones,
    cronograma_codigo
FROM lab_microbiologia.resultados_microbiologicos
WHERE cronograma_codigo IS NULL
LIMIT 20;
