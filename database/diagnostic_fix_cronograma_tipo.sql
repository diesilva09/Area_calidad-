-- Script para diagnosticar y corregir los valores de cronograma_tipo

-- 1. Verificar valores actuales en cronograma_materia_prima
SELECT 'cronograma_materia_prima' as tabla, id, producto_id, cronograma_tipo 
FROM lab_microbiologia.cronograma_materia_prima 
LIMIT 10;

-- 2. Verificar valores actuales en cronograma_pt_externo
SELECT 'cronograma_pt_externo' as tabla, id, producto_id, cronograma_tipo 
FROM lab_microbiologia.cronograma_pt_externo 
LIMIT 10;

-- 3. Verificar valores actuales en cronograma_agua_potable
SELECT 'cronograma_agua_potable' as tabla, id, area, cronograma_tipo, marca_manual 
FROM lab_microbiologia.cronograma_agua_potable 
LIMIT 10;

-- 4. Actualizar cronograma_materia_prima a 'interno' (ya que por defecto es interna)
UPDATE lab_microbiologia.cronograma_materia_prima 
SET cronograma_tipo = 'interno' 
WHERE cronograma_tipo = 'externo';

-- 5. Verificar que cronograma_pt_externo sea 'externo'
UPDATE lab_microbiologia.cronograma_pt_externo 
SET cronograma_tipo = 'externo' 
WHERE cronograma_tipo IS NULL OR cronograma_tipo != 'externo';

-- 6. Verificar cronograma_agua_potable - debería ser 'externo' por defecto
UPDATE lab_microbiologia.cronograma_agua_potable 
SET cronograma_tipo = 'externo' 
WHERE cronograma_tipo IS NULL;

-- 7. Verificar valores después de la actualización
SELECT 'cronograma_materia_prima (despues)' as tabla, id, producto_id, cronograma_tipo 
FROM lab_microbiologia.cronograma_materia_prima 
LIMIT 5;

SELECT 'cronograma_pt_externo (despues)' as tabla, id, producto_id, cronograma_tipo 
FROM lab_microbiologia.cronograma_pt_externo 
LIMIT 5;

SELECT 'cronograma_agua_potable (despues)' as tabla, id, area, cronograma_tipo 
FROM lab_microbiologia.cronograma_agua_potable 
LIMIT 5;
