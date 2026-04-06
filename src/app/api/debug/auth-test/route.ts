import { NextRequest, NextResponse } from 'next/server';
import { authService } from '@/lib/auth-service';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Debug Auth Test - Verificando autenticación');
    
    // Mostrar todas las cookies disponibles
    const cookies = request.cookies.getAll();
    console.log('🔍 Debug Auth Test - Todas las cookies:', cookies);
    
    // Obtener token de la cookie
    const token = request.cookies.get('auth-token')?.value;
    console.log('🔍 Debug Auth Test - Token encontrado:', !!token);
    
    if (!token) {
      return NextResponse.json({
        error: 'No hay token de autenticación',
        hasToken: false,
        user: null,
        allCookies: cookies,
        cookieCount: cookies.length
      });
    }
    
    // Validar sesión
    const user = await authService.validateSession(token);
    console.log('🔍 Debug Auth Test - Usuario validado:', user ? {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role
    } : null);
    
    return NextResponse.json({
      success: true,
      hasToken: !!token,
      user: user ? {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      } : null,
      userName: user?.name || user?.email || 'Usuario desconocido',
      allCookies: cookies,
      cookieCount: cookies.length
    });
    
  } catch (error) {
    console.error('❌ Error en auth test:', error);
    return NextResponse.json(
      { error: 'Error interno', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
