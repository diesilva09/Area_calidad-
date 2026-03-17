import { NextRequest, NextResponse } from 'next/server';
import { authService } from '@/lib/auth-service';

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value;

    if (token) {
      await authService.logout(token);
    }

    const response = NextResponse.json({ message: 'Sesión cerrada exitosamente' });
    response.cookies.delete('auth-token');

    return response;

  } catch (error) {
    console.error('Error en logout:', error);
    return NextResponse.json({ error: 'Error al cerrar sesión' }, { status: 500 });
  }
}
