'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SupervisorTabs } from './components/supervisor-tabs';
import { useSupervisorData } from './hooks/use-supervisor-data';
import { LoadingState } from './components/loading-state';
import { ErrorState } from './components/error-state';

export default function SupervisoresPage() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState('produccion');
  
  const {
    data,
    loading,
    error,
    refresh,
    handlers
  } = useSupervisorData();

  // Redirigir si no está autenticado
  useEffect(() => {
    if (!user) {
      router.push('/login-simple');
      return;
    }
  }, [user, router]);

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  if (loading) {
    return <LoadingState />;
  }

  if (error) {
    return <ErrorState error={error} onRetry={refresh} />;
  }

  return (
    <div className="container mx-auto px-4 py-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:space-x-4">
          <Button
            variant="outline"
            onClick={() => router.push('/dashboard')}
            className="flex items-center space-x-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Volver al Dashboard</span>
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Módulo de Supervisores
            </h1>
            <p className="text-sm text-gray-600">
              Gestión de producción, embalaje y limpieza
            </p>
          </div>
        </div>
        
        <div className="hidden sm:flex items-center space-x-2">
          <span className="text-sm text-gray-500">
            Usuario: {user?.name} ({user?.role})
          </span>
        </div>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 h-auto">
          <TabsTrigger value="produccion" className="text-xs sm:text-sm whitespace-normal leading-tight py-2">
            (Produccion)RE-CAL-084
          </TabsTrigger>
          <TabsTrigger value="embalaje" className="text-xs sm:text-sm whitespace-normal leading-tight py-2">
            (Embalaje)RE-CAL-093
          </TabsTrigger>
          <TabsTrigger value="limpieza-tareas" className="text-xs sm:text-sm whitespace-normal leading-tight py-2">
            Cronograma de Limpieza
          </TabsTrigger>
          <TabsTrigger value="limpieza-registros" className="text-xs sm:text-sm whitespace-normal leading-tight py-2">
            (Limpieza)RE-CAL-037
          </TabsTrigger>
        </TabsList>

        <SupervisorTabs
          data={data}
          handlers={handlers}
          userRole={user?.role}
          onRefresh={refresh}
        />
      </Tabs>
    </div>
  );
}
