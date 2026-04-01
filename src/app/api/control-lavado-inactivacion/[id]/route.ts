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
        actividad_realizada,
        sustancia_limpieza_nombre,
        sustancia_limpieza_cantidad_preparada,
        sustancia_limpieza_cantidad_sustancia,
        sustancia_desinfeccion_1_nombre,
        sustancia_desinfeccion_1_cantidad_preparada,
        sustancia_desinfeccion_1_cantidad_sustancia,
        sustancia_desinfeccion_2_nombre,
        sustancia_desinfeccion_2_cantidad_preparada,
        sustancia_desinfeccion_2_cantidad_sustancia,
        realizado_por,
        observaciones,
        created_at,
        updated_at
      FROM ${getMicroTable('control_lavado_inactivacion')}
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
    console.error('Error al obtener registro de control de lavado e inactivación:', error);
    return NextResponse.json(
      { error: 'Error al obtener el registro de control de lavado e inactivación' },
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
      actividad_realizada,
      sustancia_limpieza_nombre,
      sustancia_limpieza_cantidad_preparada,
      sustancia_limpieza_cantidad_sustancia,
      sustancia_desinfeccion_1_nombre,
      sustancia_desinfeccion_1_cantidad_preparada,
      sustancia_desinfeccion_1_cantidad_sustancia,
      sustancia_desinfeccion_2_nombre,
      sustancia_desinfeccion_2_cantidad_preparada,
      sustancia_desinfeccion_2_cantidad_sustancia,
      realizado_por,
      observaciones
    } = body;

    const query = `
      UPDATE ${getMicroTable('control_lavado_inactivacion')}
      SET
        fecha = COALESCE($1, fecha),
        actividad_realizada = COALESCE($2, actividad_realizada),
        sustancia_limpieza_nombre = COALESCE($3, sustancia_limpieza_nombre),
        sustancia_limpieza_cantidad_preparada = COALESCE($4, sustancia_limpieza_cantidad_preparada),
        sustancia_limpieza_cantidad_sustancia = COALESCE($5, sustancia_limpieza_cantidad_sustancia),
        sustancia_desinfeccion_1_nombre = COALESCE($6, sustancia_desinfeccion_1_nombre),
        sustancia_desinfeccion_1_cantidad_preparada = COALESCE($7, sustancia_desinfeccion_1_cantidad_preparada),
        sustancia_desinfeccion_1_cantidad_sustancia = COALESCE($8, sustancia_desinfeccion_1_cantidad_sustancia),
        sustancia_desinfeccion_2_nombre = COALESCE($9, sustancia_desinfeccion_2_nombre),
        sustancia_desinfeccion_2_cantidad_preparada = COALESCE($10, sustancia_desinfeccion_2_cantidad_preparada),
        sustancia_desinfeccion_2_cantidad_sustancia = COALESCE($11, sustancia_desinfeccion_2_cantidad_sustancia),
        realizado_por = COALESCE($12, realizado_por),
        observaciones = COALESCE($13, observaciones),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $14
      RETURNING *
    `;

    const values = [
      fecha,
      actividad_realizada,
      sustancia_limpieza_nombre,
      sustancia_limpieza_cantidad_preparada,
      sustancia_limpieza_cantidad_sustancia,
      sustancia_desinfeccion_1_nombre,
      sustancia_desinfeccion_1_cantidad_preparada,
      sustancia_desinfeccion_1_cantidad_sustancia,
      sustancia_desinfeccion_2_nombre,
      sustancia_desinfeccion_2_cantidad_preparada,
      sustancia_desinfeccion_2_cantidad_sustancia,
      realizado_por,
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
    console.error('Error al actualizar registro de control de lavado e inactivación:', error);
    return NextResponse.json(
      { error: 'Error al actualizar el registro de control de lavado e inactivación' },
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

    const query = `DELETE FROM ${getMicroTable('control_lavado_inactivacion')} WHERE id = $1 RETURNING *`;

    const result = await pool.query(query, [id]);

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Registro no encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: 'Registro eliminado exitosamente' });
  } catch (error) {
    console.error('Error al eliminar registro de control de lavado e inactivación:', error);
    return NextResponse.json(
      { error: 'Error al eliminar el registro de control de lavado e inactivación' },
      { status: 500 }
    );
  }
}
