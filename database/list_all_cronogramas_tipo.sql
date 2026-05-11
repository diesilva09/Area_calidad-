-- Script para enlistar todos los cronogramas y ver si son externos o internos

-- 1. Cronograma Agua Potable
SELECT 
  'cronograma_agua_potable' as tabla,
  id,
  area as detalle,
  fecha_programada,
  estado,
  cronograma_tipo,
  marca_manual
FROM lab_microbiologia.cronograma_agua_potable
ORDER BY fecha_programada DESC;

-- 2. Cronograma Materia Prima
SELECT 
  'cronograma_materia_prima' as tabla,
  id,
  producto_nombre as detalle,
  fecha_programada,
  estado,
  cronograma_tipo,
  tipo_materia as marca_manual
FROM lab_microbiologia.cronograma_materia_prima
ORDER BY fecha_programada DESC;

-- 3. Cronograma Producto Terminado Externo
SELECT 
  'cronograma_pt_externo' as tabla,
  id,
  producto_nombre as detalle,
  fecha_programada,
  estado,
  cronograma_tipo,
  area as marca_manual
FROM lab_microbiologia.cronograma_pt_externo
ORDER BY fecha_programada DESC;

-- 4. Resumen general
SELECT 
  'Resumen Cronogramas' as info,
  (SELECT COUNT(*) FROM lab_microbiologia.cronograma_agua_potable WHERE cronograma_tipo = 'externo') as agua_potable_externo,
  (SELECT COUNT(*) FROM lab_microbiologia.cronograma_agua_potable WHERE cronograma_tipo = 'interno') as agua_potable_interno,
  (SELECT COUNT(*) FROM lab_microbiologia.cronograma_materia_prima WHERE cronograma_tipo = 'externo') as materia_prima_externo,
  (SELECT COUNT(*) FROM lab_microbiologia.cronograma_materia_prima WHERE cronograma_tipo = 'interno') as materia_prima_interno,
  (SELECT COUNT(*) FROM lab_microbiologia.cronograma_pt_externo WHERE cronograma_tipo = 'externo') as pt_externo_externo,
  (SELECT COUNT(*) FROM lab_microbiologia.cronograma_pt_externo WHERE cronograma_tipo = 'interno') as pt_externo_interno;
