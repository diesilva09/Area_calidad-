import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { authService } from '@/lib/auth-service';

type FrequencyType = 'daily' | 'weekly' | 'monthly' | 'custom';
type FrequencyUnit = 'day' | 'week' | 'month';

function parseYmdToUtcDate(dateStr: string): Date {
  // dateStr: YYYY-MM-DD
  const [y, m, d] = dateStr.split('-').map((p) => Number(p));
  return new Date(Date.UTC(y, (m ?? 1) - 1, d ?? 1));
}

function diffInCalendarMonths(a: Date, b: Date): number {
  // Returns number of whole calendar month boundaries between a and b.
  return (b.getUTCFullYear() - a.getUTCFullYear()) * 12 + (b.getUTCMonth() - a.getUTCMonth());
}

function diffInCalendarWeeks(a: Date, b: Date): number {
  const msPerDay = 24 * 60 * 60 * 1000;
  const days = Math.floor((b.getTime() - a.getTime()) / msPerDay);
  return Math.floor(days / 7);
}

function diffInCalendarDays(a: Date, b: Date): number {
  const msPerDay = 24 * 60 * 60 * 1000;
  return Math.floor((b.getTime() - a.getTime()) / msPerDay);
}

function templateOccursOnDate(template: {
  frequency_type: FrequencyType;
  frequency_unit: FrequencyUnit | null;
  frequency_interval: number;
  start_date: string;
  end_date: string | null;
}, targetDate: string): boolean {
  const start = parseYmdToUtcDate(template.start_date);
  const target = parseYmdToUtcDate(targetDate);
  if (target.getTime() < start.getTime()) return false;
  if (template.end_date) {
    const end = parseYmdToUtcDate(template.end_date);
    if (target.getTime() > end.getTime()) return false;
  }

  const interval = Math.max(1, Number(template.frequency_interval || 1));
  const unit: FrequencyUnit =
    template.frequency_type === 'daily'
      ? 'day'
      : template.frequency_type === 'weekly'
        ? 'week'
        : template.frequency_type === 'monthly'
          ? 'month'
          : (template.frequency_unit ?? 'day');

  const diff =
    unit === 'day'
      ? diffInCalendarDays(start, target)
      : unit === 'week'
        ? diffInCalendarWeeks(start, target)
        : diffInCalendarMonths(start, target);

  return diff % interval === 0;
}

async function ensureRecurringInstancesForDate(client: any, tableName: string, dateStr: string) {
  // Best-effort: if the table doesn't exist or templates table isn't deployed yet,
  // we just skip generation.
  const templatesTableExists = await client.query(
    `SELECT to_regclass('public.limpieza_task_templates') IS NOT NULL AS ok`
  );
  if (!templatesTableExists.rows?.[0]?.ok) return;

  const templateIdColExists = await client.query(
    `SELECT EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema='public'
        AND table_name=$1
        AND column_name='template_id'
    ) AS ok`,
    [tableName]
  );
  if (!templateIdColExists.rows?.[0]?.ok) return;

  const templatesRes = await client.query(
    `
      SELECT
        id,
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
      FROM limpieza_task_templates
      WHERE active = TRUE
    `
  );

  const templates = templatesRes.rows ?? [];
  if (templates.length === 0) return;

  for (const t of templates) {
    if (!templateOccursOnDate(t, dateStr)) continue;

    // Concurrency-safe dedupe (also supported by unique index if present)
    const dedupeKey = `limpieza_tasks_template|${String(t.id)}|${String(dateStr)}`;
    await client.query('SELECT pg_advisory_xact_lock(hashtext($1))', [dedupeKey]);

    const existing = await client.query(
      `SELECT id FROM ${tableName} WHERE template_id = $1 AND fecha = $2 LIMIT 1`,
      [t.id, dateStr]
    );
    if ((existing.rows?.length ?? 0) > 0) continue;

    let taskRes;
    try {
      await client.query('SAVEPOINT sp_insert_task_with_mes_recur');
      taskRes = await client.query(
        `
          INSERT INTO ${tableName} (area, tipo_muestra, detalles, fecha, status, created_by, mes_corte, template_id)
          VALUES ($1,$2,$3,$4,'pending',$5,$6,$7)
          RETURNING *
        `,
        [t.area, t.tipo_muestra, t.detalles ?? null, dateStr, t.created_by ?? null, t.mes_corte ?? null, t.id]
      );
    } catch (err: any) {
      const msg = String(err?.message || '').toLowerCase();
      if (!msg.includes('mes_corte')) throw err;
      try {
        await client.query('ROLLBACK TO SAVEPOINT sp_insert_task_with_mes_recur');
      } catch {
        // ignore
      }
      taskRes = await client.query(
        `
          INSERT INTO ${tableName} (area, tipo_muestra, detalles, fecha, status, created_by, template_id)
          VALUES ($1,$2,$3,$4,'pending',$5,$6)
          RETURNING *
        `,
        [t.area, t.tipo_muestra, t.detalles ?? null, dateStr, t.created_by ?? null, t.id]
      );
    }

    const createdTask = taskRes.rows?.[0];
    if (createdTask?.id != null) {
      await client.query(
        `
          INSERT INTO limpieza_registros (
            fecha,
            mes_corte,
            turno,
            detalles,
            lote,
            producto,
            origin,
            generated_from_production_record_id,
            cronograma_task_id,
            status,
            created_by
          ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
        `,
        [
          dateStr,
          t.mes_corte ?? null,
          null,
          t.detalles ?? null,
          null,
          null,
          'cronograma',
          null,
          Number(createdTask.id),
          'pending',
          t.created_by ?? null,
        ]
      );
    }
  }
}

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

async function getAuthedUser(request: NextRequest) {
  const token = request.cookies.get('auth-token')?.value;
  if (!token) return null;
  return authService.validateSession(token);
}

function canManageLimpieza(role: unknown): boolean {
  const r = String(role ?? '').toLowerCase();
  return r === 'jefe' || r === 'supervisor' || r === 'operario';
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');

    const tableName = await resolveTasksTable();

    const templatesTableExistsRes = await pool.query(
      `SELECT to_regclass('public.limpieza_task_templates') IS NOT NULL AS ok`
    );
    const templatesTableExists = Boolean(templatesTableExistsRes.rows?.[0]?.ok);

    const templateIdColExistsRes = await pool.query(
      `SELECT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema='public'
          AND table_name=$1
          AND column_name='template_id'
      ) AS ok`,
      [tableName]
    );
    const templateIdColExists = Boolean(templateIdColExistsRes.rows?.[0]?.ok);

    if (date) {
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        await ensureRecurringInstancesForDate(client, tableName, date);
        await client.query('COMMIT');
      } catch (err) {
        await client.query('ROLLBACK');
        console.error('Error generando instancias recurrentes:', err);
      } finally {
        client.release();
      }
    }

    let query = `SELECT t.*`;
    if (templatesTableExists && templateIdColExists) {
      query += `, tpl.id AS recurrence_template_id`;
      query += `, tpl.active AS recurrence_active`;
      query += `, tpl.frequency_type AS recurrence_frequency_type`;
      query += `, tpl.frequency_unit AS recurrence_frequency_unit`;
      query += `, tpl.frequency_interval AS recurrence_frequency_interval`;
      query += `, tpl.start_date AS recurrence_start_date`;
      query += `, tpl.end_date AS recurrence_end_date`;
      query += `, tpl.timezone AS recurrence_timezone`;
      query += ` FROM ${tableName} t`;
      query += ` LEFT JOIN limpieza_task_templates tpl ON tpl.id = t.template_id`;
    } else {
      query += `, NULL::int AS recurrence_template_id`;
      query += `, NULL::boolean AS recurrence_active`;
      query += `, NULL::text AS recurrence_frequency_type`;
      query += `, NULL::text AS recurrence_frequency_unit`;
      query += `, NULL::int AS recurrence_frequency_interval`;
      query += `, NULL::date AS recurrence_start_date`;
      query += `, NULL::date AS recurrence_end_date`;
      query += `, NULL::text AS recurrence_timezone`;
      query += ` FROM ${tableName} t`;
    }
    let params: any[] = [];

    if (date) {
      query += ' WHERE t.fecha = $1 ORDER BY t.created_at DESC';
      params.push(date);
    } else {
      query += ' ORDER BY t.created_at DESC';
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
    const user = await getAuthedUser(request);
    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }
    if (!canManageLimpieza((user as any).role)) {
      return NextResponse.json({ error: 'No tienes permisos para crear labores de limpieza' }, { status: 403 });
    }

    const body = await request.json();
    const {
      area,
      tipo_muestra,
      detalles,
      fecha,
      status,
      created_by,
      mes_corte,
      recurrence,
    } = body;

    const tableName = await resolveTasksTable();

    if (!area || !tipo_muestra || !fecha) {
      return NextResponse.json(
        { error: 'Faltan campos obligatorios: area, tipo_muestra, fecha' },
        { status: 400 }
      );
    }

    await client.query('BEGIN');

    const templatesTableExists = await client.query(
      `SELECT to_regclass('public.limpieza_task_templates') IS NOT NULL AS ok`
    );
    const canUseTemplates = Boolean(templatesTableExists.rows?.[0]?.ok);

    const templateIdColExists = await client.query(
      `SELECT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema='public'
          AND table_name=$1
          AND column_name='template_id'
      ) AS ok`,
      [tableName]
    );
    const canUseTemplateIdCol = Boolean(templateIdColExists.rows?.[0]?.ok);

    const wantsRecurrence = Boolean(recurrence?.enabled);
    const shouldCreateTemplate = wantsRecurrence && canUseTemplates;

    let templateId: number | null = null;
    if (shouldCreateTemplate) {
      const frequencyType = (recurrence?.frequency_type ?? 'monthly') as FrequencyType;
      const frequencyUnit = (recurrence?.frequency_unit ?? null) as FrequencyUnit | null;
      const frequencyInterval = Number(recurrence?.frequency_interval ?? 1);
      const startDate = String(recurrence?.start_date ?? fecha);
      const endDate = recurrence?.end_date ? String(recurrence.end_date) : null;
      const timezone = String(recurrence?.timezone ?? 'America/Bogota');

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
          tipo_muestra,
          detalles ?? null,
          mes_corte ?? null,
          frequencyType,
          frequencyType === 'custom' ? (frequencyUnit ?? 'day') : null,
          Number.isFinite(frequencyInterval) && frequencyInterval >= 1 ? frequencyInterval : 1,
          startDate,
          endDate,
          timezone,
          created_by ?? null,
        ]
      );
      templateId = Number(tplRes.rows?.[0]?.id ?? null);
      if (Number.isNaN(templateId)) templateId = null;
    }

    const templateIdToInsert = canUseTemplateIdCol ? templateId : null;

    // Insertar la tarea. Si la columna mes_corte no existe aún en la tabla, hacemos fallback.
    let taskRes;
    try {
      await client.query('SAVEPOINT sp_insert_task_with_mes');
      const taskInsertQueryWithMes = `
        INSERT INTO ${tableName} (${canUseTemplateIdCol ? 'area, tipo_muestra, detalles, fecha, status, created_by, mes_corte, template_id' : 'area, tipo_muestra, detalles, fecha, status, created_by, mes_corte'})
        VALUES (${canUseTemplateIdCol ? '$1, $2, $3, $4, $5, $6, $7, $8' : '$1, $2, $3, $4, $5, $6, $7'})
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
        ...(canUseTemplateIdCol ? [templateIdToInsert] : []),
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
        INSERT INTO ${tableName} (${canUseTemplateIdCol ? 'area, tipo_muestra, detalles, fecha, status, created_by, template_id' : 'area, tipo_muestra, detalles, fecha, status, created_by'})
        VALUES (${canUseTemplateIdCol ? '$1, $2, $3, $4, $5, $6, $7' : '$1, $2, $3, $4, $5, $6'})
        RETURNING *
      `;
      taskRes = await client.query(taskInsertQuery, [
        area,
        tipo_muestra,
        detalles ?? null,
        fecha,
        status || 'pending',
        created_by ?? null,
        ...(canUseTemplateIdCol ? [templateIdToInsert] : []),
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
