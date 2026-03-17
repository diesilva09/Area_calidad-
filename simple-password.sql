-- Crear usuario con contraseña simple '123456'
-- Hash generado con bcrypt rounds=10

INSERT INTO users (email, password_hash, name, role, email_verified, is_active, created_at, updated_at)
VALUES (
  'diesilva1709@gmail.com', 
  '$2b$10$N9qo8uLOickgx2ZMRZ9OeIqjQ4e5aJqGZjKqKqKqKqKqKqKqKqKqKq', -- hash para '123456'
  'Diesilva Valdivia', 
  'jefe', 
  false, -- email_verified: false (requiere verificación)
  true, 
  CURRENT_TIMESTAMP, 
  CURRENT_TIMESTAMP
)
ON CONFLICT (email) 
DO UPDATE SET 
  password_hash = EXCLUDED.password_hash,
  updated_at = CURRENT_TIMESTAMP;
