-- Migración para agregar columna marca_manual al cronograma de producto terminado
-- Esta columna permite marcar tareas completadas como "Realizado Externo" o "Alérgenos"

ALTER TABLE lab_microbiologia.cronograma_producto_terminado
ADD COLUMN IF NOT EXISTS marca_manual VARCHAR(20) DEFAULT NULL;

-- Comentario descriptivo
COMMENT ON COLUMN lab_microbiologia.cronograma_producto_terminado.marca_manual IS 'Marca manual para tareas completadas: externo (Realizado Externo - Azul), alergenos (Alérgenos - Violeta)';

-- Índice para búsquedas por marca
CREATE INDEX IF NOT EXISTS idx_cronograma_pt_marca_manual 
ON lab_microbiologia.cronograma_producto_terminado(marca_manual) 
WHERE marca_manual IS NOT NULL;
