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
        fecha = CASE WHEN NULLIF($1, '') IS NULL THEN fecha ELSE CAST($1 AS INTEGER) END,
        horario = CASE WHEN NULLIF($2, '') IS NULL THEN horario ELSE $2 END,
        incubadora_037 = CASE WHEN NULLIF($3, '') IS NULL THEN incubadora_037 ELSE CAST($3 AS DECIMAL(5,2)) END,
        incubadora_038 = CASE WHEN NULLIF($4, '') IS NULL THEN incubadora_038 ELSE CAST($4 AS DECIMAL(5,2)) END,
        nevera = CASE WHEN NULLIF($5, '') IS NULL THEN nevera ELSE CAST($5 AS DECIMAL(5,2)) END,
        realizado_por = CASE WHEN NULLIF($6, '') IS NULL THEN realizado_por ELSE $6 END,
        observaciones = NULLIF($7, ''),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $8
      RETURNING *
    `;

    const values = [
      fecha || '',
      horario || '',
      incubadora_037 || '',
      incubadora_038 || '',
      nevera || '',
      realizado_por || '',
      observaciones || '',
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
