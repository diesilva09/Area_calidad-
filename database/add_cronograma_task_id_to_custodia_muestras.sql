-- ========================================
-- Migration: Add cronograma_task_id to custodia_muestras
-- ========================================

-- Agregar columna para relacionar registros con tareas del cronograma
ALTER TABLE custodia_muestras 
ADD COLUMN IF NOT EXISTS cronograma_task_id INTEGER REFERENCES microbiologia_cronograma_tasks(id);

-- Crear índice para mejorar rendimiento de búsquedas
CREATE INDEX IF NOT EXISTS idx_custodia_muestras_cronograma_task_id 
ON custodia_muestras(cronograma_task_id);
