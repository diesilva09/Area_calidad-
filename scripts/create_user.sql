-- Script para crear usuarios manualmente en la base de datos
-- Uso: Reemplaza los valores entre comillas simples y ejecuta el SQL

-- Ejemplo para crear un nuevo usuario:
INSERT INTO users (
    email, 
    password_hash, 
    name, 
    role, 
    is_active, 
    email_verified, 
    created_at, 
    updated_at
) VALUES (
    'nuevo-usuario@ejemplo.com',           -- Email del usuario
    '$2b$10$XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',  -- Contraseña hasheada (usa generate_hash.js)
    'Nombre Completo del Usuario',           -- Nombre completo
    'operario',                             -- Rol: 'jefe' o 'operario'
    true,                                   -- is_active: true para activo
    false,                                  -- email_verified: false para requerir verificación
    CURRENT_TIMESTAMP,                        -- created_at
    CURRENT_TIMESTAMP                         -- updated_at
);

-- Para actualizar un usuario existente:
UPDATE users 
SET 
    password_hash = '$2b$10$XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
    name = 'Nombre Actualizado',
    role = 'jefe',
    is_active = true,
    email_verified = false,
    updated_at = CURRENT_TIMESTAMP
WHERE email = 'usuario@ejemplo.com';

-- Para ver todos los usuarios:
SELECT 
    id, 
    email, 
    name, 
    role, 
    is_active, 
    email_verified,
    created_at
FROM users 
ORDER BY id;

-- Para activar/desactivar un usuario:
UPDATE users SET is_active = true WHERE email = 'usuario@ejemplo.com';
UPDATE users SET is_active = false WHERE email = 'usuario@ejemplo.com';

-- Para verificar manualmente un usuario:
UPDATE users SET email_verified = true, email_verification_token = NULL WHERE email = 'usuario@ejemplo.com';
