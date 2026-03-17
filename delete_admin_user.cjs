const { Pool } = require('pg');

// Configuración de conexión
const pool = new Pool({
  host: 'localhost',
  port: '5432',
  database: 'area_calidad',
  user: 'postgres',
  password: 'Coruna.24',
});

async function deleteAdminUser() {
  try {
    console.log('🗑️ Borrando usuario admin@test.com...');
    
    // Primero verificar si el usuario existe
    const checkResult = await pool.query(
      'SELECT id, email, name, role FROM users WHERE email = $1',
      ['admin@test.com']
    );
    
    if (checkResult.rows.length === 0) {
      console.log('❌ El usuario admin@test.com no existe');
      return;
    }
    
    console.log('📋 Usuario encontrado:');
    console.table(checkResult.rows);
    
    // Borrar sesiones asociadas al usuario
    const deleteSessionsResult = await pool.query(
      'DELETE FROM user_sessions WHERE user_id = (SELECT id FROM users WHERE email = $1)',
      ['admin@test.com']
    );
    
    console.log(`🗑️ Sesiones borradas: ${deleteSessionsResult.rowCount}`);
    
    // Borrar el usuario
    const deleteResult = await pool.query(
      'DELETE FROM users WHERE email = $1',
      ['admin@test.com']
    );
    
    console.log(`✅ Usuario borrado: ${deleteResult.rowCount} fila(s) afectada(s)`);
    
    // Verificar que ya no existe
    const verifyResult = await pool.query(
      'SELECT COUNT(*) as count FROM users WHERE email = $1',
      ['admin@test.com']
    );
    
    console.log(`🔍 Verificación: Quedan ${verifyResult.rows[0].count} usuarios con ese email`);
    
    // Mostrar usuarios restantes
    const allUsersResult = await pool.query(
      'SELECT id, email, name, role, is_active, email_verified FROM users ORDER BY id'
    );
    
    console.log('\n📋 Usuarios restantes en la base de datos:');
    console.table(allUsersResult.rows);
    
  } catch (error) {
    console.error('❌ Error al borrar usuario:', error.message);
    console.error('❌ Detalles:', error);
  } finally {
    await pool.end();
  }
}

deleteAdminUser();
