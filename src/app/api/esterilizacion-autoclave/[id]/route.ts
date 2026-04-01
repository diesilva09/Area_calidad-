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
        elementos_medios_cultivo,
        inicio_ciclo_hora,
        inicio_proceso_hora,
        inicio_proceso_tc,
        inicio_proceso_presion,
        fin_proceso_hora,
        fin_proceso_tc,
        fin_proceso_presion,
        fin_ciclo_hora,
        cinta_indicadora,
        realizado_por,
        observaciones,
        created_at,
        updated_at
      FROM ${getMicroTable('esterilizacion_autoclave')}
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
    console.error('Error al obtener registro de esterilización en autoclave:', error);
    return NextResponse.json(
      { error: 'Error al obtener el registro de esterilización en autoclave' },
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
      elementos_medios_cultivo,
      inicio_ciclo_hora,
      inicio_proceso_hora,
      inicio_proceso_tc,
      inicio_proceso_presion,
      fin_proceso_hora,
      fin_proceso_tc,
      fin_proceso_presion,
      fin_ciclo_hora,
      cinta_indicadora,
      realizado_por,
      observaciones
    } = body;

    const query = `
      UPDATE ${getMicroTable('esterilizacion_autoclave')}
      SET
        fecha = COALESCE($1, fecha),
        elementos_medios_cultivo = COALESCE($2, elementos_medios_cultivo),
        inicio_ciclo_hora = COALESCE($3, inicio_ciclo_hora),
        inicio_proceso_hora = COALESCE($4, inicio_proceso_hora),
        inicio_proceso_tc = COALESCE($5, inicio_proceso_tc),
        inicio_proceso_presion = COALESCE($6, inicio_proceso_presion),
        fin_proceso_hora = COALESCE($7, fin_proceso_hora),
        fin_proceso_tc = COALESCE($8, fin_proceso_tc),
        fin_proceso_presion = COALESCE($9, fin_proceso_presion),
        fin_ciclo_hora = COALESCE($10, fin_ciclo_hora),
        cinta_indicadora = COALESCE($11, cinta_indicadora),
        realizado_por = COALESCE($12, realizado_por),
        observaciones = COALESCE($13, observaciones),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $14
      RETURNING *
    `;

    const values = [
      fecha,
      elementos_medios_cultivo,
      inicio_ciclo_hora,
      inicio_proceso_hora,
      inicio_proceso_tc,
      inicio_proceso_presion,
      fin_proceso_hora,
      fin_proceso_tc,
      fin_proceso_presion,
      fin_ciclo_hora,
      cinta_indicadora,
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
    console.error('Error al actualizar registro de esterilización en autoclave:', error);
    return NextResponse.json(
      { error: 'Error al actualizar el registro de esterilización en autoclave' },
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

    const query = `DELETE FROM ${getMicroTable('esterilizacion_autoclave')} WHERE id = $1 RETURNING *`;

    const result = await pool.query(query, [id]);

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Registro no encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: 'Registro eliminado exitosamente' });
  } catch (error) {
    console.error('Error al eliminar registro de esterilización en autoclave:', error);
    return NextResponse.json(
      { error: 'Error al eliminar el registro de esterilización en autoclave' },
      { status: 500 }
    );
  }
}
