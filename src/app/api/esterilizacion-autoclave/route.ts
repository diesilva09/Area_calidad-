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
        elementos_medios_cultivo,
        inicio_ciclo_hora,
        inicio_proceso_hora,
        inicio_proceso_tc,
        inicio_proceso_presion,
        fin_proceso_hora,
        fin_proceso_tc,
        fin_proceso_presion,
        fin_ciclo_hora,
        cinta_indicadora,
        realizado_por,
        observaciones,
        created_at,
        updated_at
      FROM ${getMicroTable('esterilizacion_autoclave')}
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

    query += ' ORDER BY fecha DESC, created_at DESC';

    const result = await pool.query(query, params);

    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('Error al obtener registros de esterilización en autoclave:', error);
    return NextResponse.json(
      { error: 'Error al obtener los registros de esterilización en autoclave' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const {
      fecha,
      elementos_medios_cultivo,
      inicio_ciclo_hora,
      inicio_proceso_hora,
      inicio_proceso_tc,
      inicio_proceso_presion,
      fin_proceso_hora,
      fin_proceso_tc,
      fin_proceso_presion,
      fin_ciclo_hora,
      cinta_indicadora,
      realizado_por,
      observaciones
    } = body;

    // Validación básica
    if (!fecha || !elementos_medios_cultivo || !inicio_ciclo_hora || !inicio_proceso_hora || 
        !inicio_proceso_tc || !inicio_proceso_presion || !fin_proceso_hora || 
        !fin_proceso_tc || !fin_proceso_presion || !fin_ciclo_hora || 
        !cinta_indicadora || !realizado_por) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos' },
        { status: 400 }
      );
    }

    const query = `
      INSERT INTO ${getMicroTable('esterilizacion_autoclave')} (
        fecha,
        elementos_medios_cultivo,
        inicio_ciclo_hora,
        inicio_proceso_hora,
        inicio_proceso_tc,
        inicio_proceso_presion,
        fin_proceso_hora,
        fin_proceso_tc,
        fin_proceso_presion,
        fin_ciclo_hora,
        cinta_indicadora,
        realizado_por,
        observaciones
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *
    `;

    const values = [
      fecha,
      elementos_medios_cultivo,
      inicio_ciclo_hora,
      inicio_proceso_hora,
      inicio_proceso_tc,
      inicio_proceso_presion,
      fin_proceso_hora,
      fin_proceso_tc,
      fin_proceso_presion,
      fin_ciclo_hora,
      cinta_indicadora,
      realizado_por,
      observaciones || null
    ];

    const result = await pool.query(query, values);

    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (error) {
    console.error('Error al crear registro de esterilización en autoclave:', error);
    return NextResponse.json(
      { error: 'Error al crear el registro de esterilización en autoclave' },
      { status: 500 }
    );
  }
}
