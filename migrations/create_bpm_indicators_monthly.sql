-- Indicadores mensuales - Verificación BPM (RE-CAL-013)

CREATE TABLE IF NOT EXISTS verificacion_bpm.bpm_indicators_monthly (
  id SERIAL PRIMARY KEY,
  mes INTEGER NOT NULL,
  anio INTEGER NOT NULL,
  total_registros INTEGER NOT NULL,
  registros_cumplen INTEGER NOT NULL,
  porcentaje_cumplimiento NUMERIC(5,2) NOT NULL,
  fecha_calculo TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT bpm_indicators_monthly_unique UNIQUE (mes, anio)
);

CREATE INDEX IF NOT EXISTS idx_bpm_indicators_monthly_mes_anio
  ON verificacion_bpm.bpm_indicators_monthly (anio, mes);
