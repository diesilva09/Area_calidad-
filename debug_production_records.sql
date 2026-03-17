-- Script para diagnosticar el problema de registros de producción
-- Ejecutar este script en PostgreSQL para ver qué hay en las tablas

-- 1. Verificar estructura de la tabla production_records
\d production_records

-- 2. Verificar cuántos registros hay en cada tabla
SELECT 
    'production_records' as tabla,
    COUNT(*) as total_registros,
    COUNT(CASE WHEN fechaproduccion IS NOT NULL THEN 1 END) as con_fecha_produccion,
    COUNT(CASE WHEN presentacion IS NOT NULL THEN 1 END) as con_presentacion
FROM production_records

UNION ALL

SELECT 
    'embalaje_records' as tabla,
    COUNT(*) as total_registros,
    COUNT(CASE WHEN fecha IS NOT NULL THEN 1 END) as con_fecha,
    COUNT(CASE WHEN presentacion IS NOT NULL THEN 1 END) as con_presentacion
FROM embalaje_records;

-- 3. Verificar primeros registros de production_records
SELECT 
    id,
    producto,
    fechaproduccion,
    presentacion,
    nivel_inspeccion,
    created_at
FROM production_records 
ORDER BY created_at DESC 
LIMIT 5;

-- 4. Verificar primeros registros de embalaje_records
SELECT 
    id,
    producto,
    fecha,
    presentacion,
    nivel_inspeccion,
    created_at
FROM embalaje_records 
ORDER BY created_at DESC 
LIMIT 5;

-- 5. Verificar si hay campos de embalaje en production_records
SELECT 
    COUNT(*) as total,
    COUNT(CASE WHEN presentacion IS NOT NULL THEN 1 END) as tienen_presentacion,
    COUNT(CASE WHEN nivel_inspeccion IS NOT NULL THEN 1 END) as tienen_nivel_inspeccion,
    COUNT(CASE WHEN fechaproduccion IS NOT NULL THEN 1 END) as tienen_fecha_produccion
FROM production_records;
