const { Pool } = require('pg');

// Usar las mismas variables de entorno que la aplicación
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'calidad_coruna',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

async function addStatusColumn() {
  try {
    console.log('🔄 Agregando columna status a limpieza_verifications...');
    
    // Agregar columna status
    await pool.query(`
      ALTER TABLE limpieza_verifications 
      ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'pending' 
      CHECK (status IN ('pending', 'completed'))
    `);
    
    console.log('✅ Columna status agregada correctamente');
    
    // Crear índice
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_limpieza_ver_status ON limpieza_verifications(status)
    `);
    
    console.log('✅ Índice creado correctamente');
    
    // Actualizar registros existentes que ya están completados
    const result1 = await pool.query(`
      UPDATE limpieza_verifications 
      SET status = 'completed' 
      WHERE verificacion_visual = 1 
      AND (detergente IS NOT NULL AND detergente != '') 
      AND (desinfectante IS NOT NULL AND desinfectante != '')
      RETURNING id
    `);
    
    console.log(`✅ ${result1.rowCount} registros marcados como completados`);
    
    // Actualizar registros automáticos a pendientes
    const result2 = await pool.query(`
      UPDATE limpieza_verifications 
      SET status = 'pending' 
      WHERE tipo_verificacion = 'LIMPIEZA POST PRODUCCIÓN' 
      AND (detergente IS NULL OR detergente = '' 
           OR desinfectante IS NULL OR desinfectante = ''
           OR verificado_por IS NULL OR verificado_por = '')
      RETURNING id
    `);
    
    console.log(`✅ ${result2.rowCount} registros marcados como pendientes`);
    
    console.log('🎉 Migración completada exitosamente');
    
  } catch (error) {
    console.error('❌ Error durante la migración:', error);
  } finally {
    await pool.end();
  }
}

addStatusColumn();
