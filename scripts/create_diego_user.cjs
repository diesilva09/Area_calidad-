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

async function createDiegoUser() {
  try {
    console.log('🔍 Creando usuario para Diego Silva con Brevo...');
    
    // Crear contraseña hasheada
    const password = 'Admin2024!';
    const passwordHash = await bcrypt.hash(password, 10);
    
    console.log('🔐 Contraseña hasheada generada');
    
    // Generar token de verificación
    const verificationToken = 'VER-' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    
    console.log('🔑 Token de verificación:', verificationToken);
    
    // Insertar usuario con email_verified = false para probar el flujo
    const insertResult = await pool.query(`
      INSERT INTO users (email, password_hash, name, role, is_active, email_verified, email_verification_token) 
      VALUES ($1, $2, $3, $4, $5, $6, $7) 
      ON CONFLICT (email) DO UPDATE SET
        password_hash = EXCLUDED.password_hash,
        is_active = EXCLUDED.is_active,
        email_verified = EXCLUDED.email_verified,
        email_verification_token = EXCLUDED.email_verification_token,
        updated_at = CURRENT_TIMESTAMP
      RETURNING id, email, name, role, is_active, email_verified
    `, [
      'diesilva1709@gmail.com',
      passwordHash,
      'Diego Silva',
      'jefe',
      true,
      false, // Importante: no verificado para probar el flujo con Brevo
      verificationToken
    ]);
    
    console.log('✅ Usuario creado para prueba con Brevo:');
    console.table(insertResult.rows);
    
    console.log('\n📋 Credenciales para prueba:');
    console.log('📧 Email: diesilva1709@gmail.com');
    console.log('🔒 Contraseña: Admin2024!');
    console.log('👤 Rol: jefe');
    console.log('✅ Activo: true');
    console.log('❌ Email verificado: false (para probar flujo)');
    
    console.log('\n🔄 Flujo de prueba con Brevo:');
    console.log('1. Inicia el servidor: npm run dev');
    console.log('2. Ve a: http://localhost:9002/login');
    console.log('3. Ingresa: diesilva1709@gmail.com / Admin2024!');
    console.log('4. El sistema enviará correo REAL via Brevo');
    console.log('5. Revisa tu Gmail: diesilva1709@gmail.com');
    console.log('6. Busca correo de: noreply@sistema-calidad.com');
    console.log('7. Haz clic en "Verificar Cuenta"');
    console.log('8. Intenta login nuevamente → DEBERÍA FUNCIONAR');
    
    console.log('\n📧 Configuración Brevo activa:');
    console.log('   - SMTP: smtp-relay.brevo.com');
    console.log('   - From: noreply@sistema-calidad.com');
    console.log('   - Servicio: Brevo (9,000 correos/mes gratis)');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('❌ Detalles:', error);
  } finally {
    await pool.end();
  }
}

createDiegoUser();
