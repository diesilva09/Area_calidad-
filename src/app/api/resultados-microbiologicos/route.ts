import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';

// Configuración de la base de datos
const getPoolConfig = () => {
  const config: any = {
    host: '127.0.0.1', // Forzar IPv4 para evitar problemas de autenticación
    port: 5432,
    database: 'area_calidad',
    user: 'postgres',
    password: process.env.DB_PASSWORD || 'Coruna.24', // ← aquí va la clave real
    ssl: { rejectUnauthorized: false },
  };
  
  return config;
};

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
      FROM resultados_microbiologicos
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

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY fecha DESC, created_at DESC';

    const result = await pool.query(query, params);

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
      INSERT INTO resultados_microbiologicos (
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
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29)
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
      responsable
    ];

    const result = await pool.query(query, values);

    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (error) {
    console.error('Error al crear registro de resultados microbiológicos:', error);
    return NextResponse.json(
      { error: 'Error al crear el registro de resultados microbiológicos' },
      { status: 500 }
    );
  }
}
