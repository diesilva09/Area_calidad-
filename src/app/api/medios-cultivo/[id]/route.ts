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
        medio,
        lote,
        fecha_vencimiento,
        preparado_por,
        autoclave,
        temperatura,
        presion,
        tiempo,
        control_negativo,
        observaciones,
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
      medio,
      lote,
      fecha_vencimiento,
      preparado_por,
      autoclave,
      temperatura,
      presion,
      tiempo,
      control_negativo,
      observaciones
    } = body;

    const query = `
      UPDATE ${getMicroTable('medios_cultivo')}
      SET
        fecha = COALESCE($1, fecha),
        medio = COALESCE($2, medio),
        lote = COALESCE($3, lote),
        fecha_vencimiento = COALESCE($4, fecha_vencimiento),
        preparado_por = COALESCE($5, preparado_por),
        autoclave = COALESCE($6, autoclave),
        temperatura = COALESCE($7, temperatura),
        presion = COALESCE($8, presion),
        tiempo = COALESCE($9, tiempo),
        control_negativo = COALESCE($10, control_negativo),
        observaciones = COALESCE($11, observaciones),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $12
      RETURNING *
    `;

    const values = [
      fecha,
      medio,
      lote,
      fecha_vencimiento,
      preparado_por,
      autoclave,
      temperatura,
      presion,
      tiempo,
      control_negativo,
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
