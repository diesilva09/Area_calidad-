import { NextRequest, NextResponse } from 'next/server';
import { authService } from '@/lib/auth-service';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();
    
    if (!email) {
      return NextResponse.json(
        { error: 'Correo electrónico es requerido' },
        { status: 400 }
      );
    }

    // Buscar usuario y generar nuevo token
    const result = await authService.resendVerificationEmail(email);
    
    return NextResponse.json(result);
    
  } catch (error) {
    console.error('Error al reenviar verificación:', error);
    return NextResponse.json(
      { error: 'Error al reenviar correo de verificación' },
      { status: 500 }
    );
  }
}
