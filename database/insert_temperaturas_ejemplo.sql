-- =====================================================
-- DATOS DE EJEMPLO PARA TEMPERATURAS DE ENVASADO
-- Para probar la validación de temperaturas en múltiples productos
-- =====================================================

-- Producto: 000123 (Aceituna) - Rango estándar para conservas
INSERT INTO temperatura_envasado_salsas 
(producto_id, envase_tipo, temperatura_min, temperatura_max) 
VALUES 
('000123', 'Vidrio', 25.0, 30.0),
('000123', 'PET', 24.0, 29.0),
('000123', 'Doypack', 23.0, 28.0),
('000123', 'Lata', 26.0, 31.0);

-- Producto: 000234 (Salsa de Tomate) - Rango para salsas ácidas
INSERT INTO temperatura_envasado_salsas 
(producto_id, envase_tipo, temperatura_min, temperatura_max) 
VALUES 
('000234', 'Vidrio', 35.0, 40.0),
('000234', 'PET', 34.0, 39.0),
('000234', 'Doypack', 33.0, 38.0),
('000234', 'Lata', 36.0, 41.0);

-- Producto: 000345 (Mayonesa) - Rango para productos grasos
INSERT INTO temperatura_envasado_salsas 
(producto_id, envase_tipo, temperatura_min, temperatura_max) 
VALUES 
('000345', 'Vidrio', 20.0, 25.0),
('000345', 'PET', 19.0, 24.0),
('000345', 'Doypack', 18.0, 23.0),
('000345', 'Lata', 21.0, 26.0);

-- Producto: 000456 (Pepinillos) - Rango para vegetales encurtidos
INSERT INTO temperatura_envasado_salsas 
(producto_id, envase_tipo, temperatura_min, temperatura_max) 
VALUES 
('000456', 'Vidrio', 22.0, 27.0),
('000456', 'PET', 21.0, 26.0),
('000456', 'Doypack', 20.0, 25.0),
('000456', 'Lata', 23.0, 28.0);

-- Producto: 000567 (Mermelada) - Rango para frutas
INSERT INTO temperatura_envasado_salsas 
(producto_id, envase_tipo, temperatura_min, temperatura_max) 
VALUES 
('000567', 'Vidrio', 40.0, 45.0),
('000567', 'PET', 39.0, 44.0),
('000567', 'Doypack', 38.0, 43.0),
('000567', 'Lata', 41.0, 46.0);

-- Producto: 000678 (Atún en Aceite) - Rango para pescados
INSERT INTO temperatura_envasado_salsas 
(producto_id, envase_tipo, temperatura_min, temperatura_max) 
VALUES 
('000678', 'Vidrio', 28.0, 33.0),
('000678', 'PET', 27.0, 32.0),
('000678', 'Doypack', 26.0, 31.0),
('000678', 'Lata', 29.0, 34.0);

-- Producto: 000789 (Salsa de Soja) - Rango para salsas fermentadas
INSERT INTO temperatura_envasado_salsas 
(producto_id, envase_tipo, temperatura_min, temperatura_max) 
VALUES 
('000789', 'Vidrio', 30.0, 35.0),
('000789', 'PET', 29.0, 34.0),
('000789', 'Doypack', 28.0, 33.0),
('000789', 'Lata', 31.0, 36.0);

-- Producto: 000890 (Aceite de Oliva) - Rango para aceites
INSERT INTO temperatura_envasado_salsas 
(producto_id, envase_tipo, temperatura_min, temperatura_max) 
VALUES 
('000890', 'Vidrio', 32.0, 37.0),
('000890', 'PET', 31.0, 36.0),
('000890', 'Doypack', 30.0, 35.0),
('000890', 'Lata', 33.0, 38.0);

-- =====================================================
-- VERIFICACIÓN DE DATOS INSERTADOS
-- =====================================================

-- Mostrar todos los productos con configuración
SELECT 
    producto_id,
    COUNT(*) as total_envases_configurados,
    STRING_AGG(envase_tipo || ' (' || temperatura_min || '-' || temperatura_max || '°C)', ', ') as detalles
FROM temperatura_envasado_salsas 
GROUP BY producto_id 
ORDER BY producto_id;

-- Mostrar resumen general
SELECT 
    COUNT(DISTINCT producto_id) as total_productos_configurados,
    COUNT(*) as total_configuraciones,
    AVG(temperatura_max - temperatura_min) as rango_promedio
FROM temperatura_envasado_salsas;

-- Verificar configuración específica para un producto
SELECT 
    producto_id,
    envase_tipo,
    temperatura_min,
    temperatura_max,
    temperatura_max - temperatura_min as rango_temperatura
FROM temperatura_envasado_salsas 
WHERE producto_id = '000123'
ORDER BY envase_tipo;
