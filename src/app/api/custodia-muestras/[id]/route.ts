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
        codigo,
        tipo,
        muestra_id,
        area,
        temperatura,
        cantidad,
        motivo,
        tipo_analisis_sl,
        tipo_analisis_bc,
        tipo_analisis_ym,
        tipo_analisis_tc,
        tipo_analisis_ec,
        tipo_analisis_ls,
        tipo_analisis_etb,
        tipo_analisis_xsa,
        toma_muestra_fecha,
        toma_muestra_hora,
        recepcion_lab_fecha,
        recepcion_lab_hora,
        medio_transporte,
        responsable,
        observaciones,
        created_at,
        updated_at
      FROM ${getMicroTable('custodia_muestras')}
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
    console.error('Error al obtener registro de custodia de muestras:', error);
    return NextResponse.json(
      { error: 'Error al obtener el registro de custodia de muestras' },
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
      codigo,
      tipo,
      muestra_id,
      area,
      temperatura,
      cantidad,
      motivo,
      tipo_analisis_sl,
      tipo_analisis_bc,
      tipo_analisis_ym,
      tipo_analisis_tc,
      tipo_analisis_ec,
      tipo_analisis_ls,
      tipo_analisis_etb,
      tipo_analisis_xsa,
      toma_muestra_fecha,
      toma_muestra_hora,
      recepcion_lab_fecha,
      recepcion_lab_hora,
      medio_transporte,
      responsable,
      observaciones
    } = body;

    const query = `
      UPDATE ${getMicroTable('custodia_muestras')}
      SET
        codigo = COALESCE($1, codigo),
        tipo = COALESCE($2, tipo),
        muestra_id = COALESCE($3, muestra_id),
        area = COALESCE($4, area),
        temperatura = COALESCE($5, temperatura),
        cantidad = COALESCE($6, cantidad),
        motivo = COALESCE($7, motivo),
        tipo_analisis_sl = COALESCE($8, tipo_analisis_sl),
        tipo_analisis_bc = COALESCE($9, tipo_analisis_bc),
        tipo_analisis_ym = COALESCE($10, tipo_analisis_ym),
        tipo_analisis_tc = COALESCE($11, tipo_analisis_tc),
        tipo_analisis_ec = COALESCE($12, tipo_analisis_ec),
        tipo_analisis_ls = COALESCE($13, tipo_analisis_ls),
        tipo_analisis_etb = COALESCE($14, tipo_analisis_etb),
        tipo_analisis_xsa = COALESCE($15, tipo_analisis_xsa),
        toma_muestra_fecha = COALESCE($16, toma_muestra_fecha),
        toma_muestra_hora = COALESCE($17, toma_muestra_hora),
        recepcion_lab_fecha = COALESCE($18, recepcion_lab_fecha),
        recepcion_lab_hora = COALESCE($19, recepcion_lab_hora),
        medio_transporte = COALESCE($20, medio_transporte),
        responsable = COALESCE($21, responsable),
        observaciones = COALESCE($22, observaciones),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $23
      RETURNING *
    `;

    const values = [
      codigo,
      tipo,
      muestra_id,
      area,
      temperatura,
      cantidad,
      motivo,
      tipo_analisis_sl,
      tipo_analisis_bc,
      tipo_analisis_ym,
      tipo_analisis_tc,
      tipo_analisis_ec,
      tipo_analisis_ls,
      tipo_analisis_etb,
      tipo_analisis_xsa,
      toma_muestra_fecha,
      toma_muestra_hora,
      recepcion_lab_fecha,
      recepcion_lab_hora,
      medio_transporte,
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
    console.error('Error al actualizar registro de custodia de muestras:', error);
    return NextResponse.json(
      { error: 'Error al actualizar el registro de custodia de muestras' },
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

    const query = `DELETE FROM ${getMicroTable('custodia_muestras')} WHERE id = $1 RETURNING *`;

    const result = await pool.query(query, [id]);

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Registro no encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: 'Registro eliminado exitosamente' });
  } catch (error) {
    console.error('Error al eliminar registro de custodia de muestras:', error);
    return NextResponse.json(
      { error: 'Error al eliminar el registro de custodia de muestras' },
      { status: 500 }
    );
  }
}
