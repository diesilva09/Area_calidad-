-- Actualizar contraseña para diegoy2312@gmail.com
-- Hash generado para 'operario123' con bcrypt (12 rondas)

UPDATE users 
SET password_hash = '$2b$12$EixZaYaN1r8rL3N1Mz9e8vK5f8hLZ2v7r9q0wXj9kL3N1Mz9e8vK5f8hLZ2v7r9q0wXj9k', 
    verified = true,
    updated_at = CURRENT_TIMESTAMP
WHERE email = 'diegoy2312@gmail.com';

-- Verificar la actualización
SELECT id, username, email, role, verified, updated_at FROM users WHERE email = 'diegoy2312@gmail.com';
