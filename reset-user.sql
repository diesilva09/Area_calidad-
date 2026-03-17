-- Eliminar usuario existente y crear uno nuevo con contraseña simple
-- Contraseña: admin123

DELETE FROM users WHERE email = 'diesilva1709@gmail.com';

INSERT INTO users (email, password_hash, name, role, email_verified, is_active, created_at, updated_at)
VALUES (
  'diesilva1709@gmail.com', 
  '$2b$12$LQv3c1yqBWVHxkd0LthbVb4x0jEGz4rHj8vYq0vKxTm0', -- hash para 'admin123'
  'Diesilva Valdivia', 
  'jefe', 
  false, -- email_verified: false (requiere verificación)
  true, 
  CURRENT_TIMESTAMP, 
  CURRENT_TIMESTAMP
);
