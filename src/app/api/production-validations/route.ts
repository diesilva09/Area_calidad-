import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';

// Configuración de la base de datos
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'calidad_coruna',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
  ssl: process.env.NODE_ENV === 'production' 
    ? { rejectUnauthorized: false } 
    : false, // Deshabilitado en desarrollo ya que PostgreSQL local no soporta SSL
});

// GET - Obtener todas las validaciones
export async function GET(request: NextRequest) {
  try {
    console.log('GET /api/production-validations - Obteniendo validaciones de producción');
    
    const result = await pool.query(
      'SELECT id, letra, muestras_requeridas, created_at, is_active FROM production_validations WHERE is_active = true ORDER BY letra'
    );
    
    console.log(`📋 Validaciones encontradas: ${result.rows.length}`);
    
    return NextResponse.json(result.rows);
    
  } catch (error) {
    console.error('❌ Error al obtener validaciones de producción:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
