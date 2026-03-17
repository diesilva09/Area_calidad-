import { Pool } from 'pg';

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'calidad_coruna',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
});

async function testDatabaseSchema() {
  try {
    console.log('=== Testing Database Schema ===');
    
    // Check if production_records table exists
    const tableExists = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'production_records'
      );
    `);
    
    console.log('Production records table exists:', tableExists.rows[0].exists);
    
    if (tableExists.rows[0].exists) {
      // Get table schema
      const schema = await pool.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'production_records' 
        ORDER BY ordinal_position
      `);
      
      console.log('\nProduction records table schema:');
      console.table(schema.rows);
      
      // Check which date field exists
      const hasFechaProduccion = schema.rows.some(col => col.column_name === 'fechaproduccion');
      const hasFecha_Produccion = schema.rows.some(col => col.column_name === 'fecha_produccion');
      
      console.log('\nField analysis:');
      console.log('Has fechaproduccion (v2):', hasFechaProduccion);
      console.log('Has fecha_produccion (v1):', hasFecha_Produccion);
      
      // Try to query with both schemas
      console.log('\n=== Testing Queries ===');
      
      try {
        console.log('Testing v2 schema query...');
        const v2Result = await pool.query(
          'SELECT COUNT(*) as count FROM production_records WHERE is_active = true ORDER BY fechaproduccion DESC LIMIT 1'
        );
        console.log('V2 query successful, count:', v2Result.rows[0].count);
      } catch (v2Error) {
        console.log('V2 query failed:', v2Error.message);
        
        try {
          console.log('Testing v1 schema query...');
          const v1Result = await pool.query(
            'SELECT COUNT(*) as count FROM production_records WHERE is_active = true ORDER BY fecha_produccion DESC LIMIT 1'
          );
          console.log('V1 query successful, count:', v1Result.rows[0].count);
        } catch (v1Error) {
          console.log('V1 query failed:', v1Error.message);
        }
      }
      
      // Get actual data count
      const countResult = await pool.query('SELECT COUNT(*) as count FROM production_records');
      console.log('\nTotal records in table:', countResult.rows[0].count);
      
      // If there are records, show a sample
      if (parseInt(countResult.rows[0].count) > 0) {
        const sampleResult = await pool.query('SELECT * FROM production_records LIMIT 1');
        console.log('\nSample record:');
        console.log(sampleResult.rows[0]);
      }
    }
    
    // Also check embalaje_records for comparison
    console.log('\n=== Checking Embalaje Records ===');
    const embalajeExists = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'embalaje_records'
      );
    `);
    
    console.log('Embalaje records table exists:', embalajeExists.rows[0].exists);
    
    if (embalajeExists.rows[0].exists) {
      const embalajeCount = await pool.query('SELECT COUNT(*) as count FROM embalaje_records');
      console.log('Total embalaje records:', embalajeCount.rows[0].count);
    }
    
  } catch (error) {
    console.error('Database error:', error.message);
  } finally {
    await pool.end();
  }
}

testDatabaseSchema();
