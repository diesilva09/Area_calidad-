-- Migración para agregar columna marca_manual al cronograma de microbiología
-- Esta columna permite marcar tareas completadas como "Realizado Externo" o "Alergenos"

ALTER TABLE lab_microbiologia.microbiologia_cronograma
ADD COLUMN IF NOT EXISTS marca_manual VARCHAR(20) DEFAULT NULL;

-- Comentario descriptivo
COMMENT ON COLUMN lab_microbiologia.microbiologia_cronograma.marca_manual IS 'Marca manual para tareas completadas: externo (Realizado Externo - Azul), alergenos (Alérgenos - Violeta)';

-- Índice para búsquedas por marca
CREATE INDEX IF NOT EXISTS idx_microbiologia_cronograma_marca_manual 
ON lab_microbiologia.microbiologia_cronograma(marca_manual) 
WHERE marca_manual IS NOT NULL;
