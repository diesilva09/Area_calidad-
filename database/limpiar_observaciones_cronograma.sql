-- Script para limpiar el campo de observaciones de registros generados desde cronogramas
-- Elimina el texto de origen de las observaciones

-- Actualizar registros de Producto Terminado Externo
UPDATE lab_microbiologia.custodia_muestras
SET observaciones = ''
WHERE observaciones ILIKE '%Generado desde PL-CAL-009 PT Externo%';

-- Actualizar registros de Producto Terminado
UPDATE lab_microbiologia.custodia_muestras
SET observaciones = ''
WHERE observaciones ILIKE '%Generado automáticamente desde cronograma PL-CAL-009%'
  AND observaciones NOT ILIKE '%Agua Potable%'
  AND observaciones NOT ILIKE '%Materia Prima%';

-- Actualizar registros de Materia Prima
UPDATE lab_microbiologia.custodia_muestras
SET observaciones = ''
WHERE observaciones ILIKE '%Generado automáticamente desde cronograma PL-CAL-010 Materia Prima%';

-- Actualizar registros de Agua Potable
UPDATE lab_microbiologia.custodia_muestras
SET observaciones = ''
WHERE observaciones ILIKE '%Generado automáticamente desde cronograma PL-CAL-009 Agua Potable%';

-- Verificar resultados
SELECT 
    COUNT(*) as total_registros_actualizados
FROM lab_microbiologia.custodia_muestras
WHERE observaciones ILIKE '%Generado%';

-- Mostrar registros que aún tienen texto de origen
SELECT 
    id,
    codigo,
    tipo,
    observaciones,
    created_at
FROM lab_microbiologia.custodia_muestras
WHERE observaciones ILIKE '%Generado%'
ORDER BY created_at DESC
LIMIT 20;
