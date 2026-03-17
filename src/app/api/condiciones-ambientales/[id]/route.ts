import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';

// Configuración de la base de datos
const getPoolConfig = () => {
  const config: any = {
    host: '127.0.0.1', // Forzar IPv4 para evitar problemas de autenticación
    port: 5432,
    database: 'area_calidad',
    user: 'postgres',
    ssl: { rejectUnauthorized: false },
  };

  // NO agregar contraseña para evitar el error de SASL
  // Si PostgreSQL requiere contraseña, configurar en pg_hba.conf para 'trust'
  
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
        fecha,
        hora,
        temperatura,
        humedad_relativa,
        responsable,
        observaciones,
        created_at,
        updated_at
      FROM condiciones_ambientales
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
    console.error(`Error en GET /api/condiciones-ambientales/${params}:`, error);
    return NextResponse.json(
      { error: 'Error al obtener el registro de condiciones ambientales' },
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
      fecha,
      hora,
      temperatura,
      humedad_relativa,
      responsable,
      observaciones
    } = body;

    // Validaciones básicas
    if (!fecha || !hora || !temperatura || !humedad_relativa || !responsable) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos' },
        { status: 400 }
      );
    }

    const query = `
      UPDATE condiciones_ambientales 
      SET 
        fecha = $1,
        hora = $2,
        temperatura = $3,
        humedad_relativa = $4,
        responsable = $5,
        observaciones = $6,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $7
      RETURNING *
    `;

    const values = [
      fecha,
      hora,
      temperatura,
      humedad_relativa,
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
    console.error(`Error en PUT /api/condiciones-ambientales/${params}:`, error);
    return NextResponse.json(
      { error: 'Error al actualizar el registro de condiciones ambientales' },
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

    const query = 'DELETE FROM condiciones_ambientales WHERE id = $1 RETURNING *';
    const result = await pool.query(query, [id]);

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Registro no encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: 'Registro eliminado exitosamente' });
  } catch (error) {
    console.error(`Error en DELETE /api/condiciones-ambientales/${params}:`, error);
    return NextResponse.json(
      { error: 'Error al eliminar el registro de condiciones ambientales' },
      { status: 500 }
    );
  }
}
