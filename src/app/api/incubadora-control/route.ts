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
        estado,
        created_at,
        updated_at
      FROM ${getMicroTable('incubadora_control')}
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
      observaciones,
      estado
    } = body;

    const query = `
      INSERT INTO ${getMicroTable('incubadora_control')} (
        muestra,
        fecha_ingreso,
        hora_ingreso,
        fecha_salida,
        hora_salida,
        responsable,
        observaciones,
        estado
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `;

    const values = [
      muestra || null,
      fecha_ingreso || null,
      hora_ingreso || null,
      fecha_salida || null,
      hora_salida || null,
      responsable || null,
      observaciones || null,
      estado || 'completado'
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
