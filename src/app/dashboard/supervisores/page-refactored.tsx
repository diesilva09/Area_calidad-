'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, ClipboardList, User2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SupervisorTabs } from './components/supervisor-tabs';
import { useSupervisorData } from './hooks/use-supervisor-data';
import { LoadingState } from './components/loading-state';
import { ErrorState } from './components/error-state';

export default function SupervisoresPage() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState('produccion');

  const { data, loading, error, refresh, handlers } = useSupervisorData();

  useEffect(() => {
    if (!user) {
      router.push('/login-simple');
    }
  }, [user, router]);

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab) setActiveTab(tab);
  }, [searchParams]);

  if (loading) return <LoadingState />;
  if (error) return <ErrorState error={error} onRetry={refresh} />;

  const TABS = [
    { value: 'produccion',        label: 'RE-CAL-084',           code: 'Produccion' },
    { value: 'embalaje',          label: 'RE-CAL-093',           code: 'Embalaje' },
    { value: 'limpieza-tareas',   label: 'Cronograma Limpieza',  code: '' },
    { value: 'limpieza-registros',label: 'RE-CAL-037',           code: 'Limpieza' },
  ];

  return (
    <div className="min-h-screen bg-white-50">
      <div className="container mx-auto px-3 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6">

        {/* ── Header ── */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm px-4 py-3">
          <div className="flex items-center justify-between gap-3 flex-wrap">

            {/* Left: back + title */}
            <div className="flex items-center gap-3 min-w-0">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push('/dashboard')}
                className="flex items-center gap-1.5 text-gray-500 hover:text-gray-900 hover:bg-gray-100 shrink-0 -ml-1"
              >
                <ArrowLeft className="h-4 w-4" />
                <span className="text-sm font-medium hidden xs:inline">Volver</span>
              </Button>

              <div className="w-px h-6 bg-gray-200 shrink-0" />

              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-gray-900 flex items-center justify-center shrink-0">
                  <ClipboardList className="h-4 w-4 text-white" />
                </div>
                <div className="min-w-0">
                  <h1 className="text-base sm:text-lg font-bold text-gray-900 leading-tight truncate">
                    Módulo de Supervisores
                  </h1>
                  <p className="text-xs text-gray-400 hidden sm:block">
                    Gestión de producción, embalaje y limpieza
                  </p>
                </div>
              </div>
            </div>

            {/* Right: user badge */}
            <div className="flex items-center gap-1.5 shrink-0">
              <User2 className="h-4 w-4 text-gray-400" />
              <span className="text-sm text-gray-600 hidden sm:inline">{user?.name}</span>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-600 border border-gray-200">
                {user?.role}
              </span>
            </div>
          </div>
        </div>

        {/* ── Tabs + Content ── */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">

            {/* Tab headers */}
            <div className="border-b border-gray-200 bg-gray-50/60 px-3 pt-3">
              <TabsList className="flex h-auto bg-transparent gap-1 flex-wrap sm:flex-nowrap w-full p-0">
                {TABS.map((tab) => (
                  <TabsTrigger
                    key={tab.value}
                    value={tab.value}
                    className="
                      flex-1 min-w-[calc(50%-4px)] sm:min-w-0
                      flex flex-col items-center gap-0.5
                      px-2 py-2 rounded-t-md rounded-b-none
                      text-gray-500 border border-transparent border-b-0
                      data-[state=active]:bg-white
                      data-[state=active]:text-gray-900
                      data-[state=active]:border-gray-200
                      data-[state=active]:border-b-white
                      data-[state=active]:-mb-px
                      data-[state=active]:shadow-sm
                      hover:text-gray-700 hover:bg-white/60
                      transition-all duration-150 cursor-pointer
                    "
                  >
                    <span className="text-[11px] sm:text-xs font-semibold leading-tight text-center">
                      {tab.label}
                    </span>
                    {tab.code && (
                      <span className="text-[9px] font-mono text-gray-400 leading-none">
                        {tab.code}
                      </span>
                    )}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>

            {/* Tab content — sin padding fijo para no interferir con botones internos */}
            <div className="p-3 sm:p-5">
              <SupervisorTabs
                data={data}
                handlers={handlers}
                userRole={user?.role}
                onRefresh={refresh}
              />
            </div>
          </div>
        </Tabs>

      </div>
    </div>
  );
}