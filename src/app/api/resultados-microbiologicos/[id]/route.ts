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
        mes_muestreo,
        hora_muestreo,
        interno_externo,
        tipo,
        area,
        muestra,
        tipo_muestra,
        valor_muestra,
        lote,
        fecha_produccion,
        fecha_vencimiento,
        mesofilos,
        coliformes_totales,
        coliformes_fecales,
        e_coli,
        mohos,
        levaduras,
        staphylococcus_aureus,
        bacillus_cereus,
        listeria,
        salmonella,
        enterobacterias,
        clostridium,
        esterilidad_comercial,
        anaerobias,
        observaciones,
        parametros_referencia,
        cumple,
        no_cumple,
        codigo,
        medio_diluyente,
        factor_dilucion,
        responsable,
        created_at,
        updated_at
      FROM ${getMicroTable('resultados_microbiologicos')}
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
    console.error('Error al obtener registro de resultados microbiológicos:', error);
    return NextResponse.json(
      { error: 'Error al obtener el registro de resultados microbiológicos' },
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
      mes_muestreo,
      hora_muestreo,
      interno_externo,
      tipo,
      area,
      muestra,
      tipo_muestra,
      valor_muestra,
      lote,
      fecha_produccion,
      fecha_vencimiento,
      mesofilos,
      coliformes_totales,
      coliformes_fecales,
      e_coli,
      mohos,
      levaduras,
      staphylococcus_aureus,
      bacillus_cereus,
      listeria,
      salmonella,
      enterobacterias,
      clostridium,
      esterilidad_comercial,
      anaerobias,
      observaciones,
      parametros_referencia,
      cumple,
      no_cumple,
      codigo,
      medio_diluyente,
      factor_dilucion,
      responsable
    } = body;

    const query = `
      UPDATE ${getMicroTable('resultados_microbiologicos')}
      SET
        fecha = COALESCE($1, fecha),
        mes_muestreo = COALESCE($2, mes_muestreo),
        hora_muestreo = COALESCE($3, hora_muestreo),
        interno_externo = COALESCE($4, interno_externo),
        tipo = COALESCE($5, tipo),
        area = COALESCE($6, area),
        muestra = COALESCE($7, muestra),
        tipo_muestra = COALESCE($8, tipo_muestra),
        valor_muestra = COALESCE($9, valor_muestra),
        lote = COALESCE($10, lote),
        fecha_produccion = COALESCE($11, fecha_produccion),
        fecha_vencimiento = COALESCE($12, fecha_vencimiento),
        mesofilos = COALESCE($13, mesofilos),
        coliformes_totales = COALESCE($14, coliformes_totales),
        coliformes_fecales = COALESCE($15, coliformes_fecales),
        e_coli = COALESCE($16, e_coli),
        mohos = COALESCE($17, mohos),
        levaduras = COALESCE($18, levaduras),
        staphylococcus_aureus = COALESCE($19, staphylococcus_aureus),
        bacillus_cereus = COALESCE($20, bacillus_cereus),
        listeria = COALESCE($21, listeria),
        salmonella = COALESCE($22, salmonella),
        enterobacterias = COALESCE($23, enterobacterias),
        clostridium = COALESCE($24, clostridium),
        esterilidad_comercial = COALESCE($25, esterilidad_comercial),
        anaerobias = COALESCE($26, anaerobias),
        observaciones = COALESCE($27, observaciones),
        parametros_referencia = COALESCE($28, parametros_referencia),
        cumple = COALESCE($29, cumple),
        no_cumple = COALESCE($30, no_cumple),
        codigo = COALESCE($31, codigo),
        medio_diluyente = COALESCE($32, medio_diluyente),
        factor_dilucion = COALESCE($33, factor_dilucion),
        responsable = COALESCE($34, responsable),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $35
      RETURNING *
    `;

    const values = [
      fecha,
      mes_muestreo,
      hora_muestreo,
      interno_externo,
      tipo,
      area,
      muestra,
      tipo_muestra,
      valor_muestra,
      lote,
      fecha_produccion,
      fecha_vencimiento,
      mesofilos,
      coliformes_totales,
      coliformes_fecales,
      e_coli,
      mohos,
      levaduras,
      staphylococcus_aureus,
      bacillus_cereus,
      listeria,
      salmonella,
      enterobacterias,
      clostridium,
      esterilidad_comercial,
      anaerobias,
      observaciones,
      parametros_referencia,
      cumple,
      no_cumple,
      codigo,
      medio_diluyente,
      factor_dilucion,
      responsable,
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
    console.error('Error al actualizar registro de resultados microbiológicos:', error);
    return NextResponse.json(
      { error: 'Error al actualizar el registro de resultados microbiológicos' },
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

    const query = `DELETE FROM ${getMicroTable('resultados_microbiologicos')} WHERE id = $1 RETURNING *`;

    const result = await pool.query(query, [id]);

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Registro no encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: 'Registro eliminado exitosamente' });
  } catch (error) {
    console.error('Error al eliminar registro de resultados microbiológicos:', error);
    return NextResponse.json(
      { error: 'Error al eliminar el registro de resultados microbiológicos' },
      { status: 500 }
    );
  }
}
