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

  // NO agregar contraseña para evitar el error de SASL
  // Si PostgreSQL requiere contraseña, configurar en pg_hba.conf para 'trust'

  return config;
};

const pool = new Pool(getPoolConfig());

// Nombre del esquema para las tablas de microbiología
const SCHEMA = 'lab_microbiologia';

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
        hora,
        temperatura,
        humedad_relativa,
        responsable,
        observaciones,
        created_at,
        updated_at
      FROM ${SCHEMA}.condiciones_ambientales
    `;

    const params: any[] = [];
    const conditions: string[] = [];

    // Filtros
    if (fecha) {
      conditions.push('fecha = $1');
      params.push(fecha);
    } else if (fechaInicio && fechaFin) {
      conditions.push('fecha BETWEEN $1 AND $2');
      params.push(fechaInicio, fechaFin);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY fecha DESC, hora ASC';

    const result = await pool.query(query, params);

    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('Error en GET /api/condiciones-ambientales:', error);
    return NextResponse.json(
      { error: 'Error al obtener los registros de condiciones ambientales' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      fecha,
      hora,
      temperatura,
      humedad_relativa,
      responsable,
      observaciones
    } = body;

    // Validaciones básicas
    if (!fecha || !hora || !temperatura || !humedad_relativa || !responsable) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos' },
        { status: 400 }
      );
    }

    const query = `
      INSERT INTO ${SCHEMA}.condiciones_ambientales (
        fecha,
        hora,
        temperatura,
        humedad_relativa,
        responsable,
        observaciones
      ) VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;

    const values = [
      fecha,
      hora,
      temperatura,
      humedad_relativa,
      responsable,
      observaciones || null
    ];

    const result = await pool.query(query, values);

    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (error) {
    console.error('Error en POST /api/condiciones-ambientales:', error);
    return NextResponse.json(
      { error: 'Error al crear el registro de condiciones ambientales' },
      { status: 500 }
    );
  }
}
