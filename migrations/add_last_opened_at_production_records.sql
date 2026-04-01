-- Agregar columna last_opened_at a production_records
-- Registra la última vez que se abrió el registro (para calcular alertas de pendientes)
ALTER TABLE production_records
  ADD COLUMN IF NOT EXISTS last_opened_at TIMESTAMP WITH TIME ZONE;

CREATE INDEX IF NOT EXISTS idx_production_records_pending_check
  ON production_records (status, last_opened_at, created_at)
  WHERE is_active = true;
