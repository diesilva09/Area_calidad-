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
    const actividad = searchParams.get('actividad');
    const responsable = searchParams.get('responsable');
    const sustanciaLimpieza = searchParams.get('sustancia_limpieza');
    const sustanciaDesinfeccion = searchParams.get('sustancia_desinfeccion');

    let query = `
      SELECT
        id,
        fecha,
        actividad_realizada,
        sustancia_limpieza_nombre,
        sustancia_limpieza_cantidad_preparada,
        sustancia_limpieza_cantidad_sustancia,
        sustancia_desinfeccion_1_nombre,
        sustancia_desinfeccion_1_cantidad_preparada,
        sustancia_desinfeccion_1_cantidad_sustancia,
        sustancia_desinfeccion_2_nombre,
        sustancia_desinfeccion_2_cantidad_preparada,
        sustancia_desinfeccion_2_cantidad_sustancia,
        realizado_por,
        observaciones,
        created_at,
        updated_at
      FROM ${getMicroTable('control_lavado_inactivacion')}
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

    if (actividad) {
      conditions.push('actividad_realizada ILIKE $' + (conditions.length + 1));
      params.push(`%${actividad}%`);
    }

    if (responsable) {
      conditions.push('realizado_por ILIKE $' + (conditions.length + 1));
      params.push(`%${responsable}%`);
    }

    if (sustanciaLimpieza) {
      conditions.push('sustancia_limpieza_nombre ILIKE $' + (conditions.length + 1));
      params.push(`%${sustanciaLimpieza}%`);
    }

    if (sustanciaDesinfeccion) {
      conditions.push('(sustancia_desinfeccion_1_nombre ILIKE $' + (conditions.length + 1) + ' OR sustancia_desinfeccion_2_nombre ILIKE $' + (conditions.length + 1) + ')');
      params.push(`%${sustanciaDesinfeccion}%`, `%${sustanciaDesinfeccion}%`);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY fecha DESC, created_at DESC';

    const result = await pool.query(query, params);

    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('Error al obtener registros de control de lavado e inactivación:', error);
    return NextResponse.json(
      { error: 'Error al obtener los registros de control de lavado e inactivación' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const {
      fecha,
      actividad_realizada,
      sustancia_limpieza_nombre,
      sustancia_limpieza_cantidad_preparada,
      sustancia_limpieza_cantidad_sustancia,
      sustancia_desinfeccion_1_nombre,
      sustancia_desinfeccion_1_cantidad_preparada,
      sustancia_desinfeccion_1_cantidad_sustancia,
      sustancia_desinfeccion_2_nombre,
      sustancia_desinfeccion_2_cantidad_preparada,
      sustancia_desinfeccion_2_cantidad_sustancia,
      realizado_por,
      observaciones
    } = body;

    // Validación básica
    if (!fecha || !actividad_realizada || !sustancia_limpieza_nombre || 
        !sustancia_limpieza_cantidad_preparada || !sustancia_limpieza_cantidad_sustancia ||
        !sustancia_desinfeccion_1_nombre || !sustancia_desinfeccion_1_cantidad_preparada || 
        !sustancia_desinfeccion_1_cantidad_sustancia || !sustancia_desinfeccion_2_nombre ||
        !sustancia_desinfeccion_2_cantidad_preparada || !sustancia_desinfeccion_2_cantidad_sustancia ||
        !realizado_por) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos' },
        { status: 400 }
      );
    }

    const query = `
      INSERT INTO ${getMicroTable('control_lavado_inactivacion')} (
        fecha,
        actividad_realizada,
        sustancia_limpieza_nombre,
        sustancia_limpieza_cantidad_preparada,
        sustancia_limpieza_cantidad_sustancia,
        sustancia_desinfeccion_1_nombre,
        sustancia_desinfeccion_1_cantidad_preparada,
        sustancia_desinfeccion_1_cantidad_sustancia,
        sustancia_desinfeccion_2_nombre,
        sustancia_desinfeccion_2_cantidad_preparada,
        sustancia_desinfeccion_2_cantidad_sustancia,
        realizado_por,
        observaciones
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *
    `;

    const values = [
      fecha,
      actividad_realizada,
      sustancia_limpieza_nombre,
      sustancia_limpieza_cantidad_preparada,
      sustancia_limpieza_cantidad_sustancia,
      sustancia_desinfeccion_1_nombre,
      sustancia_desinfeccion_1_cantidad_preparada,
      sustancia_desinfeccion_1_cantidad_sustancia,
      sustancia_desinfeccion_2_nombre,
      sustancia_desinfeccion_2_cantidad_preparada,
      sustancia_desinfeccion_2_cantidad_sustancia,
      realizado_por,
      observaciones || null
    ];

    const result = await pool.query(query, values);

    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (error) {
    console.error('Error al crear registro de control de lavado e inactivación:', error);
    return NextResponse.json(
      { error: 'Error al crear el registro de control de lavado e inactivación' },
      { status: 500 }
    );
  }
}
