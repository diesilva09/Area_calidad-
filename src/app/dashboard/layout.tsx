'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useRouter, usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import NotificationBell from '@/components/notifications/notification-bell';
import { 
  LayoutDashboard, 
  Users, 
  Wrench, 
  Package, 
  Settings, 
  LogOut,
  Home,
  FileText,
  BarChart3,
  ShieldCheck,
  Menu,
  X,
  Microscope,
  Leaf,
  ClipboardCheck
} from 'lucide-react';
import Link from 'next/link';
import { Toaster } from '@/components/ui/toaster';
import DashboardLayoutWrapper from './layout-wrapper';

const menuItems = [
  {
    title: 'Inicio',
    icon: Home,
    href: '/dashboard',
    description: 'Pantalla de bienvenida'
  },
  {
    title: 'Supervisores',
    icon: Users,
    href: '/dashboard/supervisores',
    description: 'Gestión de supervisores',
    roles: ['jefe', 'operario']
  },
  {
    title: 'Materia Prima',
    icon: Leaf,
    href: '/dashboard/materia-prima',
    description: 'Gestión de materia prima',
    roles: ['jefe', 'operario']
  },
  {
    title: 'LAB. MICROBIOLOGÍA',
    icon: Microscope,
    href: '/dashboard/lab-microbiologia',
    description: 'Análisis microbiológicos',
    roles: ['jefe', 'operario']
  },
  {
    title: 'Verificación de BPM',
    icon: ClipboardCheck,
    href: '/dashboard/verificacion-bpm',
    description: 'Verificación de BPM'
  }
];

function DashboardLayoutContent({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeModule, setActiveModule] = useState('inicio');

  // Actualizar el módulo activo basado en la ruta actual
  useEffect(() => {
    const pathSegments = pathname.split('/');
    const lastSegment = pathSegments[pathSegments.length - 1];
    
    // Mapear rutas a títulos del menú
    const pathToModuleMap: Record<string, string> = {
      'dashboard': 'inicio',
      'supervisores': 'supervisores',
      'materia-prima': 'materia prima',
      'lab-microbiologia': 'lab. microbiología',
      'verificacion-bpm': 'verificación de bpm',
      'produccion': 'producción',
      'embalaje': 'embalaje',
      'limpieza': 'limpieza',
      'equipos': 'equipos',
      'productos': 'productos',
      'categorias': 'categorías',
      'temperatura-envasado': 'temperatura envasado',
      'settings': 'configuración',
      'profile': 'perfil',
    };
    
    const mappedModule = pathToModuleMap[lastSegment] || 'inicio';
    setActiveModule(mappedModule);
  }, [pathname]);

  // NO agregar redirección automática aquí para evitar bucles
  // Las páginas individuales manejarán su propia redirección
  /*
  useEffect(() => {
    if (!user) {
      router.push('/login-simple');
    }
  }, [user, router]);
  */

  if (!user) {
    return null;
  }

  const filteredMenuItems = menuItems.filter(item => 
    !item.roles || item.roles.includes(user.role)
  );

  const handleLogout = async () => {
    await logout();
  };

  const getRoleTitle = () => {
    return user.role === 'jefe' ? 'Jefe de Calidad' : 'Operario';
  };

  return (
    <div className="flex h-screen bg-white overflow-x-hidden">
      {/* Mobile Menu Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 sm:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className="fixed top-3 sm:top-4 right-3 sm:right-4 z-30 flex items-center gap-2">
        <NotificationBell />

        <Button
          variant="outline"
          size="sm"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className={`
            transition-all duration-300 ease-in-out
            bg-white border-gray-200 hover:bg-gray-50
            shadow-md hover:shadow-lg
            ${sidebarOpen ? 'ring-2 ring-blue-500' : ''}
            p-2 sm:p-3
          `}
        >
          {sidebarOpen ? <X className="h-3 w-3 sm:h-4 sm:w-4" /> : <Menu className="h-3 w-3 sm:h-4 sm:w-4" />}
        </Button>
      </div>

      {/* Sidebar */}
      <div className={`
        ${sidebarOpen ? 'w-56 sm:w-64' : 'w-0'} 
        bg-white shadow-md transition-all duration-300 ease-in-out overflow-hidden
        fixed sm:relative h-full z-40
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full sm:translate-x-0'}
      `}>
        <div className="p-3 sm:p-4 md:p-6">
          <div className="flex items-center space-x-2 sm:space-x-3">
            <img 
              src="/logo.jpg" 
              alt="CalidadCoruña Logo" 
              className="h-12 w-auto max-w-[140px] sm:h-14 sm:max-w-[160px] md:h-16 md:max-w-[180px] lg:h-18 lg:max-w-[200px] object-contain"
            />
            <div className={sidebarOpen ? 'block' : 'hidden sm:block'}>
              <h2 className="text-sm sm:text-base md:text-lg font-semibold text-gray-900">Area de Calidad</h2>
              <p className="text-xs text-gray-500">{getRoleTitle()}</p>
            </div>
          </div>
        </div>

        <nav className="mt-3 sm:mt-4 md:mt-6 px-2 sm:px-3">
          <div className="space-y-1">
            {filteredMenuItems.map((item) => {
              const Icon = item.icon;
              // Normalizar ambos textos para comparación (minúsculas y sin espacios)
              const normalizedActiveModule = activeModule.toLowerCase().replace(/\s+/g, ' ').trim();
              const normalizedItemTitle = item.title.toLowerCase().replace(/\s+/g, ' ').trim();
              const isActive = normalizedActiveModule === normalizedItemTitle;
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => {
                    setActiveModule(item.title.toLowerCase().replace(/\s+/g, ' ').trim());
                    // Close mobile menu after navigation
                    if (window.innerWidth < 640) {
                      setSidebarOpen(false);
                    }
                  }}
                  className={`
                    flex items-center px-2 sm:px-3 py-2 text-xs sm:text-sm font-medium rounded-md transition-colors
                    ${isActive 
                      ? 'bg-blue-100 text-blue-700' 
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                    }
                  `}
                >
                  <Icon className="h-3 w-3 sm:h-4 sm:w-4 mr-2 sm:mr-3 flex-shrink-0" />
                  <span className="truncate">{item.title}</span>
                </Link>
              );
            })}
          </div>
        </nav>

        {/* Botón Cerrar Sesión fijo en la parte inferior */}
        <div className="absolute bottom-0 left-0 right-0 p-2 sm:p-3 md:p-4">
          <button
            onClick={handleLogout}
            className={`
              w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors
              text-gray-600 hover:bg-red-100 hover:text-red-700
              ${sidebarOpen ? '' : 'justify-center sm:justify-start'}
            `}
          >
            <LogOut className={`${sidebarOpen ? 'mr-3' : 'mr-0 sm:mr-3'} h-4 w-4 sm:h-5 sm:w-5`} />
            <span className={`${sidebarOpen ? 'block' : 'hidden sm:block'}`}>
              Cerrar Sesión
            </span>
          </button>
        </div>
      </div>



      {/* Main Content */}
      <div className={`flex-1 overflow-auto overflow-x-hidden transition-all duration-300 ease-in-out ${sidebarOpen ? 'ml-0 sm:ml-0 pt-16 sm:pt-20' : 'ml-0 pt-16 sm:pt-20'}`}>
        {children}
      </div>
      
      {/* Toaster for notifications */}
      <Toaster />
    </div>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <DashboardLayoutWrapper>
      <DashboardLayoutContent>{children}</DashboardLayoutContent>
    </DashboardLayoutWrapper>
  );
}
