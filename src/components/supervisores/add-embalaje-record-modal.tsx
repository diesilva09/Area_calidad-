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
import { Textarea } from '@/components/ui/textarea';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { getFechaActual, getMesActual } from '@/lib/date-utils';
import { CalendarIcon, Plus, X } from 'lucide-react';
import { embalajeRecordsService, type EmbalajeRecord } from '@/lib/embalaje-records-service';
import { ProductoPesosService } from '@/lib/producto-pesos-service';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

export const embalajeFormSchema = z.object({
  fecha: z.string().min(1, 'Campo requerido'),
  mesCorte: z.string().min(1, 'Campo requerido'),
  producto: z.string().min(1, 'Campo requerido'),
  presentacion: z.string().min(1, 'Campo requerido'),
  lote: z.string().min(1, 'Campo requerido'),
  tamanoLote: z.string().min(1, 'Campo requerido'),
  nivelInspeccion: z.string().min(1, 'Campo requerido'),
  cajasRevisadas: z.string().min(1, 'Campo requerido'),
  totalUnidadesRevisadas: z.string().min(1, 'Campo requerido'),
  totalUnidadesRevisadasReal: z.string().min(1, 'Campo requerido'),
  observacionesGenerales: z.string().optional(),
  unidadesFaltantes: z.string().min(1, 'Campo requerido'),
  porcentajeFaltantes: z.string().min(1, 'Campo requerido'),
  observacionesFaltantes: z.string().optional(),
  etiqueta: z.string().min(1, 'Campo requerido'),
  porcentajeEtiquetaNoConforme: z.string().min(1, 'Campo requerido'),
  observacionesEtiqueta: z.string().optional(),
  marcacion: z.string().min(1, 'Campo requerido'),
  porcentajeMarcacionNoConforme: z.string().min(1, 'Campo requerido'),
  observacionesMarcacion: z.string().optional(),
  presentacionNoConforme: z.string().min(1, 'Campo requerido'),
  porcentajePresentacionNoConforme: z.string().min(1, 'Campo requerido'),
  observacionesPresentacion: z.string().optional(),
  cajas: z.string().min(1, 'Campo requerido'),
  porcentajeCajasNoConformes: z.string().min(1, 'Campo requerido'),
  observacionesCajas: z.string().optional(),
  correccion: z.string().optional(),
  responsableIdentificadorCajas: z.string().min(1, 'Campo requerido'),
  responsableEmbalaje: z.string().min(1, 'Campo requerido'),
  responsableCalidad: z.string().min(1, 'Campo requerido'),
  unidadesNoConformes: z.string().min(1, 'Campo requerido'),
  porcentajeIncumplimiento: z.string().min(1, 'Campo requerido'),
  limpiezaArea: z.string().optional(),
  responsableLimpieza: z.string().optional(),
  fechaLimpieza: z.string().optional(),
  observacionesLimpieza: z.string().optional(),
  cronogramaImplementacion: z.string().optional(),
  fechaInicioCronograma: z.string().optional(),
  fechaFinCronograma: z.string().optional(),
  responsableCronograma: z.string().optional(),
});


type AddEmbalajeRecordModalProps = {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  productName: string;
  productId: string;
  categoryId?: string; // NUEVO: para búsqueda específica por categoría
  prefilledData?: Partial<{ 
    fecha: string; 
    mesCorte: string; 
    lote: string; 
    producto: string; 
    tamanoLote: string; 
    responsableEmbalaje: string; 
    observacionesGenerales: string 
  }>;
  onSuccessfulSubmit?: (values: any) => void;
  // Props para edición
  editMode?: boolean;
  recordToEdit?: EmbalajeRecord;
  onSuccessfulEdit?: () => void;
};

export function AddEmbalajeRecordModal({
  isOpen,
  onOpenChange,
  productName,
  productId,
  categoryId, // NUEVO
  prefilledData,
  onSuccessfulSubmit,
  editMode = false,
  recordToEdit = null as EmbalajeRecord | null,
  onSuccessfulEdit,
}: AddEmbalajeRecordModalProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [inspeccionTimeout, setInspeccionTimeout] = React.useState<NodeJS.Timeout | null>(null);
  const [porcentajeTimeout, setPorcentajeTimeout] = React.useState<NodeJS.Timeout | null>(null);
  const [etiquetaTimeout, setEtiquetaTimeout] = React.useState<NodeJS.Timeout | null>(null);
  const [marcacionTimeout, setMarcacionTimeout] = React.useState<NodeJS.Timeout | null>(null);
  const [presentacionTimeout, setPresentacionTimeout] = React.useState<NodeJS.Timeout | null>(null);
  const [cajasTimeout, setCajasTimeout] = React.useState<NodeJS.Timeout | null>(null);

  const [responsablesIdentificadorCajas, setResponsablesIdentificadorCajas] = React.useState<string[]>(['']);
  const [responsablesEmbalaje, setResponsablesEmbalaje] = React.useState<string[]>(['']);

  const [observacionesVisible, setObservacionesVisible] = React.useState({
    observacionesGenerales: false,
    observacionesFaltantes: false,
    observacionesEtiqueta: false,
    observacionesMarcacion: false,
    observacionesPresentacion: false,
    observacionesCajas: false,
  });

  // Estados para los selectores de fecha
  const [fechaLimpiezaOpen, setFechaLimpiezaOpen] = React.useState(false);
  const [fechaInicioCronogramaOpen, setFechaInicioCronogramaOpen] = React.useState(false);
  const [fechaFinCronogramaOpen, setFechaFinCronogramaOpen] = React.useState(false);

  // Función para obtener el número de cajas según la letra de nivel de inspección
  const getCajasPorLetra = (letra: string): number => {
    const cajasMap: { [key: string]: number } = {
      'A': 2,
      'B': 3,
      'C': 5,
      'D': 8,
      'E': 13,
      'F': 20,
      'G': 32,
      'H': 50,
      'J': 80,
      'K': 125,
      'L': 200,
      'M': 315,
      'N': 500,
      'O': 800,
      'P': 1250,
      'Q': 2000
    };
    return cajasMap[letra.toUpperCase()] || 0;
  };

  const getNivelInspeccionPorTamanoLote = (tamanoLoteCajas: number): string => {
    if (!Number.isFinite(tamanoLoteCajas) || tamanoLoteCajas <= 0) return '';

    // Tabla estándar tipo ISO 2859-1 (letra/código por tamaño de lote)
    if (tamanoLoteCajas <= 8) return 'A';
    if (tamanoLoteCajas <= 15) return 'B';
    if (tamanoLoteCajas <= 25) return 'C';
    if (tamanoLoteCajas <= 50) return 'D';
    if (tamanoLoteCajas <= 90) return 'E';
    if (tamanoLoteCajas <= 150) return 'F';
    if (tamanoLoteCajas <= 280) return 'G';
    if (tamanoLoteCajas <= 500) return 'H';
    if (tamanoLoteCajas <= 1200) return 'J';
    if (tamanoLoteCajas <= 3200) return 'K';
    if (tamanoLoteCajas <= 10000) return 'L';
    if (tamanoLoteCajas <= 35000) return 'M';
    if (tamanoLoteCajas <= 150000) return 'N';
    if (tamanoLoteCajas <= 500000) return 'P';
    return 'Q';
  };

  const handleTamanoLoteChange = (valor: string) => {
    const cleaned = String(valor || '').trim();
    const tamano = parseInt(cleaned, 10);
    if (!cleaned || Number.isNaN(tamano) || tamano <= 0) return;
    (async () => {
      try {
        const response = await fetch(`/api/embalaje/sampling-rule?tamanoLote=${tamano}`);

        if (response.ok) {
          const data = await response.json();
          const nivel = String(data?.nivel || '').trim().toUpperCase();
          const cajas = parseInt(String(data?.cajas_revisar || ''));

          if (nivel && Number.isFinite(cajas) && cajas > 0) {
            form.setValue('nivelInspeccion', nivel);
            form.setValue('cajasRevisadas', cajas.toString());
            toast({
              title: 'Autocompletado',
              description: `Tamaño lote ${tamano} cajas → Nivel ${nivel} → ${cajas} cajas a revisar`,
              variant: 'default',
            });
            return;
          }
        }

        // Fallback: tabla hardcode
        const nivelFallback = getNivelInspeccionPorTamanoLote(tamano);
        if (!nivelFallback) return;
        const cajasFallback = getCajasPorLetra(nivelFallback);
        if (!cajasFallback) return;

        form.setValue('nivelInspeccion', nivelFallback);
        form.setValue('cajasRevisadas', cajasFallback.toString());
        toast({
          title: 'Autocompletado',
          description: `Tamaño lote ${tamano} cajas → Nivel ${nivelFallback} → ${cajasFallback} cajas a revisar`,
          variant: 'default',
        });
      } catch {
        // Fallback: tabla hardcode
        const nivelFallback = getNivelInspeccionPorTamanoLote(tamano);
        if (!nivelFallback) return;
        const cajasFallback = getCajasPorLetra(nivelFallback);
        if (!cajasFallback) return;

        form.setValue('nivelInspeccion', nivelFallback);
        form.setValue('cajasRevisadas', cajasFallback.toString());
        toast({
          title: 'Autocompletado',
          description: `Tamaño lote ${tamano} cajas → Nivel ${nivelFallback} → ${cajasFallback} cajas a revisar`,
          variant: 'default',
        });
      }
    })();
  };

  // Función para autocompletar cajas revisadas según la letra (con debounce)
  const handleNivelInspeccionChange = (valor: string) => {
    // Limpiar timeout anterior
    if (inspeccionTimeout) {
      clearTimeout(inspeccionTimeout);
    }
    
    // Nuevo timeout con debounce de 300ms
    const newTimeout = setTimeout(() => {
      const letra = valor.trim().toUpperCase();
      
      if (letra && letra.length === 1) {
        const cajas = getCajasPorLetra(letra);
        
        if (cajas > 0) {
          form.setValue('cajasRevisadas', cajas.toString());
          
          // Mostrar toast informativo
          toast({
            title: "Autocompletado",
            description: `Nivel ${letra} → ${cajas} cajas revisadas`,
            variant: "default",
          });
        } else {
          // Mostrar toast para letras no válidas
          toast({
            title: "Letra no válida",
            description: `La letra "${letra}" no tiene un número de cajas asignado`,
            variant: "destructive",
          });
        }
      }
    }, 300);
    
    setInspeccionTimeout(newTimeout);
  };

  // Cleanup del timeout cuando el componente se desmonta
  React.useEffect(() => {
    return () => {
      if (inspeccionTimeout) {
        clearTimeout(inspeccionTimeout);
      }
      if (porcentajeTimeout) {
        clearTimeout(porcentajeTimeout);
      }
      if (etiquetaTimeout) {
        clearTimeout(etiquetaTimeout);
      }
      if (marcacionTimeout) {
        clearTimeout(marcacionTimeout);
      }
      if (presentacionTimeout) {
        clearTimeout(presentacionTimeout);
      }
      if (cajasTimeout) {
        clearTimeout(cajasTimeout);
      }
    };
  }, [inspeccionTimeout, porcentajeTimeout, etiquetaTimeout, marcacionTimeout, presentacionTimeout, cajasTimeout]);

  // Función para calcular el porcentaje de unidades faltantes
  const calcularPorcentajeFaltantes = () => {
    const totalRevisadasReal = parseFloat(form.getValues('totalUnidadesRevisadasReal') || '0');
    const unidadesFaltantes = parseFloat(form.getValues('unidadesFaltantes') || '0');
    
    if (totalRevisadasReal > 0) {
      const porcentaje = (unidadesFaltantes / totalRevisadasReal) * 100;
      const porcentajeRedondeado = Math.round(porcentaje * 100) / 100; // 2 decimales
      
      form.setValue('porcentajeFaltantes', porcentajeRedondeado.toString());
      
      // Mostrar toast si el porcentaje es alto (más del 10%)
      if (porcentajeRedondeado > 10) {
        toast({
          title: "Alto porcentaje de faltantes",
          description: `El ${porcentajeRedondeado}% de unidades faltantes es considerablemente alto`,
          variant: "destructive",
        });
      }
    } else {
      form.setValue('porcentajeFaltantes', '0');
    }
  };

  // Función con debounce para calcular porcentaje
  const handleCalculoPorcentaje = () => {
    // Limpiar timeout anterior
    if (porcentajeTimeout) {
      clearTimeout(porcentajeTimeout);
    }
    
    // Nuevo timeout con debounce de 500ms
    const newTimeout = setTimeout(() => {
      calcularPorcentajeFaltantes();
      calcularPorcentajeEtiquetaNoConforme();
      calcularPorcentajeMarcacionNoConforme();
      calcularPorcentajePresentacionNoConforme();
      calcularPorcentajeCajasNoConformes();
      calcularUnidadesNoConformes();
      calcularPorcentajeIncumplimiento();
    }, 500);
    
    setPorcentajeTimeout(newTimeout);
  };

  // Función para calcular el porcentaje de etiqueta no conforme
  const calcularPorcentajeEtiquetaNoConforme = () => {
    const totalRevisadasReal = parseFloat(form.getValues('totalUnidadesRevisadasReal') || '0');
    const etiquetaNoConforme = parseFloat(form.getValues('etiqueta') || '0');
    
    if (totalRevisadasReal > 0) {
      const porcentaje = (etiquetaNoConforme / totalRevisadasReal) * 100;
      const porcentajeRedondeado = Math.round(porcentaje * 100) / 100; // 2 decimales
      
      form.setValue('porcentajeEtiquetaNoConforme', porcentajeRedondeado.toString());
      
      // Mostrar toast si el porcentaje es alto (más del 5% para etiquetas)
      if (porcentajeRedondeado > 5) {
        toast({
          title: "Alto porcentaje de etiquetas no conformes",
          description: `El ${porcentajeRedondeado}% de etiquetas no conformes es considerablemente alto`,
          variant: "destructive",
        });
      }
    } else {
      form.setValue('porcentajeEtiquetaNoConforme', '0');
    }
  };
  
  const handleCalculoPorcentajeEtiqueta = () => {
    // Limpiar timeout anterior
    if (etiquetaTimeout) {
      clearTimeout(etiquetaTimeout);
    }

    // Nuevo timeout con debounce de 500ms
    const newTimeout = setTimeout(() => {
      calcularPorcentajeEtiquetaNoConforme();
      calcularPorcentajeIncumplimiento();
    }, 500);

    setEtiquetaTimeout(newTimeout);
  };

  // Función para calcular el porcentaje de marcación no conforme
  const calcularPorcentajeMarcacionNoConforme = () => {
    const totalRevisadasReal = parseFloat(form.getValues('totalUnidadesRevisadasReal') || '0');
    const marcacionNoConforme = parseFloat(form.getValues('marcacion') || '0');
    
    if (totalRevisadasReal > 0) {
      const porcentaje = (marcacionNoConforme / totalRevisadasReal) * 100;
      const porcentajeRedondeado = Math.round(porcentaje * 100) / 100; // 2 decimales
      
      form.setValue('porcentajeMarcacionNoConforme', porcentajeRedondeado.toString());
      
      // Mostrar toast si el porcentaje es alto (más del 3% para marcación)
      if (porcentajeRedondeado > 3) {
        toast({
          title: "Alto porcentaje de marcación no conforme",
          description: `El ${porcentajeRedondeado}% de marcación no conforme es considerablemente alto`,
          variant: "destructive",
        });
      }
    } else {
      form.setValue('porcentajeMarcacionNoConforme', '0');
    }
  };

  const handleCalculoPorcentajeMarcacion = () => {
    // Limpiar timeout anterior
    if (marcacionTimeout) {
      clearTimeout(marcacionTimeout);
    }

    // Nuevo timeout con debounce de 500ms
    const newTimeout = setTimeout(() => {
      calcularPorcentajeMarcacionNoConforme();
      calcularPorcentajeIncumplimiento();
    }, 500);

    setMarcacionTimeout(newTimeout);
  };

  // Función para calcular el porcentaje de presentación no conforme
  const calcularPorcentajePresentacionNoConforme = () => {
    const totalRevisadasReal = parseFloat(form.getValues('totalUnidadesRevisadasReal') || '0');
    const presentacionNoConforme = parseFloat(form.getValues('presentacionNoConforme') || '0');
    
    if (totalRevisadasReal > 0) {
      const porcentaje = (presentacionNoConforme / totalRevisadasReal) * 100;
      const porcentajeRedondeado = Math.round(porcentaje * 100) / 100; // 2 decimales
      
      form.setValue('porcentajePresentacionNoConforme', porcentajeRedondeado.toString());
      
      // Mostrar toast si el porcentaje es alto (más del 8% para presentación)
      if (porcentajeRedondeado > 8) {
        toast({
          title: "Alto porcentaje de presentación no conforme",
          description: `El ${porcentajeRedondeado}% de presentación no conforme es considerablemente alto`,
          variant: "destructive",
        });
      }
    } else {
      form.setValue('porcentajePresentacionNoConforme', '0');
    }
  };

  const handleCalculoPorcentajePresentacion = () => {
    // Limpiar timeout anterior
    if (presentacionTimeout) {
      clearTimeout(presentacionTimeout);
    }

    // Nuevo timeout con debounce de 500ms
    const newTimeout = setTimeout(() => {
      calcularPorcentajePresentacionNoConforme();
      calcularPorcentajeIncumplimiento();
    }, 500);

    setPresentacionTimeout(newTimeout);
  };

  // Función para calcular el porcentaje de cajas no conformes
  const calcularPorcentajeCajasNoConformes = () => {
    const totalUnidadesRevisadas = parseFloat(form.getValues('totalUnidadesRevisadas') || '0');
    const cajasNoConformes = parseFloat(form.getValues('cajas') || '0');
    
    if (totalUnidadesRevisadas > 0) {
      const porcentaje = (cajasNoConformes / totalUnidadesRevisadas) * 100;
      const porcentajeRedondeado = Math.round(porcentaje * 100) / 100; // 2 decimales
      
      form.setValue('porcentajeCajasNoConformes', porcentajeRedondeado.toString());
      
      // Mostrar toast si el porcentaje es alto (más del 15% para cajas)
      if (porcentajeRedondeado > 15) {
        toast({
          title: "Alto porcentaje de cajas no conformes",
          description: `El ${porcentajeRedondeado}% de cajas no conformes es considerablemente alto`,
          variant: "destructive",
        });
      }
    } else {
      form.setValue('porcentajeCajasNoConformes', '0');
    }
  };

  const handleCalculoPorcentajeCajas = () => {
    // Limpiar timeout anterior
    if (cajasTimeout) {
      clearTimeout(cajasTimeout);
    }

    // Nuevo timeout con debounce de 500ms
    const newTimeout = setTimeout(() => {
      calcularPorcentajeCajasNoConformes();
      calcularPorcentajeIncumplimiento();
    }, 500);

    setCajasTimeout(newTimeout);
  };

  // Función para calcular el total de unidades no conformes (suma directa de las 5 categorías)
  // IMPORTANTE: Esta función es INDEPENDIENTE de los porcentajes y se llama directamente en los onChange
  const calcularUnidadesNoConformes = () => {
    const unidadesFaltantes = parseFloat(form.getValues('unidadesFaltantes') || '0');
    const etiquetaNoConforme = parseFloat(form.getValues('etiqueta') || '0');
    const marcacionNoConforme = parseFloat(form.getValues('marcacion') || '0');
    const presentacionNoConforme = parseFloat(form.getValues('presentacionNoConforme') || '0');
    const cajasNoConformes = parseFloat(form.getValues('cajas') || '0');

    // Suma directa de las 5 categorías - NO depende de totalUnidadesRevisadasReal
    const totalUnidadesNoConformes = unidadesFaltantes + etiquetaNoConforme + marcacionNoConforme + presentacionNoConforme + cajasNoConformes;

    form.setValue('unidadesNoConformes', totalUnidadesNoConformes.toString());
    console.log('🔢 Unidades No Conformes calculadas:', {
      unidadesFaltantes,
      etiquetaNoConforme,
      marcacionNoConforme,
      presentacionNoConforme,
      cajasNoConformes,
      total: totalUnidadesNoConformes
    });
  };

  // Función para calcular el porcentaje de incumplimiento (promedio de todos los porcentajes)
  const calcularPorcentajeIncumplimiento = () => {
    const porcentajeFaltantes = parseFloat(form.getValues('porcentajeFaltantes') || '0');
    const porcentajeEtiquetaNoConforme = parseFloat(form.getValues('porcentajeEtiquetaNoConforme') || '0');
    const porcentajeMarcacionNoConforme = parseFloat(form.getValues('porcentajeMarcacionNoConforme') || '0');
    const porcentajePresentacionNoConforme = parseFloat(form.getValues('porcentajePresentacionNoConforme') || '0');
    const porcentajeCajasNoConformes = parseFloat(form.getValues('porcentajeCajasNoConformes') || '0');
    
    // Calcular promedio de los 5 porcentajes
    const totalPorcentajes = porcentajeFaltantes + porcentajeEtiquetaNoConforme + porcentajeMarcacionNoConforme + porcentajePresentacionNoConforme + porcentajeCajasNoConformes;
    const porcentajeIncumplimiento = totalPorcentajes / 5;
    const porcentajeRedondeado = Math.round(porcentajeIncumplimiento * 100) / 100; // 2 decimales
    
    form.setValue('porcentajeIncumplimiento', porcentajeRedondeado.toString());
    
    // Mostrar toast si el porcentaje de incumplimiento es alto (más del 20%)
    if (porcentajeRedondeado > 20) {
      toast({
        title: "Alto porcentaje de incumplimiento general",
        description: `El ${porcentajeRedondeado}% de incumplimiento general es considerablemente alto`,
        variant: "destructive",
      });
    }
  };

  const handleUpdateAsPending = async () => {
    if (!recordToEdit) return;

    if (isSubmitting) {
      return;
    }

    setIsSubmitting(true);

    try {
      const currentValues = form.getValues();
      const pendingValues = withPendingDefaults(currentValues);
      const payload = toSnakeCasePayload(pendingValues);

      await embalajeRecordsService.update(recordToEdit.id, {
        ...payload,
        status: 'pending',
        updated_by: 'user',
      });

      toast({
        title: 'Registro guardado como pendiente',
        description: 'El registro fue actualizado y se mantiene como pendiente.',
      });

      onSuccessfulEdit?.();
      onOpenChange(false);
      form.reset();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudo actualizar el registro como pendiente.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const form = useForm<z.infer<typeof embalajeFormSchema>>({
    resolver: zodResolver(embalajeFormSchema),
    defaultValues: {
      fecha: getFechaActual(),
      mesCorte: getMesActual(),
      producto: productName,
      presentacion: '',
      lote: '',
      tamanoLote: '',
      nivelInspeccion: '',
      cajasRevisadas: '',
      totalUnidadesRevisadas: '',
      totalUnidadesRevisadasReal: '',
      unidadesFaltantes: '',
      porcentajeFaltantes: '',
      etiqueta: '',
      porcentajeEtiquetaNoConforme: '',
      marcacion: '',
      porcentajeMarcacionNoConforme: '',
      presentacionNoConforme: '',
      porcentajePresentacionNoConforme: '',
      cajas: '',
      porcentajeCajasNoConformes: '',
      responsableIdentificadorCajas: '',
      responsableEmbalaje: '',
      responsableCalidad: '',
      unidadesNoConformes: '',
      porcentajeIncumplimiento: '',
      correccion: '',
      limpiezaArea: '',
      responsableLimpieza: '',
      fechaLimpieza: '',
      observacionesLimpieza: '',
      cronogramaImplementacion: '',
      fechaInicioCronograma: '',
      fechaFinCronograma: '',
      responsableCronograma: '',
    },
  });

  // Si estamos en modo edición y tenemos un registro, precargar los datos
  React.useEffect(() => {
    if (editMode && recordToEdit) {
      const toYmd = (raw: unknown): string => {
        if (!raw) return '';
        if (typeof raw === 'string') {
          const dateOnly = raw.slice(0, 10);
          if (/^\d{4}-\d{2}-\d{2}$/.test(dateOnly)) return dateOnly;
          const parsed = new Date(raw);
          return isNaN(parsed.getTime()) ? '' : parsed.toISOString().slice(0, 10);
        }
        if (raw instanceof Date) {
          return raw.toISOString().slice(0, 10);
        }
        return '';
      };

      const fechaFormateada = toYmd(recordToEdit.fecha as unknown);
      const fechaLimpiezaFormateada = toYmd((recordToEdit as any).fecha_limpieza as unknown);
      const fechaInicioCronogramaFormateada = toYmd((recordToEdit as any).fecha_inicio_cronograma as unknown);
      const fechaFinCronogramaFormateada = toYmd((recordToEdit as any).fecha_fin_cronograma as unknown);

      const mappedData = {
        fecha: fechaFormateada,
        mesCorte: recordToEdit.mescorte,
        producto: recordToEdit.producto,
        presentacion: recordToEdit.presentacion,
        lote: recordToEdit.lote,
        tamanoLote: recordToEdit.tamano_lote,
        nivelInspeccion: recordToEdit.nivel_inspeccion,
        cajasRevisadas: recordToEdit.cajas_revisadas,
        totalUnidadesRevisadas: recordToEdit.total_unidades_revisadas,
        totalUnidadesRevisadasReal: recordToEdit.total_unidades_revisadas_real,
        observacionesGenerales: recordToEdit.observaciones_generales || '',
        unidadesFaltantes: recordToEdit.unidades_faltantes,
        porcentajeFaltantes: recordToEdit.porcentaje_faltantes,
        observacionesFaltantes: recordToEdit.observaciones_faltantes || '',
        etiqueta: recordToEdit.etiqueta,
        porcentajeEtiquetaNoConforme: recordToEdit.porcentaje_etiqueta_no_conforme,
        observacionesEtiqueta: recordToEdit.observaciones_etiqueta || '',
        marcacion: recordToEdit.marcacion,
        porcentajeMarcacionNoConforme: recordToEdit.porcentaje_marcacion_no_conforme,
        observacionesMarcacion: recordToEdit.observaciones_marcacion || '',
        presentacionNoConforme: recordToEdit.presentacion_no_conforme,
        porcentajePresentacionNoConforme: recordToEdit.porcentaje_presentacion_no_conforme,
        observacionesPresentacion: recordToEdit.observaciones_presentacion || '',
        cajas: recordToEdit.cajas,
        porcentajeCajasNoConformes: recordToEdit.porcentaje_cajas_no_conformes,
        observacionesCajas: recordToEdit.observaciones_cajas || '',
        responsableIdentificadorCajas: recordToEdit.responsable_identificador_cajas,
        responsableEmbalaje: recordToEdit.responsable_embalaje,
        responsableCalidad: recordToEdit.responsable_calidad,
        unidadesNoConformes: recordToEdit.unidades_no_conformes,
        porcentajeIncumplimiento: recordToEdit.porcentaje_incumplimiento,
        correccion: recordToEdit.correccion || '',
        limpiezaArea: (recordToEdit as any).limpieza_area || '',
        responsableLimpieza: (recordToEdit as any).responsable_limpieza || '',
        fechaLimpieza: fechaLimpiezaFormateada,
        observacionesLimpieza: (recordToEdit as any).observaciones_limpieza || '',
        cronogramaImplementacion: (recordToEdit as any).cronograma_implementacion || '',
        fechaInicioCronograma: fechaInicioCronogramaFormateada,
        fechaFinCronograma: fechaFinCronogramaFormateada,
        responsableCronograma: (recordToEdit as any).responsable_cronograma || '',
      };
      form.reset(mappedData);

      const hasText = (v: unknown) => String(v ?? '').trim().length > 0;
      setObservacionesVisible({
        observacionesGenerales: hasText(mappedData.observacionesGenerales),
        observacionesFaltantes: hasText(mappedData.observacionesFaltantes),
        observacionesEtiqueta: hasText(mappedData.observacionesEtiqueta),
        observacionesMarcacion: hasText(mappedData.observacionesMarcacion),
        observacionesPresentacion: hasText(mappedData.observacionesPresentacion),
        observacionesCajas: hasText(mappedData.observacionesCajas),
      });

      const parseList = (value?: string | null) => {
        const raw = String(value || '').trim();
        const parts = raw
          ? raw
              .split(',')
              .map((p) => p.trim())
              .filter(Boolean)
          : [];
        return parts.length > 0 ? parts : [''];
      };
      setResponsablesIdentificadorCajas(parseList(recordToEdit.responsable_identificador_cajas));
      setResponsablesEmbalaje(parseList(recordToEdit.responsable_embalaje));
    } else if (prefilledData) {
      // Si tenemos datos precargados para nuevo registro
      form.reset({
        ...form.getValues(),
        ...prefilledData,
        producto: productId,
      });

      const parseList = (value?: string | null) => {
        const raw = String(value || '').trim();
        const parts = raw
          ? raw
              .split(',')
              .map((p) => p.trim())
              .filter(Boolean)
          : [];
        return parts.length > 0 ? parts : [''];
      };
      setResponsablesIdentificadorCajas(parseList(form.getValues('responsableIdentificadorCajas')));
      setResponsablesEmbalaje(parseList(form.getValues('responsableEmbalaje')));
    }
  }, [editMode, recordToEdit, prefilledData, productName, form]);

  React.useEffect(() => {
    if (!isOpen) return;
    if (editMode) return;

    const parseList = (value?: string | null) => {
      const raw = String(value || '').trim();
      const parts = raw
        ? raw
            .split(',')
            .map((p) => p.trim())
            .filter(Boolean)
        : [];
      return parts.length > 0 ? parts : [''];
    };

    setResponsablesIdentificadorCajas(parseList(form.getValues('responsableIdentificadorCajas')));
    setResponsablesEmbalaje(parseList(form.getValues('responsableEmbalaje')));
  }, [isOpen, editMode, form]);

  const [selectedDate, setSelectedDate] = React.useState<Date>(new Date());

  const parseLocalDateFromYMD = (value: string): Date => {
    const dateOnly = value.slice(0, 10);
    const [y, m, d] = dateOnly.split('-').map(Number);
    return new Date(y, m - 1, d);
  };

  React.useEffect(() => {
    if (!isOpen) return;
    if (editMode) return;

    form.setValue('producto', productId);
    
    // Autocompletar presentación con el peso neto del producto
    const autocompletePresentacion = async () => {
      try {
        const presentacionAntes = String(form.getValues('presentacion') || '').trim();
        if (presentacionAntes) return;

        const pesosConfig = await ProductoPesosService.buscarPesoExhaustivo(productId, categoryId);

        const pesoNetoDeclarado = pesosConfig?.peso_neto_declarado;
        const hasPesoNeto =
          pesoNetoDeclarado !== undefined &&
          pesoNetoDeclarado !== null &&
          String(pesoNetoDeclarado).trim() !== '' &&
          !Number.isNaN(Number(pesoNetoDeclarado));

        if (!hasPesoNeto) return;

        const pesoNeto = String(pesoNetoDeclarado);
        form.setValue('presentacion', pesoNeto);

        toast({
          title: 'Presentación autocompletada',
          description: `Se ha autocompletado la presentación con el peso neto: ${pesoNeto}g`,
          variant: 'default',
        });
      } catch (error) {
        toast({
          title: "Error al autocompletar",
          description: "No se pudo obtener el peso neto del producto",
          variant: "destructive",
        });
      }
    };
    
    // Ejecutar autocompletado
    autocompletePresentacion();
    
    // Actualizar mes de corte con el mes actual (solo si no hay datos precargados)
    if (!prefilledData?.mesCorte) {
      form.setValue('mesCorte', getMesActual());
    }
  }, [isOpen, editMode, prefilledData?.mesCorte, form, productId, productName, categoryId, toast]);

  // Cleanup del timeout cuando el modal se cierra
  React.useEffect(() => {
    if (!isOpen) {
      if (inspeccionTimeout) {
        clearTimeout(inspeccionTimeout);
        setInspeccionTimeout(null);
      }
      if (porcentajeTimeout) {
        clearTimeout(porcentajeTimeout);
        setPorcentajeTimeout(null);
      }
      if (etiquetaTimeout) {
        clearTimeout(etiquetaTimeout);
        setEtiquetaTimeout(null);
      }
      if (marcacionTimeout) {
        clearTimeout(marcacionTimeout);
        setMarcacionTimeout(null);
      }
      if (presentacionTimeout) {
        clearTimeout(presentacionTimeout);
        setPresentacionTimeout(null);
      }
      if (cajasTimeout) {
        clearTimeout(cajasTimeout);
        setCajasTimeout(null);
      }
    }
  }, [isOpen, porcentajeTimeout, etiquetaTimeout, marcacionTimeout, presentacionTimeout, cajasTimeout]);

  const withPendingDefaults = (values: z.infer<typeof embalajeFormSchema>) => {
    const isEmpty = (v: unknown) => {
      if (v === undefined || v === null) return true;
      if (typeof v === 'string') return v.trim() === '';
      return false;
    };

    const pickText = (current: string, fallback: string) => (isEmpty(current) ? fallback : current);
    const pickNumberText = (current: string, fallback = '0') => (isEmpty(current) ? fallback : current);

    return {
      ...values,
      presentacion: pickText(values.presentacion, 'Pendiente'),
      tamanoLote: pickText(values.tamanoLote, 'Pendiente'),
      nivelInspeccion: pickText(values.nivelInspeccion, 'Pendiente'),
      etiqueta: pickText(values.etiqueta, 'Pendiente'),
      marcacion: pickText(values.marcacion, 'Pendiente'),
      presentacionNoConforme: pickText(values.presentacionNoConforme, 'Pendiente'),
      cajas: pickText(values.cajas, 'Pendiente'),
      responsableIdentificadorCajas: pickText(values.responsableIdentificadorCajas, 'Pendiente'),
      responsableEmbalaje: pickText(values.responsableEmbalaje, 'Pendiente'),
      responsableCalidad: pickText(values.responsableCalidad, 'Pendiente'),
      cajasRevisadas: pickNumberText(values.cajasRevisadas),
      totalUnidadesRevisadas: pickNumberText(values.totalUnidadesRevisadas),
      totalUnidadesRevisadasReal: pickNumberText(values.totalUnidadesRevisadasReal),
      unidadesFaltantes: pickNumberText(values.unidadesFaltantes),
      porcentajeFaltantes: pickNumberText(values.porcentajeFaltantes),
      porcentajeEtiquetaNoConforme: pickNumberText(values.porcentajeEtiquetaNoConforme),
      porcentajeMarcacionNoConforme: pickNumberText(values.porcentajeMarcacionNoConforme),
      porcentajePresentacionNoConforme: pickNumberText(values.porcentajePresentacionNoConforme),
      porcentajeCajasNoConformes: pickNumberText(values.porcentajeCajasNoConformes),
      unidadesNoConformes: pickNumberText(values.unidadesNoConformes),
      porcentajeIncumplimiento: pickNumberText(values.porcentajeIncumplimiento),
    };
  };

  const toSnakeCasePayload = (values: z.infer<typeof embalajeFormSchema>) => {
    return {
      fecha: values.fecha,
      mescorte: values.mesCorte,
      producto: values.producto,
      presentacion: values.presentacion,
      lote: values.lote,
      tamano_lote: values.tamanoLote,
      nivel_inspeccion: values.nivelInspeccion,
      cajas_revisadas: values.cajasRevisadas,
      total_unidades_revisadas: values.totalUnidadesRevisadas,
      total_unidades_revisadas_real: values.totalUnidadesRevisadasReal,
      observaciones_generales: values.observacionesGenerales,
      unidades_faltantes: values.unidadesFaltantes,
      porcentaje_faltantes: values.porcentajeFaltantes,
      observaciones_faltantes: values.observacionesFaltantes,
      etiqueta: values.etiqueta,
      porcentaje_etiqueta_no_conforme: values.porcentajeEtiquetaNoConforme,
      observaciones_etiqueta: values.observacionesEtiqueta,
      marcacion: values.marcacion,
      porcentaje_marcacion_no_conforme: values.porcentajeMarcacionNoConforme,
      observaciones_marcacion: values.observacionesMarcacion,
      presentacion_no_conforme: values.presentacionNoConforme,
      porcentaje_presentacion_no_conforme: values.porcentajePresentacionNoConforme,
      observaciones_presentacion: values.observacionesPresentacion,
      cajas: values.cajas,
      porcentaje_cajas_no_conformes: values.porcentajeCajasNoConformes,
      observaciones_cajas: values.observacionesCajas,
      correccion: values.correccion,
      responsable_identificador_cajas: values.responsableIdentificadorCajas,
      responsable_embalaje: values.responsableEmbalaje,
      responsable_calidad: values.responsableCalidad,
      unidades_no_conformes: values.unidadesNoConformes,
      porcentaje_incumplimiento: values.porcentajeIncumplimiento,
      limpieza_area: values.limpiezaArea,
      responsable_limpieza: values.responsableLimpieza,
      fecha_limpieza: values.fechaLimpieza,
      observaciones_limpieza: values.observacionesLimpieza,
      cronograma_implementacion: values.cronogramaImplementacion,
      fecha_inicio_cronograma: values.fechaInicioCronograma,
      fecha_fin_cronograma: values.fechaFinCronograma,
      responsable_cronograma: values.responsableCronograma,
    };
  };

  const handleSubmitAsPending = () => {
    if (isSubmitting) {
      return;
    }

    setIsSubmitting(true);

    try {
      const currentValues = form.getValues();
      const pendingValues = withPendingDefaults(currentValues);
      const payload = toSnakeCasePayload(pendingValues);

      if (onSuccessfulSubmit) {
        onSuccessfulSubmit({
          ...payload,
          status: 'pending',
        });
      }

      toast({
        title: 'Registro guardado como pendiente',
        description: 'El registro fue enviado como pendiente.',
      });

      onOpenChange(false);
      form.reset();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudo guardar el registro como pendiente.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  async function onSubmit(values: z.infer<typeof embalajeFormSchema>) {
    if (isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    
    try {
      const transformedValues = toSnakeCasePayload(values);
      
      if (editMode && recordToEdit) {
        // Modo edición: actualizar registro existente
        // Agregar campos adicionales para edición
        const updateData = {
          ...transformedValues,
          status: 'completed',
          updated_by: 'user',
        };
        
        await embalajeRecordsService.update(recordToEdit.id, updateData);
        
        toast({
          title: "Registro actualizado",
          description: "El registro de embalaje ha sido actualizado exitosamente.",
        });
        
        onSuccessfulEdit?.();
      } else {
        // Modo creación: nuevo registro
        if (onSuccessfulSubmit) {
          onSuccessfulSubmit({
            ...transformedValues,
            status: 'completed',
          });
        }
      }
      
      onOpenChange(false);
      form.reset();
    } catch (error) {
      toast({
        title: "Error",
        description: editMode 
          ? "No se pudo actualizar el registro de embalaje."
          : "No se pudo crear el registro de embalaje.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>
            <span>
              RE-CAL-093 CONSOLIDADO CALIDAD DE PRODUCTO TERMINADO-EMBALAJE
            </span>
          </DialogTitle>
          <DialogDescription className="text-sm">
            <div className="space-y-1">
              <div><strong>Formato:</strong> RE-CAL-093</div>
              <div><strong>Tipo:</strong> CONSOLIDADO CALIDAD DE PRODUCTO TERMINADO-EMBALAJE</div>
              <div><strong>Versión:</strong> 6</div>
              <div><strong>Fecha Aprobación:</strong> 21 DE MARZO DE 2023</div>
              <div className="pt-2 text-gray-600">
                {editMode
                  ? 'Complete la información del registro pendiente. Los campos marcados como "Pendiente" deben ser completados.'
                  : 'Complete todos los campos del formulario para crear un nuevo registro.'}
              </div>
            </div>
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <ScrollArea className="h-[60vh] p-4">
              <Accordion
                type="single"
                collapsible
                className="w-full"
                defaultValue="info-general"
              >
                <AccordionItem value="info-general">
                  <AccordionTrigger>Información General</AccordionTrigger>
                  <AccordionContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <FormField control={form.control} name="fecha" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Fecha</FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant="outline"
                                  className={cn(
                                    "w-full justify-start text-left font-normal",
                                    !field.value && "text-muted-foreground"
                                  )}
                                >
                                  {field.value ? (
                                    format(parseLocalDateFromYMD(String(field.value)), "dd 'de' MMMM 'de' yyyy", { locale: es })
                                  ) : (
                                    <span>Seleccionar fecha</span>
                                  )}
                                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <div className="p-3 bg-white rounded-lg shadow-lg border">
                                <div className="text-sm font-medium text-gray-900 mb-2">
                                  {format(new Date(), "MMMM yyyy", { locale: es })}
                                </div>
                                <Calendar
                                  mode="single"
                                  selected={field.value ? parseLocalDateFromYMD(String(field.value)) : undefined}
                                  onSelect={(date) => {
                                    if (date) {
                                      const formattedDate = format(date, 'yyyy-MM-dd');
                                      field.onChange(formattedDate);
                                      setSelectedDate(date);
                                    }
                                  }}
                                  disabled={(date) =>
                                    date > new Date() || date < new Date("1900-01-01")
                                  }
                                  initialFocus
                                  locale={es}
                                  className="rounded-md border-0"
                                  classNames={{
                                    months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
                                    month: "space-y-4",
                                    caption: "flex justify-center pt-1 relative items-center",
                                    caption_label: "text-sm font-medium",
                                    nav: "space-x-1 flex items-center",
                                    nav_button: cn(
                                      "inline-flex items-center justify-center rounded-md p-1",
                                      "h-7 w-7",
                                      "opacity-50 hover:opacity-75"
                                    ),
                                    table: "w-full border-collapse space-y-1",
                                    head_row: "flex",
                                    head_cell: cn(
                                      "text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]",
                                      "h-8 w-9"
                                    ),
                                    row: "flex w-full mt-2",
                                    cell: cn(
                                      "relative h-9 w-9 p-0 text-center text-sm",
                                      "focus-within:relative focus-within:z-20"
                                    ),
                                    day: cn(
                                      "h-9 w-9 p-0 font-normal text-sm",
                                      "hover:bg-accent hover:text-accent-foreground",
                                      "selected:bg-primary selected:text-primary-foreground",
                                      "today:bg-accent today:text-accent-foreground"
                                    ),
                                    day_range_end: "day-range-end",
                                    day_range_middle: "day-range-middle",
                                    day_selected: "day-selected",
                                    day_today: "day-today",
                                  }}
                                  components={{
                                    Day: ({ date, ...props }) => {
                                      return (
                                        <div
                                          {...props}
                                          className={cn(
                                            "flex h-9 w-9 items-center justify-center rounded-lg p-0 text-sm",
                                            props.className
                                          )}
                                        >
                                          {format(date, "d")}
                                        </div>
                                      );
                                    },
                                  }}
                                />
                              </div>
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField control={form.control} name="mesCorte" render={({ field }) => (
                          <FormItem>
                            <FormLabel>Mes de Corte</FormLabel>
                            <FormControl>
                              <Input 
                                {...field} 
                                placeholder="Autocompletado con el mes actual"
                                className="bg-muted/50"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                      )} />
                      <FormField control={form.control} name="producto" render={({ field }) => (
                          <FormItem>
                            <FormLabel>Producto</FormLabel>
                            <FormControl>
                              <>
                                <Input {...field} type="hidden" />
                                <Input value={productName} readOnly />
                              </>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                      )} />
                      <FormField control={form.control} name="presentacion" render={({ field }) => (
                          <FormItem>
                            <FormLabel>Presentacion (g ó ml)</FormLabel>
                            <FormControl>
                              <Input 
                                {...field} 
                                placeholder="Se autocompleta con el peso neto del producto (puede editar)"
                                className="bg-muted/30"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                      )} />
                      <FormField control={form.control} name="lote" render={({ field }) => {
                          const isAutoGenerated = editMode && recordToEdit?.created_by === 'system_auto';
                          return (
                            <FormItem>
                              <FormLabel>Lote</FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  readOnly={isAutoGenerated}
                                  className={cn(isAutoGenerated ? 'bg-muted/50 cursor-not-allowed' : undefined)}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          );
                      }} />
                       <FormField control={form.control} name="tamanoLote" render={({ field }) => (
                          <FormItem>
                            <FormLabel>Tamaño del Lote (Cajas)</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                onChange={(e) => {
                                  field.onChange(e);
                                  handleTamanoLoteChange(e.target.value);
                                }}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                      )} />
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="inspeccion">
                  <AccordionTrigger>Inspección y Revisión</AccordionTrigger>
                  <AccordionContent className="space-y-4">
                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <FormField control={form.control} name="nivelInspeccion" render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nivel de Inspección</FormLabel>
                            <FormControl>
                              <Input 
                                {...field} 
                                placeholder=""
                                onChange={(e) => {
                                  field.onChange(e);
                                  handleNivelInspeccionChange(e.target.value);
                                }}
                                className="uppercase"
                                maxLength={1}
                              />
                            </FormControl>
                            <FormMessage />
                            <div className="text-xs text-muted-foreground mt-1">
                             
                            </div>
                          </FormItem>
                        )} />
                        <FormField control={form.control} name="cajasRevisadas" render={({ field }) => (
                          <FormItem>
                            <FormLabel># de Cajas Revisadas</FormLabel>
                            <FormControl>
                              <Input 
                                {...field} 
                                placeholder=""
                                type="number"
                                className="bg-muted/30"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                        <FormField control={form.control} name="totalUnidadesRevisadas" render={({ field }) => (
                          <FormItem><FormLabel>Total Unidades Revisadas</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                         <FormField control={form.control} name="totalUnidadesRevisadasReal" render={({ field }) => (
                          <FormItem>
                            <FormLabel>Total Unidades Revisadas Real</FormLabel>
                            <FormControl>
                              <Input 
                                {...field} 
                                type="number"
                                onChange={(e) => {
                                  field.onChange(e);
                                  handleCalculoPorcentaje();
                                }}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                     </div>
                     <FormField control={form.control} name="observacionesGenerales" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Observaciones</FormLabel>
                          <RadioGroup
                            value={observacionesVisible.observacionesGenerales ? 'si' : 'no'}
                            onValueChange={(v) => {
                              const nextVisible = v === 'si';
                              setObservacionesVisible(prev => ({ ...prev, observacionesGenerales: nextVisible }));
                              if (!nextVisible) form.setValue('observacionesGenerales', '');
                            }}
                            className="flex gap-6"
                          >
                            <div className="flex items-center gap-2">
                              <RadioGroupItem value="no" id="obs-generales-no" />
                              <label htmlFor="obs-generales-no" className="text-sm">No</label>
                            </div>
                            <div className="flex items-center gap-2">
                              <RadioGroupItem value="si" id="obs-generales-si" />
                              <label htmlFor="obs-generales-si" className="text-sm">Sí</label>
                            </div>
                          </RadioGroup>
                          {observacionesVisible.observacionesGenerales ? (
                            <FormControl>
                              <Textarea {...field} />
                            </FormControl>
                          ) : null}
                          <FormMessage />
                        </FormItem>
                      )} />
                  </AccordionContent>
                </AccordionItem>

                 <AccordionItem value="faltantes">
                  <AccordionTrigger>Unidades Faltantes</AccordionTrigger>
                  <AccordionContent className="space-y-4">
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField control={form.control} name="unidadesFaltantes" render={({ field }) => (
                            <FormItem>
                              <FormLabel># Unidades Faltantes</FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  type="number"
                                  onChange={(e) => {
                                    field.onChange(e);
                                    // Calcular unidades no conformes INMEDIATAMENTE (sin debounce)
                                    calcularUnidadesNoConformes();
                                    // Calcular porcentajes con debounce
                                    handleCalculoPorcentaje();
                                  }}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                        )} />
                        <FormField control={form.control} name="porcentajeFaltantes" render={({ field }) => (
                            <FormItem>
                              <FormLabel>% Faltantes</FormLabel>
                              <FormControl>
                                <Input 
                                  {...field} 
                                  type="number"
                                  step="0.01"
                                  readOnly
                                  placeholder="Se calcula automáticamente"
                                  className="bg-muted/50 cursor-not-allowed"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                        )} />
                     </div>
                     <FormField control={form.control} name="observacionesFaltantes" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Observaciones</FormLabel>
                          <RadioGroup
                            value={observacionesVisible.observacionesFaltantes ? 'si' : 'no'}
                            onValueChange={(v) => {
                              const nextVisible = v === 'si';
                              setObservacionesVisible(prev => ({ ...prev, observacionesFaltantes: nextVisible }));
                              if (!nextVisible) form.setValue('observacionesFaltantes', '');
                            }}
                            className="flex gap-6"
                          >
                            <div className="flex items-center gap-2">
                              <RadioGroupItem value="no" id="obs-faltantes-no" />
                              <label htmlFor="obs-faltantes-no" className="text-sm">No</label>
                            </div>
                            <div className="flex items-center gap-2">
                              <RadioGroupItem value="si" id="obs-faltantes-si" />
                              <label htmlFor="obs-faltantes-si" className="text-sm">Sí</label>
                            </div>
                          </RadioGroup>
                          {observacionesVisible.observacionesFaltantes ? (
                            <FormControl>
                              <Textarea {...field} />
                            </FormControl>
                          ) : null}
                          <FormMessage />
                        </FormItem>
                      )} />
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="verificacion-atributos">
                  <AccordionTrigger>Verificación de Atributos</AccordionTrigger>
                  <AccordionContent className="space-y-4">
                    <div className="space-y-4 border-l-2 border-border pl-4 ml-2">
                        <h4 className='font-medium'></h4>
                        <FormField control={form.control} name="etiqueta" render={({ field }) => (
                            <FormItem>
                              <FormLabel>Etiqueta</FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  type="number"
                                  onChange={(e) => {
                                    field.onChange(e);
                                    // Calcular unidades no conformes INMEDIATAMENTE (sin debounce)
                                    calcularUnidadesNoConformes();
                                    // Calcular porcentajes con debounce
                                    handleCalculoPorcentajeEtiqueta();
                                  }}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                        )} />
                        <FormField control={form.control} name="porcentajeEtiquetaNoConforme" render={({ field }) => (
                            <FormItem>
                              <FormLabel>% Etiqueta No Conforme</FormLabel>
                              <FormControl>
                                <Input 
                                  {...field} 
                                  type="number"
                                  step="0.01"
                                  readOnly
                                  placeholder="Se calcula automáticamente"
                                  className="bg-muted/50 cursor-not-allowed"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                        )} />
                        <FormField control={form.control} name="observacionesEtiqueta" render={({ field }) => (
                            <FormItem>
                              <FormLabel>Observaciones</FormLabel>
                              <RadioGroup
                                value={observacionesVisible.observacionesEtiqueta ? 'si' : 'no'}
                                onValueChange={(v) => {
                                  const nextVisible = v === 'si';
                                  setObservacionesVisible(prev => ({ ...prev, observacionesEtiqueta: nextVisible }));
                                  if (!nextVisible) form.setValue('observacionesEtiqueta', '');
                                }}
                                className="flex gap-6"
                              >
                                <div className="flex items-center gap-2">
                                  <RadioGroupItem value="no" id="obs-etiqueta-no" />
                                  <label htmlFor="obs-etiqueta-no" className="text-sm">No</label>
                                </div>
                                <div className="flex items-center gap-2">
                                  <RadioGroupItem value="si" id="obs-etiqueta-si" />
                                  <label htmlFor="obs-etiqueta-si" className="text-sm">Sí</label>
                                </div>
                              </RadioGroup>
                              {observacionesVisible.observacionesEtiqueta ? (
                                <FormControl>
                                  <Textarea {...field} />
                                </FormControl>
                              ) : null}
                              <FormMessage />
                            </FormItem>
                        )} />
                    </div>
                     <div className="space-y-4 border-l-2 border-border pl-4 ml-2 mt-4">
                        <h4 className='font-medium'></h4>
                        <FormField control={form.control} name="marcacion" render={({ field }) => (
                            <FormItem>
                              <FormLabel>Marcación</FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  type="number"
                                  onChange={(e) => {
                                    field.onChange(e);
                                    // Calcular unidades no conformes INMEDIATAMENTE (sin debounce)
                                    calcularUnidadesNoConformes();
                                    // Calcular porcentajes con debounce
                                    handleCalculoPorcentajeMarcacion();
                                  }}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                        )} />
                        <FormField control={form.control} name="porcentajeMarcacionNoConforme" render={({ field }) => (
                            <FormItem>
                              <FormLabel>% Marcación No Conforme</FormLabel>
                              <FormControl>
                                <Input 
                                  {...field} 
                                  type="number"
                                  step="0.01"
                                  readOnly
                                  placeholder="Se calcula automáticamente"
                                  className="bg-muted/50 cursor-not-allowed"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                        )} />
                        <FormField control={form.control} name="observacionesMarcacion" render={({ field }) => (
                            <FormItem>
                              <FormLabel>Observaciones</FormLabel>
                              <RadioGroup
                                value={observacionesVisible.observacionesMarcacion ? 'si' : 'no'}
                                onValueChange={(v) => {
                                  const nextVisible = v === 'si';
                                  setObservacionesVisible(prev => ({ ...prev, observacionesMarcacion: nextVisible }));
                                  if (!nextVisible) form.setValue('observacionesMarcacion', '');
                                }}
                                className="flex gap-6"
                              >
                                <div className="flex items-center gap-2">
                                  <RadioGroupItem value="no" id="obs-marcacion-no" />
                                  <label htmlFor="obs-marcacion-no" className="text-sm">No</label>
                                </div>
                                <div className="flex items-center gap-2">
                                  <RadioGroupItem value="si" id="obs-marcacion-si" />
                                  <label htmlFor="obs-marcacion-si" className="text-sm">Sí</label>
                                </div>
                              </RadioGroup>
                              {observacionesVisible.observacionesMarcacion ? (
                                <FormControl>
                                  <Textarea {...field} />
                                </FormControl>
                              ) : null}
                              <FormMessage />
                            </FormItem>
                        )} />
                    </div>
                     <div className="space-y-4 border-l-2 border-border pl-4 ml-2 mt-4">
                        <h4 className='font-medium'>Presentación</h4>
                        <FormField control={form.control} name="presentacionNoConforme" render={({ field }) => (
                            <FormItem>
                              <FormLabel>Presentación producto</FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  type="number"
                                  onChange={(e) => {
                                    field.onChange(e);
                                    // Calcular unidades no conformes INMEDIATAMENTE (sin debounce)
                                    calcularUnidadesNoConformes();
                                    // Calcular porcentajes con debounce
                                    handleCalculoPorcentajePresentacion();
                                  }}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                        )} />
                        <FormField control={form.control} name="porcentajePresentacionNoConforme" render={({ field }) => (
                            <FormItem>
                              <FormLabel>% Presentación No Conforme</FormLabel>
                              <FormControl>
                                <Input 
                                  {...field} 
                                  type="number"
                                  step="0.01"
                                  readOnly
                                  placeholder="Se calcula automáticamente"
                                  className="bg-muted/50 cursor-not-allowed"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                        )} />
                        <FormField control={form.control} name="observacionesPresentacion" render={({ field }) => (
                            <FormItem>
                              <FormLabel>Observaciones</FormLabel>
                              <RadioGroup
                                value={observacionesVisible.observacionesPresentacion ? 'si' : 'no'}
                                onValueChange={(v) => {
                                  const nextVisible = v === 'si';
                                  setObservacionesVisible(prev => ({ ...prev, observacionesPresentacion: nextVisible }));
                                  if (!nextVisible) form.setValue('observacionesPresentacion', '');
                                }}
                                className="flex gap-6"
                              >
                                <div className="flex items-center gap-2">
                                  <RadioGroupItem value="no" id="obs-presentacion-no" />
                                  <label htmlFor="obs-presentacion-no" className="text-sm">No</label>
                                </div>
                                <div className="flex items-center gap-2">
                                  <RadioGroupItem value="si" id="obs-presentacion-si" />
                                  <label htmlFor="obs-presentacion-si" className="text-sm">Sí</label>
                                </div>
                              </RadioGroup>
                              {observacionesVisible.observacionesPresentacion ? (
                                <FormControl>
                                  <Textarea {...field} />
                                </FormControl>
                              ) : null}
                              <FormMessage />
                            </FormItem>
                        )} />
                    </div>
                     <div className="space-y-4 border-l-2 border-border pl-4 ml-2 mt-4">
                        <h4 className='font-medium'></h4>
                        <FormField control={form.control} name="cajas" render={({ field }) => (
                            <FormItem>
                              <FormLabel>Cajas (sticker, particiones, caja)</FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  type="number"
                                  onChange={(e) => {
                                    field.onChange(e);
                                    // Calcular unidades no conformes INMEDIATAMENTE (sin debounce)
                                    calcularUnidadesNoConformes();
                                    // Calcular porcentajes con debounce
                                    handleCalculoPorcentajeCajas();
                                  }}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                        )} />
                        <FormField control={form.control} name="porcentajeCajasNoConformes" render={({ field }) => (
                            <FormItem>
                              <FormLabel>% Cajas No Conformes</FormLabel>
                              <FormControl>
                                <Input 
                                  {...field} 
                                  type="number"
                                  step="0.01"
                                  readOnly
                                  placeholder="Se calcula automáticamente"
                                  className="bg-muted/50 cursor-not-allowed"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                        )} />
                        <FormField control={form.control} name="observacionesCajas" render={({ field }) => (
                            <FormItem>
                              <FormLabel>Observaciones</FormLabel>
                              <RadioGroup
                                value={observacionesVisible.observacionesCajas ? 'si' : 'no'}
                                onValueChange={(v) => {
                                  const nextVisible = v === 'si';
                                  setObservacionesVisible(prev => ({ ...prev, observacionesCajas: nextVisible }));
                                  if (!nextVisible) form.setValue('observacionesCajas', '');
                                }}
                                className="flex gap-6"
                              >
                                <div className="flex items-center gap-2">
                                  <RadioGroupItem value="no" id="obs-cajas-no" />
                                  <label htmlFor="obs-cajas-no" className="text-sm">No</label>
                                </div>
                                <div className="flex items-center gap-2">
                                  <RadioGroupItem value="si" id="obs-cajas-si" />
                                  <label htmlFor="obs-cajas-si" className="text-sm">Sí</label>
                                </div>
                              </RadioGroup>
                              {observacionesVisible.observacionesCajas ? (
                                <FormControl>
                                  <Textarea {...field} />
                                </FormControl>
                              ) : null}
                              <FormMessage />
                            </FormItem>
                        )} />
                    </div>
                  </AccordionContent>
                </AccordionItem>
                
                 <AccordionItem value="responsables-acciones">
                  <AccordionTrigger>Responsables y Acciones</AccordionTrigger>
                  <AccordionContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <FormField
                          control={form.control}
                          name="responsableIdentificadorCajas"
                          render={({ field }) => (
                            <FormItem>
                              <div className="flex items-center justify-between gap-2">
                                <FormLabel>Responsable Identificador Cajas</FormLabel>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    const next = [...responsablesIdentificadorCajas, ''];
                                    setResponsablesIdentificadorCajas(next);
                                  }}
                                >
                                  <Plus className="h-4 w-4" />
                                </Button>
                              </div>
                              <div className="space-y-2">
                                {responsablesIdentificadorCajas.map((value, idx) => (
                                  <div key={idx} className="flex items-center gap-2">
                                    <FormControl>
                                      <Input
                                        value={value}
                                        onChange={(e) => {
                                          const next = [...responsablesIdentificadorCajas];
                                          next[idx] = e.target.value;
                                          setResponsablesIdentificadorCajas(next);

                                          const joined = next
                                            .map((v) => String(v || '').trim())
                                            .filter(Boolean)
                                            .join(', ');
                                          field.onChange(joined);
                                        }}
                                      />
                                    </FormControl>
                                    {responsablesIdentificadorCajas.length > 1 && idx > 0 ? (
                                      <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => {
                                          const next = responsablesIdentificadorCajas.filter((_, i) => i !== idx);
                                          const safe = next.length > 0 ? next : [''];
                                          setResponsablesIdentificadorCajas(safe);

                                          const joined = safe
                                            .map((v) => String(v || '').trim())
                                            .filter(Boolean)
                                            .join(', ');
                                          field.onChange(joined);
                                        }}
                                      >
                                        <X className="h-4 w-4" />
                                      </Button>
                                    ) : null}
                                  </div>
                                ))}
                              </div>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="responsableEmbalaje"
                          render={({ field }) => (
                            <FormItem>
                              <div className="flex items-center justify-between gap-2">
                                <FormLabel>Responsable Embalaje</FormLabel>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    const next = [...responsablesEmbalaje, ''];
                                    setResponsablesEmbalaje(next);
                                  }}
                                >
                                  <Plus className="h-4 w-4" />
                                </Button>
                              </div>
                              <div className="space-y-2">
                                {responsablesEmbalaje.map((value, idx) => (
                                  <div key={idx} className="flex items-center gap-2">
                                    <FormControl>
                                      <Input
                                        value={value}
                                        onChange={(e) => {
                                          const next = [...responsablesEmbalaje];
                                          next[idx] = e.target.value;
                                          setResponsablesEmbalaje(next);

                                          const joined = next
                                            .map((v) => String(v || '').trim())
                                            .filter(Boolean)
                                            .join(', ');
                                          field.onChange(joined);
                                        }}
                                      />
                                    </FormControl>
                                    {responsablesEmbalaje.length > 1 && idx > 0 ? (
                                      <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => {
                                          const next = responsablesEmbalaje.filter((_, i) => i !== idx);
                                          const safe = next.length > 0 ? next : [''];
                                          setResponsablesEmbalaje(safe);

                                          const joined = safe
                                            .map((v) => String(v || '').trim())
                                            .filter(Boolean)
                                            .join(', ');
                                          field.onChange(joined);
                                        }}
                                      >
                                        <X className="h-4 w-4" />
                                      </Button>
                                    ) : null}
                                  </div>
                                ))}
                              </div>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField control={form.control} name="responsableCalidad" render={({ field }) => (
                            <FormItem><FormLabel>Responsable Calidad</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                      </div>

                      <FormField
                        control={form.control}
                        name="correccion"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Corrección</FormLabel>
                            <FormControl>
                              <Textarea {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                  </AccordionContent>
                </AccordionItem>

                 <AccordionItem value="resumen-no-conformidad">
                  <AccordionTrigger>Resumen de No Conformidad</AccordionTrigger>
                  <AccordionContent className="space-y-4">
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField control={form.control} name="unidadesNoConformes" render={({ field }) => (
                            <FormItem>
                              <FormLabel># de Unidades No Conformes</FormLabel>
                              <FormControl>
                                <Input 
                                  {...field} 
                                  type="number"
                                  readOnly
                                  placeholder="Se calcula automáticamente"
                                  className="bg-muted/50 cursor-not-allowed"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                        )} />
                        <FormField control={form.control} name="porcentajeIncumplimiento" render={({ field }) => (
                            <FormItem>
                              <FormLabel>% de Incumplimiento</FormLabel>
                              <FormControl>
                                <Input 
                                  {...field} 
                                  type="number"
                                  step="0.01"
                                  readOnly
                                  placeholder="Se calcula automáticamente"
                                  className="bg-muted/50 cursor-not-allowed"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                        )} />
                     </div>
                  </AccordionContent>
                </AccordionItem>

            

              </Accordion>
            </ScrollArea>
            <DialogFooter className="pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
              {editMode && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleUpdateAsPending}
                  disabled={isSubmitting}
                  className="border-yellow-600 text-yellow-700 hover:bg-yellow-50"
                >
                  Guardar como Pendiente
                </Button>
              )}
              {!editMode && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleSubmitAsPending}
                  disabled={isSubmitting}
                  className="border-yellow-600 text-yellow-700 hover:bg-yellow-50"
                >
                  Guardar como Pendiente
                </Button>
              )}
              <Button 
                type="submit" 
                disabled={isSubmitting}
                className={editMode ? "bg-green-600 hover:bg-green-700" : ""}
              >
                {isSubmitting 
                  ? (editMode ? 'Actualizando...' : 'Guardando...')
                  : (editMode ? ' Guardar Cambios' : 'Guardar Registro')
                }
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
