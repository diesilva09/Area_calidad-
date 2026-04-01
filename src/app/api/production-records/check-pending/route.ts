import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { sendPushToAll } from '@/lib/push-service';

const DAYS_FIRST_ALERT = 8;
const DAYS_SECOND_ALERT = 23; // 8 + 15

export async function GET(_request: NextRequest) {
  try {
    // Obtener todos los registros de producción pendientes activos
    const result = await pool.query<{
      id: string;
      lote: string;
      producto: string;
      created_at: Date;
      last_opened_at: Date | null;
    }>(
      `SELECT id, lote, producto, created_at, last_opened_at
       FROM production_records
       WHERE is_active = true AND status = 'pending'`
    );

    const records = result.rows;
    const now = new Date();
    let notified = 0;

    for (const record of records) {
      const reference = record.last_opened_at ?? record.created_at;
      const diffDays = Math.floor(
        (now.getTime() - new Date(reference).getTime()) / (1000 * 60 * 60 * 24)
      );

      let alertStage: '8d' | '23d' | null = null;
      if (diffDays >= DAYS_SECOND_ALERT) {
        alertStage = '23d';
      } else if (diffDays >= DAYS_FIRST_ALERT) {
        alertStage = '8d';
      }

      if (!alertStage) continue;

      const dedupeKey = `prod_pending_${alertStage}:${record.id}`;
      const title = `Registro RE-CAL-084 pendiente (${alertStage === '8d' ? '8' : '23'} días)`;
      const message =
        alertStage === '8d'
          ? `El registro de producción lote "${record.lote}" lleva ${diffDays} días pendiente sin completar.`
          : `El registro de producción lote "${record.lote}" lleva ${diffDays} días pendiente. Requiere atención urgente.`;

      const insertRes = await pool.query(
        `INSERT INTO notificaciones.notifications (type, title, message, entity_type, entity_id, dedupe_key)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (dedupe_key) DO NOTHING
         RETURNING id`,
        [
          'prod_pending',
          title,
          message,
          'production_record',
          record.id,
          dedupeKey,
        ]
      );

      if (insertRes.rows?.length) {
        notified++;
        await sendPushToAll({
          title,
          message,
          url: `/dashboard/supervisores/production-record/${record.id}`,
        });
      }
    }

    return NextResponse.json({
      checked: records.length,
      notified,
    });
  } catch (error) {
    console.error('Error en check-pending:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
