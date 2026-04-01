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
        horario,
        incubadora_037,
        incubadora_038,
        nevera,
        realizado_por,
        observaciones,
        created_at,
        updated_at
      FROM ${getMicroTable('temperatura_equipos')}
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
    console.error('Error al obtener registro de temperatura de equipos:', error);
    return NextResponse.json(
      { error: 'Error al obtener el registro de temperatura de equipos' },
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
      horario,
      incubadora_037,
      incubadora_038,
      nevera,
      realizado_por,
      observaciones
    } = body;

    const query = `
      UPDATE ${getMicroTable('temperatura_equipos')}
      SET
        fecha = COALESCE($1, fecha),
        horario = COALESCE($2, horario),
        incubadora_037 = COALESCE($3, incubadora_037),
        incubadora_038 = COALESCE($4, incubadora_038),
        nevera = COALESCE($5, nevera),
        realizado_por = COALESCE($6, realizado_por),
        observaciones = COALESCE($7, observaciones),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $8
      RETURNING *
    `;

    const values = [
      fecha,
      horario,
      incubadora_037,
      incubadora_038,
      nevera,
      realizado_por,
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
    console.error('Error al actualizar registro de temperatura de equipos:', error);
    return NextResponse.json(
      { error: 'Error al actualizar el registro de temperatura de equipos' },
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

    const query = `DELETE FROM ${getMicroTable('temperatura_equipos')} WHERE id = $1 RETURNING *`;

    const result = await pool.query(query, [id]);

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Registro no encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: 'Registro eliminado exitosamente' });
  } catch (error) {
    console.error('Error al eliminar registro de temperatura de equipos:', error);
    return NextResponse.json(
      { error: 'Error al eliminar el registro de temperatura de equipos' },
      { status: 500 }
    );
  }
}
