import { NextRequest, NextResponse } from 'next/server';
import { authService, type LoginRequest } from '@/lib/auth-service';

export async function POST(request: NextRequest) {
  try {
    console.log('🔍 Login API: Recibida solicitud');
    
    const body: LoginRequest = await request.json();
    console.log('📋 Login API: Body recibido:', { email: body.email, password: body.password ? '***' : 'empty' });
    
    // Validaciones básicas
    if (!body.email || !body.password) {
      console.log('❌ Login API: Validación fallida - email o contraseña vacíos');
      return NextResponse.json(
        { error: 'Correo y contraseña son requeridos' },
        { status: 400 }
      );
    }

    // Intentar login
    console.log('🔐 Login API: Intentando autenticar usuario:', body.email);
    const result = await authService.login(body);
    console.log('📊 Login API: Resultado del authService:', { success: !!result.user, message: result.message });

    if (!result.user) {
      console.log('❌ Login API: Autenticación fallida');
      return NextResponse.json(
        { error: result.message },
        { status: 401 }
      );
    }

    // Establecer cookie de autenticación
    const response = NextResponse.json({
      message: result.message,
      user: {
        id: result.user.id,
        email: result.user.email,
        name: result.user.name,
        role: result.user.role
      }
    });

    response.cookies.set('auth-token', result.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7 días para persistencia más larga
      path: '/'
    });

    return response;

  } catch (error) {
    console.error('❌ Error en login API:', error);
    console.error('❌ Stack trace:', error instanceof Error ? error.stack : 'No stack available');
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
