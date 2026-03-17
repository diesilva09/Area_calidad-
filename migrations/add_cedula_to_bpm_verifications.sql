ALTER TABLE IF EXISTS verificacion_bpm.bpm_verifications
ADD COLUMN IF NOT EXISTS cedula VARCHAR(50);