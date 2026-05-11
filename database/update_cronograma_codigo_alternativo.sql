-- Actualización alternativa de cronograma_codigo usando otros criterios
-- Este script usa el campo 'tipo' y 'observaciones' para identificar los registros
-- Usamos códigos diferentes para distinguir entre Producto Terminado y Agua Potable

-- Actualizar registros de Agua Potable basado en el tipo (usamos código específico)
UPDATE lab_microbiologia.custodia_muestras
SET cronograma_codigo = 'PL-CAL-009-AP'
WHERE cronograma_codigo IS NULL
  AND tipo = 'Agua Potable';

-- Actualizar registros de Producto Terminado basado en el tipo (Interno)
UPDATE lab_microbiologia.custodia_muestras
SET cronograma_codigo = 'PL-CAL-009'
WHERE cronograma_codigo IS NULL
  AND tipo = 'Producto Terminado'
  AND (observaciones IS NULL OR observaciones NOT ILIKE '%externo%');

-- Actualizar registros de Producto Terminado Externo
UPDATE lab_microbiologia.custodia_muestras
SET cronograma_codigo = 'PL-CAL-009-PE'
WHERE cronograma_codigo IS NULL
  AND tipo = 'Producto Terminado'
  AND observaciones ILIKE '%externo%';

-- Actualizar registros de Materia Prima basado en el tipo (Interno)
UPDATE lab_microbiologia.custodia_muestras
SET cronograma_codigo = 'PL-CAL-010'
WHERE cronograma_codigo IS NULL
  AND tipo = 'Materia Prima'
  AND (observaciones IS NULL OR observaciones NOT ILIKE '%externo%');

-- Actualizar registros de Materia Prima Externo
UPDATE lab_microbiologia.custodia_muestras
SET cronograma_codigo = 'PL-CAL-009-MP'
WHERE cronograma_codigo IS NULL
  AND tipo = 'Materia Prima'
  AND observaciones ILIKE '%externo%';

-- Actualizar registros basados en observaciones que mencionan Agua Potable
UPDATE lab_microbiologia.custodia_muestras
SET cronograma_codigo = 'PL-CAL-009-AP'
WHERE cronograma_codigo IS NULL
  AND observaciones ILIKE '%agua potable%';

-- Actualizar registros basados en observaciones que mencionan Producto Terminado Externo
UPDATE lab_microbiologia.custodia_muestras
SET cronograma_codigo = 'PL-CAL-009-PE'
WHERE cronograma_codigo IS NULL
  AND observaciones ILIKE '%pt externo%'
  AND observaciones NOT ILIKE '%agua potable%';

-- Actualizar registros basados en observaciones que mencionan Materia Prima Externo
UPDATE lab_microbiologia.custodia_muestras
SET cronograma_codigo = 'PL-CAL-009-MP'
WHERE cronograma_codigo IS NULL
  AND observaciones ILIKE '%materia prima%'
  AND observaciones ILIKE '%externo%';

-- Actualizar registros basados en observaciones que mencionan Materia Prima (Interno)
UPDATE lab_microbiologia.custodia_muestras
SET cronograma_codigo = 'PL-CAL-010'
WHERE cronograma_codigo IS NULL
  AND observaciones ILIKE '%materia prima%'
  AND observaciones NOT ILIKE '%externo%';

-- Verificar resultados después de la actualización
SELECT 
    cronograma_codigo,
    COUNT(*) as total_registros
FROM lab_microbiologia.custodia_muestras
GROUP BY cronograma_codigo
ORDER BY cronograma_codigo NULLS LAST;

-- Mostrar registros que aún no tienen cronograma_codigo
SELECT 
    id,
    codigo,
    tipo,
    observaciones,
    cronograma_codigo
FROM lab_microbiologia.custodia_muestras
WHERE cronograma_codigo IS NULL
LIMIT 20;
