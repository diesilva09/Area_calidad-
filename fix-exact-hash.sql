-- Actualizar con el hash exacto que funciona
-- Usando el mismo hash que está actualmente guardado

UPDATE users 
SET password_hash = '$2b$12$LQv3c1yqBWVHxkd0LthbVb4x0jEGz4rHj8vYq0vKxTm0', 
    updated_at = CURRENT_TIMESTAMP
WHERE email = 'diesilva1709@gmail.com';
