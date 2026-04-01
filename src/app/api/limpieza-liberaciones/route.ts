import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

type LimpiezaStatus = 'pending' | 'completed';

type LimpiezaLiberacionRow = {
  id: string;
  registro_id: string;
  status: LimpiezaStatus;
};

async function recalcRegistroStatus(client: any, registroId: string): Promise<LimpiezaStatus> {
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

  return (result.rows?.[0]?.status ?? 'pending') as LimpiezaStatus;
}

// Upsert de liberación (si viene id, update; si no, insert). Siempre recalcula status del padre.
export async function POST(request: NextRequest) {
  const client = await pool.connect();
  try {
    const body = await request.json();

    const {
      id,
      registro_id,
      registroId,
      status,
      ...rest
    } = body ?? {};

    const parentId = (registro_id ?? registroId) as string | undefined;
    if (!parentId) {
      return NextResponse.json({ error: 'registro_id es requerido' }, { status: 400 });
    }

    const s255 = (value: any) => {
      if (value === undefined || value === null) return null;
      if (typeof value !== 'string') return value;
      return value.length > 255 ? value.slice(0, 255) : value;
    };

    await client.query('BEGIN');

    let liberacion: LimpiezaLiberacionRow | null = null;

    if (id) {
      const hasEstadoFiltro = Object.prototype.hasOwnProperty.call(rest ?? {}, 'estado_filtro') ||
        Object.prototype.hasOwnProperty.call(rest ?? {}, 'estadoFiltro');
      const hasNovedadesFiltro = Object.prototype.hasOwnProperty.call(rest ?? {}, 'novedades_filtro') ||
        Object.prototype.hasOwnProperty.call(rest ?? {}, 'novedadesFiltro');
      const hasCorreccionesFiltro = Object.prototype.hasOwnProperty.call(rest ?? {}, 'correcciones_filtro') ||
        Object.prototype.hasOwnProperty.call(rest ?? {}, 'correccionesFiltro');

      const estadoFiltroValue = hasEstadoFiltro ? (rest?.estado_filtro ?? rest?.estadoFiltro ?? null) : undefined;
      const novedadesFiltroValue = hasNovedadesFiltro
        ? (rest?.novedades_filtro ?? rest?.novedadesFiltro ?? null)
        : undefined;
      const correccionesFiltroValue = hasCorreccionesFiltro
        ? (rest?.correcciones_filtro ?? rest?.correccionesFiltro ?? null)
        : undefined;

      const currentStatusRes = await client.query<{ status: LimpiezaStatus }>(
        'SELECT status FROM limpieza_liberaciones WHERE id = $1',
        [id]
      );

      if (currentStatusRes.rows.length === 0) {
        await client.query('ROLLBACK');
        return NextResponse.json({ error: 'Liberación no encontrada' }, { status: 404 });
      }

      if (currentStatusRes.rows[0].status === 'completed') {
        await client.query('ROLLBACK');
        return NextResponse.json(
          { error: 'No se puede editar una liberación completada' },
          { status: 409 }
        );
      }

      const updateRes = await client.query<LimpiezaLiberacionRow>(
        `
          UPDATE limpieza_liberaciones
          SET
            hora = COALESCE($2, hora),
            tipo_verificacion = COALESCE($3, tipo_verificacion),
            linea = COALESCE($4, linea),
            superficie = COALESCE($5, superficie),
            estado_filtro = CASE WHEN $6 THEN $7 ELSE estado_filtro END,
            novedades_filtro = CASE WHEN $8 THEN $9 ELSE novedades_filtro END,
            correcciones_filtro = CASE WHEN $10 THEN $11 ELSE correcciones_filtro END,
            presencia_elementos_extranos = COALESCE($12, presencia_elementos_extranos),
            detalle_elementos_extranos = COALESCE($13, detalle_elementos_extranos),
            resultados_atp_ri = COALESCE($14, resultados_atp_ri),
            resultados_atp_ac = COALESCE($15, resultados_atp_ac),
            resultados_atp_rf = COALESCE($16, resultados_atp_rf),
            lote_hisopo_atp = COALESCE($17, lote_hisopo_atp),
            observacion_atp = COALESCE($18, observacion_atp),
            equipo_atp = COALESCE($19, equipo_atp),
            parte_atp = COALESCE($20, parte_atp),
            deteccion_alergenos_ri = COALESCE($21, deteccion_alergenos_ri),
            deteccion_alergenos_ac = COALESCE($22, deteccion_alergenos_ac),
            deteccion_alergenos_rf = COALESCE($23, deteccion_alergenos_rf),
            lote_hisopo_alergenos = COALESCE($24, lote_hisopo_alergenos),
            observacion_alergenos = COALESCE($25, observacion_alergenos),
            equipo_alergenos = COALESCE($26, equipo_alergenos),
            parte_alergenos = COALESCE($27, parte_alergenos),
            detergente = COALESCE($28, detergente),
            desinfectante = COALESCE($29, desinfectante),
            verificacion_visual = COALESCE($30, verificacion_visual),
            observacion_visual = COALESCE($31, observacion_visual),
            verificado_por = COALESCE($32, verificado_por),
            responsable_produccion = COALESCE($33, responsable_produccion),
            responsable_mantenimiento = COALESCE($34, responsable_mantenimiento),
            status = COALESCE($35, status),
            updated_at = CURRENT_TIMESTAMP
          WHERE id = $1
          RETURNING id, registro_id, status;
        `,
        [
          id,
          s255(rest?.hora ?? null),
          s255(rest?.tipo_verificacion ?? rest?.tipoVerificacion ?? null),
          s255(rest?.linea ?? null),
          s255(rest?.superficie ?? null),
          hasEstadoFiltro,
          estadoFiltroValue ?? null,
          hasNovedadesFiltro,
          novedadesFiltroValue ?? null,
          hasCorreccionesFiltro,
          correccionesFiltroValue ?? null,
          s255(rest?.presencia_elementos_extranos ?? rest?.presenciaElementosExtranos ?? null),
          s255(rest?.detalle_elementos_extranos ?? rest?.detalleElementosExtranos ?? null),
          s255(rest?.resultados_atp_ri ?? rest?.resultadosAtpRi ?? null),
          s255(rest?.resultados_atp_ac ?? rest?.resultadosAtpAc ?? null),
          s255(rest?.resultados_atp_rf ?? rest?.resultadosAtpRf ?? null),
          s255(rest?.lote_hisopo_atp ?? rest?.loteHisopoAtp ?? null),
          s255(rest?.observacion_atp ?? rest?.observacionAtp ?? null),
          s255(rest?.equipo_atp ?? rest?.equipoAtp ?? null),
          s255(rest?.parte_atp ?? rest?.parteAtp ?? null),
          s255(rest?.deteccion_alergenos_ri ?? rest?.deteccionAlergenosRi ?? null),
          s255(rest?.deteccion_alergenos_ac ?? rest?.deteccionAlergenosAc ?? null),
          s255(rest?.deteccion_alergenos_rf ?? rest?.deteccionAlergenosRf ?? null),
          s255(rest?.lote_hisopo_alergenos ?? rest?.loteHisopoAlergenos ?? null),
          s255(rest?.observacion_alergenos ?? rest?.observacionAlergenos ?? null),
          s255(rest?.equipo_alergenos ?? rest?.equipoAlergenos ?? null),
          s255(rest?.parte_alergenos ?? rest?.parteAlergenos ?? null),
          s255(rest?.detergente ?? null),
          s255(rest?.desinfectante ?? null),
          rest?.verificacion_visual ?? rest?.verificacionVisual ?? null,
          s255(rest?.observacion_visual ?? rest?.observacionVisual ?? null),
          s255(rest?.verificado_por ?? rest?.verificadoPor ?? null),
          s255(rest?.responsable_produccion ?? rest?.responsableProduccion ?? null),
          s255(rest?.responsable_mantenimiento ?? rest?.responsableMantenimiento ?? null),
          (status ?? null) as LimpiezaStatus | null,
        ]
      );

      if (updateRes.rows.length === 0) {
        await client.query('ROLLBACK');
        return NextResponse.json({ error: 'Liberación no encontrada' }, { status: 404 });
      }

      liberacion = updateRes.rows[0];
    } else {
      const insertRes = await client.query<LimpiezaLiberacionRow>(
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
          RETURNING id, registro_id, status;
        `,
        [
          parentId,
          s255(rest?.hora ?? null),
          s255(rest?.tipo_verificacion ?? rest?.tipoVerificacion ?? null),
          s255(rest?.linea ?? null),
          s255(rest?.superficie ?? null),
          rest?.estado_filtro ?? rest?.estadoFiltro ?? null,
          (rest?.novedades_filtro ?? rest?.novedadesFiltro ?? null),
          (rest?.correcciones_filtro ?? rest?.correccionesFiltro ?? null),
          s255(rest?.presencia_elementos_extranos ?? rest?.presenciaElementosExtranos ?? null),
          s255(rest?.detalle_elementos_extranos ?? rest?.detalleElementosExtranos ?? null),
          s255(rest?.resultados_atp_ri ?? rest?.resultadosAtpRi ?? null),
          s255(rest?.resultados_atp_ac ?? rest?.resultadosAtpAc ?? null),
          s255(rest?.resultados_atp_rf ?? rest?.resultadosAtpRf ?? null),
          s255(rest?.lote_hisopo_atp ?? rest?.loteHisopoAtp ?? null),
          s255(rest?.observacion_atp ?? rest?.observacionAtp ?? null),
          s255(rest?.equipo_atp ?? rest?.equipoAtp ?? null),
          s255(rest?.parte_atp ?? rest?.parteAtp ?? null),
          s255(rest?.deteccion_alergenos_ri ?? rest?.deteccionAlergenosRi ?? null),
          s255(rest?.deteccion_alergenos_ac ?? rest?.deteccionAlergenosAc ?? null),
          s255(rest?.deteccion_alergenos_rf ?? rest?.deteccionAlergenosRf ?? null),
          s255(rest?.lote_hisopo_alergenos ?? rest?.loteHisopoAlergenos ?? null),
          s255(rest?.observacion_alergenos ?? rest?.observacionAlergenos ?? null),
          s255(rest?.equipo_alergenos ?? rest?.equipoAlergenos ?? null),
          s255(rest?.parte_alergenos ?? rest?.parteAlergenos ?? null),
          s255(rest?.detergente ?? null),
          s255(rest?.desinfectante ?? null),
          rest?.verificacion_visual ?? rest?.verificacionVisual ?? null,
          s255(rest?.observacion_visual ?? rest?.observacionVisual ?? null),
          s255(rest?.verificado_por ?? rest?.verificadoPor ?? null),
          s255(rest?.responsable_produccion ?? rest?.responsableProduccion ?? null),
          s255(rest?.responsable_mantenimiento ?? rest?.responsableMantenimiento ?? null),
          ((status ?? 'pending') as LimpiezaStatus),
          s255(rest?.created_by ?? rest?.createdBy ?? null),
        ]
      );

      liberacion = insertRes.rows[0];
    }

    const parentStatus = await recalcRegistroStatus(client, parentId);

    await client.query('COMMIT');

    return NextResponse.json({
      liberacion,
      registro: {
        id: parentId,
        status: parentStatus,
      },
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error al upsert de liberación:', error);
    return NextResponse.json({ error: 'Error al guardar liberación' }, { status: 500 });
  } finally {
    client.release();
  }
}

export async function DELETE(request: NextRequest) {
  const client = await pool.connect();
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'id es requerido' }, { status: 400 });
    }

    await client.query('BEGIN');

    const currentStatusRes = await client.query<{ status: LimpiezaStatus }>(
      'SELECT status FROM limpieza_liberaciones WHERE id = $1',
      [id]
    );

    if (currentStatusRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return NextResponse.json({ error: 'Liberación no encontrada' }, { status: 404 });
    }

    if (currentStatusRes.rows[0].status === 'completed') {
      await client.query('ROLLBACK');
      return NextResponse.json(
        { error: 'No se puede eliminar una liberación completada' },
        { status: 409 }
      );
    }

    const res = await client.query<LimpiezaLiberacionRow>(
      'DELETE FROM limpieza_liberaciones WHERE id = $1 RETURNING id, registro_id, status',
      [id]
    );

    if (res.rows.length === 0) {
      await client.query('ROLLBACK');
      return NextResponse.json({ error: 'Liberación no encontrada' }, { status: 404 });
    }

    const registroId = res.rows[0].registro_id;
    const parentStatus = await recalcRegistroStatus(client, registroId);

    await client.query('COMMIT');

    return NextResponse.json({
      deleted: true,
      registro: {
        id: registroId,
        status: parentStatus,
      },
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error al eliminar liberación:', error);
    return NextResponse.json({ error: 'Error al eliminar liberación' }, { status: 500 });
  } finally {
    client.release();
  }
}
