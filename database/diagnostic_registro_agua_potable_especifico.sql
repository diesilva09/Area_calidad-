-- Script para diagnosticar y corregir registros de cronogramas externos con código incorrecto
-- Buscar registros de Agua Potable, Producto Terminado Externo y Materia Prima Externo con cronograma_codigo incorrecto

-- Buscar el registro específico con código M-1
SELECT 
    id,
    codigo,
    tipo,
    muestra_id,
    area,
    cronograma_codigo,
    observaciones,
    estado,
    created_at
FROM lab_microbiologia.custodia_muestras
WHERE codigo = 'M-1';

-- Buscar el registro específico con código M-2
SELECT 
    id,
    codigo,
    tipo,
    muestra_id,
    area,
    cronograma_codigo,
    observaciones,
    estado,
    created_at
FROM lab_microbiologia.custodia_muestras
WHERE codigo = 'M-2';

-- Buscar el registro específico con código M-3
SELECT 
    id,
    codigo,
    tipo,
    muestra_id,
    area,
    cronograma_codigo,
    observaciones,
    estado,
    created_at
FROM lab_microbiologia.custodia_muestras
WHERE codigo = 'M-3';

-- Verificar distribución de cronograma_codigo en todos los registros
SELECT 
    cronograma_codigo,
    COUNT(*) as total
FROM lab_microbiologia.custodia_muestras
GROUP BY cronograma_codigo
ORDER BY cronograma_codigo NULLS LAST;

-- Actualizar registros de Agua Potable que tienen cronograma_codigo incorrecto
UPDATE lab_microbiologia.custodia_muestras
SET cronograma_codigo = 'PL-CAL-009-AP'
WHERE tipo = 'Agua Potable'
  AND (cronograma_codigo IS NULL OR cronograma_codigo = 'PL-CAL-009');

-- Actualizar registros de Producto Terminado Externo que tienen cronograma_codigo incorrecto
UPDATE lab_microbiologia.custodia_muestras
SET cronograma_codigo = 'PL-CAL-009-PE'
WHERE (tipo = 'Producto Terminado' OR tipo ILIKE '%producto terminado%')
  AND observaciones ILIKE '%externo%'
  AND (cronograma_codigo IS NULL OR cronograma_codigo = 'PL-CAL-009');

-- Actualizar registros de Materia Prima Externo que tienen cronograma_codigo incorrecto
UPDATE lab_microbiologia.custodia_muestras
SET cronograma_codigo = 'PL-CAL-009-MP'
WHERE tipo = 'Materia Prima'
  AND (observaciones ILIKE '%externo%' OR observaciones ILIKE '%proveedor%')
  AND (cronograma_codigo IS NULL OR cronograma_codigo = 'PL-CAL-010');

-- Verificar resultado de las actualizaciones
SELECT 
    cronograma_codigo,
    COUNT(*) as total
FROM lab_microbiologia.custodia_muestras
GROUP BY cronograma_codigo
ORDER BY cronograma_codigo NULLS LAST;

-- Mostrar registros actualizados para verificación
SELECT 
    id,
    codigo,
    tipo,
    cronograma_codigo,
    observaciones,
    estado
FROM lab_microbiologia.custodia_muestras
WHERE cronograma_codigo IN ('PL-CAL-009-AP', 'PL-CAL-009-PE', 'PL-CAL-009-MP')
ORDER BY cronograma_codigo, created_at DESC
LIMIT 20;
