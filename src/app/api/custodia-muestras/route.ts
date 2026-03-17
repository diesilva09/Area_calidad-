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
    const codigo = searchParams.get('codigo');
    const tipoAnalisis = searchParams.get('tipo_analisis');

    let query = `
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
      FROM custodia_muestras
    `;

    const params: any[] = [];
    const conditions: string[] = [];

    if (fecha) {
      conditions.push('DATE(toma_muestra_fecha) = $' + (conditions.length + 1));
      params.push(fecha);
    }

    if (fechaInicio && fechaFin) {
      conditions.push('toma_muestra_fecha BETWEEN $' + (conditions.length + 1) + ' AND $' + (conditions.length + 2));
      params.push(fechaInicio, fechaFin);
    }

    if (codigo) {
      conditions.push('codigo ILIKE $' + (conditions.length + 1));
      params.push(`%${codigo}%`);
    }

    if (tipoAnalisis) {
      conditions.push(`(
        tipo_analisis_sl = $${conditions.length + 1} OR
        tipo_analisis_bc = $${conditions.length + 1} OR
        tipo_analisis_ym = $${conditions.length + 1} OR
        tipo_analisis_tc = $${conditions.length + 1} OR
        tipo_analisis_ec = $${conditions.length + 1} OR
        tipo_analisis_ls = $${conditions.length + 1} OR
        tipo_analisis_etb = $${conditions.length + 1} OR
        tipo_analisis_xsa = $${conditions.length + 1}
      )`);
      params.push(tipoAnalisis);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY toma_muestra_fecha DESC, created_at DESC';

    const result = await pool.query(query, params);

    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('Error al obtener registros de custodia de muestras:', error);
    return NextResponse.json(
      { error: 'Error al obtener los registros de custodia de muestras' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
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

    // Validación básica
    if (!codigo || !tipo || !muestra_id || !area || !temperatura || !cantidad || 
        !motivo || !toma_muestra_fecha || !toma_muestra_hora || 
        !recepcion_lab_fecha || !recepcion_lab_hora || !medio_transporte || !responsable) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos' },
        { status: 400 }
      );
    }

    const query = `
      INSERT INTO custodia_muestras (
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
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21)
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
      tipo_analisis_sl || null,
      tipo_analisis_bc || null,
      tipo_analisis_ym || null,
      tipo_analisis_tc || null,
      tipo_analisis_ec || null,
      tipo_analisis_ls || null,
      tipo_analisis_etb || null,
      tipo_analisis_xsa || null,
      toma_muestra_fecha,
      toma_muestra_hora,
      recepcion_lab_fecha,
      recepcion_lab_hora,
      medio_transporte,
      responsable,
      observaciones || null
    ];

    const result = await pool.query(query, values);

    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (error) {
    console.error('Error al crear registro de custodia de muestras:', error);
    return NextResponse.json(
      { error: 'Error al crear el registro de custodia de muestras' },
      { status: 500 }
    );
  }
}
