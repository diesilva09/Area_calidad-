-- ========================================
-- Forzar validación del usuario operario
-- ========================================

-- 1. Verificar estado actual del usuario
SELECT id, username, email, role, verified, created_at FROM users WHERE email = 'diegoy2312@gmail.com';

-- 2. Actualizar usuario como validado manualmente
UPDATE users 
SET verified = true, 
    email_verified_at = CURRENT_TIMESTAMP,
    updated_at = CURRENT_TIMESTAMP
WHERE email = 'diegoy2312@gmail.com';

-- 3. Si existe tabla de tokens de validación, eliminar tokens pendientes
DELETE FROM email_verification_tokens WHERE user_id = (SELECT id FROM users WHERE email = 'diegoy2312@gmail.com');

-- 4. Verificar la actualización
SELECT id, username, email, role, verified, email_verified_at, updated_at FROM users WHERE email = 'diegoy2312@gmail.com';

-- 5. Si necesitas generar un token de validación manualmente
-- INSERT INTO email_verification_tokens (user_id, token, expires_at, created_at)
-- VALUES (
--   (SELECT id FROM users WHERE email = 'diegoy2312@gmail.com'),
--   'token_manual_validacion_123456',
--   CURRENT_TIMESTAMP + INTERVAL '24 hours',
--   CURRENT_TIMESTAMP
-- );

-- ========================================
-- NOTAS:
-- ========================================
-- 1. Este script marca al usuario como validado sin necesidad de email
-- 2. Si tu sistema requiere email_verified_at, lo establece
-- 3. Elimina tokens pendientes para evitar conflictos
-- 4. Si necesitas el proceso completo de email, descomenta la sección 5
-- ========================================
