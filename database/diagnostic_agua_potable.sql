-- Script de diagnóstico específico para registros de Agua Potable

-- 1. Verificar registros de custodia_muestras con tipo Agua Potable
SELECT 
    id,
    codigo,
    tipo,
    cronograma_codigo,
    observaciones,
    created_at
FROM lab_microbiologia.custodia_muestras
WHERE tipo = 'Agua Potable'
   OR observaciones ILIKE '%agua potable%'
ORDER BY created_at DESC
LIMIT 20;

-- 2. Verificar distribución de cronograma_codigo para registros de agua potable
SELECT 
    cronograma_codigo,
    COUNT(*) as total
FROM lab_microbiologia.custodia_muestras
WHERE tipo = 'Agua Potable'
   OR observaciones ILIKE '%agua potable%'
GROUP BY cronograma_codigo
ORDER BY cronograma_codigo NULLS LAST;

-- 3. Verificar registros de resultados_microbiologicos con agua potable
SELECT 
    id,
    codigo,
    tipo,
    cronograma_codigo,
    observaciones,
    created_at
FROM lab_microbiologia.resultados_microbiologicos
WHERE observaciones ILIKE '%agua potable%'
ORDER BY created_at DESC
LIMIT 20;

-- 4. Verificar distribución de cronograma_codigo para resultados_microbiologicos
SELECT 
    cronograma_codigo,
    COUNT(*) as total
FROM lab_microbiologia.resultados_microbiologicos
WHERE observaciones ILIKE '%agua potable%'
GROUP BY cronograma_codigo
ORDER BY cronograma_codigo NULLS LAST;
