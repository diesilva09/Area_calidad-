'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import { Calendar, momentLocalizer, View } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
import { Microscope, Beaker, User, Building, Filter, Download, Plus, Pencil, Trash2, X, Loader2, Eye, Calendar as CalendarIcon, Clock, CheckCircle, FileText } from 'lucide-react';
import { microbiologiaCronogramaService, type MicrobiologiaCronogramaTask } from '@/lib/microbiologia-cronograma-service';
import { useToast } from '@/hooks/use-toast';

// Configurar localización en español
moment.locale('es');
const localizer = momentLocalizer(moment);

// Tipos de muestreo
const TIPOS_MUESTREO = {
  manipuladores: { color: '#06b6d4', icon: User, label: 'Manipuladores' },  // Azul agua marina (cyan-500)
  superficies: { color: '#ec4899', icon: Building, label: 'Superficies' },
  ambientes: { color: '#f59e0b', icon: Beaker, label: 'Ambientes' },
  otro: { color: '#6b7280', icon: Microscope, label: 'Otro' },
};

// Marcas manuales para tareas completadas
const MARCAS_MANUALES = {
  externo: { color: '#2563eb', label: 'Realizado Externo' },    // Azul
  alergenos: { color: '#6d28d9', label: 'Alérgenos' },          // Violeta oscuro (violet-700)
};

// Frecuencias disponibles
const FRECUENCIAS = ['Sin frecuencia', 'Diaria', 'Semanal', 'Quincenal', 'Mensual'];

// Áreas de muestreo
const AREAS = [
  'Conservas',
  'Salsas',
  'Preparación Conservas',
  'Preparación Salsas',
  'Embalaje',
  'Frutos Secos',
  'Micropesaje',
  'BD MP (Bodega Materia Prima)',
  'BD PT (Bodega Producto Terminado)',
  'Personal de Aseo',
  'Mantenimiento (MTTO)',
  'Laboratorio Procesos',
  'Laboratorio MP',
  'Vestier Masculino 1',
  'Vestier Masculino 2',
  'Vestier Femenino 1',
  'Vestier Femenino 2',
  'Esclusa Ingreso Área de Preparación',
  'Estación de Lavado de Manos Preparación de Salsas',
  'Estación de Lavado de Manos Envasado de Salsas',
  'Esclusa Ingreso Área de Producción',
  'Envases (general)',
  'Dispensadores',
  'Secador Vestier Masculino 1',
  'Secador Vestier Masculino 2',
  'Secador Vestier Femenino 1',
  'Secador Vestier Femenino 2',
  'Otro',
];

export type TareaCronograma = {
  id: number;
  title: string;
  start: Date;
  end: Date;
  tipo: keyof typeof TIPOS_MUESTREO;
  tipoPersonalizado?: string;
  area: string;
  areaPersonalizada?: string;
  frecuencia: string;
  responsable: string;
  descripcion?: string;
  allDay: boolean;
  status?: 'pending' | 'completed';
  marcaManual?: 'externo' | 'alergenos' | null;
};

// Función para convertir de API a TareaCronograma
function mapApiTaskToTarea(task: MicrobiologiaCronogramaTask): TareaCronograma {
  return {
    id: task.id,
    title: task.title,
    start: new Date(task.start_date),
    end: new Date(task.end_date),
    tipo: task.tipo as keyof typeof TIPOS_MUESTREO,
    tipoPersonalizado: task.tipo_personalizado || undefined,
    area: task.area,
    areaPersonalizada: task.area_personalizada || undefined,
    frecuencia: task.frecuencia,
    responsable: task.responsable || '',
    descripcion: task.descripcion || undefined,
    allDay: task.all_day,
    status: task.status,
    marcaManual: (task as any).marca_manual || undefined,
  };
}

// Función para convertir de TareaCronograma a API
function mapTareaToApiTask(task: Partial<TareaCronograma>): Partial<MicrobiologiaCronogramaTask> {
  return {
    title: task.title,
    start_date: task.start ? task.start.toISOString().split('T')[0] : undefined,
    end_date: task.end ? task.end.toISOString().split('T')[0] : undefined,
    tipo: task.tipo as 'manipuladores' | 'superficies' | 'ambientes' | 'otro',
    tipo_personalizado: task.tipoPersonalizado,
    area: task.area,
    area_personalizada: task.areaPersonalizada,
    frecuencia: task.frecuencia as 'Diaria' | 'Semanal' | 'Quincenal' | 'Mensual',
    responsable: task.responsable,
    descripcion: task.descripcion,
    status: task.status,
    all_day: task.allDay,
    marca_manual: task.marcaManual,
  };
}

interface CronogramaCalendarProps {
  onViewTask?: (task: TareaCronograma) => void;
  onCompleteTask?: (task: TareaCronograma) => void;
}

export function CronogramaCalendar({ onViewTask, onCompleteTask }: CronogramaCalendarProps = {}) {
  const { toast } = useToast();
  
  // Estado para eventos/tareas
  const [eventos, setEventos] = useState<TareaCronograma[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Estado del calendario
  const [view, setView] = useState<View>('month');
  const [date, setDate] = useState(new Date());
  const [filtroTipo, setFiltroTipo] = useState<string>('todos');
  const [filtroMes, setFiltroMes] = useState<string>('todos');
  const [vistaMeses, setVistaMeses] = useState<boolean>(false);
  
  // Estado para modales
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<TareaCronograma | null>(null);
  const [viewingTask, setViewingTask] = useState<TareaCronograma | null>(null);
  const [taskToDelete, setTaskToDelete] = useState<number | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<{ start: Date; end: Date } | null>(null);
  
  // Cargar tareas desde la API
  useEffect(() => {
    loadTasks();
  }, []);
  
  async function loadTasks() {
    try {
      setIsLoading(true);
      const tasks = await microbiologiaCronogramaService.getAll();
      setEventos(tasks.map(mapApiTaskToTarea));
    } catch (error) {
      console.error('Error al cargar tareas:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar las tareas del cronograma',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }
  
  // Formulario
  const [formData, setFormData] = useState({
    tipo: 'manipuladores' as keyof typeof TIPOS_MUESTREO,
    tipoPersonalizado: '',
    area: AREAS[0],
    areaPersonalizada: '',
    frecuencia: 'Sin frecuencia',
    responsable: '',
    descripcion: '',
    status: undefined as 'pending' | 'completed' | undefined,
  });

  // Filtrar eventos
  const eventosFiltrados = useMemo(() => {
    let filtrados = eventos;
    if (filtroTipo !== 'todos') {
      filtrados = filtrados.filter(e => e.tipo === filtroTipo);
    }
    if (filtroMes !== 'todos') {
      filtrados = filtrados.filter(e => moment(e.start).format('YYYY-MM') === filtroMes);
    }
    return filtrados;
  }, [eventos, filtroTipo, filtroMes]);

  // Agrupar eventos por mes para la vista de todos los meses
  const eventosPorMes = useMemo(() => {
    const grupos = new Map<string, TareaCronograma[]>();
    eventosFiltrados.forEach(evento => {
      const mesKey = moment(evento.start).format('YYYY-MM');
      const mesLabel = moment(evento.start).format('MMMM YYYY');
      if (!grupos.has(mesLabel)) {
        grupos.set(mesLabel, []);
      }
      grupos.get(mesLabel)!.push(evento);
    });
    return Array.from(grupos.entries()).sort((a, b) => {
      const mesA = moment(a[1][0].start);
      const mesB = moment(b[1][0].start);
      return mesA.valueOf() - mesB.valueOf();
    });
  }, [eventosFiltrados]);

  // Lista de meses disponibles para filtro
  const mesesDisponibles = useMemo(() => {
    const meses = new Set<string>();
    eventos.forEach(e => {
      meses.add(moment(e.start).format('YYYY-MM'));
    });
    return Array.from(meses).sort().map(mes => ({
      value: mes,
      label: moment(mes, 'YYYY-MM').format('MMMM YYYY')
    }));
  }, [eventos]);

  // Estadísticas
  const stats = useMemo(() => {
    const total = eventos.length;
    const manipuladores = eventos.filter(e => e.tipo === 'manipuladores').length;
    const superficies = eventos.filter(e => e.tipo === 'superficies').length;
    const ambientes = eventos.filter(e => e.tipo === 'ambientes').length;
    return { total, manipuladores, superficies, ambientes };
  }, [eventos]);

  // Crear nueva tarea
  const handleCreateTask = useCallback(async () => {
    const tipoLabel = formData.tipo === 'otro' 
      ? (formData.tipoPersonalizado || 'Otro')
      : TIPOS_MUESTREO[formData.tipo as keyof typeof TIPOS_MUESTREO].label;
    const areaLabel = formData.area === 'Otro'
      ? (formData.areaPersonalizada || 'Otro')
      : formData.area;
    const descripcionLabel = formData.descripcion || '';
    const title = descripcionLabel ? `${descripcionLabel} - ${areaLabel}` : `${tipoLabel} - ${areaLabel}`;
    
    try {
      const newTaskData = {
        title,
        start_date: (selectedSlot?.start || new Date()).toISOString().split('T')[0],
        end_date: (selectedSlot?.end || new Date()).toISOString().split('T')[0],
        tipo: formData.tipo as 'manipuladores' | 'superficies' | 'ambientes' | 'otro',
        tipo_personalizado: formData.tipoPersonalizado || null,
        area: formData.area || AREAS[0],
        area_personalizada: formData.areaPersonalizada || null,
        frecuencia: formData.frecuencia as 'Diaria' | 'Semanal' | 'Quincenal' | 'Mensual',
        responsable: formData.responsable || null,
        descripcion: formData.descripcion || null,
        status: formData.status || 'pending',
        all_day: true,
      };
      
      const createdTask = await microbiologiaCronogramaService.create(newTaskData);
      setEventos(prev => [...prev, mapApiTaskToTarea(createdTask)]);
      setIsTaskModalOpen(false);
      resetForm();
      toast({
        title: 'Éxito',
        description: 'Tarea creada correctamente',
      });
    } catch (error) {
      console.error('Error al crear tarea:', error);
      toast({
        title: 'Error',
        description: 'No se pudo crear la tarea',
        variant: 'destructive',
      });
    }
  }, [formData, selectedSlot, toast]);

  // Actualizar tarea
  const handleUpdateTask = useCallback(async () => {
    if (!editingTask) return;
    
    const tipoLabel = formData.tipo === 'otro' 
      ? (formData.tipoPersonalizado || 'Otro')
      : TIPOS_MUESTREO[formData.tipo as keyof typeof TIPOS_MUESTREO].label;
    const areaLabel = formData.area === 'Otro'
      ? (formData.areaPersonalizada || 'Otro')
      : formData.area;
    const descripcionLabel = formData.descripcion || '';
    const title = descripcionLabel ? `${descripcionLabel} - ${areaLabel}` : `${tipoLabel} - ${areaLabel}`;
    
    try {
      const updateData = {
        title,
        tipo: formData.tipo as 'manipuladores' | 'superficies' | 'ambientes' | 'otro',
        tipo_personalizado: formData.tipoPersonalizado || null,
        area: formData.area,
        area_personalizada: formData.areaPersonalizada || null,
        frecuencia: formData.frecuencia as 'Diaria' | 'Semanal' | 'Quincenal' | 'Mensual',
        responsable: formData.responsable || null,
        descripcion: formData.descripcion || null,
        status: formData.status,
        all_day: true,
      };
      
      const updatedTask = await microbiologiaCronogramaService.update(editingTask.id, updateData);
      setEventos(prev => prev.map(e => 
        e.id === editingTask.id ? mapApiTaskToTarea(updatedTask) : e
      ));
      setIsTaskModalOpen(false);
      setEditingTask(null);
      resetForm();
      toast({
        title: 'Éxito',
        description: 'Tarea actualizada correctamente',
      });
    } catch (error) {
      console.error('Error al actualizar tarea:', error);
      toast({
        title: 'Error',
        description: 'No se pudo actualizar la tarea',
        variant: 'destructive',
      });
    }
  }, [editingTask, formData, toast]);

  // Eliminar tarea
  const handleDeleteTask = useCallback(async () => {
    if (!taskToDelete) return;
    
    try {
      await microbiologiaCronogramaService.delete(taskToDelete);
      setEventos(prev => prev.filter(e => e.id !== taskToDelete));
      setIsDeleteDialogOpen(false);
      setTaskToDelete(null);
      toast({
        title: 'Éxito',
        description: 'Tarea eliminada correctamente',
      });
    } catch (error) {
      console.error('Error al eliminar tarea:', error);
      toast({
        title: 'Error',
        description: 'No se pudo eliminar la tarea',
        variant: 'destructive',
      });
    }
  }, [taskToDelete, toast]);

  // Abrir modal para crear
  const openCreateModal = useCallback((slotInfo?: { start: Date; end: Date }) => {
    setEditingTask(null);
    setSelectedSlot(slotInfo || null);
    resetForm();
    setIsTaskModalOpen(true);
  }, []);

  // Abrir modal para editar
  const openEditModal = useCallback((task: TareaCronograma) => {
    setEditingTask(task);
    setFormData({
      tipo: task.tipo,
      tipoPersonalizado: task.tipoPersonalizado || '',
      area: task.area,
      areaPersonalizada: task.areaPersonalizada || '',
      frecuencia: task.frecuencia,
      responsable: task.responsable,
      descripcion: task.descripcion || '',
      status: task.status,
    });
    setIsTaskModalOpen(true);
  }, []);

  // Resetear formulario
  const resetForm = () => {
    setFormData({
      tipo: 'manipuladores',
      tipoPersonalizado: '',
      area: AREAS[0],
      areaPersonalizada: '',
      frecuencia: 'Sin frecuencia',
      responsable: '',
      descripcion: '',
      status: undefined,
    });
    setSelectedSlot(null);
  };

  // Evento seleccionado (click en calendario) - abre modal de vista
  const handleSelectEvent = useCallback((event: TareaCronograma) => {
    setViewingTask(event);
    setIsViewModalOpen(true);
  }, []);

  // Ver detalles de tarea completada
  const handleViewTask = useCallback(() => {
    if (viewingTask && onViewTask) {
      setIsViewModalOpen(false);
      onViewTask(viewingTask);
      setViewingTask(null);
    }
  }, [viewingTask, onViewTask]);

  // Completar tarea - navega a RE-CAL-107
  const handleCompleteTask = useCallback(() => {
    if (viewingTask && onCompleteTask) {
      setIsViewModalOpen(false);
      onCompleteTask(viewingTask);
      setViewingTask(null);
    }
  }, [viewingTask, onCompleteTask]);

  // Toggle marca manual en tarea completada
  const handleToggleMarca = useCallback(async (marca: 'externo' | 'alergenos' | null) => {
    if (!viewingTask) return;
    
    // Si la marca es la misma, la quitamos (toggle)
    const nuevaMarca = viewingTask.marcaManual === marca ? null : marca;
    
    console.log('Actualizando marca:', { id: viewingTask.id, nuevaMarca, currentMarca: viewingTask.marcaManual });
    
    try {
      await microbiologiaCronogramaService.updateTask(viewingTask.id, {
        marcaManual: nuevaMarca,
      });
      
      // Actualizar el evento en el estado local
      setEventos(prev => prev.map(event => 
        event.id === viewingTask.id 
          ? { ...event, marcaManual: nuevaMarca }
          : event
      ));
      
      // Actualizar la tarea que se está viendo
      setViewingTask(prev => prev ? { ...prev, marcaManual: nuevaMarca } : null);
      
      toast({
        title: 'Marca actualizada',
        description: nuevaMarca 
          ? `Tarea marcada como "${MARCAS_MANUALES[nuevaMarca]?.label}"`
          : 'Marca eliminada',
      });
    } catch (error) {
      console.error('Error al actualizar marca:', error);
      toast({
        title: 'Error',
        description: 'No se pudo actualizar la marca',
        variant: 'destructive',
      });
    }
  }, [viewingTask, toast]);

  // Slot seleccionado (click en día vacío)
  const handleSelectSlot = useCallback((slotInfo: { start: Date; end: Date }) => {
    openCreateModal(slotInfo);
  }, [openCreateModal]);

  // Estilos de celdas del calendario (fondo según estado de tareas)
  const dayPropGetter = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    
    // Obtener todas las tareas de esta fecha
    const tasksOnDate = eventos.filter(event => {
      const eventDateStr = event.start.toISOString().split('T')[0];
      return eventDateStr === dateStr;
    });
    
    if (tasksOnDate.length === 0) return {};
    
    // Verificar si hay tareas pendientes
    const hasPending = tasksOnDate.some(t => t.status === 'pending');
    // Verificar si hay tareas completadas
    const hasCompleted = tasksOnDate.some(t => t.status === 'completed');
    
    // Si hay pendientes → rojo (prioridad)
    if (hasPending) {
      return {
        className: 'bg-red-50',
        style: {
          backgroundColor: '#fef2f2', // Rojo muy claro
        },
      };
    }
    
    // Si solo hay completadas → verde
    if (hasCompleted) {
      return {
        className: 'bg-green-50',
        style: {
          backgroundColor: '#f0fdf4', // Verde muy claro
        },
      };
    }
    
    return {};
  };

  // Estilos de eventos - colores según tipo de muestreo + borde según estado + marca manual
  const eventStyleGetter = (event: TareaCronograma) => {
    const tipo = TIPOS_MUESTREO[event.tipo];
    
    // Color de fondo: siempre el color del tipo de muestreo
    const backgroundColor = tipo?.color || '#6b7280';
    
    // Borde: color de marca manual si existe, sino según estado (rojo/verde)
    const marcaColor = event.marcaManual ? MARCAS_MANUALES[event.marcaManual]?.color : null;
    const borderColor = marcaColor || (event.status === 'completed' ? '#16a34a' : '#dc2626'); // verde-600 : rojo-600
    const borderWidth = event.status === 'completed' ? '3px' : '3px';
    const boxShadow = event.status === 'completed' 
      ? '0 0 4px rgba(22, 163, 74, 0.5)' 
      : '0 0 4px rgba(220, 38, 38, 0.5)';
    
    return {
      style: {
        backgroundColor: backgroundColor,
        borderRadius: '4px',
        opacity: 0.95,
        color: 'white',
        border: `${borderWidth} solid ${borderColor}`,
        boxShadow: boxShadow,
        fontSize: '11px',
        padding: '2px 4px',
        fontWeight: 'bold',
      },
    };
  };

  // Exportar a CSV
  const exportarCSV = () => {
    const headers = ['Fecha', 'Tipo', 'Área', 'Frecuencia', 'Responsable', 'Descripción'];
    const rows = eventosFiltrados.map(e => [
      moment(e.start).format('DD/MM/YYYY'),
      e.tipo === 'otro' ? (e.tipoPersonalizado || 'Otro') : TIPOS_MUESTREO[e.tipo].label,
      e.area === 'Otro' ? (e.areaPersonalizada || 'Otro') : e.area,
      e.frecuencia,
      e.responsable,
      e.descripcion || '',
    ]);
    
    const csv = [headers, ...rows]
      .map(row => row.join(','))
      .join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cronograma-${moment().format('YYYY-MM-DD')}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="space-y-4">
      {/* Estadísticas */}
      <div className="grid grid-cols-4 gap-3">
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-3">
            <p className="text-xs text-blue-600 font-medium">Total</p>
            <p className="text-2xl font-bold text-blue-900">{stats.total}</p>
          </CardContent>
        </Card>
        <Card className="bg-violet-50 border-violet-200">
          <CardContent className="p-3">
            <p className="text-xs text-violet-600 font-medium">Manipuladores</p>
            <p className="text-2xl font-bold text-violet-900">{stats.manipuladores}</p>
          </CardContent>
        </Card>
        <Card className="bg-pink-50 border-pink-200">
          <CardContent className="p-3">
            <p className="text-xs text-pink-600 font-medium">Superficies</p>
            <p className="text-2xl font-bold text-pink-900">{stats.superficies}</p>
          </CardContent>
        </Card>
        <Card className="bg-amber-50 border-amber-200">
          <CardContent className="p-3">
            <p className="text-xs text-amber-600 font-medium">Ambientes</p>
            <p className="text-2xl font-bold text-amber-900">{stats.ambientes}</p>
          </CardContent>
        </Card>
      </div>

      {/* Toolbar personalizado */}
      <div className="flex flex-col gap-4 p-3 bg-gray-50 rounded-lg">
        {/* Fila 1: Título y acciones principales */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-gray-900">
              {vistaMeses ? 'Todos los meses' : moment(date).format('MMMM YYYY')}
            </h3>
          </div>
          
          <div className="flex flex-wrap items-center gap-2">
            {/* Botón Nueva Tarea */}
            <Button
              onClick={() => openCreateModal()}
              size="sm"
              className="bg-violet-600 hover:bg-violet-700 text-white text-xs"
            >
              <Plus className="w-3 h-3 mr-1" />
              Nueva Tarea
            </Button>

            {/* Vistas */}
            <div className="flex items-center gap-1 bg-white rounded-md border p-1">
              <Button
                variant={!vistaMeses && view === 'month' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => {
                  setVistaMeses(false);
                  setView('month');
                }}
                className="text-xs"
              >
                Mes
              </Button>
              <Button
                variant={!vistaMeses && view === 'week' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => {
                  setVistaMeses(false);
                  setView('week');
                }}
                className="text-xs"
              >
                Semana
              </Button>
              <Button
                variant={vistaMeses ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setVistaMeses(true)}
                className="text-xs"
              >
                Todos los meses
              </Button>
            </div>

            {/* Filtro Tipo */}
            <Select value={filtroTipo} onValueChange={setFiltroTipo}>
              <SelectTrigger className="w-[130px] text-xs">
                <Filter className="w-3 h-3 mr-1" />
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="manipuladores">Manipuladores</SelectItem>
                <SelectItem value="superficies">Superficies</SelectItem>
                <SelectItem value="ambientes">Ambientes</SelectItem>
                <SelectItem value="otro">Otro</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="outline" size="sm" className="text-xs" onClick={exportarCSV}>
              <Download className="w-3 h-3 mr-1" />
              Exportar
            </Button>
          </div>
        </div>

        {/* Fila 2: Filtros rápidos de mes */}
        {vistaMeses && (
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-gray-200">
            <span className="text-xs font-medium text-gray-500">Filtrar por mes:</span>
            <Button
              variant={filtroMes === 'todos' ? 'default' : 'outline'}
              size="sm"
              className="text-xs h-7"
              onClick={() => setFiltroMes('todos')}
            >
              Todos
            </Button>
            {mesesDisponibles.map(mes => (
              <Button
                key={mes.value}
                variant={filtroMes === mes.value ? 'default' : 'outline'}
                size="sm"
                className="text-xs h-7"
                onClick={() => setFiltroMes(mes.value)}
              >
                {mes.label}
              </Button>
            ))}
          </div>
        )}
      </div>

      {/* Leyenda de Tipos */}
      <div className="flex flex-wrap items-center gap-3 text-xs">
        <span className="font-medium text-gray-500">Tipos:</span>
        {Object.entries(TIPOS_MUESTREO).map(([key, config]) => {
          const Icon = config.icon;
          return (
            <div key={key} className="flex items-center gap-1">
              <div className="w-3 h-3 rounded" style={{ backgroundColor: config.color }} />
              <Icon className="w-3 h-3" style={{ color: config.color }} />
              <span className="text-gray-600">{config.label}</span>
            </div>
          );
        })}
      </div>

      {/* Leyenda de Estados */}
      <div className="flex flex-wrap items-center gap-3 text-xs">
        <span className="font-medium text-gray-500">Estados:</span>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded border-2" style={{ borderColor: '#16a34a', backgroundColor: 'transparent' }} />
          <span className="text-gray-600">Completado</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded border-2" style={{ borderColor: '#dc2626', backgroundColor: 'transparent' }} />
          <span className="text-gray-600">Pendiente</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#2563eb' }} />
          <span className="text-gray-600">Externo</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#6d28d9' }} />
          <span className="text-gray-600">Alérgenos</span>
        </div>
      </div>

      {/* Vista de Calendario o Lista por Meses */}
      {vistaMeses ? (
        /* Vista de Todos los Meses - Lista agrupada */
        <div className="bg-white rounded-lg border p-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="w-8 h-8 animate-spin text-violet-600" />
                <span className="text-sm text-gray-600">Cargando tareas...</span>
              </div>
            </div>
          ) : eventosPorMes.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p>No hay tareas programadas</p>
            </div>
          ) : (
            <div className="space-y-6 max-h-[500px] overflow-y-auto">
              {eventosPorMes.map(([mesLabel, tareas]) => (
                <div key={mesLabel} className="border rounded-lg overflow-hidden">
                  {/* Header del mes */}
                  <div className="bg-gradient-to-r from-violet-100 to-violet-50 px-4 py-3 border-b">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-violet-900 text-lg capitalize">
                        {mesLabel}
                      </h4>
                      <Badge variant="secondary" className="bg-violet-200 text-violet-800">
                        {tareas.length} tarea{tareas.length !== 1 ? 's' : ''}
                      </Badge>
                    </div>
                  </div>
                  {/* Lista de tareas del mes */}
                  <div className="divide-y">
                    {tareas.map((tarea) => {
                      const TipoIcon = TIPOS_MUESTREO[tarea.tipo]?.icon || Microscope;
                      const tipoColor = TIPOS_MUESTREO[tarea.tipo]?.color || '#6b7280';
                      return (
                        <div
                          key={tarea.id}
                          className="p-3 hover:bg-gray-50 cursor-pointer transition-colors"
                          onClick={() => handleSelectEvent(tarea)}
                        >
                          <div className="flex items-start gap-3">
                            {/* Icono del tipo */}
                            <div
                              className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                              style={{ backgroundColor: `${tipoColor}20` }}
                            >
                              <TipoIcon className="w-5 h-5" style={{ color: tipoColor }} />
                            </div>
                            {/* Info de la tarea */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-medium text-gray-900">
                                  {tarea.tipo === 'otro' ? (tarea.tipoPersonalizado || 'Otro') : TIPOS_MUESTREO[tarea.tipo]?.label}
                                </span>
                                <span className="text-gray-400">•</span>
                                <span className="text-sm text-gray-600">
                                  {tarea.area === 'Otro' ? (tarea.areaPersonalizada || 'Otro') : tarea.area}
                                </span>
                              </div>
                              <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                                <span className="flex items-center gap-1">
                                  <CalendarIcon className="w-3.5 h-3.5" />
                                  {moment(tarea.start).format('DD/MM/YYYY')}
                                </span>
                                {tarea.responsable && (
                                  <span className="flex items-center gap-1">
                                    <User className="w-3.5 h-3.5" />
                                    {tarea.responsable}
                                  </span>
                                )}
                                {tarea.frecuencia && tarea.frecuencia !== 'Sin frecuencia' && (
                                  <Badge variant="outline" className="text-xs py-0 h-5">
                                    {tarea.frecuencia}
                                  </Badge>
                                )}
                              </div>
                            </div>
                            {/* Estado */}
                            <div className="flex-shrink-0">
                              {tarea.status === 'completed' ? (
                                <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                                  <CheckCircle className="w-3 h-3 mr-1" />
                                  Completada
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="text-amber-600 border-amber-300">
                                  <Clock className="w-3 h-3 mr-1" />
                                  Pendiente
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* Vista del Calendario */
        <div className="bg-white rounded-lg border">
          <div className="h-[500px] p-4 relative">
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-white/80 z-10">
                <div className="flex flex-col items-center gap-2">
                  <Loader2 className="w-8 h-8 animate-spin text-violet-600" />
                  <span className="text-sm text-gray-600">Cargando tareas...</span>
                </div>
              </div>
            )}
            <Calendar
              localizer={localizer}
              events={eventosFiltrados}
              startAccessor="start"
              endAccessor="end"
              view={view}
              date={date}
              onView={setView}
              onNavigate={setDate}
              eventPropGetter={eventStyleGetter}
              dayPropGetter={dayPropGetter}
              onSelectEvent={handleSelectEvent}
              onSelectSlot={handleSelectSlot}
              selectable
              popup
              messages={{
                today: 'Hoy',
                previous: 'Anterior',
                next: 'Siguiente',
                month: 'Mes',
                week: 'Semana',
                day: 'Día',
                agenda: 'Lista',
                date: 'Fecha',
                time: 'Hora',
                event: 'Evento',
                noEventsInRange: 'No hay muestreos programados',
                showMore: (total: number) => `+ Ver ${total} más`,
              }}
            />
          </div>
        </div>
      )}

      {/* Modal de Crear/Editar Tarea */}
      <Dialog open={isTaskModalOpen} onOpenChange={setIsTaskModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {editingTask ? <Pencil className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
              {editingTask ? 'Editar Tarea' : 'Nueva Tarea de Muestreo'}
            </DialogTitle>
            <DialogDescription>
              {editingTask 
                ? 'Modifica los detalles de la tarea programada' 
                : 'Programa una nueva tarea de muestreo microbiológico'}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {/* Tipo de Muestreo */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="tipo" className="text-right text-sm">Tipo</Label>
              <Select 
                value={formData.tipo} 
                onValueChange={(v) => setFormData({ ...formData, tipo: v as keyof typeof TIPOS_MUESTREO })}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue>{TIPOS_MUESTREO[formData.tipo].label}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(TIPOS_MUESTREO).map(([key, config]) => (
                    <SelectItem key={key} value={key}>{config.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Tipo Personalizado - aparece debajo cuando se selecciona Otro */}
            {formData.tipo === 'otro' && (
              <div className="grid grid-cols-4 items-center gap-4">
                <div /> {/* Espacio vacío para alinear */}
                <Input
                  id="tipoPersonalizado"
                  value={formData.tipoPersonalizado || ''}
                  onChange={(e) => setFormData({ ...formData, tipoPersonalizado: e.target.value })}
                  placeholder="Escribe el tipo de muestreo personalizado"
                  className="col-span-3"
                />
              </div>
            )}

            {/* Área */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="area" className="text-right text-sm">Área</Label>
              <Select 
                value={formData.area} 
                onValueChange={(v) => setFormData({ ...formData, area: v })}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue>{formData.area}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {AREAS.map(area => (
                    <SelectItem key={area} value={area}>{area}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Área Personalizada - aparece debajo cuando se selecciona Otro */}
            {formData.area === 'Otro' && (
              <div className="grid grid-cols-4 items-center gap-4">
                <div /> {/* Espacio vacío para alinear */}
                <Input
                  id="areaPersonalizada"
                  value={formData.areaPersonalizada || ''}
                  onChange={(e) => setFormData({ ...formData, areaPersonalizada: e.target.value })}
                  placeholder="Escribe el nombre del área personalizada"
                  className="col-span-3"
                />
              </div>
            )}

            {/* Fecha */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="fecha" className="text-right text-sm">Fecha</Label>
              <Input
                id="fecha"
                type="date"
                value={selectedSlot?.start ? moment(selectedSlot.start).format('YYYY-MM-DD') : moment().format('YYYY-MM-DD')}
                onChange={(e) => {
                  const date = new Date(e.target.value);
                  setSelectedSlot({ start: date, end: date });
                }}
                className="col-span-3"
              />
            </div>

            {/* Frecuencia */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="frecuencia" className="text-right text-sm">Frecuencia</Label>
              <Select 
                value={formData.frecuencia} 
                onValueChange={(v) => setFormData({ ...formData, frecuencia: v })}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue>{formData.frecuencia}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {FRECUENCIAS.map(freq => (
                    <SelectItem key={freq} value={freq}>{freq}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Responsable */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="responsable" className="text-right text-sm">Responsable</Label>
              <Input
                id="responsable"
                value={formData.responsable || ''}
                onChange={(e) => setFormData({ ...formData, responsable: e.target.value })}
                placeholder="Nombre del responsable"
                className="col-span-3"
              />
            </div>

            {/* Descripción */}
            <div className="grid grid-cols-4 items-start gap-4">
              <Label htmlFor="descripcion" className="text-right text-sm pt-2">Descripción</Label>
              <textarea
                id="descripcion"
                value={formData.descripcion || ''}
                onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                className="col-span-3 min-h-[80px] px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                placeholder="Describe la labor"
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            {editingTask && (
              <Button
                variant="destructive"
                onClick={() => {
                  setIsTaskModalOpen(false);
                  setTaskToDelete(editingTask.id);
                  setIsDeleteDialogOpen(true);
                }}
                className="mr-auto"
              >
                <Trash2 className="w-4 h-4 mr-1" />
                Eliminar
              </Button>
            )}
            <Button variant="outline" onClick={() => setIsTaskModalOpen(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={editingTask ? handleUpdateTask : handleCreateTask}
              className="bg-violet-600 hover:bg-violet-700"
            >
              {editingTask ? 'Guardar Cambios' : 'Crear Tarea'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Vista de Tarea (Detalles) */}
      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Microscope className="w-5 h-5 text-violet-600" />
              Detalle de Tarea Programada
            </DialogTitle>
            <DialogDescription>
              Información del muestreo microbiológico programado
            </DialogDescription>
          </DialogHeader>

          {viewingTask && (
            <div className="space-y-4 py-4">
              {/* Tipo de Muestreo */}
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="w-10 h-10 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: TIPOS_MUESTREO[viewingTask.tipo]?.color || '#6b7280' }}>
                  {(() => {
                    const Icon = TIPOS_MUESTREO[viewingTask.tipo]?.icon || Microscope;
                    return <Icon className="w-5 h-5 text-white" />;
                  })()}
                </div>
                <div>
                  <p className="text-sm text-gray-500">Tipo de Muestreo</p>
                  <p className="font-medium">
                    {viewingTask.tipo === 'otro' 
                      ? (viewingTask.tipoPersonalizado || 'Otro')
                      : TIPOS_MUESTREO[viewingTask.tipo]?.label}
                  </p>
                </div>
              </div>

              {/* Fecha */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-500">Fecha Programada</p>
                  <p className="font-medium">{moment(viewingTask.start).format('DD/MM/YYYY')}</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-500">Frecuencia</p>
                  <p className="font-medium">{viewingTask.frecuencia}</p>
                </div>
              </div>

              {/* Área */}
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-500">Área de Muestreo</p>
                <p className="font-medium">
                  {viewingTask.area === 'Otro' 
                    ? (viewingTask.areaPersonalizada || 'Otro')
                    : viewingTask.area}
                </p>
              </div>

              {/* Descripción */}
              {viewingTask.descripcion && (
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-500">Descripción</p>
                  <p className="font-medium">{viewingTask.descripcion}</p>
                </div>
              )}

              {/* Responsable */}
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-500">Responsable</p>
                <p className="font-medium">{viewingTask.responsable || 'Sin asignar'}</p>
              </div>

              {/* Estado */}
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-500">Estado</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    viewingTask.status === 'completed' 
                      ? 'bg-green-100 text-green-800'
                      : viewingTask.status === 'pending'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {viewingTask.status === 'completed' 
                      ? 'Completado'
                      : viewingTask.status === 'pending'
                      ? 'Pendiente'
                      : 'Sin estado'}
                  </span>
                </div>
              </div>

              {/* Marcado Manual - Solo para tareas completadas */}
              {viewingTask.status === 'completed' && (
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-500 mb-2">Marcado Manual</p>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant={viewingTask.marcaManual === 'externo' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => handleToggleMarca('externo')}
                      className={viewingTask.marcaManual === 'externo' ? 'bg-blue-600 hover:bg-blue-700' : ''}
                    >
                      <Building className="w-4 h-4 mr-1" />
                      Realizado Externo
                    </Button>
                    <Button
                      variant={viewingTask.marcaManual === 'alergenos' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => handleToggleMarca('alergenos')}
                      className={viewingTask.marcaManual === 'alergenos' ? 'bg-violet-700 hover:bg-violet-800' : ''}
                    >
                      <Microscope className="w-4 h-4 mr-1" />
                      Alérgenos
                    </Button>
                    {viewingTask.marcaManual && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleMarca(null)}
                        className="text-gray-500 hover:text-gray-700"
                      >
                        <X className="w-4 h-4 mr-1" />
                        Quitar marca
                      </Button>
                    )}
                  </div>
                  {viewingTask.marcaManual && (
                    <p className="text-xs text-gray-600 mt-2">
                      Marca actual: <span className="font-medium" style={{ color: MARCAS_MANUALES[viewingTask.marcaManual]?.color }}>
                        {MARCAS_MANUALES[viewingTask.marcaManual]?.label}
                      </span>
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setIsViewModalOpen(false);
                if (viewingTask) openEditModal(viewingTask);
              }}
            >
              <Pencil className="w-4 h-4 mr-1" />
              Editar
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                setIsViewModalOpen(false);
                if (viewingTask) {
                  setTaskToDelete(viewingTask.id);
                  setIsDeleteDialogOpen(true);
                }
              }}
              className="mr-auto"
            >
              <Trash2 className="w-4 h-4 mr-1" />
              Eliminar
            </Button>
            {viewingTask?.status === 'completed' ? (
              <Button 
                onClick={handleViewTask}
                variant="outline"
                className="border-green-600 text-green-700 hover:bg-green-50"
              >
                <Eye className="w-4 h-4 mr-1" />
                Ver detalles
              </Button>
            ) : (
              <Button 
                onClick={handleCompleteTask}
                className="bg-red-600 hover:bg-red-700"
              >
                <FileText className="w-4 h-4 mr-1" />
                Registrar (RE-CAL-107)
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de Confirmación de Eliminación */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar tarea?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. La tarea se eliminará permanentemente del cronograma.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setTaskToDelete(null)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteTask} className="bg-red-600 hover:bg-red-700">
              <Trash2 className="w-4 h-4 mr-1" />
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// Inicializar con array vacío - listo para conexión con base de datos
function generarEventosIniciales(): TareaCronograma[] {
  return [];
}
