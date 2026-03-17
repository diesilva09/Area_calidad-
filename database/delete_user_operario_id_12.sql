-- ========================================
-- Eliminar usuario operario con ID 12
-- ========================================

-- 1. Verificar el usuario antes de eliminar (opcional)
SELECT * FROM users WHERE id = 12;

-- 2. Eliminar el usuario con ID 12
DELETE FROM users WHERE id = 12;

-- 3. Verificar que el usuario fue eliminado
SELECT 'Usuario con ID 12 eliminado exitosamente' AS resultado;

-- 4. Verificar usuarios restantes (opcional)
SELECT id, username, role, created_at FROM users ORDER BY id;

-- ========================================
-- NOTAS IMPORTANTES:
-- ========================================
-- 1. Este comando eliminará permanentemente el usuario operario con ID 12
-- 2. Asegúrate de tener permisos para ejecutar DELETE en la tabla users
-- 3. Si hay registros relacionados con este usuario, considera:
--    - Actualizarlos a otro usuario primero
--    - O configurar CASCADE en la foreign key (si existe)
-- 4. Haz un backup antes de ejecutar si es importante
-- ========================================
