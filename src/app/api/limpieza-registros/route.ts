import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { authService } from '@/lib/auth-service';

// Función para obtener usuario autenticado
async function getAuthedUser(request: NextRequest) {
  const token = request.cookies.get('auth-token')?.value;
  if (!token) return null;
  return authService.validateSession(token);
}

function canManageLimpieza(role: unknown): boolean {
  const r = String(role ?? '').toLowerCase();
  return r === 'jefe' || r === 'supervisor' || r === 'operario';
}

type LimpiezaRegistroStatus = 'pending' | 'completed';

type LimpiezaRegistroRow = {
  id: string;
  fecha: string;
  mes_corte: string | null;
  turno: string | null;
  detalles: string | null;
  lote: string | null;
  producto: string | null;
  origin: 'manual' | 'produccion' | 'cronograma' | null;
  generated_from_production_record_id: string | null;
  cronograma_task_id?: number | null;
  status: LimpiezaRegistroStatus;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
};

type LimpiezaLiberacionRow = {
  id: string;
  registro_id: string;
  hora: string | null;
  tipo_verificacion: string | null;
  linea: string | null;
  superficie: string | null;
  estado_filtro: number | null;
  novedades_filtro: string | null;
  correcciones_filtro: string | null;
  presencia_elementos_extranos: string | null;
  detalle_elementos_extranos: string | null;
  resultados_atp_ri: string | null;
  resultados_atp_ac: string | null;
  resultados_atp_rf: string | null;
  lote_hisopo_atp: string | null;
  observacion_atp: string | null;
  equipo_atp: string | null;
  parte_atp: string | null;
  deteccion_alergenos_ri: string | null;
  deteccion_alergenos_ac: string | null;
  deteccion_alergenos_rf: string | null;
  lote_hisopo_alergenos: string | null;
  observacion_alergenos: string | null;
  equipo_alergenos: string | null;
  parte_alergenos: string | null;
  detergente: string | null;
  desinfectante: string | null;
  verificacion_visual: number | null;
  observacion_visual: string | null;
  verificado_por: string | null;
  responsable_produccion: string | null;
  responsable_mantenimiento: string | null;
  status: LimpiezaRegistroStatus;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
};

async function recalcRegistroStatus(client: any, registroId: string): Promise<LimpiezaRegistroStatus> {
  const result = await client.query(
    `
      WITH stats AS (
        SELECT
          COUNT(*)::int AS total,
          COUNT(*) FILTER (WHERE status = 'completed')::int AS completed
        FROM limpieza_liberaciones
        WHERE registro_id = $1
      )
      UPDATE limpieza_registros r
      SET status = CASE
        WHEN (SELECT total FROM stats) > 0 AND (SELECT completed FROM stats) = (SELECT total FROM stats) THEN 'completed'
        ELSE 'pending'
      END,
      updated_at = CURRENT_TIMESTAMP
      WHERE r.id = $1
      RETURNING r.status;
    `,
    [registroId]
  );

  return (result.rows?.[0]?.status ?? 'pending') as LimpiezaRegistroStatus;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const date = searchParams.get('date');
    const cronogramaTaskIdParam = searchParams.get('cronogramaTaskId');
    const cronogramaTaskIdsParam = searchParams.get('cronogramaTaskIds');

    if (id) {
      const registroRes = await pool.query<LimpiezaRegistroRow>('SELECT * FROM limpieza_registros WHERE id = $1', [id]);
      if (registroRes.rows.length === 0) {
        return NextResponse.json({ error: 'Registro no encontrado' }, { status: 404 });
      }

      const liberacionesRes = await pool.query<LimpiezaLiberacionRow>(
        'SELECT * FROM limpieza_liberaciones WHERE registro_id = $1 ORDER BY created_at ASC',
        [id]
      );

      return NextResponse.json({
        ...registroRes.rows[0],
        liberaciones: liberacionesRes.rows,
      });
    }

    if (date) {
      const registrosRes = await pool.query<LimpiezaRegistroRow>(
        'SELECT * FROM limpieza_registros WHERE fecha = $1 ORDER BY created_at DESC',
        [date]
      );
      return NextResponse.json(registrosRes.rows);
    }

    if (cronogramaTaskIdParam) {
      const cronogramaTaskId = Number(cronogramaTaskIdParam);
      if (Number.isNaN(cronogramaTaskId)) {
        return NextResponse.json({ error: 'cronogramaTaskId inválido' }, { status: 400 });
      }

      const registroRes = await pool.query<LimpiezaRegistroRow>(
        'SELECT * FROM limpieza_registros WHERE cronograma_task_id = $1 ORDER BY created_at DESC LIMIT 1',
        [cronogramaTaskId]
      );

      if (registroRes.rows.length === 0) {
        return NextResponse.json({ error: 'Registro no encontrado' }, { status: 404 });
      }

      return NextResponse.json(registroRes.rows[0]);
    }

    if (cronogramaTaskIdsParam) {
      const ids = cronogramaTaskIdsParam
        .split(',')
        .map((v) => Number(String(v).trim()))
        .filter((n) => Number.isFinite(n) && !Number.isNaN(n));

      if (ids.length === 0) {
        return NextResponse.json({ error: 'cronogramaTaskIds inválido' }, { status: 400 });
      }

      const registrosRes = await pool.query<LimpiezaRegistroRow>(
        `
          SELECT DISTINCT ON (cronograma_task_id)
            *
          FROM limpieza_registros
          WHERE cronograma_task_id = ANY($1::int[])
          ORDER BY cronograma_task_id, created_at DESC
        `,
        [ids]
      );

      return NextResponse.json(registrosRes.rows);
    }

    const registrosRes = await pool.query<LimpiezaRegistroRow>('SELECT * FROM limpieza_registros ORDER BY created_at DESC');

    // Incluir liberaciones para cada registro para permitir búsqueda en frontend
    const registrosWithLiberaciones = await Promise.all(
      registrosRes.rows.map(async (registro) => {
        const liberacionesRes = await pool.query<LimpiezaLiberacionRow>(
          'SELECT * FROM limpieza_liberaciones WHERE registro_id = $1 ORDER BY created_at ASC',
          [registro.id]
        );
        return {
          ...registro,
          liberaciones: liberacionesRes.rows,
        };
      })
    );

    return NextResponse.json(registrosWithLiberaciones);
  } catch (error) {
    console.error('Error al obtener registros de limpieza:', error);
    return NextResponse.json({ error: 'Error al obtener registros de limpieza' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const client = await pool.connect();
  try {
    const body = await request.json();

    // Obtener usuario autenticado
    const user = await getAuthedUser(request);
    const userName = user?.name || user?.email || 'Usuario desconocido';

    const {
      fecha,
      mes_corte,
      mesCorte,
      turno,
      detalles,
      lote,
      producto,
      origin,
      generated_from_production_record_id,
      generatedFromProductionRecordId,
      cronograma_task_id,
      cronogramaTaskId,
      created_by,
      createdBy,
      liberaciones,
    } = body ?? {};

    const cronogramaTaskIdFinal =
      cronograma_task_id ?? cronogramaTaskId ?? null;

    const originFinal = (() => {
      if (cronogramaTaskIdFinal != null) {
        return (origin ?? 'cronograma') as 'manual' | 'produccion' | 'cronograma';
      }

      if (origin === 'cronograma') {
        return 'manual';
      }

      return (origin ??
        (generated_from_production_record_id || generatedFromProductionRecordId
          ? 'produccion'
          : 'manual')) as 'manual' | 'produccion' | 'cronograma';
    })();

    if (!fecha) {
      return NextResponse.json({ error: 'fecha es requerida' }, { status: 400 });
    }

    await client.query('BEGIN');

    const generatedFromProductionIdFinal =
      generated_from_production_record_id ?? generatedFromProductionRecordId ?? null;

    if (generatedFromProductionIdFinal) {
      const dedupeKey = `limpieza_registros|produccion|${String(generatedFromProductionIdFinal)}`;
      await client.query('SELECT pg_advisory_xact_lock(hashtext($1))', [dedupeKey]);
    }

    let registro: LimpiezaRegistroRow;
    const shouldReuseByCronograma = cronogramaTaskIdFinal != null;
    if (shouldReuseByCronograma) {
      const existingRes = await client.query<LimpiezaRegistroRow>(
        'SELECT * FROM limpieza_registros WHERE cronograma_task_id = $1 ORDER BY created_at DESC LIMIT 1',
        [cronogramaTaskIdFinal]
      );

      if (existingRes.rows.length > 0) {
        registro = existingRes.rows[0];
      } else {
        const registroInsert = await client.query<LimpiezaRegistroRow>(
          `
            INSERT INTO limpieza_registros (
              fecha, mes_corte, turno, detalles, lote, producto,
              origin, generated_from_production_record_id,
              cronograma_task_id,
              status, created_by
            ) VALUES (
              $1, $2, $3, $4, $5, $6,
              $7, $8,
              $9,
              'pending', $10
            )
            RETURNING *;
          `,
          [
            fecha,
            mes_corte ?? mesCorte ?? null,
            turno ?? null,
            detalles ?? null,
            lote ?? null,
            producto ?? null,
            originFinal,
            generated_from_production_record_id ?? generatedFromProductionRecordId ?? null,
            cronogramaTaskIdFinal,
            userName,
          ]
        );

        registro = registroInsert.rows[0];
      }
    } else {
      // Dedupe: si es generado desde producción, reusar el registro existente si ya existe
      if (originFinal === 'produccion' && generatedFromProductionIdFinal) {
        const existingRes = await client.query<LimpiezaRegistroRow>(
          `SELECT *
           FROM limpieza_registros
           WHERE origin = 'produccion'
             AND generated_from_production_record_id = $1
           ORDER BY created_at DESC
           LIMIT 1`,
          [generatedFromProductionIdFinal]
        );

        if (existingRes.rows.length > 0) {
          registro = existingRes.rows[0];
        } else {
          const registroInsert = await client.query<LimpiezaRegistroRow>(
            `
              INSERT INTO limpieza_registros (
                fecha, mes_corte, turno, detalles, lote, producto,
                origin, generated_from_production_record_id,
                cronograma_task_id,
                status, created_by
              ) VALUES (
                $1, $2, $3, $4, $5, $6,
                $7, $8,
                $9,
                'pending', $10
              )
              RETURNING *;
            `,
            [
              fecha,
              mes_corte ?? mesCorte ?? null,
              turno ?? null,
              detalles ?? null,
              lote ?? null,
              producto ?? null,
              originFinal,
              generatedFromProductionIdFinal,
              cronogramaTaskIdFinal,
              userName,
            ]
          );

          registro = registroInsert.rows[0];
        }
      } else {
        const registroInsert = await client.query<LimpiezaRegistroRow>(
          `
            INSERT INTO limpieza_registros (
              fecha, mes_corte, turno, detalles, lote, producto,
              origin, generated_from_production_record_id,
              cronograma_task_id,
              status, created_by
            ) VALUES (
              $1, $2, $3, $4, $5, $6,
              $7, $8,
              $9,
              'pending', $10
            )
            RETURNING *;
          `,
          [
            fecha,
            mes_corte ?? mesCorte ?? null,
            turno ?? null,
            detalles ?? null,
            lote ?? null,
            producto ?? null,
            originFinal,
            generatedFromProductionIdFinal,
            cronogramaTaskIdFinal,
            userName,
          ]
        );

        registro = registroInsert.rows[0];
      }
    }

    let insertedLiberaciones: LimpiezaLiberacionRow[] = [];
    if (Array.isArray(liberaciones) && liberaciones.length > 0) {
      for (const lib of liberaciones) {
        const libRes = await client.query<LimpiezaLiberacionRow>(
          `
            INSERT INTO limpieza_liberaciones (
              registro_id,
              hora,
              tipo_verificacion,
              linea,
              superficie,
              estado_filtro,
              novedades_filtro,
              correcciones_filtro,
              presencia_elementos_extranos,
              detalle_elementos_extranos,
              resultados_atp_ri,
              resultados_atp_ac,
              resultados_atp_rf,
              lote_hisopo_atp,
              observacion_atp,
              equipo_atp,
              parte_atp,
              deteccion_alergenos_ri,
              deteccion_alergenos_ac,
              deteccion_alergenos_rf,
              lote_hisopo_alergenos,
              observacion_alergenos,
              equipo_alergenos,
              parte_alergenos,
              detergente,
              desinfectante,
              verificacion_visual,
              observacion_visual,
              verificado_por,
              responsable_produccion,
              responsable_mantenimiento,
              status,
              created_by
            ) VALUES (
              $1,
              $2,$3,$4,$5,$6,$7,$8,$9,$10,
              $11,$12,$13,$14,$15,$16,$17,$18,$19,$20,
              $21,$22,$23,$24,$25,$26,$27,$28,$29,$30,
              $31,$32,$33
            )
            RETURNING *;
          `,
          [
            registro.id,
            lib?.hora ?? null,
            lib?.tipo_verificacion ?? lib?.tipoVerificacion ?? null,
            lib?.linea ?? null,
            lib?.superficie ?? null,
            lib?.estado_filtro ?? lib?.estadoFiltro ?? null,
            lib?.novedades_filtro ?? lib?.novedadesFiltro ?? null,
            lib?.correcciones_filtro ?? lib?.correccionesFiltro ?? null,
            lib?.presencia_elementos_extranos ?? lib?.presenciaElementosExtranos ?? null,
            lib?.detalle_elementos_extranos ?? lib?.detalleElementosExtranos ?? null,
            lib?.resultados_atp_ri ?? lib?.resultadosAtpRi ?? null,
            lib?.resultados_atp_ac ?? lib?.resultadosAtpAc ?? null,
            lib?.resultados_atp_rf ?? lib?.resultadosAtpRf ?? null,
            lib?.lote_hisopo_atp ?? lib?.loteHisopoAtp ?? null,
            lib?.observacion_atp ?? lib?.observacionAtp ?? null,
            lib?.equipo_atp ?? lib?.equipoAtp ?? null,
            lib?.parte_atp ?? lib?.parteAtp ?? null,
            lib?.deteccion_alergenos_ri ?? lib?.deteccionAlergenosRi ?? null,
            lib?.deteccion_alergenos_ac ?? lib?.deteccionAlergenosAc ?? null,
            lib?.deteccion_alergenos_rf ?? lib?.deteccionAlergenosRf ?? null,
            lib?.lote_hisopo_alergenos ?? lib?.loteHisopoAlergenos ?? null,
            lib?.observacion_alergenos ?? lib?.observacionAlergenos ?? null,
            lib?.equipo_alergenos ?? lib?.equipoAlergenos ?? null,
            lib?.parte_alergenos ?? lib?.parteAlergenos ?? null,
            lib?.detergente ?? null,
            lib?.desinfectante ?? null,
            lib?.verificacion_visual ?? lib?.verificacionVisual ?? null,
            lib?.observacion_visual ?? lib?.observacionVisual ?? null,
            lib?.verificado_por ?? lib?.verificadoPor ?? null,
            lib?.responsable_produccion ?? lib?.responsableProduccion ?? null,
            lib?.responsable_mantenimiento ?? lib?.responsableMantenimiento ?? null,
            (lib?.status ?? 'pending') as LimpiezaRegistroStatus,
            lib?.created_by ?? lib?.createdBy ?? null,
          ]
        );

        insertedLiberaciones.push(libRes.rows[0]);
      }
    }

    const parentStatus = await recalcRegistroStatus(client, registro.id);

    await client.query('COMMIT');

    return NextResponse.json(
      {
        ...registro,
        status: parentStatus,
        liberaciones: insertedLiberaciones,
      },
      { status: 201 }
    );
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error al crear registro de limpieza:', error);
    return NextResponse.json(
      {
        error: 'Error al crear el registro de limpieza',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();

    // Obtener usuario autenticado
    const user = await getAuthedUser(request);
    const userName = user?.name || user?.email || 'Usuario desconocido';

    const {
      id,
      fecha,
      mes_corte,
      mesCorte,
      turno,
      detalles,
      lote,
      producto,
      updated_by,
      updatedBy,
    } = body ?? {};

    console.log('📥 PUT /api/limpieza-registros - Body recibido:', body);
    console.log('  id:', id);
    console.log('  fecha:', fecha);
    console.log('  mes_corte:', mes_corte);
    console.log('  detalles:', detalles);

    if (!id) {
      return NextResponse.json({ error: 'id es requerido' }, { status: 400 });
    }

    const currentStatusRes = await pool.query<{ status: LimpiezaRegistroStatus }>(
      'SELECT status FROM limpieza_registros WHERE id = $1',
      [id]
    );

    if (currentStatusRes.rows.length === 0) {
      return NextResponse.json({ error: 'Registro no encontrado' }, { status: 404 });
    }

    if (currentStatusRes.rows[0].status === 'completed') {
      return NextResponse.json(
        { error: 'No se puede editar un registro completado' },
        { status: 409 }
      );
    }

    const updates: string[] = [];
    const values: any[] = [];
    let idx = 1;

    if (fecha !== undefined) {
      updates.push(`fecha = $${idx++}`);
      values.push(fecha);
    }
    if (mes_corte !== undefined || mesCorte !== undefined) {
      updates.push(`mes_corte = $${idx++}`);
      values.push(mes_corte ?? mesCorte ?? null);
    }
    if (detalles !== undefined) {
      updates.push(`detalles = $${idx++}`);
      values.push(detalles ?? null);
    }
    if (turno !== undefined) {
      updates.push(`turno = $${idx++}`);
      values.push(turno ?? null);
    }
    if (lote !== undefined) {
      updates.push(`lote = $${idx++}`);
      values.push(lote ?? null);
    }
    if (producto !== undefined) {
      updates.push(`producto = $${idx++}`);
      values.push(producto ?? null);
    }
    if (updated_by !== undefined || updatedBy !== undefined) {
      updates.push(`updated_by = $${idx++}`);
      values.push(updated_by ?? updatedBy ?? userName);
    } else {
      // Siempre actualizar updated_by con el usuario actual
      updates.push(`updated_by = $${idx++}`);
      values.push(userName);
    }

    if (updates.length === 0) {
      return NextResponse.json({ error: 'No se proporcionaron campos para actualizar' }, { status: 400 });
    }

    values.push(id);
    const result = await pool.query<LimpiezaRegistroRow>(
      `UPDATE limpieza_registros SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = $${idx} RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Registro no encontrado' }, { status: 404 });
    }

    console.log('✅ Registro actualizado exitosamente:', result.rows[0]);
    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error('❌ Error al actualizar registro de limpieza:', error);
    return NextResponse.json({ error: 'Error al actualizar registro de limpieza' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await getAuthedUser(request);
    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }
    if (!canManageLimpieza((user as any).role)) {
      return NextResponse.json({ error: 'No tienes permisos para eliminar registros de limpieza' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'id es requerido' }, { status: 400 });
    }

    const result = await pool.query('DELETE FROM limpieza_registros WHERE id = $1 RETURNING id', [id]);

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Registro no encontrado' }, { status: 404 });
    }

    return NextResponse.json({ deleted: true, id });
  } catch (error) {
    console.error('Error al eliminar registro de limpieza:', error);
    return NextResponse.json({ error: 'Error al eliminar registro de limpieza' }, { status: 500 });
  }
}
