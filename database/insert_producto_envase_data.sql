-- Insertar datos para todos los productos con los tipos de envase disponibles
-- NOTA: Debes ajustar los meses de vencimiento según tus especificaciones reales

-- Primero, vamos a ver qué productos tienes registrados
-- (Ejecuta esta consulta primero para ver tus productos)
-- SELECT id, name FROM products ORDER BY id;

-- Insertar envases para cada producto (ajusta los meses según tu necesidad)
-- Ejemplo de estructura - DEBES ACTUALIZAR LOS MESES REALES

-- Para producto 000001
INSERT INTO producto_envase_vencimiento (producto_id, envase_tipo, meses_vencimiento) VALUES
('000001', 'Vidrio', 24),   -- Ajustar meses reales
('000001', 'Bolsa', 6),     -- Ajustar meses reales
('000001', 'PET', 12),      -- Ajustar meses reales
('000001', 'Galon', 18),    -- Ajustar meses reales
('000001', 'Doypack', 9),   -- Ajustar meses reales
('000001', 'Lata', 36)      -- Ajustar meses reales
ON CONFLICT (producto_id, envase_tipo) DO NOTHING;

-- Para producto 000002
INSERT INTO producto_envase_vencimiento (producto_id, envase_tipo, meses_vencimiento) VALUES
('000002', 'Vidrio', 12),   -- Ajustar meses reales
('000002', 'Bolsa', 4),     -- Ajustar meses reales
('000002', 'PET', 8),       -- Ajustar meses reales
('000002', 'Galon', 10),    -- Ajustar meses reales
('000002', 'Doypack', 6),   -- Ajustar meses reales
('000002', 'Lata', 18)      -- Ajustar meses reales
ON CONFLICT (producto_id, envase_tipo) DO NOTHING;

-- Para producto 000003
INSERT INTO producto_envase_vencimiento (producto_id, envase_tipo, meses_vencimiento) VALUES
('000003', 'Vidrio', 30),   -- Ajustar meses reales
('000003', 'Bolsa', 8),     -- Ajustar meses reales
('000003', 'PET', 15),      -- Ajustar meses reales
('000003', 'Galon', 24),    -- Ajustar meses reales
('000003', 'Doypack', 12),  -- Ajustar meses reales
('000003', 'Lata', 48)      -- Ajustar meses reales
ON CONFLICT (producto_id, envase_tipo) DO NOTHING;

-- Para producto 000004
INSERT INTO producto_envase_vencimiento (producto_id, envase_tipo, meses_vencimiento) VALUES
('000004', 'Vidrio', 24),   -- Ajustar meses reales
('000004', 'Bolsa', 12),    -- Ajustar meses reales
('000004', 'PET', 18),      -- Ajustar meses reales
('000004', 'Galon', 20),    -- Ajustar meses reales
('000004', 'Doypack', 15),  -- Ajustar meses reales
('000004', 'Lata', 36)      -- Ajustar meses reales
ON CONFLICT (producto_id, envase_tipo) DO NOTHING;

-- Para producto 000005
INSERT INTO producto_envase_vencimiento (producto_id, envase_tipo, meses_vencimiento) VALUES
('000005', 'Vidrio', 18),   -- Ajustar meses reales
('000005', 'Bolsa', 6),     -- Ajustar meses reales
('000005', 'PET', 10),      -- Ajustar meses reales
('000005', 'Galon', 15),    -- Ajustar meses reales
('000005', 'Doypack', 8),   -- Ajustar meses reales
('000005', 'Lata', 24)      -- Ajustar meses reales
ON CONFLICT (producto_id, envase_tipo) DO NOTHING;

-- Script para insertar todos los productos automáticamente
-- (Ejecuta esto después de ajustar los meses)

-- Generar inserts para todos los productos existentes
DO $$
DECLARE
    producto_record RECORD;
    meses_vidrio INTEGER := 24;    -- Valor por defecto, ajustar según producto
    meses_bolsa INTEGER := 6;      -- Valor por defecto, ajustar según producto
    meses_pet INTEGER := 12;       -- Valor por defecto, ajustar según producto
    meses_galon INTEGER := 18;    -- Valor por defecto, ajustar según producto
    meses_doypack INTEGER := 9;    -- Valor por defecto, ajustar según producto
    meses_lata INTEGER := 36;     -- Valor por defecto, ajustar según producto
BEGIN
    FOR producto_record IN SELECT id FROM products ORDER BY id LOOP
        -- Insertar cada tipo de envase para este producto
        INSERT INTO producto_envase_vencimiento (producto_id, envase_tipo, meses_vencimiento) VALUES
        (producto_record.id, 'Vidrio', meses_vidrio),
        (producto_record.id, 'Bolsa', meses_bolsa),
        (producto_record.id, 'PET', meses_pet),
        (producto_record.id, 'Galon', meses_galon),
        (producto_record.id, 'Doypack', meses_doypack),
        (producto_record.id, 'Lata', meses_lata)
        ON CONFLICT (producto_id, envase_tipo) DO NOTHING;
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
