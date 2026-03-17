import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');

    let query = 'SELECT * FROM verificacion_bpm.bpm_verifications';
    const params: any[] = [];

    if (date) {
      query += ' WHERE fecha = $1 ORDER BY created_at DESC';
      params.push(date);
    } else {
      query += ' ORDER BY created_at DESC';
    }

    const result = await pool.query(query, params);
    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('Error al obtener verificaciones BPM:', error);
    return NextResponse.json(
      { error: 'Error al obtener las verificaciones BPM' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      fecha,
      cedula,
      nombre,
      area,
      req_uniforme,
      req_unas,
      req_sin_joyas,
      req_sin_cabellos,
      req_barba,
      req_manos,
      req_guantes,
      req_petos_botas,
      req_epp,
      req_no_accesorios,
      turno,
      observaciones,
      correccion,
      firma_empleado,
      responsable,
      created_by,
    } = body;

    if (!fecha || !cedula || !nombre || !area || !turno || !responsable) {
      return NextResponse.json(
        { error: 'Faltan campos obligatorios' },
        { status: 400 }
      );
    }

    const query = `
      INSERT INTO verificacion_bpm.bpm_verifications (
        fecha,
        cedula,
        nombre,
        area,
        req_uniforme,
        req_unas,
        req_sin_joyas,
        req_sin_cabellos,
        req_barba,
        req_manos,
        req_guantes,
        req_petos_botas,
        req_epp,
        req_no_accesorios,
        turno,
        observaciones,
        correccion,
        firma_empleado,
        responsable,
        created_by
      ) VALUES (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20
      ) RETURNING *
    `;

    const params = [
      fecha,
      cedula,
      nombre,
      area,
      req_uniforme,
      req_unas,
      req_sin_joyas,
      req_sin_cabellos,
      req_barba,
      req_manos,
      req_guantes,
      req_petos_botas,
      req_epp,
      req_no_accesorios,
      turno,
      observaciones ?? null,
      correccion ?? null,
      firma_empleado ?? null,
      responsable,
      created_by ?? null,
    ];

    const result = await pool.query(query, params);
    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (error) {
    console.error('Error al crear verificación BPM:', error);
    return NextResponse.json(
      { error: 'Error al crear la verificación BPM' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID es requerido para actualizar' }, { status: 400 });
    }

    const {
      fecha,
      cedula,
      nombre,
      area,
      req_uniforme,
      req_unas,
      req_sin_joyas,
      req_sin_cabellos,
      req_barba,
      req_manos,
      req_guantes,
      req_petos_botas,
      req_epp,
      req_no_accesorios,
      turno,
      observaciones,
      correccion,
      firma_empleado,
      responsable,
    } = body;

    if (!fecha || !cedula || !nombre || !area || !turno || !responsable) {
      return NextResponse.json(
        { error: 'Faltan campos obligatorios' },
        { status: 400 }
      );
    }

    const query = `
      UPDATE verificacion_bpm.bpm_verifications SET
        fecha = $1,
        cedula = $2,
        nombre = $3,
        area = $4,
        req_uniforme = $5,
        req_unas = $6,
        req_sin_joyas = $7,
        req_sin_cabellos = $8,
        req_barba = $9,
        req_manos = $10,
        req_guantes = $11,
        req_petos_botas = $12,
        req_epp = $13,
        req_no_accesorios = $14,
        turno = $15,
        observaciones = $16,
        correccion = $17,
        firma_empleado = $18,
        responsable = $19,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $20
      RETURNING *
    `;

    const params = [
      fecha,
      cedula,
      nombre,
      area,
      req_uniforme,
      req_unas,
      req_sin_joyas,
      req_sin_cabellos,
      req_barba,
      req_manos,
      req_guantes,
      req_petos_botas,
      req_epp,
      req_no_accesorios,
      turno,
      observaciones ?? null,
      correccion ?? null,
      firma_empleado ?? null,
      responsable,
      Number(id),
    ];

    const result = await pool.query(query, params);

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Verificación BPM no encontrada' },
        { status: 404 }
      );
    }

    return NextResponse.json(result.rows[0], { status: 200 });
  } catch (error) {
    console.error('Error al actualizar verificación BPM:', error);
    return NextResponse.json(
      { error: 'Error al actualizar la verificación BPM' },
      { status: 500 }
    );
  }
}
