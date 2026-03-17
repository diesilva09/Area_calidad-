-- RE-CAL-013 - Verificación de BPM en Manipuladores de Alimentos

CREATE TABLE IF NOT EXISTS bpm_verifications (
  id SERIAL PRIMARY KEY,
  fecha DATE NOT NULL,
  nombre VARCHAR(255) NOT NULL,
  area VARCHAR(100) NOT NULL,

  -- Requisitos BPM (cumple / no_cumple)
  req_uniforme VARCHAR(20) NOT NULL,
  req_unas VARCHAR(20) NOT NULL,
  req_sin_joyas VARCHAR(20) NOT NULL,
  req_sin_cabellos VARCHAR(20) NOT NULL,
  req_barba VARCHAR(20) NOT NULL,
  req_manos VARCHAR(20) NOT NULL,
  req_guantes VARCHAR(20) NOT NULL,
  req_petos_botas VARCHAR(20) NOT NULL,
  req_epp VARCHAR(20) NOT NULL,
  req_no_accesorios VARCHAR(20) NOT NULL,

  turno CHAR(1) NOT NULL,
  observaciones TEXT,
  correccion TEXT,
  firma_empleado TEXT,
  responsable VARCHAR(100) NOT NULL,

  created_by VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_bpm_verifications_fecha ON bpm_verifications(fecha);
CREATE INDEX IF NOT EXISTS idx_bpm_verifications_created_at ON bpm_verifications(created_at);

-- Trigger para updated_at

