-- Actualizar contraseña para diegoy2312@gmail.com
-- Usando hash estándar para 'operario123'

UPDATE users 
SET password_hash = '$2b$12$LQv3c1yqBWVHxkd0LthbVb4x0jEGz4rHj8vYq0vKxTm0', 
    verified = true,
    updated_at = CURRENT_TIMESTAMP
WHERE email = 'diegoy2312@gmail.com';

-- Verificar la actualización
SELECT id, username, email, role, verified, updated_at FROM users WHERE email = 'diegoy2312@gmail.com';
