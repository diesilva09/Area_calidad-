-- =====================================================
-- Crear tabla de reglas de muestreo por equipo
-- Cada equipo define rangos de tamaño de lote -> nivel de inspección -> unidades a revisar
-- =====================================================

CREATE TABLE IF NOT EXISTS equipo_sampling_rules (
  id SERIAL PRIMARY KEY,
  equipo_id INTEGER NOT NULL REFERENCES equipos(id) ON DELETE CASCADE,
  lote_min INTEGER NOT NULL,
  lote_max INTEGER NOT NULL,
  nivel VARCHAR(5) NOT NULL,
  unidades_revisar INTEGER NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT chk_equipo_sampling_rules_lote_range CHECK (lote_min <= lote_max),
  CONSTRAINT chk_equipo_sampling_rules_unidades CHECK (unidades_revisar > 0)
);

CREATE INDEX IF NOT EXISTS idx_equipo_sampling_rules_equipo_id ON equipo_sampling_rules(equipo_id);
CREATE INDEX IF NOT EXISTS idx_equipo_sampling_rules_equipo_range ON equipo_sampling_rules(equipo_id, lote_min, lote_max);

-- Trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION update_equipo_sampling_rules_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS trigger_update_equipo_sampling_rules_updated_at ON equipo_sampling_rules;
CREATE TRIGGER trigger_update_equipo_sampling_rules_updated_at
  BEFORE UPDATE ON equipo_sampling_rules
  FOR EACH ROW
  EXECUTE FUNCTION update_equipo_sampling_rules_updated_at();
