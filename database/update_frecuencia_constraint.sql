-- Actualizar la constraint de frecuencia para permitir 'Sin frecuencia'
-- Primero eliminar la constraint existente y luego crear una nueva

-- Eliminar la constraint existente
ALTER TABLE lab_microbiologia.microbiologia_cronograma 
DROP CONSTRAINT IF EXISTS microbiologia_cronograma_frecuencia_check;

-- Agregar la nueva constraint con 'Sin frecuencia' incluido
ALTER TABLE lab_microbiologia.microbiologia_cronograma 
ADD CONSTRAINT microbiologia_cronograma_frecuencia_check 
CHECK (frecuencia IN ('Sin frecuencia', 'Diaria', 'Semanal', 'Quincenal', 'Mensual'));

-- Actualizar registros existentes que tengan NULL o valor vacío
UPDATE lab_microbiologia.microbiologia_cronograma 
SET frecuencia = 'Sin frecuencia' 
WHERE frecuencia IS NULL OR frecuencia = '';
