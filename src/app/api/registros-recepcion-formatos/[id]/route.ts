import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';
import { getMicroTable, getPoolConfig } from '../../micro-config';

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
        fecha_entrega,
        fecha_registros,
        codigo_version_registros,
        numero_folios,
        nombre_quien_entrega,
        nombre_quien_recibe,
        observaciones,
        created_at,
        updated_at
      FROM ${getMicroTable('registros_recepcion_formatos')}
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
    console.error('Error al obtener registro de recepción de formatos:', error);
    return NextResponse.json(
      { error: 'Error al obtener el registro de recepción de formatos' },
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
      fecha_entrega,
      fecha_registros,
      codigo_version_registros,
      numero_folios,
      nombre_quien_entrega,
      nombre_quien_recibe,
      observaciones
    } = body;

    const query = `
      UPDATE ${getMicroTable('registros_recepcion_formatos')}
      SET
        fecha_entrega = COALESCE($1, fecha_entrega),
        fecha_registros = COALESCE($2, fecha_registros),
        codigo_version_registros = COALESCE($3, codigo_version_registros),
        numero_folios = COALESCE($4, numero_folios),
        nombre_quien_entrega = COALESCE($5, nombre_quien_entrega),
        nombre_quien_recibe = COALESCE($6, nombre_quien_recibe),
        observaciones = COALESCE($7, observaciones),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $8
      RETURNING *
    `;

    const values = [
      fecha_entrega,
      fecha_registros,
      codigo_version_registros,
      numero_folios,
      nombre_quien_entrega,
      nombre_quien_recibe,
      observaciones,
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
    console.error('Error al actualizar registro de recepción de formatos:', error);
    return NextResponse.json(
      { error: 'Error al actualizar el registro de recepción de formatos' },
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

    const query = `DELETE FROM ${getMicroTable('registros_recepcion_formatos')} WHERE id = $1 RETURNING *`;

    const result = await pool.query(query, [id]);

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Registro no encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: 'Registro eliminado exitosamente' });
  } catch (error) {
    console.error('Error al eliminar registro de recepción de formatos:', error);
    return NextResponse.json(
      { error: 'Error al eliminar el registro de recepción de formatos' },
      { status: 500 }
    );
  }
}
