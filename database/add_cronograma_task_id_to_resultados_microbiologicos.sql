-- Agregar columna cronograma_task_id a la tabla de resultados microbiológicos
-- para poder relacionar registros con tareas del cronograma

ALTER TABLE lab_microbiologia.resultados_microbiologicos
ADD COLUMN IF NOT EXISTS cronograma_task_id INTEGER;

-- Crear índice para búsquedas rápidas por tarea de cronograma
CREATE INDEX IF NOT EXISTS idx_resultados_microbiologicos_cronograma_task_id 
ON lab_microbiologia.resultados_microbiologicos(cronograma_task_id);

-- Agregar comentario a la columna
COMMENT ON COLUMN lab_microbiologia.resultados_microbiologicos.cronograma_task_id 
IS 'ID de la tarea del cronograma de microbiología que generó este registro';
