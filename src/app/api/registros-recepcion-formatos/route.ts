import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';
import { getMicroTable, getPoolConfig } from '../micro-config';

const pool = new Pool(getPoolConfig());

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const fechaEntrega = searchParams.get('fecha_entrega');
    const fechaEntregaInicio = searchParams.get('fecha_entrega_inicio');
    const fechaEntregaFin = searchParams.get('fecha_entrega_fin');
    const fechaRegistros = searchParams.get('fecha_registros');
    const codigoVersion = searchParams.get('codigo_version');
    const quienEntrega = searchParams.get('quien_entrega');
    const quienRecibe = searchParams.get('quien_recibe');

    let query = `
      SELECT
        id,
        fecha_entrega,
        fecha_registros,
        codigo_version_registros,
        numero_folios,
        nombre_quien_entrega,
        nombre_quien_recibe,
        observaciones,
        created_at,
        updated_at
      FROM ${getMicroTable('registros_recepcion_formatos')}
    `;

    const params: any[] = [];
    const conditions: string[] = [];

    if (fechaEntrega) {
      conditions.push('DATE(fecha_entrega) = $' + (conditions.length + 1));
      params.push(fechaEntrega);
    }

    if (fechaEntregaInicio && fechaEntregaFin) {
      conditions.push('fecha_entrega BETWEEN $' + (conditions.length + 1) + ' AND $' + (conditions.length + 2));
      params.push(fechaEntregaInicio, fechaEntregaFin);
    }

    if (fechaRegistros) {
      conditions.push('DATE(fecha_registros) = $' + (conditions.length + 1));
      params.push(fechaRegistros);
    }

    if (codigoVersion) {
      conditions.push('codigo_version_registros ILIKE $' + (conditions.length + 1));
      params.push(`%${codigoVersion}%`);
    }

    if (quienEntrega) {
      conditions.push('nombre_quien_entrega ILIKE $' + (conditions.length + 1));
      params.push(`%${quienEntrega}%`);
    }

    if (quienRecibe) {
      conditions.push('nombre_quien_recibe ILIKE $' + (conditions.length + 1));
      params.push(`%${quienRecibe}%`);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY fecha_entrega DESC, created_at DESC';

    const result = await pool.query(query, params);

    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('Error al obtener registros de recepción de formatos:', error);
    return NextResponse.json(
      { error: 'Error al obtener los registros de recepción de formatos' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const {
      fecha_entrega,
      fecha_registros,
      codigo_version_registros,
      numero_folios,
      nombre_quien_entrega,
      nombre_quien_recibe,
      observaciones
    } = body;

    // Validación básica
    if (!fecha_entrega || !fecha_registros || !codigo_version_registros || 
        !numero_folios || !nombre_quien_entrega || !nombre_quien_recibe) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos' },
        { status: 400 }
      );
    }

    const query = `
      INSERT INTO ${getMicroTable('registros_recepcion_formatos')} (
        fecha_entrega,
        fecha_registros,
        codigo_version_registros,
        numero_folios,
        nombre_quien_entrega,
        nombre_quien_recibe,
        observaciones
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;

    const values = [
      fecha_entrega,
      fecha_registros,
      codigo_version_registros,
      numero_folios,
      nombre_quien_entrega,
      nombre_quien_recibe,
      observaciones || null
    ];

    const result = await pool.query(query, values);

    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (error) {
    console.error('Error al crear registro de recepción de formatos:', error);
    return NextResponse.json(
      { error: 'Error al crear el registro de recepción de formatos' },
      { status: 500 }
    );
  }
}
