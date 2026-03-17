import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

async function resolveTasksTable(): Promise<string> {
  const res = await pool.query<{ table_name: string }>(
    `
      SELECT CASE
        WHEN to_regclass('public.limpieza_tasks') IS NOT NULL THEN 'limpieza_tasks'
        WHEN to_regclass('public.limpienza_tasks') IS NOT NULL THEN 'limpienza_tasks'
        ELSE NULL
      END AS table_name
    `
  );

  const tableName = res.rows?.[0]?.table_name;
  if (!tableName) {
    throw new Error('No existe tabla de tareas de limpieza (limpieza_tasks/limpienza_tasks)');
  }
  return tableName;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');

    const tableName = await resolveTasksTable();

    let query = `SELECT * FROM ${tableName}`;
    let params: any[] = [];

    if (date) {
      query += ' WHERE fecha = $1 ORDER BY created_at DESC';
      params.push(date);
    } else {
      query += ' ORDER BY created_at DESC';
    }

    const result = await pool.query(query, params);
    
    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('Error al obtener labores de limpieza:', error);
    return NextResponse.json(
      { error: 'Error al obtener las labores de limpieza' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const client = await pool.connect();
  try {
    const body = await request.json();
    const { area, tipo_muestra, detalles, fecha, status, created_by, mes_corte } = body;

    const tableName = await resolveTasksTable();

    if (!area || !tipo_muestra || !fecha) {
      return NextResponse.json(
        { error: 'Faltan campos obligatorios: area, tipo_muestra, fecha' },
        { status: 400 }
      );
    }

    await client.query('BEGIN');

    // Insertar la tarea. Si la columna mes_corte no existe aún en la tabla, hacemos fallback.
    let taskRes;
    try {
      await client.query('SAVEPOINT sp_insert_task_with_mes');
      const taskInsertQueryWithMes = `
        INSERT INTO ${tableName} (area, tipo_muestra, detalles, fecha, status, created_by, mes_corte)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
      `;
      taskRes = await client.query(taskInsertQueryWithMes, [
        area,
        tipo_muestra,
        detalles ?? null,
        fecha,
        status || 'pending',
        created_by ?? null,
        mes_corte ?? null,
      ]);
    } catch (err: any) {
      const msg = String(err?.message || '');
      if (!msg.toLowerCase().includes('mes_corte')) throw err;

      // La query anterior aborta la transacción; volver al savepoint para poder continuar.
      try {
        await client.query('ROLLBACK TO SAVEPOINT sp_insert_task_with_mes');
      } catch {
        // Si por alguna razón no existe el savepoint, re-lanzar el error original.
      }

      const taskInsertQuery = `
        INSERT INTO ${tableName} (area, tipo_muestra, detalles, fecha, status, created_by)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
      `;
      taskRes = await client.query(taskInsertQuery, [
        area,
        tipo_muestra,
        detalles ?? null,
        fecha,
        status || 'pending',
        created_by ?? null,
      ]);
    }

    const createdTask = taskRes.rows[0];

    // Crear también el registro padre en limpieza_registros para que aparezca en "Registros de Limpieza".
    // Importante: NO se crean liberaciones aquí; se crean desde el modal al completar/editar.
    if (createdTask?.id != null) {
      await client.query(
        `
          INSERT INTO limpieza_registros (
            fecha,
            mes_corte,
            detalles,
            lote,
            producto,
            origin,
            generated_from_production_record_id,
            cronograma_task_id,
            status,
            created_by
          ) VALUES (
            $1,$2,$3,$4,$5,$6,$7,$8,$9,$10
          )
        `,
        [
          fecha,
          mes_corte ?? null,
          detalles ?? null,
          null,
          null,
          'cronograma',
          null,
          Number(createdTask.id),
          'pending',
          created_by ?? null,
        ]
      );
    }

    await client.query('COMMIT');

    return NextResponse.json(createdTask, { status: 201 });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error al crear labor de limpieza:', error);
    return NextResponse.json(
      { error: 'Error al crear la labor de limpieza' },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}
