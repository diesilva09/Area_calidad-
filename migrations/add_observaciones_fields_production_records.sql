-- Migración: Agregar campos de observaciones adicionales a production_records
-- Para el formulario RE-CAL-084

ALTER TABLE production_records
ADD COLUMN IF NOT EXISTS observaciones_analisis_pruebas TEXT NULL;

ALTER TABLE production_records
ADD COLUMN IF NOT EXISTS observaciones_peso_drenado TEXT NULL;

ALTER TABLE production_records
ADD COLUMN IF NOT EXISTS observaciones_peso_neto TEXT NULL;

-- Nota: Los campos tienenObservacionesAnalisisPruebas, tieneObservacionesPesoDrenado,
-- tieneObservacionesPesoNeto son solo de UI (no se guardan en BD)
