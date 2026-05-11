-- Script para agregar campo cronograma_tipo a las tablas de cronograma
-- Este campo define explícitamente si el cronograma es externo o interno

-- Agregar campo a cronograma_agua_potable
ALTER TABLE lab_microbiologia.cronograma_agua_potable 
ADD COLUMN IF NOT EXISTS cronograma_tipo VARCHAR(20) DEFAULT 'externo' 
CHECK (cronograma_tipo IN ('interno', 'externo'));

-- Actualizar datos existentes en cronograma_agua_potable
UPDATE lab_microbiologia.cronograma_agua_potable 
SET cronograma_tipo = 'externo' 
WHERE cronograma_tipo IS NULL;

COMMENT ON COLUMN lab_microbiologia.cronograma_agua_potable.cronograma_tipo IS 'Tipo de cronograma: interno o externo';

-- Agregar campo a cronograma_materia_prima
ALTER TABLE lab_microbiologia.cronograma_materia_prima 
ADD COLUMN IF NOT EXISTS cronograma_tipo VARCHAR(20) DEFAULT 'externo' 
CHECK (cronograma_tipo IN ('interno', 'externo'));

-- Actualizar datos existentes en cronograma_materia_prima
UPDATE lab_microbiologia.cronograma_materia_prima 
SET cronograma_tipo = 'externo' 
WHERE cronograma_tipo IS NULL;

COMMENT ON COLUMN lab_microbiologia.cronograma_materia_prima.cronograma_tipo IS 'Tipo de cronograma: interno o externo';

-- Agregar campo a cronograma_pt_externo
ALTER TABLE lab_microbiologia.cronograma_pt_externo 
ADD COLUMN IF NOT EXISTS cronograma_tipo VARCHAR(20) DEFAULT 'externo' 
CHECK (cronograma_tipo IN ('interno', 'externo'));

-- Actualizar datos existentes en cronograma_pt_externo
UPDATE lab_microbiologia.cronograma_pt_externo 
SET cronograma_tipo = 'externo' 
WHERE cronograma_tipo IS NULL;

COMMENT ON COLUMN lab_microbiologia.cronograma_pt_externo.cronograma_tipo IS 'Tipo de cronograma: interno o externo';

-- Agregar campo cronograma_tipo a las tablas de registros para mantener consistencia
-- resultados_microbiologicos ya tiene interno_externo, pero agregamos cronograma_tipo para consistencia
ALTER TABLE lab_microbiologia.resultados_microbiologicos 
ADD COLUMN IF NOT EXISTS cronograma_tipo VARCHAR(20);

COMMENT ON COLUMN lab_microbiologia.resultados_microbiologicos.cronograma_tipo IS 'Tipo de cronograma: interno o externo (derivado del cronograma asociado)';

-- custodia_muestras
ALTER TABLE lab_microbiologia.custodia_muestras 
ADD COLUMN IF NOT EXISTS cronograma_tipo VARCHAR(20);

COMMENT ON COLUMN lab_microbiologia.custodia_muestras.cronograma_tipo IS 'Tipo de cronograma: interno o externo (derivado del cronograma asociado)';

-- Verificación
SELECT 'Campo cronograma_tipo agregado exitosamente' AS status;
