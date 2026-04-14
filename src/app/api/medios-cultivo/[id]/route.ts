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
        fecha,
        medio_cultivo,
        cantidad_ml,
        cantidad_medio_cultivo_g,
        control_negativo_inicio,
        control_negativo_final,
        control_negativo_cumple,
        control_negativo_no_cumple,
        accion_correctiva,
        observaciones,
        responsable,
        created_at,
        updated_at
      FROM ${getMicroTable('medios_cultivo')}
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
    console.error('Error al obtener registro de medios de cultivo:', error);
    return NextResponse.json(
      { error: 'Error al obtener el registro de medios de cultivo' },
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
      medio_cultivo,
      cantidad_ml,
      cantidad_medio_cultivo_g,
      control_negativo_inicio,
      control_negativo_final,
      control_negativo_cumple,
      control_negativo_no_cumple,
      accion_correctiva,
      responsable,
      observaciones
    } = body;

    const query = `
      UPDATE ${getMicroTable('medios_cultivo')}
      SET
        fecha = COALESCE($1, fecha),
        medio_cultivo = COALESCE($2, medio_cultivo),
        cantidad_ml = COALESCE($3, cantidad_ml),
        cantidad_medio_cultivo_g = COALESCE($4, cantidad_medio_cultivo_g),
        control_negativo_inicio = COALESCE($5, control_negativo_inicio),
        control_negativo_final = COALESCE($6, control_negativo_final),
        control_negativo_cumple = COALESCE($7, control_negativo_cumple),
        control_negativo_no_cumple = COALESCE($8, control_negativo_no_cumple),
        accion_correctiva = COALESCE($9, accion_correctiva),
        responsable = COALESCE($10, responsable),
        observaciones = COALESCE($11, observaciones),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $12
      RETURNING *
    `;

    const values = [
      fecha,
      medio_cultivo,
      cantidad_ml,
      cantidad_medio_cultivo_g,
      control_negativo_inicio,
      control_negativo_final,
      control_negativo_cumple,
      control_negativo_no_cumple,
      accion_correctiva,
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
    console.error('Error al actualizar registro de medios de cultivo:', error);
    return NextResponse.json(
      { error: 'Error al actualizar el registro de medios de cultivo' },
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

    const query = `DELETE FROM ${getMicroTable('medios_cultivo')} WHERE id = $1 RETURNING *`;

    const result = await pool.query(query, [id]);

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Registro no encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: 'Registro eliminado exitosamente' });
  } catch (error) {
    console.error('Error al eliminar registro de medios de cultivo:', error);
    return NextResponse.json(
      { error: 'Error al eliminar el registro de medios de cultivo' },
      { status: 500 }
    );
  }
}
