import { NextRequest, NextResponse } from 'next/server';
import { authService } from '@/lib/auth-service';
import { sendPushToAll } from '@/lib/push-service';

async function getAuthedUser(request: NextRequest) {
  const token = request.cookies.get('auth-token')?.value;
  if (!token) return null;
  return authService.validateSession(token);
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthedUser(request);
    if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

    await sendPushToAll({
      title: 'Notificación de prueba',
      message: 'Si ves esto con la app cerrada, Web Push quedó funcionando.',
      url: '/dashboard',
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error enviando push de prueba:', error);
    return NextResponse.json({ error: error?.message ?? 'Error enviando push' }, { status: 500 });
  }
}
