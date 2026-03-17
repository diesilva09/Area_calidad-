import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Verificando tablas en la base de datos...');
    
    // Importar dinámicamente para evitar errores de importación
    const pool = (await import('@/lib/server-db')).default;
    
    // Obtener todas las tablas
    const result = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    console.log('📋 Tablas encontradas:', result.rows);
    
    // Verificar específicamente si production_records existe
    const productionTableExists = result.rows.some(
      (row: any) => row.table_name === 'production_records'
    );
    
    // Si existe, mostrar su estructura
    let tableStructure = null;
    if (productionTableExists) {
      const structureResult = await pool.query(`
        SELECT column_name, data_type, is_nullable 
        FROM information_schema.columns 
        WHERE table_name = 'production_records' 
        ORDER BY ordinal_position
      `);
      tableStructure = structureResult.rows;
    }
    
    return NextResponse.json({
      success: true,
      tables: result.rows,
      productionRecordsExists: productionTableExists,
      productionRecordsStructure: tableStructure
    });
    
  } catch (error) {
    console.error('❌ Error verificando tablas:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      details: {
        stack: error instanceof Error ? error.stack : undefined
      }
    }, { status: 500 });
  }
}
