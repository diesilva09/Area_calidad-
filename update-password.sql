-- Actualizar contraseña para diesilva1709@gmail.com
-- Usando hash estándar para 'jefe123'

UPDATE users 
SET password_hash = '$2b$12$LQv3c1yqBWVHxkd0LthbVb4x0jEGz4rHj8vYq0vKxTm0', 
    updated_at = CURRENT_TIMESTAMP
WHERE email = 'diesilva1709@gmail.com';
