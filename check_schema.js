import { Pool } from 'pg';

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'calidad_coruna',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
});

async function checkSchema() {
  try {
    console.log('Checking production_records table schema...');
    
    const result = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'production_records' 
      ORDER BY ordinal_position
    `);
    
    console.log('Production records table schema:');
    console.table(result.rows);
    
    // Check if table exists and has data
    const countResult = await pool.query('SELECT COUNT(*) as count FROM production_records');
    console.log('\nTotal records:', countResult.rows[0].count);
    
    // Get sample data if exists
    if (parseInt(countResult.rows[0].count) > 0) {
      const sampleResult = await pool.query('SELECT * FROM production_records LIMIT 1');
      console.log('\nSample record fields:', Object.keys(sampleResult.rows[0]));
      console.log('Sample record:', sampleResult.rows[0]);
    }
    
    // Also check embalaje_records for comparison
    console.log('\n=== Checking embalaje_records table schema ===');
    const embalajeResult = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'embalaje_records' 
      ORDER BY ordinal_position
    `);
    
    console.log('Embalaje records table schema:');
    console.table(embalajeResult.rows);
    
    const embalajeCountResult = await pool.query('SELECT COUNT(*) as count FROM embalaje_records');
    console.log('\nTotal embalaje records:', embalajeCountResult.rows[0].count);
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkSchema();
