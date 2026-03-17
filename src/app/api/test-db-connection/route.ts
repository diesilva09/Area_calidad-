import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';

// Configuración de la base de datos sin contraseña para prueba
const pool = new Pool({
  host: '127.0.0.1',
  port: 5432,
  database: 'area_calidad',
  user: 'postgres',
  ssl: { rejectUnauthorized: false },
});

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Probando conexión a PostgreSQL...');
    
    // Intentar una consulta simple
    const result = await pool.query('SELECT NOW() as current_time, version() as version');
    
    console.log('✅ Conexión exitosa a PostgreSQL');
    
    // Verificar si la tabla condiciones_ambientales existe
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'condiciones_ambientales'
      );
    `);
    
    const tableExists = tableCheck.rows[0].exists;
    
    // Si la tabla existe, obtener el conteo de registros
    let recordCount = 0;
    if (tableExists) {
      const countResult = await pool.query('SELECT COUNT(*) as count FROM condiciones_ambientales');
      recordCount = parseInt(countResult.rows[0].count);
    }
    
    return NextResponse.json({
      success: true,
      message: 'Conexión a PostgreSQL establecida correctamente',
      database: {
        current_time: result.rows[0].current_time,
        version: result.rows[0].version.split(',')[0],
        table_exists: tableExists,
        record_count: recordCount
      }
    });
    
  } catch (error) {
    console.error('❌ Error en la conexión a PostgreSQL:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Error al conectar a PostgreSQL',
        details: error instanceof Error ? error.message : 'Error desconocido',
        troubleshooting: [
          'Verifica que PostgreSQL esté corriendo en 127.0.0.1:5432',
          'Verifica que la base de datos "area_calidad" exista',
          'Verifica la configuración en pg_hba.conf para permitir conexiones sin contraseña (trust)',
          'O configura POSTGRES_PASSWORD en las variables de entorno'
        ]
      },
      { status: 500 }
    );
  }
}
