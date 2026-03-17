-- Verificar si existen las tablas de limpieza
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE '%limpie%';
