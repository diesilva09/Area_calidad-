import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    console.log('🧪 Iniciando prueba de conexión a la base de datos...');
    
    // Importar dinámicamente para evitar errores de importación
    const { testConnection } = await import('@/lib/server-db');
    
    // Probar conexión
    const result = await testConnection();
    
    console.log('✅ Prueba de conexión exitosa:', result);
    
    return NextResponse.json({
      success: true,
      message: 'Conexión a la base de datos exitosa',
      details: result
    });
    
  } catch (error) {
    console.error('❌ Error en la prueba de conexión:', error);
    
    return NextResponse.json({
      success: false,
      message: 'Error en la conexión a la base de datos',
      error: error instanceof Error ? error.message : 'Unknown error',
      details: {
        stack: error instanceof Error ? error.stack : undefined,
        timestamp: new Date().toISOString()
      }
    }, { status: 500 });
  }
}
