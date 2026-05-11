'use client';

import React from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Package } from 'lucide-react';
import { cn } from '@/lib/utils';
import { custodiaMuestrasService } from '@/lib/custodia-muestras-service';
import { resultadosMicrobiologicosService } from '@/lib/resultados-microbiologicos-service';

// Función para obtener el siguiente código M-X del mes
async function getNextCodigoMuestra(): Promise<string> {
  try {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    
    // Obtener todos los registros del mes actual
    const firstDay = `${year}-${month.toString().padStart(2, '0')}-01`;
    const lastDay = new Date(year, month, 0).getDate();
    const lastDayStr = `${year}-${month.toString().padStart(2, '0')}-${lastDay.toString().padStart(2, '0')}`;
    
    const registros = await custodiaMuestrasService.getByDateRange(firstDay, lastDayStr);
    
    // Filtrar códigos que empiezan con M-
    const codigosM = registros
      .map(r => r.codigo)
      .filter(c => c && c.startsWith('M-'))
      .map(c => {
        const num = parseInt(c.replace('M-', ''));
        return isNaN(num) ? 0 : num;
      })
      .sort((a, b) => b - a); // Ordenar descendente
    
    const lastNumber = codigosM.length > 0 ? codigosM[0] : 0;
    return `M-${lastNumber + 1}`;
  } catch (error) {
    console.error('Error al obtener siguiente código:', error);
    return 'M-1';
  }
}

// Mapeo de tipos de tarea a descripción del labor
function getMuestraIdFromTipo(tipo: string, tipoPersonalizado?: string): string {
  const tipoLower = tipo.toLowerCase();
  
  switch (tipoLower) {
    case 'manipuladores':
      return 'Frotis de mano - Análisis de manipuladores';
    case 'superficies':
      return 'Frotis de superficie - Control de higiene';
    case 'ambientes':
      return 'Muestreo de ambiente - Control ambiental';
    case 'otro':
      return tipoPersonalizado || 'Labor personalizado';
    default:
      return `Muestreo de ${tipo}`;
  }
}

// Esquema de validación para el formulario
// Nota: Todos los campos son opcionales para permitir guardar como pendiente
// excepto los campos de información general básica (código, tipo, muestraId, area)
const custodiaMuestrasSchema = z.object({
  codigo: z.string().min(1, 'Campo requerido'),
  tipo: z.string().min(1, 'Campo requerido'),
  muestraId: z.string().min(1, 'Campo requerido'),
  area: z.string().min(1, 'Campo requerido'),
  areaPersonalizada: z.string().optional(),
  // Nuevos campos para especificar el tipo de muestra
  tipoMuestra: z.string().optional(),
  valorMuestra: z.string().optional(),
  temperatura: z.string().optional(),
  cantidad: z.string().optional(),
  motivo: z.string().optional(),
  motivoPersonalizado: z.string().optional(),
  tipoAnalisisSL: z.union([z.boolean(), z.string()]).optional(),
  tipoAnalisisBC: z.union([z.boolean(), z.string()]).optional(),
  tipoAnalisisYM: z.union([z.boolean(), z.string()]).optional(),
  tipoAnalisisTC: z.union([z.boolean(), z.string()]).optional(),
  tipoAnalisisEC: z.union([z.boolean(), z.string()]).optional(),
  tipoAnalisisLS: z.union([z.boolean(), z.string()]).optional(),
  tipoAnalisisETB: z.union([z.boolean(), z.string()]).optional(),
  tipoAnalisisXSA: z.union([z.boolean(), z.string()]).optional(),
  tomaMuestraFecha: z.string().optional(),
  tomaMuestraHora: z.string().optional(),
  recepcionLabFecha: z.string().optional(),
  recepcionLabHora: z.string().optional(),
  medioTransporte: z.string().optional(),
  responsable: z.string().optional(),
  observaciones: z.string().optional(),
  cronogramaCodigo: z.string().optional(),
  cronogramaTipo: z.string().optional(),
});

type CustodiaMuestrasFormValues = z.infer<typeof custodiaMuestrasSchema>;

// Helper para convertir fechas al formato de input
const toDateInput = (value: any, fallback: string) => {
  if (!value) return fallback;
  const d = new Date(value);
  if (!Number.isNaN(d.getTime())) return format(d, 'yyyy-MM-dd');
  return fallback;
};

interface AddCustodiaMuestrasModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSuccessfulSubmit?: (values: CustodiaMuestrasFormValues, estado: 'pendiente' | 'completado') => void;
  editingRecord?: any | null;
  onEditingRecordChange?: (record: any | null) => void;
  initialTask?: { id: number; tipo: string; area: string; responsable?: string } | null;
}

export function AddCustodiaMuestrasModal({
  isOpen,
  onOpenChange,
  onSuccessfulSubmit,
  editingRecord,
  onEditingRecordChange,
  initialTask,
}: AddCustodiaMuestrasModalProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [cronogramaTaskId, setCronogramaTaskId] = React.useState<number | null>(null);

  const form = useForm<CustodiaMuestrasFormValues>({
    resolver: zodResolver(custodiaMuestrasSchema),
    defaultValues: {
      codigo: '',
      tipo: '',
      muestraId: '',
      area: '',
      areaPersonalizada: '',
      tipoMuestra: '',
      valorMuestra: '',
      temperatura: 'N/A',
      cantidad: '1',
      motivo: '',
      tipoAnalisisSL: false,
      tipoAnalisisBC: false,
      tipoAnalisisYM: false,
      tipoAnalisisTC: false,
      tipoAnalisisEC: false,
      tipoAnalisisLS: false,
      tipoAnalisisETB: false,
      tipoAnalisisXSA: false,
      tomaMuestraFecha: format(new Date(), 'yyyy-MM-dd'),
      tomaMuestraHora: '',
      recepcionLabFecha: format(new Date(), 'yyyy-MM-dd'),
      recepcionLabHora: '',
      medioTransporte: 'N/A',
      responsable: '',
      observaciones: '',
      motivoPersonalizado: '',
    },
  });

  // Watch para mostrar/ocultar campo de valor según el tipo de muestra seleccionado
  const tipoMuestra = form.watch('tipoMuestra');

  // Función para limpiar el tipo de muestra de valores duplicados o corruptos
  const limpiarTipoMuestra = (tipo: string): string => {
    if (!tipo) return '';

    // Lista de tipos válidos
    const tiposValidos = ['nombre', 'linea', 'producto', 'lote', 'envase', 'otro'];

    // Si el tipo ya es válido, retornarlo
    if (tiposValidos.includes(tipo)) return tipo;

    // Limpiar el string: convertir a lowercase y remover duplicados
    const tipoLower = tipo.toLowerCase();
    
    // Buscar si contiene una subcadena que coincida con un tipo válido
    for (const tipoValido of tiposValidos) {
      if (tipoLower.includes(tipoValido)) {
        console.log('🔧 LIMPIEZA tipoMuestra:', tipo, '->', tipoValido);
        return tipoValido;
      }
    }

    // Si no se encuentra coincidencia, retornar vacío para no mostrar basura
    console.warn('⚠️ No se pudo limpiar tipoMuestra:', tipo);
    return '';
  };

  // Función para limpiar el área de valores duplicados o corruptos
  const limpiarArea = (area: string): string => {
    if (!area) return '';
    
    // Lista de áreas válidas
    const areasValidas = [
      'Conservas', 'Salsas', 'Preparación Conservas', 'Preparación Salsas',
      'Embalaje', 'Frutos Secos', 'Micropesaje', 'BD MP (Bodega Materia Prima)',
      'BD PT (Bodega Producto Terminado)', 'Personal de Aseo', 'Mantenimiento (MTTO)',
      'Laboratorio Procesos', 'Laboratorio MP', 'Vestier Masculino 1',
      'Vestier Masculino 2', 'Vestier Femenino 1', 'Vestier Femenino 2',
      'Esclusa Ingreso Área de Preparación', 'Estación de Lavado de Manos Preparación de Salsas',
      'Estación de Lavado de Manos Envasado de Salsas', 'Esclusa Ingreso Área de Producción',
      'Envases (general)', 'Dispensadores', 'Secador Vestier Masculino 1',
      'Secador Vestier Masculino 2', 'Secador Vestier Femenino 1', 'Secador Vestier Femenino 2',
      'Otro'
    ];
    
    // Si el área ya es válida, retornarla
    if (areasValidas.includes(area)) return area;
    
    // Buscar si contiene una subcadena que coincida con un área válida
    for (const areaValida of areasValidas) {
      if (area.includes(areaValida)) {
        return areaValida;
      }
    }
    
    // Si no se encuentra coincidencia, retornar el valor original
    return area;
  };

  // Vigilar el valor del tipo de muestra y limpiarlo automáticamente si es corrupto
  const tipoMuestraActual = form.watch('tipoMuestra');
  const tipoMuestraProcesadaRef = React.useRef<string>('');

  React.useEffect(() => {
    if (tipoMuestraActual && tipoMuestraActual !== tipoMuestraProcesadaRef.current) {
      const tipoLimpio = limpiarTipoMuestra(tipoMuestraActual);
      tipoMuestraProcesadaRef.current = tipoLimpio;
      if (tipoLimpio !== tipoMuestraActual) {
        console.log('🔍 DEBUG: Auto-limpieza de tipoMuestra:', tipoMuestraActual, '->', tipoLimpio);
        // Pequeño delay para evitar conflictos con el renderizado
        setTimeout(() => {
          form.setValue('tipoMuestra', tipoLimpio, { shouldValidate: false, shouldDirty: true });
        }, 0);
      }
    }
  }, [tipoMuestraActual, form]);

  // Vigilar el valor del área y limpiarlo automáticamente si es corrupto
  // Usar un ref para evitar loops infinitos
  const areaActual = form.watch('area');
  const areaProcesadaRef = React.useRef<string>('');

  React.useEffect(() => {
    if (areaActual && areaActual !== areaProcesadaRef.current) {
      const areaLimpia = limpiarArea(areaActual);
      areaProcesadaRef.current = areaLimpia;
      if (areaLimpia !== areaActual) {
        console.log('🔍 DEBUG: Auto-limpieza de área:', areaActual, '->', areaLimpia);
        // Pequeño delay para evitar conflictos con el renderizado
        setTimeout(() => {
          form.setValue('area', areaLimpia, { shouldValidate: false, shouldDirty: true });
        }, 0);
      }
    }
  }, [areaActual, form]);

  React.useEffect(() => {
    if (!isOpen) return;
    
    // Si hay editingRecord (modo edición)
    if (editingRecord) {
      console.log('🔍 DEBUG editingRecord RAW:', editingRecord);
      console.log('🔍 DEBUG tipo_muestra RAW:', editingRecord.tipo_muestra);
      console.log('🔍 DEBUG area RAW:', editingRecord.area);
      
      setCronogramaTaskId(editingRecord.cronograma_task_id || null);
      // Limpiar el área y tipo de muestra para corregir valores corruptos
      const areaLimpia = limpiarArea(editingRecord.area ?? '');
      const tipoMuestraLimpio = limpiarTipoMuestra(editingRecord.tipo_muestra ?? '');
      
      console.log('🔍 DEBUG area LIMPIA:', areaLimpia);
      console.log('🔍 DEBUG tipoMuestra LIMPIO:', tipoMuestraLimpio);
      
      form.reset({
        codigo: editingRecord.codigo ?? '',
        tipo: editingRecord.tipo ?? '',
        muestraId: editingRecord.muestra_id ?? '',
        area: areaLimpia,
        areaPersonalizada: areaLimpia === 'Otro' ? (editingRecord.area_personalizada || editingRecord.area || '') : '',
        tipoMuestra: tipoMuestraLimpio,
        valorMuestra: editingRecord.valor_muestra ?? '',
        temperatura: editingRecord.temperatura ?? '',
        cantidad: editingRecord.cantidad ?? '',
        motivo: editingRecord.motivo ?? '',
        tipoAnalisisSL: editingRecord.tipo_analisis_sl ?? '',
        tipoAnalisisBC: editingRecord.tipo_analisis_bc ?? '',
        tipoAnalisisYM: editingRecord.tipo_analisis_ym ?? '',
        tipoAnalisisTC: editingRecord.tipo_analisis_tc ?? '',
        tipoAnalisisEC: editingRecord.tipo_analisis_ec ?? '',
        tipoAnalisisLS: editingRecord.tipo_analisis_ls ?? '',
        tipoAnalisisETB: editingRecord.tipo_analisis_etb ?? '',
        tipoAnalisisXSA: editingRecord.tipo_analisis_xsa ?? '',
        tomaMuestraFecha: toDateInput(editingRecord.toma_muestra_fecha, ''),
        tomaMuestraHora: editingRecord.toma_muestra_hora ?? '',
        recepcionLabFecha: toDateInput(editingRecord.recepcion_lab_fecha, ''),
        recepcionLabHora: editingRecord.recepcion_lab_hora ?? '',
        medioTransporte: editingRecord.medio_transporte ?? '',
        responsable: editingRecord.responsable ?? '',
        observaciones: editingRecord.observaciones?.toLowerCase().includes('generado automáticamente') ? '' : (editingRecord.observaciones ?? ''),
        motivoPersonalizado: editingRecord.motivo_personalizado ?? '',
      });
      return;
    }

    // Si hay initialTask (nuevo registro desde cronograma)
    if (initialTask) {
      console.log('🔍 DEBUG initialTask:', initialTask);
      setCronogramaTaskId(initialTask.id);
      
      // Generar código M-X y autocompletar datos
      const generarDatos = async () => {
        const codigo = await getNextCodigoMuestra();
        const muestraId = getMuestraIdFromTipo(initialTask.tipo || '', initialTask.area);
        
        // Fecha y hora actual
        const now = new Date();
        const fechaActual = format(now, 'yyyy-MM-dd');
        const horaActual = format(now, 'HH:mm');
        
        // Limpiar el área para corregir valores corruptos de la base de datos
        const areaLimpia = limpiarArea(initialTask.area || '');
        console.log('🔍 DEBUG: Area original:', initialTask.area, '-> Limpia:', areaLimpia);
        
        form.reset({
          codigo: codigo,
          tipo: initialTask.tipo || '',
          muestraId: muestraId,
          area: areaLimpia,
          areaPersonalizada: areaLimpia === 'Otro' ? (initialTask.area || '') : '',
          tipoMuestra: '',
          valorMuestra: '',
          // Campos requeridos por la API - deben tener valores por defecto
          temperatura: 'N/A',
          cantidad: '1',
          motivo: 'control_rutinario',
          tipoAnalisisSL: false,
          tipoAnalisisBC: false,
          tipoAnalisisYM: false,
          tipoAnalisisTC: false,
          tipoAnalisisEC: false,
          tipoAnalisisLS: false,
          tipoAnalisisETB: false,
          tipoAnalisisXSA: false,
          tomaMuestraFecha: fechaActual,
          tomaMuestraHora: horaActual,
          recepcionLabFecha: fechaActual,
          recepcionLabHora: horaActual,
          medioTransporte: 'N/A',
          responsable: initialTask.responsable || '',
          observaciones: '',
          motivoPersonalizado: '',
        });
      };
      
      generarDatos();
      return;
    }

    // Resetear si no hay ni editingRecord ni initialTask
    setCronogramaTaskId(null);
    form.reset({
      codigo: '',
      tipo: '',
      muestraId: '',
      area: '',
      areaPersonalizada: '',
      tipoMuestra: '',
      valorMuestra: '',
      // Campos requeridos por la API - deben tener valores por defecto válidos
      temperatura: 'N/A',
      cantidad: '1',
      motivo: '',
      tipoAnalisisSL: false,
      tipoAnalisisBC: false,
      tipoAnalisisYM: false,
      tipoAnalisisTC: false,
      tipoAnalisisEC: false,
      tipoAnalisisLS: false,
      tipoAnalisisETB: false,
      tipoAnalisisXSA: false,
      tomaMuestraFecha: format(new Date(), 'yyyy-MM-dd'),
      tomaMuestraHora: '',
      recepcionLabFecha: format(new Date(), 'yyyy-MM-dd'),
      recepcionLabHora: '',
      medioTransporte: 'N/A',
      responsable: '',
      observaciones: '',
      motivoPersonalizado: '',
    });
  }, [editingRecord, initialTask, form, isOpen]);

  // Áreas del cronograma PL-CAL-008
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

  // Función para obtener la hora actual
  const getCurrentTime = () => {
    return format(new Date(), 'HH:mm');
  };

  async function handleSave(values: CustodiaMuestrasFormValues, estado: 'pendiente' | 'completado') {
    setIsSubmitting(true);
    
    // Si el registro ya estaba completado, forzar a mantenerse completado
    if (editingRecord && editingRecord.estado === 'completado') {
      estado = 'completado';
    }
    
    try {
      console.log('🔍 DEBUG: Valores del formulario:', values, 'Estado:', estado);
      
      // Determinar el motivo final (si es 'otro', usar el personalizado)
      const motivoFinal = values.motivo === 'otro' 
        ? (values.motivoPersonalizado || 'Otro')
        : values.motivo;
      
      // Transformar los datos para la API
      // Si se guarda como pendiente, enviar valores por defecto para campos vacíos
      // Limpiar el área para evitar guardar valores corruptos
      const areaLimpia = limpiarArea(values.area || '');
      console.log('🔍 DEBUG: Guardando - Area original:', values.area, '-> Limpia:', areaLimpia);
      
      // Si el área es 'Otro', usar el valor personalizado
      const areaFinal = areaLimpia === 'Otro' 
        ? (values.areaPersonalizada || 'Otro')
        : areaLimpia;
      
      const transformedValues = {
        codigo: values.codigo,
        tipo: values.tipo,
        muestra_id: values.muestraId,
        area: areaFinal,
        area_personalizada: areaLimpia === 'Otro' ? values.areaPersonalizada : null,
        // Nuevos campos para especificar el tipo de muestra
        tipo_muestra: values.tipoMuestra || '',
        valor_muestra: values.valorMuestra || '',
        temperatura: values.temperatura || '',
        cantidad: values.cantidad || '',
        motivo: motivoFinal || '',
        motivo_personalizado: values.motivo === 'otro' ? (values.motivoPersonalizado || '') : '',
        tipo_analisis_sl: values.tipoAnalisisSL || '',
        tipo_analisis_bc: values.tipoAnalisisBC || '',
        tipo_analisis_ym: values.tipoAnalisisYM || '',
        tipo_analisis_tc: values.tipoAnalisisTC || '',
        tipo_analisis_ec: values.tipoAnalisisEC || '',
        tipo_analisis_ls: values.tipoAnalisisLS || '',
        tipo_analisis_etb: values.tipoAnalisisETB || '',
        tipo_analisis_xsa: values.tipoAnalisisXSA || '',
        toma_muestra_fecha: values.tomaMuestraFecha || null,
        toma_muestra_hora: values.tomaMuestraHora || null,
        recepcion_lab_fecha: values.recepcionLabFecha || null,
        recepcion_lab_hora: values.recepcionLabHora || null,
        medio_transporte: values.medioTransporte || '',
        responsable: values.responsable || '',
        observaciones: values.observaciones || '',
        cronograma_codigo: values.cronogramaCodigo === 'none' ? null : values.cronogramaCodigo || null,
        cronograma_tipo: values.cronogramaTipo === 'none' ? null : values.cronogramaTipo || null,
        estado: estado,
      };
      
      console.log('🔍 DEBUG: Valores transformados para API:', transformedValues);
      
      // Guardar en la base de datos
      if (editingRecord?.id) {
        await custodiaMuestrasService.update(editingRecord.id, transformedValues);
      } else {
        const createValues = cronogramaTaskId 
          ? { ...transformedValues, cronograma_task_id: cronogramaTaskId }
          : transformedValues;
        console.log('🔍 DEBUG: Creating CustodiaMuestras with cronograma_task_id:', cronogramaTaskId);
        await custodiaMuestrasService.create(createValues);
      }
      console.log('✅ Registro de custodia de muestras guardado exitosamente');
      
      // Si se completó el registro, crear automáticamente un registro en RE-CAL-046
      // Solo crear si el registro NO estaba previamente completado (evitar duplicados)
      if (estado === 'completado' && editingRecord?.estado !== 'completado') {
        try {
          console.log('🔄 Creando registro automático en RE-CAL-046...');
          await resultadosMicrobiologicosService.createFromCustodia({
            tipo: values.tipo,
            area: values.area,
            observaciones: values.observaciones || '',
            muestraId: values.muestraId,
            codigo: values.codigo,
            tipoMuestra: values.tipoMuestra,
            valorMuestra: values.valorMuestra,
          });
          console.log('✅ Registro RE-CAL-046 creado exitosamente');
        } catch (error) {
          console.error('❌ Error al crear registro RE-CAL-046:', error);
          // No bloquear el flujo principal si falla la creación del registro 046
        }
      } else if (estado === 'completado' && editingRecord?.estado === 'completado') {
        console.log(' Registro RE-CAL-107 ya estaba completado, no se crea duplicado en RE-CAL-046');
      }
      
      toast({
        title: estado === 'pendiente' ? "Registro guardado como pendiente" : "Registro completado",
        description: estado === 'pendiente' 
          ? "El registro ha sido guardado como pendiente. Puedes completarlo más tarde."
          : "El registro de custodia de muestras ha sido guardado exitosamente. Se ha creado automáticamente un registro en Resultados Microbiológicos.",
      });
      
      // Llamar al callback de éxito para recargar datos en el dashboard
      console.log('📢 Calling onSuccessfulSubmit with estado:', estado);
      await onSuccessfulSubmit?.(values, estado);
      console.log('✅ onSuccessfulSubmit completed');
      
      // Cerrar modal y limpiar estado después de que el callback termine
      onOpenChange(false);
      form.reset();
      onEditingRecordChange?.(null);
    } catch (error) {
      console.error('❌ Error al guardar registro de custodia de muestras:', error);
      toast({
        title: "Error",
        description: "No se pudo guardar el registro de custodia de muestras.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(next) => {
        onOpenChange(next);
        if (!next) {
          form.reset();
          onEditingRecordChange?.(null);
        }
      }}
    >
      <DialogContent className="max-w-6xl max-h-[95vh] overflow-y-auto">
        <DialogHeader className="pb-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-purple-50 border border-purple-100 flex-shrink-0">
              <Package className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-[10px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-100">RE-CAL-107</span>
                <span className="text-[10px] text-gray-400">v.2 · 10/03/2022</span>
              </div>
              <DialogTitle className="text-base font-semibold text-gray-900 leading-snug">
                Custodia de Muestras
              </DialogTitle>
            </div>
          </div>
        </DialogHeader>

        <Form {...form}>
          <form className="space-y-8">
            
            {/* Sección 1: Información General */}
            <div className="border rounded-lg p-4 bg-gray-50">
              <h3 className="text-lg font-semibold mb-4 text-gray-800">Información General</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                
                {/* CÓDIGO */}
                <FormField
                  control={form.control}
                  name="codigo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>CÓDIGO</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          placeholder=""
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* TIPO */}
                <FormField
                  control={form.control}
                  name="tipo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>TIPO</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          placeholder=""
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* RESPONSABLE */}
                <FormField
                  control={form.control}
                  name="responsable"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>RESPONSABLE</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          placeholder=""
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Sección 2: Datos de Muestra */}
            <div className="border rounded-lg p-4 bg-blue-50">
              <h3 className="text-lg font-semibold mb-4 text-blue-800">Datos de Muestra</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                
                {/* ID DE MUESTRA */}
                <FormField
                  control={form.control}
                  name="muestraId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>ID DE MUESTRA</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          placeholder=""
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* TIPO DE MUESTRA */}
                <FormField
                  control={form.control}
                  name="tipoMuestra"
                  render={({ field }) => {
                    // Limpiar el valor del tipo de muestra antes de usarlo
                    const tipoValue = limpiarTipoMuestra(field.value || '');
                    
                    // DEBUG - mostrar valores en consola
                    console.log('🔍 RENDER tipoMuestra - field.value:', field.value, '| tipoValue:', tipoValue);
                    
                    // Forzar limpieza si el valor del campo es corrupto
                    if (field.value && field.value !== tipoValue && tipoValue !== '') {
                      console.log('🧹 FORZANDO LIMPIEZA de tipoMuestra:', field.value, '->', tipoValue);
                      setTimeout(() => {
                        field.onChange(tipoValue);
                      }, 0);
                    }
                    
                    // Opciones para navegación con teclado
                    const options = ['nombre', 'linea', 'producto', 'lote', 'envase', 'otro'];

                    const handleKeyDown = (e: React.KeyboardEvent) => {
                      const currentIndex = options.indexOf(tipoValue || '');

                      if (e.key === 'ArrowDown') {
                        e.preventDefault();
                        const nextIndex = currentIndex < options.length - 1 ? currentIndex + 1 : 0;
                        field.onChange(options[nextIndex]);
                      } else if (e.key === 'ArrowUp') {
                        e.preventDefault();
                        const prevIndex = currentIndex > 0 ? currentIndex - 1 : options.length - 1;
                        field.onChange(options[prevIndex]);
                      }
                    };

                    return (
                      <FormItem>
                        <FormLabel>TIPO DE MUESTRA</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={tipoValue}
                          onOpenChange={(open) => {
                            // Cuando se cierra, enfocar el trigger para permitir navegación
                            if (!open) {
                              setTimeout(() => {
                                const trigger = document.querySelector('[data-radix-select-trigger]');
                                (trigger as HTMLElement)?.focus();
                              }, 0);
                            }
                          }}
                        >
                          <FormControl>
                            <SelectTrigger onKeyDown={handleKeyDown}>
                              <SelectValue placeholder="Seleccionar tipo">
                                {tipoValue && (
                                  tipoValue === 'nombre' ? 'Nombre' :
                                  tipoValue === 'linea' ? 'Línea' :
                                  tipoValue === 'producto' ? 'Producto' :
                                  tipoValue === 'lote' ? 'Lote' :
                                  tipoValue === 'envase' ? 'Envase' :
                                  tipoValue === 'otro' ? 'Otro' : tipoValue
                                )}
                              </SelectValue>
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="nombre">Nombre</SelectItem>
                            <SelectItem value="linea">Línea</SelectItem>
                            <SelectItem value="producto">Producto</SelectItem>
                            <SelectItem value="lote">Lote</SelectItem>
                            <SelectItem value="envase">Envase</SelectItem>
                            <SelectItem value="otro">Otro</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    );
                  }}
                />

                {/* VALOR DE MUESTRA - Solo aparece si se seleccionó un tipo */}
                {tipoMuestra && (
                  <FormField
                    control={form.control}
                    name="valorMuestra"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          VALOR {tipoMuestra?.toUpperCase()}
                        </FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            value={field.value || ''}
                            placeholder={`Ingrese ${tipoMuestra}...`}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                {/* ÁREA */}
                <FormField
                  control={form.control}
                  name="area"
                  render={({ field }) => {
                    // Limpiar el valor del área antes de usarlo
                    const areaValue = limpiarArea(field.value || '');
                    
                    // DEBUG - mostrar valores en consola
                    console.log('🔍 RENDER area - field.value:', field.value, '| areaValue:', areaValue);
                    
                    // Forzar limpieza si el valor del campo es corrupto
                    if (field.value && field.value !== areaValue && areaValue !== '') {
                      console.log('🧹 FORZANDO LIMPIEZA de area:', field.value, '->', areaValue);
                      setTimeout(() => {
                        field.onChange(areaValue);
                      }, 0);
                    }
                    
                    return (
                      <FormItem>
                        <FormLabel>ÁREA</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={areaValue}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Seleccionar área">
                                {areaValue || 'Seleccionar área'}
                              </SelectValue>
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="max-h-[300px]">
                            {AREAS.map((area) => (
                              <SelectItem key={area} value={area}>
                                {area}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    );
                  }}
                />

                {/* ÁREA PERSONALIZADA - Solo visible cuando se selecciona 'Otro' */}
                {form.watch('area') === 'Otro' && (
                  <FormField
                    control={form.control}
                    name="areaPersonalizada"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>ÁREA PERSONALIZADA *</FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            placeholder="Especifique el área"
                            className="border-orange-300 focus:border-orange-500"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                {/* TEMPERATURA */}
                <FormField
                  control={form.control}
                  name="temperatura"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>TEMPERATURA</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          placeholder=""
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* CANTIDAD */}
                <FormField
                  control={form.control}
                  name="cantidad"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>CANTIDAD</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          placeholder=""
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Sección 3: Propósitos y Análisis Solicitados */}
            <div className="border rounded-lg p-4 bg-green-50">
              <h3 className="text-lg font-semibold mb-4 text-green-800">Propósitos y Análisis Solicitados</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                
                {/* MOTIVO */}
                <FormField
                  control={form.control}
                  name="motivo"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2 lg:col-span-3">
                      <FormLabel>MOTIVO</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        value={field.value || ''}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccione el motivo del análisis">
                              {field.value === 'control_rutinario' && 'Control rutinario'}
                              {field.value === 'verificacion' && 'Verificación'}
                              {field.value === 'queja' && 'Queja'}
                              {field.value === 'investigacion' && 'Investigación'}
                              {field.value === 'otro' && 'Otro (escribir motivo)'}
                            </SelectValue>
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="control_rutinario">Control rutinario</SelectItem>
                          <SelectItem value="verificacion">Verificación</SelectItem>
                          <SelectItem value="queja">Queja</SelectItem>
                          <SelectItem value="investigacion">Investigación</SelectItem>
                          <SelectItem value="otro">Otro (escribir motivo)</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* MOTIVO PERSONALIZADO - Mostrar cuando se selecciona 'Otro' */}
                {form.watch('motivo') === 'otro' && (
                  <FormField
                    control={form.control}
                    name="motivoPersonalizado"
                    render={({ field }) => (
                      <FormItem className="md:col-span-2 lg:col-span-3">
                        <FormLabel>Motivo específico</FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            placeholder="Escriba el motivo específico del análisis"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                {/* CRONOGRAMA CÓDIGO */}
                <FormField
                  control={form.control}
                  name="cronogramaCodigo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cronograma (Opcional)</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || 'none'}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccione el cronograma" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="none">Ninguno</SelectItem>
                          <SelectItem value="PL-CAL-008">PL-CAL-008 (Cronograma Muestreo Microbiológico)</SelectItem>
                          <SelectItem value="PL-CAL-009">PL-CAL-009 (Cronograma Externo)</SelectItem>
                          <SelectItem value="PL-CAL-010">PL-CAL-010 (Materia Prima)</SelectItem>
                          <SelectItem value="PL-CAL-013">PL-CAL-013 (Cronograma ATP)</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* CRONOGRAMA TIPO */}
                <FormField
                  control={form.control}
                  name="cronogramaTipo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo Cronograma (Opcional)</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || 'none'}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccione el tipo" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="none">Ninguno</SelectItem>
                          <SelectItem value="interno">Interno</SelectItem>
                          <SelectItem value="externo">Externo</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* TIPO DE ANÁLISIS - CHECKBOXES */}
                <div className="md:col-span-2 lg:col-span-3">
                  <FormLabel className="text-base font-medium">TIPO DE ANÁLISIS</FormLabel>
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mt-2">
                    
                    <FormField
                      control={form.control}
                      name="tipoAnalisisSL"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <input
                              type="checkbox"
                              className="mt-1"
                              checked={field.value === 'SL'}
                              onChange={(e) =>
                                field.onChange(e.target.checked ? 'SL' : '')
                              }
                            />
                          </FormControl>
                          <div>
                            <p className="font-medium" translate="no">SL</p>
                          </div>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="tipoAnalisisBC"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <input
                              type="checkbox"
                              className="mt-1"
                              checked={field.value === 'BC'}
                              onChange={(e) =>
                                field.onChange(e.target.checked ? 'BC' : '')
                              }
                            />
                          </FormControl>
                          <div>
                            <p className="font-medium" translate="no">BC</p>
                          </div>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="tipoAnalisisYM"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <input
                              type="checkbox"
                              className="mt-1"
                              checked={field.value === 'YM'}
                              onChange={(e) =>
                                field.onChange(e.target.checked ? 'YM' : '')
                              }
                            />
                          </FormControl>
                          <div>
                            <p className="font-medium" translate="no">YM</p>
                          </div>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="tipoAnalisisTC"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <input
                              type="checkbox"
                              className="mt-1"
                              checked={field.value === 'TC'}
                              onChange={(e) =>
                                field.onChange(e.target.checked ? 'TC' : '')
                              }
                            />
                          </FormControl>
                          <div>
                            <p className="font-medium" translate="no">TC</p>
                          </div>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="tipoAnalisisEC"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <input
                              type="checkbox"
                              className="mt-1"
                              checked={field.value === 'EC'}
                              onChange={(e) =>
                                field.onChange(e.target.checked ? 'EC' : '')
                              }
                            />
                          </FormControl>
                          <div>
                            <p className="font-medium" translate="no">EC</p>
                          </div>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="tipoAnalisisLS"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <input
                              type="checkbox"
                              className="mt-1"
                              checked={field.value === 'LS'}
                              onChange={(e) =>
                                field.onChange(e.target.checked ? 'LS' : '')
                              }
                            />
                          </FormControl>
                          <div>
                            <p className="font-medium" translate="no">LS</p>
                          </div>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="tipoAnalisisETB"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <input
                              type="checkbox"
                              className="mt-1"
                              checked={field.value === 'ETB'}
                              onChange={(e) =>
                                field.onChange(e.target.checked ? 'ETB' : '')
                              }
                            />
                          </FormControl>
                          <div>
                            <p className="font-medium" translate="no">ETB</p>
                          </div>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="tipoAnalisisXSA"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <input
                              type="checkbox"
                              className="mt-1"
                              checked={field.value === 'XSA'}
                              onChange={(e) =>
                                field.onChange(e.target.checked ? 'XSA' : '')
                              }
                            />
                          </FormControl>
                          <div>
                            <p className="font-medium" translate="no">XSA</p>
                          </div>
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Sección 4: Cadena de Custodia */}
            <div className="border rounded-lg p-4 bg-orange-50">
              <h3 className="text-lg font-semibold mb-4 text-orange-800">Cadena de Custodia</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                
                {/* TOMA DE MUESTRA - FECHA */}
                <FormField
                  control={form.control}
                  name="tomaMuestraFecha"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>TOMA DE MUESTRA - FECHA</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          type="date"
                          className="font-mono"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* TOMA DE MUESTRA - HORA */}
                <FormField
                  control={form.control}
                  name="tomaMuestraHora"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>TOMA DE MUESTRA - HORA</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          type="time"
                          placeholder="HH:MM"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* RECEPCIÓN LABORATORIO - FECHA */}
                <FormField
                  control={form.control}
                  name="recepcionLabFecha"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>RECEPCIÓN LABORATORIO - FECHA</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          type="date"
                          className="font-mono"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* RECEPCIÓN LABORATORIO - HORA */}
                <FormField
                  control={form.control}
                  name="recepcionLabHora"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>RECEPCIÓN LABORATORIO - HORA</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          type="time"
                          placeholder="HH:MM"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* MEDIO DE TRANSPORTE */}
                <FormField
                  control={form.control}
                  name="medioTransporte"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>MEDIO DE TRANSPORTE</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          placeholder=""
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Sección 5: Observaciones */}
            <div className="border rounded-lg p-4 bg-purple-50">
              <h3 className="text-lg font-semibold mb-4 text-purple-800">Observaciones</h3>
              <FormField
                control={form.control}
                name="observaciones"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>OBSERVACIONES</FormLabel>
                    <FormControl>
                      <textarea
                        className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        placeholder="Notas adicionales sobre la muestra y su custodia..."
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter className="pt-4 gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
              {/* Solo mostrar 'Guardar como Pendiente' si el registro NO está completado */}
              {(!editingRecord || editingRecord.estado !== 'completado') && (
                <Button
                  type="button"
                  variant="outline"
                  disabled={isSubmitting}
                  onClick={form.handleSubmit((values) => handleSave(values, 'pendiente'))}
                  className="border-orange-400 text-orange-700 hover:bg-orange-50"
                >
                  {isSubmitting ? 'Guardando...' : 'Guardar como Pendiente'}
                </Button>
              )}
              <Button
                type="button"
                disabled={isSubmitting}
                onClick={form.handleSubmit((values) => handleSave(values, 'completado'))}
                className={editingRecord?.estado === 'completado' ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'}
              >
                {isSubmitting ? 'Guardando...' : 'Guardar Completado'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
