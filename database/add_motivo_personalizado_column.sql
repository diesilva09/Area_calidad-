-- Agregar columna motivo_personalizado a custodia_muestras
ALTER TABLE lab_microbiologia.custodia_muestras 
ADD COLUMN IF NOT EXISTS motivo_personalizado VARCHAR(255);
