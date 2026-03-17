-- Actualizar contraseña para diegoy2312@gmail.com
-- Hash correcto generado para 'operario123' con bcrypt (10 rondas)

UPDATE users 
SET password_hash = '$2b$10$SVp0iHv5rjOemVvebpdVBeSJt.xHu.Cf0AS1rESO2DovMG.iJt0wK', 
    updated_at = CURRENT_TIMESTAMP
WHERE email = 'diegoy2312@gmail.com';

-- Verificar la actualización
SELECT id, username, email, role, email_verified, updated_at FROM users WHERE email = 'diegoy2312@gmail.com';
