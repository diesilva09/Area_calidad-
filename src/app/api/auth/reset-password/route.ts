import { NextRequest, NextResponse } from 'next/server';
import { authService } from '@/lib/auth-service';

export async function POST(request: NextRequest) {
  try {
    const { token, newPassword } = await request.json();
    
    if (!token || !newPassword) {
      return NextResponse.json({ error: 'Token y nueva contraseña requeridos' }, { status: 400 });
    }

    if (newPassword.length < 6) {
      return NextResponse.json({ error: 'La contraseña debe tener al menos 6 caracteres' }, { status: 400 });
    }

    const result = await authService.resetPassword(token, newPassword);
    return NextResponse.json(result);

  } catch (error) {
    console.error('Error en reset-password:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
