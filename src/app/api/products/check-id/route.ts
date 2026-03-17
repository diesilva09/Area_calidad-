import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';

// Configuración de la base de datos
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'calidad_coruna',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
  // SSL: Solo en producción, con detección automática de soporte
  ssl: process.env.NODE_ENV === 'production' 
    ? { rejectUnauthorized: false } 
    : false, // Deshabilitado en desarrollo ya que PostgreSQL local no soporta SSL
});

export async function POST(request: NextRequest) {
  try {
    const { id, categoryId, excludeId } = await request.json();
    
    console.log('Verificando ID de producto:', { id, categoryId, excludeId });
    
    if (!id || !categoryId) {
      return NextResponse.json(
        { error: 'ID y categoría son requeridos' },
        { status: 400 }
      );
    }
    
    // Verificar si el ID ya existe en la misma categoría (excluyendo el ID actual si se está editando)
    let query = 'SELECT id FROM products WHERE id = $1 AND category_id = $2 AND is_active = true';
    let params = [id, categoryId];
    
    if (excludeId) {
      query += ' AND id != $3';
      params.push(excludeId);
    }
    
    const result = await pool.query(query, params);
    
    console.log(`Resultado de verificación para ID "${id}" en categoría "${categoryId}":`, result.rows.length, 'coincidencias');
    
    return NextResponse.json({ 
      exists: result.rows.length > 0,
      message: result.rows.length > 0 
        ? `El ID "${id}" ya existe en esta categoría` 
        : `El ID "${id}" está disponible en esta categoría`
    });
    
  } catch (error) {
    console.error('Error al verificar ID de producto:', error);
    return NextResponse.json(
      { error: 'Error al verificar ID de producto' },
      { status: 500 }
    );
  }
}
