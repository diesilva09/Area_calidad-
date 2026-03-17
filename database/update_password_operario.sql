-- ========================================
-- Actualizar contraseña del usuario operario
-- ========================================

-- 1. Verificar el usuario actual
SELECT id, username, email, role, verified FROM users WHERE email = 'diegoy2312@gmail.com';

-- 2. Actualizar contraseña (ajusta según tu método de hashing)
-- Opción A: Si usas texto plano (no recomendado para producción)
UPDATE users SET password = 'operario123', verified = true, updated_at = CURRENT_TIMESTAMP WHERE email = 'diegoy2312@gmail.com';

-- Opción B: Si usas bcrypt (recomendado)
-- UPDATE users SET password = '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', verified = true, updated_at = CURRENT_TIMESTAMP WHERE email = 'diegoy2312@gmail.com';

-- Opción C: Si usas otro método de hashing
-- UPDATE users SET password = 'hash_aqui', verified = true, updated_at = CURRENT_TIMESTAMP WHERE email = 'diegoy2312@gmail.com';

-- 3. Verificar la actualización
SELECT id, username, email, role, verified, updated_at FROM users WHERE email = 'diegoy2312@gmail.com';

-- ========================================
-- NOTAS:
-- ========================================
-- 1. La contraseña 'operario123' necesita estar en el mismo formato que tu AuthService espera
-- 2. Si usas hashing, genera el hash con el mismo método que usa tu AuthService
-- 3. El campo 'verified' está en false, debería estar en true para usuarios activos
-- 4. Prueba primero con texto plano (Opción A) para descartar problemas
-- ========================================
