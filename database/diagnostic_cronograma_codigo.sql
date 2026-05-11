-- Script de diagnóstico para verificar el estado de cronograma_codigo

-- 1. Verificar si la tabla custodia_muestras tiene el campo cronograma_codigo
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'lab_microbiologia'
  AND table_name = 'custodia_muestras'
  AND column_name = 'cronograma_codigo';

-- 2. Verificar cuántos registros tienen cronograma_task_id
SELECT 
    COUNT(*) as total_registros,
    COUNT(cronograma_task_id) as con_cronograma_task_id,
    COUNT(cronograma_codigo) as con_cronograma_codigo
FROM lab_microbiologia.custodia_muestras;

-- 3. Verificar distribución de cronograma_codigo en custodia_muestras
SELECT 
    cronograma_codigo,
    COUNT(*) as total
FROM lab_microbiologia.custodia_muestras
GROUP BY cronograma_codigo
ORDER BY cronograma_codigo;

-- 4. Verificar si la tabla resultados_microbiologicos tiene el campo cronograma_codigo
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'lab_microbiologia'
  AND table_name = 'resultados_microbiologicos'
  AND column_name = 'cronograma_codigo';

-- 5. Verificar cuántos registros de resultados_microbiologicos tienen cronograma_task_id
SELECT 
    COUNT(*) as total_registros,
    COUNT(cronograma_task_id) as con_cronograma_task_id,
    COUNT(cronograma_codigo) as con_cronograma_codigo
FROM lab_microbiologia.resultados_microbiologicos;

-- 6. Verificar distribución de cronograma_codigo en resultados_microbiologicos
SELECT 
    cronograma_codigo,
    COUNT(*) as total
FROM lab_microbiologia.resultados_microbiologicos
GROUP BY cronograma_codigo
ORDER BY cronograma_codigo;

-- 7. Mostrar algunos registros de custodia_muestras con sus campos de cronograma
SELECT 
    id,
    codigo,
    estado,
    cronograma_task_id,
    cronograma_codigo,
    created_at
FROM lab_microbiologia.custodia_muestras
ORDER BY created_at DESC
LIMIT 10;
