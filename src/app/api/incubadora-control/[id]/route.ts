import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';

// Configuración de la base de datos
const getPoolConfig = () => {
  const config: any = {
    host: '127.0.0.1', // Forzar IPv4 para evitar problemas de autenticación
    port: 5432,
    database: 'area_calidad',
    user: 'postgres',
    password: process.env.DB_PASSWORD || 'Coruna.24', // ← aquí va la clave real
    ssl: { rejectUnauthorized: false },
  };
  
  return config;
};

const pool = new Pool(getPoolConfig());

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const query = `
      SELECT 
        id,
        muestra,
        fecha_ingreso,
        hora_ingreso,
        fecha_salida,
        hora_salida,
        responsable,
        observaciones,
        created_at,
        updated_at
      FROM incubadora_control
      WHERE id = $1
    `;

    const result = await pool.query(query, [id]);

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Registro no encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error('Error al obtener registro de control de incubadora:', error);
    return NextResponse.json(
      { error: 'Error al obtener el registro de control de incubadora' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    
    const {
      muestra,
      fecha_ingreso,
      hora_ingreso,
      fecha_salida,
      hora_salida,
      responsable,
      observaciones
    } = body;

    const query = `
      UPDATE incubadora_control
      SET 
        muestra = COALESCE($1, muestra),
        fecha_ingreso = COALESCE($2, fecha_ingreso),
        hora_ingreso = COALESCE($3, hora_ingreso),
        fecha_salida = COALESCE($4, fecha_salida),
        hora_salida = COALESCE($5, hora_salida),
        responsable = COALESCE($6, responsable),
        observaciones = COALESCE($7, observaciones),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $8
      RETURNING *
    `;

    const values = [
      muestra,
      fecha_ingreso,
      hora_ingreso,
      fecha_salida,
      hora_salida,
      responsable,
      observaciones || null,
      id
    ];

    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Registro no encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error('Error al actualizar registro de control de incubadora:', error);
    return NextResponse.json(
      { error: 'Error al actualizar el registro de control de incubadora' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const query = 'DELETE FROM incubadora_control WHERE id = $1 RETURNING *';

    const result = await pool.query(query, [id]);

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Registro no encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: 'Registro eliminado exitosamente' });
  } catch (error) {
    console.error('Error al eliminar registro de control de incubadora:', error);
    return NextResponse.json(
      { error: 'Error al eliminar el registro de control de incubadora' },
      { status: 500 }
    );
  }
}
