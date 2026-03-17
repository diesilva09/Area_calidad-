'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export interface User {
  id: number;
  email: string;
  name: string;
  role: 'jefe' | 'operario' | 'tecnico';
  email_verified: boolean;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; message: string }>;
  logout: () => Promise<void>;
  register: (email: string, password: string, name: string, role: 'jefe' | 'operario') => Promise<{ success: boolean; message: string }>;
  verifyEmail: (token: string) => Promise<{ success: boolean; message: string }>;
  requestPasswordReset: (email: string) => Promise<{ success: boolean; message: string }>;
  resetPassword: (token: string, newPassword: string) => Promise<{ success: boolean; message: string }>;
  isAuthenticated: boolean;
  isJefe: boolean;
  isOperario: boolean;
  isTecnico: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Verificar sesión al cargar
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      console.log('🔍 Verificando autenticación...');
      const response = await fetch('/api/auth/me', {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Usuario autenticado:', data.user);
        setUser(data.user);
      } else {
        console.log('❌ Sesión no válida o expirada');
        setUser(null);
        // NO redirigir aquí - dejar que las páginas individuales manejen la redirección
      }
    } catch (error) {
      console.error('Error verificando autenticación:', error);
      setUser(null);
      // NO redirigir aquí - dejar que las páginas individuales manejen la redirección
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string): Promise<{ success: boolean; message: string }> => {
    try {
      console.log('🔍 Frontend Login: Iniciando login con:', { email, passwordLength: password?.length || 0 });
      
      // Validar que email y password no sean undefined
      if (!email || !password) {
        console.log('❌ Frontend Login: Email o password undefined');
        return { success: false, message: 'Email y contraseña son requeridos' };
      }
      
      const requestBody = JSON.stringify({ email, password });
      console.log('📋 Frontend Login: Body a enviar:', requestBody);
      
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: requestBody,
        credentials: 'include'
      });

      console.log('📊 Frontend Login: Response status:', response.status);
      console.log('📊 Frontend Login: Response ok:', response.ok);

      const data = await response.json();
      console.log('📋 Frontend Login: Response data:', data);

      if (response.ok) {
        // Si requiere verificación, redirigir a página de espera
        if (data.requiresVerification) {
          router.push(`/verification-pending?email=${encodeURIComponent(data.email)}`);
          return { success: false, message: data.message };
        }
        
        setUser(data.user);
        // Redirigir al dashboard después del login exitoso
        router.push('/dashboard');
        return { success: true, message: data.message };
      } else {
        return { success: false, message: data.error || 'Error en el inicio de sesión' };
      }
    } catch (error) {
      console.error('❌ Frontend Login: Error en login:', error);
      return { success: false, message: 'Error de conexión' };
    }
  };

  const logout = async (): Promise<void> => {
    try {
      console.log('🔴 Iniciando proceso de logout...');
      
      // Llamar al API de logout para limpiar la cookie en el servidor
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include'
      });
      
      if (response.ok) {
        console.log('🔴 Sesión cerrada en backend');
      } else {
        console.error('🔴 Error cerrando sesión en backend:', response.statusText);
      }
    } catch (error) {
      console.error('Error en logout:', error);
    } finally {
      // Primero limpiar el estado del usuario
      console.log('🔴 Limpiando estado de usuario...');
      setUser(null);
      
      // Pequeña espera para asegurar que el estado se limpie completamente
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Luego redirigir a la página de selección de roles
      console.log('🔴 Redirigiendo a página de selección de roles...');
      router.push('/');
    }
  };

  const register = async (
    email: string, 
    password: string, 
    name: string, 
    role: 'jefe' | 'operario'
  ): Promise<{ success: boolean; message: string }> => {
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, name, role }),
        credentials: 'include'
      });

      const data = await response.json();

      if (response.ok) {
        return { success: true, message: data.message };
      } else {
        return { success: false, message: data.error || 'Error en el registro' };
      }
    } catch (error) {
      console.error('Error en registro:', error);
      return { success: false, message: 'Error de conexión' };
    }
  };

  const verifyEmail = async (token: string): Promise<{ success: boolean; message: string }> => {
    try {
      const response = await fetch(`/api/auth/verify-email?token=${token}`, {
        credentials: 'include'
      });

      const data = await response.json();

      if (response.ok) {
        return { success: true, message: data.message };
      } else {
        return { success: false, message: data.error || 'Error en la verificación' };
      }
    } catch (error) {
      console.error('Error en verificación:', error);
      return { success: false, message: 'Error de conexión' };
    }
  };

  const requestPasswordReset = async (email: string): Promise<{ success: boolean; message: string }> => {
    try {
      const response = await fetch('/api/auth/request-password-reset', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
        credentials: 'include'
      });

      const data = await response.json();

      if (response.ok) {
        return { success: true, message: data.message };
      } else {
        return { success: false, message: data.error || 'Error en la solicitud' };
      }
    } catch (error) {
      console.error('Error en solicitud de recuperación:', error);
      return { success: false, message: 'Error de conexión' };
    }
  };

  const resetPassword = async (token: string, newPassword: string): Promise<{ success: boolean; message: string }> => {
    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token, newPassword }),
        credentials: 'include'
      });

      const data = await response.json();

      if (response.ok) {
        return { success: true, message: data.message };
      } else {
        return { success: false, message: data.error || 'Error al restablecer contraseña' };
      }
    } catch (error) {
      console.error('Error en restablecimiento:', error);
      return { success: false, message: 'Error de conexión' };
    }
  };

  const value: AuthContextType = {
    user,
    loading,
    login,
    logout,
    register,
    verifyEmail,
    requestPasswordReset,
    resetPassword,
    isAuthenticated: !!user,
    isJefe: user?.role === 'jefe',
    isOperario: user?.role === 'operario',
    isTecnico: user?.role === 'tecnico'
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
}
