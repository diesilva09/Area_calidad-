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

async function createTestUser() {
  try {
    console.log('🔍 Conectando a la base de datos...');
    
    // Verificar si la tabla users existe
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'users'
      );
    `);
    
    console.log('📋 Tabla users existe:', tableCheck.rows[0].exists);
    
    if (!tableCheck.rows[0].exists) {
      console.log('❌ La tabla users no existe. Ejecuta primero las migraciones.');
      return;
    }
    
    // Crear contraseña hasheada
    const password = 'admin123';
    const passwordHash = await bcrypt.hash(password, 10);
    
    console.log('🔐 Contraseña hasheada:', passwordHash.substring(0, 50) + '...');
    
    // Insertar usuario de prueba
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
      'admin@test.com',
      passwordHash,
      'Administrador de Prueba',
      'jefe',
      true,
      true
    ]);
    
    console.log('✅ Usuario creado/actualizado:');
    console.table(insertResult.rows);
    
    console.log('\n🔑 Credenciales de prueba:');
    console.log('Email: admin@test.com');
    console.log('Contraseña: admin123');
    console.log('Rol: jefe');
    console.log('Estado: Activo y Verificado ✅');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('❌ Detalles:', error);
  } finally {
    await pool.end();
  }
}

createTestUser();
