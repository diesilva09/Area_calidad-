-- Extiende limpieza_registros para soportar registros generados desde cronograma

-- 1) Agregar columna para vincular registro con tarea del cronograma
ALTER TABLE limpieza_registros
ADD COLUMN IF NOT EXISTS cronograma_task_id INTEGER;

-- 2) Ajustar constraint de origin para permitir 'cronograma'
DO $$
DECLARE
  c_name text;
BEGIN
  SELECT conname INTO c_name
  FROM pg_constraint
  WHERE conrelid = 'limpieza_registros'::regclass
    AND contype = 'c'
    AND pg_get_constraintdef(oid) ILIKE '%origin%'
    AND pg_get_constraintdef(oid) ILIKE '%manual%'
    AND pg_get_constraintdef(oid) ILIKE '%produccion%'
  LIMIT 1;

  IF c_name IS NOT NULL THEN
    EXECUTE format('ALTER TABLE limpieza_registros DROP CONSTRAINT %I', c_name);
  END IF;

  BEGIN
    ALTER TABLE limpieza_registros
      ADD CONSTRAINT limpieza_registros_origin_check
      CHECK (origin IN ('manual', 'produccion', 'cronograma'));
  EXCEPTION
    WHEN duplicate_object THEN
      NULL;
  END;
END $$;

-- 3) Índice para consultas por cronograma_task_id
CREATE INDEX IF NOT EXISTS idx_limpieza_registros_cronograma_task_id
  ON limpieza_registros(cronograma_task_id);
