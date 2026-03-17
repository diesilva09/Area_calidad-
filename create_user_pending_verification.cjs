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

async function createUserPendingVerification() {
  try {
    console.log('🔍 Creando usuario con verificación pendiente...');
    
    // Crear contraseña hasheada
    const password = 'Admin2024!';
    const passwordHash = await bcrypt.hash(password, 10);
    
    // Generar token de verificación
    const verificationToken = 'VER-' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    
    console.log('🔐 Contraseña hasheada generada');
    console.log('🔑 Token de verificación:', verificationToken);
    
    // Insertar usuario con email_verified = false y token de verificación
    const insertResult = await pool.query(`
      INSERT INTO users (email, password_hash, name, role, is_active, email_verified, email_verification_token) 
      VALUES ($1, $2, $3, $4, $5, $6, $7) 
      ON CONFLICT (email) DO UPDATE SET
        password_hash = EXCLUDED.password_hash,
        is_active = EXCLUDED.is_active,
        email_verified = EXCLUDED.email_verified,
        email_verification_token = EXCLUDED.email_verification_token,
        updated_at = CURRENT_TIMESTAMP
      RETURNING id, email, name, role, is_active, email_verified, email_verification_token
    `, [
      'diesilva1709@gmail.com',
      passwordHash,
      'Diego Silva',
      'jefe',
      true,
      false, // Importante: email_verified = false
      verificationToken
    ]);
    
    console.log('✅ Usuario creado con verificación pendiente:');
    console.table(insertResult.rows);
    
    console.log('\n📋 Estado del usuario:');
    console.log('📧 Email: diesilva1709@gmail.com');
    console.log('🔒 Contraseña: Admin2024!');
    console.log('👤 Rol: jefe');
    console.log('✅ Activo: true');
    console.log('❌ Email verificado: false');
    console.log('🔑 Token de verificación:', verificationToken);
    
    console.log('\n🔄 Proceso de verificación:');
    console.log('1. Intenta iniciar sesión en http://localhost:9002');
    console.log('2. El sistema detectará que el email no está verificado');
    console.log('3. Enviará un correo con el enlace de verificación');
    console.log('4. También mostrará el token en la consola del servidor');
    console.log('5. Podrás usar el enlace o el token para verificar');
    
    console.log('\n🔗 Enlace de verificación (directo):');
    console.log(`http://localhost:9002/verify-email?token=${verificationToken}`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('❌ Detalles:', error);
  } finally {
    await pool.end();
  }
}

createUserPendingVerification();
