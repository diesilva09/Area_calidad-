-- ========================================
-- Corregir estructura de tabla users para que funcione con AuthService
-- ========================================

-- 1. Verificar estructura actual
\d users

-- 2. Renombrar columnas si es necesario
-- Si tienes 'verified' en lugar de 'email_verified'
-- ALTER TABLE users RENAME COLUMN verified TO email_verified;

-- Si tienes 'password' en lugar de 'password_hash'
-- ALTER TABLE users RENAME COLUMN password TO password_hash;

-- 3. Agregar columnas faltantes si no existen
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verification_token VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_reset_token VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_reset_expires TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified_at TIMESTAMP;

-- 4. Crear tabla de sesiones si no existe
CREATE TABLE IF NOT EXISTS user_sessions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(255) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. Crear función para limpiar sesiones expiradas
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS void AS $$
BEGIN
    DELETE FROM user_sessions WHERE expires_at < CURRENT_TIMESTAMP;
END;
$$ LANGUAGE plpgsql;

-- 6. Crear índices
CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON user_sessions(token);
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires_at ON user_sessions(expires_at);

-- 7. Verificar estructura final
\d users

-- ========================================
-- NOTAS:
-- ========================================
-- 1. Este script ajusta la tabla users para que funcione con el AuthService actual
-- 2. Renombra columnas si es necesario
-- 3. Agrega columnas faltantes
-- 4. Crea tabla de sesiones requerida para el login
-- ========================================
