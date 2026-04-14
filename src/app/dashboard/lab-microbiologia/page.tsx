'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { Microscope, Plus, FileText, Calendar, Beaker, Pencil, Trash2, Thermometer, Clock, Settings, BarChart3, Menu, X, ChevronLeft, LayoutDashboard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ChartContainer } from '@/components/ui/chart';
import { Bar, BarChart, CartesianGrid, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AddCondicionesAmbientalesModal } from '@/components/microbiologia/add-condiciones-ambientales-modal';
import { AddTemperaturaEquiposModal } from '@/components/microbiologia/add-temperatura-equipos-modal';
import { AddMediosCultivoModal } from '@/components/microbiologia/add-medios-cultivo-modal';
import { AddEsterilizacionAutoclaveModal } from '@/components/microbiologia/add-esterilizacion-autoclave-modal';
import { AddCustodiaMuestrasModal } from '@/components/microbiologia/add-custodia-muestras-modal';
import { AddIncubadoraControlModal } from '@/components/microbiologia/add-incubadora-control-modal';
import { AddResultadosMicrobiologicosModal } from '@/components/microbiologia/add-resultados-microbiologicos-modal';
import { AddControlLavadoInactivacionModal } from '@/components/microbiologia/add-control-lavado-inactivacion-modal';
import { AddRegistrosRecepcionFormatosModal } from '@/components/microbiologia/add-registros-recepcion-formatos-modal';
import { condicionesAmbientalesService, type CondicionesAmbientales } from '@/lib/condiciones-ambientales-service';
import { temperaturaEquiposService, type TemperaturaEquipos } from '@/lib/temperatura-equipos-service';
import { mediosCultivoService, type MediosCultivo } from '@/lib/medios-cultivo-service';
import { esterilizacionAutoclaveService, type EsterilizacionAutoclave } from '@/lib/esterilizacion-autoclave-service';
import { custodiaMuestrasService, type CustodiaMuestras } from '@/lib/custodia-muestras-service';
import { incubadoraControlService, type IncubadoraControl } from '@/lib/incubadora-control-service';
import { resultadosMicrobiologicosService, type ResultadosMicrobiologicos } from '@/lib/resultados-microbiologicos-service';
import { controlLavadoInactivacionService, type ControlLavadoInactivacion } from '@/lib/control-lavado-inactivacion-service';
import { registrosRecepcionFormatosService, type RegistrosRecepcionFormatos } from '@/lib/registros-recepcion-formatos-service';
import { useToast } from '@/hooks/use-toast';

export default function LabMicrobiologiaPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const calidadMicrobiologicaMeta = 0.97;
  const mesesIndicador = [
    { value: '1', label: 'Enero' },
    { value: '2', label: 'Febrero' },
    { value: '3', label: 'Marzo' },
    { value: '4', label: 'Abril' },
    { value: '5', label: 'Mayo' },
    { value: '6', label: 'Junio' },
    { value: '7', label: 'Julio' },
    { value: '8', label: 'Agosto' },
    { value: '9', label: 'Septiembre' },
    { value: '10', label: 'Octubre' },
    { value: '11', label: 'Noviembre' },
    { value: '12', label: 'Diciembre' },
  ];
  const [isCondicionesModalOpen, setIsCondicionesModalOpen] = useState(false);
  const [isTemperaturaModalOpen, setIsTemperaturaModalOpen] = useState(false);
  const [isMediosCultivoModalOpen, setIsMediosCultivoModalOpen] = useState(false);
  const [isEsterilizacionAutoclaveModalOpen, setIsEsterilizacionAutoclaveModalOpen] = useState(false);
  const [isCustodiaMuestrasModalOpen, setIsCustodiaMuestrasModalOpen] = useState(false);
  const [isIncubadoraControlModalOpen, setIsIncubadoraControlModalOpen] = useState(false);
  const [isResultadosMicrobiologicosModalOpen, setIsResultadosMicrobiologicosModalOpen] = useState(false);
  const [isControlLavadoInactivacionModalOpen, setIsControlLavadoInactivacionModalOpen] = useState(false);
  const [isRegistrosRecepcionFormatosModalOpen, setIsRegistrosRecepcionFormatosModalOpen] = useState(false);
  const [isIndicadorModalOpen, setIsIndicadorModalOpen] = useState(false);
  const [indicadorMes, setIndicadorMes] = useState<'all' | string>('all');
  const [condicionesRegistros, setCondicionesRegistros] = useState<CondicionesAmbientales[]>([]);
  const [temperaturaRegistros, setTemperaturaRegistros] = useState<TemperaturaEquipos[]>([]);
  const [mediosCultivoRegistros, setMediosCultivoRegistros] = useState<MediosCultivo[]>([]);
  const [esterilizacionAutoclaveRegistros, setEsterilizacionAutoclaveRegistros] = useState<EsterilizacionAutoclave[]>([]);
  const [custodiaMuestrasRegistros, setCustodiaMuestrasRegistros] = useState<CustodiaMuestras[]>([]);
  const [incubadoraControlRegistros, setIncubadoraControlRegistros] = useState<IncubadoraControl[]>([]);
  const [resultadosMicrobiologicosRegistros, setResultadosMicrobiologicosRegistros] = useState<ResultadosMicrobiologicos[]>([]);
  const [controlLavadoInactivacionRegistros, setControlLavadoInactivacionRegistros] = useState<ControlLavadoInactivacion[]>([]);
  const [registrosRecepcionFormatosRegistros, setRegistrosRecepcionFormatosRegistros] = useState<RegistrosRecepcionFormatos[]>([]);
  const [editingCondiciones, setEditingCondiciones] = useState<CondicionesAmbientales | null>(null);
  const [editingTemperatura, setEditingTemperatura] = useState<TemperaturaEquipos | null>(null);
  const [editingMediosCultivo, setEditingMediosCultivo] = useState<MediosCultivo | null>(null);
  const [editingEsterilizacionAutoclave, setEditingEsterilizacionAutoclave] = useState<EsterilizacionAutoclave | null>(null);
  const [editingCustodiaMuestras, setEditingCustodiaMuestras] = useState<CustodiaMuestras | null>(null);
  const [editingIncubadoraControl, setEditingIncubadoraControl] = useState<IncubadoraControl | null>(null);
  const [editingResultadosMicrobiologicos, setEditingResultadosMicrobiologicos] = useState<ResultadosMicrobiologicos | null>(null);
  const [editingControlLavadoInactivacion, setEditingControlLavadoInactivacion] = useState<ControlLavadoInactivacion | null>(null);
  const [editingRegistrosRecepcionFormatos, setEditingRegistrosRecepcionFormatos] = useState<RegistrosRecepcionFormatos | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [vistaActual, setVistaActual] = useState<'principal' | 'condiciones' | 'temperatura' | 'medios-cultivo' | 'esterilizacion-autoclave' | 'custodia-muestras' | 'incubadora-control' | 'resultados-microbiologicos' | 'control-lavado-inactivacion' | 'registros-recepcion-formatos' | 'detalle' | 'conograma' | 'indicadores'>('principal');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [detalle, setDetalle] = useState<{ tipo: string; titulo: string; record: any } | null>(null);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [deleteConfirmContext, setDeleteConfirmContext] = useState<{
    label: string;
    run: () => Promise<void>;
  } | null>(null);

  const registrosResultadosConResultado = useMemo(() => {
    return resultadosMicrobiologicosRegistros.filter(
      (r) => Boolean(r?.fecha) && (Boolean(r.cumple) || Boolean(r.no_cumple))
    );
  }, [resultadosMicrobiologicosRegistros]);

  const registrosResultadosFiltrados = useMemo(() => {
    if (indicadorMes === 'all') return registrosResultadosConResultado;
    const month = Number(indicadorMes);
    if (!month || month < 1 || month > 12) return registrosResultadosConResultado;

    return registrosResultadosConResultado.filter((r) => {
      const d = new Date(r.fecha);
      if (Number.isNaN(d.getTime())) return false;
      return d.getMonth() + 1 === month;
    });
  }, [indicadorMes, registrosResultadosConResultado]);

  const calidadMicrobiologicaSerie = useMemo(() => {
    const bucket = new Map<
      string,
      { mes: string; total: number; cumple: number; cumplimiento: number }
    >();

    for (const registro of registrosResultadosFiltrados) {
      if (!registro?.fecha) continue;

      const date = new Date(registro.fecha);
      if (Number.isNaN(date.getTime())) continue;

      const mes = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const prev = bucket.get(mes) ?? { mes, total: 0, cumple: 0, cumplimiento: 0 };
      const nextTotal = prev.total + 1;
      const nextCumple = prev.cumple + (registro.cumple ? 1 : 0);
      bucket.set(mes, {
        mes,
        total: nextTotal,
        cumple: nextCumple,
        cumplimiento: nextTotal > 0 ? (nextCumple / nextTotal) * 100 : 0,
      });
    }

    return Array.from(bucket.values()).sort((a, b) => a.mes.localeCompare(b.mes));
  }, [registrosResultadosFiltrados]);

  const calidadMicrobiologicaResumen = useMemo(() => {
    const total = registrosResultadosFiltrados.length;
    const cumple = registrosResultadosFiltrados.filter((r) => Boolean(r.cumple)).length;
    const porcentaje = total > 0 ? (cumple / total) * 100 : 0;
    return { total, cumple, porcentaje };
  }, [registrosResultadosFiltrados]);

  useEffect(() => {
    if (!user) {
      router.push('/login-simple');
      return;
    }

    // Verificar roles permitidos
    if (user.role !== 'jefe' && user.role !== 'operario' && user.role !== 'supervisor') {
      router.push('/dashboard');
      return;
    }

    // Cargar registros existentes
    loadRegistros();
  }, [user, router]);

  const loadRegistros = async () => {
    try {
      setIsLoading(true);
      
      // Cargar los nueve tipos de registros en paralelo
      const [condicionesData, temperaturaData, mediosCultivoData, esterilizacionAutoclaveData, custodiaMuestrasData, incubadoraControlData, resultadosMicrobiologicosData, controlLavadoInactivacionData, registrosRecepcionFormatosData] = await Promise.all([
        condicionesAmbientalesService.getAll(),
        temperaturaEquiposService.getAll(),
        mediosCultivoService.getAll(),
        esterilizacionAutoclaveService.getAll(),
        custodiaMuestrasService.getAll(),
        incubadoraControlService.getAll(),
        resultadosMicrobiologicosService.getAll(),
        controlLavadoInactivacionService.getAll(),
        registrosRecepcionFormatosService.getAll()
      ]);

      setCondicionesRegistros(condicionesData);
      setTemperaturaRegistros(temperaturaData);
      setMediosCultivoRegistros(mediosCultivoData);
      setEsterilizacionAutoclaveRegistros(esterilizacionAutoclaveData);
      setCustodiaMuestrasRegistros(custodiaMuestrasData);
      setIncubadoraControlRegistros(incubadoraControlData);
      setResultadosMicrobiologicosRegistros(resultadosMicrobiologicosData);
      setControlLavadoInactivacionRegistros(controlLavadoInactivacionData);
      setRegistrosRecepcionFormatosRegistros(registrosRecepcionFormatosData);
    } catch (error) {
      console.error('Error al cargar registros:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los registros",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCondicionesSuccessfulSubmit = () => {
    loadRegistros(); // Recargar los registros después de agregar uno nuevo
  };

  const handleTemperaturaSuccessfulSubmit = () => {
    loadRegistros(); // Recargar los registros después de agregar uno nuevo
  };

  const handleMediosCultivoSuccessfulSubmit = () => {
    loadRegistros(); // Recargar los registros después de agregar uno nuevo
  };

  const handleEsterilizacionAutoclaveSuccessfulSubmit = () => {
    loadRegistros(); // Recargar los registros después de agregar uno nuevo
  };

  const handleCustodiaMuestrasSuccessfulSubmit = () => {
    loadRegistros(); // Recargar los registros después de agregar uno nuevo
  };

  const handleIncubadoraControlSuccessfulSubmit = () => {
    loadRegistros(); // Recargar los registros después de agregar uno nuevo
  };

  const handleResultadosMicrobiologicosSuccessfulSubmit = () => {
    loadRegistros(); // Recargar los registros después de agregar uno nuevo
  };

  const handleControlLavadoInactivacionSuccessfulSubmit = () => {
    loadRegistros(); // Recargar los registros después de agregar uno nuevo
  };

  const handleRegistrosRecepcionFormatosSuccessfulSubmit = () => {
    loadRegistros(); // Recargar los registros después de agregar uno nuevo
  };

  const handleVerCondiciones = () => {
    setVistaActual('condiciones');
  };

  const handleVerTemperatura = () => {
    setVistaActual('temperatura');
  };

  const handleVerMediosCultivo = () => {
    setVistaActual('medios-cultivo');
  };

  const handleVerEsterilizacionAutoclave = () => {
    setVistaActual('esterilizacion-autoclave');
  };

  const handleVerCustodiaMuestras = () => {
    setVistaActual('custodia-muestras');
  };

  const handleVerIncubadoraControl = () => {
    setVistaActual('incubadora-control');
  };

  const handleVerResultadosMicrobiologicos = () => {
    setVistaActual('resultados-microbiologicos');
  };

  const handleVerControlLavadoInactivacion = () => {
    setVistaActual('control-lavado-inactivacion');
  };

  const handleVerRegistrosRecepcionFormatos = () => {
    setVistaActual('registros-recepcion-formatos');
  };

  const handleVolverPrincipal = () => {
    setVistaActual('principal');
  };

  const openDetalle = (tipo: string, titulo: string, record: any) => {
    setDetalle({ tipo, titulo, record });
    setVistaActual('detalle');
  };

  const formatDetalleLabel = (key: string) => {
    return key
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase());
  };

  const renderDetalleValue = (value: any) => {
    if (value === null || value === undefined || value === '') return '-';
    if (typeof value === 'boolean') return value ? 'Sí' : 'No';
    if (typeof value === 'string') {
      const isIsoDateLike = /^\d{4}-\d{2}-\d{2}(T.*)?$/.test(value);
      if (isIsoDateLike) {
        const d = new Date(value);
        if (!Number.isNaN(d.getTime())) return d.toLocaleString('es-ES');
      }
    }
    return String(value);
  };

  const renderDetalleGrid = (items: Array<{ label: string; value: any }>) => {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map((it) => (
          <div key={it.label} className="rounded-lg border bg-white p-3">
            <p className="text-xs font-medium text-gray-500">{it.label}</p>
            <p className="text-sm text-gray-900 mt-1 break-words">{renderDetalleValue(it.value)}</p>
          </div>
        ))}
      </div>
    );
  };

  const getVistaTitulo = () => {
    const titulos: Record<string, string> = {
      principal: 'Registros',
      condiciones: 'RE-CAL-021 - Condiciones Ambientales',
      temperatura: 'RE-CAL-016 - Temperatura Equipos',
      'medios-cultivo': 'RE-CAL-023 - Medios de Cultivo',
      'esterilizacion-autoclave': 'RE-CAL-063 - Esterilización Autoclave',
      'custodia-muestras': 'RE-CAL-096 - Custodia de Muestras',
      'incubadora-control': 'RE-CAL-089 - Control de Incubadora',
      'resultados-microbiologicos': 'RE-CAL-046 - Resultados Microbiológicos',
      'control-lavado-inactivacion': 'RE-CAL-111 - Control Lavado e Inactivación',
      'registros-recepcion-formatos': 'RE-CAL-086 - Registros Recepción Formatos',
      conograma: 'Cronogramas',
      indicadores: 'Indicadores BPM',
      detalle: detalle?.titulo || 'Detalle',
    };
    return titulos[vistaActual] || 'LAB. MICROBIOLOGÍA';
  };

  const handleDelete = async (opts: { id?: string; label: string; run: () => Promise<void> }) => {
    if (!opts.id) {
      toast({
        title: 'Error',
        description: 'No se encontró el ID del registro.',
        variant: 'destructive',
      });
      return;
    }

    setDeleteConfirmContext({
      label: opts.label,
      run: opts.run,
    });
    setIsDeleteConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!deleteConfirmContext) return;

    try {
      await deleteConfirmContext.run();
      toast({
        title: 'Registro eliminado',
        description: `El registro de ${deleteConfirmContext.label} fue eliminado correctamente.`,
      });
      loadRegistros();
    } catch (error) {
      console.error('Error al eliminar registro:', error);
      toast({
        title: 'Error',
        description: `No se pudo eliminar el registro de ${deleteConfirmContext.label}.`,
        variant: 'destructive',
      });
    } finally {
      setIsDeleteConfirmOpen(false);
      setDeleteConfirmContext(null);
    }
  };

  // Componente Sidebar Item
  const SidebarItem = ({ 
    id, 
    icon: Icon, 
    title, 
    subtitle, 
    color = 'gray',
    count
  }: { 
    id: string; 
    icon: any; 
    title: string; 
    subtitle?: string;
    color?: 'blue' | 'green' | 'yellow' | 'purple' | 'indigo' | 'cyan' | 'pink' | 'gray' | 'violet' | 'orange';
    count?: number;
  }) => {
    const isActive = vistaActual === id;
    const colors = {
      blue: { bg: 'bg-blue-50', text: 'text-blue-700', icon: 'text-blue-600' },
      green: { bg: 'bg-green-50', text: 'text-green-700', icon: 'text-green-600' },
      yellow: { bg: 'bg-yellow-50', text: 'text-yellow-700', icon: 'text-yellow-600' },
      purple: { bg: 'bg-purple-50', text: 'text-purple-700', icon: 'text-purple-600' },
      indigo: { bg: 'bg-indigo-50', text: 'text-indigo-700', icon: 'text-indigo-600' },
      cyan: { bg: 'bg-cyan-50', text: 'text-cyan-700', icon: 'text-cyan-600' },
      pink: { bg: 'bg-pink-50', text: 'text-pink-700', icon: 'text-pink-600' },
      gray: { bg: 'bg-gray-50', text: 'text-gray-700', icon: 'text-gray-600' },
      violet: { bg: 'bg-violet-50', text: 'text-violet-700', icon: 'text-violet-600' },
      orange: { bg: 'bg-orange-50', text: 'text-orange-700', icon: 'text-orange-600' },
    };
    const c = colors[color];
    
    return (
      <button
        onClick={() => {
          setVistaActual(id as any);
          setSidebarOpen(false);
        }}
        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200 group ${
          isActive ? `${c.bg} ${c.text} font-medium` : 'text-gray-700 hover:bg-gray-100'
        }`}
      >
        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isActive ? 'bg-white/60' : 'bg-gray-100 group-hover:bg-white'}`}>
          <Icon className={`w-4 h-4 ${isActive ? c.icon : 'text-gray-500'}`} />
        </div>
        <div className="flex-1 text-left">
          <div className="font-medium">{title}</div>
          {subtitle && <div className="text-xs text-gray-500">{subtitle}</div>}
        </div>
        {count !== undefined && count > 0 && (
          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{count}</span>
        )}
      </button>
    );
  };

  if (!user || (user.role !== 'jefe' && user.role !== 'operario' && user.role !== 'supervisor')) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Overlay móvil */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* SIDEBAR */}
      <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-72 bg-white border-r border-gray-200 flex flex-col transform transition-transform duration-300 ease-in-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <Microscope className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-gray-900 text-sm">LAB. MICROBIOLOGÍA</h1>
              <p className="text-xs text-gray-500">Sistema de Gestión</p>
            </div>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="absolute top-4 right-4 lg:hidden p-1 rounded-md hover:bg-gray-100">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Menú */}
        <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
          <div className="px-3 py-2 text-xs font-semibold text-gray-400 uppercase">Módulos</div>
          <SidebarItem 
            id="principal" 
            icon={FileText} 
            title="Registros" 
            subtitle="Formatos RE-CAL" 
            color="blue" 
            count={condicionesRegistros.length + temperaturaRegistros.length + mediosCultivoRegistros.length + esterilizacionAutoclaveRegistros.length + custodiaMuestrasRegistros.length + incubadoraControlRegistros.length + resultadosMicrobiologicosRegistros.length + controlLavadoInactivacionRegistros.length + registrosRecepcionFormatosRegistros.length} 
          />
          <SidebarItem 
            id="conograma" 
            icon={Clock} 
            title="Cronogramas" 
            subtitle="Planificación de actividades" 
            color="violet" 
          />
        </nav>
      </aside>

      {/* CONTENIDO PRINCIPAL */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Header móvil */}
        <header className="lg:hidden bg-white border-b border-gray-200 p-4 flex items-center justify-between">
          <button onClick={() => setSidebarOpen(true)} className="p-2 rounded-md hover:bg-gray-100">
            <Menu className="w-5 h-5" />
          </button>
          <h1 className="font-semibold text-gray-900">{getVistaTitulo()}</h1>
          <div className="w-10" />
        </header>

        {/* Área de contenido */}
        <div className="flex-1 p-4 lg:p-6 overflow-y-auto">
          <AlertDialog
            open={isDeleteConfirmOpen}
            onOpenChange={(open) => {
              setIsDeleteConfirmOpen(open);
              if (!open) setDeleteConfirmContext(null);
            }}
          >
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Confirmar eliminación</AlertDialogTitle>
                <AlertDialogDescription>
                  {deleteConfirmContext
                    ? `¿Eliminar este registro de ${deleteConfirmContext.label}? Esta acción no se puede deshacer.`
                    : '¿Eliminar este registro? Esta acción no se puede deshacer.'}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction
                  className="bg-red-600 hover:bg-red-700"
                  onClick={(e) => {
                    e.preventDefault();
                    confirmDelete();
                  }}
                >
                  Eliminar
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          {/* Header Desktop */}
          <div className="hidden lg:flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{getVistaTitulo()}</h1>
              <p className="text-sm text-gray-500 mt-1">
                {vistaActual === 'principal' && 'Gestión de formatos RE-CAL'}
                {vistaActual === 'conograma' && 'Planificación de actividades'}
              </p>
            </div>
            {vistaActual !== 'principal' && vistaActual !== 'detalle' && (
              <Button variant="outline" onClick={() => setVistaActual('principal')}>
                <ChevronLeft className="w-4 h-4 mr-2" />
                Volver a Registros
              </Button>
            )}
          </div>

      {vistaActual === 'detalle' && detalle && (
        <>
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{detalle.titulo}</h1>
              <p className="text-gray-600 mt-2">Detalle del registro</p>
            </div>
            <Button
              onClick={() => setVistaActual(detalle.tipo as any)}
              variant="outline"
            >
              Volver
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Información</CardTitle>
              <CardDescription>Campos del registro seleccionado</CardDescription>
            </CardHeader>
            <CardContent>
              {renderDetalleGrid(
                Object.entries(detalle.record ?? {})
                  .sort(([a], [b]) => a.localeCompare(b))
                  .map(([key, value]) => ({
                    label: formatDetalleLabel(key),
                    value,
                  }))
              )}
            </CardContent>
          </Card>
        </>
      )}

      {/* Vista Principal - Tarjetas de registros */}
      {vistaActual === 'principal' && (
        <>
          <div className="mb-4 sm:mb-6">
            <div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">LAB. MICROBIOLOGÍA</h1>
              <p className="text-gray-600 mt-1 sm:mt-2 text-xs sm:text-sm md:text-base">
                Módulo de análisis microbiológicos y control de calidad microbiológica.
              </p>
            </div>
          </div>

          {/* Formatos Disponibles */}
          <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
            {/* RE-CAL-021 - Condiciones Ambientales */}
            <Card 
              className="group border-blue-200 bg-white hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 cursor-pointer"
              onClick={handleVerCondiciones}
            >
              <CardHeader className="p-3 sm:p-4 md:p-6">
                <div className="flex items-center space-x-2 sm:space-x-3">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <Calendar className="w-4 h-4 sm:w-6 sm:h-6 text-blue-600" />
                  </div>
                  <div>
                    <CardTitle className="text-sm sm:text-base md:text-lg">RE-CAL-021</CardTitle>
                    <CardDescription className="text-xs sm:text-sm">
                      Condiciones Ambientales
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-3 sm:p-4 md:p-6">
                <div className="space-y-2 sm:space-y-3">
                  <div className="text-xs sm:text-sm text-gray-600">
                    <p><strong>Código:</strong> RE-CAL-021</p>
                    <p><strong>Versión:</strong> 2</p>
                    <p><strong>Aprobación:</strong> 03-may-2021</p>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4">
                    <span className="text-xs sm:text-sm text-gray-500">
                      {condicionesRegistros.length} registros
                    </span>
                    <Button 
                      size="sm" 
                      variant="outline"
                      className="text-xs sm:text-sm px-2 sm:px-4 py-2"
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingCondiciones(null);
                        setIsCondicionesModalOpen(true);
                      }}
                    >
                      <FileText className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                      <span className="hidden xs:inline sm:inline">Nuevo</span>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* RE-CAL-016 - Temperatura Equipos */}
            <Card 
              className="group border-green-200 bg-white hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 cursor-pointer"
              onClick={handleVerTemperatura}
            >
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                    <Thermometer className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">RE-CAL-016</CardTitle>
                    <CardDescription>
                      Temperatura Equipos
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="text-sm text-gray-600">
                    <p><strong>Código:</strong> RE-CAL-016</p>
                    <p><strong>Versión:</strong> 2</p>
                    <p><strong>Aprobación:</strong> 03-may-2021</p>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">
                      {temperaturaRegistros.length} registros
                    </span>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingTemperatura(null);
                        setIsTemperaturaModalOpen(true);
                      }}
                    >
                      <FileText className="w-4 h-4 mr-1" />
                      Nuevo
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* RE-CAL-022 - Medios de Cultivo */}
            <Card 
              className="group border-purple-200 bg-white hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 cursor-pointer"
              onClick={handleVerMediosCultivo}
            >
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                    <Beaker className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">RE-CAL-022</CardTitle>
                    <CardDescription>
                      Medios de Cultivo
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="text-sm text-gray-600">
                    <p><strong>Código:</strong> RE-CAL-022</p>
                    <p><strong>Versión:</strong> 2</p>
                    <p><strong>Aprobación:</strong> FEBRERO 28 DE 2020</p>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">
                      {mediosCultivoRegistros.length} registros
                    </span>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingMediosCultivo(null);
                        setIsMediosCultivoModalOpen(true);
                      }}
                    >
                      <FileText className="w-4 h-4 mr-1" />
                      Nuevo
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* RE-CAL-017 - Esterilización en Autoclave */}
            <Card 
              className="group border-orange-200 bg-white hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 cursor-pointer"
              onClick={handleVerEsterilizacionAutoclave}
            >
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                    <Microscope className="w-6 h-6 text-orange-600" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">RE-CAL-017</CardTitle>
                    <CardDescription>
                      Esterilización en Autoclave
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="text-sm text-gray-600">
                    <p><strong>Código:</strong> RE-CAL-017</p>
                    <p><strong>Versión:</strong> 2</p>
                    <p><strong>Aprobación:</strong> 03-may-2021</p>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">
                      {esterilizacionAutoclaveRegistros.length} registros
                    </span>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingEsterilizacionAutoclave(null);
                        setIsEsterilizacionAutoclaveModalOpen(true);
                      }}
                    >
                      <FileText className="w-4 h-4 mr-1" />
                      Nuevo
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* RE-CAL-107 - Custodia de Muestras */}
            <Card 
              className="group border-red-200 bg-white hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 cursor-pointer"
              onClick={handleVerCustodiaMuestras}
            >
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                    <FileText className="w-6 h-6 text-red-600" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">RE-CAL-107</CardTitle>
                    <CardDescription>
                      Custodia de Muestras
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="text-sm text-gray-600">
                    <p><strong>Código:</strong> RE-CAL-107</p>
                    <p><strong>Versión:</strong> 2</p>
                    <p><strong>Aprobación:</strong> Marzo 10 de 2022</p>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">
                      {custodiaMuestrasRegistros.length} registros
                    </span>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingCustodiaMuestras(null);
                        setIsCustodiaMuestrasModalOpen(true);
                      }}
                    >
                      <FileText className="w-4 h-4 mr-1" />
                      Nuevo
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* RE-CAL-089 - Control de Incubadora */}
            <Card 
              className="group border-teal-200 bg-white hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 cursor-pointer"
              onClick={handleVerIncubadoraControl}
            >
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-teal-100 rounded-full flex items-center justify-center">
                    <Calendar className="w-6 h-6 text-teal-600" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">RE-CAL-089</CardTitle>
                    <CardDescription>
                      Control de Incubadora
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="text-sm text-gray-600">
                    <p><strong>Código:</strong> RE-CAL-089</p>
                    <p><strong>Versión:</strong> 1</p>
                    <p><strong>Aprobación:</strong> Noviembre 07 de 2025</p>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">
                      {incubadoraControlRegistros.length} registros
                    </span>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingIncubadoraControl(null);
                        setIsIncubadoraControlModalOpen(true);
                      }}
                    >
                      <FileText className="w-4 h-4 mr-1" />
                      Nuevo
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* RE-CAL-046 - Resultados Microbiológicos */}
            <Card 
              className="group border-indigo-200 bg-white hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 cursor-pointer"
              onClick={handleVerResultadosMicrobiologicos}
            >
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center">
                    <Microscope className="w-6 h-6 text-indigo-600" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">RE-CAL-046</CardTitle>
                    <CardDescription>
                      Resultados Microbiológicos
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="text-sm text-gray-600">
                    <p><strong>Código:</strong> RE-CAL-046</p>
                    <p><strong>Versión:</strong> 4</p>
                    <p><strong>Aprobación:</strong> Abril 22 de 2024</p>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">
                      {resultadosMicrobiologicosRegistros.length} registros
                    </span>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingResultadosMicrobiologicos(null);
                        setIsResultadosMicrobiologicosModalOpen(true);
                      }}
                    >
                      <FileText className="w-4 h-4 mr-1" />
                      Nuevo
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* RE-CAL-111 - Control Lavado e Inactivación */}
            <Card 
              className="group border-cyan-200 bg-white hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 cursor-pointer"
              onClick={handleVerControlLavadoInactivacion}
            >
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-cyan-100 rounded-full flex items-center justify-center">
                    <Beaker className="w-6 h-6 text-cyan-600" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">RE-CAL-111</CardTitle>
                    <CardDescription>
                      Control Lavado e Inactivación
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="text-sm text-gray-600">
                    <p><strong>Código:</strong> RE-CAL-111</p>
                    <p><strong>Versión:</strong> 1</p>
                    <p><strong>Aprobación:</strong> Julio 01 de 2020</p>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">
                      {controlLavadoInactivacionRegistros.length} registros
                    </span>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingControlLavadoInactivacion(null);
                        setIsControlLavadoInactivacionModalOpen(true);
                      }}
                    >
                      <FileText className="w-4 h-4 mr-1" />
                      Nuevo
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* RE-CAL-100 - Registros Recepción Formatos */}
            <Card 
              className="group border-amber-200 bg-white hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 cursor-pointer"
              onClick={handleVerRegistrosRecepcionFormatos}
            >
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center">
                    <FileText className="w-6 h-6 text-amber-600" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">RE-CAL-100</CardTitle>
                    <CardDescription>
                      Registros Recepción Formatos
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="text-sm text-gray-600">
                    <p><strong>Código:</strong> RE-CAL-100</p>
                    <p><strong>Versión:</strong> 1</p>
                    <p><strong>Aprobación:</strong> Abril 24 de 2020</p>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">
                      {registrosRecepcionFormatosRegistros.length} registros
                    </span>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingRegistrosRecepcionFormatos(null);
                        setIsRegistrosRecepcionFormatosModalOpen(true);
                      }}
                    >
                      <FileText className="w-4 h-4 mr-1" />
                      Nuevo
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}

      {/* Vista de Condiciones Ambientales */}
      {vistaActual === 'condiciones' && (
        <>
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">RE-CAL-021 - Condiciones Ambientales</h1>
              <p className="text-gray-600 mt-2">
                Registro de condiciones ambientales del laboratorio de microbiología
              </p>
            </div>
            <Button 
              onClick={handleVolverPrincipal}
              variant="outline"
            >
              Volver
            </Button>
          </div>

          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Registros de Condiciones Ambientales</CardTitle>
                  <CardDescription>
                    Todos los registros de condiciones ambientales del laboratorio
                  </CardDescription>
                </div>
                <Button onClick={() => {
                  setEditingCondiciones(null);
                  setIsCondicionesModalOpen(true);
                }}>
                  <Plus className="w-4 h-4 mr-2" />
                  Nuevo Registro
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">Cargando registros...</p>
                </div>
              ) : condicionesRegistros.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                    <Calendar className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">
                    No hay registros
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Comienza agregando tu primer registro de condiciones ambientales.
                  </p>
                  <Button onClick={() => {
                    setEditingCondiciones(null);
                    setIsCondicionesModalOpen(true);
                  }}>
                    <Plus className="w-4 h-4 mr-2" />
                    Agregar Primer Registro
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {condicionesRegistros.map((registro: any) => (
                    <div
                      key={registro.id}
                      className="border rounded-lg p-4 cursor-pointer hover:bg-gray-50"
                      onClick={() => openDetalle('condiciones', 'RE-CAL-021 - Condiciones Ambientales', registro)}
                    >
                      <div className="flex items-center justify-end gap-2 mb-3">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingCondiciones(registro);
                            setIsCondicionesModalOpen(true);
                          }}
                        >
                          <Pencil className="w-4 h-4 mr-1" />
                          Editar
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete({
                              id: registro.id,
                              label: 'Condiciones Ambientales',
                              run: () => condicionesAmbientalesService.delete(registro.id),
                            });
                          }}
                        >
                          <Trash2 className="w-4 h-4 mr-1" />
                          Eliminar
                        </Button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
                        <div>
                          <p className="text-sm font-medium text-gray-700">Fecha</p>
                          <p className="text-sm text-gray-900">
                            {new Date(registro.fecha).toLocaleDateString('es-ES')}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-700">Hora</p>
                          <p className="text-sm text-gray-900">{registro.hora}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-700">Temperatura</p>
                          <p className="text-sm text-gray-900">{registro.temperatura}°C</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-700">Humedad</p>
                          <p className="text-sm text-gray-900">{registro.humedad_relativa}%</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-700">Responsable</p>
                          <p className="text-sm text-gray-900">{registro.responsable}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-700">Observaciones</p>
                          <p className="text-sm text-gray-900">
                            {registro.observaciones || 'N/A'}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {/* Vista de Temperatura Equipos */}
      {vistaActual === 'temperatura' && (
        <>
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between p-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">RE-CAL-016 - Temperatura Equipos</h1>
              <p className="text-gray-600 mt-2">
                Registro de temperatura de equipos del laboratorio de microbiología
              </p>
            </div>
            <Button 
              onClick={handleVolverPrincipal}
              variant="outline"
            >
              Volver
            </Button>
          </div>

          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Registros de Temperatura Equipos</CardTitle>
                  <CardDescription>
                    Todos los registros de temperatura de equipos del laboratorio
                  </CardDescription>
                </div>
                <Button onClick={() => {
                  setEditingTemperatura(null);
                  setIsTemperaturaModalOpen(true);
                }}>
                  <Plus className="w-4 h-4 mr-2" />
                  Nuevo Registro
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">Cargando registros...</p>
                </div>
              ) : temperaturaRegistros.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                    <Thermometer className="h-8 w-8 text-green-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">
                    No hay registros
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Comienza agregando tu primer registro de temperatura de equipos.
                  </p>
                  <Button onClick={() => {
                    setEditingTemperatura(null);
                    setIsTemperaturaModalOpen(true);
                  }}>
                    <Plus className="w-4 h-4 mr-2" />
                    Agregar Primer Registro
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {temperaturaRegistros.map((registro: any) => (
                    <div
                      key={registro.id}
                      className="border rounded-lg p-4 cursor-pointer hover:bg-gray-50"
                      onClick={() => openDetalle('temperatura', 'RE-CAL-016 - Temperatura Equipos', registro)}
                    >
                      <div className="flex items-center justify-end gap-2 mb-3">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingTemperatura(registro);
                            setIsTemperaturaModalOpen(true);
                          }}
                        >
                          <Pencil className="w-4 h-4 mr-1" />
                          Editar
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete({
                              id: registro.id,
                              label: 'Temperatura Equipos',
                              run: () => temperaturaEquiposService.delete(registro.id),
                            });
                          }}
                        >
                          <Trash2 className="w-4 h-4 mr-1" />
                          Eliminar
                        </Button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
                        <div>
                          <p className="text-sm font-medium text-gray-700">Fecha</p>
                          <p className="text-sm text-gray-900">
                            {(() => {
                              const serial = Number(registro.fecha);
                              if (Number.isFinite(serial) && serial > 1000) {
                                // Excel serial date
                                const epoch = new Date(1900, 0, 1);
                                const adjustment = serial > 60 ? 1 : 0;
                                const days = serial - 1 - adjustment;
                                const date = new Date(epoch);
                                date.setDate(epoch.getDate() + days);
                                return date.toLocaleDateString('es-ES');
                              }
                              return registro.fecha || '-';
                            })()}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-700">Horario</p>
                          <p className="text-sm text-gray-900">{registro.horario}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-700">Incubadora 037</p>
                          <p className="text-sm text-gray-900">{registro.incubadora_037}°C</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-700">Incubadora 038</p>
                          <p className="text-sm text-gray-900">{registro.incubadora_038}°C</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-700">Nevera</p>
                          <p className="text-sm text-gray-900">{registro.nevera}°C</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-700">Realizado por</p>
                          <p className="text-sm text-gray-900">{registro.realizado_por}</p>
                        </div>
                      </div>
                      {registro.observaciones && (
                        <div className="mt-3 pt-3 border-t">
                          <p className="text-sm font-medium text-gray-700">Observaciones</p>
                          <p className="text-sm text-gray-900">{registro.observaciones}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {/* Vista de Medios de Cultivo */}
      {vistaActual === 'medios-cultivo' && (
        <>
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between p-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">RE-CAL-022 - Medios de Cultivo</h1>
              <p className="text-gray-600 mt-2">
                Registro de preparación de medios de cultivo y control negativo
              </p>
            </div>
            <Button 
              onClick={handleVolverPrincipal}
              variant="outline"
            >
              Volver
            </Button>
          </div>

          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Registros de Medios de Cultivo</CardTitle>
                  <CardDescription>
                    Todos los registros de preparación de medios de cultivo
                  </CardDescription>
                </div>
                <Button onClick={() => {
                  setEditingMediosCultivo(null);
                  setIsMediosCultivoModalOpen(true);
                }}>
                  <Plus className="w-4 h-4 mr-2" />
                  Nuevo Registro
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">Cargando registros...</p>
                </div>
              ) : mediosCultivoRegistros.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                    <Beaker className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">
                    No hay registros
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Comienza agregando tu primer registro de medios de cultivo.
                  </p>
                  <Button onClick={() => {
                    setEditingMediosCultivo(null);
                    setIsMediosCultivoModalOpen(true);
                  }}>
                    <Plus className="w-4 h-4 mr-2" />
                    Agregar Primer Registro
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {mediosCultivoRegistros.map((registro: any) => (
                    <div
                      key={registro.id}
                      className="border rounded-lg p-4 cursor-pointer hover:bg-gray-50"
                      onClick={() => openDetalle('medios-cultivo', 'RE-CAL-022 - Medios de Cultivo', registro)}
                    >
                      <div className="flex items-center justify-end gap-2 mb-3">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingMediosCultivo(registro);
                            setIsMediosCultivoModalOpen(true);
                          }}
                        >
                          <Pencil className="w-4 h-4 mr-1" />
                          Editar
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete({
                              id: registro.id,
                              label: 'Medios de Cultivo',
                              run: () => mediosCultivoService.delete(registro.id),
                            });
                          }}
                        >
                          <Trash2 className="w-4 h-4 mr-1" />
                          Eliminar
                        </Button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
                        <div>
                          <p className="text-sm font-medium text-gray-700">Fecha</p>
                          <p className="text-sm text-gray-900">{new Date(registro.fecha).toLocaleDateString('es-ES')}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-700">Medio</p>
                          <p className="text-sm text-gray-900">{registro.medio}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-700">Lote</p>
                          <p className="text-sm text-gray-900">{registro.lote}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-700">Vencimiento</p>
                          <p className="text-sm text-gray-900">{new Date(registro.fecha_vencimiento).toLocaleDateString('es-ES')}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-700">Preparado por</p>
                          <p className="text-sm text-gray-900">{registro.preparado_por}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-700">Autoclave</p>
                          <p className="text-sm text-gray-900">{registro.autoclave}</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-3 pt-3 border-t">
                        <div>
                          <p className="text-sm font-medium text-gray-700">Temperatura</p>
                          <p className="text-sm text-gray-900">{registro.temperatura}°C</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-700">Presión</p>
                          <p className="text-sm text-gray-900">{registro.presion} psi</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-700">Tiempo</p>
                          <p className="text-sm text-gray-900">{registro.tiempo} min</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-700">Control Negativo</p>
                          <p className="text-sm text-gray-900">{registro.control_negativo}</p>
                        </div>
                      </div>
                      {registro.observaciones && (
                        <div className="mt-3 pt-3 border-t">
                          <p className="text-sm font-medium text-gray-700">Observaciones</p>
                          <p className="text-sm text-gray-900">{registro.observaciones}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {/* Vista de Esterilización en Autoclave */}
      {vistaActual === 'esterilizacion-autoclave' && (
        <>
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between p-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">RE-CAL-017 - Esterilización en Autoclave</h1>
              <p className="text-gray-600 mt-2">
                Registro de proceso de esterilización en autoclave microbiología
              </p>
            </div>
            <Button 
              onClick={handleVolverPrincipal}
              variant="outline"
            >
              Volver
            </Button>
          </div>

          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Registros de Esterilización en Autoclave</CardTitle>
                  <CardDescription>
                    Todos los registros de esterilización en autoclave del laboratorio
                  </CardDescription>
                </div>
                <Button onClick={() => {
                  setEditingEsterilizacionAutoclave(null);
                  setIsEsterilizacionAutoclaveModalOpen(true);
                }}>
                  <Plus className="w-4 h-4 mr-2" />
                  Nuevo Registro
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">Cargando registros...</p>
                </div>
              ) : esterilizacionAutoclaveRegistros.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                    <Microscope className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">
                    No hay registros
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Comienza agregando tu primer registro de esterilización en autoclave.
                  </p>
                  <Button onClick={() => {
                    setEditingEsterilizacionAutoclave(null);
                    setIsEsterilizacionAutoclaveModalOpen(true);
                  }}>
                    <Plus className="w-4 h-4 mr-2" />
                    Agregar Primer Registro
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {esterilizacionAutoclaveRegistros.map((registro: any) => (
                    <div
                      key={registro.id}
                      className="border rounded-lg p-4 cursor-pointer hover:bg-gray-50"
                      onClick={() => openDetalle('esterilizacion-autoclave', 'RE-CAL-017 - Esterilización en Autoclave', registro)}
                    >
                      <div className="flex items-center justify-end gap-2 mb-3">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingEsterilizacionAutoclave(registro);
                            setIsEsterilizacionAutoclaveModalOpen(true);
                          }}
                        >
                          <Pencil className="w-4 h-4 mr-1" />
                          Editar
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete({
                              id: registro.id,
                              label: 'Esterilización Autoclave',
                              run: () => esterilizacionAutoclaveService.delete(registro.id),
                            });
                          }}
                        >
                          <Trash2 className="w-4 h-4 mr-1" />
                          Eliminar
                        </Button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
                        <div>
                          <p className="text-sm font-medium text-gray-700">Fecha</p>
                          <p className="text-sm text-gray-900">{new Date(registro.fecha).toLocaleDateString('es-ES')}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-700">Elementos</p>
                          <p className="text-sm text-gray-900">{registro.elementos_medios_cultivo}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-700">Inicio Ciclo</p>
                          <p className="text-sm text-gray-900">{registro.inicio_ciclo_hora}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-700">Fin Ciclo</p>
                          <p className="text-sm text-gray-900">{registro.fin_ciclo_hora}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-700">Cinta Indicadora</p>
                          <p className="text-sm text-gray-900">{registro.cinta_indicadora}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-700">Realizado por</p>
                          <p className="text-sm text-gray-900">{registro.realizado_por}</p>
                        </div>
                      </div>
                      {registro.observaciones && (
                        <div className="mt-3 pt-3 border-t">
                          <p className="text-sm font-medium text-gray-700">Observaciones</p>
                          <p className="text-sm text-gray-900">{registro.observaciones}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {/* Vista de Custodia de Muestras */}
      {vistaActual === 'custodia-muestras' && (
        <>
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between p-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">RE-CAL-107 - Custodia de Muestras</h1>
              <p className="text-gray-600 mt-2">
                Registro y cadena de custodia de muestras análisis interno
              </p>
            </div>
            <Button 
              onClick={handleVolverPrincipal}
              variant="outline"
            >
              Volver
            </Button>
          </div>

          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Registros de Custodia de Muestras</CardTitle>
                  <CardDescription>
                    Todos los registros de custodia de muestras del laboratorio
                  </CardDescription>
                </div>
                <Button onClick={() => {
                  setEditingCustodiaMuestras(null);
                  setIsCustodiaMuestrasModalOpen(true);
                }}>
                  <Plus className="w-4 h-4 mr-2" />
                  Nuevo Registro
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">Cargando registros...</p>
                </div>
              ) : custodiaMuestrasRegistros.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                    <FileText className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">
                    No hay registros
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Comienza agregando tu primer registro de custodia de muestras.
                  </p>
                  <Button onClick={() => {
                    setEditingCustodiaMuestras(null);
                    setIsCustodiaMuestrasModalOpen(true);
                  }}>
                    <Plus className="w-4 h-4 mr-2" />
                    Agregar Primer Registro
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {custodiaMuestrasRegistros.map((registro: any) => (
                    <div
                      key={registro.id}
                      className="border rounded-lg p-4 cursor-pointer hover:bg-gray-50"
                      onClick={() => openDetalle('custodia-muestras', 'RE-CAL-107 - Custodia de Muestras', registro)}
                    >
                      <div className="flex items-center justify-end gap-2 mb-3">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingCustodiaMuestras(registro);
                            setIsCustodiaMuestrasModalOpen(true);
                          }}
                        >
                          <Pencil className="w-4 h-4 mr-1" />
                          Editar
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete({
                              id: registro.id,
                              label: 'Custodia de Muestras',
                              run: () => custodiaMuestrasService.delete(registro.id),
                            });
                          }}
                        >
                          <Trash2 className="w-4 h-4 mr-1" />
                          Eliminar
                        </Button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
                        <div>
                          <p className="text-sm font-medium text-gray-700">Código</p>
                          <p className="text-sm text-gray-900">{registro.codigo}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-700">Tipo</p>
                          <p className="text-sm text-gray-900">{registro.tipo}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-700">ID Muestra</p>
                          <p className="text-sm text-gray-900">{registro.muestra_id}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-700">Área</p>
                          <p className="text-sm text-gray-900">{registro.area}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-700">Temperatura</p>
                          <p className="text-sm text-gray-900">{registro.temperatura}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-700">Cantidad</p>
                          <p className="text-sm text-gray-900">{registro.cantidad}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-700">Toma Muestra</p>
                          <p className="text-sm text-gray-900">
                            {new Date(registro.toma_muestra_fecha).toLocaleDateString('es-ES')} {registro.toma_muestra_hora}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-700">Recepción Lab</p>
                          <p className="text-sm text-gray-900">
                            {new Date(registro.recepcion_lab_fecha).toLocaleDateString('es-ES')} {registro.recepcion_lab_hora}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-700">Responsable</p>
                          <p className="text-sm text-gray-900">{registro.responsable}</p>
                        </div>
                      </div>
                      {registro.observaciones && (
                        <div className="mt-3 pt-3 border-t">
                          <p className="text-sm font-medium text-gray-700">Observaciones</p>
                          <p className="text-sm text-gray-900">{registro.observaciones}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {/* Vista de Control de Incubadora */}
      {vistaActual === 'incubadora-control' && (
        <>
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between p-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">RE-CAL-089 - Control de Incubadora</h1>
              <p className="text-gray-600 mt-2">
                Registro de operación y control de incubadora del laboratorio
              </p>
            </div>
            <Button 
              onClick={handleVolverPrincipal}
              variant="outline"
            >
              Volver
            </Button>
          </div>

          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Registros de Control de Incubadora</CardTitle>
                  <CardDescription>
                    Todos los registros de operación y control de incubadora del laboratorio
                  </CardDescription>
                </div>
                <Button onClick={() => {
                  setEditingIncubadoraControl(null);
                  setIsIncubadoraControlModalOpen(true);
                }}>
                  <Plus className="w-4 h-4 mr-2" />
                  Nuevo Registro
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">Cargando registros...</p>
                </div>
              ) : incubadoraControlRegistros.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                    <Calendar className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">
                    No hay registros
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Comienza agregando tu primer registro de control de incubadora.
                  </p>
                  <Button onClick={() => {
                    setEditingIncubadoraControl(null);
                    setIsIncubadoraControlModalOpen(true);
                  }}>
                    <Plus className="w-4 h-4 mr-2" />
                    Agregar Primer Registro
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {incubadoraControlRegistros.map((registro: any) => (
                    <div
                      key={registro.id}
                      className="border rounded-lg p-4 cursor-pointer hover:bg-gray-50"
                      onClick={() => openDetalle('incubadora-control', 'RE-CAL-089 - Operación y Control de Incubadora', registro)}
                    >
                      <div className="flex items-center justify-end gap-2 mb-3">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingIncubadoraControl(registro);
                            setIsIncubadoraControlModalOpen(true);
                          }}
                        >
                          <Pencil className="w-4 h-4 mr-1" />
                          Editar
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete({
                              id: registro.id,
                              label: 'Control Incubadora',
                              run: () => incubadoraControlService.delete(registro.id),
                            });
                          }}
                        >
                          <Trash2 className="w-4 h-4 mr-1" />
                          Eliminar
                        </Button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
                        <div>
                          <p className="text-sm font-medium text-gray-700">Muestra</p>
                          <p className="text-sm text-gray-900">{registro.muestra}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-700">Ingreso</p>
                          <p className="text-sm text-gray-900">
                            {new Date(registro.fecha_ingreso).toLocaleDateString('es-ES')} {registro.hora_ingreso}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-700">Salida</p>
                          <p className="text-sm text-gray-900">
                            {new Date(registro.fecha_salida).toLocaleDateString('es-ES')} {registro.hora_salida}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-700">Días Incubación</p>
                          <p className="text-sm text-gray-900">
                            {Math.ceil((new Date(registro.fecha_salida).getTime() - new Date(registro.fecha_ingreso).getTime()) / (1000 * 60 * 60 * 24))} días
                          </p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-700">Responsable</p>
                          <p className="text-sm text-gray-900">{registro.responsable}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-700">Tiempo Total</p>
                          <p className="text-sm text-gray-900">
                            {new Date(registro.fecha_salida).toLocaleDateString('es-ES')} - {new Date(registro.fecha_ingreso).toLocaleDateString('es-ES')}
                          </p>
                        </div>
                      </div>
                      {registro.observaciones && (
                        <div className="mt-3 pt-3 border-t">
                          <p className="text-sm font-medium text-gray-700">Observaciones</p>
                          <p className="text-sm text-gray-900">{registro.observaciones}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {/* Vista de Resultados Microbiológicos */}
      {vistaActual === 'resultados-microbiologicos' && (
        <>
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">RE-CAL-046 - Resultados Microbiológicos</h1>
              <p className="text-gray-600 mt-2">
                Resultados microbiológicos análisis internos y externos
              </p>
            </div>
            <Button 
              onClick={handleVolverPrincipal}
              variant="outline"
            >
              Volver
            </Button>
          </div>

          <Dialog open={isIndicadorModalOpen} onOpenChange={setIsIndicadorModalOpen}>
            <DialogContent className="max-w-3xl">
              <DialogHeader>
                <DialogTitle>Indicador</DialogTitle>
                <DialogDescription>
                  CALIDAD MICROBIOLÓGICA (RE-CAL-079)
                </DialogDescription>
              </DialogHeader>

              <Card>
                <CardHeader>
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <CardTitle>CALIDAD MICROBIOLÓGICA (RE-CAL-079)</CardTitle>
                      <CardDescription>
                        Meta: 97%
                      </CardDescription>
                      <div className="mt-3 w-full sm:max-w-[240px]">
                        <Select value={indicadorMes} onValueChange={(v) => setIndicadorMes(v as any)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Filtrar por mes" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">Todos los meses</SelectItem>
                            {mesesIndicador.map((m) => (
                              <SelectItem key={m.value} value={m.value}>
                                {m.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="text-left sm:text-right">
                      <p className="text-sm text-gray-500">Cumplimiento global</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {calidadMicrobiologicaResumen.porcentaje.toFixed(1)}%
                      </p>
                      <p className="text-xs text-gray-500">
                        {calidadMicrobiologicaResumen.cumple} / {calidadMicrobiologicaResumen.total} muestras
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {calidadMicrobiologicaSerie.length === 0 ? (
                    <div className="text-center py-6">
                      <p className="text-sm text-gray-500">Aún no hay muestras con CUMPLE/NO CUMPLE para graficar.</p>
                    </div>
                  ) : (
                    <div className="h-[260px] w-full">
                      <ChartContainer
                        config={{
                          cumplimiento: {
                            label: 'Cumplimiento %',
                            color: '#2563eb',
                          },
                        }}
                      >
                        <ResponsiveContainer>
                          <BarChart data={calidadMicrobiologicaSerie} margin={{ top: 12, right: 12, bottom: 0, left: 0 }}>
                            <CartesianGrid vertical={false} />
                            <XAxis
                              dataKey="mes"
                              tickLine={false}
                              axisLine={false}
                              tickFormatter={(value) => {
                                const [year, month] = String(value).split('-');
                                const m = mesesIndicador.find((x) => x.value === String(Number(month)));
                                return m ? `${m.label.slice(0, 3)} ${year}` : String(value);
                              }}
                            />
                            <YAxis domain={[0, 100]} tickLine={false} axisLine={false} width={40} />
                            <Tooltip
                              content={({ active, payload, label }) => {
                                if (!active || !payload?.length) return null;
                                const point: any = payload[0].payload;
                                return (
                                  <div className="bg-white p-2 rounded shadow-md">
                                    <p className="text-sm text-gray-900">{`Mes: ${label}`}</p>
                                    <p className="text-sm text-gray-900">{`Cumplimiento: ${Number(point.cumplimiento).toFixed(1)}%`}</p>
                                  </div>
                                );
                              }}
                              labelFormatter={(label: any) => `Mes: ${label}`}
                            />
                            <ReferenceLine y={calidadMicrobiologicaMeta * 100} stroke="#16a34a" strokeDasharray="6 6" />
                            <Bar dataKey="cumplimiento" fill="var(--color-cumplimiento)" radius={[6, 6, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </ChartContainer>
                    </div>
                  )}
                </CardContent>
              </Card>
            </DialogContent>
          </Dialog>

          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Registros de Resultados Microbiológicos</CardTitle>
                  <CardDescription>
                    Todos los registros de resultados microbiológicos del laboratorio
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setIsIndicadorModalOpen(true)}
                  >
                    Indicador
                  </Button>
                  <Button onClick={() => {
                    setEditingResultadosMicrobiologicos(null);
                    setIsResultadosMicrobiologicosModalOpen(true);
                  }}>
                    <Plus className="w-4 h-4 mr-2" />
                    Nuevo Registro
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">Cargando registros...</p>
                </div>
              ) : resultadosMicrobiologicosRegistros.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                    <Microscope className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">
                    No hay registros
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Comienza agregando tu primer registro de resultados microbiológicos.
                  </p>
                  <Button onClick={() => {
                    setEditingResultadosMicrobiologicos(null);
                    setIsResultadosMicrobiologicosModalOpen(true);
                  }}>
                    <Plus className="w-4 h-4 mr-2" />
                    Agregar Primer Registro
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {resultadosMicrobiologicosRegistros.map((registro: any) => (
                    <div
                      key={registro.id}
                      className="border rounded-lg p-4 cursor-pointer hover:bg-gray-50"
                      onClick={() => openDetalle('resultados-microbiologicos', 'RE-CAL-046 - Resultados Microbiológicos', registro)}
                    >
                      <div className="flex items-center justify-end gap-2 mb-3">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingResultadosMicrobiologicos(registro);
                            setIsResultadosMicrobiologicosModalOpen(true);
                          }}
                        >
                          <Pencil className="w-4 h-4 mr-1" />
                          Editar
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete({
                              id: registro.id,
                              label: 'Resultados Microbiológicos',
                              run: () => resultadosMicrobiologicosService.delete(registro.id),
                            });
                          }}
                        >
                          <Trash2 className="w-4 h-4 mr-1" />
                          Eliminar
                        </Button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
                        <div>
                          <p className="text-sm font-medium text-gray-700">Fecha</p>
                          <p className="text-sm text-gray-900">
                            {new Date(registro.fecha).toLocaleDateString('es-ES')}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-700">Muestra</p>
                          <p className="text-sm text-gray-900">{registro.muestra}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-700">Lote</p>
                          <p className="text-sm text-gray-900">{registro.lote}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-700">Tipo</p>
                          <p className="text-sm text-gray-900">{registro.tipo}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-700">Interno/Externo</p>
                          <p className="text-sm text-gray-900">{registro.interno_externo}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-700">Área</p>
                          <p className="text-sm text-gray-900">{registro.area}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-700">Mesófilos</p>
                          <p className="text-sm text-gray-900">{registro.mesofilos || '-'}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-700">Coliformes</p>
                          <p className="text-sm text-gray-900">{registro.coliformes_totales || '-'}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-700">E. coli</p>
                          <p className="text-sm text-gray-900">{registro.e_coli || '-'}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-700">Salmonella</p>
                          <p className="text-sm text-gray-900">{registro.salmonella || '-'}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-700">Cumple</p>
                          <p className="text-sm text-gray-900">
                            {registro.cumple ? '✅ Sí' : registro.no_cumple ? '❌ No' : '-'}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-700">Responsable</p>
                          <p className="text-sm text-gray-900">{registro.responsable}</p>
                        </div>
                      </div>
                      {registro.observaciones && (
                        <div className="mt-3 pt-3 border-t">
                          <p className="text-sm font-medium text-gray-700">Observaciones</p>
                          <p className="text-sm text-gray-900">{registro.observaciones}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {/* Vista de Control Lavado e Inactivación */}
      {vistaActual === 'control-lavado-inactivacion' && (
        <>
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">RE-CAL-111 - Control Lavado e Inactivación</h1>
              <p className="text-gray-600 mt-2">
                Control de lavado e inactivación de material - Laboratorio Microbiología
              </p>
            </div>
            <Button 
              onClick={handleVolverPrincipal}
              variant="outline"
            >
              Volver
            </Button>
          </div>

          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Registros de Control de Lavado e Inactivación</CardTitle>
                  <CardDescription>
                    Todos los registros de control de lavado e inactivación del laboratorio
                  </CardDescription>
                </div>
                <Button onClick={() => {
                  setEditingControlLavadoInactivacion(null);
                  setIsControlLavadoInactivacionModalOpen(true);
                }}>
                  <Plus className="w-4 h-4 mr-2" />
                  Nuevo Registro
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">Cargando registros...</p>
                </div>
              ) : controlLavadoInactivacionRegistros.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                    <Beaker className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">
                    No hay registros
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Comienza agregando tu primer registro de control de lavado e inactivación.
                  </p>
                  <Button onClick={() => {
                    setEditingControlLavadoInactivacion(null);
                    setIsControlLavadoInactivacionModalOpen(true);
                  }}>
                    <Plus className="w-4 h-4 mr-2" />
                    Agregar Primer Registro
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {controlLavadoInactivacionRegistros.map((registro: any) => (
                    <div
                      key={registro.id}
                      className="border rounded-lg p-4 cursor-pointer hover:bg-gray-50"
                      onClick={() => openDetalle('control-lavado-inactivacion', 'RE-CAL-111 - Control Lavado e Inactivación', registro)}
                    >
                      <div className="flex items-center justify-end gap-2 mb-3">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingControlLavadoInactivacion(registro);
                            setIsControlLavadoInactivacionModalOpen(true);
                          }}
                        >
                          <Pencil className="w-4 h-4 mr-1" />
                          Editar
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete({
                              id: registro.id,
                              label: 'Control Lavado e Inactivación',
                              run: () => controlLavadoInactivacionService.delete(registro.id),
                            });
                          }}
                        >
                          <Trash2 className="w-4 h-4 mr-1" />
                          Eliminar
                        </Button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
                        <div>
                          <p className="text-sm font-medium text-gray-700">Fecha</p>
                          <p className="text-sm text-gray-900">
                            {new Date(registro.fecha).toLocaleDateString('es-ES')}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-700">Actividad</p>
                          <p className="text-sm text-gray-900">{registro.actividad_realizada}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-700">Sustancia Limpieza</p>
                          <p className="text-sm text-gray-900">{registro.sustancia_limpieza_nombre}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-700">Desinfección 1</p>
                          <p className="text-sm text-gray-900">{registro.sustancia_desinfeccion_1_nombre}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-700">Desinfección 2</p>
                          <p className="text-sm text-gray-900">{registro.sustancia_desinfeccion_2_nombre}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-700">Responsable</p>
                          <p className="text-sm text-gray-900">{registro.realizado_por}</p>
                        </div>
                      </div>
                      {registro.observaciones && (
                        <div className="mt-3 pt-3 border-t">
                          <p className="text-sm font-medium text-gray-700">Observaciones</p>
                          <p className="text-sm text-gray-900">{registro.observaciones}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {/* Vista de Registros Recepción Formatos */}
      {vistaActual === 'registros-recepcion-formatos' && (
        <>
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">RE-CAL-100 - Registros Recepción Formatos</h1>
              <p className="text-gray-600 mt-2">
                Registros recepción de formatos diligenciados en proceso
              </p>
            </div>
            <Button 
              onClick={handleVolverPrincipal}
              variant="outline"
            >
              Volver
            </Button>
          </div>

          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Registros de Recepción de Formatos</CardTitle>
                  <CardDescription>
                    Todos los registros de recepción de formatos diligenciados en proceso
                  </CardDescription>
                </div>
                <Button onClick={() => {
                  setEditingRegistrosRecepcionFormatos(null);
                  setIsRegistrosRecepcionFormatosModalOpen(true);
                }}>
                  <Plus className="w-4 h-4 mr-2" />
                  Nuevo Registro
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">Cargando registros...</p>
                </div>
              ) : registrosRecepcionFormatosRegistros.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                    <FileText className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">
                    No hay registros
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Comienza agregando tu primer registro de recepción de formatos.
                  </p>
                  <Button onClick={() => {
                    setEditingRegistrosRecepcionFormatos(null);
                    setIsRegistrosRecepcionFormatosModalOpen(true);
                  }}>
                    <Plus className="w-4 h-4 mr-2" />
                    Agregar Primer Registro
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {registrosRecepcionFormatosRegistros.map((registro: any) => (
                    <div
                      key={registro.id}
                      className="border rounded-lg p-4 cursor-pointer hover:bg-gray-50"
                      onClick={() => openDetalle('registros-recepcion-formatos', 'RE-CAL-100 - Recepción de Formatos', registro)}
                    >
                      <div className="flex items-center justify-end gap-2 mb-3">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingRegistrosRecepcionFormatos(registro);
                            setIsRegistrosRecepcionFormatosModalOpen(true);
                          }}
                        >
                          <Pencil className="w-4 h-4 mr-1" />
                          Editar
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete({
                              id: registro.id,
                              label: 'Recepción de Formatos',
                              run: () => registrosRecepcionFormatosService.delete(registro.id),
                            });
                          }}
                        >
                          <Trash2 className="w-4 h-4 mr-1" />
                          Eliminar
                        </Button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
                        <div>
                          <p className="text-sm font-medium text-gray-700">Fecha Entrega</p>
                          <p className="text-sm text-gray-900">
                            {new Date(registro.fecha_entrega).toLocaleDateString('es-ES')}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-700">Fecha Registros</p>
                          <p className="text-sm text-gray-900">
                            {new Date(registro.fecha_registros).toLocaleDateString('es-ES')}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-700">Código/Versión</p>
                          <p className="text-sm text-gray-900">{registro.codigo_version_registros}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-700">N° Folios</p>
                          <p className="text-sm text-gray-900">{registro.numero_folios}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-700">Quien Entrega</p>
                          <p className="text-sm text-gray-900">{registro.nombre_quien_entrega}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-700">Quien Recibe</p>
                          <p className="text-sm text-gray-900">{registro.nombre_quien_recibe}</p>
                        </div>
                      </div>
                      {registro.observaciones && (
                        <div className="mt-3 pt-3 border-t">
                          <p className="text-sm font-medium text-gray-700">Observaciones</p>
                          <p className="text-sm text-gray-900">{registro.observaciones}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {/* Vista de Cronogramas */}
      {vistaActual === 'conograma' && (
        <>
          <div className="mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-2">Cronogramas Disponibles</h2>
            <p className="text-gray-600">Planificación y seguimiento de actividades microbiológicas</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* PL-CAL-008 - Plan de Muestreo Microbiológico */}
            <Card 
              className="group border-violet-200 bg-white hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 cursor-pointer"
              onClick={() => {
                // TODO: Abrir modal con el cronograma
                toast({
                  title: 'Próximamente',
                  description: 'El cronograma se abrirá en un modal',
                });
              }}
            >
              <CardHeader className="p-4">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-violet-100 rounded-full flex items-center justify-center">
                    <Microscope className="w-6 h-6 text-violet-600" />
                  </div>
                  <div>
                    <CardTitle className="text-base">PL-CAL-009 - Plan de Calidad</CardTitle>
                    <CardDescription className="text-xs">
                      Plan de Calidad
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <div className="space-y-2">
                  <p className="text-sm text-gray-600 line-clamp-2">
                    Cronograma Toma de Muestras internas
                  </p>
                  <div className="text-xs text-gray-500 space-y-1">
                    <p><strong>Versión:</strong> 5</p>
                    <p><strong>Aprobación:</strong> 16 dic 2022</p>
                  </div>
                  <div className="pt-2 flex items-center justify-between">
                    <span className="text-xs text-violet-600 font-medium bg-violet-50 px-2 py-1 rounded">
                      Activo
                    </span>
                    <Button size="sm" variant="ghost" className="text-xs">
                      <FileText className="w-3 h-3 mr-1" />
                      Ver
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}

      {/* Modales para agregar registros */}
      <AddCondicionesAmbientalesModal
        isOpen={isCondicionesModalOpen}
        onOpenChange={setIsCondicionesModalOpen}
        onSuccessfulSubmit={handleCondicionesSuccessfulSubmit}
        editingRecord={editingCondiciones}
        onEditingRecordChange={setEditingCondiciones}
      />
      
      <AddTemperaturaEquiposModal
        isOpen={isTemperaturaModalOpen}
        onOpenChange={setIsTemperaturaModalOpen}
        onSuccessfulSubmit={handleTemperaturaSuccessfulSubmit}
        editingRecord={editingTemperatura}
        onEditingRecordChange={setEditingTemperatura}
      />
      
      <AddMediosCultivoModal
        isOpen={isMediosCultivoModalOpen}
        onOpenChange={setIsMediosCultivoModalOpen}
        onSuccessfulSubmit={handleMediosCultivoSuccessfulSubmit}
        editingRecord={editingMediosCultivo}
        onEditingRecordChange={setEditingMediosCultivo}
      />
      
      <AddEsterilizacionAutoclaveModal
        isOpen={isEsterilizacionAutoclaveModalOpen}
        onOpenChange={setIsEsterilizacionAutoclaveModalOpen}
        onSuccessfulSubmit={handleEsterilizacionAutoclaveSuccessfulSubmit}
        editingRecord={editingEsterilizacionAutoclave}
        onEditingRecordChange={setEditingEsterilizacionAutoclave}
      />
      
      <AddCustodiaMuestrasModal
        isOpen={isCustodiaMuestrasModalOpen}
        onOpenChange={setIsCustodiaMuestrasModalOpen}
        onSuccessfulSubmit={handleCustodiaMuestrasSuccessfulSubmit}
        editingRecord={editingCustodiaMuestras}
        onEditingRecordChange={setEditingCustodiaMuestras}
      />
      
      <AddIncubadoraControlModal
        isOpen={isIncubadoraControlModalOpen}
        onOpenChange={setIsIncubadoraControlModalOpen}
        onSuccessfulSubmit={handleIncubadoraControlSuccessfulSubmit}
        editingRecord={editingIncubadoraControl}
        onEditingRecordChange={setEditingIncubadoraControl}
      />
      
      <AddResultadosMicrobiologicosModal
        isOpen={isResultadosMicrobiologicosModalOpen}
        onOpenChange={setIsResultadosMicrobiologicosModalOpen}
        onSuccessfulSubmit={handleResultadosMicrobiologicosSuccessfulSubmit}
        editingRecord={editingResultadosMicrobiologicos}
        onEditingRecordChange={setEditingResultadosMicrobiologicos}
      />
      
      <AddControlLavadoInactivacionModal
        isOpen={isControlLavadoInactivacionModalOpen}
        onOpenChange={setIsControlLavadoInactivacionModalOpen}
        onSuccessfulSubmit={handleControlLavadoInactivacionSuccessfulSubmit}
        editingRecord={editingControlLavadoInactivacion}
        onEditingRecordChange={setEditingControlLavadoInactivacion}
      />
      
      <AddRegistrosRecepcionFormatosModal
        isOpen={isRegistrosRecepcionFormatosModalOpen}
        onOpenChange={setIsRegistrosRecepcionFormatosModalOpen}
        onSuccessfulSubmit={handleRegistrosRecepcionFormatosSuccessfulSubmit}
        editingRecord={editingRegistrosRecepcionFormatos}
        onEditingRecordChange={setEditingRegistrosRecepcionFormatos}
      />
        </div>
      </main>
    </div>
  );
}
