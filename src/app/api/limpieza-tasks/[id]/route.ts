import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

type FrequencyType = 'daily' | 'weekly' | 'monthly' | 'custom';
type FrequencyUnit = 'day' | 'week' | 'month';

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
  const client = await pool.connect();
  try {
    const { id } = await params;
    const body = await request.json();
    const { status, area, detalles, fecha, mes_corte, recurrence } = body;

    const tableName = await resolveTasksTable();

    const templateIdColExistsRes = await client.query(
      `SELECT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema='public'
          AND table_name=$1
          AND column_name='template_id'
      ) AS ok`,
      [tableName]
    );
    const canUseTemplateIdCol = Boolean(templateIdColExistsRes.rows?.[0]?.ok);

    await client.query('BEGIN');

    const currentRes = await client.query<{ id: number; template_id?: number | null }>(
      canUseTemplateIdCol
        ? `SELECT id, template_id FROM ${tableName} WHERE id = $1`
        : `SELECT id FROM ${tableName} WHERE id = $1`,
      [id]
    );
    if (currentRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return NextResponse.json(
        { error: 'Tarea de limpieza no encontrada' },
        { status: 404 }
      );
    }

    const templatesTableExists = await client.query(
      `SELECT to_regclass('public.limpieza_task_templates') IS NOT NULL AS ok`
    );
    const canUseTemplates = Boolean(templatesTableExists.rows?.[0]?.ok);

    let templateIdToSet: number | null | undefined = undefined;

    if (recurrence && canUseTemplates && canUseTemplateIdCol) {
      const existingTemplateId = (currentRes.rows[0] as any)?.template_id ?? null;
      const wantsRecurrence = Boolean(recurrence?.enabled);

      if (!wantsRecurrence) {
        if (existingTemplateId != null) {
          await client.query('UPDATE limpieza_task_templates SET active = FALSE, updated_at = CURRENT_TIMESTAMP WHERE id = $1', [
            existingTemplateId,
          ]);
        }
      } else {
        const frequencyType = (recurrence?.frequency_type ?? 'monthly') as FrequencyType;
        const frequencyUnit = (recurrence?.frequency_unit ?? null) as FrequencyUnit | null;
        const frequencyInterval = Number(recurrence?.frequency_interval ?? 1);
        const startDate = String(recurrence?.start_date ?? fecha);
        const endDate = recurrence?.end_date ? String(recurrence.end_date) : null;
        const timezone = String(recurrence?.timezone ?? 'America/Bogota');

        if (existingTemplateId == null) {
          const tplRes = await client.query(
            `
              INSERT INTO limpieza_task_templates (
                area,
                tipo_muestra,
                detalles,
                mes_corte,
                frequency_type,
                frequency_unit,
                frequency_interval,
                start_date,
                end_date,
                timezone,
                active,
                created_by
              ) VALUES (
                $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,TRUE,$11
              )
              RETURNING id
            `,
            [
              area,
              body?.tipo_muestra,
              detalles ?? null,
              mes_corte ?? null,
              frequencyType,
              frequencyType === 'custom' ? (frequencyUnit ?? 'day') : null,
              Number.isFinite(frequencyInterval) && frequencyInterval >= 1 ? frequencyInterval : 1,
              startDate,
              endDate,
              timezone,
              body?.created_by ?? null,
            ]
          );
          const newId = Number(tplRes.rows?.[0]?.id ?? null);
          templateIdToSet = Number.isNaN(newId) ? null : newId;
        } else {
          await client.query(
            `
              UPDATE limpieza_task_templates
              SET
                area = COALESCE($1, area),
                tipo_muestra = COALESCE($2, tipo_muestra),
                detalles = $3,
                mes_corte = $4,
                frequency_type = $5,
                frequency_unit = $6,
                frequency_interval = $7,
                start_date = $8,
                end_date = $9,
                timezone = $10,
                active = TRUE,
                updated_at = CURRENT_TIMESTAMP
              WHERE id = $11
            `,
            [
              area ?? null,
              body?.tipo_muestra ?? null,
              detalles ?? null,
              mes_corte ?? null,
              frequencyType,
              frequencyType === 'custom' ? (frequencyUnit ?? 'day') : null,
              Number.isFinite(frequencyInterval) && frequencyInterval >= 1 ? frequencyInterval : 1,
              startDate,
              endDate,
              timezone,
              existingTemplateId,
            ]
          );
        }
      }
    }

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

    if (templateIdToSet !== undefined) {
      if (canUseTemplateIdCol) {
        updates.push(`template_id = $${paramIndex++}`);
        values.push(templateIdToSet);
      }
    }

    if (updates.length === 0) {
      await client.query('ROLLBACK');
      return NextResponse.json(
        { error: 'No se proporcionaron campos para actualizar' },
        { status: 400 }
      );
    }

    query += updates.join(', ') + `, updated_at = CURRENT_TIMESTAMP WHERE id = $${paramIndex} RETURNING *`;
    values.push(id);

    let result;
    await client.query('SAVEPOINT limpieza_tasks_update');
    try {
      result = await client.query(query, values);
      await client.query('RELEASE SAVEPOINT limpieza_tasks_update');
    } catch (err: any) {
      const msg = String(err?.message || '');
      if (!msg.toLowerCase().includes('mes_corte')) throw err;

      // La transacción queda en estado abortado luego de un error; volvemos al SAVEPOINT antes de reintentar.
      await client.query('ROLLBACK TO SAVEPOINT limpieza_tasks_update');

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
      result = await client.query(retryQuery, filteredValues);

      await client.query('RELEASE SAVEPOINT limpieza_tasks_update');
    }

    await client.query('COMMIT');
    return NextResponse.json(result.rows[0]);
  } catch (error) {
    try {
      await client.query('ROLLBACK');
    } catch (rollbackError) {
      console.error('Error haciendo ROLLBACK en limpieza-tasks PUT:', rollbackError);
    }

    console.error('Error al actualizar labor de limpieza:', error);

    const errAny = error as any;
    const detail = error instanceof Error ? error.message : String(error);
    const code = typeof errAny?.code === 'string' ? errAny.code : undefined;
    return NextResponse.json(
      {
        error: 'Error al actualizar la labor de limpieza',
        ...(process.env.NODE_ENV !== 'production' ? { detail, code } : {}),
      },
      { status: 500 }
    );
  } finally {
    client.release();
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
