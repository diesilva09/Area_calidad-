import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

const META_CUMPLIMIENTO = 95;

function parseMonthYear(searchParams: URLSearchParams) {
  const now = new Date();
  const anio = Number(searchParams.get('anio') ?? now.getFullYear());
  const mes = Number(searchParams.get('mes') ?? now.getMonth() + 1);

  if (!Number.isFinite(anio) || anio < 2000 || anio > 2100) {
    throw new Error('Parámetro "anio" inválido');
  }
  if (!Number.isFinite(mes) || mes < 1 || mes > 12) {
    throw new Error('Parámetro "mes" inválido');
  }

  return { anio, mes };
}

function monthDateRange(anio: number, mes: number) {
  const start = new Date(anio, mes - 1, 1);
  const end = new Date(anio, mes, 1);
  const startISO = start.toISOString().slice(0, 10);
  const endISO = end.toISOString().slice(0, 10);
  return { startISO, endISO };
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const mode = (searchParams.get('mode') ?? 'daily') as 'daily' | 'monthly';

    if (mode !== 'daily' && mode !== 'monthly') {
      return NextResponse.json({ error: 'Parámetro "mode" inválido' }, { status: 400 });
    }

    if (mode === 'monthly') {
      const result = await pool.query(
        `SELECT id, mes, anio, total_registros, registros_cumplen, porcentaje_cumplimiento, fecha_calculo
         FROM verificacion_bpm.bpm_indicators_monthly
         ORDER BY anio DESC, mes DESC`
      );
      return NextResponse.json({ meta: META_CUMPLIMIENTO, items: result.rows });
    }

    const { anio, mes } = parseMonthYear(searchParams);
    const { startISO, endISO } = monthDateRange(anio, mes);

    // Indicador diario: un registro "cumple" si ninguno de los requisitos está en "no_cumple".
    const daily = await pool.query(
      `SELECT
         fecha::date as fecha,
         COUNT(*)::int as total_registros,
         SUM(
           CASE
             WHEN (
               LOWER(req_uniforme) <> 'no_cumple'
               AND LOWER(req_unas) <> 'no_cumple'
               AND LOWER(req_sin_joyas) <> 'no_cumple'
               AND LOWER(req_sin_cabellos) <> 'no_cumple'
               AND LOWER(req_barba) <> 'no_cumple'
               AND LOWER(req_manos) <> 'no_cumple'
               AND LOWER(req_guantes) <> 'no_cumple'
               AND LOWER(req_petos_botas) <> 'no_cumple'
               AND LOWER(req_epp) <> 'no_cumple'
               AND LOWER(req_no_accesorios) <> 'no_cumple'
             )
             THEN 1
             ELSE 0
           END
         )::int as registros_cumplen
       FROM verificacion_bpm.bpm_verifications
       WHERE fecha >= $1::date AND fecha < $2::date
       GROUP BY fecha
       ORDER BY fecha ASC`,
      [startISO, endISO]
    );

    const items = (daily.rows as Array<{ fecha: string; total_registros: number; registros_cumplen: number }>).map(
      (r) => {
        const porcentaje = r.total_registros > 0 ? (r.registros_cumplen / r.total_registros) * 100 : 0;
        return {
          fecha: String(r.fecha).slice(0, 10),
          total_registros: r.total_registros,
          registros_cumplen: r.registros_cumplen,
          porcentaje_cumplimiento: Number(porcentaje.toFixed(2)),
        };
      }
    );

    const monthlyTotals = items.reduce(
      (acc, it) => {
        acc.total_registros += it.total_registros;
        acc.registros_cumplen += it.registros_cumplen;
        return acc;
      },
      { total_registros: 0, registros_cumplen: 0 }
    );

    const promedioMensual =
      monthlyTotals.total_registros > 0
        ? Number(((monthlyTotals.registros_cumplen / monthlyTotals.total_registros) * 100).toFixed(2))
        : 0;

    return NextResponse.json({
      meta: META_CUMPLIMIENTO,
      anio,
      mes,
      rango: { desde: startISO, hasta: endISO },
      promedio_mensual: promedioMensual,
      total_registros: monthlyTotals.total_registros,
      registros_cumplen: monthlyTotals.registros_cumplen,
      items,
    });
  } catch (error) {
    console.error('Error en indicadores BPM:', error);
    return NextResponse.json(
      {
        error: 'Error al obtener indicadores BPM',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const anio = Number(body?.anio);
    const mes = Number(body?.mes);

    if (!Number.isFinite(anio) || anio < 2000 || anio > 2100) {
      return NextResponse.json({ error: 'Parámetro "anio" inválido' }, { status: 400 });
    }
    if (!Number.isFinite(mes) || mes < 1 || mes > 12) {
      return NextResponse.json({ error: 'Parámetro "mes" inválido' }, { status: 400 });
    }

    const { startISO, endISO } = monthDateRange(anio, mes);

    const totals = await pool.query(
      `SELECT
         COUNT(*)::int as total_registros,
         SUM(
           CASE
             WHEN (
               LOWER(req_uniforme) <> 'no_cumple'
               AND LOWER(req_unas) <> 'no_cumple'
               AND LOWER(req_sin_joyas) <> 'no_cumple'
               AND LOWER(req_sin_cabellos) <> 'no_cumple'
               AND LOWER(req_barba) <> 'no_cumple'
               AND LOWER(req_manos) <> 'no_cumple'
               AND LOWER(req_guantes) <> 'no_cumple'
               AND LOWER(req_petos_botas) <> 'no_cumple'
               AND LOWER(req_epp) <> 'no_cumple'
               AND LOWER(req_no_accesorios) <> 'no_cumple'
             )
             THEN 1
             ELSE 0
           END
         )::int as registros_cumplen
       FROM verificacion_bpm.bpm_verifications
       WHERE fecha >= $1::date AND fecha < $2::date`,
      [startISO, endISO]
    );

    const total_registros = Number(totals.rows[0]?.total_registros ?? 0);
    const registros_cumplen = Number(totals.rows[0]?.registros_cumplen ?? 0);
    const porcentaje = total_registros > 0 ? (registros_cumplen / total_registros) * 100 : 0;
    const porcentaje_cumplimiento = Number(porcentaje.toFixed(2));

    const upsert = await pool.query(
      `INSERT INTO verificacion_bpm.bpm_indicators_monthly
         (mes, anio, total_registros, registros_cumplen, porcentaje_cumplimiento, fecha_calculo)
       VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
       ON CONFLICT (mes, anio)
       DO UPDATE SET
         total_registros = EXCLUDED.total_registros,
         registros_cumplen = EXCLUDED.registros_cumplen,
         porcentaje_cumplimiento = EXCLUDED.porcentaje_cumplimiento,
         fecha_calculo = CURRENT_TIMESTAMP
       RETURNING *`,
      [mes, anio, total_registros, registros_cumplen, porcentaje_cumplimiento]
    );

    return NextResponse.json({
      meta: META_CUMPLIMIENTO,
      item: upsert.rows[0],
    });
  } catch (error) {
    console.error('Error guardando indicador BPM mensual:', error);
    return NextResponse.json(
      {
        error: 'Error al guardar indicador BPM mensual',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
