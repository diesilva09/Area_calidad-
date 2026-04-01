import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { authService } from '@/lib/auth-service';

async function getAuthedUser(request: NextRequest) {
  const token = request.cookies.get('auth-token')?.value;
  if (!token) return null;
  return authService.validateSession(token);
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthedUser(request);
    if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

    const body = await request.json();
    const endpoint = String(body?.endpoint ?? '').trim();

    if (!endpoint) {
      return NextResponse.json({ error: 'endpoint requerido' }, { status: 400 });
    }

    await pool.query(
      'DELETE FROM notificaciones.push_subscriptions WHERE endpoint = $1',
      [endpoint]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error eliminando suscripción push:', error);
    return NextResponse.json({ error: 'Error eliminando suscripción push' }, { status: 500 });
  }
}
