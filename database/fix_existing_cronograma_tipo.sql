-- Script para actualizar registros existentes de custodia_muestras que tienen cronograma_tipo NULL
-- Esto asegurará que los badges de externo/interno se muestren correctamente

-- Actualizar registros de Agua Potable (PL-CAL-009) a 'externo'
UPDATE lab_microbiologia.custodia_muestras
SET cronograma_tipo = 'externo'
WHERE cronograma_tipo IS NULL
  AND cronograma_codigo = 'PL-CAL-009'
  AND tipo = 'Agua Potable';

-- Actualizar registros de Materia Prima (PL-CAL-010) a 'externo'
UPDATE lab_microbiologia.custodia_muestras
SET cronograma_tipo = 'externo'
WHERE cronograma_tipo IS NULL
  AND cronograma_codigo = 'PL-CAL-010'
  AND tipo = 'Materia Prima';

-- Actualizar registros de Producto Terminado Externo (PL-CAL-009) a 'externo'
UPDATE lab_microbiologia.custodia_muestras
SET cronograma_tipo = 'externo'
WHERE cronograma_tipo IS NULL
  AND cronograma_codigo = 'PL-CAL-009'
  AND tipo = 'Producto Terminado Externo';

-- Actualizar registros de Producto Terminado (PL-CAL-009) a 'interno'
UPDATE lab_microbiologia.custodia_muestras
SET cronograma_tipo = 'interno'
WHERE cronograma_tipo IS NULL
  AND cronograma_codigo = 'PL-CAL-009'
  AND tipo = 'Producto Terminado';

-- Actualizar registros del cronograma general (PL-CAL-008) a 'interno'
UPDATE lab_microbiologia.custodia_muestras
SET cronograma_tipo = 'interno'
WHERE cronograma_tipo IS NULL
  AND cronograma_codigo = 'PL-CAL-008';

-- Verificación: Mostrar cuántos registros fueron actualizados
SELECT 
  cronograma_tipo,
  cronograma_codigo,
  tipo,
  COUNT(*) as cantidad
FROM lab_microbiologia.custodia_muestras
GROUP BY cronograma_tipo, cronograma_codigo, tipo
ORDER BY cronograma_tipo, cronograma_codigo;

-- Verificación: Mostrar registros que aún tienen NULL (si los hay)
SELECT 
  id,
  codigo,
  tipo,
  cronograma_codigo,
  cronograma_tipo,
  observaciones
FROM lab_microbiologia.custodia_muestras
WHERE cronograma_tipo IS NULL
LIMIT 10;
