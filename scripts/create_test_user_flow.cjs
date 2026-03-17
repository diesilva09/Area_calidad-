const { Pool } = require('pg');

// Configuración de conexión
const pool = new Pool({
  host: 'localhost',
  port: '5432',
  database: 'area_calidad',
  user: 'postgres',
  password: 'Coruna.24',
});

async function createTestUserFlow() {
  try {
    console.log('🔍 Creando usuario de prueba para demostrar el flujo...');
    
    // Insertar usuario con email_verified = false
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
      'test-flow@ejemplo.com',
      '$2b$10$1TfbX5NXl640wXj/wFEO9OVsEfJ6pOtKCkvQUZSBuC9jyI5ByQXCa',
      'Usuario de Prueba Flow',
      'operario',
      true,
      false // Importante: no verificado para probar el flujo
    ]);
    
    console.log('✅ Usuario creado para prueba del flujo:');
    console.table(insertResult.rows);
    
    console.log('\n🔄 Flujo de prueba:');
    console.log('1. Ve a http://localhost:9002/login');
    console.log('2. Intenta iniciar sesión con:');
    console.log('   - Email: test-flow@ejemplo.com');
    console.log('   - Contraseña: Admin2024!');
    console.log('3. El sistema dirá que necesita verificar el correo');
    console.log('4. Revisa la consola del servidor para ver el token');
    console.log('5. Usa el enlace de verificación que aparecerá en consola');
    console.log('6. Después de verificar, podrás iniciar sesión normalmente');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

createTestUserFlow();
