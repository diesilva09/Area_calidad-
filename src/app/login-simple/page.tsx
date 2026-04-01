'use client';

import { useState, Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { ShieldCheck, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/hooks/use-toast';

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, isAuthenticated, loading } = useAuth();
  const { toast } = useToast();
  const role = searchParams.get('role');
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Redirigir si ya está autenticado, pero permitir acceso si viene de selección de rol
  useEffect(() => {
    if (!loading && isAuthenticated) {
      // Si viene con un parámetro de rol, mostrar el login aunque esté autenticado
      // para permitir cambiar de rol o iniciar sesión con diferentes credenciales
      if (role) {
        if (process.env.NODE_ENV !== 'production') {
          console.log(' Usuario autenticado pero viene con rol, mostrando login para permitir cambio de rol');
        }
        return;
      }
      
      if (process.env.NODE_ENV !== 'production') {
        console.log(' Usuario ya autenticado sin rol, redirigiendo al dashboard...');
      }
      router.push('/dashboard');
    }
  }, [isAuthenticated, loading, router, role]);

  

  // Si no hay rol, usar 'jefe' como rol por defecto
  const effectiveRole = role || 'jefe';

  const roleTitle = effectiveRole === 'jefe' ? 'Jefe de Calidad' : 'Supervisor de Calidad';
  const roleDescription = effectiveRole === 'jefe' 
    ? 'Acceso completo al sistema de gestión de calidad'
    : 'Acceso a funciones de supervisor de calidad';

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (process.env.NODE_ENV !== 'production') {
        console.log(' Intentando login con:', { email, passwordLength: password?.length || 0 });
      }
      
      // Usar el AuthContext para el login
      const result = await login(email, password);
      
      if (result.success) {
        if (process.env.NODE_ENV !== 'production') {
          console.log(' Login exitoso:', result.message);
        }
        // El AuthContext ya maneja la redirección
      } else {
        if (process.env.NODE_ENV !== 'production') {
          console.error(' Error en login:', result.message);
        }
        toast({
          title: 'Error de inicio de sesión',
          description: result.message || 'Error en el inicio de sesión',
          variant: 'destructive',
        });
      }
    } catch (error) {
      if (process.env.NODE_ENV !== 'production') {
        console.error(' Error de conexión:', error);
      }
      toast({
        title: 'Error de conexión',
        description: 'Error de conexión al servidor',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-white p-4">
      <div className="w-full max-w-md space-y-6 animate-fade-in">
        {/* Header */}
        <div className="text-center animate-slide-down">
          <div className="flex justify-center animate-scale-in">
            <img 
              src="/logo.jpg" 
              alt="CalidadCoruña Logo" 
              className="h-24 w-auto max-w-[180px] object-contain"
            />
          </div>
          <h1 className="mt-4 text-2xl font-bold text-gray-900 animate-slide-up">
            Area de calidad la coruña 
          </h1>
          <p className="text-sm text-gray-600 animate-slide-up-delay">
            Iniciar sesión como {roleTitle}
          </p>
        </div>

        {/* Login Form */}
        <Card className="animate-slide-up-delay-2">
          <CardHeader>
            <CardTitle className="text-center">{roleTitle}</CardTitle>
            <CardDescription className="text-center">
              {roleDescription}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2 animate-fade-in-delay">
                <Label htmlFor="email">Correo Electrónico</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder=""
                  value={email}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Contraseña</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder=""
                    value={password}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                    required
                    disabled={isLoading}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isLoading}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full" 
                disabled={isLoading}
              >
                {isLoading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
              </Button>
            </form>

            <div className="mt-4 text-center">
              <Button variant="ghost" asChild>
                <Link href="/">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Volver a selección de rol
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

       
      </div>
    </div>
  );
}

export default function LoginPage() {
  useEffect(() => {
    if (typeof document === 'undefined') return;

    const styleId = 'login-simple-inline-styles';
    const existing = document.getElementById(styleId);
    if (existing) return;

    const styleSheet = document.createElement('style');
    styleSheet.id = styleId;
    styleSheet.textContent = styles;
    document.head.appendChild(styleSheet);

    return () => {
      try {
        const current = document.getElementById(styleId);
        if (current?.parentNode) {
          current.parentNode.removeChild(current);
        }
      } catch {
        // noop
      }
    };
  }, []);

  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Cargando...</p>
        </div>
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}

// Estilos de animación
const styles = `
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  
  @keyframes slideDown {
    from { 
      opacity: 0;
      transform: translateY(-20px);
    }
    to { 
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  @keyframes slideUp {
    from { 
      opacity: 0;
      transform: translateY(20px);
    }
    to { 
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  @keyframes scaleIn {
    from { 
      opacity: 0;
      transform: scale(0.8);
    }
    to { 
      opacity: 1;
      transform: scale(1);
    }
  }

  .animate-fade-in {
    animation: fadeIn 0.8s ease-out;
  }
  
  .animate-fade-in-delay {
    animation: fadeIn 0.8s ease-out 0.6s both;
  }
  
  .animate-slide-down {
    animation: slideDown 0.6s ease-out;
  }
  
  .animate-slide-up {
    animation: slideUp 0.6s ease-out 0.2s both;
  }
  
  .animate-slide-up-delay {
    animation: slideUp 0.6s ease-out 0.4s both;
  }
  
  .animate-slide-up-delay-2 {
    animation: slideUp 0.6s ease-out 0.6s both;
  }
  
  .animate-scale-in {
    animation: scaleIn 0.5s ease-out;
  }
`;
