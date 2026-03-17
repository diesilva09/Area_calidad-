-- Usuario Jefe con correo real
-- Email: diesilva1709@gmail.com
-- Contraseña: jefe123
-- Hash: $2b$12$LQv3c1yqBWVHxkd0LthbVb4x0jEGz4rHj8vYq0vKxTm0

INSERT INTO users (email, password_hash, name, role, email_verified, is_active, created_at, updated_at)
VALUES (
  'diesilva1709@gmail.com', 
  '$2b$12$LQv3c1yqBWVHxkd0LthbVb4x0jEGz4rHj8vYq0vKxTm0', 
  'Diesilva Valdivia', 
  'jefe', 
  false, -- email_verified: false (requiere verificación)
  true, 
  CURRENT_TIMESTAMP, 
  CURRENT_TIMESTAMP
);
