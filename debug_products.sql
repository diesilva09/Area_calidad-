-- =====================================================
-- VERIFICACIÓN DE PRODUCTOS Y CONFIGURACIÓN DE TEMPERATURAS
-- Para identificar conflictos entre productos registrados y temperaturas
-- =====================================================

-- 1. Mostrar todos los productos registrados
SELECT 'PRODUCTOS REGISTRADOS' as info, producto_id, nombre as detalle
FROM productos
ORDER BY producto_id;

-- 2. Mostrar productos con configuración de temperaturas
SELECT 'TEMPERATURAS CONFIGURADAS' as info, producto_id, 
       STRING_AGG(envase_tipo || ' (' || temperatura_min || '-' || temperatura_max || '°C)', ', ') as detalle
FROM temperatura_envasado_salsas
GROUP BY producto_id
ORDER BY producto_id;

-- 3. Mostrar productos con configuración de pesos
SELECT 'PESOS CONFIGURADOS' as info, producto_id,
       STRING_AGG(envase_tipo || ' (' || peso_drenado_declarado || 'g)', ', ') as detalle
FROM producto_pesos_config
GROUP BY producto_id
ORDER BY producto_id;

-- 4. Productos SIN configuración de temperaturas
SELECT 'SIN TEMPERATURAS' as info, p.producto_id, p.nombre as detalle
FROM productos p
LEFT JOIN temperatura_envasado_salsas t ON p.producto_id = t.producto_id
WHERE t.producto_id IS NULL
ORDER BY p.producto_id;

-- 5. Productos SIN configuración de pesos
SELECT 'SIN PESOS' as info, p.producto_id, p.nombre as detalle
FROM productos p
LEFT JOIN producto_pesos_config pp ON p.producto_id = pp.producto_id
WHERE pp.producto_id IS NULL
ORDER BY p.producto_id;

-- 6. Resumen general
SELECT 'RESUMEN' as info, 
       'Total productos: ' || COUNT(*) as detalle
FROM productos
UNION ALL
SELECT 'RESUMEN' as info,
       'Con temperaturas: ' || COUNT(DISTINCT producto_id) as detalle
FROM temperatura_envasado_salsas
UNION ALL
SELECT 'RESUMEN' as info,
       'Con pesos: ' || COUNT(DISTINCT producto_id) as detalle
FROM producto_pesos_config
UNION ALL
SELECT 'RESUMEN' as info,
       'Sin temperaturas: ' || (SELECT COUNT(*) FROM productos p LEFT JOIN temperatura_envasado_salsas t ON p.producto_id = t.producto_id WHERE t.producto_id IS NULL) as detalle
UNION ALL
SELECT 'RESUMEN' as info,
       'Sin pesos: ' || (SELECT COUNT(*) FROM productos p LEFT JOIN producto_pesos_config pp ON p.producto_id = pp.producto_id WHERE pp.producto_id IS NULL) as detalle;
