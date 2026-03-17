const { Pool } = require('pg');

// Configuración de conexión
const pool = new Pool({
  host: 'localhost',
  port: '5432',
  database: 'area_calidad',
  user: 'postgres',
  password: 'Coruna.24',
});

async function deleteTestFlowUser() {
  try {
    console.log('🗑️ Borrando usuario de ejemplo: test-flow@ejemplo.com');
    
    // Buscar el usuario primero
    const userResult = await pool.query(
      'SELECT id, email FROM users WHERE email = $1',
      ['test-flow@ejemplo.com']
    );
    
    if (userResult.rows.length === 0) {
      console.log('❌ Usuario test-flow@ejemplo.com no encontrado');
      return;
    }
    
    const user = userResult.rows[0];
    console.log('👤 Usuario encontrado:', user);
    
    // Borrar sesiones del usuario
    const sessionResult = await pool.query(
      'DELETE FROM user_sessions WHERE user_id = $1',
      [user.id]
    );
    console.log('🗑️ Sesiones borradas:', sessionResult.rowCount, 'registros');
    
    // Borrar el usuario
    const deleteResult = await pool.query(
      'DELETE FROM users WHERE email = $1',
      ['test-flow@ejemplo.com']
    );
    console.log('✅ Usuario borrado:', deleteResult.rowCount, 'registro');
    
    console.log('');
    console.log('🎯 Resumen:');
    console.log('   ✅ Usuario test-flow@ejemplo.com eliminado');
    console.log('   ✅ Sesiones asociadas eliminadas');
    console.log('   ✅ Base de datos limpia');
    
    console.log('');
    console.log('📋 Usuarios restantes en el sistema:');
    const allUsersResult = await pool.query(
      'SELECT id, email, name, role, is_active, email_verified FROM users ORDER BY id'
    );
    
    if (allUsersResult.rows.length > 0) {
      console.table(allUsersResult.rows);
    } else {
      console.log('   No hay usuarios en el sistema');
    }
    
  } catch (error) {
    console.error('❌ Error al borrar usuario:', error.message);
  } finally {
    await pool.end();
  }
}

deleteTestFlowUser();
