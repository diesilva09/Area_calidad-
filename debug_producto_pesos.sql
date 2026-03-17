-- =====================================================
-- DEBUG: Analizar la tabla producto_pesos_config
-- =====================================================

-- 1. Ver estructura de la tabla
\d producto_pesos_config;

-- 2. Ver todos los datos existentes
SELECT 
    producto_id,
    categoria_id,
    envase_tipo,
    peso_neto_declarado,
    peso_drenado_declarado,
    peso_drenado_min,
    peso_drenado_max,
    created_at,
    updated_at
FROM producto_pesos_config 
ORDER BY producto_id, categoria_id, envase_tipo;

-- 3. Buscar productos específicos que podrían tener problemas
SELECT 
    producto_id,
    categoria_id,
    envase_tipo,
    peso_neto_declarado,
    CASE 
        WHEN peso_neto_declarado IS NULL THEN 'SIN PESO NETO'
        ELSE 'CON PESO NETO'
    END as estado_peso
FROM producto_pesos_config 
WHERE producto_id IN ('000178', '000123', '000234')
ORDER BY producto_id, categoria_id, envase_tipo;

-- 4. Ver duplicados de producto_id
SELECT 
    producto_id,
    COUNT(*) as total_registros,
    STRING_AGG(DISTINCT categoria_id, ', ') as categorias,
    STRING_AGG(DISTINCT envase_tipo, ', ') as envases
FROM producto_pesos_config 
GROUP BY producto_id
HAVING COUNT(*) > 1
ORDER BY producto_id;

-- 5. Ver si hay registros sin categoria_id
SELECT 
    COUNT(*) as total_sin_categoria,
    COUNT(DISTINCT producto_id) as productos_unicos_sin_categoria
FROM producto_pesos_config 
WHERE categoria_id IS NULL OR categoria_id = '';

-- 6. Prueba específica para un producto con problema
SELECT 
    'Búsqueda por ID y categoría' as tipo_busqueda,
    producto_id,
    categoria_id,
    envase_tipo,
    peso_neto_declarado
FROM producto_pesos_config 
WHERE producto_id = '000178' AND categoria_id IS NOT NULL AND envase_tipo = 'caja'

UNION ALL

SELECT 
    'Búsqueda solo por ID' as tipo_busqueda,
    producto_id,
    categoria_id,
    envase_tipo,
    peso_neto_declarado
FROM producto_pesos_config 
WHERE producto_id = '000178' AND envase_tipo = 'caja'

UNION ALL

SELECT 
    'Búsqueda por ID y envase lata' as tipo_busqueda,
    producto_id,
    categoria_id,
    envase_tipo,
    peso_neto_declarado
FROM producto_pesos_config 
WHERE producto_id = '000178' AND envase_tipo = 'lata'

UNION ALL

SELECT 
    'Búsqueda por ID y envase PET' as tipo_busqueda,
    producto_id,
    categoria_id,
    envase_tipo,
    peso_neto_declarado
FROM producto_pesos_config 
WHERE producto_id = '000178' AND envase_tipo = 'PET'

ORDER BY tipo_busqueda;
