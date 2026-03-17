'use client';

import * as React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useFieldArray, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { getFechaActual, getMesActual, getHoraActual } from '@/lib/date-utils';
import { Clock } from 'lucide-react';
import { limpiezaTasksService, type LimpiezaTask } from '@/lib/limpieza-tasks-service';
import { limpiezaVerificationsService, type LimpiezaVerification } from '@/lib/limpieza-verifications-service';
import {
  limpiezaLiberacionesService,
  limpiezaRegistrosService,
  type LimpiezaRegistroWithLiberaciones,
} from '@/lib/limpieza-registros-service';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/auth-context';

// Definir el tipo Equipo localmente para evitar importación del servidor
interface Equipo {
  id: number;
  area: 'Salsas' | 'Conservas';
  codigo: string;
  nombre: string;
  created_at: string;
  updated_at: string;
  partes?: Parte[];
}

interface Parte {
  id: number;
  equipo_id: number;
  nombre: string;
  observaciones?: string;
  created_at: string;
  updated_at: string;
}

const tomaLimpiezaSchema = z.object({
  hora: z.string().min(1, 'Campo requerido'),
  linea: z.string().min(1, 'Campo requerido'),
  lineaOtro: z.string().optional(),
  superficie: z.string().min(1, 'Campo requerido'),
  superficieOtro: z.string().optional(),
  estadoFiltro: z.string().min(1, 'Campo requerido'),
  novedadesFiltro: z.string().optional(),
  correccionesFiltro: z.string().optional(),
  presenciaElementosExtranos: z.string().min(1, 'Campo requerido'),
  detalleElementosExtranos: z.string().optional(),
  resultadosAtpRi: z.string().optional(),
  resultadosAtpAc: z.string().optional(),
  resultadosAtpRf: z.string().optional(),
  loteHisopoAtp: z.string().optional(),
  observacionAtp: z.string().optional(),
  equipoAtp: z.string().optional(),
  parteAtp: z.string().optional(),
  deteccionAlergenosRi: z.string().optional(),
  deteccionAlergenosAc: z.string().optional(),
  deteccionAlergenosRf: z.string().optional(),
  loteHisopoAlergenos: z.string().optional(),
  observacionAlergenos: z.string().optional(),
  equipoAlergenos: z.string().optional(),
  parteAlergenos: z.string().optional(),
  detergente: z.string().min(1, 'Campo requerido'),
  desinfectante: z.string().min(1, 'Campo requerido'),
  verificacionVisual: z.string().min(1, 'Campo requerido'),
  observacionVisual: z.string().optional(),
});

const recal084RelaxedSchema = z.object({
  fecha: z.string().min(1, 'Campo requerido'),
  mesCorte: z.string().min(1, 'Campo requerido'),
  detalles: z.string().optional(),
  lote: z.string().optional(),
  producto: z.string().optional(),
  tipoVerificacion: z.string().min(1, 'Campo requerido'),
  tipoVerificacionOtro: z.string().optional(),
  verificadoPor: z.string().min(1, 'Campo requerido'),
  responsableProduccion: z.string().optional(),
  responsableMantenimiento: z.string().optional(),
  tomas: z
    .array(
      tomaLimpiezaSchema.partial().extend({
        hora: z.string().min(1, 'Campo requerido'),
        linea: z.string().min(1, 'Campo requerido'),
        superficie: z.string().min(1, 'Campo requerido'),
      })
    )
    .min(1, 'Debe agregar al menos una toma'),
});

export const limpiezaFormSchema = z.object({
  fecha: z.string().min(1, 'Campo requerido'),
  mesCorte: z.string().min(1, 'Campo requerido'),
  detalles: z.string().optional(),
  lote: z.string().optional(),
  producto: z.string().optional(),
  tipoVerificacion: z.string().min(1, 'Campo requerido'),
  tipoVerificacionOtro: z.string().optional(),
  verificadoPor: z.string().min(1, 'Campo requerido'),
  responsableProduccion: z.string().min(1, 'Campo requerido'),
  responsableMantenimiento: z.string().min(1, 'Campo requerido'),
  tomas: z.array(tomaLimpiezaSchema).min(1, 'Debe agregar al menos una toma'),
});

// Schema relajado para guardar como pendiente
export const pendingLimpiezaFormSchema = z.object({
  fecha: z.string().min(1, 'Campo requerido'),
  mesCorte: z.string().min(1, 'Campo requerido'),
  detalles: z.string().optional(),
  lote: z.string().optional(),
  producto: z.string().optional(),
  tipoVerificacion: z.string().min(1, 'Campo requerido'),
  verificadoPor: z.string().min(1, 'Campo requerido'),
  
  // Campos opcionales para pendiente
  tipoVerificacionOtro: z.string().optional(),
  responsableProduccion: z.string().optional(),
  responsableMantenimiento: z.string().optional(),
  tomas: z
    .array(
      tomaLimpiezaSchema.partial().extend({
        hora: z.string().min(1, 'Campo requerido'),
        linea: z.string().min(1, 'Campo requerido'),
        superficie: z.string().min(1, 'Campo requerido'),
      })
    )
    .min(1, 'Debe agregar al menos una toma'),
});

type AddLimpiezaRecordModalProps = {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSuccessfulSubmit?: () => void;
  onTaskCompleted?: () => void; // Callback para notificar cuando se completa una tarea del cronograma
  initialVerification?: LimpiezaVerification | null;
  registroIdToEdit?: string | null;
  liberacionIdToEdit?: string | null;
  initialTask?: LimpiezaTask | null; // Nueva prop para tarea inicial
  prefilledData?: Partial<{ fecha: string; mesCorte: string; lote: string; producto: string; linea: string; responsableProduccion: string; taskId?: number }>;
  viewOnlyMode?: boolean; // Nueva prop para modo de solo visualización
};

export function AddLimpiezaRecordModal({
  isOpen,
  onOpenChange,
  prefilledData,
  initialTask,
  initialVerification,
  registroIdToEdit,
  liberacionIdToEdit,
  onSuccessfulSubmit,
  viewOnlyMode = false, // Por defecto no es modo de solo visualización
}: AddLimpiezaRecordModalProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isEditMode, setIsEditMode] = React.useState(false);
  const [registroId, setRegistroId] = React.useState<string | null>(null);
  const [liberacionIdsByIndex, setLiberacionIdsByIndex] = React.useState<Record<number, string | null>>({});
  const [forceShowLoteProducto, setForceShowLoteProducto] = React.useState(false);
  const [mostrarCampoOtro, setMostrarCampoOtro] = React.useState(false);
  const [equipos, setEquipos] = React.useState<Equipo[]>([]);
  const [isLoadingEquipos, setIsLoadingEquipos] = React.useState(false);
  const [partesPorToma, setPartesPorToma] = React.useState<Record<number, Parte[]>>({});
  const [isLoadingPartesPorToma, setIsLoadingPartesPorToma] = React.useState<Record<number, boolean>>({});
  const [mostrarCampoOtroLineaPorToma, setMostrarCampoOtroLineaPorToma] = React.useState<Record<number, boolean>>({});
  const [mostrarCampoOtroSuperficiePorToma, setMostrarCampoOtroSuperficiePorToma] = React.useState<Record<number, boolean>>({});
  const [tomaActivaIndex, setTomaActivaIndex] = React.useState(0);

  const getPartesDeEquipoPorNombre = React.useCallback(
    (equipoNombre: string) => {
      const normalize = (value: string) =>
        String(value || '')
          .trim()
          .replace(/\s+/g, ' ')
          .toLowerCase();

      const needle = normalize(equipoNombre);
      if (!needle) return [] as Parte[];

      const equipo = equipos.find((e) => {
        const byNombre = normalize(e.nombre) === needle;
        const byCodigo = normalize(e.codigo) === needle;
        return byNombre || byCodigo;
      });
      return (equipo?.partes || []) as Parte[];
    },
    [equipos]
  );
  const [liberacionStatusByIndex, setLiberacionStatusByIndex] = React.useState<Record<number, 'pending' | 'completed'>>({}); // Estado de liberación por índice
  const [registroSubView, setRegistroSubView] = React.useState<'lista' | 'detalle'>('detalle');
 // Almacenar datos precargados
  const [datosPrecargados, setDatosPrecargados] = React.useState<any>(null); // Almacenar datos precargados
  const [associatedTaskId, setAssociatedTaskId] = React.useState<number | null>(null); // ID de la tarea asociada
  const isRecal084Mode = Boolean(initialTask || associatedTaskId);
  const initialTaskPrefillKeyRef = React.useRef<string | null>(null);

  const shouldShowLoteProducto = React.useMemo(() => {
    return Boolean(prefilledData || datosPrecargados || initialTask || forceShowLoteProducto);
  }, [prefilledData, datosPrecargados, initialTask, forceShowLoteProducto]);

  // Definición del formulario principal
  const form = useForm<z.infer<typeof limpiezaFormSchema>>({
    resolver: zodResolver(limpiezaFormSchema),
    defaultValues: {
      fecha: getFechaActual(),
      mesCorte: getMesActual(),
      detalles: '',
      lote: '',
      producto: '',
      tipoVerificacion: '',
      tipoVerificacionOtro: '',
      verificadoPor: '',
      responsableProduccion: '',
      responsableMantenimiento: '',
      tomas: [],
    },
  });

  const tomasFieldArray = useFieldArray({
    control: form.control,
    name: 'tomas',
  });

  // Definición del formulario para pendientes
  const pendingForm = useForm<z.infer<typeof pendingLimpiezaFormSchema>>({
    resolver: zodResolver(pendingLimpiezaFormSchema),
    defaultValues: {
      fecha: getFechaActual(),
      mesCorte: getMesActual(),
      detalles: '',
      lote: '',
      producto: '',
      tipoVerificacion: '',
      verificadoPor: '',
      tipoVerificacionOtro: '',
      responsableProduccion: '',
      responsableMantenimiento: '',
      tomas: [],
    },
  });

  const headerValues = form.watch(['fecha', 'mesCorte']);
  const canManageTomas = Boolean(headerValues[0] && headerValues[1]);

  const tipoVerificacionOptions = React.useMemo(
    () => [
      'VERIFICACIÓN RUTINARIA',
      'LIMPIEZA PROFUNDA',
      'LIBERACIÓN DE ARRANQUE',
      'CAMBIO DE REFERENCIA',
    ],
    []
  );

  const effectiveViewOnlyMode =
    viewOnlyMode || liberacionStatusByIndex?.[tomaActivaIndex] === 'completed';

  const getLiberacionStatus = (index: number) => {
    const values = form.getValues(`tomas.${index}` as const);
    if (!values) return 'pending' as const;

    const hasBase = Boolean(String(values.hora || '').trim());
    const hasEquipo = Boolean(String(values.linea || '').trim());
    const hasParte = Boolean(String(values.superficie || '').trim());
    const hasEstadoFiltro = Boolean(String(values.estadoFiltro || '').trim());
    const hasPresencia = Boolean(String(values.presenciaElementosExtranos || '').trim());
    const hasDetergente = Boolean(String(values.detergente || '').trim());
    const hasDesinfectante = Boolean(String(values.desinfectante || '').trim());
    const hasVerificacionVisual = Boolean(String(values.verificacionVisual || '').trim());

    const needsFiltroDetails = String(values.estadoFiltro || '').trim() === '0';
    const hasFiltroDetails = !needsFiltroDetails
      ? true
      : Boolean(String(values.novedadesFiltro || '').trim()) && Boolean(String(values.correccionesFiltro || '').trim());

    const needsExtraDetails = String(values.presenciaElementosExtranos || '').trim() === 'Si';
    const hasExtraDetails = !needsExtraDetails ? true : Boolean(String(values.detalleElementosExtranos || '').trim());

    const completed =
      hasBase &&
      hasEquipo &&
      hasParte &&
      hasEstadoFiltro &&
      hasPresencia &&
      hasDetergente &&
      hasDesinfectante &&
      hasVerificacionVisual &&
      hasFiltroDetails &&
      hasExtraDetails;

    return completed ? ('completed' as const) : ('pending' as const);
  };

  const [wizardStep, setWizardStep] = React.useState<'identificacion' | 'registro'>(() => {
    if (initialVerification || initialTask) return 'registro';
    if (viewOnlyMode) return 'registro';
    return 'identificacion';
  });

  const horaInputRef = React.useRef<HTMLInputElement | null>(null);

  const openHoraPicker = React.useCallback(() => {
    if (effectiveViewOnlyMode) return;
    const el = horaInputRef.current;
    if (!el) return;

    const anyEl = el as any;
    if (typeof anyEl.showPicker === 'function') {
      anyEl.showPicker();
      return;
    }

    el.focus();
    el.click();
  }, [effectiveViewOnlyMode]);

  React.useEffect(() => {
    if (isOpen) {
      if (initialVerification || viewOnlyMode) {
        setWizardStep('registro');
        setRegistroSubView('detalle');
      } else if (initialTask) {
        setWizardStep('registro');
        setRegistroSubView('lista');
      } else {
        setWizardStep('identificacion');
        setRegistroSubView('lista');
      }
    }
  }, [isOpen, initialVerification, initialTask, viewOnlyMode]);

  // Función para cargar equipos usando la API
  const cargarEquipos = async () => {
    setIsLoadingEquipos(true);
    try {
      const response = await fetch('/api/equipos');
      if (!response.ok) {
        throw new Error('Error al cargar equipos');
      }
      const equiposData = await response.json();
      setEquipos(equiposData);
      
      // Después de cargar los equipos, aplicar datos precargados si existen
      if (datosPrecargados) {
        console.log('🔄 Aplicando datos precargados después de cargar equipos:', datosPrecargados);
        
        // Verificar si el equipo precargado existe en la lista
        const equipoExiste = equiposData.some((equipo: Equipo) => equipo.nombre === datosPrecargados.linea);
        console.log('🔍 Equipo precargado existe:', datosPrecargados.linea, '→', equipoExiste);
        
        if (equipoExiste) {
          form.setValue('fecha', datosPrecargados.fecha || getFechaActual());
          form.setValue('mesCorte', datosPrecargados.mesCorte || getMesActual());
          form.setValue('tomas.0.linea', datosPrecargados.linea || '');
          form.setValue('responsableProduccion', datosPrecargados.responsableProduccion || '');
          
          // Cargar las partes del equipo precargado automáticamente
          cargarPartesEquipo(0, datosPrecargados.linea);
          
          console.log('✅ Datos precargados aplicados exitosamente');
        } else {
          console.warn('⚠️ El equipo precargado no existe en la lista de equipos:', datosPrecargados.linea);
          // Aplicar otros datos aunque el equipo no exista
          form.setValue('fecha', datosPrecargados.fecha || getFechaActual());
          form.setValue('mesCorte', datosPrecargados.mesCorte || getMesActual());
          form.setValue('responsableProduccion', datosPrecargados.responsableProduccion || '');
        }
        
        // Limpiar datos precargados después de aplicarlos
        setDatosPrecargados(null);
      }
    } catch (error) {
      console.error('Error al cargar equipos:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los equipos",
        variant: "destructive",
      });
    } finally {
      setIsLoadingEquipos(false);
    }
  };

  // Función para cargar partes de un equipo específico
  const cargarPartesEquipo = async (tomaIndex: number, equipoNombre: string) => {
    if (!equipoNombre || equipoNombre === 'OTRO') {
      setPartesPorToma(prev => ({ ...prev, [tomaIndex]: [] }));
      return;
    }

    setIsLoadingPartesPorToma(prev => ({ ...prev, [tomaIndex]: true }));
    try {
      // Buscar el equipo por nombre para obtener su ID
      const equipo = equipos.find(eq => eq.nombre === equipoNombre);
      if (!equipo) {
        setPartesPorToma(prev => ({ ...prev, [tomaIndex]: [] }));
        return;
      }

      const response = await fetch(`/api/equipos/${equipo.id}/partes`);
      if (!response.ok) {
        throw new Error('Error al cargar partes del equipo');
      }
      const partesData = await response.json();
      setPartesPorToma(prev => ({ ...prev, [tomaIndex]: partesData }));
    } catch (error) {
      console.error('Error al cargar partes del equipo:', error);
      setPartesPorToma(prev => ({ ...prev, [tomaIndex]: [] }));
    } finally {
      setIsLoadingPartesPorToma(prev => ({ ...prev, [tomaIndex]: false }));
    }
  };

  // Efecto para cargar equipos cuando el modal se abre
  React.useEffect(() => {
    if (isOpen) {
      cargarEquipos();
    }
  }, [isOpen]);

  // Efecto para cargar datos de tarea inicial (modo completar tarea)
  React.useEffect(() => {
    // IMPORTANTE: si estamos abriendo para ver/editar/completar una liberación existente,
    // NO debemos re-precargar desde `initialTask` porque pisa valores rehidratados desde BD
    // (ej: tipo_verificacion custom con OTRO).
    if (registroIdToEdit) return;
    if (registroId) return;

    if (initialTask && isOpen && !viewOnlyMode) {
      const prefillKey = `open:${isOpen ? '1' : '0'}|task:${String((initialTask as any)?.id ?? '')}|registro:${String(registroIdToEdit ?? '')}`;
      if (initialTaskPrefillKeyRef.current === prefillKey) return;
      initialTaskPrefillKeyRef.current = prefillKey;
      try {
        console.log('📋 Cargando datos de tarea inicial:', initialTask);

        // Formatear fecha al formato DD/MM/AA para el formulario
        const parseTaskDate = (raw: string) => {
          const v = String(raw || '').trim();
          if (!v) return new Date();
          if (v.includes('/')) {
            const parts = v.split('/');
            if (parts.length === 3) {
              const dd = parts[0].padStart(2, '0');
              const mm = parts[1].padStart(2, '0');
              const yy = parts[2].length === 2 ? `20${parts[2]}` : parts[2];
              const iso = `${yy}-${mm}-${dd}`;
              const d = new Date(iso);
              if (!Number.isNaN(d.getTime())) return d;
            }
          }
          const d = new Date(v);
          if (!Number.isNaN(d.getTime())) return d;
          return new Date();
        };
        const fechaFormateada = format(parseTaskDate(initialTask.fecha), 'dd/MM/yy');

        // Verificar si el área de la tarea existe en la lista de equipos
        let areaSeleccionada = initialTask.area || '';
        let mostrarOtro = false;

        if (initialTask.area && equipos.length > 0) {
          const areaExists = equipos.some((equipo) => equipo.nombre === initialTask.area);

          if (!areaExists) {
            console.log('⚠️ El área de la tarea no existe en la lista de equipos, usando OTRO:', initialTask.area);

            // Si no existe el área, usar "OTRO" y precargar el campo de especificación
            areaSeleccionada = 'OTRO';
            mostrarOtro = true;

            // Agregar el área como un equipo temporal para que aparezca en el select
            const equipoTemporal: Equipo = {
              id: -1,
              area: 'Salsas',
              codigo: 'TEMP',
              nombre: initialTask.area,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            };

            // Agregar al inicio de la lista para que sea fácil de encontrar
            setEquipos((prev) => {
              if (prev.some((e) => e.nombre === initialTask.area)) return prev;
              return [equipoTemporal, ...prev];
            });
          }
        }

        // Precargar datos de la tarea en el formulario
        form.setValue('fecha', fechaFormateada);
        form.setValue('tipoVerificacion', initialTask.tipo_muestra || '');
        form.setValue('verificadoPor', user?.name || '');

      // Asegurar al menos 1 liberación para que se guarde en BD
      if (!form.getValues('tomas')?.length) {
        tomasFieldArray.append({
          hora: getHoraActual(),
          linea: areaSeleccionada,
          lineaOtro: mostrarOtro ? (initialTask.area || '') : '',
          superficie: '',
          superficieOtro: '',
          estadoFiltro: '',
          novedadesFiltro: '',
          correccionesFiltro: '',
          presenciaElementosExtranos: '',
          detalleElementosExtranos: '',
          resultadosAtpRi: '',
          resultadosAtpAc: '',
          resultadosAtpRf: '',
          loteHisopoAtp: '',
          observacionAtp: '',
          equipoAtp: '',
          parteAtp: '',
          deteccionAlergenosRi: '',
          deteccionAlergenosAc: '',
          deteccionAlergenosRf: '',
          loteHisopoAlergenos: '',
          observacionAlergenos: '',
          equipoAlergenos: '',
          parteAlergenos: '',
          detergente: '',
          desinfectante: '',
          verificacionVisual: '',
          observacionVisual: '',
        });
        setTomaActivaIndex(0);
      } else {
        form.setValue('tomas.0.linea', areaSeleccionada);
        if (mostrarOtro) {
          form.setValue('tomas.0.lineaOtro', initialTask.area || '');
        }
      }
      
      // Cargar las partes del equipo automáticamente si no es OTRO
      if (!mostrarOtro && areaSeleccionada) {
        cargarPartesEquipo(0, areaSeleccionada);
      }
      
      // Si se usa OTRO, precargar el campo de especificación
      if (mostrarOtro) {
        form.setValue('tomas.0.lineaOtro', initialTask.area || '');
        setMostrarCampoOtroLineaPorToma(prev => ({ ...prev, 0: true }));
      }
      
      // También precargar en el formulario pendiente
      pendingForm.setValue('fecha', fechaFormateada);
      pendingForm.setValue('tipoVerificacion', initialTask.tipo_muestra || '');
      pendingForm.setValue('verificadoPor', user?.name || '');

      if (!pendingForm.getValues('tomas')?.length) {
        pendingForm.setValue('tomas', [
          {
            hora: getHoraActual(),
            linea: areaSeleccionada,
            lineaOtro: mostrarOtro ? (initialTask.area || '') : '',
            superficie: '',
            superficieOtro: '',
            estadoFiltro: '',
            novedadesFiltro: '',
            correccionesFiltro: '',
            presenciaElementosExtranos: '',
            detalleElementosExtranos: '',
            resultadosAtpRi: '',
            resultadosAtpAc: '',
            resultadosAtpRf: '',
            loteHisopoAtp: '',
            observacionAtp: '',
            equipoAtp: '',
            parteAtp: '',
            deteccionAlergenosRi: '',
            deteccionAlergenosAc: '',
            deteccionAlergenosRf: '',
            loteHisopoAlergenos: '',
            observacionAlergenos: '',
            equipoAlergenos: '',
            parteAlergenos: '',
            detergente: '',
            desinfectante: '',
            verificacionVisual: '',
            observacionVisual: '',
          },
        ]);
      } else {
        pendingForm.setValue('tomas.0.linea', areaSeleccionada);
        if (mostrarOtro) {
          pendingForm.setValue('tomas.0.lineaOtro', initialTask.area || '');
        }
      }
      
      // Si se usa OTRO, precargar el campo de especificación en formulario pendiente
      if (mostrarOtro) {
        pendingForm.setValue('tomas.0.lineaOtro', initialTask.area || '');
      }
      
        console.log('✅ Datos de tarea cargados en formulario');
      } catch (error) {
        console.error('❌ Error al precargar tarea de cronograma en modal:', error);
        toast({
          title: 'Error',
          description: 'No se pudo abrir el registro para completar la tarea. Revise la consola.',
          variant: 'destructive',
        });
      }
    }
  }, [initialTask, isOpen, form, pendingForm, viewOnlyMode, toast, user?.name, equipos.length, registroIdToEdit, registroId]);

  // Efecto para cargar datos precargados desde localStorage
  React.useEffect(() => {
    if (!isOpen) return;
    // No aplicar datos precargados desde producción cuando se está abriendo para editar/ver/completar.
    if (initialVerification) return;
    if (viewOnlyMode) return;
    if (registroIdToEdit) return;
    if (registroId) return;

    if (typeof window !== 'undefined') {
      const storedData = localStorage.getItem('limpiezaModalPrefilledData');
      if (storedData) {
        try {
          const productionData = JSON.parse(storedData);
          console.log('🔄 Cargando datos de producción en modal de limpieza:', productionData);
          
          // Almacenar datos precargados para aplicar después de cargar equipos
          if (productionData.fecha || productionData.mesCorte || productionData.linea) {
            console.log('🔄 Almacenando datos precargados:', {
              fecha: productionData.fecha,
              mesCorte: productionData.mesCorte,
              linea: productionData.linea,
              responsableProduccion: productionData.responsableProduccion,
              taskId: productionData.taskId
            });
            
            setDatosPrecargados(productionData);
            
            // Almacenar el ID de la tarea asociada si existe
            if (productionData.taskId) {
              setAssociatedTaskId(productionData.taskId);
              console.log('📋 Tarea asociada ID:', productionData.taskId);
            }
            
            // Limpiar datos precargados después de usarlos
            localStorage.removeItem('limpiezaModalPrefilledData');
          }
        } catch (error) {
          console.error('Error cargando datos de producción en modal de limpieza:', error);
        }
      }
    }
  }, [isOpen, datosPrecargados, initialVerification, registroId, registroIdToEdit, viewOnlyMode]);

  // Efecto para aplicar datos precargados cuando los equipos estén cargados
  React.useEffect(() => {
    // No aplicar datos precargados cuando se está editando/viendo/completando.
    if (initialVerification) return;
    if (viewOnlyMode) return;
    if (registroIdToEdit) return;
    if (registroId) return;

    if (datosPrecargados && equipos.length > 0 && !isLoadingEquipos) {
      console.log('🔄 Aplicando datos precargados (efecto adicional):', datosPrecargados);
      
      // Verificar si el equipo precargado existe en la lista
      const equipoExiste = equipos.some((equipo: Equipo) => equipo.nombre === datosPrecargados.linea);
      console.log('🔍 Equipo precargado existe:', datosPrecargados.linea, '→', equipoExiste);
      
      if (equipoExiste) {
        form.setValue('fecha', datosPrecargados.fecha || getFechaActual());
        form.setValue('mesCorte', datosPrecargados.mesCorte || getMesActual());
        form.setValue('tomas.0.linea', datosPrecargados.linea || '');
        form.setValue('responsableProduccion', datosPrecargados.responsableProduccion || '');
        
        console.log('✅ Datos precargados aplicados exitosamente (efecto adicional)');
      } else {
        console.warn('⚠️ El equipo precargado no existe en la lista de equipos:', datosPrecargados.linea);
        // Aplicar otros datos aunque el equipo no exista
        form.setValue('fecha', datosPrecargados.fecha || getFechaActual());
        form.setValue('mesCorte', datosPrecargados.mesCorte || getMesActual());
        form.setValue('responsableProduccion', datosPrecargados.responsableProduccion || '');
      }
      
      // Limpiar datos precargados después de aplicarlos
      setDatosPrecargados(null);
    }
  }, [
    datosPrecargados,
    equipos,
    isLoadingEquipos,
    form,
    initialVerification,
    registroId,
    registroIdToEdit,
    viewOnlyMode,
  ]);

  // Efecto para limpiar formulario cuando es un nuevo registro
  React.useEffect(() => {
    // Solo limpiar cuando realmente es creación NUEVA. Si se abre para editar/ver un registro/liberación,
    // este reset puede borrar los datos que se acaban de precargar desde BD.
    if (
      isOpen &&
      !initialVerification &&
      !datosPrecargados &&
      !prefilledData &&
      !registroIdToEdit &&
      !registroId &&
      !viewOnlyMode
    ) {
      console.log('🧹 Limpiando formulario para nuevo registro');
      
      // Resetear formulario principal a valores por defecto
      form.reset({
        fecha: getFechaActual(),
        mesCorte: getMesActual(),
        detalles: '',
        lote: '',
        producto: '',
        tipoVerificacion: '',
        verificadoPor: user?.name || '',
        // Resetear todos los demás campos a vacío
        tipoVerificacionOtro: '',
        responsableProduccion: '',
        responsableMantenimiento: '',
        tomas: [],
      });
      
      // Resetear formulario pendiente también
      pendingForm.reset({
        fecha: getFechaActual(),
        mesCorte: getMesActual(),
        detalles: '',
        lote: '',
        producto: '',
        tipoVerificacion: '',
        verificadoPor: user?.name || '',
        tipoVerificacionOtro: '',
        responsableProduccion: '',
        responsableMantenimiento: '',
        tomas: [],
      });
      
      // Resetear estados adicionales
      setMostrarCampoOtro(false);
      setRegistroId(null);
      setLiberacionIdsByIndex({});
      setForceShowLoteProducto(false);
      setTomaActivaIndex(0);
      setPartesPorToma({});
      setIsLoadingPartesPorToma({});
      setMostrarCampoOtroLineaPorToma({});
      setMostrarCampoOtroSuperficiePorToma({});
      
      console.log('✅ Formulario limpiado para nuevo registro');
    }
  }, [
    isOpen,
    initialVerification,
    datosPrecargados,
    prefilledData,
    registroIdToEdit,
    registroId,
    viewOnlyMode,
    form,
    pendingForm,
    user,
  ]);

  React.useEffect(() => {
    const loadRegistroToEdit = async () => {
      if (!isOpen) return;
      if (!registroIdToEdit) return;
      if (initialVerification) return;

      const data: LimpiezaRegistroWithLiberaciones = await limpiezaRegistrosService.getById(registroIdToEdit);

      setRegistroId(data.id);
      setForceShowLoteProducto(data.origin === 'produccion');

      const fecha = data.fecha;
      const fechaAsForm = fecha.includes('-')
        ? format(new Date(fecha), 'dd/MM/yy')
        : fecha;

      const tomas = (data.liberaciones ?? []).map((lib) => ({
        hora: lib.hora ?? getHoraActual(),
        linea: lib.linea ?? '',
        // Guardar el valor original en '*Otro' para poder re-hidratar OTRO si no existe en el Select
        lineaOtro: lib.linea ?? '',
        superficie: lib.superficie ?? '',
        // Guardar el valor original en '*Otro' para poder re-hidratar OTRO si no existe en el Select
        superficieOtro: lib.superficie ?? '',
        estadoFiltro: lib.estado_filtro != null ? String(lib.estado_filtro) : '',
        novedadesFiltro: lib.novedades_filtro ?? '',
        correccionesFiltro: lib.correcciones_filtro ?? '',
        presenciaElementosExtranos: lib.presencia_elementos_extranos ?? '',
        detalleElementosExtranos: lib.detalle_elementos_extranos ?? '',
        resultadosAtpRi: lib.resultados_atp_ri ?? '',
        resultadosAtpAc: lib.resultados_atp_ac ?? '',
        resultadosAtpRf: lib.resultados_atp_rf ?? '',
        loteHisopoAtp: lib.lote_hisopo_atp ?? '',
        observacionAtp: lib.observacion_atp ?? '',
        equipoAtp: (lib as any).equipo_atp ?? '',
        parteAtp: (lib as any).parte_atp ?? '',
        deteccionAlergenosRi: lib.deteccion_alergenos_ri ?? '',
        deteccionAlergenosAc: lib.deteccion_alergenos_ac ?? '',
        deteccionAlergenosRf: lib.deteccion_alergenos_rf ?? '',
        loteHisopoAlergenos: lib.lote_hisopo_alergenos ?? '',
        observacionAlergenos: lib.observacion_alergenos ?? '',
        equipoAlergenos: (lib as any).equipo_alergenos ?? '',
        parteAlergenos: (lib as any).parte_alergenos ?? '',
        detergente: lib.detergente ?? '',
        desinfectante: lib.desinfectante ?? '',
        verificacionVisual: lib.verificacion_visual != null ? String(lib.verificacion_visual) : '',
        observacionVisual: lib.observacion_visual ?? '',
      }));

      const idsByIndex: Record<number, string | null> = {};
      const statusByIndex: Record<number, 'pending' | 'completed'> = {};
      for (let i = 0; i < (data.liberaciones ?? []).length; i++) {
        idsByIndex[i] = data.liberaciones[i]?.id ?? null;
        statusByIndex[i] = (data.liberaciones[i]?.status ?? 'pending') as 'pending' | 'completed';
      }
      setLiberacionIdsByIndex(idsByIndex);
      setLiberacionStatusByIndex(statusByIndex);

      const selectedIdx = liberacionIdToEdit
        ? (data.liberaciones ?? []).findIndex((l) => l.id === liberacionIdToEdit)
        : 0;
      const safeSelectedIdx = selectedIdx >= 0 ? selectedIdx : 0;
      const selectedLiberacion = (data.liberaciones ?? [])[safeSelectedIdx];

      // IMPORTANTE: asegurar que el fieldArray se hidrate correctamente.
      // Con reset() a veces los fields quedan desincronizados y la UI aparece vacía.
      tomasFieldArray.replace(tomas as any);

      // Resetear flags antes de re-hidratar (evita estados viejos al abrir varias veces)
      setMostrarCampoOtroLineaPorToma({});
      setMostrarCampoOtroSuperficiePorToma({});

      form.reset({
        fecha: fechaAsForm,
        mesCorte: data.mes_corte ?? '',
        detalles: data.detalles ?? '',
        lote: data.lote ?? '',
        producto: data.producto ?? '',
        tipoVerificacion: selectedLiberacion?.tipo_verificacion ?? '',
        tipoVerificacionOtro: '',
        verificadoPor: selectedLiberacion?.verificado_por ?? user?.name ?? '',
        responsableProduccion: selectedLiberacion?.responsable_produccion ?? '',
        responsableMantenimiento: selectedLiberacion?.responsable_mantenimiento ?? '',
        tomas,
      });

      pendingForm.reset({
        fecha: fechaAsForm,
        mesCorte: data.mes_corte ?? '',
        detalles: data.detalles ?? '',
        lote: data.lote ?? '',
        producto: data.producto ?? '',
        tipoVerificacion: selectedLiberacion?.tipo_verificacion ?? '',
        verificadoPor: selectedLiberacion?.verificado_por ?? user?.name ?? '',
        tipoVerificacionOtro: '',
        responsableProduccion: selectedLiberacion?.responsable_produccion ?? '',
        responsableMantenimiento: selectedLiberacion?.responsable_mantenimiento ?? '',
        tomas,
      });

      // Hidratar OTRO para tipo de verificación si viene un valor custom desde DB
      const rawTipo = String(selectedLiberacion?.tipo_verificacion ?? '').trim();
      if (rawTipo) {
        if (tipoVerificacionOptions.includes(rawTipo)) {
          setMostrarCampoOtro(false);
          form.setValue('tipoVerificacion', rawTipo);
          form.setValue('tipoVerificacionOtro', '');
          pendingForm.setValue('tipoVerificacion', rawTipo);
          pendingForm.setValue('tipoVerificacionOtro', '');
        } else {
          setMostrarCampoOtro(true);
          form.setValue('tipoVerificacion', 'OTRO');
          form.setValue('tipoVerificacionOtro', rawTipo);
          pendingForm.setValue('tipoVerificacion', 'OTRO');
          pendingForm.setValue('tipoVerificacionOtro', rawTipo);
        }
      }

      if (liberacionIdToEdit) {
        if (safeSelectedIdx >= 0) setTomaActivaIndex(safeSelectedIdx);
      } else {
        setTomaActivaIndex(0);
      }
    };

    loadRegistroToEdit().catch((error) => {
      console.error('Error cargando registro para edición:', error);
      toast({
        title: 'Error',
        description: 'No se pudo cargar el registro de limpieza para editar.',
        variant: 'destructive',
      });
    });
  }, [
    isOpen,
    registroIdToEdit,
    liberacionIdToEdit,
    initialVerification,
    viewOnlyMode,
    form,
    pendingForm,
    toast,
    user?.name,
  ]);

  const normalizationRunRef = React.useRef<Record<string, boolean>>({});

  // Normalizar valores custom de OTRO para selects dependientes de listas dinámicas (equipos/partes).
  // Esto asegura que al reabrir una liberación, si el valor guardado no está en el Select,
  // se muestre como OTRO + input con el valor persistido. Importante: evitar loops de carga.
  React.useEffect(() => {
    if (!isOpen) return;
    const normalizationKey = registroIdToEdit ?? registroId;
    if (!normalizationKey) return;
    if (equipos.length === 0) return;

    const tomasValues = form.getValues('tomas') || [];
    if (!tomasValues.length) return;

    tomasValues.forEach((toma, idx) => {
      const rawLineaFromDb = String((toma as any)?.lineaOtro ?? (toma as any)?.linea ?? '').trim();
      const rawSuperficieFromDb = String((toma as any)?.superficieOtro ?? (toma as any)?.superficie ?? '').trim();

      const equipoExiste = rawLineaFromDb
        ? equipos.some((e) => String(e.nombre).trim() === rawLineaFromDb)
        : false;

      if (rawLineaFromDb && !equipoExiste) {
        form.setValue(`tomas.${idx}.linea`, 'OTRO');
        form.setValue(`tomas.${idx}.lineaOtro`, rawLineaFromDb);
        setMostrarCampoOtroLineaPorToma((prev) => ({ ...prev, [idx]: true }));
        // Si el equipo es OTRO, NO limpiar superficie: puede venir un valor custom persistido.
        // Normalizar superficie contra el valor persistido para que se muestre como OTRO + input.
        if (rawSuperficieFromDb) {
          if (rawSuperficieFromDb === 'Todas las superficies cumplen') {
            form.setValue(`tomas.${idx}.superficie`, rawSuperficieFromDb);
            form.setValue(`tomas.${idx}.superficieOtro`, '');
            setMostrarCampoOtroSuperficiePorToma((prev) => ({ ...prev, [idx]: false }));
          } else {
            form.setValue(`tomas.${idx}.superficie`, 'OTRO');
            form.setValue(`tomas.${idx}.superficieOtro`, rawSuperficieFromDb);
            setMostrarCampoOtroSuperficiePorToma((prev) => ({ ...prev, [idx]: true }));
          }
        }
        return;
      }

      if (rawLineaFromDb && equipoExiste) {
        form.setValue(`tomas.${idx}.linea`, rawLineaFromDb);
        setMostrarCampoOtroLineaPorToma((prev) => ({ ...prev, [idx]: false }));

        const alreadyLoaded = Array.isArray(partesPorToma[idx]);
        const isLoading = Boolean(isLoadingPartesPorToma[idx]);
        if (!alreadyLoaded && !isLoading) {
          cargarPartesEquipo(idx, rawLineaFromDb);
        }
      }

      // Superficie: solo cuando ya hay partes cargadas (o si el usuario ya tiene OTRO)
      if (!rawSuperficieFromDb) return;
      if (rawSuperficieFromDb === 'Todas las superficies cumplen') {
        form.setValue(`tomas.${idx}.superficie`, rawSuperficieFromDb);
        setMostrarCampoOtroSuperficiePorToma((prev) => ({ ...prev, [idx]: false }));
        return;
      }

      const partes = partesPorToma[idx];
      if (!Array.isArray(partes)) return;

      const parteExiste = partes.some((p) => String(p.nombre).trim() === rawSuperficieFromDb);
      if (parteExiste) {
        form.setValue(`tomas.${idx}.superficie`, rawSuperficieFromDb);
        setMostrarCampoOtroSuperficiePorToma((prev) => ({ ...prev, [idx]: false }));
      } else {
        form.setValue(`tomas.${idx}.superficie`, 'OTRO');
        form.setValue(`tomas.${idx}.superficieOtro`, rawSuperficieFromDb);
        setMostrarCampoOtroSuperficiePorToma((prev) => ({ ...prev, [idx]: true }));
      }
    });

    normalizationRunRef.current[String(normalizationKey)] = true;
  }, [
    isOpen,
    registroIdToEdit,
    registroId,
    equipos,
    partesPorToma,
    isLoadingPartesPorToma,
    form,
    tomasFieldArray.fields.length,
  ]);

  React.useEffect(() => {
    if (!isOpen) return;
    if (initialVerification) return;
    if (viewOnlyMode) return;
    if (registroIdToEdit) return;
    if (registroId) return;

    if (prefilledData) {
      form.setValue('fecha', prefilledData.fecha || getFechaActual());
      form.setValue('mesCorte', prefilledData.mesCorte || getMesActual());
      if (prefilledData.lote) {
        form.setValue('lote', prefilledData.lote);
      }
      if (prefilledData.producto) {
        form.setValue('producto', prefilledData.producto);
      }
      if (prefilledData.linea) {
        if (!form.getValues('tomas')?.length) {
          tomasFieldArray.append({
            hora: getHoraActual(),
            linea: prefilledData.linea,
            lineaOtro: '',
            superficie: '',
            superficieOtro: '',
            estadoFiltro: '',
            novedadesFiltro: '',
            correccionesFiltro: '',
            presenciaElementosExtranos: '',
            detalleElementosExtranos: '',
            resultadosAtpRi: '',
            resultadosAtpAc: '',
            resultadosAtpRf: '',
            loteHisopoAtp: '',
            observacionAtp: '',
            equipoAtp: '',
            parteAtp: '',
            deteccionAlergenosRi: '',
            deteccionAlergenosAc: '',
            deteccionAlergenosRf: '',
            loteHisopoAlergenos: '',
            observacionAlergenos: '',
            equipoAlergenos: '',
            parteAlergenos: '',
            detergente: '',
            desinfectante: '',
            verificacionVisual: '',
            observacionVisual: '',
          });
          setTomaActivaIndex(0);
        } else {
          form.setValue('tomas.0.linea', prefilledData.linea);
        }
      }
      if (prefilledData.responsableProduccion) {
        form.setValue('responsableProduccion', prefilledData.responsableProduccion);
      }
    }
  }, [
    prefilledData,
    isOpen,
    initialVerification,
    registroId,
    registroIdToEdit,
    viewOnlyMode,
    form,
    tomasFieldArray,
  ]);

  // Efecto para precargar datos de verificación existente (modo edición)
  React.useEffect(() => {
    if (initialVerification && isOpen && !viewOnlyMode) {
      setIsEditMode(true);
      
      // Formatear fecha al formato DD/MM/AA para el formulario
      const fechaFormateada = format(new Date(initialVerification.fecha), 'dd/MM/yy');
      
      // Precargar todos los datos de la verificación existente
      form.setValue('fecha', fechaFormateada);
      form.setValue('mesCorte', initialVerification.mes_corte || '');
      form.setValue('tipoVerificacion', initialVerification.tipo_verificacion || '');

      if (!form.getValues('tomas')?.length) {
        tomasFieldArray.append({
          hora: initialVerification.hora || getHoraActual(),
          linea: initialVerification.linea || '',
          lineaOtro: '',
          superficie: initialVerification.superficie || '',
          superficieOtro: '',
          estadoFiltro: initialVerification.estado_filtro?.toString() || '',
          novedadesFiltro: '',
          correccionesFiltro: '',
          presenciaElementosExtranos: initialVerification.presencia_elementos_extranos || '',
          detalleElementosExtranos: initialVerification.detalle_elementos_extranos || '',
          resultadosAtpRi: initialVerification.resultados_atp_ri || '',
          resultadosAtpAc: initialVerification.resultados_atp_ac || '',
          resultadosAtpRf: initialVerification.resultados_atp_rf || '',
          loteHisopoAtp: initialVerification.lote_hisopo || '',
          observacionAtp: initialVerification.observacion_atp || '',
          equipoAtp: (initialVerification as any).equipo_atp || '',
          parteAtp: (initialVerification as any).parte_atp || '',
          deteccionAlergenosRi: initialVerification.deteccion_alergenos_ri || '',
          deteccionAlergenosAc: initialVerification.deteccion_alergenos_ac || '',
          deteccionAlergenosRf: initialVerification.deteccion_alergenos_rf || '',
          loteHisopoAlergenos: initialVerification.lote_hisopo2 || '',
          observacionAlergenos: initialVerification.observacion_alergenos || '',
          equipoAlergenos: (initialVerification as any).equipo_alergenos || '',
          parteAlergenos: (initialVerification as any).parte_alergenos || '',
          detergente: initialVerification.detergente || '',
          desinfectante: initialVerification.desinfectante || '',
          verificacionVisual: initialVerification.verificacion_visual?.toString() || '',
          observacionVisual: initialVerification.observacion_visual || '',
        });
        setTomaActivaIndex(0);
      }

      form.setValue('tomas.0.linea', initialVerification.linea || '');
      form.setValue('tomas.0.superficie', initialVerification.superficie || '');
      form.setValue('tomas.0.estadoFiltro', initialVerification.estado_filtro?.toString() || '');
      form.setValue('tomas.0.presenciaElementosExtranos', initialVerification.presencia_elementos_extranos || '');
      form.setValue('tomas.0.detalleElementosExtranos', initialVerification.detalle_elementos_extranos || '');
      form.setValue('tomas.0.resultadosAtpRi', initialVerification.resultados_atp_ri || '');
      form.setValue('tomas.0.resultadosAtpAc', initialVerification.resultados_atp_ac || '');
      form.setValue('tomas.0.resultadosAtpRf', initialVerification.resultados_atp_rf || '');
      form.setValue('tomas.0.loteHisopoAtp', initialVerification.lote_hisopo || '');
      form.setValue('tomas.0.observacionAtp', initialVerification.observacion_atp || '');
      form.setValue('tomas.0.deteccionAlergenosRi', initialVerification.deteccion_alergenos_ri || '');
      form.setValue('tomas.0.deteccionAlergenosAc', initialVerification.deteccion_alergenos_ac || '');
      form.setValue('tomas.0.deteccionAlergenosRf', initialVerification.deteccion_alergenos_rf || '');
      form.setValue('tomas.0.loteHisopoAlergenos', initialVerification.lote_hisopo2 || '');
      form.setValue('tomas.0.observacionAlergenos', initialVerification.observacion_alergenos || '');
      form.setValue('tomas.0.detergente', initialVerification.detergente || '');
      form.setValue('tomas.0.desinfectante', initialVerification.desinfectante || '');
      form.setValue('tomas.0.verificacionVisual', initialVerification.verificacion_visual?.toString() || '');
      form.setValue('tomas.0.observacionVisual', initialVerification.observacion_visual || '');
      form.setValue('verificadoPor', initialVerification.verificado_por || '');
      form.setValue('responsableProduccion', initialVerification.responsable_produccion || '');
      form.setValue('responsableMantenimiento', initialVerification.responsable_mantenimiento || '');

      if (initialVerification.linea) {
        cargarPartesEquipo(0, initialVerification.linea);
      }
    } else if (!initialVerification) {
      setIsEditMode(false);
    }
  }, [initialVerification, isOpen, form, tomasFieldArray]);

  // Efecto para actualizar las fechas cuando el modal se abre
  React.useEffect(() => {
    if (!isOpen) return;

    // Si se está abriendo para ver/editar un registro/liberación existente, NO sobreescribir valores cargados.
    if (viewOnlyMode) return;
    if (initialVerification) return;
    if (registroIdToEdit) return;
    if (registroId) return;

    // Actualizar fecha con la fecha actual exacta
    form.setValue('fecha', getFechaActual());

    // Actualizar mes de corte con el mes actual (solo si no hay datos precargados)
    if (!prefilledData?.mesCorte) {
      form.setValue('mesCorte', getMesActual());
    }

    // Solo sugerir hora por defecto si ya existe una toma (caso: creación manual con toma inicial)
    if (form.getValues('tomas')?.length) {
      form.setValue('tomas.0.hora', getHoraActual());
    }
  }, [isOpen, prefilledData?.mesCorte, form, initialVerification, registroId, registroIdToEdit, viewOnlyMode]);

  async function onSubmit(values: z.infer<typeof limpiezaFormSchema>) {
    console.log(' Enviando formulario de limpieza:', values);
    
    try {
      if (liberacionStatusByIndex?.[tomaActivaIndex] === 'completed') {
        toast({
          title: 'Acción no permitida',
          description: 'No se puede editar una liberación completada.',
          variant: 'destructive',
        });
        return;
      }
      if (isEditMode && initialVerification) {
        // Modo edición: actualizar la verificación existente
        console.log(' Actualizando verificación existente:', initialVerification.id);
        
        // Convertir fecha de DD/MM/AA a YYYY-MM-DD para la API
        let fechaFormateada = values.fecha;
        if (values.fecha.includes('/')) {
          const partes = values.fecha.split('/');
          if (partes.length === 3) {
            const dia = partes[0].padStart(2, '0');
            const mes = partes[1].padStart(2, '0');
            const año = partes[2].length === 2 ? '20' + partes[2] : partes[2];
            fechaFormateada = `${año}-${mes}-${dia}`;
          }
        }
        
        const toma0 = values.tomas[0];
        const tipoVerificacionFinal =
          String(values.tipoVerificacion || '').trim() === 'OTRO'
            ? String(values.tipoVerificacionOtro || '').trim()
            : String(values.tipoVerificacion || '').trim();
        const lineaFinal =
          String(toma0?.linea || '').trim() === 'OTRO'
            ? String(toma0?.lineaOtro || '').trim()
            : String(toma0?.linea || '').trim();
        const superficieFinal =
          String(toma0?.superficie || '').trim() === 'OTRO'
            ? String(toma0?.superficieOtro || '').trim()
            : String(toma0?.superficie || '').trim();
        const updatedVerification = await limpiezaVerificationsService.update(initialVerification.id, {
          fecha: fechaFormateada,
          mes_corte: values.mesCorte,
          hora: toma0.hora,
          tipo_verificacion: tipoVerificacionFinal,
          linea: lineaFinal,
          superficie: superficieFinal,
          estado_filtro: toma0.estadoFiltro ? parseInt(toma0.estadoFiltro) : 0,
          presencia_elementos_extranos: toma0.presenciaElementosExtranos || null,
          detalle_elementos_extranos: toma0.detalleElementosExtranos || null,
          resultados_atp_ri: toma0.resultadosAtpRi || null,
          resultados_atp_ac: toma0.resultadosAtpAc || null,
          resultados_atp_rf: toma0.resultadosAtpRf || null,
          lote_hisopo: toma0.loteHisopoAtp || null,
          observacion_atp: toma0.observacionAtp || null,
          deteccion_alergenos_ri: toma0.deteccionAlergenosRi || null,
          deteccion_alergenos_ac: toma0.deteccionAlergenosAc || null,
          deteccion_alergenos_rf: toma0.deteccionAlergenosRf || null,
          lote_hisopo2: toma0.loteHisopoAlergenos || null,
          observacion_alergenos: toma0.observacionAlergenos || null,
          detergente: toma0.detergente || null,
          desinfectante: toma0.desinfectante || null,
          verificacion_visual: toma0.verificacionVisual ? parseInt(toma0.verificacionVisual) : 0,
          observacion_visual: toma0.observacionVisual || null,
          verificado_por: values.verificadoPor,
          responsable_produccion: values.responsableProduccion,
          responsable_mantenimiento: values.responsableMantenimiento,
          status: 'completed', // Cambiar status a completed al actualizar
        });
        
        console.log(' Verificación actualizada exitosamente:', updatedVerification);
        
        // Si era un registro pendiente que se está completando, verificar si hay una tarea relacionada
        if (initialVerification.status === 'pending') {
          console.log(' Buscando tarea relacionada para marcar como completada...');
          
          // Buscar tarea relacionada por fecha, tipo y línea
          try {
            const allTasks = await limpiezaTasksService.getAll();
            const relatedTask = allTasks.find(task => 
              task.fecha === initialVerification.fecha &&
              task.tipo_muestra === initialVerification.tipo_verificacion &&
              task.area === initialVerification.linea
            );
            
            if (relatedTask && relatedTask.status === 'pending') {
              console.log(' Marcando tarea relacionada como completada:', relatedTask.id);
              await limpiezaTasksService.update(relatedTask.id, { status: 'completed' });
              console.log(' Tarea marcada como completada exitosamente');
            }
          } catch (taskError) {
            console.error(' Error al actualizar tarea relacionada:', taskError);
            // No bloquear el flujo principal si falla la actualización de la tarea
          }
        }
        
        toast({
          title: "Registro Completado",
          description: "El registro de limpieza ha sido completado exitosamente.",
        });
      } else {
        // Nuevo modelo: guardar registro padre + solo liberación actual
        // Convertir fecha de DD/MM/AA a YYYY-MM-DD para la API
        let fechaFormateada = values.fecha;
        if (values.fecha.includes('/')) {
          const partes = values.fecha.split('/');
          if (partes.length === 3) {
            const dia = partes[0].padStart(2, '0');
            const mes = partes[1].padStart(2, '0');
            const año = partes[2].length === 2 ? '20' + partes[2] : partes[2];
            fechaFormateada = `${año}-${mes}-${dia}`;
          }
        }

        const tipoVerificacionFinal =
          String(values.tipoVerificacion || '').trim() === 'OTRO'
            ? String(values.tipoVerificacionOtro || '').trim()
            : String(values.tipoVerificacion || '').trim();

        const origin = initialTask ? 'cronograma' : shouldShowLoteProducto ? 'produccion' : 'manual';
        const nextRegistroId = registroId;

        const buildLiberacionPayload = (idx: number) => {
          const toma = values.tomas[idx];
          const currentId = liberacionIdsByIndex[idx] ?? null;
          const lineaFinal =
            String(toma?.linea || '').trim() === 'OTRO'
              ? String(toma?.lineaOtro || '').trim()
              : String(toma?.linea || '').trim();

          const superficieFinal =
            String(toma?.superficie || '').trim() === 'OTRO'
              ? String(toma?.superficieOtro || '').trim()
              : String(toma?.superficie || '').trim();

          return {
            id: currentId ?? undefined,
            registro_id: nextRegistroId ?? undefined,
            hora: toma?.hora ?? null,
            tipo_verificacion: tipoVerificacionFinal || null,
            linea: lineaFinal || null,
            superficie: superficieFinal || null,
            estado_filtro: toma?.estadoFiltro ? parseInt(toma.estadoFiltro) : null,
            novedades_filtro: toma?.novedadesFiltro || null,
            correcciones_filtro: toma?.correccionesFiltro || null,
            presencia_elementos_extranos: toma?.presenciaElementosExtranos || null,
            detalle_elementos_extranos: toma?.detalleElementosExtranos || null,
            resultados_atp_ri: toma?.resultadosAtpRi || null,
            resultados_atp_ac: toma?.resultadosAtpAc || null,
            resultados_atp_rf: toma?.resultadosAtpRf || null,
            lote_hisopo_atp: toma?.loteHisopoAtp || null,
            observacion_atp: toma?.observacionAtp || null,
            equipo_atp: toma?.equipoAtp || null,
            parte_atp: toma?.parteAtp || null,
            deteccion_alergenos_ri: toma?.deteccionAlergenosRi || null,
            deteccion_alergenos_ac: toma?.deteccionAlergenosAc || null,
            deteccion_alergenos_rf: toma?.deteccionAlergenosRf || null,
            lote_hisopo_alergenos: toma?.loteHisopoAlergenos || null,
            observacion_alergenos: toma?.observacionAlergenos || null,
            equipo_alergenos: toma?.equipoAlergenos || null,
            parte_alergenos: toma?.parteAlergenos || null,
            detergente: toma?.detergente || null,
            desinfectante: toma?.desinfectante || null,
            verificacion_visual: toma?.verificacionVisual ? parseInt(toma.verificacionVisual) : null,
            observacion_visual: toma?.observacionVisual || null,
            verificado_por: values.verificadoPor || null,
            responsable_produccion: values.responsableProduccion || null,
            responsable_mantenimiento: values.responsableMantenimiento || null,
            status: 'completed' as const,
            created_by: user?.name || null,
            updated_by: user?.name || null,
          };
        };

        const liberacionesPayload = (values.tomas || []).map((_, idx) => buildLiberacionPayload(idx));

        if (!nextRegistroId) {
          const created = await limpiezaRegistrosService.create({
            fecha: fechaFormateada,
            mes_corte: values.mesCorte,
            detalles: values.detalles || null,
            lote: values.lote || null,
            producto: values.producto || null,
            origin,
            cronograma_task_id: initialTask ? initialTask.id : null,
            created_by: user?.name || null,
            liberaciones: liberacionesPayload,
          });

          setRegistroId(created.id);
          setLiberacionIdsByIndex((prev) => {
            const next = { ...prev };
            (created.liberaciones ?? []).forEach((lib: any, idx: number) => {
              next[idx] = lib?.id ?? null;
            });
            return next;
          });
        } else {
          await limpiezaRegistrosService.update(nextRegistroId, {
            fecha: fechaFormateada,
            mes_corte: values.mesCorte,
            detalles: values.detalles || null,
            lote: values.lote || null,
            producto: values.producto || null,
            updated_by: user?.name || null,
          });

          const upsertResults = await Promise.all(
            liberacionesPayload.map(async (payload, idx) => {
              const res = await limpiezaLiberacionesService.upsert({
                ...payload,
                registro_id: nextRegistroId,
              });
              return { idx, id: res?.liberacion?.id ?? (payload as any)?.id ?? null };
            })
          );

          setLiberacionIdsByIndex((prev) => {
            const next = { ...prev };
            upsertResults.forEach((r) => {
              next[r.idx] = r.id;
            });
            return next;
          });
        }

        if (initialTask) {
          console.log(' Marcando tarea como completada:', initialTask.id);
          await limpiezaTasksService.update(initialTask.id, { status: 'completed' });
          console.log(' Tarea marcada como completada exitosamente');
        }

        if (associatedTaskId) {
          try {
            console.log(' Marcando tarea asociada como completada:', associatedTaskId);
            await limpiezaTasksService.markAsCompleted(associatedTaskId);
            console.log(' Tarea marcada como completada exitosamente');
          } catch (error) {
            console.error(' Error al marcar tarea como completada:', error);
          }
        }

        toast({
          title: 'Registro Guardado',
          description: 'La liberación actual fue guardada como completada.',
        });
      }
      
      if (onSuccessfulSubmit) {
        onSuccessfulSubmit();
      } else {
        onOpenChange(false);
      }
      
      form.reset();
    } catch (error) {
      console.error(' Error al guardar registro de limpieza:', error);
      toast({
        title: "Error",
        description: "No se pudo guardar el registro de limpieza. Intente nuevamente.",
        variant: "destructive",
      });
    }
  }

  async function onSubmitAsPending() {
    console.log(' Guardando como pendiente...');
    
    try {
      if (liberacionStatusByIndex?.[tomaActivaIndex] === 'completed') {
        toast({
          title: 'Acción no permitida',
          description: 'No se puede editar una liberación completada.',
          variant: 'destructive',
        });
        return;
      }
      const pendingValues = pendingForm.getValues();
      const mainFormValues = form.getValues();

      const combinePrefer = <T,>(pendingValue: T, mainValue: T): T => {
        const p: any = pendingValue as any;
        if (p === undefined || p === null) return mainValue;
        if (typeof p === 'string' && p.trim() === '') return mainValue;
        return pendingValue;
      };
      
      // Para guardar como pendiente, el usuario realmente edita el formulario principal (`form`).
      // Usamos `pendingForm` solo como override cuando tenga valores no vacíos.
      const completeValues = {
        ...mainFormValues,
        ...pendingValues,
        fecha: combinePrefer(pendingValues.fecha as any, mainFormValues.fecha as any) || getFechaActual(),
        mesCorte: combinePrefer(pendingValues.mesCorte as any, mainFormValues.mesCorte as any) || getMesActual(),
        detalles: combinePrefer(pendingValues.detalles as any, mainFormValues.detalles as any) || '',
        lote: combinePrefer(pendingValues.lote as any, mainFormValues.lote as any) || '',
        producto: combinePrefer(pendingValues.producto as any, mainFormValues.producto as any) || '',
        tipoVerificacion: combinePrefer(pendingValues.tipoVerificacion as any, mainFormValues.tipoVerificacion as any) || '',
        verificadoPor: combinePrefer(pendingValues.verificadoPor as any, mainFormValues.verificadoPor as any) || user?.name || '',
        tipoVerificacionOtro: combinePrefer(pendingValues.tipoVerificacionOtro as any, mainFormValues.tipoVerificacionOtro as any) || '',
        responsableProduccion: combinePrefer(pendingValues.responsableProduccion as any, mainFormValues.responsableProduccion as any) || '',
        responsableMantenimiento: combinePrefer(pendingValues.responsableMantenimiento as any, mainFormValues.responsableMantenimiento as any) || '',
        // En "Guardar como Pendiente" el usuario edita realmente el formulario principal (`form`).
        // `pendingForm` puede quedarse desactualizado cuando se agregan liberaciones con el fieldArray.
        // Para evitar guardar solo 1 liberación, preferimos las tomas del `form` (o el array más largo).
        tomas: (() => {
          const mainTomas = Array.isArray(mainFormValues.tomas) ? mainFormValues.tomas : [];
          const pendingTomas = Array.isArray(pendingValues.tomas) ? pendingValues.tomas : [];
          if (mainTomas.length >= pendingTomas.length && mainTomas.length > 0) return mainTomas as any;
          if (pendingTomas.length > 0) return pendingTomas as any;
          return mainFormValues.tomas as any;
        })(),
      };
      
      console.log(' Valores completos para pendiente:', completeValues);
      
      // Convertir fecha de DD/MM/AA a YYYY-MM-DD para la API
      let fechaFormateada = completeValues.fecha || getFechaActual();
      if (completeValues.fecha.includes('/')) {
        const partes = completeValues.fecha.split('/');
        if (partes.length === 3) {
          const dia = partes[0].padStart(2, '0');
          const mes = partes[1].padStart(2, '0');
          const anio = partes[2].length === 2 ? '20' + partes[2] : partes[2];
          fechaFormateada = `${anio}-${mes}-${dia}`;
        }
      }

      const getTomaFromForm = (index: number) => {
        return {
          hora: form.getValues(`tomas.${index}.hora` as const) as any,
          linea: form.getValues(`tomas.${index}.linea` as const) as any,
          lineaOtro: form.getValues(`tomas.${index}.lineaOtro` as const) as any,
          superficie: form.getValues(`tomas.${index}.superficie` as const) as any,
          superficieOtro: form.getValues(`tomas.${index}.superficieOtro` as const) as any,
          estadoFiltro: form.getValues(`tomas.${index}.estadoFiltro` as const) as any,
          novedadesFiltro: form.getValues(`tomas.${index}.novedadesFiltro` as const) as any,
          correccionesFiltro: form.getValues(`tomas.${index}.correccionesFiltro` as const) as any,
          presenciaElementosExtranos: form.getValues(`tomas.${index}.presenciaElementosExtranos` as const) as any,
          detalleElementosExtranos: form.getValues(`tomas.${index}.detalleElementosExtranos` as const) as any,
          resultadosAtpRi: form.getValues(`tomas.${index}.resultadosAtpRi` as const) as any,
          resultadosAtpAc: form.getValues(`tomas.${index}.resultadosAtpAc` as const) as any,
          resultadosAtpRf: form.getValues(`tomas.${index}.resultadosAtpRf` as const) as any,
          loteHisopoAtp: form.getValues(`tomas.${index}.loteHisopoAtp` as const) as any,
          observacionAtp: form.getValues(`tomas.${index}.observacionAtp` as const) as any,
          equipoAtp: form.getValues(`tomas.${index}.equipoAtp` as const) as any,
          parteAtp: form.getValues(`tomas.${index}.parteAtp` as const) as any,
          deteccionAlergenosRi: form.getValues(`tomas.${index}.deteccionAlergenosRi` as const) as any,
          deteccionAlergenosAc: form.getValues(`tomas.${index}.deteccionAlergenosAc` as const) as any,
          deteccionAlergenosRf: form.getValues(`tomas.${index}.deteccionAlergenosRf` as const) as any,
          loteHisopoAlergenos: form.getValues(`tomas.${index}.loteHisopoAlergenos` as const) as any,
          observacionAlergenos: form.getValues(`tomas.${index}.observacionAlergenos` as const) as any,
          equipoAlergenos: form.getValues(`tomas.${index}.equipoAlergenos` as const) as any,
          parteAlergenos: form.getValues(`tomas.${index}.parteAlergenos` as const) as any,
          detergente: form.getValues(`tomas.${index}.detergente` as const) as any,
          desinfectante: form.getValues(`tomas.${index}.desinfectante` as const) as any,
          verificacionVisual: form.getValues(`tomas.${index}.verificacionVisual` as const) as any,
          observacionVisual: form.getValues(`tomas.${index}.observacionVisual` as const) as any,
        };
      };

      const preferNonEmpty = <T,>(a: T, b: T): T => {
        const v: any = a as any;
        if (v === undefined || v === null) return b;
        if (typeof v === 'string' && v.trim() === '') return b;
        return a;
      };

      const tomasSafe =
        Array.isArray(completeValues.tomas) && completeValues.tomas.length > 0
          ? completeValues.tomas
          : [getTomaFromForm(0) as any];

      const safeIndex = Math.max(0, Math.min(tomaActivaIndex, tomasSafe.length - 1));
      // Asegurar que usamos los valores actuales del formulario (incluye descripciones).
      // Esto evita que campos como "detalleElementosExtranos" se pierdan si el array viene incompleto.
      const tomaFromForm = getTomaFromForm(safeIndex) as any;
      const tomaFromValues = (tomasSafe[safeIndex] as any) ?? {};
      const tomaActual = {
        hora: preferNonEmpty(tomaFromForm.hora, tomaFromValues.hora),
        linea: preferNonEmpty(tomaFromForm.linea, tomaFromValues.linea),
        lineaOtro: preferNonEmpty(tomaFromForm.lineaOtro, tomaFromValues.lineaOtro),
        superficie: preferNonEmpty(tomaFromForm.superficie, tomaFromValues.superficie),
        superficieOtro: preferNonEmpty(tomaFromForm.superficieOtro, tomaFromValues.superficieOtro),
        estadoFiltro: preferNonEmpty(tomaFromForm.estadoFiltro, tomaFromValues.estadoFiltro),
        novedadesFiltro: preferNonEmpty(tomaFromForm.novedadesFiltro, tomaFromValues.novedadesFiltro),
        correccionesFiltro: preferNonEmpty(tomaFromForm.correccionesFiltro, tomaFromValues.correccionesFiltro),
        presenciaElementosExtranos: preferNonEmpty(tomaFromForm.presenciaElementosExtranos, tomaFromValues.presenciaElementosExtranos),
        detalleElementosExtranos: preferNonEmpty(tomaFromForm.detalleElementosExtranos, tomaFromValues.detalleElementosExtranos),
        resultadosAtpRi: preferNonEmpty(tomaFromForm.resultadosAtpRi, tomaFromValues.resultadosAtpRi),
        resultadosAtpAc: preferNonEmpty(tomaFromForm.resultadosAtpAc, tomaFromValues.resultadosAtpAc),
        resultadosAtpRf: preferNonEmpty(tomaFromForm.resultadosAtpRf, tomaFromValues.resultadosAtpRf),
        loteHisopoAtp: preferNonEmpty(tomaFromForm.loteHisopoAtp, tomaFromValues.loteHisopoAtp),
        observacionAtp: preferNonEmpty(tomaFromForm.observacionAtp, tomaFromValues.observacionAtp),
        deteccionAlergenosRi: preferNonEmpty(tomaFromForm.deteccionAlergenosRi, tomaFromValues.deteccionAlergenosRi),
        deteccionAlergenosAc: preferNonEmpty(tomaFromForm.deteccionAlergenosAc, tomaFromValues.deteccionAlergenosAc),
        deteccionAlergenosRf: preferNonEmpty(tomaFromForm.deteccionAlergenosRf, tomaFromValues.deteccionAlergenosRf),
        loteHisopoAlergenos: preferNonEmpty(tomaFromForm.loteHisopoAlergenos, tomaFromValues.loteHisopoAlergenos),
        observacionAlergenos: preferNonEmpty(tomaFromForm.observacionAlergenos, tomaFromValues.observacionAlergenos),
        detergente: preferNonEmpty(tomaFromForm.detergente, tomaFromValues.detergente),
        desinfectante: preferNonEmpty(tomaFromForm.desinfectante, tomaFromValues.desinfectante),
        verificacionVisual: preferNonEmpty(tomaFromForm.verificacionVisual, tomaFromValues.verificacionVisual),
        observacionVisual: preferNonEmpty(tomaFromForm.observacionVisual, tomaFromValues.observacionVisual),
      };

      const tipoVerificacionFinal =
        String(completeValues.tipoVerificacion || '').trim() === 'OTRO'
          ? String(completeValues.tipoVerificacionOtro || '').trim()
          : String(completeValues.tipoVerificacion || '').trim();

      const lineaFinal =
        String(tomaActual?.linea || '').trim() === 'OTRO'
          ? String(tomaActual?.lineaOtro || '').trim()
          : String(tomaActual?.linea || '').trim();

      const superficieFinal =
        String(tomaActual?.superficie || '').trim() === 'OTRO'
          ? String(tomaActual?.superficieOtro || '').trim()
          : String(tomaActual?.superficie || '').trim();
      const origin = initialTask ? 'cronograma' : shouldShowLoteProducto ? 'produccion' : 'manual';

      const nextRegistroId = registroId;

      const buildLiberacionPayload = (idx: number) => {
        const tomaFromFormIdx = getTomaFromForm(idx) as any;
        const tomaFromValuesIdx = (tomasSafe[idx] as any) ?? {};
        const tomaMerged = {
          hora: preferNonEmpty(tomaFromFormIdx.hora, tomaFromValuesIdx.hora),
          linea: preferNonEmpty(tomaFromFormIdx.linea, tomaFromValuesIdx.linea),
          lineaOtro: preferNonEmpty(tomaFromFormIdx.lineaOtro, tomaFromValuesIdx.lineaOtro),
          superficie: preferNonEmpty(tomaFromFormIdx.superficie, tomaFromValuesIdx.superficie),
          superficieOtro: preferNonEmpty(tomaFromFormIdx.superficieOtro, tomaFromValuesIdx.superficieOtro),
          estadoFiltro: preferNonEmpty(tomaFromFormIdx.estadoFiltro, tomaFromValuesIdx.estadoFiltro),
          novedadesFiltro: preferNonEmpty(tomaFromFormIdx.novedadesFiltro, tomaFromValuesIdx.novedadesFiltro),
          correccionesFiltro: preferNonEmpty(tomaFromFormIdx.correccionesFiltro, tomaFromValuesIdx.correccionesFiltro),
          presenciaElementosExtranos: preferNonEmpty(tomaFromFormIdx.presenciaElementosExtranos, tomaFromValuesIdx.presenciaElementosExtranos),
          detalleElementosExtranos: preferNonEmpty(tomaFromFormIdx.detalleElementosExtranos, tomaFromValuesIdx.detalleElementosExtranos),
          resultadosAtpRi: preferNonEmpty(tomaFromFormIdx.resultadosAtpRi, tomaFromValuesIdx.resultadosAtpRi),
          resultadosAtpAc: preferNonEmpty(tomaFromFormIdx.resultadosAtpAc, tomaFromValuesIdx.resultadosAtpAc),
          resultadosAtpRf: preferNonEmpty(tomaFromFormIdx.resultadosAtpRf, tomaFromValuesIdx.resultadosAtpRf),
          loteHisopoAtp: preferNonEmpty(tomaFromFormIdx.loteHisopoAtp, tomaFromValuesIdx.loteHisopoAtp),
          observacionAtp: preferNonEmpty(tomaFromFormIdx.observacionAtp, tomaFromValuesIdx.observacionAtp),
          equipoAtp: preferNonEmpty(tomaFromFormIdx.equipoAtp, tomaFromValuesIdx.equipoAtp),
          parteAtp: preferNonEmpty(tomaFromFormIdx.parteAtp, tomaFromValuesIdx.parteAtp),
          deteccionAlergenosRi: preferNonEmpty(tomaFromFormIdx.deteccionAlergenosRi, tomaFromValuesIdx.deteccionAlergenosRi),
          deteccionAlergenosAc: preferNonEmpty(tomaFromFormIdx.deteccionAlergenosAc, tomaFromValuesIdx.deteccionAlergenosAc),
          deteccionAlergenosRf: preferNonEmpty(tomaFromFormIdx.deteccionAlergenosRf, tomaFromValuesIdx.deteccionAlergenosRf),
          loteHisopoAlergenos: preferNonEmpty(tomaFromFormIdx.loteHisopoAlergenos, tomaFromValuesIdx.loteHisopoAlergenos),
          observacionAlergenos: preferNonEmpty(tomaFromFormIdx.observacionAlergenos, tomaFromValuesIdx.observacionAlergenos),
          equipoAlergenos: preferNonEmpty(tomaFromFormIdx.equipoAlergenos, tomaFromValuesIdx.equipoAlergenos),
          parteAlergenos: preferNonEmpty(tomaFromFormIdx.parteAlergenos, tomaFromValuesIdx.parteAlergenos),
          detergente: preferNonEmpty(tomaFromFormIdx.detergente, tomaFromValuesIdx.detergente),
          desinfectante: preferNonEmpty(tomaFromFormIdx.desinfectante, tomaFromValuesIdx.desinfectante),
          verificacionVisual: preferNonEmpty(tomaFromFormIdx.verificacionVisual, tomaFromValuesIdx.verificacionVisual),
          observacionVisual: preferNonEmpty(tomaFromFormIdx.observacionVisual, tomaFromValuesIdx.observacionVisual),
        };

        const lineaFinal =
          String(tomaMerged?.linea || '').trim() === 'OTRO'
            ? String(tomaMerged?.lineaOtro || '').trim()
            : String(tomaMerged?.linea || '').trim();

        const superficieFinal =
          String(tomaMerged?.superficie || '').trim() === 'OTRO'
            ? String(tomaMerged?.superficieOtro || '').trim()
            : String(tomaMerged?.superficie || '').trim();

        const currentId = liberacionIdsByIndex[idx] ?? null;

        return {
          id: currentId ?? undefined,
          registro_id: nextRegistroId ?? undefined,
          hora: tomaMerged?.hora ?? null,
          tipo_verificacion: tipoVerificacionFinal || null,
          linea: lineaFinal || null,
          superficie: superficieFinal || null,
          estado_filtro: tomaMerged?.estadoFiltro ? parseInt(tomaMerged.estadoFiltro) : null,
          novedades_filtro: tomaMerged?.novedadesFiltro || null,
          correcciones_filtro: tomaMerged?.correccionesFiltro || null,
          presencia_elementos_extranos: tomaMerged?.presenciaElementosExtranos || null,
          detalle_elementos_extranos: tomaMerged?.detalleElementosExtranos || null,
          resultados_atp_ri: tomaMerged?.resultadosAtpRi || null,
          resultados_atp_ac: tomaMerged?.resultadosAtpAc || null,
          resultados_atp_rf: tomaMerged?.resultadosAtpRf || null,
          lote_hisopo_atp: tomaMerged?.loteHisopoAtp || null,
          observacion_atp: tomaMerged?.observacionAtp || null,
          equipo_atp: tomaMerged?.equipoAtp || null,
          parte_atp: tomaMerged?.parteAtp || null,
          deteccion_alergenos_ri: tomaMerged?.deteccionAlergenosRi || null,
          deteccion_alergenos_ac: tomaMerged?.deteccionAlergenosAc || null,
          deteccion_alergenos_rf: tomaMerged?.deteccionAlergenosRf || null,
          lote_hisopo_alergenos: tomaMerged?.loteHisopoAlergenos || null,
          observacion_alergenos: tomaMerged?.observacionAlergenos || null,
          equipo_alergenos: tomaMerged?.equipoAlergenos || null,
          parte_alergenos: tomaMerged?.parteAlergenos || null,
          detergente: tomaMerged?.detergente || null,
          desinfectante: tomaMerged?.desinfectante || null,
          verificacion_visual: tomaMerged?.verificacionVisual ? parseInt(tomaMerged.verificacionVisual) : null,
          observacion_visual: tomaMerged?.observacionVisual || null,
          verificado_por: completeValues.verificadoPor || user?.name || null,
          responsable_produccion: completeValues.responsableProduccion || null,
          responsable_mantenimiento: completeValues.responsableMantenimiento || null,
          status: 'pending' as const,
          created_by: user?.name || null,
          updated_by: user?.name || null,
        };
      };

      const liberacionesPayload = (tomasSafe || []).map((_, idx) => buildLiberacionPayload(idx));

      if (!nextRegistroId) {
        const created = await limpiezaRegistrosService.create({
          fecha: fechaFormateada,
          mes_corte: completeValues.mesCorte,
          detalles: completeValues.detalles || null,
          lote: completeValues.lote || null,
          producto: completeValues.producto || null,
          origin,
          cronograma_task_id: initialTask ? initialTask.id : null,
          created_by: user?.name || null,
          liberaciones: liberacionesPayload,
        });

        setRegistroId(created.id);
        setLiberacionIdsByIndex((prev) => {
          const next = { ...prev };
          (created.liberaciones ?? []).forEach((lib: any, idx: number) => {
            next[idx] = lib?.id ?? null;
          });
          return next;
        });
        setLiberacionStatusByIndex((prev) => {
          const next = { ...prev };
          (tomasSafe || []).forEach((_, idx) => {
            next[idx] = 'pending';
          });
          return next;
        });
      } else {
        await limpiezaRegistrosService.update(nextRegistroId, {
          fecha: fechaFormateada,
          mes_corte: completeValues.mesCorte,
          detalles: completeValues.detalles || null,
          lote: completeValues.lote || null,
          producto: completeValues.producto || null,
          updated_by: user?.name || null,
        });

        const upsertResults = await Promise.all(
          liberacionesPayload.map(async (payload, idx) => {
            const res = await limpiezaLiberacionesService.upsert({
              ...payload,
              registro_id: nextRegistroId,
            });
            return { idx, id: res?.liberacion?.id ?? (payload as any)?.id ?? null };
          })
        );

        setLiberacionIdsByIndex((prev) => {
          const next = { ...prev };
          upsertResults.forEach((r) => {
            next[r.idx] = r.id;
          });
          return next;
        });
        setLiberacionStatusByIndex((prev) => {
          const next = { ...prev };
          (tomasSafe || []).forEach((_, idx) => {
            next[idx] = 'pending';
          });
          return next;
        });
      }
      
      toast({
        title: "Registro Guardado como Pendiente",
        description: "La liberación actual fue guardada como pendiente. Puede completarla más tarde.",
      });
      
      if (onSuccessfulSubmit) {
        onSuccessfulSubmit();
      } else {
        onOpenChange(false);
      }
      
      // Resetear ambos formularios
      form.reset();
      pendingForm.reset();
    } catch (error) {
      console.error('❌ Error al guardar como pendiente:', error);
      toast({
        title: "Error",
        description: "No se pudo guardar el registro como pendiente. Intente nuevamente.",
        variant: "destructive",
      });
    }
  }

  const onSubmitFromButtons = React.useCallback(async () => {
    const values = form.getValues();
    const schemaToUse = isRecal084Mode ? recal084RelaxedSchema : limpiezaFormSchema;
    const result = schemaToUse.safeParse(values);

    if (!result.success) {
      result.error.issues.forEach((issue) => {
        const path = issue.path.join('.') as any;
        form.setError(path, { type: 'manual', message: issue.message });
      });
      toast({
        title: 'Error de validación',
        description: 'Faltan campos requeridos para guardar el registro.',
        variant: 'destructive',
      });
      return;
    }

    await onSubmit(result.data as any);
  }, [form, isRecal084Mode, onSubmit, toast]);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>
            {viewOnlyMode 
              ? 'RE-CAL-037 CONSOLIDADO VERIFICACIÓN ORDEN, LIMPIEZA Y DESINFECCIÓN 2026'
              : isEditMode 
                ? 'RE-CAL-037 CONSOLIDADO VERIFICACIÓN ORDEN, LIMPIEZA Y DESINFECCIÓN 2026' 
                : 'RE-CAL-037 CONSOLIDADO VERIFICACIÓN ORDEN, LIMPIEZA Y DESINFECCIÓN 2026'}
            {' [MULTI-TOMAS]'}
          </DialogTitle>
          <DialogDescription asChild className="text-sm">
            <div className="space-y-1">
              <div><strong>Formato:</strong> RE-CAL-037</div>
              <div><strong>Tipo:</strong> CONSOLIDADO VERIFICACIÓN ORDEN, LIMPIEZA Y DESINFECCIÓN 2026</div>
              <div><strong>Versión:</strong> 15</div>
              <div><strong>Fecha Aprobación:</strong> 21 DE MARZO DE 2023</div>
              <div className="pt-2 text-gray-600">
                {viewOnlyMode
                  ? 'Visualizando los detalles de la tarea programada. No se pueden realizar cambios.'
                  : isEditMode 
                    ? 'Complete los campos para actualizar el registro de limpieza existente.'
                    : 'Complete todos los campos para crear un nuevo registro de limpieza y verificación.'}
              </div>
            </div>
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <ScrollArea className="h-[60vh] p-4">
              {wizardStep === 'identificacion' ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <FormField control={form.control} name="fecha" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Fecha (DD/MM/AA)</FormLabel>
                        <Input 
                          disabled={effectiveViewOnlyMode || Boolean(prefilledData?.fecha)} 
                          {...field} 
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
                        />
                        <FormMessage />
                      </FormItem>
                    )} />

                    <FormField control={form.control} name="mesCorte" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Mes de Corte</FormLabel>
                        <Input 
                          disabled={effectiveViewOnlyMode || Boolean(prefilledData?.mesCorte)} 
                          {...field} 
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
                        />
                        <FormMessage />
                      </FormItem>
                    )} />

                    <FormField control={form.control} name="detalles" render={({ field }) => (
                      <FormItem className="md:col-span-2 lg:col-span-3">
                        <FormLabel>Detalles de labor de limpieza</FormLabel>
                        <FormControl>
                          <Textarea disabled={effectiveViewOnlyMode} placeholder="Escriba detalles..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />

                    {shouldShowLoteProducto && (
                      <>
                        <FormField control={form.control} name="lote" render={({ field }) => (
                          <FormItem>
                            <FormLabel>Lote</FormLabel>
                            <Input
                              disabled={true}
                              placeholder="Ingrese lote..."
                              {...field}
                              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
                            />
                            <FormMessage />
                          </FormItem>
                        )} />

                        <FormField control={form.control} name="producto" render={({ field }) => (
                          <FormItem>
                            <FormLabel>Producto</FormLabel>
                            <Input
                              disabled={true}
                              placeholder="Ingrese producto..."
                              {...field}
                              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
                            />
                            <FormMessage />
                          </FormItem>
                        )} />
                      </>
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {registroSubView === 'lista' ? (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between gap-2">
                        <div className="text-sm text-muted-foreground">Selecciona una liberación para ver/editar.</div>
                        <Button
                          type="button"
                          variant="outline"
                          disabled={effectiveViewOnlyMode || !canManageTomas}
                          onClick={() => {
                            tomasFieldArray.append({
                              hora: getHoraActual(),
                              linea: '',
                              lineaOtro: '',
                              superficie: '',
                              superficieOtro: '',
                              estadoFiltro: '',
                              novedadesFiltro: '',
                              correccionesFiltro: '',
                              presenciaElementosExtranos: '',
                              detalleElementosExtranos: '',
                              resultadosAtpRi: '',
                              resultadosAtpAc: '',
                              resultadosAtpRf: '',
                              loteHisopoAtp: '',
                              observacionAtp: '',
                              equipoAtp: '',
                              parteAtp: '',
                              deteccionAlergenosRi: '',
                              deteccionAlergenosAc: '',
                              deteccionAlergenosRf: '',
                              loteHisopoAlergenos: '',
                              observacionAlergenos: '',
                              equipoAlergenos: '',
                              parteAlergenos: '',
                              detergente: '',
                              desinfectante: '',
                              verificacionVisual: '',
                              observacionVisual: '',
                            });
                            const nextIndex = tomasFieldArray.fields.length;
                            setTomaActivaIndex(nextIndex);
                            setRegistroSubView('detalle');
                          }}
                        >
                          + Agregar liberación
                        </Button>
                      </div>

                      {!canManageTomas && (
                        <div className="text-sm text-muted-foreground">
                          Completa Fecha y Mes de Corte para habilitar el registro de liberaciones.
                        </div>
                      )}

                      {tomasFieldArray.fields.length === 0 ? (
                        <div className="text-sm text-muted-foreground">
                          Aún no hay liberaciones creadas.
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                          {tomasFieldArray.fields.map((toma, index) => (
                            (() => {
                              const status = getLiberacionStatus(index);
                              const hora = String(form.getValues(`tomas.${index}.hora` as const) || '').trim();
                              const statusClass =
                                status === 'completed'
                                  ? 'border-green-300 bg-green-50 text-green-800 hover:bg-green-100'
                                  : 'border-yellow-300 bg-yellow-50 text-yellow-800 hover:bg-yellow-100';

                              return (
                            <Button
                              key={toma.id}
                              type="button"
                              variant="outline"
                              className={`justify-between ${statusClass}`}
                              disabled={effectiveViewOnlyMode}
                              onClick={() => {
                                const horaActual = String(
                                  form.getValues(`tomas.${index}.hora` as const) || ''
                                ).trim();
                                if (!horaActual) {
                                  form.setValue(`tomas.${index}.hora` as const, getHoraActual());
                                }
                                setTomaActivaIndex(index);
                                setRegistroSubView('detalle');
                              }}
                            >
                              <span>Liberación {index + 1}</span>
                              <span className="text-xs font-medium tabular-nums">{hora || '--:--'}</span>
                            </Button>
                              );
                            })()
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between gap-2">
                        <div className="text-lg font-semibold">Liberación {tomaActivaIndex + 1}</div>
                        

                    
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setRegistroSubView('lista')}
                        >
                          Volver
                        </Button>
                      </div>

                      <div className="space-y-4">
                        <div className="rounded-md border p-4 space-y-4">
                          <div className="font-semibold">Registro</div>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            <FormField control={form.control} name={`tomas.${tomaActivaIndex}.hora`} render={({ field }) => (
                              <FormItem>
                                <FormLabel>Hora</FormLabel>
                                <div className="relative">
                                  <button
                                    type="button"
                                    onClick={openHoraPicker}
                                    disabled={effectiveViewOnlyMode}
                                    className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground disabled:opacity-50"
                                    aria-label="Seleccionar hora"
                                  >
                                    <Clock className="h-4 w-4" />
                                  </button>
                                  <Input
                                    ref={(el) => {
                                      horaInputRef.current = el;
                                      field.ref(el);
                                    }}
                                    type="time"
                                    step={60}
                                    disabled={effectiveViewOnlyMode}
                                    className="pl-9"
                                    name={field.name}
                                    value={field.value}
                                    onChange={field.onChange}
                                    onBlur={field.onBlur}
                                  />
                                </div>
                                <FormMessage />
                              </FormItem>
                            )} />

                            <FormField control={form.control} name="tipoVerificacion" render={({ field }) => (
                              <FormItem>
                                <FormLabel>Tipo de Verificación</FormLabel>
                                <Select
                                  disabled={effectiveViewOnlyMode}
                                  onValueChange={(value) => {
                                    field.onChange(value);
                                    setMostrarCampoOtro(value === 'OTRO');
                                    if (value !== 'OTRO') {
                                      form.setValue('tipoVerificacionOtro', '');
                                    }
                                  }}
                                  value={field.value}
                                >
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Seleccione tipo de verificación" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="VERIFICACIÓN RUTINARIA">VERIFICACIÓN RUTINARIA</SelectItem>
                                    <SelectItem value="LIMPIEZA PROFUNDA">LIMPIEZA PROFUNDA</SelectItem>
                                    <SelectItem value="LIBERACIÓN DE ARRANQUE">LIBERACIÓN DE ARRANQUE</SelectItem>
                                    <SelectItem value="CAMBIO DE REFERENCIA">CAMBIO DE REFERENCIA</SelectItem>
                                    <SelectItem value="OTRO">OTRO</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )} />

                            <FormField control={form.control} name={`tomas.${tomaActivaIndex}.linea`} render={({ field }) => (
                              <FormItem>
                                <FormLabel>Equipo/Área</FormLabel>
                                <Select
                                  disabled={effectiveViewOnlyMode || isLoadingEquipos}
                                  onValueChange={(value) => {
                                    field.onChange(value);
                                    setMostrarCampoOtroLineaPorToma(prev => ({ ...prev, [tomaActivaIndex]: value === 'OTRO' }));
                                    cargarPartesEquipo(tomaActivaIndex, value);
                                    form.setValue(`tomas.${tomaActivaIndex}.superficie`, '');
                                    form.setValue(`tomas.${tomaActivaIndex}.superficieOtro`, '');
                                    setMostrarCampoOtroSuperficiePorToma(prev => ({ ...prev, [tomaActivaIndex]: false }));
                                  }}
                                  value={field.value}
                                >
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder={isLoadingEquipos ? 'Cargando equipos...' : 'Seleccione un equipo'} />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {equipos.map((equipo) => (
                                      <SelectItem key={equipo.id} value={equipo.nombre}>
                                        {equipo.nombre}
                                      </SelectItem>
                                    ))}
                                    <SelectItem value="OTRO">OTRO</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )} />

                            {mostrarCampoOtroLineaPorToma[tomaActivaIndex] && (
                              <FormField control={form.control} name={`tomas.${tomaActivaIndex}.lineaOtro`} render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Especificar Equipo/Área</FormLabel>
                                  <Input disabled={effectiveViewOnlyMode} placeholder="Escriba el nombre del equipo..." {...field} />
                                  <FormMessage />
                                </FormItem>
                              )} />
                            )}

                            <FormField control={form.control} name={`tomas.${tomaActivaIndex}.superficie`} render={({ field }) => (
                              <FormItem>
                                <FormLabel>Superficie</FormLabel>
                                <Select
                                  disabled={effectiveViewOnlyMode || !!isLoadingPartesPorToma[tomaActivaIndex]}
                                  onValueChange={(value) => {
                                    field.onChange(value);
                                    setMostrarCampoOtroSuperficiePorToma(prev => ({ ...prev, [tomaActivaIndex]: value === 'OTRO' }));
                                  }}
                                  value={field.value}
                                >
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder={isLoadingPartesPorToma[tomaActivaIndex] ? 'Cargando superficies...' : 'Seleccione una superficie'} />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="Todas las superficies cumplen">Todas las superficies cumplen</SelectItem>
                                    {(partesPorToma[tomaActivaIndex] || []).map((parte) => (
                                      <SelectItem key={parte.id} value={parte.nombre}>
                                        {parte.nombre}
                                      </SelectItem>
                                    ))}
                                    <SelectItem value="OTRO">OTRO</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )} />

                            {mostrarCampoOtroSuperficiePorToma[tomaActivaIndex] && (
                              <FormField control={form.control} name={`tomas.${tomaActivaIndex}.superficieOtro`} render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Especificar Superficie</FormLabel>
                                  <Input disabled={effectiveViewOnlyMode} placeholder="Escriba el nombre de la superficie..." {...field} />
                                  <FormMessage />
                                </FormItem>
                              )} />
                            )}

                            {mostrarCampoOtro && (
                              <FormField control={form.control} name="tipoVerificacionOtro" render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Especificar Tipo de Verificación</FormLabel>
                                  <Input disabled={effectiveViewOnlyMode} placeholder="Escriba el tipo de verificación..." {...field} />
                                  <FormMessage />
                                </FormItem>
                              )} />
                            )}
                          </div>
                        </div>

                        <div className="rounded-md border p-4 space-y-4">
                          <div className="font-semibold">Filtros</div>
                          <FormField control={form.control} name={`tomas.${tomaActivaIndex}.estadoFiltro`} render={({ field }) => (
                            <FormItem>
                              <FormLabel>Estado del Filtro</FormLabel>
                              <Select disabled={effectiveViewOnlyMode} onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Seleccione estado del filtro" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="1">Cumple</SelectItem>
                                  <SelectItem value="0">No cumple</SelectItem>
                                  <SelectItem value="2">No aplica</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )} />

                          {form.watch(`tomas.${tomaActivaIndex}.estadoFiltro`) === '0' && (
                            <>
                              <FormField control={form.control} name={`tomas.${tomaActivaIndex}.novedadesFiltro`} render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Novedades</FormLabel>
                                  <FormControl>
                                    <Textarea disabled={effectiveViewOnlyMode} placeholder="Describa las novedades..." {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )} />
                              <FormField control={form.control} name={`tomas.${tomaActivaIndex}.correccionesFiltro`} render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Correcciones</FormLabel>
                                  <FormControl>
                                    <Textarea disabled={effectiveViewOnlyMode} placeholder="Describa las correcciones..." {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )} />
                            </>
                          )}

                          <FormField control={form.control} name={`tomas.${tomaActivaIndex}.presenciaElementosExtranos`} render={({ field }) => (
                            <FormItem>
                              <FormLabel>Presencia de Elementos Extraños</FormLabel>
                              <Select disabled={effectiveViewOnlyMode} onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Seleccione..." />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="No">No</SelectItem>
                                  <SelectItem value="Si">Si</SelectItem>
                                  <SelectItem value="No aplica">No aplica</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )} />
                          {form.watch(`tomas.${tomaActivaIndex}.presenciaElementosExtranos`) === 'Si' && (
                            <FormField control={form.control} name={`tomas.${tomaActivaIndex}.detalleElementosExtranos`} render={({ field }) => (
                              <FormItem>
                                <FormLabel>Detalles de Elementos Extraños</FormLabel>
                                <FormControl>
                                  <Textarea disabled={effectiveViewOnlyMode} placeholder="Detalle de elementos extraños..." {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )} />
                          )}
                        </div>

                        <div className="rounded-md border p-4 space-y-4">
                          <div className="font-semibold">ATP</div>
                          <datalist id="equipos-catalog">
                            {equipos.map((eq) => (
                              <option key={eq.id} value={eq.nombre} />
                            ))}
                          </datalist>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            <FormField
                              control={form.control}
                              name={`tomas.${tomaActivaIndex}.equipoAtp`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Equipo (ATP)</FormLabel>
                                  <FormControl>
                                    <Input
                                      disabled={effectiveViewOnlyMode || isLoadingEquipos}
                                      list="equipos-catalog"
                                      placeholder={isLoadingEquipos ? 'Cargando equipos...' : ''}
                                      name={field.name}
                                      value={field.value}
                                      onBlur={field.onBlur}
                                      ref={field.ref}
                                      onChange={(e) => {
                                        const value = e.target.value;
                                        field.onChange(value);
                                        form.setValue(`tomas.${tomaActivaIndex}.parteAtp`, '');
                                      }}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name={`tomas.${tomaActivaIndex}.parteAtp`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Parte (ATP)</FormLabel>
                                  <FormControl>
                                    <Select
                                      disabled={
                                        effectiveViewOnlyMode ||
                                        !String(form.getValues(`tomas.${tomaActivaIndex}.equipoAtp` as const) || '').trim() ||
                                        getPartesDeEquipoPorNombre(
                                          form.getValues(`tomas.${tomaActivaIndex}.equipoAtp` as const) as any
                                        ).length === 0
                                      }
                                      onValueChange={field.onChange}
                                      value={field.value}
                                    >
                                      <FormControl>
                                        <SelectTrigger>
                                          <SelectValue placeholder="Seleccione una parte" />
                                        </SelectTrigger>
                                      </FormControl>
                                      <SelectContent>
                                        {getPartesDeEquipoPorNombre(
                                          form.getValues(`tomas.${tomaActivaIndex}.equipoAtp` as const) as any
                                        ).map((parte) => (
                                          <SelectItem key={parte.id} value={parte.nombre}>
                                            {parte.nombre}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField control={form.control} name={`tomas.${tomaActivaIndex}.resultadosAtpRi`} render={({ field }) => (
                              <FormItem><FormLabel>Resultado URL (ATP) </FormLabel><FormControl><Input disabled={effectiveViewOnlyMode} type="url" {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                            <FormField control={form.control} name={`tomas.${tomaActivaIndex}.resultadosAtpAc`} render={({ field }) => (
                              <FormItem><FormLabel>Resultado (ATP) </FormLabel><FormControl><Input disabled={effectiveViewOnlyMode} {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                            
                          </div>
                          <FormField control={form.control} name={`tomas.${tomaActivaIndex}.loteHisopoAtp`} render={({ field }) => (
                            <FormItem><FormLabel>Lote del hisopo (ATP)</FormLabel><FormControl><Input disabled={effectiveViewOnlyMode} {...field} /></FormControl><FormMessage /></FormItem>
                          )} />
                          <FormField control={form.control} name={`tomas.${tomaActivaIndex}.observacionAtp`} render={({ field }) => (
                            <FormItem><FormLabel>Observaciones (ATP)</FormLabel><FormControl><Textarea disabled={effectiveViewOnlyMode} {...field} /></FormControl><FormMessage /></FormItem>
                          )} />
                        </div>

                        <div className="rounded-md border p-4 space-y-4">
                          <div className="font-semibold">Alérgenos</div>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            <FormField
                              control={form.control}
                              name={`tomas.${tomaActivaIndex}.equipoAlergenos`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Equipo (Alérgenos)</FormLabel>
                                  <FormControl>
                                    <Input
                                      disabled={effectiveViewOnlyMode || isLoadingEquipos}
                                      list="equipos-catalog"
                                      placeholder={isLoadingEquipos ? 'Cargando equipos...' : ''}
                                      name={field.name}
                                      value={field.value}
                                      onBlur={field.onBlur}
                                      ref={field.ref}
                                      onChange={(e) => {
                                        const value = e.target.value;
                                        field.onChange(value);
                                        form.setValue(`tomas.${tomaActivaIndex}.parteAlergenos`, '');
                                      }}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name={`tomas.${tomaActivaIndex}.parteAlergenos`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Parte (Alérgenos)</FormLabel>
                                  <FormControl>
                                    <Select
                                      disabled={
                                        effectiveViewOnlyMode ||
                                        !String(form.getValues(`tomas.${tomaActivaIndex}.equipoAlergenos` as const) || '').trim() ||
                                        getPartesDeEquipoPorNombre(
                                          form.getValues(`tomas.${tomaActivaIndex}.equipoAlergenos` as const) as any
                                        ).length === 0
                                      }
                                      onValueChange={field.onChange}
                                      value={field.value}
                                    >
                                      <FormControl>
                                        <SelectTrigger>
                                          <SelectValue placeholder="Seleccione una parte" />
                                        </SelectTrigger>
                                      </FormControl>
                                      <SelectContent>
                                        {getPartesDeEquipoPorNombre(
                                          form.getValues(`tomas.${tomaActivaIndex}.equipoAlergenos` as const) as any
                                        ).map((parte) => (
                                          <SelectItem key={parte.id} value={parte.nombre}>
                                            {parte.nombre}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            <FormField
                              control={form.control}
                              name={`tomas.${tomaActivaIndex}.deteccionAlergenosRi`}
                              render={({ field }) => (
                                <FormItem className="lg:col-span-2">
                                  <FormLabel>Motivo</FormLabel>
                                  <FormControl>
                                    <Textarea disabled={effectiveViewOnlyMode} rows={3} {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={form.control}
                              name={`tomas.${tomaActivaIndex}.deteccionAlergenosAc`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Resultado</FormLabel>
                                  <Select disabled={effectiveViewOnlyMode} onValueChange={field.onChange} value={field.value}>
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Seleccione..." />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      <SelectItem value="Cumple">Cumple</SelectItem>
                                      <SelectItem value="No cumple">No cumple</SelectItem>
                                      <SelectItem value="No aplica">No aplica</SelectItem>
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>

                          {form.watch(`tomas.${tomaActivaIndex}.deteccionAlergenosAc`) === 'No cumple' && (
                            <FormField
                              control={form.control}
                              name={`tomas.${tomaActivaIndex}.observacionAlergenos`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Acción Correctiva</FormLabel>
                                  <FormControl>
                                    <Textarea disabled={effectiveViewOnlyMode} {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          )}

                          <FormField control={form.control} name={`tomas.${tomaActivaIndex}.loteHisopoAlergenos`} render={({ field }) => (
                            <FormItem><FormLabel>Lote del hisopo (Alérgenos)</FormLabel><FormControl><Input disabled={effectiveViewOnlyMode} {...field} /></FormControl><FormMessage /></FormItem>
                          )} />
                        </div>

                        <div className="rounded-md border p-4 space-y-4">
                          <div className="font-semibold">Productos de aseo</div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField control={form.control} name={`tomas.${tomaActivaIndex}.detergente`} render={({ field }) => (
                              <FormItem><FormLabel>Detergente</FormLabel><FormControl><Input disabled={effectiveViewOnlyMode} {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                            <FormField control={form.control} name={`tomas.${tomaActivaIndex}.desinfectante`} render={({ field }) => (
                              <FormItem><FormLabel>Desinfectante</FormLabel><FormControl><Input disabled={effectiveViewOnlyMode} {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                          </div>
                          <FormField control={form.control} name={`tomas.${tomaActivaIndex}.verificacionVisual`} render={({ field }) => (
                            <FormItem>
                              <FormLabel>Verificación Visual</FormLabel>
                              <Select disabled={effectiveViewOnlyMode} onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Seleccione verificación visual" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="1"> Cumple</SelectItem>
                                  <SelectItem value="0">No Cumple</SelectItem>
                                  <SelectItem value="2">No aplica</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )} />
                          {form.watch(`tomas.${tomaActivaIndex}.verificacionVisual`) === '0' && (
                            <FormField control={form.control} name={`tomas.${tomaActivaIndex}.observacionVisual`} render={({ field }) => (
                              <FormItem><FormLabel>Observación de Verificación Visual</FormLabel><FormControl><Textarea disabled={effectiveViewOnlyMode} {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                          )}
                        </div>

                        <div className="rounded-md border p-4 space-y-4">
                          <div className="font-semibold">Responsables</div>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <FormField control={form.control} name="verificadoPor" render={({ field }) => (
                              <FormItem><FormLabel>Verificado Por</FormLabel><FormControl><Input disabled={effectiveViewOnlyMode} {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                            <FormField control={form.control} name="responsableProduccion" render={({ field }) => (
                              <FormItem><FormLabel>Responsable de Producción</FormLabel><FormControl><Input disabled={effectiveViewOnlyMode} {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                            <FormField control={form.control} name="responsableMantenimiento" render={({ field }) => (
                              <FormItem><FormLabel>Responsable de Mantenimiento</FormLabel><FormControl><Input disabled={effectiveViewOnlyMode} {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
          </ScrollArea>
            <DialogFooter>
              {effectiveViewOnlyMode ? (
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                  Cerrar
                </Button>
              ) : (
                <>
                  {wizardStep === 'identificacion' && (
                    <>
                      <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                        Cancelar
                      </Button>
                      <Button
                        type="button"
                        disabled={!form.getValues('fecha') || !form.getValues('mesCorte')}
                        onClick={() => {
                          setWizardStep('registro');
                          setRegistroSubView('lista');
                        }}
                      >
                        Continuar
                      </Button>
                    </>
                  )}

                  {wizardStep === 'registro' && registroSubView === 'lista' && (
                    <>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setWizardStep('identificacion');
                          setRegistroSubView('lista');
                        }}
                      >
                        Volver
                      </Button>
                      <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                        Cancelar
                      </Button>
                    </>
                  )}

                  {wizardStep === 'registro' && registroSubView === 'detalle' && (
                    <>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={onSubmitAsPending}
                        className="border-yellow-600 text-yellow-600 hover:bg-yellow-50"
                      >
                        Guardar como Pendiente
                      </Button>
                      <Button type="button" onClick={onSubmitFromButtons}>
                        Guardar Registro
                      </Button>
                    </>
                  )}
                </>
              )}
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
