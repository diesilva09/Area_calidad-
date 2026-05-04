'use client';

import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { Calendar as BigCalendar, momentLocalizer, type Event as CalendarEvent, type View } from 'react-big-calendar';
import moment from 'moment';
import 'moment/locale/es';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Package,
  Building,
  Beaker,
  Microscope,
  Plus,
  Pencil,
  Trash2,
  X,
  Eye,
  CheckCircle,
  Calendar as CalendarIcon,
  Filter,
  Download,
  User,
  Check,
  ChevronsUpDown,
  Search,
  FileText,
  MapPin,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { productsAPI } from '@/lib/api-service';

// Configurar localización en español
moment.locale('es');
const localizer = momentLocalizer(moment);

// Tipos de muestreo para producto terminado
const TIPOS_MUESTREO_PT = {
  fisicoquimico: { color: '#0891b2', icon: Beaker, label: 'Fisicoquímico' },  // Cyan-600
  microbiologico: { color: '#059669', icon: Microscope, label: 'Microbiológico' },  // Emerald-600
  organoleptico: { color: '#d97706', icon: Package, label: 'Organoléptico' },  // Amber-600
  otro: { color: '#6b7280', icon: Building, label: 'Otro' },
};

// Tipo de materia para cronograma Materia Prima
const TIPOS_MATERIA_LIST = ['Materia fresca', 'Insumo proveedores', 'Insumo proveedores Importados'];

// Estados visuales para tareas completadas
const MARCAS_MANUALES_PT = {
  externo: { color: '#2563eb', label: 'Realizado Externo' },    // Azul
  alergenos: { color: '#6d28d9', label: 'Alérgenos' },          // Violeta oscuro
};

// Frecuencias disponibles
const FRECUENCIAS = ['Sin frecuencia', 'Diaria', 'Semanal', 'Quincenal', 'Mensual'];

// Áreas de muestreo para producto terminado (mismas que cronograma 008)
const AREAS_PT = [
  'Conservas',
  'Salsas',
  'Preparación Conservas',
  'Envasado Conservas',
  'Preparación Salsas',
  'Envasado Salsas',
  'Almacén MP',
  'Área de Almacén',
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
  'BD PT (Bodega Producto Terminado)',
  'Otro'
];

// Áreas de muestreo para cronograma Agua Potable (externo)
const AREAS_AGUA_POTABLE = [
  'Punto de agua preparación Salsas 1',
  'Punto de agua preparación Salsas 2',
  'Punto de agua marmitas Conservas 1',
  'Punto de agua marmitas Conserva 2',
  'Punto de agua acondicionamiento barrileria 1',
  'Punto de agua acondicionamiento barrileria 2',
  'Punto de agua envasado de conservas Emerito',
  'Punto de agua envasado de conservas Doypack',
  'Punto de agua embalaje y etiqueta',
  'Punto de agua envasado Salsas Doypack',
  'Punto de agua envasado de Salsas 16 Boquillas',
  'Tanque de retorno de agua (enfriamiento esterilización)',
  'Tanque almacenamiento 20.000 lts',
  'Tanque de agua subterraneo',
  'Punto de entrada de agua potable',
  'Lavamanos esclusa producción segunda planta',
  'Lavamanos esclusa producción primera planta',
  'Lavamanos baño damas',
  'Lavamanos baño caballeros',
];

// Ubicaciones para cronograma Agua Potable
const UBICACIONES_AGUA_POTABLE = [
  'Planta dos producción',
  'Planta uno producción',
  'Bodega PT',
  'Mantenimiento',
];

// Tipos de materia para cronograma Materia Prima
const TIPOS_MATERIA = [
  'Materia fresca',
  'Insumo proveedores',
  'Insumo proveedores Importados',
];

// Tipo de evento para el calendario
interface TareaCronogramaPT extends CalendarEvent {
  id: number;
  title: string;
  start: Date;
  end: Date;
  tipo: keyof typeof TIPOS_MUESTREO_PT;
  tipoPersonalizado?: string;
  area: string;
  areaPersonalizada?: string;
  frecuencia: string;
  responsable?: string;
  descripcion?: string;
  allDay: boolean;
  status?: 'pending' | 'completed';
  marcaManual?: 'externo' | 'alergenos' | null;
  productoId?: string;
  productoNombre?: string;
  codigoMuestra?: string; // Código RE-CAL-107 generado automáticamente
  registro107?: any; // Datos del registro RE-CAL-107 (para navegación)
}

// Props del componente
interface CronogramaProductoTerminadoProps {
  onViewTask: (task: TareaCronogramaPT) => void;
  onCompleteTask: (task: TareaCronogramaPT) => void;
  tipoCronograma?: 'producto-terminado' | 'agua-potable' | 'pt-externo' | 'materia-prima';
}

export function CronogramaProductoTerminado({
  onViewTask,
  onCompleteTask,
  tipoCronograma = 'producto-terminado',
}: CronogramaProductoTerminadoProps) {
  const { toast } = useToast();
  const [eventos, setEventos] = useState<TareaCronogramaPT[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [vistaActual, setVistaActual] = useState<View>('month');
  const [fechaActual, setFechaActual] = useState(new Date());
  const [filtroTipo, setFiltroTipo] = useState<string>('todos');
  const [filtroEstado, setFiltroEstado] = useState<string>('todos');
  const [filtroMes, setFiltroMes] = useState<string>('todos');
  const [vistaMeses, setVistaMeses] = useState<boolean>(false);

  // Modales
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<TareaCronogramaPT | null>(null);
  const [viewingTask, setViewingTask] = useState<TareaCronogramaPT | null>(null);
  const [slotSeleccionado, setSlotSeleccionado] = useState<{ start: Date; end: Date } | null>(null);

  // Formulario
  const [formData, setFormData] = useState({
    tipo: 'fisicoquimico' as keyof typeof TIPOS_MUESTREO_PT,
    tipoPersonalizado: '',
    area: tipoCronograma === 'agua-potable' ? AREAS_AGUA_POTABLE[0] : AREAS_PT[0],
    areaPersonalizada: '',
    ubicacion: tipoCronograma === 'agua-potable' ? UBICACIONES_AGUA_POTABLE[0] : '',
    frecuencia: FRECUENCIAS[0],
    fecha: moment().format('YYYY-MM-DD'),
    descripcion: '',
    productoId: '',
    productoNombre: '',
  });

  // Estado para productos
  const [productos, setProductos] = useState<Array<{ id: string; name: string; category_id: string }>>([]);
  const [productosLoading, setProductosLoading] = useState(false);
  const [productoSearch, setProductoSearch] = useState('');
  const [selectOpen, setSelectOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Cerrar dropdown al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setSelectOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filtrar productos duplicados por ID y por búsqueda
  const productosUnicos = useMemo(() => {
    const seen = new Set<string>();
    return productos.filter(producto => {
      if (seen.has(producto.id)) return false;
      seen.add(producto.id);
      return true;
    });
  }, [productos]);

  const productosFiltrados = useMemo(() => {
    if (!productoSearch.trim()) return productosUnicos;
    const search = productoSearch.toLowerCase();
    return productosUnicos.filter(p =>
      p.name.toLowerCase().includes(search) ||
      p.id.toLowerCase().includes(search)
    );
  }, [productosUnicos, productoSearch]);

  // Cargar productos cuando se abre el modal de creación/edición
  useEffect(() => {
    if (isCreateModalOpen && productos.length === 0) {
      loadProductos();
    }
  }, [isCreateModalOpen]);

  // Cargar tareas del cronograma al iniciar
  useEffect(() => {
    loadTareas();
  }, []);

  async function loadProductos() {
    try {
      setProductosLoading(true);
      const data = await productsAPI.getAll();
      setProductos(data);
    } catch (error) {
      console.error('Error al cargar productos:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los productos',
        variant: 'destructive',
      });
    } finally {
      setProductosLoading(false);
    }
  }

  // Determinar el endpoint de API según el tipo de cronograma
  const getApiEndpoint = useCallback(() => {
    if (tipoCronograma === 'agua-potable') return '/api/cronograma-agua-potable';
    if (tipoCronograma === 'pt-externo') return '/api/cronograma-pt-externo';
    if (tipoCronograma === 'materia-prima') return '/api/cronograma-materia-prima';
    return '/api/cronograma-producto-terminado';
  }, [tipoCronograma]);

  // Cargar tareas desde la API
  async function loadTareas() {
    try {
      setIsLoading(true);
      const endpoint = getApiEndpoint();
      const response = await fetch(endpoint);
      if (!response.ok) throw new Error('Error al cargar tareas');
      const data = await response.json();
      
      // Convertir fechas string a objetos Date
      const tareasConvertidas = data.map((tarea: any) => {
        // Para agua potable, usar area como título
        const titulo = tipoCronograma === 'agua-potable' 
          ? tarea.area 
          : (tarea.producto_nombre || tarea.producto_id || 'Sin producto');
        
        return {
          ...tarea,
          id: tarea.id,
          title: titulo,
          start: moment(tarea.fecha_programada).toDate(),
          end: moment(tarea.fecha_programada).toDate(),
          tipo: 'fisicoquimico' as const,
          area: tarea.area || (tipoCronograma === 'agua-potable' ? '' : 'BD PT (Bodega Producto Terminado)'),
          ubicacion: tarea.ubicacion,
          frecuencia: 'Sin frecuencia',
          allDay: true,
          status: tarea.estado || 'pending',
          productoId: tarea.producto_id,
          productoNombre: tarea.producto_nombre,
          responsable: tarea.responsable,
          codigoMuestra: tarea.codigo_muestra,
          marcaManual: tarea.marca_manual || null,
        };
      });
      
      setEventos(tareasConvertidas);
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

  // Filtrar eventos
  const eventosFiltrados = useMemo(() => {
    return eventos.filter(event => {
      if (filtroTipo !== 'todos' && event.tipo !== filtroTipo) return false;
      if (filtroEstado !== 'todos' && event.status !== filtroEstado) return false;
      if (filtroMes !== 'todos' && moment(event.start).format('YYYY-MM') !== filtroMes) return false;
      return true;
    });
  }, [eventos, filtroTipo, filtroEstado, filtroMes]);

  // Agrupar eventos por mes para la vista de todos los meses
  const eventosPorMes = useMemo(() => {
    const grupos = new Map<string, TareaCronogramaPT[]>();
    eventosFiltrados.forEach(evento => {
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

  // Crear nueva tarea
  const handleCreateTask = useCallback(async () => {
    // Validar producto solo para cronograma de producto terminado (interno y externo)
    if ((tipoCronograma === 'producto-terminado' || tipoCronograma === 'pt-externo') && !formData.productoId) {
      toast({
        title: 'Producto requerido',
        description: 'Debe seleccionar un producto para crear la muestra',
        variant: 'destructive',
      });
      return;
    }
    if (!formData.fecha) {
      toast({
        title: 'Fecha requerida',
        description: 'Debe seleccionar una fecha para la muestra',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsLoading(true);
      const productoLabel = formData.productoNombre || 'Sin producto';
      const endpoint = getApiEndpoint();

      // Datos según tipo de cronograma
      const requestBody = tipoCronograma === 'agua-potable' 
        ? {
            area: formData.area === 'Otro' ? formData.areaPersonalizada : formData.area,
            ubicacion: formData.ubicacion,
            fecha_programada: formData.fecha,
            responsable: formData.responsable,
            descripcion: formData.descripcion || '',
            estado: 'pending',
          }
        : {
            producto_id: formData.productoId,
            producto_nombre: formData.productoNombre,
            fecha_programada: formData.fecha,
            area: formData.area === 'Otro' ? formData.areaPersonalizada : formData.area,
            responsable: formData.responsable,
            estado: 'pending',
          };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al crear la tarea');
      }

      const nuevaTareaDB = await response.json();
      
      // Agregar a la lista local
      const areaValue = formData.area === 'Otro' ? formData.areaPersonalizada : formData.area;
      const titulo = tipoCronograma === 'agua-potable' 
        ? formData.area 
        : `${productoLabel} - Fisicoquímico`;
      
      const nuevaTarea: TareaCronogramaPT = {
        id: nuevaTareaDB.id,
        title: titulo,
        start: moment(nuevaTareaDB.fecha_programada).toDate(),
        end: moment(nuevaTareaDB.fecha_programada).toDate(),
        tipo: 'fisicoquimico',
        area: tipoCronograma === 'agua-potable' ? formData.area : (areaValue || 'BD PT (Bodega Producto Terminado)'),
        ubicacion: tipoCronograma === 'agua-potable' ? formData.ubicacion : undefined,
        frecuencia: 'Sin frecuencia',
        allDay: true,
        status: 'pending',
        responsable: nuevaTareaDB.responsable,
        productoId: nuevaTareaDB.producto_id,
        productoNombre: formData.productoNombre,
        codigoMuestra: nuevaTareaDB.codigo_muestra,
      };

      setEventos(prev => [...prev, nuevaTarea]);
      setIsCreateModalOpen(false);
      setSlotSeleccionado(null);

      // Mostrar mensaje
      let mensajeExito: string;
      if (tipoCronograma === 'agua-potable') {
        mensajeExito = `Muestra de agua programada para ${moment(nuevaTareaDB.fecha_programada).format('DD/MM/YYYY')}${nuevaTareaDB.codigo_muestra ? `. Código RE-CAL-107: ${nuevaTareaDB.codigo_muestra}` : ''}`;
      } else if (tipoCronograma === 'pt-externo') {
        mensajeExito = `Muestra externa de ${productoLabel} programada para ${moment(nuevaTareaDB.fecha_programada).format('DD/MM/YYYY')}${nuevaTareaDB.codigo_muestra ? `. Código RE-CAL-107: ${nuevaTareaDB.codigo_muestra}` : ''}`;
      } else {
        mensajeExito = `Muestra de ${productoLabel} programada para ${moment(nuevaTareaDB.fecha_programada).format('DD/MM/YYYY')}${nuevaTareaDB.codigo_muestra ? `. Código RE-CAL-107: ${nuevaTareaDB.codigo_muestra}` : ''}`;
      }
      
      toast({
        title: 'Muestra creada',
        description: mensajeExito,
      });
    } catch (error: any) {
      console.error('Error al crear tarea:', error);
      toast({
        title: 'Error',
        description: error.message || 'No se pudo crear la muestra',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [slotSeleccionado, formData, toast]);

  // Actualizar tarea
  const handleUpdateTask = useCallback(async () => {
    if (!editingEvent) return;
    if (!formData.fecha) {
      toast({
        title: 'Fecha requerida',
        description: 'Debe seleccionar una fecha para la muestra',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsLoading(true);
      const productoLabel = formData.productoNombre || 'Sin producto';
      const endpoint = getApiEndpoint();

      const areaValue = formData.area === 'Otro' ? formData.areaPersonalizada : formData.area;
      
      // Datos según tipo de cronograma
      const requestBody = tipoCronograma === 'agua-potable'
        ? {
            area: formData.area === 'Otro' ? formData.areaPersonalizada : formData.area,
            ubicacion: formData.ubicacion,
            fecha_programada: formData.fecha,
            responsable: formData.responsable,
            descripcion: formData.descripcion || '',
          }
        : {
            producto_id: formData.productoId,
            producto_nombre: formData.productoNombre,
            fecha_programada: formData.fecha,
            area: areaValue,
            responsable: formData.responsable,
          };
      
      const response = await fetch(`${endpoint}?id=${editingEvent.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al actualizar la tarea');
      }

      const tareaActualizada = await response.json();
      const fechaSeleccionada = moment(tareaActualizada.fecha_programada).toDate();

      const titulo = tipoCronograma === 'agua-potable'
        ? formData.area
        : `${productoLabel} - Fisicoquímico`;

      setEventos(prev => prev.map(event =>
        event.id === editingEvent.id
          ? {
              ...event,
              start: fechaSeleccionada,
              end: fechaSeleccionada,
              title: titulo,
              area: tipoCronograma === 'agua-potable' ? formData.area : (areaValue || event.area),
              ubicacion: tipoCronograma === 'agua-potable' ? formData.ubicacion : undefined,
              responsable: tareaActualizada.responsable,
              productoId: tareaActualizada.producto_id,
              productoNombre: formData.productoNombre,
            }
          : event
      ));

      setEditingEvent(null);
      setIsCreateModalOpen(false);

      toast({
        title: 'Muestra actualizada',
        description: `Muestra reprogramada para ${moment(fechaSeleccionada).format('DD/MM/YYYY')}`,
      });
    } catch (error: any) {
      console.error('Error al actualizar tarea:', error);
      toast({
        title: 'Error',
        description: error.message || 'No se pudo actualizar la muestra',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [editingEvent, formData, toast]);

  // Eliminar tarea
  const handleDeleteTask = useCallback(async () => {
    if (!viewingTask) return;

    try {
      setIsLoading(true);
      const endpoint = getApiEndpoint();
      const response = await fetch(`${endpoint}?id=${viewingTask.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al eliminar la tarea');
      }

      setEventos(prev => prev.filter(e => e.id !== viewingTask.id));
      setIsViewModalOpen(false);
      setViewingTask(null);

      toast({
        title: 'Tarea eliminada',
        description: 'La tarea ha sido eliminada del cronograma',
      });
    } catch (error: any) {
      console.error('Error al eliminar tarea:', error);
      toast({
        title: 'Error',
        description: error.message || 'No se pudo eliminar la muestra',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [viewingTask, toast]);

  // Completar tarea - abrir RE-CAL-107 para completar (la tarea se marca como completada DESPUÉS de guardar el 107)
  const handleCompleteTask = useCallback(async () => {
    if (!viewingTask) return;

    try {
      setIsLoading(true);

      // Si hay código de muestra, abrir el RE-CAL-107
      // La tarea se marcará como completada DESPUÉS de guardar el 107
      if (viewingTask.codigoMuestra) {
        const { custodiaMuestrasService } = await import('@/lib/custodia-muestras-service');
        const registro = await custodiaMuestrasService.getByCronogramaTaskId(viewingTask.id);

        if (registro) {
          setIsViewModalOpen(false);
          setViewingTask(null);

          onCompleteTask({
            ...viewingTask,
            status: viewingTask.status, // Mantener el estado actual (no completada aún)
            registro107: registro
          });

          toast({
            title: 'Completar registro',
            description: `Abriendo ${viewingTask.codigoMuestra} para completar datos. La tarea se marcará como completada después de guardar el registro.`,
          });
          return;
        }
      }

      // Fallback: solo cerrar y notificar
      onCompleteTask({ ...viewingTask, status: viewingTask.status });
      setIsViewModalOpen(false);
      setViewingTask(null);

      toast({
        title: 'Tarea completada',
        description: 'La tarea ha sido marcada como completada',
      });
    } catch (error) {
      console.error('Error al completar tarea:', error);
      toast({
        title: 'Error',
        description: 'No se pudo completar la tarea',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [viewingTask, onCompleteTask, toast]);

  // Toggle marca manual
  const handleToggleMarca = useCallback(async (marca: 'externo' | 'alergenos' | null) => {
    if (!viewingTask) return;

    const nuevaMarca = viewingTask.marcaManual === marca ? null : marca;
    const endpoint = getApiEndpoint();

    try {
      // Llamar a la API para persistir la marca
      const response = await fetch(`${endpoint}?id=${viewingTask.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ marca_manual: nuevaMarca }),
      });

      if (!response.ok) {
        throw new Error('Error al actualizar marca');
      }

      // Actualizar estado local
      setEventos(prev => prev.map(event =>
        event.id === viewingTask.id
          ? { ...event, marcaManual: nuevaMarca }
          : event
      ));

      setViewingTask(prev => prev ? { ...prev, marcaManual: nuevaMarca } : null);

      toast({
        title: 'Marca actualizada',
        description: nuevaMarca
          ? `Tarea marcada como "${MARCAS_MANUALES_PT[nuevaMarca]?.label}"`
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

  // Abrir modal de creación
  const openCreateModal = useCallback((slotInfo: { start: Date; end: Date }) => {
    setSlotSeleccionado(slotInfo);
    setEditingEvent(null);
    setFormData({
      tipo: 'fisicoquimico',
      tipoPersonalizado: '',
      area: tipoCronograma === 'agua-potable' ? AREAS_PT[0] : AREAS_PT[0],
      areaPersonalizada: '',
      ubicacion: tipoCronograma === 'agua-potable' ? UBICACIONES_AGUA_POTABLE[0] : '',
      frecuencia: FRECUENCIAS[0],
      responsable: '',
      descripcion: '',
      allDay: true,
      productoId: '',
      productoNombre: '',
      fecha: moment(slotInfo.start).format('YYYY-MM-DD'), // Fecha del slot seleccionada
    });
    setIsCreateModalOpen(true);
  }, [tipoCronograma]);

  // Abrir modal de vista
  const openViewModal = useCallback((event: TareaCronogramaPT) => {
    setViewingTask(event);
    setIsViewModalOpen(true);
  }, []);

  // Abrir modal de edición
  const openEditModal = useCallback(() => {
    if (!viewingTask) return;
    setEditingEvent(viewingTask);
    setFormData({
      tipo: viewingTask.tipo,
      tipoPersonalizado: viewingTask.tipoPersonalizado || '',
      area: viewingTask.area,
      areaPersonalizada: viewingTask.areaPersonalizada || '',
      frecuencia: viewingTask.frecuencia,
      responsable: viewingTask.responsable || '',
      descripcion: viewingTask.descripcion || '',
      allDay: viewingTask.allDay,
      productoId: viewingTask.productoId || '',
      productoNombre: viewingTask.productoNombre || '',
      fecha: moment(viewingTask.start).format('YYYY-MM-DD'),
    });
    setIsViewModalOpen(false);
    setIsCreateModalOpen(true);
  }, [viewingTask]);

  // Estilos de eventos - color de fondo según estado y marca manual
  const eventStyleGetter = (event: TareaCronogramaPT) => {
    // Colores por prioridad: marca manual > estado completado > estado pendiente
    let backgroundColor: string;
    
    if (event.marcaManual === 'externo') {
      backgroundColor = '#2563eb'; // Azul para externo
    } else if (event.marcaManual === 'alergenos') {
      backgroundColor = '#6d28d9'; // Violeta para alérgenos
    } else if (event.status === 'completed') {
      backgroundColor = '#16a34a'; // Verde para completado
    } else {
      backgroundColor = '#dc2626'; // Rojo para pendiente
    }

    return {
      style: {
        backgroundColor,
        borderRadius: '4px',
        color: 'white',
        fontSize: '0.85em',
        fontWeight: 500,
        padding: '2px 4px',
        opacity: 0.95,
        border: 'none',
      } as React.CSSProperties,
    };
  };

  // Customizar el formato de los eventos
  const components = {
    event: ({ event }: { event: TareaCronogramaPT }) => {
      const tipo = TIPOS_MUESTREO_PT[event.tipo];
      const TipoIcon = tipo?.icon || Package;

      return (
        <div className="flex items-center gap-1 overflow-hidden">
          <TipoIcon className="w-3 h-3 flex-shrink-0" />
          <span className="truncate">{event.title}</span>
          {event.marcaManual && (
            <span className="ml-1 text-[10px] bg-white/20 px-1 rounded">
              {MARCAS_MANUALES_PT[event.marcaManual]?.label}
            </span>
          )}
        </div>
      );
    },
  };

  // Mensajes en español
  const messages = {
    today: 'Hoy',
    previous: 'Anterior',
    next: 'Siguiente',
    month: 'Mes',
    week: 'Semana',
    day: 'Día',
    agenda: 'Agenda',
    date: 'Fecha',
    time: 'Hora',
    event: 'Evento',
    noEventsInRange: 'No hay tareas en este rango',
    showMore: (total: number) => `+${total} más`,
  };

  return (
    <div className="space-y-4">
      {/* Filtros y controles */}
      <div className="flex flex-col gap-3">
        {/* Fila 1: Título, Vistas y Acciones */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-gray-900">
              {vistaMeses ? 'Todos los meses' : moment(fechaActual).format('MMMM YYYY')}
            </h3>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Filtro Estado */}
            <Select value={filtroEstado} onValueChange={setFiltroEstado}>
              <SelectTrigger className="w-32 h-8 text-xs">
                <Filter className="w-3 h-3 mr-1" />
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="pending">Pendientes</SelectItem>
                <SelectItem value="completed">Completados</SelectItem>
              </SelectContent>
            </Select>

            {/* Vistas */}
            <div className="flex items-center gap-1 bg-white rounded-md border p-1">
              <Button
                variant={!vistaMeses && vistaActual === 'month' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => {
                  setVistaMeses(false);
                  setVistaActual('month');
                }}
                className="text-xs"
              >
                Mes
              </Button>
              <Button
                variant={!vistaMeses && vistaActual === 'week' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => {
                  setVistaMeses(false);
                  setVistaActual('week');
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

            <Button variant="outline" size="sm" className="text-xs h-8" onClick={() => {
              setFiltroEstado('todos');
              setFiltroMes('todos');
            }}>
              Limpiar
            </Button>

            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs"
              onClick={() => {
                const headers = ['Fecha', 'Tipo', 'Área', 'Frecuencia', 'Responsable', 'Descripción'];
                const rows = eventosFiltrados.map(e => [
                  moment(e.start).format('DD/MM/YYYY'),
                  e.tipo === 'otro' ? (e.tipoPersonalizado || 'Otro') : TIPOS_MUESTREO_PT[e.tipo].label,
                  e.area === 'Otro' ? (e.areaPersonalizada || 'Otro') : e.area,
                  e.frecuencia,
                  e.responsable,
                  e.descripcion,
                ]);
                const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
                const blob = new Blob([csv], { type: 'text/csv' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `cronograma-pt-${moment().format('YYYY-MM-DD')}.csv`;
                a.click();
              }}
            >
              <Download className="w-3 h-3 mr-1" />
              Exportar
            </Button>

            {/* Botón Agregar Labor */}
            <Button
              size="sm"
              className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
              onClick={() => {
                const today = new Date();
                setSlotSeleccionado({ start: today, end: today });
                setEditingEvent(null);
                setFormData({
                  tipo: 'fisicoquimico',
                  tipoPersonalizado: '',
                  area: AREAS_PT[0],
                  areaPersonalizada: '',
                  frecuencia: FRECUENCIAS[0],
                  responsable: '',
                  descripcion: '',
                  allDay: true,
                  productoId: '',
                  productoNombre: '',
                  fecha: moment(today).format('YYYY-MM-DD'),
                });
                setIsCreateModalOpen(true);
              }}
            >
              <Plus className="w-3 h-3 mr-1" />
              Agregar Labor
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
                <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
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
                  <div className="bg-gradient-to-r from-emerald-100 to-emerald-50 px-4 py-3 border-b">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-emerald-900 text-lg capitalize">
                        {mesLabel}
                      </h4>
                      <Badge variant="secondary" className="bg-emerald-200 text-emerald-800">
                        {tareas.length} tarea{tareas.length !== 1 ? 's' : ''}
                      </Badge>
                    </div>
                  </div>
                  {/* Lista de tareas del mes */}
                  <div className="divide-y">
                    {tareas.map((tarea) => {
                      const TipoIcon = TIPOS_MUESTREO_PT[tarea.tipo]?.icon || Package;
                      const tipoColor = TIPOS_MUESTREO_PT[tarea.tipo]?.color || '#6b7280';
                      return (
                        <div
                          key={tarea.id}
                          className="p-3 hover:bg-gray-50 cursor-pointer transition-colors"
                          onClick={() => openViewModal(tarea)}
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
                                  {tarea.tipo === 'otro' ? (tarea.tipoPersonalizado || 'Otro') : TIPOS_MUESTREO_PT[tarea.tipo]?.label}
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
                                    <span className="text-gray-400">Responsable:</span>
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
                                  <div className="w-3 h-3 mr-1 rounded-full border-2 border-amber-500" />
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
        <div className="h-[500px] bg-white rounded-lg border">
          <BigCalendar
            localizer={localizer}
            events={eventosFiltrados}
            startAccessor="start"
            endAccessor="end"
            view={vistaActual}
            date={fechaActual}
            onView={setVistaActual}
            onNavigate={setFechaActual}
            eventPropGetter={eventStyleGetter}
            components={components}
            messages={messages}
            selectable
            onSelectSlot={openCreateModal}
            onSelectEvent={openViewModal}
            popup
          />
        </div>
      )}

      {/* Modal Crear/Editar */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingEvent ? 'Editar Tarea' : 'Nueva Muestra de Producto Terminado'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* Selector de Producto - Solo para Producto Terminado */}
            {tipoCronograma !== 'agua-potable' && (
              <div className="grid grid-cols-4 items-start gap-4">
                <Label className="text-right text-sm pt-2">Producto *</Label>
                <div className="col-span-3 relative" ref={dropdownRef}>
                  {/* Input de búsqueda con dropdown integrado */}
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Buscar y seleccionar producto..."
                      value={productoSearch}
                      onChange={(e) => {
                        setProductoSearch(e.target.value);
                        setSelectOpen(true);
                      }}
                      
                      onFocus={() => setSelectOpen(true)}
                      className="pl-8 pr-10"
                      disabled={productosLoading}
                    />
                    {formData.productoNombre && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="absolute right-1 top-1 h-7 w-7 p-0"
                        onClick={() => {
                          setFormData({ ...formData, productoId: '', productoNombre: '' });
                          setProductoSearch('');
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>

                  {/* Dropdown de resultados */}
                  {selectOpen && (
                    <div className="absolute z-50 w-full mt-1 bg-white border rounded-md shadow-lg max-h-[250px] overflow-auto">
                      {productosFiltrados.length === 0 ? (
                        <div className="p-3 text-sm text-gray-500 text-center">
                          {productoSearch ? 'No se encontraron productos' : 'Escriba para buscar productos'}
                        </div>
                      ) : (
                        productosFiltrados.map((producto) => (
                          <div
                            key={producto.id}
                            className="p-3 hover:bg-gray-50 cursor-pointer border-b last:border-0"
                            onClick={() => {
                              setFormData({
                                ...formData,
                                productoId: producto.id,
                                productoNombre: producto.name,
                              });
                              setProductoSearch(producto.name);
                              setSelectOpen(false);
                            }}
                          >
                            <div className="flex items-center gap-2">
                              <Check
                                className={`h-4 w-4 ${
                                  formData.productoId === producto.id
                                    ? 'opacity-100 text-emerald-600'
                                    : 'opacity-0'
                                }`}
                              />
                              <div className="flex flex-col">
                                <span className="font-medium text-sm">{producto.name}</span>
                                <span className="text-xs text-gray-500">ID: {producto.id}</span>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}

                  {/* Producto seleccionado badge */}
                  {formData.productoNombre && (
                    <div className="mt-2 flex items-center gap-2">
                      <Badge variant="secondary" className="text-xs">
                        <Package className="w-3 h-3 mr-1" />
                        {formData.productoNombre}
                      </Badge>
                      <span className="text-xs text-gray-500">ID: {formData.productoId}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Campo Área - Visible (condicional según tipo) */}
            {tipoCronograma === 'agua-potable' ? (
              <>
                {/* Área para Agua Potable - Usando el mismo listado que otros cronogramas */}
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="area" className="text-right text-sm">Área *</Label>
                  <Select
                    value={formData.area}
                    onValueChange={(v) => setFormData({ ...formData, area: v })}
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Seleccionar área" />
                    </SelectTrigger>
                    <SelectContent className="max-h-[300px]">
                      {AREAS_PT.map((area) => (
                        <SelectItem key={area} value={area}>{area}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Input para Área Personalizada cuando se selecciona 'Otro' */}
                {formData.area === 'Otro' && (
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="areaPersonalizada" className="text-right text-sm">Área Personalizada</Label>
                    <Input
                      id="areaPersonalizada"
                      value={formData.areaPersonalizada}
                      onChange={(e) => setFormData({ ...formData, areaPersonalizada: e.target.value })}
                      className="col-span-3"
                      placeholder="Especifique el área"
                    />
                  </div>
                )}

                {/* Ubicación para Agua Potable */}
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="ubicacion" className="text-right text-sm">Ubicación *</Label>
                  <Select
                    value={formData.ubicacion}
                    onValueChange={(v) => setFormData({ ...formData, ubicacion: v })}
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Seleccionar ubicación" />
                    </SelectTrigger>
                    <SelectContent>
                      {UBICACIONES_AGUA_POTABLE.map((ubicacion) => (
                        <SelectItem key={ubicacion} value={ubicacion}>{ubicacion}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Detalles adicionales - Opcional */}
                <div className="grid grid-cols-4 items-start gap-4">
                  <Label htmlFor="descripcion" className="text-right text-sm pt-2">Detalles</Label>
                  <Textarea
                    id="descripcion"
                    value={formData.descripcion}
                    onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                    className="col-span-3 min-h-[80px] resize-y"
                    placeholder="detalles adicionales de la labor"
                    rows={3}
                  />
                </div>
              </>
            ) : (
              <>
                {/* Área para Producto Terminado */}
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="area" className="text-right text-sm">Área</Label>
                  <Select
                    value={formData.area}
                    onValueChange={(v) => setFormData({ ...formData, area: v })}
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {AREAS_PT.map((area) => (
                        <SelectItem key={area} value={area}>{area}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {formData.area === 'Otro' && (
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="areaPersonalizada" className="text-right text-sm">Área Personalizada</Label>
                    <Input
                      id="areaPersonalizada"
                      value={formData.areaPersonalizada}
                      onChange={(e) => setFormData({ ...formData, areaPersonalizada: e.target.value })}
                      className="col-span-3"
                      placeholder="Especifique el área"
                    />
                  </div>
                )}
              </>
            )}

            {/* Campos ocultos temporalmente */}
            {/*
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="tipo" className="text-right text-sm">Tipo</Label>
              <Select
                value={formData.tipo}
                onValueChange={(v) => setFormData({ ...formData, tipo: v as keyof typeof TIPOS_MUESTREO_PT })}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue>{TIPOS_MUESTREO_PT[formData.tipo].label}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(TIPOS_MUESTREO_PT).map(([key, config]) => (
                    <SelectItem key={key} value={key}>{config.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {formData.tipo === 'otro' && (
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="tipoPersonalizado" className="text-right text-sm">Tipo Personalizado</Label>
                <Input
                  id="tipoPersonalizado"
                  value={formData.tipoPersonalizado}
                  onChange={(e) => setFormData({ ...formData, tipoPersonalizado: e.target.value })}
                  className="col-span-3"
                  placeholder="Especifique el tipo de muestreo"
                />
              </div>
            )}

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="frecuencia" className="text-right text-sm">Frecuencia</Label>
              <Select
                value={formData.frecuencia}
                onValueChange={(v) => setFormData({ ...formData, frecuencia: v })}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FRECUENCIAS.map((f) => (
                    <SelectItem key={f} value={f}>{f}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="responsable" className="text-right text-sm">Responsable</Label>
              <Input
                id="responsable"
                value={formData.responsable}
                onChange={(e) => setFormData({ ...formData, responsable: e.target.value })}
                className="col-span-3"
                placeholder="Nombre del responsable"
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="descripcion" className="text-right text-sm">Descripción</Label>
              <Input
                id="descripcion"
                value={formData.descripcion}
                onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                className="col-span-3"
                placeholder="Descripción opcional"
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right text-sm">Todo el día</Label>
              <div className="col-span-3 flex items-center space-x-2">
                <Checkbox
                  id="allDay"
                  checked={formData.allDay}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, allDay: checked as boolean })
                  }
                />
                <label htmlFor="allDay" className="text-sm text-gray-600">
                  La tarea ocupa todo el día
                </label>
              </div>
            </div>
            */}

            {/* Campo Fecha - Visible por ahora */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="fecha" className="text-right text-sm">Fecha *</Label>
              <Input
                id="fecha"
                type="date"
                value={formData.fecha}
                onChange={(e) => setFormData({ ...formData, fecha: e.target.value })}
                className="col-span-3"
              />
            </div>

            {/* Campo Responsable - Visible por ahora */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="responsable" className="text-right text-sm">Responsable</Label>
              <Input
                id="responsable"
                value={formData.responsable}
                onChange={(e) => setFormData({ ...formData, responsable: e.target.value })}
                className="col-span-3"
                placeholder="Nombre del responsable de la muestra"
              />
            </div>

            {/* Botones de acción */}
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setIsCreateModalOpen(false)}>
                Cancelar
              </Button>
              <Button
                onClick={editingEvent ? handleUpdateTask : handleCreateTask}
                disabled={tipoCronograma === 'agua-potable' ? !formData.fecha : (!formData.productoId || !formData.fecha)}
              >
                {editingEvent ? 'Guardar Cambios' : (tipoCronograma === 'pt-externo' ? 'Crear Muestra Externa' : 'Crear Muestra')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal Ver Detalle */}
      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>Detalle de la Tarea</span>
              <div className="flex gap-1">
                <Button variant="ghost" size="sm" onClick={openEditModal}>
                  <Pencil className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={handleDeleteTask} className="text-red-600">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </DialogTitle>
          </DialogHeader>

          {viewingTask && (
            <div className="space-y-4 py-4">
              {/* Producto - Solo para Producto Terminado */}
              {tipoCronograma !== 'agua-potable' && (
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center bg-blue-100">
                    <Package className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-600">Producto</p>
                    <p className="font-medium">
                      {viewingTask.productoNombre || 'Sin producto asignado'}
                    </p>
                    {viewingTask.productoId && (
                      <p className="text-xs text-gray-500">ID: {viewingTask.productoId}</p>
                    )}
                  </div>
                </div>
              )}

              {/* Área - Punto de Agua (para agua potable) */}
              {viewingTask.area && (
                <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                  <Building className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600">
                      {tipoCronograma === 'agua-potable' ? 'Punto de Agua' : 'Área'}
                    </p>
                    <p className="font-medium">{viewingTask.area}</p>
                  </div>
                </div>
              )}

              {/* Ubicación - Solo para Agua Potable */}
              {tipoCronograma === 'agua-potable' && viewingTask.ubicacion && (
                <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                  <MapPin className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600">Ubicación</p>
                    <p className="font-medium">{viewingTask.ubicacion}</p>
                  </div>
                </div>
              )}

              {/* Fecha Programada */}
              <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                <CalendarIcon className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-600">Fecha Programada</p>
                  <p className="font-medium">
                    {moment(viewingTask.start).format('DD/MM/YYYY')}
                  </p>
                </div>
              </div>

              {/* Responsable */}
              {viewingTask.responsable && (
                <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                  <User className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600">Responsable</p>
                    <p className="font-medium">{viewingTask.responsable}</p>
                  </div>
                </div>
              )}

              {/* Estado */}
              <div className="flex items-center gap-2">
                <p className="text-sm text-gray-600">Estado:</p>
                <Badge variant={viewingTask.status === 'completed' ? 'default' : 'secondary'}>
                  {viewingTask.status === 'completed' ? 'Completado' : 'Pendiente'}
                </Badge>
              </div>

              {/* NOTA: Campos adicionales ocultos temporalmente
              - Tipo de Muestreo
              - Área
              - Frecuencia
              - Descripción
              - Marcas Manuales
              Se activarán cuando se agreguen al formulario de creación
              */}

              {/* Botones de acción */}
              <div className="flex gap-2 pt-4">
                {viewingTask.status === 'pending' ? (
                  <>
                    <Button onClick={handleCompleteTask} className="flex-1">
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Completar Tarea
                    </Button>
                    {viewingTask.codigoMuestra && (
                      <Button
                        variant="outline"
                        onClick={() => onViewTask(viewingTask)}
                        className="flex-1 border-red-200 hover:bg-red-50"
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        Ver 107
                      </Button>
                    )}
                  </>
                ) : (
                  <>
                    <Button
                      variant="outline"
                      onClick={() => onViewTask(viewingTask)}
                      className="flex-1"
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      Ver Registro
                    </Button>
                  </>
                )}
              </div>

              {/* Marcas manuales para tareas completadas */}
              {viewingTask.status === 'completed' && (
                <div className="pt-4 border-t">
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
                      >
                        <X className="w-4 h-4 mr-1" />
                        Quitar marca
                      </Button>
                    )}
                  </div>
                  {viewingTask.marcaManual && (
                    <p className="text-xs text-gray-600 mt-2">
                      Marca actual: <span className="font-medium" style={{ color: MARCAS_MANUALES_PT[viewingTask.marcaManual]?.color }}>
                        {MARCAS_MANUALES_PT[viewingTask.marcaManual]?.label}
                      </span>
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export type { TareaCronogramaPT };
