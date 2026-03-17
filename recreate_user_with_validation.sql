-- ========================================
-- Eliminar y recrear usuario operario con validación por correo
-- ========================================

-- 1. Eliminar el usuario existente
DELETE FROM users WHERE email = 'diegoy2312@gmail.com';

-- 2. Eliminar tokens de validación pendientes (si existen)
DELETE FROM email_verification_tokens WHERE user_id IN (
    SELECT id FROM users WHERE email = 'diegoy2312@gmail.com'
);

-- 3. Crear nuevo usuario no verificado
INSERT INTO users (
    username, 
    email, 
    password_hash, 
    role, 
    verified, 
    created_at, 
    updated_at
) VALUES (
    'operario',
    'diegoy2312@gmail.com',
    '$2b$12$EixZaYaN1r8rL3N1Mz9e8vK5f8hLZ2v7r9q0wXj9kL3N1Mz9e8vK5f8hLZ2v7r9q0wXj9k',
    'operario',
    false, -- Importante: verified = false para activar el proceso de validación
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
);

-- 4. Generar token de validación
INSERT INTO email_verification_tokens (
    user_id, 
    token, 
    expires_at, 
    created_at
) VALUES (
    (SELECT id FROM users WHERE email = 'diegoy2312@gmail.com'),
    'VALIDACION_OPERARIO_' || EXTRACT(EPOCH FROM NOW())::text,
    CURRENT_TIMESTAMP + INTERVAL '24 hours',
    CURRENT_TIMESTAMP
);

-- 5. Verificar el proceso
SELECT 
    u.id, 
    u.username, 
    u.email, 
    u.role, 
    u.verified,
    u.created_at,
    evt.token,
    evt.expires_at
FROM users u
LEFT JOIN email_verification_tokens evt ON u.id = evt.user_id
WHERE u.email = 'diegoy2312@gmail.com';

-- ========================================
-- NOTAS:
-- ========================================
-- 1. El usuario se crea con verified = false
-- 2. Se genera un token de validación válido por 24 horas
-- 3. El sistema debería enviar automáticamente el email de validación
-- 4. Para validar manualmente, usa: /api/auth/verify-email?token=TOKEN_GENERADO
-- ========================================
