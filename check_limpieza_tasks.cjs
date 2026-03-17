const { Pool } = require('pg');

// Configuración de la base de datos PostgreSQL
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'calidad_coruna',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

async function checkLimpiezaTasks() {
  try {
    console.log('🔍 Verificando la estructura de la tabla de limpieza tasks...');
    
    // Verificar si existe la tabla
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'limpieza_tasks'
      ) as table_exists
    `);
    
    console.log('📋 ¿Existe la tabla limpieza_tasks?', tableCheck.rows[0].table_exists);
    
    if (!tableCheck.rows[0].table_exists) {
      console.log('❌ La tabla limpieza_tasks no existe');
      console.log('🔍 Buscando tablas similares...');
      
      // Buscar tablas que contengan 'limpieza' o 'task'
      const similarTables = await pool.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_name LIKE '%limpieza%' OR table_name LIKE '%task%'
        ORDER BY table_name
      `);
      
      console.log('📋 Tablas encontradas:', similarTables.rows);
      return;
    }
    
    // Verificar la estructura de la tabla
    const structure = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'limpieza_tasks'
      ORDER BY ordinal_position
    `);
    
    console.log('🏗️ Estructura de la tabla limpieza_tasks:');
    console.table(structure.rows);
    
    // Verificar si hay datos
    const dataCheck = await pool.query('SELECT COUNT(*) as count FROM limpieza_tasks');
    console.log('📊 Total de registros:', dataCheck.rows[0].count);
    
    // Mostrar algunos registros de ejemplo
    if (dataCheck.rows[0].count > 0) {
      const sampleData = await pool.query('SELECT * FROM limpieza_tasks LIMIT 5');
      console.log('📋 Ejemplos de registros:');
      console.table(sampleData.rows);
    }
    
  } catch (error) {
    console.error('❌ Error al verificar la tabla:', error);
  } finally {
    await pool.end();
  }
}

checkLimpiezaTasks();
