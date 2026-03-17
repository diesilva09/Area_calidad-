import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';

// Configuración de la base de datos - sin autenticación para setup
const pool = new Pool({
  host: '127.0.0.1',
  port: 5432,
  database: 'area_calidad',
  user: 'postgres',
  ssl: { rejectUnauthorized: false },
  max: 1, // Limitar conexiones para setup
});

export async function POST(request: NextRequest) {
  try {
    console.log('🔧 Creando tabla de condiciones ambientales...');

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

      -- Crear trigger para actualizar updated_at automáticamente
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
          NEW.updated_at = CURRENT_TIMESTAMP;
          RETURN NEW;
      END;
      $$ language 'plpgsql';

      CREATE TRIGGER update_condiciones_ambientales_updated_at 
          BEFORE UPDATE ON condiciones_ambientales 
          FOR EACH ROW 
          EXECUTE FUNCTION update_updated_at_column();

      -- Insertar datos de ejemplo (opcional)
      INSERT INTO condiciones_ambientales (fecha, hora, temperatura, humedad_relativa, responsable, observaciones) VALUES
          ('2026-01-12', 'MAÑANA (7-9 AM)', 21.0, 81.0, 'Juan David Castañeda Ortiz', ''),
          ('2026-01-12', 'TARDE (3-5 PM)', 24.0, 69.0, 'Juan David Castañeda Ortiz', ''),
          ('2026-01-13', 'MAÑANA (7-9 AM)', 18.0, 79.0, 'Juan David Castañeda Ortiz', ''),
          ('2026-01-13', 'TARDE (3-5 PM)', 22.0, 75.0, 'Juan David Castañeda Ortiz', '')
      ON CONFLICT DO NOTHING;

      -- Comentarios sobre la tabla
      COMMENT ON TABLE condiciones_ambientales IS 'RE-CAL-021: Registro de condiciones ambientales del laboratorio de microbiología';
      COMMENT ON COLUMN condiciones_ambientales.fecha IS 'Fecha del registro (formato: YYYY-MM-DD)';
      COMMENT ON COLUMN condiciones_ambientales.hora IS 'Período del día (MAÑANA (7-9 AM), TARDE (3-5 PM))';
      COMMENT ON COLUMN condiciones_ambientales.temperatura IS 'Temperatura en grados Celsius';
      COMMENT ON COLUMN condiciones_ambientales.humedad_relativa IS 'Porcentaje de humedad relativa (0-100)';
      COMMENT ON COLUMN condiciones_ambientales.responsable IS 'Nombre de la persona responsable del registro';
      COMMENT ON COLUMN condiciones_ambientales.observaciones IS 'Notas adicionales sobre el registro';
    `;

    // Ejecutar el script SQL
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

    console.log('✅ Tabla condiciones_ambientales creada exitosamente');
    console.log('📊 Columnas creadas:', verifyTable.rows.length);
    console.log('📝 Registros de ejemplo:', verifyData.rows[0].count);

    return NextResponse.json({
      success: true,
      message: 'Tabla condiciones_ambientales creada exitosamente',
      tableInfo: {
        columns: verifyTable.rows,
        sampleDataCount: verifyData.rows[0].count
      }
    });

  } catch (error) {
    console.error('❌ Error al crear tabla condiciones_ambientales:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Error al crear la tabla de condiciones ambientales',
        details: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Verificar si la tabla ya existe
    const checkTable = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'condiciones_ambientales'
      );
    `);

    const tableExists = checkTable.rows[0].exists;

    if (tableExists) {
      // Obtener información de la tabla
      const tableInfo = await pool.query(`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns 
        WHERE table_name = 'condiciones_ambientales'
        ORDER BY ordinal_position
      `);

      const countData = await pool.query(`
        SELECT COUNT(*) as count
        FROM condiciones_ambientales
      `);

      return NextResponse.json({
        exists: true,
        message: 'La tabla condiciones_ambientales ya existe',
        columns: tableInfo.rows,
        recordCount: countData.rows[0].count
      });
    } else {
      return NextResponse.json({
        exists: false,
        message: 'La tabla condiciones_ambientales no existe aún'
      });
    }

  } catch (error) {
    console.error('❌ Error al verificar tabla condiciones_ambientales:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Error al verificar la tabla',
        details: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    );
  }
}
