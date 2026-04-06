import { NextRequest, NextResponse } from 'next/server';
import { authService } from '@/lib/auth-service';

export async function POST(request: NextRequest) {
  try {
    console.log('🔍 Debug Create Test - Verificando autenticación');
    
    // Obtener usuario autenticado (usando la misma lógica que production-records)
    const user = await getAuthedUser(request);
    const userName = user?.name || user?.email || 'Usuario desconocido';
    
    console.log('🔍 Debug Create Test - Usuario autenticado:', {
      user: user ? {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      } : null,
      userName: userName
    });

    // Mostrar headers y cookies para debugging
    const cookies = request.cookies.getAll();
    const authHeader = request.headers.get('authorization');
    
    console.log('🔍 Debug Create Test - Headers y cookies:', {
      cookies: cookies,
      authHeader: authHeader,
      cookieCount: cookies.length
    });

    return NextResponse.json({
      success: true,
      message: 'Test de creación exitoso',
      user: user ? {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      } : null,
      userName: userName,
      debug: {
        cookies: cookies,
        authHeader: authHeader,
        cookieCount: cookies.length
      }
    });
    
  } catch (error) {
    console.error('❌ Error en create test:', error);
    return NextResponse.json(
      { error: 'Error interno', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// Copiar la misma función de getAuthedUser
async function getAuthedUser(request: NextRequest) {
  // Primero intentar obtener token de cookie
  let token = request.cookies.get('auth-token')?.value;
  
  // Si no hay cookie, intentar obtener del Authorization header
  if (!token) {
    const authHeader = request.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7); // Remover 'Bearer ' prefix
      console.log('🔐 Backend: Token obtenido desde Authorization header (fallback)');
    }
  } else {
    console.log('🔐 Backend: Token obtenido desde cookie');
  }
  
  if (!token) {
    console.log('❌ Backend: No se encontró token de autenticación');
    return null;
  }
  
  return authService.validateSession(token);
}
