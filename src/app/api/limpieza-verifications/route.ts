import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');

    let query = 'SELECT * FROM limpieza_verifications';
    let params: any[] = [];

    if (date) {
      query += ' WHERE fecha = $1 ORDER BY created_at DESC';
      params.push(date);
    } else {
      query += ' ORDER BY created_at DESC';
    }

    const result = await pool.query(query, params);
    
    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('Error al obtener verificaciones de limpieza:', error);
    return NextResponse.json(
      { error: 'Error al obtener las verificaciones de limpieza' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      fecha, mes_corte, hora, tipo_verificacion, linea, superficie, estado_filtro,
      presencia_elementos_extranos, detalle_elementos_extranos, resultados_atp_ri,
      resultados_atp_ac, resultados_atp_rf, lote_hisopo, observacion_atp,
      deteccion_alergenos_ri, deteccion_alergenos_ac, deteccion_alergenos_rf,
      lote_hisopo2, observacion_alergenos, detergente, desinfectante,
      verificacion_visual, observacion_visual, verificado_por, responsable_produccion,
      responsable_mantenimiento, status, created_by 
    } = body;

    if (!fecha || !tipo_verificacion || !verificado_por) {
      return NextResponse.json(
        { error: 'Faltan campos obligatorios: fecha, tipo_verificacion, verificado_por' },
        { status: 400 }
      );
    }

    const query = `
      INSERT INTO limpieza_verifications (
        fecha, mes_corte, hora, tipo_verificacion, linea, superficie, estado_filtro,
        presencia_elementos_extranos, detalle_elementos_extranos, resultados_atp_ri,
        resultados_atp_ac, resultados_atp_rf, lote_hisopo, observacion_atp,
        deteccion_alergenos_ri, deteccion_alergenos_ac, deteccion_alergenos_rf,
        lote_hisopo2, observacion_alergenos, detergente, desinfectante,
        verificacion_visual, observacion_visual, verificado_por, responsable_produccion,
        responsable_mantenimiento, status, created_by
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, 
        $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28
      ) RETURNING *
    `;
    
    const params = [
      fecha, mes_corte, hora, tipo_verificacion, linea, superficie, estado_filtro,
      presencia_elementos_extranos, detalle_elementos_extranos, resultados_atp_ri,
      resultados_atp_ac, resultados_atp_rf, lote_hisopo, observacion_atp,
      deteccion_alergenos_ri, deteccion_alergenos_ac, deteccion_alergenos_rf,
      lote_hisopo2, observacion_alergenos, detergente, desinfectante,
      verificacion_visual, observacion_visual, verificado_por, responsable_produccion,
      responsable_mantenimiento, status || 'pending', created_by
    ];
    
    const result = await pool.query(query, params);
    
    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (error) {
    console.error('Error al crear verificación de limpieza:', error);
    return NextResponse.json(
      { error: 'Error al crear la verificación de limpieza' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id } = body;
    
    if (!id) {
      return NextResponse.json(
        { error: 'ID es requerido para actualizar' },
        { status: 400 }
      );
    }

    const { 
      fecha, mes_corte, hora, tipo_verificacion, linea, superficie, estado_filtro,
      presencia_elementos_extranos, detalle_elementos_extranos, resultados_atp_ri,
      resultados_atp_ac, resultados_atp_rf, lote_hisopo, observacion_atp,
      deteccion_alergenos_ri, deteccion_alergenos_ac, deteccion_alergenos_rf,
      lote_hisopo2, observacion_alergenos, detergente, desinfectante,
      verificacion_visual, observacion_visual, verificado_por, responsable_produccion,
      responsable_mantenimiento
    } = body;

    if (!fecha || !tipo_verificacion || !verificado_por) {
      return NextResponse.json(
        { error: 'Faltan campos obligatorios: fecha, tipo_verificacion, verificado_por' },
        { status: 400 }
      );
    }

    const query = `
      UPDATE limpieza_verifications SET
        fecha = $1,
        mes_corte = $2,
        hora = $3,
        tipo_verificacion = $4,
        linea = $5,
        superficie = $6,
        estado_filtro = $7,
        presencia_elementos_extranos = $8,
        detalle_elementos_extranos = $9,
        resultados_atp_ri = $10,
        resultados_atp_ac = $11,
        resultados_atp_rf = $12,
        lote_hisopo = $13,
        observacion_atp = $14,
        deteccion_alergenos_ri = $15,
        deteccion_alergenos_ac = $16,
        deteccion_alergenos_rf = $17,
        lote_hisopo2 = $18,
        observacion_alergenos = $19,
        detergente = $20,
        desinfectante = $21,
        verificacion_visual = $22,
        observacion_visual = $23,
        verificado_por = $24,
        responsable_produccion = $25,
        responsable_mantenimiento = $26,
        status = 'completed',
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $27
      RETURNING *
    `;
    
    const params = [
      fecha, mes_corte, hora, tipo_verificacion, linea, superficie, estado_filtro,
      presencia_elementos_extranos, detalle_elementos_extranos, resultados_atp_ri,
      resultados_atp_ac, resultados_atp_rf, lote_hisopo, observacion_atp,
      deteccion_alergenos_ri, deteccion_alergenos_ac, deteccion_alergenos_rf,
      lote_hisopo2, observacion_alergenos, detergente, desinfectante,
      verificacion_visual, observacion_visual, verificado_por, responsable_produccion,
      responsable_mantenimiento, id
    ];
    
    const result = await pool.query(query, params);
    
    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Verificación de limpieza no encontrada' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(result.rows[0], { status: 200 });
  } catch (error) {
    console.error('Error al actualizar verificación de limpieza:', error);
    return NextResponse.json(
      { error: 'Error al actualizar la verificación de limpieza' },
      { status: 500 }
    );
  }
}
