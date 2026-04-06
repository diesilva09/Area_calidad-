import { NextRequest, NextResponse } from 'next/server';
import { authService } from '@/lib/auth-service';

export async function POST(request: NextRequest) {
  try {
    console.log('🔍 Debug Login Test - Iniciando prueba de login');
    
    const body = await request.json();
    console.log('🔍 Debug Login Test - Body recibido:', body);
    
    // Intentar autenticar con credenciales de prueba
    const result = await authService.login(body.email, body.password);
    
    if (!result.success) {
      return NextResponse.json({
        error: result.error || 'Credenciales inválidas',
        success: false
      }, { status: 401 });
    }
    
    console.log('🔍 Debug Login Test - Login exitoso:', {
      user: result.user,
      hasToken: !!result.token
    });
    
    // Crear respuesta y establecer cookie
    const response = NextResponse.json({
      success: true,
      message: 'Login exitoso',
      user: {
        id: result.user.id,
        email: result.user.email,
        name: result.user.name,
        role: result.user.role
      }
    });
    
    // Establecer cookie con configuración explícita
    response.cookies.set('auth-token', result.token, {
      httpOnly: true,
      secure: false, // En desarrollo, false para localhost
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7 días
      path: '/'
    });
    
    console.log('🔍 Debug Login Test - Cookie establecida');
    
    return response;
    
  } catch (error) {
    console.error('❌ Error en login test:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
