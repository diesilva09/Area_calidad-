import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { authService } from '@/lib/auth-service';

// Rutas que requieren autenticación
const protectedRoutes = [
  '/dashboard',
  '/dashboard/supervisores',
  '/dashboard/supervisores/product',
  '/dashboard/produccion',
  '/verify-email',
  '/reset-password',
  '/embalaje-pending',
  '/embalaje-records'
];

// Rutas públicas
const publicRoutes = [
  '/',
  '/login-simple',
  '/api/auth',
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/logout',
  '/api/auth/me',
  '/api/auth/verify-email',
  '/api/auth/request-password-reset',
  '/api/auth/reset-password'
];

export async function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;
  
  // Permitir rutas de API y archivos estáticos
  if (pathname.startsWith('/api/') || pathname.startsWith('/_next/') || pathname.includes('.')) {
    return NextResponse.next();
  }

  // Verificar si es una ruta pública
  if (publicRoutes.some(route => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // Si el usuario está en login y ya tiene sesión válida, redirigir al dashboard
  // COMENTADO TEMPORALMENTE PARA EVITAR BUCLES
  /*
  if (pathname === '/login-simple' || pathname === '/login') {
    const token = request.cookies.get('auth-token')?.value;
    if (token) {
      try {
        const user = await authService.validateSession(token);
        if (user) {
          const dashboardUrl = new URL('/dashboard', request.url);
          return NextResponse.redirect(dashboardUrl);
        }
      } catch (error) {
        console.error('Error validando sesión existente:', error);
      }
    }
  }
  */

  // Si el usuario está en login-simple con un parámetro de rol, permitir el acceso
  if (pathname === '/login-simple' && searchParams.has('role')) {
    console.log('🔍 Middleware: Acceso permitido a login-simple con rol:', searchParams.get('role'));
    return NextResponse.next();
  }

  // Verificar si es una ruta protegida
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));
  
  if (isProtectedRoute) {
    const token = request.cookies.get('auth-token')?.value;

    if (!token) {
      // Redirigir a login si no hay token
      const loginUrl = new URL('/login-simple', request.url);
      return NextResponse.redirect(loginUrl);
    }

    let user;
    try {
      // Validar el token con la base de datos
      user = await authService.validateSession(token);
      
      if (!user) {
        // Token inválido o expirado - limpiar cookie y redirigir
        const response = NextResponse.redirect(new URL('/login-simple', request.url));
        response.cookies.delete('auth-token');
        return response;
      }

      // Token válido - continuar con la solicitud
      console.log(`✅ Sesión válida para usuario: ${user.email} (${user.role})`);
      
    } catch (error) {
      console.error('❌ Error validando sesión en middleware:', error);
      // En caso de error de base de datos, redirigir a login
      const response = NextResponse.redirect(new URL('/login-simple', request.url));
      response.cookies.delete('auth-token');
      return response;
    }

    // Para rutas específicas que requieren rol de jefe
    const jefeOnlyRoutes = [
      '/dashboard/supervisores',
      '/dashboard/supervisores/product'
    ];

    const isJefeOnlyRoute = jefeOnlyRoutes.some(route => pathname.startsWith(route));

    if (isJefeOnlyRoute) {
      // Verificar el rol del usuario
      if (user.role !== 'jefe') {
        // Usuario no tiene permiso de jefe - redirigir
        const response = NextResponse.redirect(new URL('/dashboard', request.url));
        return response;
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
  runtime: 'nodejs',
};
