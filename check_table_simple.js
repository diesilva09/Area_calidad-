const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'calidad_coruna',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

async function checkTable() {
  try {
    const result = await pool.query('SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = $1)');
    console.log('¿Existe la tabla limpieza_tasks?', result.rows[0].exists);
    
    // Listar todas las tablas que contengan 'limpieza'
    const allTables = await pool.query("SELECT table_name FROM information_schema.tables WHERE table_name LIKE '%limpieza%'");
    console.log('Tablas con limpieza:', allTables.rows);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await pool.end();
  }
}

checkTable();
