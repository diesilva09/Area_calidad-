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
    const responsable = searchParams.get('responsable');

    let query = `
      SELECT 
        id,
        muestra,
        fecha_ingreso,
        hora_ingreso,
        fecha_salida,
        hora_salida,
        responsable,
        observaciones,
        created_at,
        updated_at
      FROM incubadora_control
    `;

    const params: any[] = [];
    const conditions: string[] = [];

    if (fecha) {
      conditions.push('DATE(fecha_ingreso) = $' + (conditions.length + 1));
      params.push(fecha);
    }

    if (fechaInicio && fechaFin) {
      conditions.push('fecha_ingreso BETWEEN $' + (conditions.length + 1) + ' AND $' + (conditions.length + 2));
      params.push(fechaInicio, fechaFin);
    }

    if (muestra) {
      conditions.push('muestra ILIKE $' + (conditions.length + 1));
      params.push(`%${muestra}%`);
    }

    if (responsable) {
      conditions.push('responsable ILIKE $' + (conditions.length + 1));
      params.push(`%${responsable}%`);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY fecha_ingreso DESC, created_at DESC';

    const result = await pool.query(query, params);

    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('Error al obtener registros de control de incubadora:', error);
    return NextResponse.json(
      { error: 'Error al obtener los registros de control de incubadora' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const {
      muestra,
      fecha_ingreso,
      hora_ingreso,
      fecha_salida,
      hora_salida,
      responsable,
      observaciones
    } = body;

    // Validación básica
    if (!muestra || !fecha_ingreso || !hora_ingreso || !fecha_salida || !hora_salida || !responsable) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos' },
        { status: 400 }
      );
    }

    const query = `
      INSERT INTO incubadora_control (
        muestra,
        fecha_ingreso,
        hora_ingreso,
        fecha_salida,
        hora_salida,
        responsable,
        observaciones
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;

    const values = [
      muestra,
      fecha_ingreso,
      hora_ingreso,
      fecha_salida,
      hora_salida,
      responsable,
      observaciones || null
    ];

    const result = await pool.query(query, values);

    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (error) {
    console.error('Error al crear registro de control de incubadora:', error);
    return NextResponse.json(
      { error: 'Error al crear el registro de control de incubadora' },
      { status: 500 }
    );
  }
}
