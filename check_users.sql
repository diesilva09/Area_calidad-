-- Verificar usuarios existentes en la base de datos
SELECT 
    id, 
    email, 
    name, 
    role, 
    email_verified,
    created_at,
    updated_at
FROM users 
ORDER BY id;
