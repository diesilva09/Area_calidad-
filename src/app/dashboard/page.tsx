'use client';

import { useAuth } from '@/contexts/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Users
} from 'lucide-react';
import Link from 'next/link';

const menuItems = [
  {
    title: 'Supervisores',
    icon: Users,
    href: '/dashboard/supervisores',
    description: 'Gestión de supervisores',
    roles: ['jefe']
  }
];

export default function Dashboard() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/');
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p>Verificando sesión...</p>
      </div>
    );
  }

  const filteredMenuItems = menuItems.filter(item => 
    !item.roles || item.roles.includes(user.role)
  );

  const getWelcomeMessage = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Buenos días';
    if (hour < 18) return 'Buenas tardes';
    return 'Buenas noches';
  };

  const getRoleTitle = () => {
    return user.role === 'jefe' ? 'Jefe de Calidad' : 'Técnico de Calidad';
  };

  

  return (
    <div className="min-h-screen bg-white p-3 sm:p-4 md:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto bg-white">
        {/* Welcome Screen */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="flex justify-center mb-4 sm:mb-6">
            <img 
              src="/logo.jpg" 
              alt="CalidadCoruña Logo" 
              className="h-20 w-auto max-w-[180px] sm:h-24 sm:max-w-[200px] md:h-32 md:max-w-[240px] object-contain"
            />
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-2 px-2">
            {getWelcomeMessage()}, {user.name}!
          </h1>
          <p className="text-lg sm:text-xl text-gray-600 px-2">
            Bienvenido al Sistema de Gestión de Calidad
          </p>
          <p className="text-base sm:text-lg text-gray-500 mt-2 px-2">
            Tu rol: {getRoleTitle()}
          </p>
        </div>

        {/* Module Cards - REMOVED */}

        {/* Quick Stats - REMOVED */}
      </div>
    </div>
  );
}
