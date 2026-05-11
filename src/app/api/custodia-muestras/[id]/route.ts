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
        tipo_muestra,
        valor_muestra,
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
        cronograma_task_id,
        cronograma_codigo,
        estado,
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
      tipo_muestra,
      valor_muestra,
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
      cronograma_codigo,
      estado
    } = body;

    const query = `
      UPDATE ${getMicroTable('custodia_muestras')}
      SET
        codigo = COALESCE($1, codigo),
        tipo = COALESCE($2, tipo),
        muestra_id = COALESCE($3, muestra_id),
        area = COALESCE($4, area),
        tipo_muestra = COALESCE($5, tipo_muestra),
        valor_muestra = COALESCE($6, valor_muestra),
        temperatura = COALESCE($7, temperatura),
        cantidad = COALESCE($8, cantidad),
        motivo = COALESCE($9, motivo),
        tipo_analisis_sl = COALESCE($10, tipo_analisis_sl),
        tipo_analisis_bc = COALESCE($11, tipo_analisis_bc),
        tipo_analisis_ym = COALESCE($12, tipo_analisis_ym),
        tipo_analisis_tc = COALESCE($13, tipo_analisis_tc),
        tipo_analisis_ec = COALESCE($14, tipo_analisis_ec),
        tipo_analisis_ls = COALESCE($15, tipo_analisis_ls),
        tipo_analisis_etb = COALESCE($16, tipo_analisis_etb),
        tipo_analisis_xsa = COALESCE($17, tipo_analisis_xsa),
        toma_muestra_fecha = COALESCE($18, toma_muestra_fecha),
        toma_muestra_hora = COALESCE($19, toma_muestra_hora),
        recepcion_lab_fecha = COALESCE($20, recepcion_lab_fecha),
        recepcion_lab_hora = COALESCE($21, recepcion_lab_hora),
        medio_transporte = COALESCE($22, medio_transporte),
        responsable = COALESCE($23, responsable),
        observaciones = COALESCE($24, observaciones),
        cronograma_codigo = COALESCE($25, cronograma_codigo),
        estado = COALESCE($26, estado),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $27
      RETURNING *
    `;

    const values = [
      codigo,
      tipo,
      muestra_id,
      area,
      tipo_muestra,
      valor_muestra,
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
      cronograma_codigo,
      estado,
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
