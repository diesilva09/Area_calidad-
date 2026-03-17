const { Pool } = require('pg');

// Configuración de conexión (igual que en auth-service.ts)
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'area_calidad',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

async function debugAuth() {
  try {
    console.log('🔍 Conectando a la base de datos...');
    
    // Verificar usuarios existentes
    const usersResult = await pool.query('SELECT id, email, name, role, is_active, email_verified, created_at FROM users ORDER BY id');
    
    console.log('\n📋 Usuarios encontrados:');
    console.table(usersResult.rows);
    
    if (usersResult.rows.length > 0) {
      // Verificar contraseñas hasheadas
      const passwordsResult = await pool.query('SELECT email, LEFT(password_hash, 20) as password_preview, LENGTH(password_hash) as hash_length FROM users');
      
      console.log('\n🔐 Estado de contraseñas:');
      console.table(passwordsResult.rows);
      
      // Verificar sesiones activas
      const sessionsResult = await pool.query('SELECT user_id, LEFT(token, 20) as token_preview, expires_at FROM user_sessions WHERE expires_at > CURRENT_TIMESTAMP');
      
      console.log('\n🎫 Sesiones activas:');
      console.table(sessionsResult.rows);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

debugAuth();
