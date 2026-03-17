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

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const tableName = await resolveTasksTable();

    // Obtener la tarea actual
    const currentTask = await pool.query(
      `SELECT status FROM ${tableName} WHERE id = $1`,
      [id]
    );

    if (currentTask.rows.length === 0) {
      return NextResponse.json(
        { error: 'Tarea de limpieza no encontrada' },
        { status: 404 }
      );
    }

    // Cambiar el estado
    const newStatus = currentTask.rows[0].status === 'pending' ? 'completed' : 'pending';

    // Actualizar la tarea
    const result = await pool.query(
      `UPDATE ${tableName} SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *`,
      [newStatus, id]
    );

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error('Error al cambiar estado de la tarea de limpieza:', error);
    return NextResponse.json(
      { error: 'Error al cambiar el estado de la tarea de limpieza' },
      { status: 500 }
    );
  }
}
