-- Script para modificar la tabla products y permitir códigos duplicados entre categorías
-- Solo permite códigos únicos dentro de la misma categoría

-- Paso 1: Eliminar la restricción de unicidad actual del primary key
-- Nota: Esto eliminará el primary key actual
ALTER TABLE products DROP CONSTRAINT products_pkey;

-- Paso 2: Crear un nuevo primary key compuesto (id, category_id)
-- Esto permite que el mismo código exista en diferentes categorías
ALTER TABLE products ADD CONSTRAINT products_pkey PRIMARY KEY (id, category_id);

-- Paso 3: Opcional - Crear un índice único para mantener la unicidad por categoría
-- Esto asegura que no haya duplicados dentro de la misma categoría
CREATE UNIQUE INDEX IF NOT EXISTS products_unique_code_per_category 
ON products (id, category_id);

-- Paso 4: Verificar la estructura de la tabla
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'products' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Paso 5: Mostrar las restricciones actuales
SELECT 
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_name = 'products'
AND tc.table_schema = 'public';
