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

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const productoId = searchParams.get('producto_id');
    
    let query;
    let params = [];
    
    if (productoId) {
      // Obtener envases para un producto específico
      query = `
        SELECT 
          id,
          producto_id,
          envase_tipo,
          meses_vencimiento,
          created_at,
          updated_at
        FROM producto_envase_vencimiento 
        WHERE producto_id = $1 
        ORDER BY envase_tipo
      `;
      params = [productoId];
    } else {
      // Obtener todos los envases
      query = `
        SELECT 
          id,
          producto_id,
          envase_tipo,
          meses_vencimiento,
          created_at,
          updated_at
        FROM producto_envase_vencimiento 
        ORDER BY producto_id, envase_tipo
      `;
    }
    
    const result = await pool.query(query, params);
    
    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('Error al obtener envases:', error);
    return NextResponse.json(
      { error: 'Error al obtener envases' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { producto_id, envase_tipo, meses_vencimiento } = body;

    if (!producto_id || !envase_tipo || !meses_vencimiento) {
      return NextResponse.json(
        { error: 'producto_id, envase_tipo y meses_vencimiento son requeridos' },
        { status: 400 }
      );
    }

    const query = `
      INSERT INTO producto_envase_vencimiento (producto_id, envase_tipo, meses_vencimiento)
      VALUES ($1, $2, $3)
      RETURNING *
    `;
    
    const result = await pool.query(query, [producto_id, envase_tipo, meses_vencimiento]);
    
    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (error) {
    console.error('Error al crear relación producto-envase:', error);
    return NextResponse.json(
      { error: 'Error al crear relación producto-envase' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, meses_vencimiento } = body;

    if (!id || meses_vencimiento === undefined) {
      return NextResponse.json(
        { error: 'id y meses_vencimiento son requeridos' },
        { status: 400 }
      );
    }

    const query = `
      UPDATE producto_envase_vencimiento 
      SET meses_vencimiento = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING *
    `;
    
    const result = await pool.query(query, [meses_vencimiento, id]);
    
    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Relación producto-envase no encontrada' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error('Error al actualizar relación producto-envase:', error);
    return NextResponse.json(
      { error: 'Error al actualizar relación producto-envase' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'id es requerido' },
        { status: 400 }
      );
    }

    const query = 'DELETE FROM producto_envase_vencimiento WHERE id = $1';
    const result = await pool.query(query, [id]);
    
    if (result.rowCount === 0) {
      return NextResponse.json(
        { error: 'Relación producto-envase no encontrada' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error al eliminar relación producto-envase:', error);
    return NextResponse.json(
      { error: 'Error al eliminar relación producto-envase' },
      { status: 500 }
    );
  }
}
