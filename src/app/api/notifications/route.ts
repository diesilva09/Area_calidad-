import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { authService } from '@/lib/auth-service';

async function getAuthedUser(request: NextRequest) {
  const token = request.cookies.get('auth-token')?.value;
  if (!token) return null;
  return authService.validateSession(token);
}

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthedUser(request);

    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limitRaw = Number(searchParams.get('limit') ?? 30);
    const limit = Number.isFinite(limitRaw) ? Math.min(Math.max(limitRaw, 1), 200) : 30;

    const result = await pool.query(
      `SELECT 
         n.id, n.type, n.title, n.message, n.entity_type, n.entity_id, n.dedupe_key, n.created_at,
         (nr.notification_id IS NOT NULL) AS is_read
       FROM notificaciones.notifications n
       LEFT JOIN notificaciones.notification_reads nr
         ON nr.notification_id = n.id AND nr.user_id = $1
       ORDER BY n.created_at DESC
       LIMIT $2`,
      [user.id, limit]
    );

    const unreadRes = await pool.query(
      `SELECT COUNT(*)::int AS unread_count
       FROM notificaciones.notifications n
       LEFT JOIN notificaciones.notification_reads nr
         ON nr.notification_id = n.id AND nr.user_id = $1
       WHERE nr.notification_id IS NULL`,
      [user.id]
    );

    return NextResponse.json({
      items: result.rows,
      unread_count: Number(unreadRes.rows?.[0]?.unread_count ?? 0),
    });
  } catch (error) {
    console.error('Error al obtener notificaciones:', error);
    return NextResponse.json({ error: 'Error al obtener notificaciones' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthedUser(request);

    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const body = await request.json();
    const notificationId = Number(body?.notificationId);

    if (!Number.isFinite(notificationId)) {
      return NextResponse.json({ error: 'notificationId inválido' }, { status: 400 });
    }

    await pool.query(
      `INSERT INTO notificaciones.notification_reads (user_id, notification_id)
       VALUES ($1, $2)
       ON CONFLICT (user_id, notification_id) DO NOTHING`,
      [user.id, notificationId]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error al marcar notificación como leída:', error);
    return NextResponse.json({ error: 'Error al marcar notificación como leída' }, { status: 500 });
  }
}
