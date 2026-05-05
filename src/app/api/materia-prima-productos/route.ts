import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

// GET - Obtener todos los productos de materia prima
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');

    let query = `
      SELECT id, nombre, created_at, updated_at
      FROM lab_microbiologia.materia_prima_productos
    `;
    const params: any[] = [];

    if (search) {
      query += ` WHERE nombre ILIKE $1`;
      params.push(`%${search}%`);
    }

    query += ` ORDER BY nombre ASC`;

    const result = await pool.query(query, params);

    return NextResponse.json(result.rows, { status: 200 });
  } catch (error) {
    console.error('Error al obtener productos de materia prima:', error);
    return NextResponse.json(
      { error: 'Error al obtener productos de materia prima' },
      { status: 500 }
    );
  }
}
