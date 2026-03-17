const { Pool } = require('pg');
const bcrypt = require('bcrypt');

// Configuración de conexión
const pool = new Pool({
  host: 'localhost',
  port: '5432',
  database: 'area_calidad',
  user: 'postgres',
  password: 'Coruna.24',
});

async function createPersonalUser() {
  try {
    console.log('🔍 Creando usuario personal...');
    
    // Crear contraseña hasheada (usaremos una contraseña temporal segura)
    const password = 'Admin2024!';
    const passwordHash = await bcrypt.hash(password, 10);
    
    console.log('🔐 Contraseña hasheada generada');
    
    // Insertar usuario personal
    const insertResult = await pool.query(`
      INSERT INTO users (email, password_hash, name, role, is_active, email_verified) 
      VALUES ($1, $2, $3, $4, $5, $6) 
      ON CONFLICT (email) DO UPDATE SET
        password_hash = EXCLUDED.password_hash,
        is_active = EXCLUDED.is_active,
        email_verified = EXCLUDED.email_verified,
        updated_at = CURRENT_TIMESTAMP
      RETURNING id, email, name, role, is_active, email_verified
    `, [
      'diesilva1709@gmail.com',
      passwordHash,
      'Diego Silva',
      'jefe',
      true,
      true
    ]);
    
    console.log('✅ Usuario personal creado/actualizado:');
    console.table(insertResult.rows);
    
    console.log('\n🔑 Credenciales para tu acceso:');
    console.log('📧 Email: diesilva1709@gmail.com');
    console.log('🔒 Contraseña: Admin2024!');
    console.log('👤 Rol: jefe');
    console.log('✅ Estado: Activo y Verificado');
    console.log('\n⚠️  Recuerda cambiar la contraseña después del primer inicio de sesión');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('❌ Detalles:', error);
  } finally {
    await pool.end();
  }
}

createPersonalUser();
