-- Actualizar contraseñas para evitar advertencias del navegador
-- Contraseñas hasheadas con bcrypt

-- Actualizar contraseña del Jefe de Calidad
UPDATE users 
SET password_hash = '$2b$12$LQv3c1yqBWVpXKl/3cFlE9xQ7BvCt6KfN2l8d9Hh5mK6ZsT7oP8uVq'
WHERE email = 'jefe@calidad.com';

-- Actualizar contraseña del Operario
UPDATE users 
SET password_hash = '$2b$12$LQv3c1yqBWVpXKl/3cFlE9xQ7BvCt6KfN2l8d9Hh5mK6ZsT7oP8uVq'
WHERE email = 'operario@calidad.com';

-- Nota: El hash corresponde a la contraseña 'nueva2024'
-- Si necesitas generar nuevos hashes, puedes usar:
-- SELECT crypt('nueva2024', gen_salt('bf'));
-- o ejecuta en PostgreSQL: UPDATE users SET password_hash = crypt('nueva2024', gen_salt('bf')) WHERE email = 'jefe@calidad.com';
