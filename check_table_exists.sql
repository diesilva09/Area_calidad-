-- Verificar si existe la tabla limpieza_tasks
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_name = 'limpieza_tasks'
) as table_exists;
