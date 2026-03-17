const { Pool } = require('pg');
const readline = require('readline');

// Configuración de la base de datos
const config = {
  host: '127.0.0.1',
  port: 5432,
  database: 'area_calidad',
  user: 'postgres',
  password: process.env.PGPASSWORD || null, // Usar variable de entorno si existe
  ssl: { rejectUnauthorized: false },
};

// Si no hay contraseña, pedir al usuario
async function getPassword() {
  if (config.password) {
    return config.password;
  }
  
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  const password = await new Promise((resolve) => {
    rl.question('Ingrese la contraseña de PostgreSQL para usuario postgres: ', (answer) => {
      resolve(answer);
    });
  });
  
  rl.close();
  return password;
}

async function setupDatabase() {
  let pool;
  try {
    // Obtener contraseña
    const password = await getPassword();
    config.password = password;
    
    console.log('🔧 Conectando a la base de datos...');
    pool = new Pool(config);
    
    // Probar conexión
    await pool.query('SELECT NOW()');
    console.log('✅ Conexión exitosa a la base de datos');
    
    // Script SQL para crear la tabla
    const createTableSQL = `
      -- Crear tabla para condiciones ambientales del laboratorio de microbiología
      CREATE TABLE IF NOT EXISTS condiciones_ambientales (
          id SERIAL PRIMARY KEY,
          fecha DATE NOT NULL,
          hora VARCHAR(50) NOT NULL,
          temperatura DECIMAL(5,2) NOT NULL,
          humedad_relativa DECIMAL(5,2) NOT NULL,
          responsable VARCHAR(255) NOT NULL,
          observaciones TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Crear índices para mejorar el rendimiento
      CREATE INDEX IF NOT EXISTS idx_condiciones_ambientales_fecha ON condiciones_ambientales(fecha);
      CREATE INDEX IF NOT EXISTS idx_condiciones_ambientales_fecha_hora ON condiciones_ambientales(fecha, hora);

      -- Crear función para actualizar timestamp automáticamente
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
          NEW.updated_at = CURRENT_TIMESTAMP;
          RETURN NEW;
      END;
      $$ language 'plpgsql';

      -- Crear trigger para actualizar updated_at automáticamente
      DROP TRIGGER IF EXISTS update_condiciones_ambientales_updated_at ON condiciones_ambientales;
      CREATE TRIGGER update_condiciones_ambientales_updated_at 
          BEFORE UPDATE ON condiciones_ambientales 
          FOR EACH ROW 
          EXECUTE FUNCTION update_updated_at_column();

      -- Insertar datos de ejemplo
      INSERT INTO condiciones_ambientales (fecha, hora, temperatura, humedad_relativa, responsable, observaciones) VALUES
          ('2026-01-12', 'MAÑANA (7-9 AM)', 21.0, 81.0, 'Juan David Castañeda Ortiz', ''),
          ('2026-01-12', 'TARDE (3-5 PM)', 24.0, 69.0, 'Juan David Castañeda Ortiz', ''),
          ('2026-01-13', 'MAÑANA (7-9 AM)', 18.0, 79.0, 'Juan David Castañeda Ortiz', ''),
          ('2026-01-13', 'TARDE (3-5 PM)', 22.0, 75.0, 'Juan David Castañeda Ortiz', '')
      ON CONFLICT DO NOTHING;

      -- Agregar comentarios descriptivos
      COMMENT ON TABLE condiciones_ambientales IS 'RE-CAL-021: Registro de condiciones ambientales del laboratorio de microbiología';
      COMMENT ON COLUMN condiciones_ambientales.fecha IS 'Fecha del registro (formato: YYYY-MM-DD)';
      COMMENT ON COLUMN condiciones_ambientales.hora IS 'Período del día (MAÑANA (7-9 AM), TARDE (3-5 PM))';
      COMMENT ON COLUMN condiciones_ambientales.temperatura IS 'Temperatura en grados Celsius';
      COMMENT ON COLUMN condiciones_ambientales.humedad_relativa IS 'Porcentaje de humedad relativa (0-100)';
      COMMENT ON COLUMN condiciones_ambientales.responsable IS 'Nombre de la persona responsable del registro';
      COMMENT ON COLUMN condiciones_ambientales.observaciones IS 'Notas adicionales sobre el registro';
    `;

    console.log('📝 Ejecutando script SQL...');
    await pool.query(createTableSQL);

    // Verificar que la tabla se creó correctamente
    const verifyTable = await pool.query(`
      SELECT table_name, column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'condiciones_ambientales'
      ORDER BY ordinal_position
    `);

    // Verificar los datos de ejemplo
    const verifyData = await pool.query(`
      SELECT COUNT(*) as count
      FROM condiciones_ambientales
    `);

    // Obtener algunos datos de ejemplo para mostrar
    const sampleData = await pool.query(`
      SELECT fecha, hora, temperatura, humedad_relativa, responsable
      FROM condiciones_ambientales
      ORDER BY fecha, hora
      LIMIT 3
    `);

    console.log('✅ Tabla condiciones_ambientales creada exitosamente');
    console.log('📊 Columnas creadas:', verifyTable.rows.length);
    console.log('📝 Registros de ejemplo:', verifyData.rows[0].count);
    console.log('');
    console.log('📋 Estructura de la tabla:');
    verifyTable.rows.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} (${col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'})`);
    });
    console.log('');
    console.log('📄 Datos de ejemplo:');
    sampleData.rows.forEach((row, index) => {
      console.log(`  ${index + 1}. ${row.fecha} - ${row.hora} - ${row.temperatura}°C - ${row.humedad_relativa}% - ${row.responsable}`);
    });

  } catch (error) {
    console.error('❌ Error al crear tabla condiciones_ambientales:', error);
    process.exit(1);
  } finally {
    if (pool) {
      await pool.end();
      console.log('🔚 Conexión cerrada');
    }
  }
}

// Ejecutar el script
setupDatabase();
