-- =====================================================
-- Crear tabla de reglas de muestreo para EMBALAJE (RE-CAL-093)
-- Define rangos de tamaño de lote (en cajas) -> nivel de inspección -> cajas a revisar
-- =====================================================

CREATE TABLE IF NOT EXISTS embalaje_sampling_rules (
  id SERIAL PRIMARY KEY,
  lote_min INTEGER NOT NULL,
  lote_max INTEGER NOT NULL,
  nivel VARCHAR(5) NOT NULL,
  cajas_revisar INTEGER NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT chk_embalaje_sampling_rules_lote_range CHECK (lote_min <= lote_max),
  CONSTRAINT chk_embalaje_sampling_rules_cajas CHECK (cajas_revisar > 0)
);

CREATE INDEX IF NOT EXISTS idx_embalaje_sampling_rules_active ON embalaje_sampling_rules(is_active);
CREATE INDEX IF NOT EXISTS idx_embalaje_sampling_rules_range ON embalaje_sampling_rules(lote_min, lote_max);

-- Trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION update_embalaje_sampling_rules_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS trigger_update_embalaje_sampling_rules_updated_at ON embalaje_sampling_rules;
CREATE TRIGGER trigger_update_embalaje_sampling_rules_updated_at
  BEFORE UPDATE ON embalaje_sampling_rules
  FOR EACH ROW
  EXECUTE FUNCTION update_embalaje_sampling_rules_updated_at();
