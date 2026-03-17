-- Agregar columna de estado a la tabla de verificaciones de limpieza
ALTER TABLE limpieza_verifications 
ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'pending' 
CHECK (status IN ('pending', 'completed'));

-- Crear índice para el nuevo campo de estado
CREATE INDEX IF NOT EXISTS idx_limpieza_ver_status ON limpieza_verifications(status);

-- Actualizar registros existentes que ya tienen verificación_visual completa
UPDATE limpieza_verifications 
SET status = 'completed' 
WHERE verificacion_visual = 1 
AND (detergente IS NOT NULL AND detergente != '') 
AND (desinfectante IS NOT NULL AND desinfectante != '');

-- Actualizar registros automáticos (sin datos completos) a pendientes
UPDATE limpieza_verifications 
SET status = 'pending' 
WHERE tipo_verificacion = 'LIMPIEZA POST PRODUCCIÓN' 
AND (detergente IS NULL OR detergente = '' 
     OR desinfectante IS NULL OR desinfectante = ''
     OR verificado_por IS NULL OR verificado_por = '');

-- Comentario sobre los estados
COMMENT ON COLUMN limpieza_verifications.status IS 'Estado del registro: pending = pendiente de completar, completed = completado';
