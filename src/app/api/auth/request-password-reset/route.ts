import { NextRequest, NextResponse } from 'next/server';
import { authService } from '@/lib/auth-service';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();
    
    if (!email) {
      return NextResponse.json({ error: 'Email requerido' }, { status: 400 });
    }

    const result = await authService.requestPasswordReset(email);
    return NextResponse.json(result);

  } catch (error) {
    console.error('Error en request-password-reset:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
