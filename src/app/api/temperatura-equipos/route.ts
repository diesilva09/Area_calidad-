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

    let query = `
      SELECT
        id,
        fecha,
        horario,
        incubadora_037,
        incubadora_038,
        nevera,
        realizado_por,
        observaciones,
        estado,
        created_at,
        updated_at
      FROM ${getMicroTable('temperatura_equipos')}
    `;

    const params: any[] = [];
    const conditions: string[] = [];

    if (fecha) {
      conditions.push('fecha = $' + (conditions.length + 1));
      params.push(fecha);
    }

    if (fechaInicio && fechaFin) {
      conditions.push('fecha BETWEEN $' + (conditions.length + 1) + ' AND $' + (conditions.length + 2));
      params.push(fechaInicio, fechaFin);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY fecha DESC, horario ASC';

    const result = await pool.query(query, params);

    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('Error al obtener registros de temperatura de equipos:', error);
    return NextResponse.json(
      { error: 'Error al obtener los registros de temperatura de equipos' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const {
      fecha,
      horario,
      incubadora_037,
      incubadora_038,
      nevera,
      realizado_por,
      observaciones,
      estado
    } = body;

    const query = `
      INSERT INTO ${getMicroTable('temperatura_equipos')} (
        fecha,
        horario,
        incubadora_037,
        incubadora_038,
        nevera,
        realizado_por,
        observaciones,
        estado
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `;

    const values = [
      fecha || null,
      horario || null,
      incubadora_037 || null,
      incubadora_038 || null,
      nevera || null,
      realizado_por || null,
      observaciones || null,
      estado || 'completado'
    ];

    const result = await pool.query(query, values);

    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (error) {
    console.error('Error al crear registro de temperatura de equipos:', error);
    return NextResponse.json(
      { error: 'Error al crear el registro de temperatura de equipos' },
      { status: 500 }
    );
  }
}
