-- ========================================
-- Migración: Agregar columnas faltantes a RE-CAL-038
-- ========================================

-- Agregar columnas faltantes a la tabla analisis_fisicoquimico_materia_prima
ALTER TABLE materia_prima.analisis_fisicoquimico_materia_prima
ADD COLUMN IF NOT EXISTS fecha_vencimiento DATE,
ADD COLUMN IF NOT EXISTS lote_interno VARCHAR(100),
ADD COLUMN IF NOT EXISTS lote_proveedor VARCHAR(100),
ADD COLUMN IF NOT EXISTS unds_analizar VARCHAR(50),
ADD COLUMN IF NOT EXISTS l VARCHAR(50),
ADD COLUMN IF NOT EXISTS brix VARCHAR(50),
ADD COLUMN IF NOT EXISTS indice_refraccion VARCHAR(50);

-- Verificación
SELECT 'Columnas agregadas exitosamente' AS status;
