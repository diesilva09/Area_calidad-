-- Insertar SOLO los tipos de envase para todos los productos
-- Sin especificar meses de vencimiento por ahora

-- Primero, veamos qué productos tienes registrados
-- SELECT id, name FROM products ORDER BY id;

-- Insertar los 6 tipos de envase para todos los productos existentes
DO $$
DECLARE
    producto_record RECORD;
BEGIN
    FOR producto_record IN SELECT id FROM products ORDER BY id LOOP
        -- Insertar cada tipo de envase para este producto con valor temporal
        INSERT INTO producto_envase_vencimiento (producto_id, envase_tipo, meses_vencimiento) VALUES
        (producto_record.id, 'Vidrio', 12),    -- Valor temporal, ajustar después
        (producto_record.id, 'Bolsa', 6),      -- Valor temporal, ajustar después
        (producto_record.id, 'PET', 12),       -- Valor temporal, ajustar después
        (producto_record.id, 'Galon', 12),      -- Valor temporal, ajustar después
        (producto_record.id, 'Doypack', 12),   -- Valor temporal, ajustar después
        (producto_record.id, 'Lata', 12)      -- Valor temporal, ajustar después
        ON CONFLICT (producto_id, envase_tipo) DO NOTHING;
        
        RAISE NOTICE 'Insertados envases para producto: %', producto_record.id;
    END LOOP;
END $$;

-- Verificar los datos insertados
SELECT 
    pev.producto_id,
    p.name as nombre_producto,
    pev.envase_tipo,
    pev.meses_vencimiento
FROM producto_envase_vencimiento pev
JOIN products p ON pev.producto_id = p.id
ORDER BY pev.producto_id, pev.envase_tipo;

-- Contar cuántos envases se insertaron por producto
SELECT 
    p.id,
    p.name,
    COUNT(pev.envase_tipo) as cantidad_envases
FROM products p
LEFT JOIN producto_envase_vencimiento pev ON p.id = pev.producto_id
GROUP BY p.id, p.name
ORDER BY p.id;
