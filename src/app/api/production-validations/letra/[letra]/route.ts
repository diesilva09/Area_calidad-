import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';

// Configuración de la base de datos
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'calidad_coruna',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

// GET - Obtener validación por letra específica
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ letra: string }> }
) {
  try {
    console.log('GET /api/production-validations/letra/[letra] - Obteniendo validación por letra');
    
    const resolvedParams = await params;
    const letra = resolvedParams.letra.toUpperCase(); // Convertir a mayúsculas
    
    console.log(`🔍 Buscando validación para letra: ${letra}`);
    
    const result = await pool.query(
      'SELECT id, letra, muestras_requeridas, created_at, is_active FROM production_validations WHERE letra = $1 AND is_active = true',
      [letra]
    );
    
    if (result.rows.length === 0) {
      console.log(`❌ Letra ${letra} no encontrada`);
      return NextResponse.json(
        { error: `Letra "${letra}" no encontrada` },
        { status: 404 }
      );
    }
    
    console.log(`✅ssl: ${process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false}, // Deshabilitado en desarrollo ya que PostgreSQL local no soporta SSL Validación encontrada para letra ${letra}: ${result.rows[0].muestras_requeridas} muestras`);
    
    return NextResponse.json(result.rows[0]);
    
  } catch (error) {
    console.error('❌ Error al obtener validación por letra:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
