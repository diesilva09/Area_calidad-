CREATE TABLE IF NOT EXISTS limpieza_task_templates (
  id SERIAL PRIMARY KEY,
  area VARCHAR(255) NOT NULL,
  tipo_muestra VARCHAR(255) NOT NULL,
  detalles TEXT,
  mes_corte VARCHAR(255),
  frequency_type VARCHAR(20) NOT NULL CHECK (frequency_type IN ('daily', 'weekly', 'monthly', 'custom')),
  frequency_unit VARCHAR(10) CHECK (frequency_unit IN ('day', 'week', 'month')),
  frequency_interval INTEGER NOT NULL DEFAULT 1 CHECK (frequency_interval >= 1),
  start_date DATE NOT NULL,
  end_date DATE,
  timezone VARCHAR(64) NOT NULL DEFAULT 'America/Bogota',
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by VARCHAR(255)
);

DO $$
DECLARE
  tasks_table text;
BEGIN
  tasks_table := CASE
    WHEN to_regclass('public.limpieza_tasks') IS NOT NULL THEN 'limpieza_tasks'
    WHEN to_regclass('public.limpienza_tasks') IS NOT NULL THEN 'limpienza_tasks'
    ELSE NULL
  END;

  IF tasks_table IS NULL THEN
    RAISE EXCEPTION 'No existe tabla de tareas de limpieza (limpieza_tasks/limpienza_tasks)';
  END IF;

  EXECUTE format('ALTER TABLE %I ADD COLUMN IF NOT EXISTS template_id INTEGER', tasks_table);

  BEGIN
    EXECUTE format(
      'ALTER TABLE %I ADD CONSTRAINT %I FOREIGN KEY (template_id) REFERENCES limpieza_task_templates(id) ON DELETE SET NULL',
      tasks_table,
      tasks_table || '_template_id_fkey'
    );
  EXCEPTION
    WHEN duplicate_object THEN
      NULL;
  END;

  EXECUTE format(
    'CREATE UNIQUE INDEX IF NOT EXISTS %I ON %I(template_id, fecha) WHERE template_id IS NOT NULL',
    'idx_' || tasks_table || '_template_id_fecha_unique',
    tasks_table
  );
END $$;

CREATE INDEX IF NOT EXISTS idx_limpieza_task_templates_active
  ON limpieza_task_templates(active);

CREATE INDEX IF NOT EXISTS idx_limpieza_task_templates_start_end
  ON limpieza_task_templates(start_date, end_date);
