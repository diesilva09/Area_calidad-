-- Script para agregar campos cronograma_codigo y cronograma_tipo a la tabla general microbiologia_cronograma

-- Verificar si la tabla existe y agregar campos
ALTER TABLE lab_microbiologia.microbiologia_cronograma 
ADD COLUMN IF NOT EXISTS cronograma_codigo VARCHAR(50);

ALTER TABLE lab_microbiologia.microbiologia_cronograma 
ADD COLUMN IF NOT EXISTS cronograma_tipo VARCHAR(20) 
CHECK (cronograma_tipo IN ('interno', 'externo'));

-- Comentarios
COMMENT ON COLUMN lab_microbiologia.microbiologia_cronograma.cronograma_codigo IS 'Código del cronograma (PL-CAL-008, PL-CAL-009, etc.)';
COMMENT ON COLUMN lab_microbiologia.microbiologia_cronograma.cronograma_tipo IS 'Tipo de cronograma: interno o externo';

-- Verificar estructura
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_schema = 'lab_microbiologia' 
AND table_name = 'microbiologia_cronograma'
AND column_name IN ('cronograma_codigo', 'cronograma_tipo');
