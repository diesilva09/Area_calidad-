-- Agregar campo de turno (día/noche) a limpieza_registros

ALTER TABLE limpieza_registros
ADD COLUMN IF NOT EXISTS turno VARCHAR(10);

-- Opcional: constraint básico para valores esperados
DO $$
DECLARE
  c_name text;
BEGIN
  SELECT conname INTO c_name
  FROM pg_constraint
  WHERE conrelid = 'limpieza_registros'::regclass
    AND contype = 'c'
    AND pg_get_constraintdef(oid) ILIKE '%turno%'
  LIMIT 1;

  IF c_name IS NULL THEN
    BEGIN
      ALTER TABLE limpieza_registros
        ADD CONSTRAINT limpieza_registros_turno_check
        CHECK (turno IS NULL OR turno IN ('dia', 'noche'));
    EXCEPTION
      WHEN duplicate_object THEN
        NULL;
    END;
  END IF;
END $$;
