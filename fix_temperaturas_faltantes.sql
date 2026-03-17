-- =====================================================
-- INSERTAR TEMPERATURAS PARA PRODUCTOS EXISTENTES SIN CONFIGURACIÓN
-- Basado en los productos que ya tienes registrados
-- =====================================================

-- Primero, ver qué productos necesitan configuración
SELECT 'PRODUCTOS QUE NECESITAN CONFIGURACIÓN:' as info;
SELECT p.producto_id, p.nombre 
FROM productos p
LEFT JOIN temperatura_envasado_salsas t ON p.producto_id = t.producto_id
WHERE t.producto_id IS NULL
ORDER BY p.producto_id;

-- Insertar temperaturas para productos que no tienen configuración
-- Usando rangos apropiados según el tipo de producto (basado en el nombre)

-- Para productos con "Salsa" en el nombre - rango caliente (35-40°C)
INSERT INTO temperatura_envasado_salsas (producto_id, envase_tipo, temperatura_min, temperatura_max)
SELECT p.producto_id, e.tipo, 35.0, 40.0
FROM productos p
CROSS JOIN (VALUES ('Vidrio'), ('PET'), ('Doypack'), ('Lata')) AS e(tipo)
WHERE p.producto_id NOT IN (SELECT DISTINCT producto_id FROM temperatura_envasado_salsas)
AND (LOWER(p.nombre) LIKE '%salsa%' OR LOWER(p.nombre) LIKE '%tomate%');

-- Para productos con "Aceite" o "Aceituna" - rango medio (25-30°C)
INSERT INTO temperatura_envasado_salsas (producto_id, envase_tipo, temperatura_min, temperatura_max)
SELECT p.producto_id, e.tipo, 25.0, 30.0
FROM productos p
CROSS JOIN (VALUES ('Vidrio'), ('PET'), ('Doypack'), ('Lata')) AS e(tipo)
WHERE p.producto_id NOT IN (SELECT DISTINCT producto_id FROM temperatura_envasado_salsas)
AND (LOWER(p.nombre) LIKE '%aceite%' OR LOWER(p.nombre) LIKE '%aceituna%');

-- Para productos con "Mayonesa" o cremas - rango frío (20-25°C)
INSERT INTO temperatura_envasado_salsas (producto_id, envase_tipo, temperatura_min, temperatura_max)
SELECT p.producto_id, e.tipo, 20.0, 25.0
FROM productos p
CROSS JOIN (VALUES ('Vidrio'), ('PET'), ('Doypack'), ('Lata')) AS e(tipo)
WHERE p.producto_id NOT IN (SELECT DISTINCT producto_id FROM temperatura_envasado_salsas)
AND (LOWER(p.nombre) LIKE '%mayonesa%' OR LOWER(p.nombre) LIKE '%crema%');

-- Para productos con "Mermelada" o "Dulce" - rango muy caliente (40-45°C)
INSERT INTO temperatura_envasado_salsas (producto_id, envase_tipo, temperatura_min, temperatura_max)
SELECT p.producto_id, e.tipo, 40.0, 45.0
FROM productos p
CROSS JOIN (VALUES ('Vidrio'), ('PET'), ('Doypack'), ('Lata')) AS e(tipo)
WHERE p.producto_id NOT IN (SELECT DISTINCT producto_id FROM temperatura_envasado_salsas)
AND (LOWER(p.nombre) LIKE '%mermelada%' OR LOWER(p.nombre) LIKE '%dulce%' OR LOWER(p.nombre) LIKE '%jalea%');

-- Para productos con "Pepinillo" o encurtidos - rango fresco (22-27°C)
INSERT INTO temperatura_envasado_salsas (producto_id, envase_tipo, temperatura_min, temperatura_max)
SELECT p.producto_id, e.tipo, 22.0, 27.0
FROM productos p
CROSS JOIN (VALUES ('Vidrio'), ('PET'), ('Doypack'), ('Lata')) AS e(tipo)
WHERE p.producto_id NOT IN (SELECT DISTINCT producto_id FROM temperatura_envasado_salsas)
AND (LOWER(p.nombre) LIKE '%pepinill%' OR LOWER(p.nombre) LIKE '%encurtid%');

-- Para productos con "Atún" o pescados - rango medio-alto (28-33°C)
INSERT INTO temperatura_envasado_salsas (producto_id, envase_tipo, temperatura_min, temperatura_max)
SELECT p.producto_id, e.tipo, 28.0, 33.0
FROM productos p
CROSS JOIN (VALUES ('Vidrio'), ('PET'), ('Doypack'), ('Lata')) AS e(tipo)
WHERE p.producto_id NOT IN (SELECT DISTINCT producto_id FROM temperatura_envasado_salsas)
AND (LOWER(p.nombre) LIKE '%atun%' OR LOWER(p.nombre) LIKE '%pescad%' OR LOWER(p.nombre) LIKE '%sardina%');

-- Para productos restantes - rango estándar (30-35°C)
INSERT INTO temperatura_envasado_salsas (producto_id, envase_tipo, temperatura_min, temperatura_max)
SELECT p.producto_id, e.tipo, 30.0, 35.0
FROM productos p
CROSS JOIN (VALUES ('Vidrio'), ('PET'), ('Doypack'), ('Lata')) AS e(tipo)
WHERE p.producto_id NOT IN (SELECT DISTINCT producto_id FROM temperatura_envasado_salsas);

-- Verificar resultados
SELECT 'VERIFICACIÓN FINAL:' as info;
SELECT 
    'Total productos: ' || COUNT(*) as resultado
FROM productos
UNION ALL
SELECT 
    'Con temperaturas: ' || COUNT(DISTINCT producto_id) as resultado
FROM temperatura_envasado_salsas
UNION ALL
SELECT 
    'Sin temperaturas: ' || (SELECT COUNT(*) FROM productos p LEFT JOIN temperatura_envasado_salsas t ON p.producto_id = t.producto_id WHERE t.producto_id IS NULL) as resultado;

-- Mostrar detalle final
SELECT 'DETALLE DE CONFIGURACIÓN:' as info;
SELECT 
    p.producto_id,
    p.nombre,
    COUNT(t.envase_tipo) as envases_configurados,
    STRING_AGG(t.envase_tipo || ' (' || t.temperatura_min || '-' || t.temperatura_max || '°C)', ', ') as rangos
FROM productos p
LEFT JOIN temperatura_envasado_salsas t ON p.producto_id = t.producto_id
GROUP BY p.producto_id, p.nombre
ORDER BY p.producto_id;
