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

async function createOperatorUser() {
  try {
    console.log('👷️ Creando usuario con rol de operario...');
    
    // Crear contraseña hasheada
    const password = 'Operario2024!';
    const passwordHash = await bcrypt.hash(password, 10);
    
    console.log('🔐 Contraseña hasheada generada');
    
    // Generar token de verificación
    const verificationToken = 'VER-' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    
    console.log('🔑 Token de verificación:', verificationToken);
    
    // Insertar usuario con rol de operario y email_verified = false
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
      'operario@industriaslacoruna.com',
      passwordHash,
      'Operario de Producción',
      'operario',
      true,
      false, // Importante: no verificado para probar el flujo
      verificationToken
    ]);
    
    console.log('✅ Usuario operario creado para prueba:');
    console.table(insertResult.rows);
    
    console.log('\n📋 Credenciales para el operario:');
    console.log('📧 Email: operario@industriaslacoruna.com');
    console.log('🔒 Contraseña: Operario2024!');
    console.log('👤 Rol: operario');
    console.log('✅ Activo: true');
    console.log('❌ Email verificado: false (para probar flujo)');
    
    console.log('\n🔄 Flujo de prueba para el operario:');
    console.log('1. Inicia el servidor: npm run dev');
    console.log('2. Ve a: http://localhost:9002/login');
    console.log('3. Ingresa: operario@industriaslacoruna.com / Operario2024!');
    console.log('4. El sistema enviará correo REAL via Brevo');
    console.log('5. Revisa el correo: operario@industriaslacoruna.com');
    console.log('6. Busca correo de: pasante.gt@industriaslacoruna.com');
    console.log('7. Haz clic en "Verificar Cuenta"');
    console.log('8. Intenta login nuevamente → DEBERÍA FUNCIONAR');
    
    console.log('\n🎯 Ventajas del rol operario:');
    console.log('   ✅ Acceso limitado a funciones de producción');
    console.log('   ✅ Puede crear y ver registros de producción');
    console.log('   ✅ No tiene acceso a configuración avanzada');
    console.log('   ✅ Ideal para personal de línea de producción');
    
    console.log('\n📧 Configuración de correo activa:');
    console.log('   - SMTP: smtp.gmail.com');
    console.log('   - From: pasante.gt@industriaslacoruna.com');
    console.log('   - Servicio: Gmail (contraseña de aplicación)');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('❌ Detalles:', error);
  } finally {
    await pool.end();
  }
}

createOperatorUser();
