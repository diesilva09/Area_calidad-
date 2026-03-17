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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const tableName = await resolveTasksTable();

    const result = await pool.query(`SELECT * FROM ${tableName} WHERE id = $1`, [id]);
    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Tarea de limpieza no encontrada' },
        { status: 404 }
      );
    }

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error('Error al obtener labor de limpieza:', error);
    return NextResponse.json(
      { error: 'Error al obtener la labor de limpieza' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { status, area, detalles, fecha, mes_corte } = body;

    const tableName = await resolveTasksTable();

    // Construir la consulta dinámicamente según los campos proporcionados
    let query = `UPDATE ${tableName} SET `;
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (status !== undefined) {
      updates.push(`status = $${paramIndex++}`);
      values.push(status);
    }
    if (area !== undefined) {
      updates.push(`area = $${paramIndex++}`);
      values.push(area);
    }
    if (detalles !== undefined) {
      updates.push(`detalles = $${paramIndex++}`);
      values.push(detalles);
    }
    if (fecha !== undefined) {
      updates.push(`fecha = $${paramIndex++}`);
      values.push(fecha);
    }

    // mes_corte puede no existir en algunas instalaciones; intentamos y si falla, hacemos fallback.
    if (mes_corte !== undefined) {
      updates.push(`mes_corte = $${paramIndex++}`);
      values.push(mes_corte);
    }

    if (updates.length === 0) {
      return NextResponse.json(
        { error: 'No se proporcionaron campos para actualizar' },
        { status: 400 }
      );
    }

    query += updates.join(', ') + `, updated_at = CURRENT_TIMESTAMP WHERE id = $${paramIndex} RETURNING *`;
    values.push(id);

    let result;
    try {
      result = await pool.query(query, values);
    } catch (err: any) {
      const msg = String(err?.message || '');
      if (!msg.toLowerCase().includes('mes_corte')) throw err;

      // Reintentar sin mes_corte
      const filteredUpdates: string[] = [];
      const filteredValues: any[] = [];
      let newParamIndex = 1;

      for (let i = 0; i < updates.length; i++) {
        const u = updates[i];
        if (u.startsWith('mes_corte')) continue;
        // Re-map param numbers by pushing values in order
        filteredUpdates.push(u.replace(/\$\d+/g, () => `$${newParamIndex++}`));
        filteredValues.push(values[i]);
      }

      const retryQuery = `UPDATE ${tableName} SET ${filteredUpdates.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = $${newParamIndex} RETURNING *`;
      filteredValues.push(id);
      result = await pool.query(retryQuery, filteredValues);
    }
    
    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Tarea de limpieza no encontrada' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error('Error al actualizar labor de limpieza:', error);
    return NextResponse.json(
      { error: 'Error al actualizar la labor de limpieza' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const client = await pool.connect();
  try {
    const { id } = await params;

    const tableName = await resolveTasksTable();

    await client.query('BEGIN');

    // Borrar primero el/los registro(s) padre asociados a esta tarea (si existen)
    // y sus liberaciones para evitar que queden huérfanas en el listado.
    const registrosRes = await client.query<{ id: string }>(
      `SELECT id FROM limpieza_registros WHERE cronograma_task_id = $1`,
      [Number(id)]
    );

    const registroIds = (registrosRes.rows || []).map((r) => r.id).filter(Boolean);
    if (registroIds.length > 0) {
      await client.query(
        `DELETE FROM limpieza_liberaciones WHERE registro_id = ANY($1::uuid[])`,
        [registroIds]
      );
      await client.query(
        `DELETE FROM limpieza_registros WHERE id = ANY($1::uuid[])`,
        [registroIds]
      );
    }

    // Finalmente borrar la tarea
    const result = await client.query(
      `DELETE FROM ${tableName} WHERE id = $1 RETURNING *`,
      [id]
    );

    if (result.rows.length === 0) {
      await client.query('ROLLBACK');
      return NextResponse.json(
        { error: 'Tarea de limpieza no encontrada' },
        { status: 404 }
      );
    }

    await client.query('COMMIT');
    return NextResponse.json({ message: 'Tarea de limpieza eliminada exitosamente' });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error al eliminar labor de limpieza:', error);
    return NextResponse.json(
      { error: 'Error al eliminar la labor de limpieza' },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}
