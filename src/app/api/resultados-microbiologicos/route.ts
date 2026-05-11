import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';
import { getMicroTable, getPoolConfig } from '../micro-config';

const pool = new Pool(getPoolConfig());

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const fecha = searchParams.get('fecha');
    const fechaInicio = searchParams.get('fecha_inicio');
    const fechaFin = searchParams.get('fecha_fin');
    const muestra = searchParams.get('muestra');
    const lote = searchParams.get('lote');
    const tipo = searchParams.get('tipo');
    const cumple = searchParams.get('cumple');
    const cronogramaTaskId = searchParams.get('cronograma_task_id');

    let query = `
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
        cronograma_task_id,
        cronograma_codigo,
        estado,
        created_at,
        updated_at
      FROM ${getMicroTable('resultados_microbiologicos')}
    `;

    const params: any[] = [];
    const conditions: string[] = [];

    if (fecha) {
      conditions.push('DATE(fecha) = $' + (conditions.length + 1));
      params.push(fecha);
    }

    if (fechaInicio && fechaFin) {
      conditions.push('fecha BETWEEN $' + (conditions.length + 1) + ' AND $' + (conditions.length + 2));
      params.push(fechaInicio, fechaFin);
    }

    if (muestra) {
      conditions.push('muestra ILIKE $' + (conditions.length + 1));
      params.push(`%${muestra}%`);
    }

    if (lote) {
      conditions.push('lote ILIKE $' + (conditions.length + 1));
      params.push(`%${lote}%`);
    }

    if (tipo) {
      conditions.push('interno_externo ILIKE $' + (conditions.length + 1));
      params.push(`%${tipo}%`);
    }

    if (cumple !== null) {
      conditions.push('cumple = $' + (conditions.length + 1));
      params.push(cumple === 'true');
    }

    if (cronogramaTaskId) {
      conditions.push('cronograma_task_id = $' + (conditions.length + 1));
      params.push(parseInt(cronogramaTaskId, 10));
      console.log('🔍 API GET: Buscando por cronograma_task_id =', cronogramaTaskId);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY fecha DESC, created_at DESC';

    console.log('🔍 API GET: Query SQL:', query);
    console.log('🔍 API GET: Params:', params);

    const result = await pool.query(query, params);
    console.log('🔍 API GET: Rows encontradas:', result.rows.length);

    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('Error al obtener registros de resultados microbiológicos:', error);
    return NextResponse.json(
      { error: 'Error al obtener los registros de resultados microbiológicos' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
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
      responsable,
      cronograma_task_id,
      cronograma_codigo
    } = body;

    console.log(' API POST: Creando registro con cronograma_task_id:', cronograma_task_id);

    // Validación básica
    if (!fecha || !mes_muestreo || !hora_muestreo || !interno_externo || 
        !tipo || !area || !muestra || !lote || !fecha_produccion || 
        !fecha_vencimiento || !codigo || !responsable) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos' },
        { status: 400 }
      );
    }

    const query = `
      INSERT INTO ${getMicroTable('resultados_microbiologicos')} (
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
        cronograma_task_id,
        cronograma_codigo
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, $32, $33, $34, $35, $36)
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
      tipo_muestra || null,
      valor_muestra || null,
      lote,
      fecha_produccion,
      fecha_vencimiento,
      mesofilos || null,
      coliformes_totales || null,
      coliformes_fecales || null,
      e_coli || null,
      mohos || null,
      levaduras || null,
      staphylococcus_aureus || null,
      bacillus_cereus || null,
      listeria || null,
      salmonella || null,
      enterobacterias || null,
      clostridium || null,
      esterilidad_comercial || null,
      anaerobias || null,
      observaciones || null,
      parametros_referencia || null,
      cumple || false,
      no_cumple || false,
      codigo,
      medio_diluyente || null,
      factor_dilucion || null,
      responsable,
      cronograma_task_id || null,
      cronograma_codigo || null
    ];

    const result = await pool.query(query, values);
    console.log('✅ API POST: Registro creado con ID:', result.rows[0]?.id, 'cronograma_task_id:', result.rows[0]?.cronograma_task_id);

    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (error) {
    const err = error as any;
    console.error('Error al crear registro de resultados microbiológicos:', {
      message: err?.message,
      code: err?.code,
      detail: err?.detail,
      hint: err?.hint,
      where: err?.where,
      constraint: err?.constraint,
    });
    return NextResponse.json(
      {
        error: 'Error al crear el registro de resultados microbiológicos',
        details: {
          message: err?.message,
          code: err?.code,
          detail: err?.detail,
          hint: err?.hint,
          where: err?.where,
          constraint: err?.constraint,
        },
      },
      { status: 500 }
    );
  }
}