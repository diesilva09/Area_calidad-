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
        lote = COALESCE($8, lote),
        fecha_produccion = COALESCE($9, fecha_produccion),
        fecha_vencimiento = COALESCE($10, fecha_vencimiento),
        mesofilos = COALESCE($11, mesofilos),
        coliformes_totales = COALESCE($12, coliformes_totales),
        coliformes_fecales = COALESCE($13, coliformes_fecales),
        e_coli = COALESCE($14, e_coli),
        mohos = COALESCE($15, mohos),
        levaduras = COALESCE($16, levaduras),
        staphylococcus_aureus = COALESCE($17, staphylococcus_aureus),
        bacillus_cereus = COALESCE($18, bacillus_cereus),
        listeria = COALESCE($19, listeria),
        salmonella = COALESCE($20, salmonella),
        enterobacterias = COALESCE($21, enterobacterias),
        clostridium = COALESCE($22, clostridium),
        esterilidad_comercial = COALESCE($23, esterilidad_comercial),
        anaerobias = COALESCE($24, anaerobias),
        observaciones = COALESCE($25, observaciones),
        parametros_referencia = COALESCE($26, parametros_referencia),
        cumple = COALESCE($27, cumple),
        no_cumple = COALESCE($28, no_cumple),
        codigo = COALESCE($29, codigo),
        medio_diluyente = COALESCE($30, medio_diluyente),
        factor_dilucion = COALESCE($31, factor_dilucion),
        responsable = COALESCE($32, responsable),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $33
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
