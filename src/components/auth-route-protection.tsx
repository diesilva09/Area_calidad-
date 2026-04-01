'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';

interface AuthRouteProtectionProps {
  children: React.ReactNode;
  requireJefe?: boolean;
  fallback?: React.ReactNode;
}

export function AuthRouteProtection({ 
  children, 
  requireJefe = false, 
  fallback 
}: AuthRouteProtectionProps) {
  const { user, loading, isAuthenticated, isJefe } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    // Si no está autenticado, redirigir al login
    if (!isAuthenticated) {
      router.push('/login-simple');
      return;
    }

    // Si requiere rol de jefe y no es jefe, redirigir con mensaje
    if (requireJefe && !isJefe) {
      router.push('/login-simple?message=Esta sección requiere privilegios de Jefe de Calidad');
      return;
    }
  }, [loading, isAuthenticated, isJefe, requireJefe, router]);

  // Mostrar loading mientras se verifica la autenticación
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Verificando autenticación...</p>
        </div>
      </div>
    );
  }

  // Si no está autenticado, mostrar fallback o nada
  if (!isAuthenticated) {
    return fallback || null;
  }

  // Si requiere rol de jefe y no es jefe, mostrar fallback
  if (requireJefe && !isJefe) {
    return fallback || (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            <strong>Acceso Denegado</strong>
            <p className="mt-2">Esta sección requiere privilegios de Jefe de Calidad.</p>
          </div>
          <button 
            onClick={() => router.back()}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Volver
          </button>
        </div>
      </div>
    );
  }

  // Si pasa todas las validaciones, mostrar los hijos
  return <>{children}</>;
}
