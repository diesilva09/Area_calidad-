const pool = require('./src/lib/server-db.js').default;

async function checkTable() {
  try {
    console.log('🔍 Verificando tabla temperatura_envasado_salsas...');
    const result = await pool.query('SELECT * FROM temperatura_envasado_salsas ORDER BY producto_id, envase_tipo');
    console.log('📊 Total registros:', result.rows.length);
    
    if (result.rows.length > 0) {
      console.log('📋 Productos configurados:');
      result.rows.forEach((row, index) => {
        console.log(`  ${index + 1}. Producto: ${row.producto_id}, Envase: ${row.envase_tipo}, Rango: ${row.temperatura_min}°C - ${row.temperatura_max}°C`);
      });
    } else {
      console.log('❌ No hay registros en la tabla');
    }
    
    // Verificar específicamente el producto 000114
    const specificResult = await pool.query('SELECT * FROM temperatura_envasado_salsas WHERE producto_id = $1', ['000114']);
    console.log('🔍 Producto 000114:', specificResult.rows.length, 'registros');
    specificResult.rows.forEach(row => {
      console.log(`  - Envase: ${row.envase_tipo}, Rango: ${row.temperatura_min}°C - ${row.temperatura_max}°C`);
    });
    
    await pool.end();
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkTable();
